using job_scheduler.Settings;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace job_scheduler
{
    public class Scheduler : IHostedService
    {
        private IConfiguration Config { get; }
        private IOptions<Processing> ProcessingConfig { get; }
        private IOptions<input> InputConfig { get; }
        private IStorageService StorageService { get; }
        private IDispatchService DispatchService { get; }



        public Scheduler(IConfiguration configuration,
                         IStorageService storageService, 
                         IDispatchService dispatchService)
        {
            Config = configuration;
            StorageService = storageService;
            DispatchService = dispatchService;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            try
            {
                var json = Config.GetSection("input:imageJob").Value;
                if(json == null) { return null;  }
                var job = JsonConvert.DeserializeObject<ImageJob>(json);
                StorageService.Job = job;
                var bytes = StorageService.FetchImage();
                DispatchService.Job = job;
                var reports = DispatchService.DispatchAll(bytes);
                // TODO Refactor so that the processing is either one and only one,
                // TODO Or has the ability to specify an order and those processors are
                // TODO chained together
                var processedBytes = reports.Values.First(r => r.IsSuccess).ProcessedBytes;
                StorageService.SaveImage(processedBytes);

                // TODO Remove this
                var foo = "123";

            }
            catch (Exception e)
            {
                Console.Error.Write(e);
            }
            return Task.FromResult("Complete");
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            return Task.FromResult("Shutting down");
        }
    }
}
