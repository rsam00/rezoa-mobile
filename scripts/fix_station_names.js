const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  let allStations = [];
  let from = 0;
  let to = 999;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase.from('stations').select('id, name, description').ilike('name', '%Public Radio%').range(from, to);
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

  let sql = '-- Move descriptive parts of Public Radio names to description\n\n';

  for (const station of allStations) {
    // We want to extract Callsign and frequency, e.g. "WTSU 89.9"
    // Regex matches optional starting letters, optional frequency
    const match = station.name.match(/^([A-Z0-9-]{3,6}(?:\s+\d{2,3}(?:\.\d{1,2})?)?)\s+(.*Public Radio.*)/i);
    
    if (match) {
      const newName = match[1].trim();
      const descriptivePart = match[2].trim();
      
      // We append to existing description or create a new one
      let newDesc = station.description ? `${station.description} - ${descriptivePart}` : descriptivePart;
      
      // Escape single quotes for SQL
      const safeName = newName.replace(/'/g, "''");
      const safeDesc = newDesc.replace(/'/g, "''");
      
      sql += `UPDATE stations SET name = '${safeName}', description = '${safeDesc}' WHERE id = '${station.id}';\n`;
    }
  }

  fs.writeFileSync('scripts/fix_station_names.sql', sql);
  console.log('Saved SQL to scripts/fix_station_names.sql');
}

main();
