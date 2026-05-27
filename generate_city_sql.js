const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const cityMap = {
  'cap-haitien': 'Cap-Haïtien',
  'haiti': null,
  'los angeles, california': 'Los Angeles',
  'ny': 'New York',
  'new york ny': 'New York',
  'saint marc': 'Saint-Marc',
  'san francisco ca': 'San Francisco',
  'us': null,
  'california': null,
  'florida': null,
  'minnesota': null,
  'ohio': null,
  'pennsylvania': null,
  'virginia': null,
  'wisconsin': null
};

async function main() {
  const { data, error } = await supabase.from('stations').select('city');
  const cities = [...new Set(data.map(d => d.city).filter(s => s))];
  
  const updates = [];
  for (const city of cities) {
    let normalized = city.trim().toLowerCase();
    let newCity = city;
    
    if (cityMap[normalized] !== undefined) {
      newCity = cityMap[normalized];
    } else {
      newCity = city.trim();
    }
    
    if (newCity !== city) {
      if (newCity === null) {
        updates.push(`UPDATE stations SET city = NULL WHERE city = '${city.replace(/'/g, "''")}';`);
      } else {
        updates.push(`UPDATE stations SET city = '${newCity.replace(/'/g, "''")}' WHERE city = '${city.replace(/'/g, "''")}';`);
      }
    }
  }
  
  const fs = require('fs');
  fs.writeFileSync('scripts/sanitize-cities.sql', updates.join('\n'));
  console.log('City SQL generated.');
}
main();
