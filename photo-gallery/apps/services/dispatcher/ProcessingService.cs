using System;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using Dispatcher.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Dispatcher
{
  public interface IProcessingService
  {
    Task<byte[]> ProcessAsync(ImageJob job, byte[] bytes);
  }

  public class ProcessingService : IProcessingService
  {
    private ILogger<ProcessingService> Logger { get; }
    private IOptions<ProcessingSettings> Options { get; }
    public ProcessingService(ILogger<ProcessingService> logger, IOptions<ProcessingSettings> options)
    {
      Logger = logger;
      Options = options;
    }
    private ImageJob Job { get; set; }
    public async Task<byte[]> ProcessAsync(ImageJob job, byte[] bytes)
    {
      Job = job;
      MemoryStream outputStream = new MemoryStream();
      try
      {
        var client = new HttpClient();
        client.DefaultRequestHeaders.Accept.Clear();
        Logger.LogInformation($"Sending {bytes.Length} bytes to {GetEndpoint()}");
        var byteArrayContent = new StreamContent(new MemoryStream(bytes));
        var result = await client.PostAsync(GetEndpoint(), byteArrayContent);
        if (!result.IsSuccessStatusCode)
        {
          Logger.LogError($"Error sending content. Server returned {result.StatusCode}:{result.ReasonPhrase}");
        }
        else
        {
          await result.Content.CopyToAsync(outputStream);
          Logger.LogInformation($"Completed send. Received {outputStream.Length} bytes in response");
        }
      }
      catch (Exception e)
      {
        Logger.LogError(e, "Error while processing");
      }
      return outputStream.ToArray();
    }

    private Uri GetEndpoint()
    {
      // get
      // {
        if (Job == null)
        {
          throw new InvalidOperationException("Unable to continue. No job configured");
        }
        if (Options == null || Options.Value == null)
        {
          throw new InvalidOperationException("Unable to continue. Options not configured");
        }
        var settings = Options.Value;
        var url = $"{settings.Method}://{Job.Processor}.{settings.Namespace}";
        if (!string.IsNullOrEmpty(settings.Port))
        {
          url += $":{settings.Port}";
        }
        if (!string.IsNullOrEmpty(settings.Path))
        {
          url += $"/{settings.Path}";
        }
        return new Uri(url);
      // }
    }
  }
}