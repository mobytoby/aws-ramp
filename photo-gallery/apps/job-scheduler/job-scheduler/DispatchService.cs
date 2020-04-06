using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
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
        Task<IDispatchReport> Process(byte[] bytes);
    }

    public class DispatchService : IDispatchService
    {
        private IConfiguration Configuration { get; }
        public ImageJob Job { private get; set; }

        public DispatchService(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public Dictionary<string, IDispatchReport> DispatchAll(byte[] bytes)
        {
            if (Job == null) { return null; }
            var reports = new Dictionary<string, IDispatchReport>();
            foreach (var filter in Job.Filters)
            {
                var service = Lookup(filter);
                reports.Add(filter, service.Process(bytes).Result);
            }
            return null;
        }

        protected IProcessingService Lookup(string filter)
        {
            // TODO put this in another service that maps Job Names to service endpoints
            switch(filter)
            {
                case Constants.GREYSCALE:
                    var greyscaleSection = Configuration.GetSection("Processing").GetSection("Greyscale");
                    var url = greyscaleSection.GetValue<string>("Location");
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

        public async Task<IDispatchReport> Process(byte[] bytes)
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

            var result = await client.PostAsync(
                    "api/SomeData/Incoming", byteArrayContent);

            result.EnsureSuccessStatusCode();
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
