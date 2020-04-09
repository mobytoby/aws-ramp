# Job Scheduler

## Overview

The `job-scheduler` is a .NET core app that handles the orchestration of incoming jobs between the various configured image processing services. Currently this is done as a switch statement in the `DispatchService.cs` class. If time permits, I'll refactor this into a different table within Dynamo and use the GraphQL service to front it with an API.

### Docker

A [dockerfile](./Dockerfile) and [makefile](./Makefile) are included for building the image. If uploading to ECR, include your `$ECR_REPO` env variable before tagging or pushing. I.e.

`ECR_REPO=xxxxxxxxxxx.dkr.ecr.us-west-2.amazonaws.com/job-scheduler make tag`

