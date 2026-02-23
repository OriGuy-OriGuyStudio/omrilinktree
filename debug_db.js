const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Oo0702!!%40%40!!@db.kftxsdcfxeiamqwliupo.supabase.co:5432/postgres',
});

async function run() {
  try {
    await client.connect();
    
    // Check linktrees schema
    let res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'linktrees';");
    console.log("linktrees columns:", res.rows);

    // Check links schema
    res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'links';");
    console.log("links columns:", res.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
