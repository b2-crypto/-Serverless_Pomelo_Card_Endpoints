const REGION_ID = process.env.AMAZON_REGION;
const TABLE_DYNAMO_CARD = process.env.CARD_TABLE;
const TABLE_DYNAMO_USER = process.env.TABLE_DYNAMO_USER_TABLE;

const AWS = require("aws-sdk");
AWS.config.update({ region: REGION_ID });

var dynamoClient = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

async function getUser(userId) {
  console.log(userId);
  var params = {
    TableName: TABLE_DYNAMO_USER,
    Key: {
      B2CryptoUserID: { S: userId },
    },
  };

  response = null;

  try {
    data = await dynamoClient.getItem(params).promise();
    response = data.Item;
  } catch (error) {
    console.log("Error on Promise");
    console.log(error);
  }
  return response;
}

async function getCardsOfUser(userId) {}

module.exports.getUser = getUser;
