using System;
using Newtonsoft.Json;

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
