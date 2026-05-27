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
      .select('id, name, frequency')
      .range(page * pageSize, (page + 1) * pageSize - 1);
      
    if (error) {
      console.error(error);
      return;
    }
    if (stations.length === 0) break;
    allStations = allStations.concat(stations);
    page++;
  }

  const freqRegex = /\b(\d{2,3}(?:\.\d{1,2})?)\s*(FM|AM)?\b/i;
  
  const stationsWithFreq = allStations.filter(s => {
    // Only check if frequency is not already populated or if it's in the name
    const match = s.name.match(freqRegex);
    if (!match) return false;
    
    // Ignore cases where the "number" is obviously not a frequency
    const num = parseFloat(match[1]);
    if (match[2]) {
        return true; // Explicit AM/FM
    }
    // FM typical range: 87.5 - 108.0
    // AM typical range: 530 - 1710
    if ((num >= 87.5 && num <= 108.0) || (num >= 530 && num <= 1710 && num % 10 === 0)) {
        return true;
    }
    return false;
  });

  console.log(`Total stations: ${allStations.length}`);
  console.log(`Stations with frequency in name: ${stationsWithFreq.length}`);
  console.log("Sample:");
  stationsWithFreq.slice(0, 50).forEach(s => console.log(`- ${s.name} (Current Freq: ${s.frequency || 'null'})`));
}
main();
