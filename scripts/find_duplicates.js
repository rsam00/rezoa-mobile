const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://glpnkailgttqvyyfeuoo.supabase.co';
const supabaseKey = 'sb_secret_Fxv_TDwdPNSDglpeI8hi4g_8v6X8Wt6'; // Service role key

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Normalize a stream URL
function normalizeUrl(url) {
  if (!url) return '';
  return url.toLowerCase().trim().replace(/\/$/, ''); // Remove trailing slash
}

// Normalize a name
function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, ' ') // Remove content in parentheses
    .replace(/radio/g, '')
    .replace(/fm/g, '')
    .replace(/am/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

async function findDuplicates() {
  console.log('🚀 Scanning Supabase for duplicates...');

  try {
    let allStations = [];
    let hasMore = true;
    let start = 0;
    const limit = 1000;

    process.stdout.write('🔍 Fetching all stations... ');

    while (hasMore) {
      const { data: chunk, error } = await supabase
        .from('stations')
        .select('id, name, stream_url')
        .range(start, start + limit - 1);

      if (error) throw error;

      if (chunk.length > 0) {
        allStations.push(...chunk);
        start += limit;
      }

      if (chunk.length < limit) hasMore = false;
    }

    console.log(`✅ Loaded ${allStations.length} stations.\n`);

    // --- Check for Duplicate URLs ---
    const urlMap = new Map();
    allStations.forEach(s => {
      const url = normalizeUrl(s.stream_url);
      if (url.length < 5) return;
      if (!urlMap.has(url)) urlMap.set(url, []);
      urlMap.get(url).push(s);
    });

    let duplicateUrlCount = 0;
    console.log('==============================================');
    console.log('🚨 DUPLICATES BY EXACT STREAM URL:');
    console.log('==============================================');
    for (const [url, stations] of urlMap.entries()) {
      if (stations.length > 1) {
        duplicateUrlCount++;
        console.log(`\n🔗 URL: ${url}`);
        stations.forEach(s => console.log(`   - [${s.id}] ${s.name}`));
      }
    }
    if (duplicateUrlCount === 0) console.log('   ✅ No stream URL duplicates found!');

    // --- Check for Duplicate Names ---
    const nameMap = new Map();
    allStations.forEach(s => {
      const name = normalizeName(s.name);
      if (name.length < 3) return; // Ignore very short names
      if (!nameMap.has(name)) nameMap.set(name, []);
      nameMap.get(name).push(s);
    });

    let duplicateNameCount = 0;
    console.log('\n==============================================');
    console.log('🚨 POTENTIAL DUPLICATES BY STATION NAME:');
    console.log('==============================================');
    for (const [name, stations] of nameMap.entries()) {
      if (stations.length > 1) {
        duplicateNameCount++;
        console.log(`\n🎙️  Normalized Name Match: "${name}"`);
        stations.forEach(s => console.log(`   - [${s.id}] ${s.name}  -->  URL: ${s.stream_url}`));
      }
    }
    if (duplicateNameCount === 0) console.log('   ✅ No name duplicates found!');

    console.log(`\n📊 Summary: Found ${duplicateUrlCount} duplicate URL groups and ${duplicateNameCount} duplicate name groups.`);

  } catch (err) {
    console.error('\n❌ Scan failed:', err);
  }
}

findDuplicates();
