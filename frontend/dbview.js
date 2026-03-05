const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://postgres:kunal@localhost:5432/myapp",
});

async function main() {
  const { rows: tables } = await pool.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
  );
  console.log("Tables:", tables.map((t) => t.tablename).join(", "));

  for (const t of tables) {
    console.log(`\n=== ${t.tablename} ===`);
    const { rows } = await pool.query(`SELECT * FROM "${t.tablename}"`);
    if (rows.length === 0) {
      console.log("  (empty)");
    } else {
      console.table(rows);
    }
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
