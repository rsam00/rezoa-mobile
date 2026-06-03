const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStations() {
  console.log('🔍 Checking which Top 100 stations are already in Supabase...');

  try {
    // 1. Fetch ALL existing station IDs and stream URLs from Supabase using pagination
    let allExistingStations = [];
    let hasMore = true;
    let start = 0;
    const limit = 1000;

    process.stdout.write('📥 Fetching stations from Supabase... ');

    while (hasMore) {
      const { data: stationsChunk, error } = await supabase
        .from('stations')
        .select('id, stream_url')
        .range(start, start + limit - 1);

      if (error) throw error;

      if (stationsChunk.length > 0) {
        allExistingStations = allExistingStations.concat(stationsChunk);
        start += limit;
      }

      // If we got fewer than the limit, we've reached the end
      if (stationsChunk.length < limit) {
        hasMore = false;
      }
    }

    const existingIds = new Set(allExistingStations.map(s => s.id));
    const existingUrls = new Set(allExistingStations.map(s => (s.stream_url || '').toLowerCase().trim()));

    console.log(`✅ Loaded all ${allExistingStations.length} existing stations.`);

    // 2. Load the downloaded Top 100 lists
    const clicksFile = path.join(__dirname, '../data/global_top_100_clicks.json');
    const votesFile = path.join(__dirname, '../data/global_top_100_votes.json');

    const topClicks = JSON.parse(fs.readFileSync(clicksFile, 'utf8'));
    const topVotes = JSON.parse(fs.readFileSync(votesFile, 'utf8'));

    // Helper to check inclusion
    const checkList = (listName, listData) => {
      let inDbCount = 0;
      let missingCount = 0;

      listData.forEach(station => {
        const isById = existingIds.has(station.id);
        const isByUrl = existingUrls.has((station.streamUrl || '').toLowerCase().trim());

        if (isById || isByUrl) {
          inDbCount++;
        } else {
          missingCount++;
        }
      });

      console.log(`\n📊 Results for ${listName}:`);
      console.log(`   - 🟢 Already in database: ${inDbCount}`);
      console.log(`   - 🔴 Missing: ${missingCount}`);
    };

    checkList('Top 100 by Clicks', topClicks);
    checkList('Top 100 by Votes', topVotes);

  } catch (err) {
    console.error('\n❌ Error checking stations:', err.message);
  }
}

checkStations();
