using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Newtonsoft.Json;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace job_scheduler
{
    public class Scheduler : BackgroundService
    {
        private IAppSyncService AppSyncService { get; }
        private IConfiguration Config { get; }
        private IStorageService StorageService { get; }
        private IDispatchService DispatchService { get; }
        private IHostApplicationLifetime AppLifetime { get; }

        public Scheduler(IHostApplicationLifetime appLifetime,
                         IAppSyncService appSyncService, 
                         IConfiguration configuration,
                         IStorageService storageService,
                         IDispatchService dispatchService)
        {
            AppLifetime = appLifetime;
            AppSyncService = appSyncService;
            Config = configuration;
            StorageService = storageService;
            DispatchService = dispatchService;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            try
            {
                var args = Config.GetSection("input:imageJob");
                if (args == null)
                {
                    await Task.FromException(new Exception(@"Expected a --input:imageJob command line parameter with a value of a JSONified version of the image job, but found none. Unable to continue."));
                }
                var json = Config.GetSection("input:imageJob").Value;
                if (json == null) { return; }
                var job = JsonConvert.DeserializeObject<ImageJob>(json);
                StorageService.Job = job;
                var bytes = StorageService.FetchImage();
                DispatchService.Job = job;
                var reports = DispatchService.DispatchAll(bytes);
                // TODO Refactor so that the processing is either one and only one,
                // TODO Or has the ability to specify an order and those processors are
                // TODO chained together
                var processedBytes = reports.Values.FirstOrDefault(r => r.IsSuccess)?.ProcessedBytes;
                StorageService.SaveImage(processedBytes);
                //Update the Appsync record
                AppSyncService.Job = job;
                await AppSyncService.MarkAsDone();
            }
            catch (Exception e)
            {
                Console.Error.WriteLine($"Error while dispatching: {e.ToString()}");
                await Task.FromException(e);
            }
            await Task.CompletedTask;
            AppLifetime.StopApplication();
        }
    }
}
