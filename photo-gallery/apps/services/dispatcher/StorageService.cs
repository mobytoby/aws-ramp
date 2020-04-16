using System.IO;
using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Logging;

namespace Dispatcher
{
  public interface IStorageService
  {
    byte[] FetchImage(ImageJob job);
    void SaveImage(ImageJob job, byte[] processedBytes);
  }

  public class StorageService : IStorageService
  {
    private static readonly RegionEndpoint bucketRegion = RegionEndpoint.USWest2;
    private ILogger<StorageService> Logger { get; }
    public StorageService(ILogger<StorageService> logger)
    {
      this.Logger = logger;
    }

    public byte[] FetchImage(ImageJob job)
    {
      if (job == null)
      {
        Logger.LogError("Job is null. Unable to proceed.");
        return null;
      }

      var client = new AmazonS3Client(bucketRegion);
      GetObjectRequest request = new GetObjectRequest
      {
        BucketName = job.BucketName,
        Key = job.Key
      };
      using (GetObjectResponse response = client.GetObjectAsync(request).Result)
      using (Stream responseStream = response.ResponseStream)
      {
        var ms = new MemoryStream();
        responseStream.CopyTo(ms);
        return ms.ToArray();
      }
    }

    // TODO Pass streams around, vs. bytes
    public void SaveImage(ImageJob job, byte[] processedBytes)
    {
      if (job == null)
      {
        Logger.LogError("Job is null.  Unabele to save image");
        return;
      }
      if (processedBytes == null || processedBytes.Length == 0)
      {
        Logger.LogError("Processed bytes is null. Nothing to Save");
        return;
      }
      Logger.LogInformation("Uploading processed image back to S3");
      var inputStream = new MemoryStream(processedBytes);
      //Issue request and remember to dispose of the response
      var client = new AmazonS3Client(bucketRegion);
      PutObjectRequest request = new PutObjectRequest
      {
        BucketName = job.BucketName,
        Key = job.Key,
        InputStream = inputStream,
      };
      var result = client.PutObjectAsync(request).Result;
      Logger.LogInformation($"Finished uploading. Result: {result}");
    }
  }
}