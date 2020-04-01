
import "reflect-metadata";
import { DynamoDBStreamEvent } from "aws-lambda";
import { fromDb, Attributes } from "@shiftcoders/dynamo-easy";
import { ImageJob } from "./imagejob.model";
import SQS from "aws-sdk/clients/sqs";


export const handler = async (event: DynamoDBStreamEvent): Promise<any> => {
  const sqs = new SQS();
  const allPromises: Promise<any>[] = event.Records
  .filter(record => record.eventName === 'INSERT')
  .map(record => {
    return new Promise((resolve, reject) => {
      const newImage = record.dynamodb?.NewImage;
      if (!newImage) { return ""; }
      const job = fromDb(<Attributes>newImage, ImageJob);
      const jJob = JSON.stringify(job);
      sqs.sendMessage({
          MessageBody: jJob,
          QueueUrl: 'https://sqs.us-west-2.amazonaws.com/540983619545/imagejobs'
        }, (err, data) => {
          if (err) {
            console.log(`Error sending sqs message. Err: ${err}`);
            reject(err);
          }
          console.log(`Successfully sent sqs message: ${data}`);
          resolve(data);
      });
    });
  });
  return Promise.all(allPromises);
}
