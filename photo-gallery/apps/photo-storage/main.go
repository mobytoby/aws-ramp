package main

import (
	"bytes"
	"io"
	"log"
	"mime/multipart"
	"net/http"

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
	router.POST("/upload/:bucketId", func(c *gin.Context) {
		// single file
		bucketID := c.Param("bucketId")
		file, err := c.FormFile("file")
		check(err)
		log.Println(file.Filename, bucketID)
		sess, err := session.NewSession(&aws.Config{Region: aws.String("us-west-2")})
		res, err := uploadFile(sess, file, bucketID)
		check(err)
		c.JSON(http.StatusOK, res)
	})

	router.Run(":8080")
}

func check(e error) {
	if e != nil {
		panic(e)
	}
}

func uploadFile(session *session.Session, file *multipart.FileHeader, bucket string) (*s3.PutObjectOutput, error) {
	f, err := file.Open()

	defer f.Close()
	check(err)
	buf := bytes.NewBuffer(nil)
	_, err = io.Copy(buf, f)
	check(err)

	return s3.New(session).PutObject(&s3.PutObjectInput{
		Bucket:               aws.String(bucket),
		Key:                  aws.String(file.Filename),
		ACL:                  aws.String("private"),
		Body:                 bytes.NewReader(buf.Bytes()),
		ContentLength:        aws.Int64(file.Size),
		ContentType:          aws.String(http.DetectContentType(buf.Bytes())),
		ContentDisposition:   aws.String("attachment"),
		ServerSideEncryption: aws.String("AES256"),
	})
}
