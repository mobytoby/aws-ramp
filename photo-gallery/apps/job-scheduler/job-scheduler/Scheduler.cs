using System;
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
                StorageService.FetchImage("foo");
            }
            catch (Exception e)
            {
                Console.Error.Write(e);
            }



        }
    }
}
