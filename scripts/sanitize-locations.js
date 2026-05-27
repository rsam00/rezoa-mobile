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

  let updates = [];
  
  for (const s of allStations) {
    if (!s.name) continue;
    
    const nameLower = s.name.toLowerCase();
    const cityLower = s.city ? s.city.toLowerCase() : '';
    const deptLower = s.department ? s.department.toLowerCase() : '';
    
    // Protect Brands
    const protectedWords = ['public radio', 'university', 'college', 'news', 'voice', 'state', 'broadcasting'];
    if (protectedWords.some(pw => nameLower.includes(pw))) {
        continue;
    }
    
    let matchedLocationStr = null;
    let matchedType = null;
    
    // Check if city is in name
    if (cityLower && cityLower.length > 3 && new RegExp(`\\b${cityLower.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\$&')}\\b`).test(nameLower)) {
        matchedLocationStr = s.city;
        matchedType = 'city';
    } 
    // Check if dept is in name
    else if (deptLower && deptLower.length > 3 && new RegExp(`\\b${deptLower.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\$&')}\\b`).test(nameLower)) {
        matchedLocationStr = s.department;
        matchedType = 'department';
    }
    
    if (!matchedLocationStr) continue;

    let newName = s.name;
    const locPattern = matchedLocationStr.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\$&');

    // Heuristic 1: Strip trailing separators
    // e.g. "100.7 WMMS - Cleveland, Ohio" -> "100.7 WMMS"
    const sepPattern = new RegExp(`^(.*?)\\s*[-|]\\s*.*${locPattern}.*$`, 'i');
    const sepMatch = s.name.match(sepPattern);
    
    if (sepMatch && sepMatch[1].length > 3) {
        newName = sepMatch[1].trim();
    } else {
        // Heuristic 2: Strip trailing locations directly
        // e.g. "102.7 KIIS FM Los Angeles" -> "102.7 KIIS FM"
        // Also catch trailing standard suffixes like ", CA" or ", NY"
        const endPattern = new RegExp(`^(.*?)\\s*,?\\s*${locPattern}(?:\\s*,?\\s*[A-Z]{2})?\\s*$`, 'i');
        const endMatch = s.name.match(endPattern);
        
        if (endMatch && endMatch[1].length > 3) {
            newName = endMatch[1].trim();
        }
    }
    
    if (newName !== s.name) {
        updates.push(`UPDATE stations SET name = '${newName.replace(/'/g, "''")}' WHERE id = '${s.id}';`);
    }
  }

  fs.writeFileSync('scripts/sanitize-locations.sql', updates.join('\n'));
  console.log(`Generated ${updates.length} update statements in scripts/sanitize-locations.sql`);
}

main();
