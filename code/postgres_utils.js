const { Client } = require("pg");

const POSTGRES_USER = process.env.POSTGRES_USER;
const HOST_DATABASE = process.env.HOST_DATABASE;
const HOST_PORT = process.env.HOST_PORT;
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;
const HOST_POSTGRES = process.env.HOST_POSTGRES;

const INSERT_CARD =
  "INSERT INTO cards (partner_card_id, id, balance, partner, user_id) VALUES($1, nextval('cards_id_seq'::regclass), $2, $3, $4)";

const client = new Client({
  user: POSTGRES_USER,
  host: HOST_POSTGRES,
  database: HOST_DATABASE,
  password: POSTGRES_PASSWORD,
  port: HOST_PORT,
  ssl: { rejectUnauthorized: false },
});

async function proccessCreateCard(partnerCardId, balance, partner, userId) {
  return await proccessOperation(INSERT_CARD, [
    partnerCardId,
    balance,
    partner,
    userId,
  ]);
}

async function proccessOperation(query, parameters) {
  await client.connect();
  response = await client.query(query, parameters);
  if (response.rowCount == 1) {
    await client.query("COMMIT");
    return response;
  }
  await client.end();
  throw Error(
    "Number of modified records does not correspond to what was expected."
  );
}

module.exports.proccessCreateCard = proccessCreateCard;
