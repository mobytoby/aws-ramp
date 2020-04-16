using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Dispatcher
{

  public interface IDispatcherService
  {
    public Task DispatchAsync(ImageJob job);
  }
  public class DispatcherService : IDispatcherService
  {
    private ILogger<DispatcherService> Logger { get; }
    private IStorageService StorageService { get; }
    private IProcessingService ProcessingService { get; }
    private IAppSyncService AppSyncService { get; }
    
    public DispatcherService(
        ILogger<DispatcherService> logger,
        IStorageService storageService,
        IProcessingService processingService,
        IAppSyncService appSyncService)
    {
      Logger = logger;
      StorageService = storageService;
      ProcessingService = processingService;
      AppSyncService = appSyncService;
    }

    public async Task DispatchAsync(ImageJob job)
    {
      /*
       * Standard script:
       * 1 - Fetch Image from s3
       * 2 - Send to processor, receive result
       * 3 - Clobber existing s3 object
       * 4 - Notify GraphyQL API that we're done 
       */
      try
      {
        var bytes = StorageService.FetchImage(job);
        var processedBytes = await ProcessingService.ProcessAsync(job, bytes);
        StorageService.SaveImage(job, processedBytes);
        await AppSyncService.MarkAsDone(job);
      }
      catch (Exception ex)
      {
        Logger.LogError(ex, "Error while dispatching image processing");
        throw;
      }
    }
  }
}