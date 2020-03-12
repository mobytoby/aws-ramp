# This is a multi-stage build.

# build stage
FROM golang:1.14 AS builder
WORKDIR /go/src/github.com/mobytoby/photo-api
COPY main.go .
RUN go get -d -v
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o app .

# final stage
FROM alpine:latest
WORKDIR /root/
COPY --from=builder /go/src/github.com/mobytoby/photo-api/app .

# Metadata params
ARG VERSION
ARG BUILD_DATE
ARG VCS_URL
ARG VCS_REF
ARG NAME
ARG VENDOR

# Metadata
LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.name=$NAME \
      org.label-schema.description="Photo Gallery Storage API" \
      org.label-schema.url="https://github.com/mobytoby" \
      org.label-schema.vcs-url=https://github.com/mobytoby/$VCS_URL \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.vendor=$VENDOR \
      org.label-schema.version=$VERSION \
      org.label-schema.docker.schema-version="1.0" \
      org.label-schema.docker.cmd="docker run --rm -p 8080:80 mobytoby/photo-storage-api"

CMD ["./app"]
EXPOSE 3001