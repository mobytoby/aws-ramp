﻿using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Processing;

namespace Greyscale.Controllers
{
    [ApiController]
    [Route("/")]
    public class GreyscaleController : ControllerBase
    {
        private readonly ILogger<GreyscaleController> _logger;

        public GreyscaleController(ILogger<GreyscaleController> logger)
        {
            _logger = logger;
        }

        [HttpGet]
        public string Get()
        {
            return "Welcome to the greyscale API";
        }

        [HttpGet]
        [Route("ping")]
        public string GetPing() {
            return "pong";
        }

        [HttpPost]
        public async Task<IActionResult> Post()
        {
            using (var inputStream = new MemoryStream())
            using (var outputStream = new MemoryStream())
            {
                await Request.Body.CopyToAsync(inputStream);
                var bytes = inputStream.ToArray();
                var image = Image.Load(bytes, out IImageFormat format);
                image.Mutate(x => x.Grayscale());
                image.Save(outputStream, format);
                return File(outputStream.ToArray(), format.MimeTypes.First());
            }
        }
    }
}
