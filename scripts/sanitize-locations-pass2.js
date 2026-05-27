const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Fetching stations...');
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

  let updates = [];
  
  for (const s of allStations) {
    if (!s.name) continue;
    
    let newName = s.name;

    // Pattern 1 ONLY: "City, ST" or " - City, ST" at the end
    // Very safe, because ", XX" at the end strongly implies a location
    const stateSuffixRegex = /(?:\s*-\s*|\s+)([a-zA-Z\s\.]+),\s*[A-Z]{2}\s*$/;
    
    if (stateSuffixRegex.test(newName)) {
        newName = newName.replace(stateSuffixRegex, '').trim();
    }
    
    if (newName !== s.name && newName.length > 2) {
        // Clean up any trailing hyphens or commas just in case
        newName = newName.replace(/[\s,-]+$/, '');
        updates.push(`UPDATE stations SET name = '${newName.replace(/'/g, "''")}' WHERE id = '${s.id}';`);
    }
  }

  fs.writeFileSync('scripts/sanitize-locations-pass2.sql', updates.join('\n'));
  console.log(`Generated ${updates.length} update statements in scripts/sanitize-locations-pass2.sql`);
}

main();
