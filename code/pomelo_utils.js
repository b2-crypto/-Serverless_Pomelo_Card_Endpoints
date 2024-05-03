const request = require("superagent");
const logger = require("./logger");

const POMELO_CLIENT_ID = process.env.POMELO_CLIENT_ID;
const POMELO_SECRET_KEY = process.env.POMELO_SECRET_KEY;
const POMELO_AUDIENCE = process.env.POMELO_AUDIENCE;
const POMELO_ENDPOINT = process.env.POMELO_ENDPOINT;
const POMELO_SHIPMENT_TYPE = "CARD_FROM_WAREHOUSE";

async function getAuthToken() {
  res = await request.post(POMELO_ENDPOINT + "/oauth/token").send({
    client_id: POMELO_CLIENT_ID,
    client_secret: POMELO_SECRET_KEY,
    audience: POMELO_AUDIENCE,
    grant_type: "client_credentials",
  });

  return res["_body"]["access_token"];
}

async function createCard(cardInfoJson) {
  try {
    token = await getAuthToken();
    res = await request
      .post(POMELO_ENDPOINT + "/cards/v1/")
      .send(cardInfoJson)
      .set("Content-Type", "application/json")
      .set("Authorization", "Bearer " + token);

    return res.text;
  } catch (error) {
    logger.log("error", error);
  }
}

async function modifyCard(userJson, cardId) {
  token = await getAuthToken();
  res = await request
    .patch(POMELO_ENDPOINT + "/cards/v1/" + cardId)
    .send(userJson)
    .set("Content-Type", "application/json")
    .set("Authorization", "Bearer " + token);

  return res.text;
}

async function getTokenForPrivateInfo(user) {
  token = await getAuthToken();
  res = await request
    .post(POMELO_ENDPOINT + "/secure-data/v1/token")
    .send({ user_id: user })
    .set("Content-Type", "application/json")
    .set("Authorization", "Bearer " + token);

  return res.text;
}

async function activateCard(userId, pin, activationCode) {
  token = await getAuthToken();
  res = await request
    .post(POMELO_ENDPOINT + "/cards/v1/activation")
    .send({ user_id: userId, pin: pin, activation_code: activationCode })
    .set("Content-Type", "application/json")
    .set("Authorization", "Bearer " + token);

  return res.text;
}

async function createShipment(
  userId,
  affinityGroupId,
  country,
  address,
  receiver
) {
  token = await getAuthToken();
  res = await request
    .post(POMELO_ENDPOINT + "/shipping/v1")
    .send({
      shipment_type: POMELO_SHIPMENT_TYPE,
      user_id: userId,
      affinity_group_id: affinityGroupId,
      country: country,
      address: address,
      receiver: receiver,
    })
    .set("Content-Type", "application/json")
    .set("Authorization", "Bearer " + token);

  return res.text;
}

async function getCard(cardId) {
  token = await getAuthToken();
  res = await request
    .get(POMELO_ENDPOINT + "/cards/v1/" + cardId)
    .set("Content-Type", "application/json")
    .set("Authorization", "Bearer " + token);

  return JSON.parse(res.text);
}

module.exports.createCard = createCard;
module.exports.modifyCard = modifyCard;
module.exports.getTokenForPrivateInfo = getTokenForPrivateInfo;
module.exports.activateCard = activateCard;
module.exports.getCard = getCard;
