const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Oo0702!!%40%40!!@db.kftxsdcfxeiamqwliupo.supabase.co:5432/postgres',
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to database.');

    await client.query(`
      ALTER TABLE linktrees ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#ffffff';
      
      ALTER TABLE links ADD COLUMN IF NOT EXISTS bg_color TEXT DEFAULT 'rgba(255,255,255,0.1)';
      ALTER TABLE links ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#ffffff';

      INSERT INTO storage.buckets (id, name, public) VALUES ('styles', 'styles', true) ON CONFLICT DO NOTHING;
      
      -- Drop policies if they exist to avoid errors, then recreate
      DO $$
      BEGIN
          BEGIN
              CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'styles' );
          EXCEPTION
              WHEN duplicate_object THEN null;
          END;
          
          BEGIN
              CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'styles' );
          EXCEPTION
              WHEN duplicate_object THEN null;
          END;
      END $$;
    `);
    
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

runMigration();
