const pomelo = require("./code/pomelo_utils");
const aws_dynamo = require("./code/aws_utils");
const postgres = require("./code/postgres_utils");
const logger = require("./code/logger");

const MAX_CARD_NUMBER_PER_USER = 10;
const PARTNER = "Pomelo";

corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,PUT,POST,PATCH,DELETE",
  "Access-Control-Allow-Headers":
    "Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token, X-Amz-User-Agent, X-Amzn-Trace-Id",
};

async function checkIfUserIsAdmin(user) {
  admin = user["isAdmin"]["B"];
  return admin;
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
}

async function createCard(event) {
  username = event.requestContext.authorizer.jwt.claims.sub;
  user = await aws_dynamo.getUser(username);
  cards = await postgres.searchCards(username);
  if (cards.rowCount >= MAX_CARD_NUMBER_PER_USER) {
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
    cardToModify = cardQuery.rows[0];
    if (cardToModify["user_id"] != username) {
      return {
        corsHeaders,
        statusCode: 403,
        body: JSON.stringify(
          {
            message:
              "The card was not modified, the user is not the owner of the card.",
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
  logger.log("debug", `User: ${username} `);
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

async function extractAffinityGroups(cardTypes) {
  var affinityGroups = [];
  for (cardType of cardTypes.items) {
    affinityGroups.push(cardType["Name"]["S"]);
  }
  return affinityGroups;
}

async function activateCard(event) {
  username = event.requestContext.authorizer.jwt.claims.sub;
  userFull = await aws_dynamo.getUser(username);
  pomeloUser = userFull["PomeloUserID"]["S"];
  body = JSON.parse(event.body);
  activation_code = body["activation_code"];
  pin = body["pin"];
  /*
  activationRequests = await aws_dynamo.getActiveActivationRequestRecords(
    username
  );
 
  if (activationRequests.Count <= 0) {
    return {
      corsHeaders,
      statusCode: 403,
      body: JSON.stringify(
        { data: "The user has no active card activation requests." },
        null,
        2
      ),
    };
  }
   */

  try {
    var response = await pomelo.activateCard(pomeloUser, pin, activation_code);
  } catch (error) {
    return {
      corsHeaders,
      statusCode: 400,
      body: JSON.stringify(error),
    };
  }

  cardId = response.data.id;

  postgresCard = await postgres.proccessCreateCard(
    cardId,
    0,
    PARTNER,
    username
  );
  return {
    statusCode: 200,
    corsHeaders,
    body: JSON.stringify(
      {
        message: "Credit card is activated",
        data: responseJson,
      },
      null,
      2
    ),
  };

  /*

  for (activationRequest in activationRequests.items) {
    cardIDType = activationRequest["CardID"]["S"];
    cardAffinityGroup = SearchAffinityGroupUsingID(cardID);

    if (cardAffinityGroup == cardData["data"]["affinity_group_id"]) {
      // Almacenar tarjeta en la base de datos de Postgres
      // Actualizar el estado solicitud de activación de DynamoDB
      // Retornar el estado de la activación como respusta.
    }
  }

  // Bloquear tarjeta por parte de B2Crypto
  // Retornar respuesta al usuario
  */
}

async function getTransactionRecordsAll(event) {
  username = event.requestContext.authorizer.jwt.claims.sub;
  userFull = await aws_dynamo.getUser(username);

  if (!checkIfUserIsAdmin(userFull)) {
    return {
      statusCode: 404,
      corsHeaders,
      body: JSON.stringify({}),
    };
  }

  sizeOfRecordList = 0;
  lastRecord = 0;
}

module.exports.searchCards = searchCards;
module.exports.createCard = createCard;
module.exports.updateCard = updateCard;
module.exports.getPrivateInfoToken = getPrivateInfoToken;
module.exports.listTransactionRecords = listTransactionRecords;
module.exports.activateCard = activateCard;
