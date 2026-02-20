// Database Setup Script
// This script will automatically run the FULL_SETUP.sql migration

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://eghmlddbkkxnxflgrgvm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnaG1sZGRia2t4bnhmbGdyZ3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MDQzMDUsImV4cCI6MjA3OTI4MDMwNX0.vsqXQdwlD5Su5tKcff13YjHgCRE9vc_WT3SldTCTM0w';

async function setupDatabase() {
  try {
    console.log('🚀 Reading FULL_SETUP.sql...');
    const sqlFile = path.join(__dirname, 'supabase', 'migrations', 'FULL_SETUP.sql');
    const sqlScript = fs.readFileSync(sqlFile, 'utf8');

    console.log('📡 Connecting to Supabase...');
    
    // Split SQL into individual statements
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip comments
      if (statement.trim().startsWith('--')) continue;
      
      // Show progress
      const preview = statement.substring(0, 60).replace(/\n/g, ' ');
      process.stdout.write(`[${i + 1}/${statements.length}] ${preview}...`);

      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ query: statement })
        });

        if (response.ok) {
          console.log(' ✅');
          successCount++;
        } else {
          // Try direct SQL execution endpoint
          const response2 = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ query: statement })
          });
          
          if (response2.ok) {
            console.log(' ✅');
            successCount++;
          } else {
            console.log(` ⚠️ (${response2.status})`);
            errorCount++;
          }
        }
      } catch (error) {
        console.log(` ❌ Error: ${error.message}`);
        errorCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Success: ${successCount} statements`);
    console.log(`❌ Errors: ${errorCount} statements`);
    console.log('='.repeat(50));

    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. This might be normal if:');
      console.log('   - Tables already exist');
      console.log('   - Policies are being recreated');
      console.log('   - Some statements need higher privileges');
      console.log('\n💡 For complete setup, please run FULL_SETUP.sql in');
      console.log('   Supabase Dashboard > SQL Editor');
    } else {
      console.log('\n🎉 Database setup complete!');
      console.log('   You can now start your app with: npm start');
    }

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\n📝 Manual setup required:');
    console.log('   1. Go to: https://supabase.com/dashboard');
    console.log('   2. Open SQL Editor');
    console.log('   3. Copy contents of: supabase/migrations/FULL_SETUP.sql');
    console.log('   4. Paste and run');
  }
}

console.log('🎮 Mafia Game - Database Setup\n');
setupDatabase();
