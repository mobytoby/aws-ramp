using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Dispatcher.Controllers
{
    [ApiController]
    [Route("/")]
    public class ImageJobController : ControllerBase
    {
        private IDispatcherService Service{ get; }
        public ImageJobController(IDispatcherService service) {
            Service = service;
        }
        private ILogger<ImageJobController> Logger { get; }

        public ImageJobController(ILogger<ImageJobController> logger)
        {
            Logger = logger;
        }

    [HttpPost]
    public IActionResult Post(ImageJob job)
    {
      if (job is null)
      {
        throw new ArgumentNullException(nameof(job));
      }

      Service.Dispatch(job);
      return Ok();
    }

    [HttpGet]
        public string Get()
        {
            return "Welcome to the ImageJob API";
        }

        [HttpGet]
        [Route("ping")]
        public string GetPing() {
            return "pong";
        }
    }
}
