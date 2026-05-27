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

  const freqRegex = /\b(\d{2,4}(?:\.\d{1,2})?)\s*(FM|AM)?\b/i;
  
  let updates = [];
  
  for (let s of allStations) {
    let name = s.name.trim();
    let freqMatch = name.match(freqRegex);
    
    if (!freqMatch) continue;
    
    let freqVal = parseFloat(freqMatch[1]);
    let suffix = freqMatch[2] ? freqMatch[2].toUpperCase() : null;
    
    let isFreq = false;
    // Check if it's a valid frequency
    if (suffix === 'FM' || suffix === 'AM') {
        isFreq = true;
    } else if (freqVal >= 87.5 && freqVal <= 108.0) {
        isFreq = true;
    } else if (freqVal >= 530 && freqVal <= 1710 && freqVal % 10 === 0) {
        isFreq = true;
    }
    
    if (!isFreq) continue;
    
    let newFreqValue = freqVal.toString();
    // Sometimes people write 102.7 as 102.70 etc, parseFloat fixes that.
    
    // Determine if we should strip it from the name
    let newName = name;
    
    // Heuristic: Check if frequency is at the end of the name
    // Pattern: Some Words Here <Freq> [FM/AM]
    // Example: "Radio XYZ 99.5 FM", "Radio ABC 101.1"
    const endPattern = new RegExp(`^(.*)\\b${freqMatch[1]}\\s*(?:FM|AM)?\\s*$`, 'i');
    const endMatch = name.match(endPattern);
    
    if (endMatch) {
        let prefix = endMatch[1].trim();
        // If the prefix has a decent length (e.g. >= 5 chars) and ends with a word boundary
        // or contains Radio/Tele/La Voix, it's safe to strip
        if (prefix.length > 3) {
            // Remove trailing hyphens or dashes just in case
            prefix = prefix.replace(/[\-\s]+$/, '');
            newName = prefix;
        }
    }
    
    // If the name hasn't changed and freq is already set, skip
    if (newName === name && s.frequency === newFreqValue) continue;
    
    let sqlSet = [];
    if (s.frequency !== newFreqValue && !s.frequency) {
        sqlSet.push(`frequency = '${newFreqValue.replace(/'/g, "''")}'`);
    } else if (s.frequency !== newFreqValue && s.frequency) {
        // If there's already a frequency, we don't overwrite unless we want to standardize.
        // Let's assume if it exists we don't overwrite it unless it's just formatting
        if (parseFloat(s.frequency) !== freqVal) {
           sqlSet.push(`frequency = '${newFreqValue.replace(/'/g, "''")}'`);
        }
    }

    if (newName !== name) {
        sqlSet.push(`name = '${newName.replace(/'/g, "''")}'`);
    }
    
    if (sqlSet.length > 0) {
        updates.push(`UPDATE stations SET ${sqlSet.join(', ')} WHERE id = '${s.id}';`);
    }
  }

  fs.writeFileSync('scripts/update-frequencies.sql', updates.join('\n'));
  console.log(`Generated ${updates.length} update statements in scripts/update-frequencies.sql`);
}

main();
