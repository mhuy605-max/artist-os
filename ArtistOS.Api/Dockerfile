# Build with the repository root as context:
# docker build -f ArtistOS.Api/Dockerfile -t darkroom-api:stg .
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ArtistOS.Api/ArtistOS.Api.csproj ArtistOS.Api/
RUN dotnet restore ArtistOS.Api/ArtistOS.Api.csproj

COPY ArtistOS.Api/ ArtistOS.Api/
RUN dotnet publish ArtistOS.Api/ArtistOS.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .

USER $APP_UID
ENTRYPOINT ["dotnet", "ArtistOS.Api.dll"]
