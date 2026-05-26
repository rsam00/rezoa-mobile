const { createClient } = require('@supabase/supabase-js');
const https = require('https');

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://glpnkailgttqvyyfeuoo.supabase.co';
const SUPABASE_KEY = 'sb_secret_Fxv_TDwdPNSDglpeI8hi4g_8v6X8Wt6'; // Service role key

if (!SUPABASE_KEY || SUPABASE_KEY === 'ENTER_YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ Error: Please provide your Supabase SERVICE_ROLE_KEY in the script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const args = process.argv.slice(2);
let targetCountry = 'United States';
let targetState = null;
let fetchLimit = 1000;
let fetchAllStates = false;

args.forEach(arg => {
  if (arg.startsWith('--country=')) targetCountry = arg.split('=')[1];
  else if (arg.startsWith('--state=') || arg.startsWith('--department=')) targetState = arg.split('=')[1];
  else if (arg.startsWith('--limit=')) fetchLimit = parseInt(arg.split('=')[1], 10);
  else if (arg === '--all-us-states') fetchAllStates = true;
});

async function processState(serverHostname, country, stateName, limit, existingNames, existingUrls) {
  console.log(`\n==============================================`);
  console.log(`📍 Processing State: ${stateName}`);
  console.log(`==============================================`);

  let apiUrl = `https://${serverHostname}/json/stations/search?countryExact=${encodeURIComponent(country)}&state=${encodeURIComponent(stateName)}&limit=${limit}&hidebroken=true&order=clickcount&reverse=true`;

  try {
    const stationsData = await fetchJson(apiUrl);
    if (!stationsData || stationsData.length === 0) {
      console.log(`⚠️ No stations found for ${stateName}`);
      return;
    }

    let formattedStations = stationsData.map(station => {
      const tagsArray = station.tags ? station.tags.split(',').map(t => t.trim()).filter(t => t) : [];
      return {
        id: station.stationuuid,
        name: station.name.trim(),
        logo: station.favicon || null,
        stream_url: station.url_resolved || station.url,
        website: station.homepage || null,
        department: station.state || stateName,
        country: station.country || country,
        language: station.language ? station.language.split(',')[0] : null,
        description: '',
        frequency: '',
        tags: tagsArray,
        favorite_count: 0,
        click_count: station.clickcount || 0,
      };
    }).filter(s => s.name && s.stream_url);

    const originalCount = formattedStations.length;
    formattedStations = formattedStations.filter(s => {
      const normName = normalizeName(s.name);
      const nameMatch = normName.length > 3 && existingNames.has(normName);
      const urlMatch = existingUrls.has(s.stream_url.toLowerCase().trim());
      return !nameMatch && !urlMatch;
    });

    console.log(`🧹 Deduplication skipped ${originalCount - formattedStations.length} stations.`);

    if (formattedStations.length === 0) {
      console.log('🛑 All fetched stations already exist. Skipping.');
      return;
    }

    console.log(`💾 Upserting ${formattedStations.length} new stations into Supabase...`);
    const { error } = await supabase.from('stations').upsert(formattedStations, { onConflict: 'id' });
    if (error) throw error;

    // Add new stations to our sets to prevent duplicates in subsequent loops
    formattedStations.forEach(s => {
      const normName = normalizeName(s.name);
      if (normName.length > 3) existingNames.add(normName);
      existingUrls.add(s.stream_url.toLowerCase().trim());
    });

    console.log(`🎉 Successfully synced ${formattedStations.length} stations for ${stateName}!`);
  } catch (err) {
    console.error(`❌ Failed to process ${stateName}:`, err.message);
  }
}

async function fetchAndSeed() {
  console.log(`🚀 Starting Radio Browser Fetch...`);

  console.log('🔍 Fetching all existing stations from database for global deduplication...');
  const { data: existingStations, error: fetchError } = await supabase.from('stations').select('name, stream_url');

  const existingNames = new Set();
  const existingUrls = new Set();

  if (fetchError) {
    console.warn('⚠️ Could not fetch existing stations, deduplication may be skipped.', fetchError);
  } else if (existingStations) {
    existingStations.forEach(s => {
      if (s.name) {
        const normName = normalizeName(s.name);
        if (normName.length > 3) existingNames.add(normName);
      }
      if (s.stream_url) existingUrls.add(s.stream_url.toLowerCase().trim());
    });
    console.log(`✅ Loaded ${existingStations.length} existing stations to check against.`);
  }

  try {
    console.log('\n📡 Finding an available Radio Browser server...');
    const servers = await fetchJson('https://all.api.radio-browser.info/json/servers');
    if (!servers || servers.length === 0) throw new Error('No Radio Browser servers found.');
    const serverHostname = servers[0].name;

    if (fetchAllStates) {
      console.log(`🇺🇸 Looping through all 50 US States (Limit: ${fetchLimit} per state)...`);
      for (const state of US_STATES) {
        await processState(serverHostname, 'United States', state, fetchLimit, existingNames, existingUrls);
        // Add a 5 second delay between states to prevent hammering the API
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      console.log(`\n🏁 Finished syncing all 50 states!`);
    } else {
      let stateToProcess = targetState;
      if (!stateToProcess && targetCountry === 'United States') {
        console.log("Tip: You can run this with --all-us-states to loop through all 50 states automatically!");
      }

      let apiUrl = `https://${serverHostname}/json/stations/search?countryExact=${encodeURIComponent(targetCountry)}`;
      if (targetState) apiUrl += `&state=${encodeURIComponent(targetState)}`;
      apiUrl += `&limit=${fetchLimit}&hidebroken=true&order=clickcount&reverse=true`;

      console.log(`📥 Fetching data from: ${serverHostname}...`);
      const stationsData = await fetchJson(apiUrl);
      if (!stationsData || stationsData.length === 0) {
        console.log(`⚠️ No stations found.`);
        return;
      }

      let formattedStations = stationsData.map(station => {
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

      const originalCount = formattedStations.length;
      formattedStations = formattedStations.filter(s => {
        const nameMatch = existingNames.has(s.name.toLowerCase().trim());
        const urlMatch = existingUrls.has(s.stream_url.toLowerCase().trim());
        return !nameMatch && !urlMatch;
      });

      console.log(`🧹 Deduplication skipped ${originalCount - formattedStations.length} stations.`);

      if (formattedStations.length === 0) {
        console.log('🛑 All fetched stations already exist in the database! Nothing to do.');
        return;
      }

      console.log(`💾 Upserting ${formattedStations.length} stations into Supabase...`);
      const { error } = await supabase.from('stations').upsert(formattedStations, { onConflict: 'id' });
      if (error) throw error;
      console.log(`🎉 Successfully synced ${formattedStations.length} stations!`);
    }
  } catch (err) {
    console.error('❌ Fetch failed:', err.message || err);
  }
}

fetchAndSeed();
