﻿using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Processing;

namespace Polaroid.Controllers
{
  [ApiController]
    [Route("/")]
    public class PolaroidController : ControllerBase
    {
        private ILogger<PolaroidController> Logger { get; }

        public PolaroidController(ILogger<PolaroidController> logger)
        {
            Logger = logger;
        }

        [HttpGet]
        public string Get()
        {
            return "Welcome to the polaroid API";
        }

        [HttpGet]
        [Route("ping")]
        public string GetPing() {
            return "pong";
        }

        [HttpPost]
        public async Task<IActionResult> Post()
        {
            Logger.LogInformation($"Polaroid received {Request.ContentLength} bytes.");
            using (var inputStream = new MemoryStream())
            using (var outputStream = new MemoryStream())
            {
                await Request.Body.CopyToAsync(inputStream);
                var bytes = inputStream.ToArray();
                var image = Image.Load(bytes, out IImageFormat format);
                image.Mutate(ctx => ctx.Polaroid());
                image.Save(outputStream, format);
                Logger.LogInformation($"Transformed. Returning {outputStream.Length} bytes.");
                return File(outputStream.ToArray(), format.MimeTypes.First());
            }
        }
    }
}
