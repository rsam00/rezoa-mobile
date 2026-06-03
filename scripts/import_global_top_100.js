const https = require('https');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://glpnkailgttqvyyfeuoo.supabase.co';
const supabaseKey = 'sb_secret_Fxv_TDwdPNSDglpeI8hi4g_8v6X8Wt6'; // Service role key to bypass RLS

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to fetch JSON from a URL
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

// Name normalizer to prevent slight variations creating duplicates
function normalizeName(name) {
  return name.toLowerCase()
    .replace(/radio/g, '')
    .replace(/fm/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

async function importGlobalTop100() {
  console.log('🚀 Starting Global Top 100 Import...');

  try {
    // 1. Fetch ALL existing stations to prevent duplicates
    let existingNames = new Set();
    let existingUrls = new Set();
    let existingIds = new Set();
    
    let hasMore = true;
    let start = 0;
    const limit = 1000;

    process.stdout.write('🔍 Fetching existing database stations for deduplication... ');

    while (hasMore) {
      const { data: chunk, error } = await supabase
        .from('stations')
        .select('id, name, stream_url')
        .range(start, start + limit - 1);

      if (error) throw error;

      if (chunk.length > 0) {
        chunk.forEach(s => {
          existingIds.add(s.id);
          if (s.name) {
            const norm = normalizeName(s.name);
            if (norm.length > 3) existingNames.add(norm);
          }
          if (s.stream_url) {
            existingUrls.add(s.stream_url.toLowerCase().trim());
          }
        });
        start += limit;
      }

      if (chunk.length < limit) hasMore = false;
    }

    console.log(`✅ Loaded ${existingIds.size} existing stations.`);

    // 2. Connect to Radio Browser
    console.log('\n📡 Finding an available Radio Browser server...');
    const servers = await fetchJson('https://all.api.radio-browser.info/json/servers');
    if (!servers || servers.length === 0) throw new Error('No Radio Browser servers found.');
    const serverHostname = servers[0].name;

    // 3. Fetch Top Clicks and Top Votes
    console.log(`📥 Fetching Top 100 by Clicks...`);
    const topClicks = await fetchJson(`https://${serverHostname}/json/stations/topclick/100`);
    
    console.log(`📥 Fetching Top 100 by Votes...`);
    const topVotes = await fetchJson(`https://${serverHostname}/json/stations/topvote/100`);

    // Combine them into one array
    const combinedData = [...topClicks, ...topVotes];

    // 4. Format them to match the exact Supabase Schema
    let formattedStations = combinedData.map(station => {
      const tagsArray = station.tags ? station.tags.split(',').map(t => t.trim()).filter(t => t) : [];
      return {
        id: station.stationuuid,
        name: station.name.trim(),
        logo: station.favicon || null,
        stream_url: station.url_resolved || station.url,
        website: station.homepage || null,
        department: station.state || null,
        country: station.country || null,
        language: station.language ? station.language.split(',')[0] : null,
        description: '',
        frequency: '',
        tags: tagsArray,
        favorite_count: 0,
        click_count: station.clickcount || 0,
      };
    }).filter(s => s.name && s.stream_url);

    // 5. Deduplicate internally (since Clicks & Votes lists might overlap)
    const uniqueMap = new Map();
    formattedStations.forEach(s => {
      if (!uniqueMap.has(s.id)) uniqueMap.set(s.id, s);
    });
    formattedStations = Array.from(uniqueMap.values());
    
    const fetchedCount = formattedStations.length;

    // 6. Filter out stations already in Supabase
    formattedStations = formattedStations.filter(s => {
      const isById = existingIds.has(s.id);
      const isByUrl = existingUrls.has(s.stream_url.toLowerCase().trim());
      const normName = normalizeName(s.name);
      const isByName = normName.length > 3 && existingNames.has(normName);
      
      return !isById && !isByUrl && !isByName;
    });

    console.log(`\n🧹 Deduplication finished.`);
    console.log(`   - Total unique top stations fetched: ${fetchedCount}`);
    console.log(`   - Skipped (already in DB): ${fetchedCount - formattedStations.length}`);
    console.log(`   - New to import: ${formattedStations.length}`);

    // 7. Upsert to Supabase
    if (formattedStations.length === 0) {
      console.log('\n🛑 All fetched top stations already exist in the database! Nothing to do.');
      return;
    }

    console.log(`\n💾 Upserting ${formattedStations.length} new top stations into Supabase...`);
    const { error } = await supabase.from('stations').upsert(formattedStations, { onConflict: 'id' });
    
    if (error) throw error;
    
    console.log(`🎉 Successfully imported ${formattedStations.length} Global Top stations! They are now live in the app.`);

  } catch (err) {
    console.error('\n❌ Import failed:', err);
  }
}

importGlobalTop100();
