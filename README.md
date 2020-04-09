# AWS Ramp Project

## Overview

This project is a microservices based web application. The [client app](./photo-gallery/apps/web-client/README.md) is written in Angular and is a simple photo gallery app. After uploading a file to the gallery, you're able to apply an _**extremely computationally-intensive photo processing filter**_  (currently only 1--greyscale) to the image. The filters are (again, at this writing only 1) is hosted in an ECS Cluster is invoked via Lambda function listening to a DynamoDB Stream (details below). Once the image processing is complete, an AppSync GraphQL mutation is invoked, which triggers a subscription resulting in client notification and a reload of the page.

### Front End

The [web-client](./photo-gallery/apps/web-client) is a very simple Angular app that makes pretty heavy use of the [AWS Amplify SDK](https://aws.amazon.com/amplify/) for a number of features:

* AuthZ/N using Cognito user pools.
* Storage of photos using the [Amplify Storage API](https://aws-amplify.github.io/docs/js/storage)
* Pushing of job-tracking data into DynamoDB, and Realtime (websocket) notifications of job completion by way of the [Amplify AppSync GraphQL API](https://aws-amplify.github.io/docs/js/api)

### Back End

###### _Note: Infrastructure as code (CF or CDK) is forthcoming_

The backend consists of a number of different AWS Services, working in concert:

#### DynamoDB (by way of the Amplify API recipe)

The database currently has only one table which tracks [`ImageJob`s](./photo-gallery/apps/web-client/amplify/backend/api/photogalleryapi/schema.graphql). Jobs are inserted with no value for `IsDone`. Once processing is complete, the `[job-scheduler](./photo-gallery/apps/job-scheduler/DispatchService.cs) makes an AppSync call to mutate the correlated job and mark as done. This triggers a subscription which web-clients can listen to for an update.

#### Lambda Function

[This function](./photo-gallery/lambda/ProcessDynamoDbRecords/src/index.ts) listens to the record stream on the DynamoDB. When a new item is created, it fires up an [ecs.Task](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definitions.html) using pertinent information from the incoming `ImageJob` (passed as the event to the function) as well configuration information stored in SSM Parameter Store. 

#### ECS Cluster

* Scheduler Task  
    The [`job-scheduler`](/photo-gallery/apps/job-scheduler/README.md) runs in a container in the ECS Cluster, though it does not run as a service. It's invoked as an ECS Task meaning it's fairly short-lived. The task comes to life via the [`ecs.RunTask()`](https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_RunTask.html) API. The scheduler task is passed the `JSON`ified `ImageJob` as an input upon startup. From here, it fetches the image from `S3`, sends the bytes to the microservices configured in the job, and ultimately deposits the processed image back in S3, clobbering the original. Afterwards, it marks the job as done in Dynamo using the GraphQL API.
* Image processing ECS Services  
    Currently there's only a greyscale implementation. It too runs in a container configured as an ECS Service.
