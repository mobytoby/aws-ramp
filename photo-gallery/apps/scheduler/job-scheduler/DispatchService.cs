using job_scheduler.Settings;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;

namespace job_scheduler
{
  public static class Constants
    {
        public const string GREYSCALE = "greyscale";
    }
    public interface IDispatchReport
    {
        bool IsDone { get; set; }
        bool IsSuccess { get; set; }
        string Errors { get; set; }
        string ProcessName { get; }
        byte[] ProcessedBytes { get; set; }
    }

    public interface IDispatchService
    {
        ImageJob Job { set; }
        Dictionary<string, IDispatchReport> DispatchAll(byte[] bytes);
    }

    public interface IProcessingService
    {
        string ProcessName { get; set; }
        Uri Endpoint { get; set; }
        Task<IDispatchReport> Process(string path, byte[] bytes);
    }

    public class DispatchService : IDispatchService
    {
        private IOptions<Processing> PConfig { get; }
        public ImageJob Job { private get; set; }
        private string path { get; set; }

        public DispatchService(IOptions<Processing> pConfig)
        {
            PConfig = pConfig;
        }

        public Dictionary<string, IDispatchReport> DispatchAll(byte[] bytes)
        {
            if (Job == null) { return null; }
            var reports = new Dictionary<string, IDispatchReport>();
            foreach (var filter in Job.Filters)
            {
                var service = Lookup(filter);
                if (service == null) 
                { 
                    Console.Error.WriteLine($"Requested processing on {filter} service, but found no configuration");
                    var report = DispatchReport.Create(filter);
                    report.IsDone = true;
                    report.IsSuccess = false;
                    report.Errors = $"Found no configuration data for the {filter} service. Unable to proceed";
                }
                else
                {
                    reports.Add(filter, service.Process(path, bytes).Result);
                }
            }
            return reports;
        }

        protected IProcessingService Lookup(string filter)
        {
            IProcessingService service = null;
            // TODO put this in another service that maps Job Names to service endpoints
            switch(filter)
            {
                case Constants.GREYSCALE:
                    var processing = PConfig.Value;
                    var url = processing.greyscale.BaseUri;
                    service = new PhotoProcesingService
                    {
                        ProcessName = filter,
                        Endpoint = new Uri(url),
                    };
                    break;
            }
            return service;
        }
    }

    public class PhotoProcesingService : IProcessingService
    {
        public string ProcessName { get; set; }

        public Uri Endpoint
        {
            get; set;
        }

        public async Task<IDispatchReport> Process(string path, byte[] bytes)
        {
            var report = DispatchReport.Create(ProcessName);
            var client = new HttpClient
            {
                BaseAddress = Endpoint
            };

            client.DefaultRequestHeaders.Accept.Clear();

            var byteArrayContent = new StreamContent(new MemoryStream(bytes));
            try
            {
                Console.WriteLine($"Sending {bytes.Length} bytes to {client.BaseAddress}/{path}");
                var result = await client.PostAsync(path, byteArrayContent);
                if (!result.IsSuccessStatusCode)
                {
                    Console.Error.Write($"Error sending content. Server returned {result.StatusCode}:{result.ReasonPhrase}");
                    report.Errors = result.ReasonPhrase;
                }
                else
                {
                    var byteStream = new MemoryStream();
                    await result.Content.CopyToAsync(byteStream);
                    report.ProcessedBytes = byteStream.ToArray();
                    Console.WriteLine($"Completed send. Received {report.ProcessedBytes.Length} bytes in response");
                }
                report.IsDone = true;
                report.IsSuccess = true;
            }
            catch (Exception e)
            {
                Console.Error.WriteLine(e);
                report.Errors = e.Message;
                report.IsDone = true;
                report.IsSuccess = false;
            }

            return report;
        }
    }

    public class DispatchReport: IDispatchReport
    {
        public static DispatchReport Create(string processName)
        {
            return new DispatchReport
            {
                ProcessName = processName
            };
        }
        private DispatchReport() {}

        public bool IsDone { get; set; }
        public bool IsSuccess { get; set; }
        public string Errors { get; set;}
        public string ProcessName { get; private set; }
        public byte[] ProcessedBytes { get; set; }

    }
}
