const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  let allStations = [];
  let from = 0;
  let to = 999;
  let hasMore = true;

  console.log("Fetching stations...");
  while (hasMore) {
    const { data, error } = await supabase.from('stations').select('id, name, stream_url').range(from, to);
    if (error) {
      console.error(error);
      break;
    }
    if (data.length === 0) {
      hasMore = false;
    } else {
      allStations = allStations.concat(data);
      from += 1000;
      to += 1000;
    }
  }

  console.log(`Fetched ${allStations.length} stations.`);

  const groups = {};
  for (const station of allStations) {
    if (!station.name) continue;
    let normalized = station.name.toLowerCase().trim();
    // Normalization: remove punctuation and extra spaces
    normalized = normalized.replace(/[^\w\s&]/gi, '').replace(/\s+/g, ' ');
    if (!groups[normalized]) {
      groups[normalized] = {
        name: station.name,
        stations: []
      };
    }
    groups[normalized].stations.push(station);
  }

  const duplicates = Object.values(groups).filter(g => g.stations.length > 1);
  duplicates.sort((a, b) => b.stations.length - a.stations.length);

  let md = `# Stations with Similar Names\n\n`;
  md += `Found ${duplicates.length} groups of stations with identical or highly similar names after normalization.\n\n`;

  for (const group of duplicates) {
    md += `### ${group.name} (${group.stations.length} stations)\n`;
    for (const st of group.stations) {
      md += `- ${st.name} (URL: ${st.stream_url})\n`;
    }
    md += `\n`;
  }

  const fs = require('fs');
  fs.writeFileSync('similar_stations_full.md', md);
  console.log('Saved to similar_stations_full.md');
}

main();
