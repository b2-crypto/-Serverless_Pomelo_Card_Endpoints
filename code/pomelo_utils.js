const request = require("superagent");

POMELO_URL = process.env.POMELO_ENDPOINTS_URL;
POMELO_CLIENT_ID = process.env.POMELO_CLIENT_ID;
POMELO_SECRET = process.env.POMELO_SECRET;

async function requestPomeloBearerToken() {
    result = null;
    await request
      .post(POMELO_URL + "/oauth/token")
      .send({
        client_id: POMELO_CLIENT_ID,
        client_secret: POMELO_SECRET,
        audience: "https://auth-staging.pomelo.la",
        grant_type: "client_credentials",
      })
      .then((response) => {
        result = response["_body"].access_token;
      });
    return result;
  }

  module.exports.requestToken = requestPomeloBearerToken