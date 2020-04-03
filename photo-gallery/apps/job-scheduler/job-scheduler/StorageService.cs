using System;
using System.IO;
using System.Threading.Tasks;
using Amazon;
using Amazon.S3;
using Amazon.S3.Model;

namespace job_scheduler
{
    public interface IStorageService
    {
        ImageJob Job { set; }
        Task<byte[]> FetchImage();
        void FetchImage(string foo);
    }

    public class StorageService : IStorageService
    {
        private static readonly RegionEndpoint bucketRegion = RegionEndpoint.USWest2;
        private ImageJob _job;
        public StorageService()
        {
        }

        public ImageJob Job
        {
            set {
                _job = value;
            }
        }

        public Task<byte[]> FetchImage()
        {
            return null;
        }

        public async void FetchImage(string foo)
        {
            if (_job == null)
            {
                return;
            }
            // Create a client
            AmazonS3Client client = new AmazonS3Client(bucketRegion);
            var request = new ListObjectsV2Request
            {
                BucketName = "photo-gallery-web61757808498d458fbc8a9b5a898aebweb-dev",

            };
            var buckets = await client.ListObjectsV2Async(request);
            Console.Write(buckets);
            // Create a GetObject request
            //GetObjectRequest request = new GetObjectRequest
            //{
            //    BucketName = "SampleBucket",
            //    Key = "Item1"
            //};

            // Issue request and remember to dispose of the response
            //var client = new AmazonS3Client(bucketRegion);
            //GetObjectRequest request = new GetObjectRequest
            //{
            //    BucketName = BucketName,
            //    Key = Key
            //};
            //GetObjectResponse response = client.GetObjectAsync(request).Wait();
            //using ()
            //using (Stream responseStream = response.ResponseStream)
            //{
            //    var ms = new MemoryStream();
            //    responseStream.CopyTo(ms);
            //    return ms.ToArray();
            //}
        }

        public string BucketName {
            get
            {
                var url = _job.ImageUrl;
                //https://photo-gallery-web61757808498d458fbc8a9b5a898aebweb-dev.s3.us-west-2.amazonaws.com/private/us-west-2%3Ab393c4d1-d031-4b7f-81d9-68419aa35276/image/IMG_2953.jpg
                //Strip https:// = 8
                var sub = url.Substring(8);
                var sqSub = sub.Substring(0, sub.IndexOf('/'));
                return sqSub.Substring(0, sqSub.IndexOf('.'));
            }
        }

        public string Key
        {
            get
            {
                var url = _job.ImageUrl;
                var sub = url.Substring(8);
                return sub.Substring(sub.IndexOf('/'));
            }
        }
    }
}
