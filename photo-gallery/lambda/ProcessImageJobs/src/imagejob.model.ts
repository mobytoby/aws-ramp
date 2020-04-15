import { Model, PartitionKey } from '@shiftcoders/dynamo-easy'

@Model()
export class ImageJob {
  @PartitionKey()
  id!: string
  name!: string
  imageUrl!: string[]
  isDone!: boolean;
}