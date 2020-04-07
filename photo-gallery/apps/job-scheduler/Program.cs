using System;
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
            var builder = new HostBuilder()
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
                    configApp.AddJsonFile(appSettings, optional: false);
                    configApp.AddJsonFile(
                        $"appsettings.{hostContext.HostingEnvironment.EnvironmentName}.json",
                        optional: true);
                    configApp.AddEnvironmentVariables(prefix: prefix);
                    configApp.AddCommandLine(args);
                })
                .ConfigureServices((hostContext, services) =>
                {
                    services.AddHostedService<Scheduler>();
                    services.AddLogging();
                    services.Configure<Processing>(hostContext.Configuration.GetSection("Processing"));
                    services.Configure<input>(hostContext.Configuration.GetSection("input:imageJob"));
                    services.AddScoped<IStorageService, StorageService>();
                    services.AddScoped<IDispatchService, DispatchService>();
                })
                .ConfigureLogging((hostContext, configLogging) =>
                {
                    configLogging.AddConsole();
                })
                //.UseConsoleLifetime()
                .Build();

            await builder.RunAsync();

        }
    }
}
