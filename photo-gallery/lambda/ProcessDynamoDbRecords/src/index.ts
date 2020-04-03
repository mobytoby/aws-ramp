
import "reflect-metadata";
import { DynamoDBStreamEvent } from "aws-lambda";
import { fromDb, Attributes } from "@shiftcoders/dynamo-easy";
import { ImageJob } from "./imagejob.model";
import { default as ECS } from "aws-sdk/clients/ecs";
import { default as SSM, GetParametersResult } from "aws-sdk/clients/ssm";
import { waterfall } from "async";

export const handler = async (event: DynamoDBStreamEvent): Promise<any> => {
  const ecs = new ECS({ region: 'us-west-2' });
  const ssm = new SSM({ region: 'us-west-2' });
  const allPromises: Promise<any>[] = event.Records
  .filter(record => record.eventName === 'INSERT')
  .map(record => {
    return new Promise((resolve, reject) => {
      const newImage = record.dynamodb?.NewImage;
      if (!newImage) { return ""; }
      const job = fromDb(<Attributes>newImage, ImageJob);
      const jJob = JSON.stringify(job);
      const params = [
        '/photo-gallery/cluster',
        '/photo-gallery/taskDefinition',
        '/photo-gallery/subnets',
        '/photo-gallery/securityGroups',
      ];


      waterfall([
        function(callback: any) {
          ssm.getParameters({ Names: params }, 
            (err: any, data: GetParametersResult) => callback(err, data.Parameters))
        },
        function(parameters: any, callback: any) {
          ecs.runTask({
            cluster: parameters.find((d: any) => d.Name == '/photo-gallery/cluster').Value,
            launchType: "FARGATE",
            taskDefinition: parameters.find((d: any) => d.Name == '/photo-gallery/taskDefinition').Value,
            networkConfiguration: {
              awsvpcConfiguration: {
                subnets: parameters.find((d: any) => d.Name == '/photo-gallery/subnets').Value.split(','),
                assignPublicIp: "DISABLED",
                securityGroups: parameters.find((d: any) => d.Name == '/photo-gallery/securityGroups').Value.split(','),
              }
            },
            overrides: {
              containerOverrides: [
                { 
                  name: "job-scheduler",
                  command: [jJob]
                }
              ]
            }
          }, (err, data) => { callback(err, data) });
        }
      ], function (err, result){
        if (err) { reject(err); }
        else resolve(result);
      });      
    });
  });
  return Promise.all(allPromises);
}


// class Config {
//   ssm = new SSM({ region: 'us-west-2'});
//   cluster = await this.GetScalarParameter('photo-gallery/cluster');
//   // public get Cluster() {
//   //   this.ssm.getParameter({
//   //     'photo-gallery/cluster', (err: any, data: any) => {
//   //     if(err) { return err; }
//   //     else { return data; }
//   //     )
//   //   });
//   // }
//   private async GetScalarParameter(key: string) {
//     return new Promise<string|AWSError>((resolve, reject) => {
//       this.ssm.getParameter({Name: key},
//         (err, data) => {
//           if (err) { reject(err); }
//           else { resolve(data.Parameter?.Value); }
//         });
//     });
//   }
// }
