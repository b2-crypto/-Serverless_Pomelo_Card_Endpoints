const request = require("superagent");

const POMELO_API_AUTH = process.env.POMELO_API_AUTH;
const POMELO_CLIENT_ID = process.env.POMELO_CLIENT_ID;
const POMELO_SECRET_KEY = process.env.POMELO_SECRET_KEY;
const POMELO_AUDIENCE = process.env.POMELO_AUDIENCE;
const POMELO_ENDPOINT = process.env.POMELO_ENDPOINT;

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
  token = await getAuthToken();
  res = await request
    .post(POMELO_ENDPOINT + "/cards/v1/")
    .send(cardInfoJson)
    .set("Content-Type", "application/json")
    .set("Authorization", "Bearer " + token);

  return res.text;
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

module.exports.createCard = createCard;
module.exports.modifyCard = modifyCard;
module.exports.getTokenForPrivateInfo = getTokenForPrivateInfo;
