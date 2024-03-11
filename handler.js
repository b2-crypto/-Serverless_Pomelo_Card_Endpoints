const pomelo = require("./code/pomelo_utils");
const aws_dynamo = require("./code/aws_utils");
const postgres = require("./code/postgres_utils");

const MAX_CARD_NUMBER_PER_USER = 10;
const PARTNER = "Pomelo";

corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,PUT,POST,PATCH,DELETE",
  "Access-Control-Allow-Headers":
    "Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token, X-Amz-User-Agent, X-Amzn-Trace-Id",
};

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
}

async function createCard(event) {
  username = event.requestContext.authorizer.jwt.claims.sub;
  user = await aws_dynamo.getUser(username);
  cards = await postgres.searchCards(username);
  if (cards.rowCount > MAX_CARD_NUMBER_PER_USER) {
    return {
      statusCode: 500,
      corsHeaders,
      body: JSON.stringify(
        {
          message: "Maximum number of card per user reached",
          data: responseJson,
        },
        null,
        2
      ),
    };
  }

  pomelo_userId = user.PomeloUserID.S;

  body = JSON.parse(event.body);
  body.user_id = pomelo_userId;
  response = await pomelo.createCard(JSON.stringify(body));
  responseJson = JSON.parse(response);
  postgresCard = await postgres.proccessCreateCard(
    responseJson.data.id,
    0,
    PARTNER,
    username
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
  username = event.requestContext.authorizer.jwt.claims.sub;
  cardToEdit = event.pathParameters.cardId;

  cardQuery = await postgres.searchCardByIDAndPartner(cardToEdit, PARTNER);

  if (cardQuery.rowCount == 1) {
    cardToModify = cardQuery.rows[0]
    if(cardToModify["user_id"]!= username)
    {
      return {
        corsHeaders,
        statusCode: 403,
        body: JSON.stringify(
          {
            message: "The card was not modified, the user is not the owner of the card.",
          },
          null,
          2
        ),
      };


    }
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
module.exports.listTransactionRecords = listTransactionRecords;
