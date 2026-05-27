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
      .select('id, name, city, department')
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
    
    const nameLower = s.name.toLowerCase();
    const cityLower = s.city ? s.city.toLowerCase() : '';
    const deptLower = s.department ? s.department.toLowerCase() : '';
    
    let matchedLocation = null;
    let reason = '';
    
    // We only want to flag it if the city/state name is a distinct word in the string
    // and has length > 3 to avoid matching "in" or "or" etc.
    
    if (cityLower && cityLower.length > 3 && new RegExp(`\\b${cityLower.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\$&')}\\b`).test(nameLower)) {
        matchedLocation = s.city;
        reason = 'city';
    } else if (deptLower && deptLower.length > 3 && new RegExp(`\\b${deptLower.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\$&')}\\b`).test(nameLower)) {
        matchedLocation = s.department;
        reason = 'department';
    }
    
    // check for specific suffixes like " - New York, NY" or " Chicago"
    // often separated by dash or comma
    
    if (matchedLocation) {
        matches.push({
            id: s.id,
            name: s.name,
            matched: matchedLocation,
            type: reason
        });
    }
  }

  console.log(`Found ${matches.length} stations with city/state in name.`);
  console.log("Sample 50:");
  matches.slice(0, 50).forEach(m => {
      console.log(`- "${m.name}" (Matched ${m.type}: ${m.matched})`);
  });
}
main();
