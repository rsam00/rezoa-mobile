const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  let allStations = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data: stations, error } = await supabase
      .from('stations')
      .select('id, name')
      .range(page * pageSize, (page + 1) * pageSize - 1);
      
    if (error) {
      console.error(error);
      return;
    }
    if (stations.length === 0) break;
    allStations = allStations.concat(stations);
    page++;
  }

  const matches = [];

  for (const s of allStations) {
    if (!s.name) continue;
    
    // Check for trailing ", XX" (state abbreviation)
    if (/(?:,|\s-\s)[a-zA-Z\s]+,?\s*[A-Z]{2}$/.test(s.name) || /,\s*[A-Z]{2}$/.test(s.name)) {
        matches.push(s.name);
        continue;
    }
    
    // Check for trailing " - City" or " - State"
    if (/\s-\s[A-Z][a-zA-Z\s]+$/.test(s.name)) {
        // This might catch things like " - The Mix" but we can visually inspect
        matches.push(s.name);
    }
  }

  console.log(`Found ${matches.length} possible lingering locations.`);
  matches.forEach(m => console.log(m));
}
main();
