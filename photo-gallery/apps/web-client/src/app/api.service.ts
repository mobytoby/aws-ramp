/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.
import { Injectable } from "@angular/core";
import API, { graphqlOperation } from "@aws-amplify/api";
import { GraphQLResult } from "@aws-amplify/api/lib/types";
import * as Observable from "zen-observable";

export type CreatePhotoInput = {
  id?: string | null;
  name: string;
  image?: string | null;
};

export type ModelPhotoConditionInput = {
  name?: ModelStringInput | null;
  image?: ModelStringInput | null;
  and?: Array<ModelPhotoConditionInput | null> | null;
  or?: Array<ModelPhotoConditionInput | null> | null;
  not?: ModelPhotoConditionInput | null;
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

export type UpdatePhotoInput = {
  id: string;
  name?: string | null;
  image?: string | null;
};

export type DeletePhotoInput = {
  id?: string | null;
};

export type ModelPhotoFilterInput = {
  id?: ModelIDInput | null;
  name?: ModelStringInput | null;
  image?: ModelStringInput | null;
  and?: Array<ModelPhotoFilterInput | null> | null;
  or?: Array<ModelPhotoFilterInput | null> | null;
  not?: ModelPhotoFilterInput | null;
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

export type CreatePhotoMutation = {
  __typename: "Photo";
  id: string;
  name: string;
  image: string | null;
};

export type UpdatePhotoMutation = {
  __typename: "Photo";
  id: string;
  name: string;
  image: string | null;
};

export type DeletePhotoMutation = {
  __typename: "Photo";
  id: string;
  name: string;
  image: string | null;
};

export type GetPhotoQuery = {
  __typename: "Photo";
  id: string;
  name: string;
  image: string | null;
};

export type ListPhotosQuery = {
  __typename: "ModelPhotoConnection";
  items: Array<{
    __typename: "Photo";
    id: string;
    name: string;
    image: string | null;
  } | null> | null;
  nextToken: string | null;
};

export type OnCreatePhotoSubscription = {
  __typename: "Photo";
  id: string;
  name: string;
  image: string | null;
};

export type OnUpdatePhotoSubscription = {
  __typename: "Photo";
  id: string;
  name: string;
  image: string | null;
};

export type OnDeletePhotoSubscription = {
  __typename: "Photo";
  id: string;
  name: string;
  image: string | null;
};

@Injectable({
  providedIn: "root"
})
export class APIService {
  async CreatePhoto(
    input: CreatePhotoInput,
    condition?: ModelPhotoConditionInput
  ): Promise<CreatePhotoMutation> {
    const statement = `mutation CreatePhoto($input: CreatePhotoInput!, $condition: ModelPhotoConditionInput) {
        createPhoto(input: $input, condition: $condition) {
          __typename
          id
          name
          image
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
    return <CreatePhotoMutation>response.data.createPhoto;
  }
  async UpdatePhoto(
    input: UpdatePhotoInput,
    condition?: ModelPhotoConditionInput
  ): Promise<UpdatePhotoMutation> {
    const statement = `mutation UpdatePhoto($input: UpdatePhotoInput!, $condition: ModelPhotoConditionInput) {
        updatePhoto(input: $input, condition: $condition) {
          __typename
          id
          name
          image
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
    return <UpdatePhotoMutation>response.data.updatePhoto;
  }
  async DeletePhoto(
    input: DeletePhotoInput,
    condition?: ModelPhotoConditionInput
  ): Promise<DeletePhotoMutation> {
    const statement = `mutation DeletePhoto($input: DeletePhotoInput!, $condition: ModelPhotoConditionInput) {
        deletePhoto(input: $input, condition: $condition) {
          __typename
          id
          name
          image
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
    return <DeletePhotoMutation>response.data.deletePhoto;
  }
  async GetPhoto(id: string): Promise<GetPhotoQuery> {
    const statement = `query GetPhoto($id: ID!) {
        getPhoto(id: $id) {
          __typename
          id
          name
          image
        }
      }`;
    const gqlAPIServiceArguments: any = {
      id
    };
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <GetPhotoQuery>response.data.getPhoto;
  }
  async ListPhotos(
    filter?: ModelPhotoFilterInput,
    limit?: number,
    nextToken?: string
  ): Promise<ListPhotosQuery> {
    const statement = `query ListPhotos($filter: ModelPhotoFilterInput, $limit: Int, $nextToken: String) {
        listPhotos(filter: $filter, limit: $limit, nextToken: $nextToken) {
          __typename
          items {
            __typename
            id
            name
            image
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
    return <ListPhotosQuery>response.data.listPhotos;
  }
  OnCreatePhotoListener: Observable<OnCreatePhotoSubscription> = API.graphql(
    graphqlOperation(
      `subscription OnCreatePhoto {
        onCreatePhoto {
          __typename
          id
          name
          image
        }
      }`
    )
  ) as Observable<OnCreatePhotoSubscription>;

  OnUpdatePhotoListener: Observable<OnUpdatePhotoSubscription> = API.graphql(
    graphqlOperation(
      `subscription OnUpdatePhoto {
        onUpdatePhoto {
          __typename
          id
          name
          image
        }
      }`
    )
  ) as Observable<OnUpdatePhotoSubscription>;

  OnDeletePhotoListener: Observable<OnDeletePhotoSubscription> = API.graphql(
    graphqlOperation(
      `subscription OnDeletePhoto {
        onDeletePhoto {
          __typename
          id
          name
          image
        }
      }`
    )
  ) as Observable<OnDeletePhotoSubscription>;
}
