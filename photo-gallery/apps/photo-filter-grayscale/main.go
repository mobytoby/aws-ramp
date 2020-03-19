package main

import (
	"bytes"
	"errors"
	"image"
	"image/gif"
	"image/jpeg"
	"image/png"
	"io/ioutil"
	"log"
	"mime/multipart"
	"net/http"

	"github.com/disintegration/imaging"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()
	router.Use(cors.Default())

	api := router.Group("/api")

	api.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "Welcome to the grey scale filter API")
	})

	api.GET("/healthcheck", func(c *gin.Context) {
		c.JSON(http.StatusOK, "OK")
	})

	api.POST("/greyscale", func(c *gin.Context) {
		file, err := c.FormFile("file")
		check(err)
		greyscale(c.Writer, file)
	})

	router.Run(":3002")
}

func greyscale(w http.ResponseWriter, file *multipart.FileHeader) {
	const MaxMemory = 20 * 1024 * 1024 // 20MB
	f, err := file.Open()
	defer f.Close()
	body, err := ioutil.ReadAll(f)
	if err != nil {
		log.Printf("Error reading body: %v", err)
		http.Error(w, "can't read body", http.StatusBadRequest)
		return
	}

	reader := bytes.NewReader(body)

	_, format, err := image.DecodeConfig(reader)

	if err != nil {
		log.Println("Error detecting format:", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	reader.Seek(0, 0)
	decoded, err := imaging.Decode(reader)

	if err != nil {
		log.Println("Error decoding photo:", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	log.Printf("Converting image to greyscale")
	img := imaging.Grayscale(decoded)

	switch format {
	case "jpeg":
		err = jpeg.Encode(w, img, nil)
	case "png":
		err = png.Encode(w, img)
	case "gif":
		err = gif.Encode(w, img, nil)
	default:
		err = errors.New("Unsupported file type")
	}
}

func check(e error) {
	if e != nil {
		panic(e)
	}
}
