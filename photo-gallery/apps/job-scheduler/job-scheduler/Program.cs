using System;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace job_scheduler
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Do you see this?");
            if (args.Length <= 0) { return; }
            if (args.Length > 1) { Console.Write("Detected more than a single argument. Only processing the first one"); }
            ImageJob job = JsonConvert.DeserializeObject<ImageJob>(args[0]);

            var services = ConfigureServices();
            var serviceProvider = services.BuildServiceProvider();
            serviceProvider.GetService<Scheduler>().Run(job);
        }

        private static IServiceCollection ConfigureServices()
        {
            IServiceCollection services = new ServiceCollection();
            services.AddLogging(opt => opt.AddConsole());
            services.AddTransient<IStorageService, StorageService>();
            services.AddTransient<Scheduler>();
            return services;
        }
    }
}
