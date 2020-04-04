using System;
using System.IO;

namespace job_scheduler
{
    public class Scheduler
    {
        private IStorageService StorageService { get; }

        public Scheduler(IStorageService storageService)
        {
            StorageService = storageService;
        }

        public void Run(ImageJob job)
        {
            try
            {
                Console.WriteLine("I'm in Run!");
                StorageService.Job = job;
                var bytes = StorageService.FetchImage();
                // Grab the filters and find out where to send the bytes

            }
            catch (Exception e)
            {
                Console.Error.Write(e);
            }
        }
    }
}
