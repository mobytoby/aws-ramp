FROM mcr.microsoft.com/dotnet/core/runtime:3.1
COPY bin/Debug/netcoreapp3.1/ app/
ENTRYPOINT ["dotnet", "app/job-scheduler.dll"]
CMD [ "Toby" ]