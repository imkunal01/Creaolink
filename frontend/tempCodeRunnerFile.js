const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'kunal',
  port: 5432,
});

client.connect()
  .then(() => console.log("Connected ✅"))
  .catch(err => console.error("Error ❌", err))
  .finally(() => client.end());