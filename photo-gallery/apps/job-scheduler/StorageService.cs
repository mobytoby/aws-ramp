﻿using System;
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
        byte[] FetchImage();
        void SaveImage(byte[] processedBytes);
    }

    public class StorageService : IStorageService
    {
        private static readonly RegionEndpoint bucketRegion = RegionEndpoint.USWest2;

        public ImageJob Job
        {
            private get; set;
        }

        public byte[] FetchImage()
        {
            if (Job == null)
            {
                return null;
            }

            var client = new AmazonS3Client(bucketRegion);
            GetObjectRequest request = new GetObjectRequest
            {
                BucketName = BucketName,
                Key = Key
            };
            using (GetObjectResponse response = client.GetObjectAsync(request).Result)
            using (Stream responseStream = response.ResponseStream)
            {
                var ms = new MemoryStream();
                responseStream.CopyTo(ms);
                return ms.ToArray();
            }
        }

        // TODO Pass streams around, vs. bytes
        public void SaveImage(byte[] processedBytes)
        {
            if (Job == null)
            {
                return;
            }
            if (processedBytes == null || processedBytes.Length == 0)
            {
                return;
            }
            var inputStream = new MemoryStream(processedBytes);
            //Issue request and remember to dispose of the response
            var client = new AmazonS3Client(bucketRegion);
            PutObjectRequest request = new PutObjectRequest
            {
                BucketName = BucketName,
                Key = Key,
                InputStream = inputStream,
            };
            _ = client.PutObjectAsync(request).Result;
        }

        public string BucketName {
            get
            {
                var url = Job.ImageUrl;
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
                var url = Job.ImageUrl;
                var sub = url.Substring(8);
                return Uri.UnescapeDataString(sub.Substring(sub.IndexOf('/')+1));
            }
        }
    }
}