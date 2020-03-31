/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.
import { Injectable } from "@angular/core";
import API, { graphqlOperation } from "@aws-amplify/api";
import { GraphQLResult } from "@aws-amplify/api/lib/types";
import * as Observable from "zen-observable";

export type CreateImageJobInput = {
  id?: string | null;
  name: string;
  imageUrl: string;
  filters: Array<string | null>;
  isDone?: boolean | null;
  isToby?: boolean | null;
};

export type ModelImageJobConditionInput = {
  name?: ModelStringInput | null;
  imageUrl?: ModelStringInput | null;
  filters?: ModelStringInput | null;
  isDone?: ModelBooleanInput | null;
  isToby?: ModelBooleanInput | null;
  and?: Array<ModelImageJobConditionInput | null> | null;
  or?: Array<ModelImageJobConditionInput | null> | null;
  not?: ModelImageJobConditionInput | null;
};

export type ModelStringInput = {
  ne?: string | null;
  eq?: string | null;
  le?: string | null;
  lt?: string | null;
  ge?: string | null;
  gt?: string | null;
  contains?: string | null;
  notContains?: string | null;
  between?: Array<string | null> | null;
  beginsWith?: string | null;
  attributeExists?: boolean | null;
  attributeType?: ModelAttributeTypes | null;
  size?: ModelSizeInput | null;
};

export enum ModelAttributeTypes {
  binary = "binary",
  binarySet = "binarySet",
  bool = "bool",
  list = "list",
  map = "map",
  number = "number",
  numberSet = "numberSet",
  string = "string",
  stringSet = "stringSet",
  _null = "_null"
}

export type ModelSizeInput = {
  ne?: number | null;
  eq?: number | null;
  le?: number | null;
  lt?: number | null;
  ge?: number | null;
  gt?: number | null;
  between?: Array<number | null> | null;
};

export type ModelBooleanInput = {
  ne?: boolean | null;
  eq?: boolean | null;
  attributeExists?: boolean | null;
  attributeType?: ModelAttributeTypes | null;
};

export type UpdateImageJobInput = {
  id: string;
  name?: string | null;
  imageUrl?: string | null;
  filters?: Array<string | null> | null;
  isDone?: boolean | null;
  isToby?: boolean | null;
};

export type DeleteImageJobInput = {
  id?: string | null;
};

export type ModelImageJobFilterInput = {
  id?: ModelIDInput | null;
  name?: ModelStringInput | null;
  imageUrl?: ModelStringInput | null;
  filters?: ModelStringInput | null;
  isDone?: ModelBooleanInput | null;
  isToby?: ModelBooleanInput | null;
  and?: Array<ModelImageJobFilterInput | null> | null;
  or?: Array<ModelImageJobFilterInput | null> | null;
  not?: ModelImageJobFilterInput | null;
};

export type ModelIDInput = {
  ne?: string | null;
  eq?: string | null;
  le?: string | null;
  lt?: string | null;
  ge?: string | null;
  gt?: string | null;
  contains?: string | null;
  notContains?: string | null;
  between?: Array<string | null> | null;
  beginsWith?: string | null;
  attributeExists?: boolean | null;
  attributeType?: ModelAttributeTypes | null;
  size?: ModelSizeInput | null;
};

export type CreateImageJobMutation = {
  __typename: "ImageJob";
  id: string;
  name: string;
  imageUrl: string;
  filters: Array<string | null>;
  isDone: boolean | null;
  isToby: boolean | null;
};

export type UpdateImageJobMutation = {
  __typename: "ImageJob";
  id: string;
  name: string;
  imageUrl: string;
  filters: Array<string | null>;
  isDone: boolean | null;
  isToby: boolean | null;
};

export type DeleteImageJobMutation = {
  __typename: "ImageJob";
  id: string;
  name: string;
  imageUrl: string;
  filters: Array<string | null>;
  isDone: boolean | null;
  isToby: boolean | null;
};

export type GetImageJobQuery = {
  __typename: "ImageJob";
  id: string;
  name: string;
  imageUrl: string;
  filters: Array<string | null>;
  isDone: boolean | null;
  isToby: boolean | null;
};

export type ListImageJobsQuery = {
  __typename: "ModelImageJobConnection";
  items: Array<{
    __typename: "ImageJob";
    id: string;
    name: string;
    imageUrl: string;
    filters: Array<string | null>;
    isDone: boolean | null;
    isToby: boolean | null;
  } | null> | null;
  nextToken: string | null;
};

export type OnCreateImageJobSubscription = {
  __typename: "ImageJob";
  id: string;
  name: string;
  imageUrl: string;
  filters: Array<string | null>;
  isDone: boolean | null;
  isToby: boolean | null;
};

export type OnUpdateImageJobSubscription = {
  __typename: "ImageJob";
  id: string;
  name: string;
  imageUrl: string;
  filters: Array<string | null>;
  isDone: boolean | null;
  isToby: boolean | null;
};

export type OnDeleteImageJobSubscription = {
  __typename: "ImageJob";
  id: string;
  name: string;
  imageUrl: string;
  filters: Array<string | null>;
  isDone: boolean | null;
  isToby: boolean | null;
};

@Injectable({
  providedIn: "root"
})
export class APIService {
  async CreateImageJob(
    input: CreateImageJobInput,
    condition?: ModelImageJobConditionInput
  ): Promise<CreateImageJobMutation> {
    const statement = `mutation CreateImageJob($input: CreateImageJobInput!, $condition: ModelImageJobConditionInput) {
        createImageJob(input: $input, condition: $condition) {
          __typename
          id
          name
          imageUrl
          filters
          isDone
          isToby
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    if (condition) {
      gqlAPIServiceArguments.condition = condition;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <CreateImageJobMutation>response.data.createImageJob;
  }
  async UpdateImageJob(
    input: UpdateImageJobInput,
    condition?: ModelImageJobConditionInput
  ): Promise<UpdateImageJobMutation> {
    const statement = `mutation UpdateImageJob($input: UpdateImageJobInput!, $condition: ModelImageJobConditionInput) {
        updateImageJob(input: $input, condition: $condition) {
          __typename
          id
          name
          imageUrl
          filters
          isDone
          isToby
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    if (condition) {
      gqlAPIServiceArguments.condition = condition;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <UpdateImageJobMutation>response.data.updateImageJob;
  }
  async DeleteImageJob(
    input: DeleteImageJobInput,
    condition?: ModelImageJobConditionInput
  ): Promise<DeleteImageJobMutation> {
    const statement = `mutation DeleteImageJob($input: DeleteImageJobInput!, $condition: ModelImageJobConditionInput) {
        deleteImageJob(input: $input, condition: $condition) {
          __typename
          id
          name
          imageUrl
          filters
          isDone
          isToby
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    if (condition) {
      gqlAPIServiceArguments.condition = condition;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <DeleteImageJobMutation>response.data.deleteImageJob;
  }
  async GetImageJob(id: string): Promise<GetImageJobQuery> {
    const statement = `query GetImageJob($id: ID!) {
        getImageJob(id: $id) {
          __typename
          id
          name
          imageUrl
          filters
          isDone
          isToby
        }
      }`;
    const gqlAPIServiceArguments: any = {
      id
    };
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <GetImageJobQuery>response.data.getImageJob;
  }
  async ListImageJobs(
    filter?: ModelImageJobFilterInput,
    limit?: number,
    nextToken?: string
  ): Promise<ListImageJobsQuery> {
    const statement = `query ListImageJobs($filter: ModelImageJobFilterInput, $limit: Int, $nextToken: String) {
        listImageJobs(filter: $filter, limit: $limit, nextToken: $nextToken) {
          __typename
          items {
            __typename
            id
            name
            imageUrl
            filters
            isDone
            isToby
          }
          nextToken
        }
      }`;
    const gqlAPIServiceArguments: any = {};
    if (filter) {
      gqlAPIServiceArguments.filter = filter;
    }
    if (limit) {
      gqlAPIServiceArguments.limit = limit;
    }
    if (nextToken) {
      gqlAPIServiceArguments.nextToken = nextToken;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <ListImageJobsQuery>response.data.listImageJobs;
  }
  OnCreateImageJobListener: Observable<
    OnCreateImageJobSubscription
  > = API.graphql(
    graphqlOperation(
      `subscription OnCreateImageJob {
        onCreateImageJob {
          __typename
          id
          name
          imageUrl
          filters
          isDone
          isToby
        }
      }`
    )
  ) as Observable<OnCreateImageJobSubscription>;

  OnUpdateImageJobListener: Observable<
    OnUpdateImageJobSubscription
  > = API.graphql(
    graphqlOperation(
      `subscription OnUpdateImageJob {
        onUpdateImageJob {
          __typename
          id
          name
          imageUrl
          filters
          isDone
          isToby
        }
      }`
    )
  ) as Observable<OnUpdateImageJobSubscription>;

  OnDeleteImageJobListener: Observable<
    OnDeleteImageJobSubscription
  > = API.graphql(
    graphqlOperation(
      `subscription OnDeleteImageJob {
        onDeleteImageJob {
          __typename
          id
          name
          imageUrl
          filters
          isDone
          isToby
        }
      }`
    )
  ) as Observable<OnDeleteImageJobSubscription>;
}
