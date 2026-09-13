# D1D-A1 Azure Local Deployment Preparation

Last updated: 2026-09-13

## Scope

D1D-A1 prepares DARKROOM SYSTEM for a later Azure Container Apps staging deployment.

No Azure resource groups, Container Apps, PostgreSQL servers, storage accounts, container registries, managed identities, secrets, OAuth callbacks, CI/CD deployment workflows, commits, pushes, or deployments are created by this milestone.

Large 2 GB video upload support remains deferred and must not drive the initial Azure staging deployment.

## Selected Staging Shape

```text
Azure Container Apps Consumption
  darkroom-stg-web  -> React 19 / TanStack Start / Nitro node-server
  darkroom-stg-api  -> ASP.NET Core .NET 10 API

Azure Database for PostgreSQL Flexible Server
  Burstable B1ms, 32 GB storage, 7-day backup retention

Azure Blob Storage
  ASP.NET Core Data Protection key-ring blob

Google Drive
  Binary media provider
```

## Backend Container

Build from the repository root:

```powershell
docker build -f ArtistOS.Api/Dockerfile -t darkroom-api:stg .
```

Run locally with development-safe configuration:

```powershell
docker run --rm -p 8080:8080 `
  -e ASPNETCORE_ENVIRONMENT=Development `
  -e ASPNETCORE_URLS=http://+:8080 `
  darkroom-api:stg
```

The backend listens on port `8080` in the container.

Health endpoints:

- `GET /api/health/live`: process liveness only, no external dependency checks.
- `GET /api/health/ready`: checks database connectivity and Data Protection availability with a short timeout.

## Frontend Container

Build from `darkroom-web/`:

```powershell
docker build -t darkroom-web:stg `
  --build-arg VITE_API_BASE_URL=http://localhost:8080 `
  darkroom-web
```

Run locally:

```powershell
docker run --rm -p 3000:3000 darkroom-web:stg
```

The frontend listens on port `3000` in the container.

Health endpoint:

- `GET /healthz`: process liveness for the Nitro server wrapper; no backend dependency.

`VITE_API_BASE_URL` is a build-time value for the current frontend. Rebuild the frontend image when the staging API URL changes.

## Backend Non-Secret Configuration

Expected Azure Container Apps non-secret environment variables:

```text
ASPNETCORE_ENVIRONMENT=Staging
ASPNETCORE_URLS=http://+:8080
AllowedHosts=<api-container-app-host>
PublicUrls__ApiBaseUrl=https://<api-fqdn>
PublicUrls__FrontendBaseUrl=https://<frontend-fqdn>
Cors__AllowedOrigins__0=https://<frontend-fqdn>
DataProtection__ApplicationName=ArtistOS.Api
DataProtection__BlobUri=https://<storage-account>.blob.core.windows.net/dataprotection-keys/key-ring.xml
```

## Backend Secrets

Expected Azure Container Apps secret-backed environment variables:

```text
ConnectionStrings__DefaultConnection
Jwt__SigningKey
GoogleDrive__ClientId
GoogleDrive__ClientSecret
```

Recommended staging PostgreSQL connection-string options include:

```text
SSL Mode=Require;Trust Server Certificate=false;Maximum Pool Size=10
```

Do not commit secret values. Do not bake secret values into container images.

## Frontend Configuration

Build-time:

```text
VITE_API_BASE_URL=https://<api-fqdn>
```

Runtime:

```text
PORT=3000
NITRO_PORT=3000
NITRO_HOST=0.0.0.0
NODE_ENV=production
```

## Data Protection

Development can continue to use local/default Data Protection behavior or `DataProtection__KeyRingPath`.

Staging and Production require durable key persistence through one of:

- `DataProtection__BlobUri` backed by Azure Blob Storage and managed identity.
- `DataProtection__KeyRingPath` only if the host provides a durable shared filesystem.

For Azure Container Apps, prefer `DataProtection__BlobUri`.

Expected Azure access model:

```text
API Container App managed identity
  -> Storage Blob Data Contributor on the Data Protection storage account/container
  -> private blob container
  -> key-ring blob
```

## Cost Guardrails

Keep these disabled for the initial free/student staging target:

- always-on replicas
- premium Container Apps workload profiles
- PostgreSQL SKUs larger than B1ms
- PostgreSQL high availability
- PostgreSQL zone redundancy
- geo-redundant backups
- private endpoints
- NAT Gateway
- Azure Firewall
- paid partner monitoring
- excessive Log Analytics retention
- large storage allocations

## Manual Deployment Boundary

D1D-A1 does not implement continuous deployment.

Future deployment order:

1. Verify Azure CLI login and selected subscription.
2. Confirm `Southeast Asia` service availability and quotas.
3. Build backend and frontend containers locally.
4. Create the staging resource group.
5. Create storage and Data Protection container/blob.
6. Create managed identity and assign Blob permissions.
7. Create PostgreSQL B1ms and staging database.
8. Create ACR and push images.
9. Create Container Apps environment.
10. Deploy API with health checks and secrets.
11. Verify API liveness/readiness.
12. Build frontend with final `VITE_API_BASE_URL`.
13. Deploy frontend and verify `/healthz`.
14. Configure exact `PublicUrls`, CORS, and `AllowedHosts`.
15. Configure separate staging Google OAuth callback.
16. Run auth, Song CRUD, collaboration, Drive, media, and restart/redeploy smoke tests.
17. Document staging verification.
18. Add GitHub Actions CD in D2 using Azure OIDC/federated identity.

## Verification Commands

Backend:

```powershell
dotnet restore ArtistOS.slnx
dotnet build ArtistOS.slnx -c Release --no-restore
dotnet test ArtistOS.slnx -c Release --no-build
```

Frontend:

```powershell
cd darkroom-web
npm ci
npm run lint
npm run test
npm run build
```
