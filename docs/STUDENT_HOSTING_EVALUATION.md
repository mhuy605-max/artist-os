# D1C Student / Free Hosting Evaluation

Last updated: 2026-09-12

## 1. D1C Executive Summary

D1C evaluated student, free, and low-cost hosting options for DARKROOM SYSTEM without deploying or changing application code.

Decision:

```text
D1C RECOMMENDED TARGET: Fly.io application hosting + managed PostgreSQL + Fly volume for Data Protection keys
FALLBACK TARGET: AWS D1B baseline
D1C FINAL VERDICT: D1C: PASS — STUDENT/FREE HOSTING TARGET SELECTED
RECOMMENDED NEXT MILESTONE: D1D - Fly.io Deployment Implementation
```

Fly.io wins for DARKROOM because it can run both the TanStack/Nitro node-server frontend and the ASP.NET Core API as standard containers, has first-class persistent volumes, supports custom domains and TLS, avoids the obvious hard request-timeout failures found in Heroku-style router platforms, and is operationally simpler and cheaper than the existing AWS baseline. It is not selected because it is free; it is selected because it is the lowest-cost practical target that still has a plausible path for 2 GB uploads, secure private media streaming, durable Data Protection keys, and PostgreSQL.

Critical caveat: D1C is research only. A real staging upload/Range/logging test is still required before production use.

## 2. Context Files Read

- `AGENTS.md`
- `darkroom-web/AGENTS.md`
- `README.md`
- `darkroom-web/README.md`
- `docs/CURRENT_STATE.md`
- `docs/PROJECT_PLAN.md`
- `docs/GOOGLE_DRIVE_ARCHITECTURE.md`
- `.github/workflows/ci.yml`
- `ArtistOS.Api/Program.cs`
- `ArtistOS.Api/appsettings.json`
- `ArtistOS.Api/appsettings.Development.json`
- `ArtistOS.Api/ArtistOS.Api.csproj`
- `darkroom-web/package.json`
- `darkroom-web/vite.config.ts`
- `darkroom-web/src/start.ts`
- `darkroom-web/src/router.tsx`
- relevant backend media, upload, Data Protection, public URL, CORS, and security references found with `rg`

## 3. Pre-D1C Git Status

Before D1C documentation edits:

```text
## main...origin/main
 M docs/CURRENT_STATE.md
```

The existing modification was the A5 current-state update. D1C preserves and extends it.

## 4. Current Deployment Baseline

D1B remains a technically valid paid AWS baseline:

```text
Internet
  |
  v
Route53
  |
  +--> CloudFront -> private S3 frontend assets
  |
  +--> ALB HTTPS / ACM / AWS WAF -> ECS/Fargate ASP.NET Core API
          |
          +--> private RDS PostgreSQL
          +--> EFS Data Protection key ring
          +--> Google OAuth / Drive outbound HTTPS
          +--> CloudWatch / Secrets Manager
```

AWS has the strongest security-control ceiling in this evaluation, but it is not the lowest-cost or simplest starting point for a student deployment.

## 5. Current GitHub Student Benefits Verified

Official/current public benefit pages were checked during D1C. Student entitlements can be account-specific and may require login to verify final eligibility.

Observed relevant offers:

- Azure for Students advertises USD 100 credit and no credit card requirement.
- Heroku participates in GitHub Student Developer Pack offers, but exact account credit/eligibility can require login.
- Appwrite appears as a Student Pack provider, but replacing DARKROOM's ASP.NET Core backend with Appwrite would be a major rewrite and is out of D1C scope.
- Student Pack domain offers can be useful for a custom domain, but domain choice does not determine hosting correctness.

User action required:

- Verify exact GitHub Student Pack account entitlements after login before relying on any credit amount or expiration.
- Verify domain offer availability and TLD constraints before choosing a production domain.

## 6. Student Benefit Sources / Verification

Sources consulted:

- GitHub Education Student Developer Pack: https://education.github.com/pack
- Azure for Students: https://azure.microsoft.com/free/students/
- Heroku Dev Center and pricing: https://devcenter.heroku.com/ and https://www.heroku.com/pricing
- Appwrite pricing/product docs: https://appwrite.io/pricing
- GitHub Pages docs: https://docs.github.com/pages
- Azure App Service, Container Apps, PostgreSQL, Blob/Files, and pricing docs: https://learn.microsoft.com/azure/
- AWS Elastic Load Balancing, ECS/Fargate, EFS, RDS, Secrets Manager, WAF, and pricing docs: https://docs.aws.amazon.com/
- Render docs and pricing: https://render.com/docs and https://render.com/pricing
- Railway docs and pricing: https://docs.railway.com/ and https://railway.com/pricing
- Fly.io docs and pricing: https://fly.io/docs/ and https://fly.io/pricing/

## 7. Current Frontend Deployment Model

The frontend is not currently a static-only SPA. `darkroom-web/vite.config.ts` uses:

```text
@tanstack/react-start/plugin/vite
nitro({ preset: "node-server" })
```

Therefore the current frontend requires a Node server runtime unless a later milestone explicitly changes the frontend deployment model.

## 8. Current Backend Deployment Requirements

The backend requires:

- ASP.NET Core Web API
- .NET 10 runtime or Linux Docker/container hosting
- EF Core with Npgsql
- PostgreSQL
- runtime secret injection
- stable public HTTPS API URL
- outbound HTTPS to Google
- configurable CORS and public URLs
- durable Data Protection key persistence
- request body and multipart limits at least `2 GB + 10 MB`

## 9. PostgreSQL Requirements

Production PostgreSQL must provide:

- TLS
- durable storage
- reliable backups or snapshots
- non-expiring database service
- acceptable connection limit for ASP.NET Core pooling
- upgrade path to larger storage/CPU
- preferably private networking from the API host

SQLite is not a valid production replacement.

## 10. Data Protection Requirements

`Program.cs` configures ASP.NET Core Data Protection with `DataProtection:KeyRingPath` when set, and production startup validation requires a key-ring path outside Development.

Data Protection keys protect security-sensitive data including:

- Google refresh tokens persisted in PostgreSQL
- Google OAuth state
- short-lived signed media access tokens

Ephemeral container filesystem alone is not acceptable.

## 11. Google OAuth Requirements

The selected host must support:

- stable public HTTPS API base URL
- OAuth callback URL registration
- runtime Google OAuth client id and client secret
- outbound HTTPS to Google
- exact frontend/API public URL and CORS configuration
- separate staging and production callbacks

## 12. Google Drive Requirements

DARKROOM keeps the existing model:

```text
ASP.NET Core API -> Google Drive for binary media
PostgreSQL -> workflow metadata and provider references
```

D1C does not move binary media away from Google Drive or replace Drive with provider object storage.

## 13. Large Upload Requirements

Canonical app limits:

- audio: 500 MB
- images: 100 MB
- video: 2 GB
- ASP.NET request body max: `2 GB + 10 MB`

Every production layer must allow the upload size and duration, including browser, frontend if it proxies anything, edge/proxy, load balancer, API ingress, container runtime, and backend server.

## 14. Media Range Requirements

The backend media proxy supports `GET`, `HEAD`, single `Range` parsing, `200`, `206`, `416`, `Content-Range`, `Accept-Ranges: bytes`, `private, no-store`, and streaming from Google Drive without intentionally buffering the whole file.

The selected host must pass Range requests and response headers without caching private signed media.

## 15. Security Requirements

Production hosting must provide:

- TLS and HTTPS redirect
- secret injection
- environment isolation
- database protection and backups
- durable Data Protection keys
- query-string log redaction or access-log disablement
- no public caching of signed private media
- operational monitoring
- upgrade path for WAF/DDoS controls where practical

## 16. AWS Baseline Evaluation

AWS D1B passes the architecture requirements with expected configuration:

- ECS/Fargate can run the .NET API container.
- RDS PostgreSQL satisfies managed database needs.
- EFS can persist Data Protection keys across replacements.
- ALB supports long idle timeout configuration up to the documented maximum.
- WAF, Shield, CloudWatch, Secrets Manager, private networking, and security groups offer the strongest controls here.

Major limitation: monthly cost and operational surface area are high for a student project.

## 17. Azure Student Evaluation

Viable Azure shapes:

```text
Internet
  |
  v
Azure App Service or Container Apps
  |
  +--> Azure Database for PostgreSQL Flexible Server
  +--> Azure Files / Blob-compatible key persistence
  +--> Google OAuth / Drive
```

Assessment:

- Student benefit is strong because Azure for Students provides credit.
- .NET and container compatibility are strong.
- PostgreSQL is available through Flexible Server.
- Data Protection can use Azure Files mounted storage, Blob-backed key persistence, or a separately configured durable store.
- Frontend node-server can run as Node/container.

Concern:

- Common Azure managed web ingress paths have documented request/idle timeout constraints that can make 2 GB direct browser-to-ASP.NET uploads risky or incompatible without redesigning upload flow, hosting topology, or ingress selection.

Conclusion: good fallback for student-credit exploration, but not the D1C target until 2 GB upload ingress is proven in staging.

## 18. Heroku Student Evaluation

Heroku shape:

```text
Internet
  |
  v
Heroku web dynos
  |
  +--> Heroku Postgres
  +--> external durable key store required
  +--> Google OAuth / Drive
```

Assessment:

- Student benefit may reduce initial cost.
- Container deployment is possible.
- PostgreSQL is available.
- Secret injection is mature and simple.

Hard blocker:

- Heroku's router timeout model is a poor fit for slow 2 GB uploads and long backend-mediated media operations.
- Dyno filesystem is ephemeral, so Data Protection keys require an external durable store.

Conclusion: not selected. Heroku is operationally simple, but it fails DARKROOM's current large-upload architecture without a redesign.

## 19. Additional PaaS Evaluation

Evaluated modern PaaS candidates:

- Render
- Railway
- Fly.io

Result:

- Render is simple and mature, but request/upload limit evidence is not strong enough for the current 2 GB direct-upload requirement without staging proof.
- Railway is developer-friendly and supports containers/PostgreSQL, but platform request timeout/body-size/logging details require staging validation.
- Fly.io is the best practical low-cost candidate because it runs ordinary containers close to the metal, supports persistent volumes, custom domains, TLS, private networking patterns, and avoids the most obvious Heroku-style HTTP timeout mismatch.

## 20. Appwrite Evaluation

Appwrite is not a replacement for DARKROOM's current backend in D1C.

Classification: PARTIALLY USEFUL.

Why:

- DARKROOM already has ASP.NET Core, EF Core, PostgreSQL, JWT auth, Google Drive integration, custom media proxying, and Song-scoped collaboration authorization.
- Replacing that with Appwrite would be a major architecture rewrite outside D1C.
- Appwrite may be useful for future ancillary services only if a specific feature justifies it.

## 21. GitHub Pages Evaluation

Classification: FAIL for current architecture.

GitHub Pages hosts static site content. DARKROOM's current frontend uses TanStack Start with Nitro `node-server`, so GitHub Pages cannot host it without changing the frontend deployment model.

If a future milestone converts the frontend to static/client-hostable output, GitHub Pages or static hosting can be reconsidered.

## 22. Domain Benefit Findings

Student Pack domain benefits may help obtain a low-cost custom domain.

Domain benefit must remain separate from hosting correctness. A useful domain offer does not solve:

- .NET hosting
- PostgreSQL
- durable Data Protection keys
- 2 GB upload ingress
- Range streaming
- query-token log redaction

## 23. Provider Comparison Matrix

| Provider / architecture | Student benefit | Frontend support | .NET 10 support | Container support | PostgreSQL | Persistent storage | Data Protection | 2 GB upload | Timeout | Range streaming | Secrets | HTTPS/custom domain | Log/query controls | Complexity | Cost |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AWS D1B | UNKNOWN / no core student dependency | PASS WITH CONDITIONS | PASS | PASS | PASS | PASS | PASS via EFS | PASS WITH CONDITIONS | PASS WITH CONDITIONS | PASS WITH CONDITIONS | PASS | PASS | PASS WITH CONDITIONS | High | High |
| Azure Student | PASS WITH CONDITIONS | PASS WITH CONDITIONS | PASS | PASS | PASS | PASS WITH CONDITIONS | PASS WITH CONDITIONS | UNKNOWN / risky | UNKNOWN | PASS WITH CONDITIONS | PASS | PASS | PASS WITH CONDITIONS | Medium | Low initially, medium later |
| Heroku Student | PASS WITH CONDITIONS | PASS WITH CONDITIONS | PASS WITH CONDITIONS | PASS | PASS WITH CONDITIONS | FAIL local filesystem | PASS WITH CONDITIONS external only | FAIL | FAIL | PASS WITH CONDITIONS | PASS | PASS | UNKNOWN | Low | Low-medium |
| Render | UNKNOWN | PASS WITH CONDITIONS | PASS WITH CONDITIONS | PASS | PASS WITH CONDITIONS | PASS WITH CONDITIONS | PASS WITH CONDITIONS | UNKNOWN | UNKNOWN | PASS WITH CONDITIONS | PASS | PASS | UNKNOWN | Low-medium | Low-medium |
| Railway | UNKNOWN | PASS WITH CONDITIONS | PASS | PASS | PASS WITH CONDITIONS | PASS WITH CONDITIONS | PASS WITH CONDITIONS | UNKNOWN | UNKNOWN | PASS WITH CONDITIONS | PASS | PASS | UNKNOWN | Low | Low-medium |
| Fly.io | UNKNOWN | PASS WITH CONDITIONS | PASS | PASS | PASS WITH CONDITIONS | PASS | PASS via volume | PASS WITH CONDITIONS | PASS WITH CONDITIONS | PASS WITH CONDITIONS | PASS | PASS | PASS WITH CONDITIONS | Medium | Low-medium |
| GitHub Pages | PASS | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL for backend | PASS for static only | UNKNOWN | Low | Free |
| Appwrite replacement | PASS WITH CONDITIONS | ARCHITECTURE CHANGE REQUIRED | FAIL as current backend host | N/A | ARCHITECTURE CHANGE REQUIRED | N/A | ARCHITECTURE CHANGE REQUIRED | ARCHITECTURE CHANGE REQUIRED | UNKNOWN | ARCHITECTURE CHANGE REQUIRED | PASS | PASS | UNKNOWN | High rewrite | Unknown |

## 24. 2 GB Upload Compatibility Matrix

| Provider | Classification | Reason |
| --- | --- | --- |
| AWS D1B | SUPPORTED WITH CONFIGURATION | ALB/ECS/Kestrel can be tuned; staging must verify idle timeout, buffering, and client behavior. |
| Azure | UNKNOWN | Candidate services may impose ingress timeout/body behavior that must be proven before selection. |
| Heroku | NOT SUPPORTED | Router timeout makes slow 2 GB direct uploads incompatible with current architecture. |
| Render | UNKNOWN | Needs real staging proof for 2 GB multipart upload through managed proxy. |
| Railway | UNKNOWN | Needs real staging proof for HTTP proxy timeout/body behavior and logging. |
| Fly.io | SUPPORTED WITH CONFIGURATION | Most plausible low-cost path using containers and tuned app/proxy settings; must be proven in staging. |
| GitHub Pages | NOT SUPPORTED | Static hosting cannot receive backend uploads. |

## 25. Request Timeout Matrix

| Provider | Classification |
| --- | --- |
| AWS D1B | PASS WITH CONDITIONS |
| Azure | UNKNOWN |
| Heroku | FAIL |
| Render | UNKNOWN |
| Railway | UNKNOWN |
| Fly.io | PASS WITH CONDITIONS |
| GitHub Pages | FAIL |

## 26. Media Range Compatibility Matrix

| Provider | Classification | Notes |
| --- | --- | --- |
| AWS D1B | PASS WITH CONDITIONS | Disable CDN caching for private media; ALB should pass headers. |
| Azure | PASS WITH CONDITIONS | Must verify ingress does not buffer or strip Range/Content-Range. |
| Heroku | PASS WITH CONDITIONS | Range itself likely passes, but upload timeout still fails finalist status. |
| Render | PASS WITH CONDITIONS | Needs staging verification. |
| Railway | PASS WITH CONDITIONS | Needs staging verification. |
| Fly.io | PASS WITH CONDITIONS | Needs staging verification with `GET`, `HEAD`, and `Range`. |
| GitHub Pages | FAIL | Cannot host backend media proxy. |

## 27. Data Protection Persistence Matrix

| Provider | Classification | Durable key solution |
| --- | --- | --- |
| AWS D1B | PASS | EFS mount for `DataProtection:KeyRingPath`. |
| Azure | PASS WITH CONDITIONS | Azure Files mount or Blob-backed key repository. |
| Heroku | PASS WITH CONDITIONS | External store required; dyno filesystem is not acceptable. |
| Render | PASS WITH CONDITIONS | Persistent disk if available for service topology, or external object store. |
| Railway | PASS WITH CONDITIONS | Persistent volume if service supports required mount semantics, or external store. |
| Fly.io | PASS | Fly volume mounted to configured key-ring path. |
| GitHub Pages | FAIL | No backend runtime or durable key store. |

## 28. Database Comparison

| Provider | PostgreSQL assessment |
| --- | --- |
| AWS RDS | Strongest managed option; private subnet, backups, monitoring, upgrade path. |
| Azure Flexible Server | Strong managed option; student credit can cover early usage, but cost rises later. |
| Heroku Postgres | Simple, mature, easy upgrade path; entry plans are constrained. |
| Render Postgres | Simple, integrated; evaluate storage, backup, and connection limits by plan. |
| Railway Postgres | Convenient developer UX; verify backup/restore and production posture. |
| Fly Postgres / external managed Postgres | Viable for staging/small production; consider external managed PostgreSQL if higher durability is needed. |

## 29. Security Comparison

| Area | AWS D1B | Fly.io target | Azure student | Heroku |
| --- | --- | --- | --- | --- |
| DDoS | Strongest with AWS edge options | Provider-level baseline, not AWS-equivalent | Strong provider baseline | Provider-level baseline |
| WAF | AWS WAF available | External WAF/proxy may be needed | WAF possible with added services | Not equivalent by default |
| TLS | PASS | PASS | PASS | PASS |
| Origin exposure | Strong private networking options | Can reduce exposure, but simpler topology | Good with private networking options | More limited |
| Secrets | Secrets Manager | Fly secrets | Azure Key Vault/App settings | Config vars |
| Database exposure | Private RDS | Prefer private/internal networking or trusted allowlists | Private endpoint possible | Plan-dependent |
| Data Protection | EFS | Volume | Azure Files/Blob | External store required |
| Monitoring | CloudWatch | Fly metrics/logs plus external optional | Azure Monitor | Heroku logs/add-ons |
| Backups | RDS automated | Provider/external DB plan-dependent | Managed backups | Plan-dependent |

## 30. Logging / Query Redaction Comparison

Signed media URLs contain sensitive query tokens.

| Provider | Classification |
| --- | --- |
| AWS D1B | PASS WITH CONDITIONS: configure ALB/CloudFront/API logs to avoid full query strings or redact. |
| Azure | PASS WITH CONDITIONS: verify App Service/Container Apps/App Gateway logging fields before enabling access logs. |
| Heroku | UNKNOWN: router/application logs need verification for query-string exposure. |
| Render | UNKNOWN: access log controls need verification. |
| Railway | UNKNOWN: proxy log/query behavior needs verification. |
| Fly.io | PASS WITH CONDITIONS: verify edge/app log content and avoid logging `Request.Path + QueryString` in app logs. |

## 31. Student Cost Comparison

Estimated initial student cost:

- Azure: likely USD 0 while student credit covers services.
- Heroku: reduced if eligible Student Pack credit applies; account-specific.
- Appwrite: not useful as core host for current architecture.
- AWS: no assumed student credit; paid baseline.
- Fly.io / Render / Railway: low monthly cost, possible free trial/allowances vary by account.
- Domain: possible student/free first-year domain benefit, account-specific.

## 32. Post-Student Cost Comparison

Estimated post-student monthly cost:

- Fly.io target: roughly low tens of USD for two small services, volume, and PostgreSQL, depending on database choice and region.
- Azure: roughly tens of USD once App Service/Container Apps plus PostgreSQL and storage are outside student credit.
- Heroku: low-to-medium, but not valid for current upload requirements.
- AWS D1B: materially higher, commonly around USD 80-150+ depending on ALB, ECS/Fargate, RDS, NAT, WAF, EFS, logs, and traffic.
- Render/Railway: low-to-medium, but D1C leaves upload/logging proof as unknown.

## 33. Option A - Lowest Cost

```text
Internet
  |
  v
Fly.io Node frontend container
  |
  v
Fly.io ASP.NET Core API container
  |
  +--> Fly volume mounted at DataProtection:KeyRingPath
  +--> Fly Postgres or low-cost managed PostgreSQL
  +--> Google OAuth / Drive outbound HTTPS
```

Cost: low-to-medium. Security: adequate for staging and small production if logging, secrets, TLS, database exposure, backups, and media tests pass.

## 34. Option B - Best Balance

```text
Internet
  |
  v
Fly.io Node frontend container
  |
  v
Fly.io ASP.NET Core API container
  |
  +--> Fly volume for Data Protection
  +--> managed PostgreSQL with backups
  +--> Google OAuth / Drive outbound HTTPS
  +--> optional external DNS/WAF later
```

This is also the recommended target. The balance improves if PostgreSQL is a managed service with clear backups and restore behavior rather than the absolute cheapest database.

## 35. Option C - AWS Baseline

```text
Internet
  |
  v
Route53 / CloudFront / ALB / WAF
  |
  v
ECS/Fargate API and compatible frontend hosting
  |
  +--> RDS PostgreSQL private
  +--> EFS Data Protection keys
  +--> Secrets Manager
  +--> Google OAuth / Drive
```

Best security-control baseline, highest cost and complexity.

## 36. Optional Hybrid Option

```text
Internet
  |
  v
Fly.io frontend + API containers
  |
  +--> external managed PostgreSQL with backups
  +--> Fly volume or object-backed Data Protection key repository
  +--> Google OAuth / Drive
```

This is operationally reasonable if Fly-hosted PostgreSQL is judged too light for production durability. It keeps application hosting simple while improving database confidence.

## 37. Frontend Node-Server Assessment

Keeping the current TanStack/Nitro node-server output avoids a frontend architecture change and works naturally on container platforms.

Recommended for D1D.

## 38. Static Frontend Alternative Assessment

Static/client-only hosting could reduce cost and broaden options, including static hosts and GitHub Pages.

However, the current app is already built around TanStack Start with Nitro node-server output. The cost savings are not large enough to justify an architecture change during D1C. Static conversion should be a separate optional future proposal only if container frontend hosting becomes a real blocker.

## 39. Architecture Change Required Items

These require separate approval and are not part of D1C:

- converting TanStack Start node-server output to static hosting
- direct-to-Google browser uploads
- presigned/resumable upload handoff redesign
- replacing ASP.NET Core with Appwrite or another backend platform
- replacing PostgreSQL with another database
- moving media binaries from Google Drive to another storage provider
- adding provider-specific deployment YAML, Dockerfiles, DNS, or CI deployment

## 40. Song Fallback Pre-Staging Decision

The Song API unreachable fallback remains:

```text
ACCEPTABLE FOR D1C
REVIEW BEFORE STAGING
```

Do not broaden or remove it during D1C. Review before staging so production cannot mask backend reachability failures.

## 41. Live Google / Media Verification Debt

Accepted debt:

- real Google OAuth / Drive smoke has not been fully rerun after recent collaboration and asset replacement work
- real linked media playback/preview/upload through production-like infrastructure remains untested

This does not block D1C research, but it is required before staging sign-off.

## 42. Required Staging Tests

Before production:

- deploy frontend node-server and API to selected provider
- configure separate staging secrets, CORS, public URLs, OAuth callbacks, and Data Protection key path
- connect Google Drive with a staging account
- upload 500 MB audio
- upload 100 MB image
- upload 2 GB video
- interrupt/retry slow upload behavior manually
- verify upload duration and proxy idle behavior
- verify `GET`, `HEAD`, valid `Range`, suffix `Range`, invalid multi-range, and unsatisfiable `Range`
- verify `200`, `206`, `416`, `Content-Range`, `Accept-Ranges`, and `private, no-store`
- verify no platform/proxy/application access logs expose signed media query tokens
- restart/redeploy API and verify Data Protection tokens still validate as expected
- verify PostgreSQL TLS, backup, restore, and connection behavior

## 43. Provider-Specific Risks

- AWS: cost and complexity are high; NAT/log/WAF/ALB costs can surprise.
- Azure: ingress timeout/body behavior may force upload redesign; account credit expiration changes cost.
- Heroku: router timeout blocks current direct large-upload architecture.
- Render: upload/request/proxy/logging behavior needs proof.
- Railway: production database/backups/logging/request behavior needs proof.
- Fly.io: database durability/backups and query-log controls require careful setup and validation.
- GitHub Pages: incompatible with current frontend and backend.
- Appwrite: backend rewrite, not a host for current ASP.NET Core architecture.

## 44. Unknown Items Requiring Real-World Validation

- exact GitHub Student Pack offers available to the developer account
- exact selected domain benefit and renewal price
- provider proxy behavior under a real 2 GB multipart upload
- platform access-log query-string behavior
- slow-client upload behavior across selected regions
- Range streaming behavior through selected edge/proxy
- database restore process and recovery time
- provider support for .NET 10 if not using containers

## 45. D1C Recommended Target

Fly.io application hosting, with frontend and API deployed as containers, Fly volume-backed Data Protection key persistence, and PostgreSQL either on Fly for lowest cost/staging or an external managed PostgreSQL provider for stronger production durability.

## 46. Why This Target Wins

Fly.io wins for DARKROOM specifically because:

- it respects the current frontend node-server architecture
- it respects the current ASP.NET Core backend
- it avoids a backend rewrite
- it avoids a static frontend conversion
- it supports persistent volumes for Data Protection keys
- it supports standard container deployment for .NET 10
- it has a plausible path for long uploads and Range streaming
- it is much cheaper and simpler than AWS D1B
- it keeps Google Drive as the binary media store
- it leaves AWS available as a stronger fallback if staging exposes a hard provider limit

## 47. D1C Fallback Target

AWS D1B remains the fallback target.

Use AWS if Fly.io staging cannot prove:

- 2 GB direct browser-to-ASP.NET uploads
- acceptable request duration and idle behavior
- correct private media Range streaming
- safe query-token logging controls
- acceptable PostgreSQL durability/backups

## 48. Estimated Student Monthly Cost

Initial student monthly cost:

- Fly.io target: low-to-medium; not dependent on Student Pack credit.
- Azure alternative: potentially USD 0 while credit lasts if sized carefully.
- Heroku alternative: account-specific student credit, but not technically valid for current uploads.
- AWS baseline: paid unless separate credits are available.

## 49. Estimated Post-Student Monthly Cost

Estimated post-student cost:

- Recommended Fly.io target: low tens of USD per month for small services plus database/storage, depending on sizing and database provider.
- AWS fallback: materially higher, commonly many tens to low hundreds per month for the D1B stack.
- Azure: medium monthly cost after student credit, mostly driven by PostgreSQL plus app hosting.

## 50. Migration From AWS Baseline Implications

Moving from D1B baseline to Fly.io target means:

- no S3/CloudFront static frontend baseline for current node-server frontend
- no ALB/WAF/RDS/EFS baseline by default
- provider-specific secrets, volumes, logs, DNS, and deployment process need D1D implementation
- AWS-grade WAF/private-network controls become optional future hardening rather than baseline features

## 51. Required Next Implementation Changes

D1D should prepare deployment only after approval:

- add Dockerfile or provider build configuration for ASP.NET Core API
- add Dockerfile or provider build configuration for TanStack/Nitro frontend
- define Fly apps, volumes, secrets, and environment variables
- configure PostgreSQL and connection strings
- configure `DataProtection:KeyRingPath`
- configure `PublicUrls`, CORS, and `AllowedHosts`
- configure Google OAuth staging callback
- add provider-specific deployment documentation
- run staging upload/media/security checks

## 52. Files Changed

- `docs/CURRENT_STATE.md`
- `docs/STUDENT_HOSTING_EVALUATION.md`

## 53. Documentation Created / Updated

- Created `docs/STUDENT_HOSTING_EVALUATION.md`.
- Updated `docs/CURRENT_STATE.md` with D1C result and next milestone.

## 54. Unresolved P0 Findings

None for D1C research.

## 55. Unresolved P1 Findings

- No provider can be production-approved until real 2 GB upload, Range streaming, Data Protection persistence, and query-token logging tests pass in staging.

## 56. Unresolved P2 Findings

- Exact Student Pack benefits are account-specific and need user login verification.
- Domain offer usefulness depends on available TLD and renewal price.
- Static frontend conversion may be reconsidered later if frontend container hosting proves not worth the cost.

## 57. D1C Scope Check

D1C did not:

- deploy anything
- create infrastructure
- edit application code
- change CI
- change DNS
- create databases
- provision cloud resources
- create secrets
- modify OAuth credentials
- commit
- push

## 58. Final Git Status

After D1C documentation edits:

```text
## main...origin/main
 M docs/CURRENT_STATE.md
?? docs/STUDENT_HOSTING_EVALUATION.md
```

## 59. D1C Final Verdict

```text
D1C: PASS — STUDENT/FREE HOSTING TARGET SELECTED
```

## 60. Recommended Next Milestone

```text
D1D - Fly.io Deployment Implementation
```
