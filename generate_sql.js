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
  const { data, error } = await supabase.from('stations').select('department');
  const depts = [...new Set(data.map(d => d.department).filter(s => s))];
  
  const updates = [];
  for (const dept of depts) {
    let normalized = dept.trim().toLowerCase();
    let newDept = dept;
    if (stateMap[normalized] !== undefined) {
      newDept = stateMap[normalized];
    } else {
      newDept = dept.trim();
      if (newDept === normalized) {
        newDept = newDept.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }
    
    if (newDept !== dept) {
      if (newDept === null) {
        updates.push(`UPDATE stations SET department = NULL WHERE department = '${dept}';`);
      } else {
        updates.push(`UPDATE stations SET department = '${newDept.replace(/'/g, "''")}' WHERE department = '${dept.replace(/'/g, "''")}';`);
      }
    }
  }
  
  const fs = require('fs');
  fs.writeFileSync('scripts/sanitize-states.sql', updates.join('\n'));
  console.log('SQL generated.');
}
main();
