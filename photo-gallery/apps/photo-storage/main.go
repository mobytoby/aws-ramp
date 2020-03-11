package main

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()

	router.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "Welcome to the photo storage API")
	})

	router.GET("/healthcheck", func(c *gin.Context) {
		c.JSON(http.StatusOK, "OK")
	})

	// Set a lower memory limit for multipart forms (default is 32 MiB)
	router.MaxMultipartMemory = 8 << 20 // 8 MiB
	router.POST("/bucket/:bucketId/photos/:photoName", func(c *gin.Context) {
		// single file
		bucketID := c.Param("bucketId")
		photoName := c.Param("photoName")
		file, err := c.FormFile("file")
		check(err)
		sess, err := session.NewSession(&aws.Config{Region: aws.String("us-west-2")})
		res, err := uploadFile(sess, file, bucketID, photoName)
		check(err)
		c.JSON(http.StatusOK, res)
	})

	router.GET("/bucket/:bucketId/photos", func(c *gin.Context) {
		bucket := c.Param("bucketId")
		svc := s3.New(
			session.Must(session.NewSession()),
			aws.NewConfig().WithRegion("us-west-2"),
		)
		res, err := svc.ListObjects(&s3.ListObjectsInput{
			Bucket: aws.String(bucket),
		})
		check(err)
		urls := make([]string, len(res.Contents))
		check(err)
		for i := 0; i < len(res.Contents); i++ {
			key := res.Contents[i].Key
			urlStr, err := getPresignedURL(svc, bucket, key)
			check(err)
			urls[i] = urlStr
		}
		c.JSON(http.StatusOK, urls)
	})

	router.GET("/bucket/:bucketId/photos/:photoName", func(c *gin.Context) {
		bucket := c.Param("bucketId")
		key := c.Param("photoName")
		svc := s3.New(
			session.Must(session.NewSession()),
			aws.NewConfig().WithRegion("us-west-2"),
		)
		url, err := getPresignedURL(svc, bucket, &key)
		check(err)
		c.JSON(http.StatusOK, url)
	})

	router.Run(":8080")
}

func check(e error) {
	fmt.Println(e)
	if e != nil {
		panic(e)
	}
}

func getPresignedURL(svc *s3.S3, bucket string, key *string) (string, error) {
	req, _ := svc.GetObjectRequest(&s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    key,
	})
	return req.Presign(15 * time.Minute)
}

func uploadFile(session *session.Session, file *multipart.FileHeader, bucket string, photoName string) (*s3.PutObjectOutput, error) {
	f, err := file.Open()
	defer f.Close()
	check(err)
	buf := bytes.NewBuffer(nil)
	_, err = io.Copy(buf, f)
	check(err)

	return s3.New(session).PutObject(&s3.PutObjectInput{
		Bucket:               aws.String(bucket),
		Key:                  aws.String(photoName),
		ACL:                  aws.String("private"),
		Body:                 bytes.NewReader(buf.Bytes()),
		ContentLength:        aws.Int64(file.Size),
		ContentType:          aws.String(http.DetectContentType(buf.Bytes())),
		ContentDisposition:   aws.String("attachment"),
		ServerSideEncryption: aws.String("AES256"),
	})
}
