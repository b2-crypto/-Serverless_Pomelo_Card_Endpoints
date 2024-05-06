const REGION_ID = process.env.REGION_ID;
const TABLE_DYNAMO_USER = process.env.TABLE_DYNAMO_USER_TABLE;
const TABLE_DYNAMO_TRANSACTION = process.env.TABLE_DYNAMO_CARD_TRANSACTIONS;
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
  try {
    data = await dynamoClient.query(params).promise();
    return data;
  } catch (error) {
    logger.log("error", error);
    return [];
  }
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
  try {
    data = await dynamoClient.query(params).promise();
    return data;
  } catch (error) {
    logger.log("error", error);
    return [];
  }
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
  try {
    data = await dynamoClient.query(params).promise();
    return data;
  } catch (error) {
    logger.log("error", error);
    return [];
  }
}

async function getCardTypeByPartner(partner) {
  var parms = {
    TableName: TABLE_DYNAMO_CARD_TYPE,
    FilterExpression: "partner = :partner",
    ExpressionAttributeValues: {
      ":patener": { S: partner },
    },
  };

  try {
    data = await dynamoClient.scan(params).promise();
    return data;
  } catch (error) {
    logger.log("error", error);
    return [];
  }
}

async function getTableRecordWithPagination(TableName, size, lastRecord) {
  const params = {
    TableName: TableName,
    Limit: size,
  };
  if (lastRecord) {
    params[ExclusiveStartKey] = lastRecord;
  }

  try {
    data = await dynamoClient.scan(params).promise();
    return data;
  } catch (error) {
    logger.log("error", error);
    return [];
  }
}

module.exports.getUser = getUser;
module.exports.getTransactionRecords = getTransactionRecords;
module.exports.getUserUsingPomeloID = getUserUsingPomeloID;
module.exports.getActiveActivationRequestRecords =
  getActiveActivationRequestRecords;
module.exports.getCardTypeByPartner = getCardTypeByPartner;

