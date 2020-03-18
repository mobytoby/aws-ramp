# AWS Ramp Project

## Overview

This project is a microservices based web application. The [client app](./photo-gallery/apps/web-client/README.md) is written in Angular and is a simple photo gallery app. When uploading a file to this gallery, you have the option of applying a (currently only 1) filter to the upload before it's uploaded to S3, and presented back on the gallery page.

The [storage API](./photo-gallery/apps/photo-storage/main.go) for this app is written in [go](https://golang.org) and exposes a few endpoints through which the web client uploads/displays photos. It also exposes a healthcheck endpoint for ECS orchestration.

The [photo filter API](./photo-gallery/apps/photo-filter-grayscale/main.go) service is also written in go and exposes two endpoints: one to grayscale images, and one that acts as a healthcheck.

## Development

For development, this entire stack can be brought up in `docker-compose` and only requires an S3 account for photo storage. Directions for doing so [are here](./photo-gallery/README.md)