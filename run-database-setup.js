const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🚀 Mafia Game - Database Setup Script\n');
console.log('Reading FULL_SETUP.sql...');

const sqlPath = path.join(__dirname, 'supabase', 'migrations', 'FULL_SETUP.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

console.log('✅ SQL file loaded\n');
console.log('⚠️  IMPORTANT:');
console.log('This script cannot execute DDL commands (CREATE TABLE, etc.)');
console.log('because the anon key does not have sufficient permissions.\n');
console.log('📝 You need to run this SQL manually:\n');
console.log('1. Go to: https://supabase.com/dashboard');
console.log('2. Select project: ohjweanlhqjdtfxgehrs');
console.log('3. Click "SQL Editor" → "+ New query"');
console.log('4. Press Ctrl+V (SQL is in clipboard)');
console.log('5. Click "Run" or Ctrl+Enter\n');

console.log('✅ Expected result: "Success. No rows returned"');
console.log('✅ Then check "Table Editor" for 5 new tables\n');

// Copy to clipboard again
const { exec } = require('child_process');
const clipboardCommand = process.platform === 'win32' 
  ? `echo ${sqlContent} | clip`
  : process.platform === 'darwin'
  ? `echo "${sqlContent}" | pbcopy`
  : `echo "${sqlContent}" | xclip -selection clipboard`;

exec(`powershell -command "Set-Clipboard -Value (Get-Content '${sqlPath}' -Raw)"`, (error) => {
  if (!error) {
    console.log('📋 SQL copied to clipboard again!\n');
  }
  
  console.log('🎯 Quick Link:');
  console.log('https://supabase.com/dashboard/project/ohjweanlhqjdtfxgehrs/sql/new\n');
  
  console.log('Press Ctrl+C to exit, then go to Supabase dashboard.');
});
