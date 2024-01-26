const pomelo = require("./code/pomelo_utils");
const aws_dynamo = require("./code/aws_utils");

async function searchCards(event)
{
  username = event.requestContext.authorizer.jwt.claims.sub
  user = await aws_dynamo.getUser(username)
  pomeloUserID = user.PomeloUserID.S
  pomeloToken = pomelo.requestToken()

  


  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Go Serverless v3.0! Your function executed successfully!",
        input: event,
      },
      null,
      2
    ),
  };
}

async function searchCard(event)
{
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Go Serverless v3.0! Your function executed successfully!",
        input: event,
      },
      null,
      2
    ),
  };
}

async function createCard(event)
{
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Go Serverless v3.0! Your function executed successfully!",
        input: event,
      },
      null,
      2
    ),
  };
}

async function activateCard(event)
{
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Go Serverless v3.0! Your function executed successfully!",
        input: event,
      },
      null,
      2
    ),
  };
}

async function updateCard(event)
{
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Go Serverless v3.0! Your function executed successfully!",
        input: event,
      },
      null,
      2
    ),
  };
}

module.exports.searchCards = searchCards
module.exports.searchCard = searchCard
module.exports.createCard = createCard
module.exports.activateCard = activateCard
module.exports.updateCard = updateCard
