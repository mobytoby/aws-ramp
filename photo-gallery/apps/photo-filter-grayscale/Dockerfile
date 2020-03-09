# build stage
FROM golang:1.14 AS builder
WORKDIR /app/
COPY . .
RUN go env -w GOPROXY=direct
RUN go env -w GOPRIVATE=*.github.com
RUN CGO_ENABLED=0 go build -o app .

# final stage
FROM scratch
COPY --from=builder /app .

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
      org.label-schema.description="Grayscale Photo Filter" \
      org.label-schema.url="https://github.com/mobytoby" \
      org.label-schema.vcs-url=https://github.com/mobytoby/$VCS_URL \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.vendor=$VENDOR \
      org.label-schema.version=$VERSION \
      org.label-schema.docker.schema-version="1.0" \
      org.label-schema.docker.cmd="docker run --rm -p 8080:80 photo-filter-grayscale"

CMD ["./app"]
EXPOSE 3002