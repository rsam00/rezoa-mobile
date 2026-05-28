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

  console.log("Fetching stations to search for adult content...");
  while (hasMore) {
    const { data, error } = await supabase.from('stations').select('id, name, description, tags').range(from, to);
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

  const keywords = ['erotica', 'adult', 'nsfw', 'sex', 'porn', 'xxx', '18+', 'mature'];
  const adultStations = [];

  for (const station of allStations) {
    const textToSearch = `${station.name} ${station.description} ${station.tags}`.toLowerCase();
    
    // Check if any keyword exists as a whole word, or just substring for some
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(textToSearch) || textToSearch.includes('erotica') || textToSearch.includes('xxx') || textToSearch.includes('nsfw')) {
        // Exclude false positives for "adult" like "adult contemporary"
        if (keyword === 'adult' && (textToSearch.includes('adult contemporary') || textToSearch.includes('adult pop') || textToSearch.includes('young adult') || textToSearch.includes('adult hits') || textToSearch.includes('adult alternative'))) {
           continue; 
        }
        
        // Exclude false positives for "sex" like "sussex" or "essex" or "middlesex"
        if (keyword === 'sex' && (textToSearch.includes('sussex') || textToSearch.includes('essex') || textToSearch.includes('middlesex'))) {
            continue;
        }

        adultStations.push({
            id: station.id,
            name: station.name,
            matchedKeyword: keyword
        });
        break; // Found one, move to next station
      }
    }
  }

  console.log(`\nFound ${adultStations.length} potentially adult/erotica stations:`);
  adultStations.forEach(s => console.log(`- ${s.name} (Matched: ${s.matchedKeyword})`));
}

main();
