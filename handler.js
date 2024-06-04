const pomelo = require("./code/pomelo_utils");
const aws_dynamo = require("./code/aws_utils");
const postgres = require("./code/postgres_utils");
const logger = require("./code/logger");

const MAX_CARD_NUMBER_PER_USER = 10;
const PARTNER = "Pomelo";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,PUT,POST,PATCH,DELETE",
  "Access-Control-Allow-Headers":
    "Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token, X-Amz-User-Agent, X-Amzn-Trace-Id",
};

const RESPONSE_404 = {
  statusCode: 404,
  CORS_HEADERS,
  body: JSON.stringify({}),
};

function checkIfUserIsAdmin(user) {
  admin = user["isAdmin"]["BOOL"];
  return admin;
}

function returnRequest(statusCode, Body) {
  return {
    statusCode: statusCode,
    CORS_HEADERS,
    body: Body,
  };
}

function transformListIntoDict(dictToOrder, keyToStorage) {
  dict = {};
  for ([key, value] of Object.entries(dictToOrder)) {
    dict[value[keyToStorage]] = value;
  }
  return dict;
}

async function extractAffinityGroups(cardTypes) {
  let affinityGroups = [];
  for (cardType of cardTypes.items) {
    affinityGroups.push(cardType["Name"]["S"]);
  }
  return affinityGroups;
}

function getUserFromEvent(event) {
  return event.requestContext.authorizer.jwt.claims.sub;
}

async function getUserFromDatabase(user, databaseConector) {
  return await databaseConector.getUser(user);
}

function parseRecordList(transactions) {
  let recordInData = [];
  if (transactions.Count > 0) {
    for (transacion of transactions.Items) {
      documentJson = JSON.parse(transacion.transactionDocument["S"]);
      recordInData.push(documentJson);
    }
  }
  return recordInData;
}

function parseRechageRecordList(transactions) {
  let recordInData = [];
  if (transactions.Count > 0) {
    for (transacion of transactions.Items) {
      documentJson = transacion;
      recordInData.push(documentJson);
    }
  }
  return recordInData;
}
function mergeCardInfo(cardSet, complementCardSet) {
  for ([key, value] of Object.entries(cardSet)) {
    cardSet[key] = { data: value, addiontal_data: complementCardSet[key] };
  }
  return cardSet;
}

async function searchCardInDatabaseByUser(database, userInDataBase) {
  return await database.searchCardsByUser(userInDataBase);
}

async function searchCards(event) {
  username = getUserFromEvent(event);
  user = await getUserFromDatabase(username, aws_dynamo);
  pomeloUserId = user.PomeloUserID.S;

  cards = await searchCardInDatabaseByUser(postgres, username);
  cardsRows = cards.rows;

  cardsRows = transformListIntoDict(cardsRows, "partner_card_id");
  cardsInPomelo = await searchCardInDatabaseByUser(pomelo, pomeloUserId);
  cardsInPomelo = transformListIntoDict(cardsInPomelo, "id");

  cardsWithAdditionalInfo = mergeCardInfo(cardsRows, cardsInPomelo);

  return returnRequest(
    200,
    JSON.stringify(
      {
        cards: cardsWithAdditionalInfo,
      },
      null,
      2
    )
  );
}

async function createCard(event) {
  username = getUserFromEvent(event);
  userFull = await getUserFromDatabase(username, aws_dynamo);

  cards = await postgres.searchCardsByUser(username);
  if (cards.rowCount >= MAX_CARD_NUMBER_PER_USER) {
    return returnRequest(
      500,
      JSON.stringify(
        {
          message: "Maximum number of card per user reached",
          data: responseJson,
        },
        null,
        2
      )
    );
  }

  pomelo_userId = userFull.PomeloUserID.S;

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
  return returnRequest(
    200,
    JSON.stringify(
      {
        message: "Credit Card was created",
        data: responseJson,
      },
      null,
      2
    )
  );
}

async function updateCard(event) {
  username = getUserFromEvent(event);
  cardToEdit = event.pathParameters.cardId;

  cardQuery = await postgres.searchCardByIDAndPartner(cardToEdit, PARTNER);

  if (cardQuery.rowCount == 1) {
    cardToModify = cardQuery.rows[0];
    if (cardToModify["user_id"] != username) {
      return returnRequest(
        403,
        JSON.stringify(
          {
            message:
              "The card was not modified, the user is not the owner of the card.",
          },
          null,
          2
        )
      );
    }
    response = await pomelo.modifyCard(event.body, cardToEdit);
    responseJson = JSON.parse(response);
    return returnRequest(
      200,
      JSON.stringify(
        {
          message: "Card modified",
          data: responseJson,
        },
        null,
        2
      )
    );
  }
}

async function getPrivateInfoToken(event) {
  username = getUserFromEvent(event);
  userFull = await getUserFromDatabase(username, aws_dynamo);
  token = await pomelo.getTokenForPrivateInfo(userFull["PomeloUserID"]["S"]);

  responseJson = JSON.parse(token);
  return returnRequest(
    200,
    JSON.stringify(
      {
        message: "Token requested",
        token: responseJson,
      },
      null,
      2
    )
  );
}

async function listTransactionRecords(event) {
  username = getUserFromEvent(event);
  return await getCardsRecordsForUser(
    username,
    aws_dynamo.getTransactionRecords
  );
}

async function listNotificationRecords(event) {
  username = getUserFromEvent(event);
  return await getCardsRecordsForUser(
    username,
    aws_dynamo.getNotificationRecords
  );
}

async function listRechargeRecords(event) {
  username = getUserFromEvent(event);
  return await getCardsRecordsForUserUsingCardID(
    username,
    aws_dynamo.getRechargeRecords
  );
}

async function listAdjusmentRecords(event) {
  username = getUserFromEvent(event);
  return await getCardsRecordsForUser(username, aws_dynamo.getAdjusmentRecords);
}

async function getCardsRecordsForUser(username, getRecordsForCard) {
  allCreditCards = await postgres.searchCardsByUser(username);
  records = [];
  allCreditCardsRows = allCreditCards.rows;
  for (card of allCreditCardsRows) {
    actualCardId = card["partner_card_id"];
    transactions = await getRecordsForCard(actualCardId);
    recordsToAdd = parseRecordList(transactions);
    for (const record of recordsToAdd) {
      records.push(record);
    }
  }
  return returnRequest(200, JSON.stringify({ data: records }, null, 2));
}

async function getCardsRecordsForUserUsingCardID(username, getRecordsForCard) {
  allCreditCards = await postgres.searchCardsByUser(username);
  records = [];
  allCreditCardsRows = allCreditCards.rows;
  for (card of allCreditCardsRows) {
    actualCardId = card["id"];

    transactions = await getRecordsForCard(actualCardId.toString());
    recordsToAdd = parseRechageRecordList(transactions);
    for (const record of recordsToAdd) {
      records.push(record);
    }
  }
  return returnRequest(200, JSON.stringify({ data: records }, null, 2));
}

async function activateCard(event) {
  username = getUserFromEvent(event);
  userFull = await getUserFromDatabase(username, aws_dynamo);
  pomeloUser = userFull["PomeloUserID"]["S"];
  body = JSON.parse(event.body);
  pan = body["pan"];
  pin = body["pin"];
  /*
  activationRequests = await aws_dynamo.getActiveActivationRequestRecords(
    username
  );
 
  if (activationRequests.Count <= 0) {
    return {
      CORS_HEADERS,
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
    let response = await pomelo.activateCard(pomeloUser, pin, pan);
  } catch (error) {
    return returnRequest(400, JSON.stringify(error));
  }
  responseJson = JSON.parse(response);
  cardId = responseJson.data.id;

  postgresCard = await postgres.proccessCreateCard(
    cardId,
    0,
    PARTNER,
    username
  );

  bodyResponse = JSON.stringify(
    {
      message: "Credit card is activated",
      data: responseJson,
    },
    null,
    2
  );

  return returnRequest(200, bodyResponse);
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

async function getTransactionAllRecords(event) {
  username = getUserFromEvent(event);
  userFull = await getUserFromDatabase(username, aws_dynamo);
  queryParams = event.queryStringParameters;

  if (!checkIfUserIsAdmin(userFull)) {
    return RESPONSE_404;
  }
  return await getAllRecordsFromQuery(
    queryParams,
    aws_dynamo.getTransactionRecordAdmin
  );
}

async function getNotificationAllRecords(event) {
  username = getUserFromEvent(event);
  userFull = await getUserFromDatabase(username, aws_dynamo);
  queryParams = event.queryStringParameters;

  if (!checkIfUserIsAdmin(userFull)) {
    return RESPONSE_404;
  }
  return await getAllRecordsFromQuery(
    queryParams,
    aws_dynamo.getNotificationRecordAdmin
  );
}

async function getAdjusmentAllRecords(event) {
  username = getUserFromEvent(event);
  userFull = await getUserFromDatabase(username, aws_dynamo);
  queryParams = event.queryStringParameters;

  if (!checkIfUserIsAdmin(userFull)) {
    return RESPONSE_404;
  }
  return await getAllRecordsFromQuery(
    queryParams,
    aws_dynamo.getAdjusmentRecordAdmin
  );
}

async function getRechargeAllRecords(event) {
  username = getUserFromEvent(event);
  userFull = await getUserFromDatabase(username, aws_dynamo);
  queryParams = event.queryStringParameters;

  if (!checkIfUserIsAdmin(userFull)) {
    return RESPONSE_404;
  }
  return await getAllRecordsFromQuery(
    queryParams,
    aws_dynamo.getRechargeRecordsAdmin
  );
}

async function getAllRecordsFromQuery(queryParams, queryFunction) {
  sizeOfRecordList = queryParams["size"];
  lastRecord = queryParams["last_record"];

  transactions = await queryFunction(sizeOfRecordList, lastRecord);

  lastRecordInTransaction = transactions.LastEvaluatedKey;
  records = parseRecordList(transactions);

  return returnRequest(
    200,
    JSON.stringify({
      records: records,
      lastRecord: lastRecordInTransaction,
    })
  );
}

module.exports.searchCards = searchCards;
module.exports.createCard = createCard;
module.exports.updateCard = updateCard;
module.exports.getPrivateInfoToken = getPrivateInfoToken;
module.exports.listTransactionRecords = listTransactionRecords;
module.exports.listAdjusmentRecords = listAdjusmentRecords;
module.exports.listNotificationRecords = listNotificationRecords;
module.exports.listRechargeRecords = listRechargeRecords;
module.exports.activateCard = activateCard;
module.exports.getTransactionAllRecords = getTransactionAllRecords;
module.exports.getNotificationAllRecords = getNotificationAllRecords;
module.exports.getAdjusmentsAllRecords = getAdjusmentAllRecords;
module.exports.getRechargeAllRecords = getRechargeAllRecords;
