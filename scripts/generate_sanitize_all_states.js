const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const usStates = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", 
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", 
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", 
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", 
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", 
  "Wisconsin", "Wyoming"
];

const haitianDepts = [
  "Artibonite", "Centre", "Grand'Anse", "Nippes", "Nord", "Nord-Est", "Nord-Ouest", "Ouest", "Sud", "Sud-Est"
];

async function main() {
  console.log('Fetching stations to generate full state sanitization SQL...');
  let allStations = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data: stations, error } = await supabase
      .from('stations')
      .select('department')
      .range(page * pageSize, (page + 1) * pageSize - 1);
      
    if (error) {
      console.error(error);
      return;
    }
    if (stations.length === 0) break;
    allStations = allStations.concat(stations);
    page++;
  }

  const depts = [...new Set(allStations.map(d => d.department).filter(s => s))];
  
  let updates = [];
  
  for (let dept of depts) {
    let originalDept = dept;
    let normalized = dept.trim().toLowerCase();
    
    // Ignore empty/whitespace
    if (!normalized) {
      updates.push(`UPDATE stations SET department = NULL WHERE department = '${originalDept.replace(/'/g, "''")}';`);
      continue;
    }

    let newState = null;
    let found = false;

    // Handle Washington D.C.
    if (normalized.includes('washington dc') || normalized.includes('washington, dc') || normalized.includes('washington, d.c.')) {
        newState = "Washington, D.C.";
        found = true;
    } else {
        // Check exact overrides or known patterns
        if (normalized === 'la - louisiana') { newState = 'Louisiana'; found = true; }
        else if (normalized === 'mi - michigan') { newState = 'Michigan'; found = true; }
        else if (normalized === 'california la' || normalized === 'california, an diego' || normalized === 'california - san francisco') { newState = 'California'; found = true; }
        else if (normalized === 'santiago') { newState = 'Santiago'; found = true; }
    }

    // Check US States
    if (!found) {
        for (let state of usStates) {
            if (normalized.includes(state.toLowerCase())) {
                newState = state;
                found = true;
                break;
            }
        }
    }

    // Check Haitian Depts
    if (!found) {
        for (let hDept of haitianDepts) {
            if (normalized === hDept.toLowerCase()) {
                newState = hDept;
                found = true;
                break;
            }
        }
    }
    
    // Check state abbreviations at the end of the string e.g. "Indianapolis IN"
    if (!found) {
       const parts = normalized.split(/[\s,]+/);
       const lastPart = parts[parts.length - 1];
       const abbrevMap = {
           'al': 'Alabama', 'ak': 'Alaska', 'az': 'Arizona', 'ar': 'Arkansas', 'ca': 'California',
           'co': 'Colorado', 'ct': 'Connecticut', 'de': 'Delaware', 'fl': 'Florida', 'ga': 'Georgia',
           'hi': 'Hawaii', 'id': 'Idaho', 'il': 'Illinois', 'in': 'Indiana', 'ia': 'Iowa',
           'ks': 'Kansas', 'ky': 'Kentucky', 'la': 'Louisiana', 'me': 'Maine', 'md': 'Maryland',
           'ma': 'Massachusetts', 'mi': 'Michigan', 'mn': 'Minnesota', 'ms': 'Mississippi', 'mo': 'Missouri',
           'mt': 'Montana', 'ne': 'Nebraska', 'nv': 'Nevada', 'nh': 'New Hampshire', 'nj': 'New Jersey',
           'nm': 'New Mexico', 'ny': 'New York', 'nc': 'North Carolina', 'nd': 'North Dakota', 'oh': 'Ohio',
           'ok': 'Oklahoma', 'or': 'Oregon', 'pa': 'Pennsylvania', 'ri': 'Rhode Island', 'sc': 'South Carolina',
           'sd': 'South Dakota', 'tn': 'Tennessee', 'tx': 'Texas', 'ut': 'Utah', 'vt': 'Vermont',
           'va': 'Virginia', 'wa': 'Washington', 'wv': 'West Virginia', 'wi': 'Wisconsin', 'wy': 'Wyoming'
       };
       if (abbrevMap[lastPart]) {
           newState = abbrevMap[lastPart];
           found = true;
       }
    }

    // Only update if it actually needs to change (or it's the exact same string but different case/trim)
    if (found && newState !== originalDept) {
        updates.push(`UPDATE stations SET department = '${newState.replace(/'/g, "''")}' WHERE department = '${originalDept.replace(/'/g, "''")}';`);
    } else if (!found && originalDept.trim() !== originalDept) {
        // Just trim it if we couldn't match anything
        updates.push(`UPDATE stations SET department = '${originalDept.trim().replace(/'/g, "''")}' WHERE department = '${originalDept.replace(/'/g, "''")}';`);
    }
  }

  fs.writeFileSync('scripts/sanitize-all-states.sql', updates.join('\n'));
  console.log(`Generated ${updates.length} update statements in scripts/sanitize-all-states.sql`);
}

main();
