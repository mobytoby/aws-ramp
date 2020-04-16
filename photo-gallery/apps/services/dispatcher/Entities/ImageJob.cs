using System;
using Newtonsoft.Json;

namespace Dispatcher
{

  public class ImageJob
  {
    [JsonProperty(PropertyName = "createdAt")]
    public DateTimeOffset CreatedAt { get; set; }

    [JsonProperty(PropertyName = "updatedAt")]
    public DateTimeOffset UpdatedAt { get; set; }

    [JsonProperty(PropertyName = "imageUrl")]
    public string ImageUrl { get; set; }

    [JsonProperty(PropertyName = "name")]
    public string Name { get; set; }

    [JsonProperty(PropertyName = "filters")]
    public string[] Filters { get; set; }

    [JsonProperty(PropertyName = "processor")]
    public string Processor { get; set; }

    [JsonProperty(PropertyName = "id")]
    public Guid Id { get; set; }

    [JsonProperty(PropertyName = "isDone")]
    public bool? IsDone { get; set; }

    public string BucketName
    {
      get
      {
        if (ImageUrl == null) { return null; }
        //https://photo-gallery-web61757808498d458fbc8a9b5a898aebweb-dev.s3.us-west-2.amazonaws.com/private/us-west-2%3Ab393c4d1-d031-4b7f-81d9-68419aa35276/image/IMG_2953.jpg
        //Strip https:// = 8
        var sub = ImageUrl.Substring(8);
        var sqSub = sub.Substring(0, sub.IndexOf('/'));
        return sqSub.Substring(0, sqSub.IndexOf('.'));
      }
    }

    public string Key
    {
      get
      {
        if (ImageUrl == null) { return null; }
        var sub = ImageUrl.Substring(8);
        return Uri.UnescapeDataString(sub.Substring(sub.IndexOf('/') + 1));
      }
    }

  }
}