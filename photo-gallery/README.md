# Photo Gallery App fully docker-composed

## Overview

This folder contains all of the constituent services and configuration necessary to run the photo gallery app in a local docker environment.

### Instructions  

1. Clone this repo: `git clone https://github.com/mobytoby/aws-ramp.git`
2. Install [docker desktop](https://www.docker.com/products/docker-desktop) and [compose](https://docs.docker.com/compose/install/)
3. Modify the `bucketName` property in the `{git-root}/photo-gallery/apps/web-client/src/environments/environment.ts` file. Update it with an existing bucket name in your account.
4. In the `{git-root}/photo-gallery` folder, create a file called `aws.env` that has the following key/values. The account represented by these credentials should only have access to read/write objects from the S3 bucket defined in step 2

    ```bash
    AWS_ACCESS_KEY_ID={your access key id}
    AWS_REGION={desired aws region}
    AWS_SECRET_ACCESS_KEY={your secret access key}
    ```

5. From a terminal, navigate to `{git-root}/photo-gallery` and run the following command:

    ```bash
    docker-compose up --build
    ```

6. Open your browser and navigate to `http://localhost:3000`
7. Back in the terminal, `Ctrl-C` when done
