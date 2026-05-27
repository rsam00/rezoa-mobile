const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const langMap = {
  "#english": "English",
  "american english": "English",
  "engilsh": "English",
  "englisg": "English",
  "english": "English",
  "english uk": "English",
  "english/": "English",
  "englsh": "English",
  "englsih": "English",
  "creole": "Haitian Creole",
  "haitian creole": "Haitian Creole",
  "français": "French",
  "afrikaans": "Afrikaans",
  "armenian": "Armenian",
  "bahasa indonesia": "Indonesian",
  "bisaya": "Bisaya",
  "cantonese": "Cantonese",
  "chinese": "Chinese",
  "deutsch fränkisch": "German",
  "english spanish": "English, Spanish",
  "german": "German",
  "italian": "Italian",
  "japanese": "Japanese",
  "korean": "Korean",
  "persian": "Persian",
  "portuguese": "Portuguese",
  "punjabi": "Punjabi",
  "russian": "Russian",
  "serbian": "Serbian",
  "spanish": "Spanish",
  "thai": "Thai",
  "aboriginal languages": "Aboriginal Languages",
  "various languages": "Various Languages"
};

async function main() {
  console.log('Fetching stations to generate language sanitization SQL...');
  let allStations = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data: stations, error } = await supabase
      .from('stations')
      .select('language')
      .range(page * pageSize, (page + 1) * pageSize - 1);
      
    if (error) {
      console.error(error);
      return;
    }
    if (stations.length === 0) break;
    allStations = allStations.concat(stations);
    page++;
  }

  const langs = [...new Set(allStations.map(d => d.language).filter(s => s))];
  
  let updates = [];
  
  for (let lang of langs) {
    let originalLang = lang;
    let normalized = lang.trim().toLowerCase();
    
    let newLang = originalLang;
    
    if (langMap[normalized] !== undefined) {
      newLang = langMap[normalized];
    } else {
      // capitalize words
      newLang = normalized.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    
    if (newLang !== originalLang) {
        updates.push(`UPDATE stations SET language = '${newLang.replace(/'/g, "''")}' WHERE language = '${originalLang.replace(/'/g, "''")}';`);
    }
  }

  fs.writeFileSync('scripts/sanitize-languages.sql', updates.join('\n'));
  console.log(`Generated ${updates.length} update statements in scripts/sanitize-languages.sql`);
}

main();
