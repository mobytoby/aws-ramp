using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Dispatcher.Settings;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Dispatcher.Controllers
{
  [ApiController]
  [Route("/")]
  public class ImageJobController : ControllerBase
  {
    private ILogger<ImageJobController> Logger { get; }
    private IDispatcherService Service { get; }
    private IOptions<ProcessingSettings> Options { get; }
    public ImageJobController(ILogger<ImageJobController> logger, IDispatcherService service, IOptions<ProcessingSettings> options)
    {
      Logger = logger;
      Service = service;
      Options = options;
    }

    [HttpPost]
    public IActionResult Post(ImageJob job)
    {
      if (job is null)
      {
        throw new ArgumentNullException(nameof(job));
      }

      Service.DispatchAsync(job);
      return Ok();
    }

    [HttpGet]
    public string Get()
    {
      return "Welcome to the ImageJob API";
    }

    [HttpGet()]
    [Route("processor")]
    public async Task<string> Get([FromQuery(Name="name")]string name) 
    {
        var settings = Options.Value;
        var url = $"{settings.Method}://{name}.{settings.Namespace}";
        if (!string.IsNullOrEmpty(settings.Port))
        {
          url += $":{settings.Port}";
        }
        if (!string.IsNullOrEmpty(settings.Path))
        {
          url += $"/{settings.Path}";
        }
        var client = new HttpClient();
        Logger.LogInformation($"Fetching from {url}");
        var response = client.GetAsync(new Uri(url)).Result;
        return await response.Content.ReadAsStringAsync();
    }

    [HttpGet()]
    [Route("processor/endpoint")]
    public string GetEndpoint([FromQuery(Name = "name")]string name)
    {
      var settings = Options.Value;
      var url = $"{settings.Method}://{name}.{settings.Namespace}";
      if (!string.IsNullOrEmpty(settings.Port))
      {
        url += $":{settings.Port}";
      }
      if (!string.IsNullOrEmpty(settings.Path))
      {
        url += $"/{settings.Path}";
      }
      return url;
    }


    [HttpGet]
    [Route("ping")]
    public string GetPing()
    {
      return "pong";
    }
  }
}
