using job_scheduler.Settings;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
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
        private IConfiguration Configuration { get; }
        private IOptions<Processing> PConfig { get; }
        public ImageJob Job { private get; set; }
        private string path { get; set; }

        public DispatchService(IConfiguration configuration, IOptions<Processing> pConfig)
        {
            Configuration = configuration;
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
            // TODO put this in another service that maps Job Names to service endpoints
            switch(filter)
            {
                case Constants.GREYSCALE:
                    var processing = PConfig.Value;
                    var url = processing.Greyscale.BaseUri;
                    path = processing.Greyscale.Path;
                    return new PhotoProcesingService
                    {
                        ProcessName = filter,
                        Endpoint = new Uri(url),
                    };
            }
            return null;
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
            client.DefaultRequestHeaders.Accept.Add(
                    new MediaTypeWithQualityHeaderValue("application/octet-stream"));

            var byteArrayContent = new ByteArrayContent(bytes);
            byteArrayContent.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
            try
            {
                var result = await client.PostAsync("", byteArrayContent);
                if (!result.IsSuccessStatusCode)
                {
                    report.Errors = result.ReasonPhrase;
                }
                else
                {
                    var byteStream = new MemoryStream();
                    await result.Content.CopyToAsync(byteStream);
                    report.ProcessedBytes = byteStream.ToArray();
                }
                report.IsDone = true;
                report.IsSuccess = true;
            }
            catch (Exception e)
            {
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
