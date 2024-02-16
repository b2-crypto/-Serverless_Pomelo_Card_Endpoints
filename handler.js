const pomelo = require("./code/pomelo_utils");
const aws_dynamo = require("./code/aws_utils");
const postgres = require("./code/postgres_utils");

corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,PUT,POST,PATCH,DELETE",
  "Access-Control-Allow-Headers":
    "Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token, X-Amz-User-Agent, X-Amzn-Trace-Id",
}

  async function searchCards(event) {
    username = event.requestContext.authorizer.jwt.claims.sub;
    cards = await postgres.searchCards(username);

    return {
      statusCode: 200,
      corsHeaders,
      body: JSON.stringify(
        {
          cards: cards.rows,
        },
        null,
        2
      ),
    };
  };

async function createCard(event) {
  body = event.body;
  username = await aws_dynamo.getUserUsingPomeloID(JSON.parse(body)['user_id'])
  response = await pomelo.createCard(body);
  responseJson = JSON.parse(response);
  postgresCard = await postgres.proccessCreateCard(
    responseJson.data.id,
    0,
    "Pomelo",
    username["Items"][0]["id"]['S'],
  );

  return {
    statusCode: 200,
    corsHeaders,
    body: JSON.stringify(
      {
        message: "Credit Card was created",
        data: responseJson,
      },
      null,
      2
    ),
  };
}

async function modifyBalance(event) {
  body = JSON.parse(event.body);

  value = body.value;
  cardId = body.cardId;
  postgresCard = await postgres.modifyBalance(cardId, value);

  return {
    statusCode: 200,
    corsHeaders,
    body: JSON.stringify(
      {
        message: "Card: " + cardId + " Updated",
      },
      null,
      2
    ),
  };
}

async function updateCard(event) {
  cardToEdit = event.pathParameters.cardId;
  response = await pomelo.modifyCard(event.body, cardToEdit);
  responseJson = JSON.parse(response);
  return {
    corsHeaders,
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Card modified",
        data: responseJson,
      },
      null,
      2
    ),
  };
}

async function getPrivateInfoToken(event) {
  username = event.requestContext.authorizer.jwt.claims.sub;
  userFull = await aws_dynamo.getUser(username);
  console.log(username);
  token = await pomelo.getTokenForPrivateInfo(userFull["PomeloUserID"]["S"]);

  responseJson = JSON.parse(token);
  return {
    corsHeaders,
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Token requested",
        token: responseJson,
      },
      null,
      2
    ),
  };
}

async function listTransactionRecords(event) {
  username = event.requestContext.authorizer.jwt.claims.sub;
  allCreditCards = await postgres.searchCards(username);
  records = [];
  allCreditCardsRows = allCreditCards.rows;
  for (card of allCreditCardsRows) {
    actualCardId = card["partner_card_id"];

    transactions = await aws_dynamo.getTransactionRecords(actualCardId);
    if (transactions.Count > 0) {
      for (transacion of transactions.Items) {
        documentJson = JSON.parse(transacion.transactionDocument["S"]);
        records.push(documentJson);
      }
    }
  }
  return {
    corsHeaders,
    statusCode: 200,
    body: JSON.stringify({ data: records }, null, 2),
  };
}

module.exports.searchCards = searchCards;
module.exports.createCard = createCard;
module.exports.updateCard = updateCard;
module.exports.getPrivateInfoToken = getPrivateInfoToken;
module.exports.modifyBalance = modifyBalance;
module.exports.listTransactionRecords = listTransactionRecords;
