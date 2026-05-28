const { createClient } = require('@supabase/supabase-js');
const stringSimilarity = require('string-similarity');
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

  function cleanName(n) {
      return n.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim();
  }

  const groups = [];
  const SIMILARITY_THRESHOLD = 0.85;

  console.log("Finding similar stations...");
  for (let i = 0; i < allStations.length; i++) {
    const station = allStations[i];
    if (!station.name) continue;
    
    const cleanedName = cleanName(station.name);
    let matchedGroup = null;

    for (let g of groups) {
      const leadName = cleanName(g.stations[0].name);
      const similarity = stringSimilarity.compareTwoStrings(cleanedName, leadName);
      
      const isSubset = cleanedName.includes(leadName) || leadName.includes(cleanedName);
      const isSubsetHighConfidence = isSubset && (Math.min(cleanedName.length, leadName.length) > 10) && similarity > 0.6;
      
      if (similarity > SIMILARITY_THRESHOLD || isSubsetHighConfidence) {
        matchedGroup = g;
        break;
      }
    }

    if (matchedGroup) {
      matchedGroup.stations.push(station);
    } else {
      groups.push({
        stations: [station]
      });
    }
  }

  const duplicates = groups.filter(g => g.stations.length > 1);
  duplicates.sort((a, b) => b.stations.length - a.stations.length);

  let md = `# Stations with Similar Names\n\n`;
  md += `Found ${duplicates.length} groups of radio stations with similar names in the database.\n\n`;

  for (const group of duplicates) {
    const lead = group.stations[0];
    md += `### ${lead.name} (${group.stations.length} stations)\n`;
    for (const st of group.stations) {
      md += `- ${st.name} (URL: ${st.stream_url})\n`;
    }
    md += `\n`;
  }

  const fs = require('fs');
  fs.writeFileSync('similar_stations_fuzzy.md', md);
  console.log('Saved to similar_stations_fuzzy.md');
}

main();
