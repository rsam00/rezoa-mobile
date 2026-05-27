const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const stateMap = {
  ' california': 'California',
  'california': 'California',
  'california ': 'California',
  'california, san francisco': 'California',
  'los angeles, california': 'California',
  'northern california': 'California',
  'san francisco ca': 'California',
  'birmingham alabama': 'Alabama',
  'cheyenne, wyoming': 'Wyoming',
  'manderson, wyoming': 'Wyoming',
  'coconut creek, florida 33073': 'Florida',
  'tallahassee florida': 'Florida',
  'columbus ohio': 'Ohio',
  'jonesboro, arkansas': 'Arkansas',
  'ny': 'New York',
  'new york ny': 'New York',
  'oregon': 'Oregon',
  'us': null
};

async function main() {
  console.log('Starting state sanitization...');
  
  let allStations = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data: stations, error } = await supabase
      .from('stations')
      .select('id, department')
      .range(page * pageSize, (page + 1) * pageSize - 1);
      
    if (error) {
      console.error('Failed to fetch stations:', error);
      return;
    }
    
    if (stations.length === 0) break;
    allStations = allStations.concat(stations);
    page++;
  }

  console.log(`Fetched ${allStations.length} stations.`);

  let updatedCount = 0;

  for (const station of allStations) {
    let currentDept = station.department;
    if (!currentDept) continue;
    
    let normalized = currentDept.trim().toLowerCase();
    
    // First apply exact mappings
    let newDept = currentDept;
    if (stateMap[normalized] !== undefined) {
      newDept = stateMap[normalized];
    } else {
      // Clean up whitespace
      newDept = currentDept.trim();
      // Capitalize if it was strictly lowercase
      if (newDept === normalized) {
        newDept = newDept.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }

    if (newDept !== currentDept) {
      const { error: updateError } = await supabase
        .from('stations')
        .update({ department: newDept })
        .eq('id', station.id);

      if (updateError) {
        console.error(`Failed to update station ${station.id}:`, updateError);
      } else {
        updatedCount++;
        console.log(`Updated [${station.id}]: department "${currentDept}" -> "${newDept}"`);
      }
    }
  }

  console.log(`\nSanitization complete! Updated ${updatedCount} stations.`);
}

main();

