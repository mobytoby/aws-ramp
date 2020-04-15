#FROM mcr.microsoft.com/dotnet/core/runtime:3.1
#COPY bin/Debug/netcoreapp3.1/ app/
#ENTRYPOINT ["dotnet", "app/job-scheduler.dll"]
#CMD [ "Toby" ]

FROM mcr.microsoft.com/dotnet/core/runtime:3.1 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/core/sdk:3.1-buster AS build
WORKDIR /src
COPY *.csproj ./
RUN dotnet restore

COPY . ./
RUN dotnet build "job-scheduler.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "job-scheduler.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "job-scheduler.dll"]
