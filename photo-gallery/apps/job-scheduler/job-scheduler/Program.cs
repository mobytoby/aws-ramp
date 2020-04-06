﻿using System;
using System.IO;
using System.Threading.Tasks;
using job_scheduler.Settings;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace job_scheduler
{
    class Program
    {
        private const string prefix = "PHOTOGALLERY_";
        private const string appSettings = "appsettings.json";

        static async Task Main(string[] args)
        {
            var host = new HostBuilder()
                .ConfigureHostConfiguration(configHost =>
                {
                    configHost.SetBasePath(Directory.GetCurrentDirectory());
                    configHost.AddJsonFile(appSettings, optional: true);
                    configHost.AddEnvironmentVariables(prefix: prefix);
                    configHost.AddCommandLine(args);
                })
                .ConfigureAppConfiguration((hostContext, configApp) =>
                {
                    configApp.SetBasePath(Directory.GetCurrentDirectory());
                    configApp.AddJsonFile(appSettings, optional: true);
                    configApp.AddJsonFile(
                        $"appsettings.{hostContext.HostingEnvironment.EnvironmentName}.json",
                        optional: true);
                    configApp.AddEnvironmentVariables(prefix: prefix);
                    configApp.AddCommandLine(args);
                })
                .ConfigureServices((hostContext, services) =>
                {
                    services.AddLogging();
                    services.Configure<Processing>(hostContext.Configuration.GetSection("processing"));
                    services.AddTransient<IStorageService, StorageService>();
                    services.AddTransient<IDispatchService, DispatchService>();
                    services.AddHostedService<Scheduler>();
                })
                .ConfigureLogging((hostContext, configLogging) =>
                {
                    configLogging.AddConsole();
                })
                .UseConsoleLifetime()
                .Build();

            await host.RunAsync();

        }
    }
}
