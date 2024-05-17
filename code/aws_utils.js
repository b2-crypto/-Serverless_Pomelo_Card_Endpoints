const REGION_ID = process.env.REGION_ID;
const TABLE_DYNAMO_USER = process.env.TABLE_DYNAMO_USER_TABLE;
const TABLE_DYNAMO_TRANSACTION = process.env.TABLE_DYNAMO_CARD_TRANSACTIONS;
const TABLE_DYNAMO_NOTIFICATION = process.env.TABLE_DYNAMO_CARD_NOTIFICATION;
const TABLE_DYNAMO_ADJUSTMENT = process.env.TABLE_DYNAMO_CARD_ADJUSMENT;
const TABLE_DYNAMO_CARD_ACTIVATION = process.env.TABLE_DYNAMO_CARD_ACTIVATION;
const TABLE_DYNAMO_CARD_TYPE = process.env.TABLE_DYNAMO_CARD_TYPE;

const AWS = require("aws-sdk");
const logger = require("./logger");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS,
  secretAccessKey: process.env.AWS_SECRET,
});
AWS.config.update({ region: REGION_ID });
var dynamoClient = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

async function executeQuery(params) {
  try {
    data = await dynamoClient.query(params).promise();
    return data;
  } catch (error) {
    logger.log("error", error);
    return [];
  }
}

async function executeScan(params) {
  try {
    data = await dynamoClient.scan(params).promise();
    return data;
  } catch (error) {
    logger.log("error", error);
    return [];
  }
}

async function getUser(userId) {
  var params = {
    TableName: TABLE_DYNAMO_USER,
    Key: {
      id: { S: userId },
    },
  };

  response = null;

  try {
    data = await dynamoClient.getItem(params).promise();
    response = data.Item;
  } catch (error) {
    logger.log("error", error);
  }
  return response;
}

async function getUserUsingPomeloID(pomeloId) {
  var params = {
    TableName: TABLE_DYNAMO_USER,
    KeyConditionExpression: "PomeloUserID = :pomelouserid",
    ExpressionAttributeValues: {
      ":pomelouserid": { S: pomeloId },
    },
    IndexName: "PomeloUserID-index",
  };
  return await executeQuery(parms);
}

async function getTransactionRecords(cardID) {
  var params = {
    TableName: TABLE_DYNAMO_TRANSACTION,
    KeyConditionExpression: "creditCardPomeloID = :cardid",
    ExpressionAttributeValues: {
      ":cardid": { S: cardID },
    },
    IndexName: "creditCardPomeloID-index",
  };

  return await executeQuery(params);
}

async function getNotificationRecords(cardID) {
  var params = {
    TableName: TABLE_DYNAMO_NOTIFICATION,
    KeyConditionExpression: "creditCardPomeloID = :cardid",
    ExpressionAttributeValues: {
      ":cardid": { S: cardID },
    },
    IndexName: "creditCardPomeloID-index",
  };

  return await executeQuery(params);
}

async function getAdjusmentRecords(cardID) {
  var params = {
    TableName: TABLE_DYNAMO_CARD_ADJUSMENT,
    KeyConditionExpression: "creditCardPomeloID = :cardid",
    ExpressionAttributeValues: {
      ":cardid": { S: cardID },
    },
    IndexName: "creditCardPomeloID-index",
  };
  return await executeQuery(params);
}

async function getActiveActivationRequestRecords(userID) {
  var params = {
    TableName: TABLE_DYNAMO_CARD_ACTIVATION,
    KeyConditionExpression: "userID = :userid",
    FilterExpression: "activation = :activation",
    ExpressionAttributeValues: {
      ":userid": { S: userID },
      ":activation": { N: 1 },
    },
  };

  return await executeQuery(params);
}

async function getCardTypeByPartner(partner) {
  var parms = {
    TableName: TABLE_DYNAMO_CARD_TYPE,
    FilterExpression: "partner = :partner",
    ExpressionAttributeValues: {
      ":partner": { S: partner },
    },
  };

  return await executeScan(params);
}

async function getTransactionRecordAdmin(size, lastRecord) {
  return await getTableRecordWithPagination(
    TABLE_DYNAMO_TRANSACTION,
    size,
    lastRecord
  );
}

async function getNotificationRecordAdmin(size, lastRecord) {
  return await getTableRecordWithPagination(
    TABLE_DYNAMO_NOTIFICATION,
    size,
    lastRecord
  );
}

async function getAdjusmentRecordAdmin(size, lastRecord) {
  return await getTableRecordWithPagination(
    TABLE_DYNAMO_ADJUSTMENT,
    size,
    lastRecord
  );
}

async function getTableRecordWithPagination(TableName, size, lastRecord) {
  const params = {
    TableName: TableName,
    Limit: size,
  };
  if (lastRecord) {
    params[ExclusiveStartKey] = lastRecord;
  }

  return await executeScan(params);
}

module.exports.getUser = getUser;
module.exports.getTransactionRecords = getTransactionRecords;
module.exports.getNotificationRecords = getNotificationRecords;
module.exports.getAdjusmentRecords = getAdjusmentRecordAdmin;
module.exports.getAdjusmentRecords = getAdjusmentRecords;
module.exports.getUserUsingPomeloID = getUserUsingPomeloID;
module.exports.getActiveActivationRequestRecords =
  getActiveActivationRequestRecords;
module.exports.getCardTypeByPartner = getCardTypeByPartner;
module.exports.getTransactionRecordAdmin = getTransactionRecordAdmin;
module.exports.getNotificationRecordAdmin = getNotificationRecordAdmin;
module.exports.getAdjusmentRecordAdmin = getAdjusmentRecordAdmin;
