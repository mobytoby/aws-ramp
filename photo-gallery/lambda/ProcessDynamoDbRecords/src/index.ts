
import "reflect-metadata";
import { DynamoDBStreamEvent } from "aws-lambda";
import { fromDb, Attributes } from "@shiftcoders/dynamo-easy";
import { ImageJob } from "./imagejob.model";
import { default as ECS } from "aws-sdk/clients/ecs";
import { default as SSM, GetParametersResult } from "aws-sdk/clients/ssm";
import { waterfall } from "async";

export const handler = async (event: DynamoDBStreamEvent): Promise<any> => {
  console.log('Processing Dynamo event', event)
  const ecs = new ECS({ region: 'us-west-2' });
  const ssm = new SSM({ region: 'us-west-2' });
  const allPromises: Promise<any>[] = event.Records
  .filter(record => record.eventName === 'INSERT')
  .map(record => {
    return new Promise((resolve, reject) => {
      console.log('Dynamo DB Record:', record.dynamodb);
      const newImage = record.dynamodb?.NewImage;
      if (!newImage) { return ""; }
      const job = fromDb(<Attributes>newImage, ImageJob);
      const jJob = JSON.stringify(job);
      const params = [
        '/photo-gallery/cluster',
        '/photo-gallery/taskDefinition',
        '/photo-gallery/subnets',
        '/photo-gallery/securityGroups',
        '/photo-gallery/appSyncApi',
        '/photo-gallery/apiKey',
      ];

      waterfall([
          function(callback: any) {
            ssm.getParameters({ Names: params, WithDecryption: true }, 
              (err: any, data: GetParametersResult) => {
                console.log('GetParameters Err:', err);
                console.log('GetParameters Data:', data);
                callback(err, data.Parameters);
              })
          },
          function(parameters: any, callback: any) {
            const params = {
              cluster: parameters.find((d: any) => d.Name == '/photo-gallery/cluster').Value,
              taskDefinition: parameters.find((d: any) => d.Name == '/photo-gallery/taskDefinition').Value,
              subnets: parameters.find((d: any) => d.Name == '/photo-gallery/subnets').Value.split(','),
              sgs: parameters.find((d: any) => d.Name == '/photo-gallery/securityGroups').Value.split(','),
              api: parameters.find((d: any) => d.Name == '/photo-gallery/appSyncApi').Value,
              apiKey: parameters.find((d: any) => d.Name == '/photo-gallery/apiKey').Value
            };
            console.log(params);
            ecs.runTask({
              cluster: params.cluster,
              launchType: "FARGATE",
              taskDefinition: params.taskDefinition,
              networkConfiguration: {
                awsvpcConfiguration: {
                  subnets: params.subnets,
                  assignPublicIp: "DISABLED",
                  securityGroups: params.sgs,
                }
              },
              overrides: {
                containerOverrides: [
                  { 
                    name: "job-scheduler",
                    environment: [
                      { name: 'PHOTOGALLERY_Processing__Greyscale__BaseUri', value: 'http://greyscale.mesh.local:3002' },
                      { name: 'PHOTOGALLERY_Processing__Greyscale__Path', value: 'greyscale' },
                      { name: 'PHOTOGALLERY_AppSync__ApiEndpoint', value: 'greyscale' },
                      { name: 'PHOTOGALLERY_AppSync__ApiKey', value: 'greyscale' },
                    ],
                    command: [`--input:imageJob=${jJob}`]
                  }
                ]
              }
            }, 
            (err: any, data: any) => {
              console.log('Start Task Err:', err);
              console.log('Start Task Data:', data)
              callback();
            })
          }
        ],
        (err, data) => {
          console.log('Waterfall err:', err);
          console.log('Waterfall data:', data);
        }
      );     
    });
  });
  return Promise.all(allPromises);
}
