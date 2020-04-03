using System;
using Newtonsoft.Json;

/*
 * {
    "createdAt": "2020-04-03T17:06:25.796Z",
    "__typename": "ImageJob",
    "imageUrl": "https://photo-gallery-web61757808498d458fbc8a9b5a898aebweb-dev.s3.us-west-2.amazonaws.com/private/us-west-2%3Ab393c4d1-d031-4b7f-81d9-68419aa35276/image/IMG_2953.jpg",
    "name": "iytiiyerter",
    "filters": [
        "greyscale",
        "cartoon",
        "saturate"
    ],
    "id": "0fba9262-abac-44f4-b738-9b45a4da8645",
    "updatedAt": "2020-04-03T17:06:25.796Z"
}
*/
namespace job_scheduler
{
    public class ImageJob
    {
        [JsonProperty(PropertyName = "createdAt")]
        public DateTimeOffset CreatedAt { get; set; }

        [JsonProperty(PropertyName = "updatedAt")]
        public DateTimeOffset UpdatedAt{ get; set; }

        [JsonProperty(PropertyName = "imageUrl")]
        public string ImageUrl { get; set; }

        [JsonProperty(PropertyName = "name")]
        public string Name { get; set; }

        [JsonProperty(PropertyName = "filters")]
        public string[] Filters { get; set; }

        [JsonProperty(PropertyName = "id")]
        public Guid Id { get; set; }

        [JsonProperty(PropertyName = "isDone")]
        public bool? IsDone { get; set; }

    }
}
