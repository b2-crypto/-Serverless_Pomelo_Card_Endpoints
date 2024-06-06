const request = require("superagent");
const logger = require("./logger");

const POMELO_CLIENT_ID = process.env.POMELO_CLIENT_ID;
const POMELO_SECRET_KEY = process.env.POMELO_SECRET_KEY;
const POMELO_AUDIENCE = process.env.POMELO_AUDIENCE;
const POMELO_ENDPOINT = process.env.POMELO_ENDPOINT;
const POMELO_SHIPMENT_TYPE = "CARD_FROM_WAREHOUSE";

async function getAuthToken() {
  let res = await request.post(POMELO_ENDPOINT + "/oauth/token").send({
    client_id: POMELO_CLIENT_ID,
    client_secret: POMELO_SECRET_KEY,
    audience: POMELO_AUDIENCE,
    grant_type: "client_credentials",
  });

  return res["_body"]["access_token"];
}

async function createCard(cardInfoJson) {
  try {
    let token = await getAuthToken();
    let res = await request
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
  let token = await getAuthToken();
  let res = await request
    .patch(POMELO_ENDPOINT + "/cards/v1/" + cardId)
    .send(userJson)
    .set("Content-Type", "application/json")
    .set("Authorization", "Bearer " + token);

  return res.text;
}

async function getTokenForPrivateInfo(user) {
  let token = await getAuthToken();
  let res = await request
    .post(POMELO_ENDPOINT + "/secure-data/v1/token")
    .send({ user_id: user })
    .set("Content-Type", "application/json")
    .set("Authorization", "Bearer " + token);

  return res.text;
}

async function activateCard(userId, pin, activationCode) {
  let token = await getAuthToken();
  let res = await request
    .post(POMELO_ENDPOINT + "/cards/v1/activation")
    .send({ user_id: userId, pin: pin, pan: pan })
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
  let token = await getAuthToken();
  let res = await request
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
  let token = await getAuthToken();
  let res = await request
    .get(POMELO_ENDPOINT + "/cards/v1/" + cardId)
    .set("Content-Type", "application/json")
    .set("Authorization", "Bearer " + token);

  return JSON.parse(res.text);
}

async function searchCardsByUser(userId) {
  let token = await getAuthToken();
  let pagesToSearch = 1;
  let currentPage = 0;
  let data = [];

  do {
    let res = await request
      .get(POMELO_ENDPOINT + "/cards/v1/")
      .query({ "filter[user_id]": userId })
      .query({ "page[size]": 5 })
      .query({"page[number]": currentPage })
      .set("Content-Type", "application/json")
      .set("Authorization", "Bearer " + token);

    response = JSON.parse(res.text);
    cardData = response.data;
    metadata = response.meta;

    data = data.concat(cardData);

    currentPage = metadata.pagination.current_page + 1;
    pagesToSearch = metadata.pagination.total_pages;
  } while (currentPage < pagesToSearch);
  return data;
}

module.exports.createCard = createCard;
module.exports.modifyCard = modifyCard;
module.exports.getTokenForPrivateInfo = getTokenForPrivateInfo;
module.exports.activateCard = activateCard;
module.exports.getCard = getCard;
module.exports.searchCardsByUser = searchCardsByUser;
