const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  let allStations = [];
  let from = 0;
  let to = 999;
  let hasMore = true;

  console.log("Fetching stations...");
  while (hasMore) {
    const { data, error } = await supabase.from('stations').select('id, name, description, city, department').range(from, to);
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

  let sql = '-- Move City and State/Department out of names into description\n\n';
  let updateCount = 0;

  for (const station of allStations) {
    if (!station.name) continue;

    let newName = station.name;
    let descAdditions = [];

    // Helper to escape regex
    function escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
    }

    // 1. If we have a city, look for it in the name. We only want to remove it if it's near the end 
    // or separated, to avoid breaking names that natively start with the city (e.g. "Boston Public Radio").
    // But since the user wants them moved to the description, let's look for `, State` or just `City`.
    // Actually, a simpler regex looking for "City, State" is very effective.
    
    // Generic regex for ", ST" or "City, ST" 
    // matches: "Ann Arbor, MI", "Chicago, IL", "Rochester, NY"
    // Also ignores trailing formats like "(MP3)" or "[AAC]"
    const cityStateRegex = /\s+([a-z\s]+?),\s*([A-Z]{2})\b/i;
    const matchCityState = newName.match(cityStateRegex);

    if (matchCityState) {
        const fullMatch = matchCityState[0];
        const city = matchCityState[1].trim();
        const state = matchCityState[2].trim();
        
        newName = newName.replace(fullMatch, ' ').trim();
        descAdditions.push(`${city}, ${state}`);
    } else {
        // Look if the known city from DB is in the name
        if (station.city) {
            const cityPattern = new RegExp(`\\s+${escapeRegExp(station.city)}\\b`, 'i');
            if (cityPattern.test(newName)) {
                newName = newName.replace(cityPattern, ' ').trim();
                descAdditions.push(station.city);
            }
        }
    }

    // Clean up double spaces that might have been left
    newName = newName.replace(/\s+/g, ' ').trim();

    if (newName !== station.name) {
      let newDesc = station.description || '';
      if (descAdditions.length > 0) {
          const additionStr = descAdditions.join(' - ');
          if (newDesc) {
              if (!newDesc.includes(additionStr)) {
                newDesc = `${newDesc} - ${additionStr}`;
              }
          } else {
              newDesc = additionStr;
          }
      }
      
      const safeName = newName.replace(/'/g, "''");
      const safeDesc = newDesc.replace(/'/g, "''");
      
      sql += `UPDATE stations SET name = '${safeName}', description = '${safeDesc}' WHERE id = '${station.id}';\n`;
      updateCount++;
    }
  }

  fs.writeFileSync('scripts/fix_location_names.sql', sql);
  console.log(`Saved SQL to scripts/fix_location_names.sql (Updates generated for ${updateCount} stations)`);
}

main();
