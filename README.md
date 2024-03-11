
# Pomelo  endpoints CRUD (Card) 

This repository contains the code for use the cards endpoints provided by Pomelo.

## Table of Contents

- [Tech Stack](#tech-stack)

- [Usage](#usage)

- [Testing](#testing)

- [Deploy](#deploy)

- [To do](#to-do)

  
  

## Tech Stack

- [NodeJS](https://nodejs.org/en)

- [Serverless Framework](https://www.serverless.com/)

- [DotEnv Plugin](https://www.serverless.com/plugins/serverless-dotenv-plugin)

- [serverless-offline](https://www.serverless.com/plugins/serverless-offline)

- [Redis](https://redis.io/)

- [AWS SDK for Node](https://www.npmjs.com/package/aws-sdk)

  

## Usage

This application is expected to run in serverless framework, for this the following environment variables are used in the .env file.


    # Amazon configuration
    
    AMAZON_REGION = 
    AMAZON_USER_POOL =
    AMAZON_USER_POOL_USERS = 
    CLIENTID = 
    AWS_ACCESS=
    AWS_SECRET=
    REGION_ID=
    CLIENT_ID_POMELO_USERS = 

    # Pomelo
    
    POMELO_API_AUTH = 
    POMELO_CLIENT_ID = 
    POMELO_SECRET_KEY = 
    POMELO_AUDIENCE = 
    POMELO_ENDPOINT = 
  
    # Dynamo Tables
    
    TABLE_DYNAMO_USER_TABLE = 
    TABLE_DYNAMO_CARD = 

    # POSTGRES
    
    HOST_POSTGRES=
    TABLE_CARD=
    HOST_PORT=
    HOST_DATABASE=
    POSTGRES_USER=
	POSTGRES_PASSWORD=
	
This environment variables can be modified depending on the type of deployment to be performed.

### Testing

For testing porpouses its recomended to deploy the app in offline mode for this use the following command:

    sls offline --ignoreJWTSignature --noTimeout

**Note:** This deployment mode still uses amazon aws and Redis resources, for this reason you still need an account in redis and amazon configured in the env file.

### Deploy

To deploy to the production environment the following command must be used:

sls deploy

## TO DO

  

1. Create documentation for services usage.

