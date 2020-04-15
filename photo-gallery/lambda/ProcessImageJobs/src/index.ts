
import "reflect-metadata";
import { DynamoDBStreamEvent } from "aws-lambda";
import { fromDb, Attributes } from "@shiftcoders/dynamo-easy";
import { ImageJob } from "./imagejob.model";
import * as rq from "request";

export const handler = async (event: DynamoDBStreamEvent): Promise<any> => {

  const allPromises: Promise<any>[] = event.Records
  .filter(record => record.eventName === 'INSERT')
  .map(record => {
    return new Promise((resolve, reject) => {
      console.log('Dynamo DB Record:', record.dynamodb);
      const newImage = record.dynamodb?.NewImage;
      if (!newImage) { return ""; }
      const job = fromDb(<Attributes>newImage, ImageJob);
      const jJob = JSON.stringify(job);
      rq.post('http://dispatcher.mesh.local:3002', {
        json: jJob
      }, (err, res, body) => {
        if (err) { 
          console.log(err); 
          reject(err);
        }
        console.log(`Status Code: ${res.statusCode}`);
        console.log(body);
        resolve(body);
      })
    });
  });
  return Promise.all(allPromises);
}
