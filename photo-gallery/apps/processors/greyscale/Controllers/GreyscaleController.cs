using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Processing;

namespace Greyscale.Controllers
{
  [ApiController]
    [Route("/")]
    public class GreyscaleController : ControllerBase
    {
        private ILogger<GreyscaleController> Logger { get; }

        public GreyscaleController(ILogger<GreyscaleController> logger)
        {
            Logger = logger;
        }

        [HttpGet]
        public string Get()
        {
            return "Welcome to the greyscale API2";
        }

        [HttpGet]
        [Route("ping")]
        public string GetPing() {
            return "pong";
        }

        [HttpPost]
        public async Task<IActionResult> Post()
        {
            Logger.LogInformation($"Received {Request.ContentLength} bytes.");
            using (var inputStream = new MemoryStream())
            using (var outputStream = new MemoryStream())
            {
                await Request.Body.CopyToAsync(inputStream);
                var bytes = inputStream.ToArray();
                var image = Image.Load(bytes, out IImageFormat format);
                image.Mutate(ctx => ctx.Grayscale());
                image.Save(outputStream, format);
                Logger.LogInformation($"Transformed. Returning {outputStream.Length} bytes.");
                return File(outputStream.ToArray(), format.MimeTypes.First());
            }
        }
    }
}
