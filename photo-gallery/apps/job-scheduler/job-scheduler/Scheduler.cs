using job_scheduler.Settings;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace job_scheduler
{
    public class Scheduler : IHostedService
    {
        private IConfiguration Config { get; }
        private IStorageService StorageService { get; }
        private IDispatchService DispatchService { get; }


        public Scheduler(IConfiguration config, IStorageService storageService, IDispatchService dispatchService)
        {
            Config = config;
            StorageService = storageService;
            DispatchService = dispatchService;
            
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            try
            {
                ImageJob job = null;//Get from command line?
                StorageService.Job = job;
                var bytes = StorageService.FetchImage();
                DispatchService.DispatchAll(bytes);

            }
            catch (Exception e)
            {
                Console.Error.Write(e);
            }
            return null;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }
    }
}
