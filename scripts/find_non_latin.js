const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  let allStations = [];
  let from = 0;
  let to = 999;
  let hasMore = true;

  console.log("Fetching stations...");
  while (hasMore) {
    const { data, error } = await supabase.from('stations').select('id, name, country').range(from, to);
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

  // Regex to match any letter that is NOT Latin (e.g. Cyrillic, Han, Arabic, etc.)
  // \p{L} matches any kind of letter from any language.
  // \p{Script=Latin} matches only Latin letters.
  // So we can just check if there's any character that matches \p{L} but not Latin?
  // Wait, JS doesn't have character class subtraction.
  // We can just iterate through characters or test common scripts:
  const nonLatinRegex = /[\p{Script=Cyrillic}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Greek}\p{Script=Devanagari}\p{Script=Thai}]/u;

  const nonLatinStations = [];

  for (const station of allStations) {
    if (station.name && nonLatinRegex.test(station.name)) {
      nonLatinStations.push(station);
    }
  }

  console.log(`\nFound ${nonLatinStations.length} stations with non-Latin alphabets in their name:\n`);
  
  // Group by country for easier reading
  const byCountry = {};
  for (const s of nonLatinStations) {
      const c = s.country || 'Unknown';
      if (!byCountry[c]) byCountry[c] = [];
      byCountry[c].push(s.name);
  }
  
  for (const country in byCountry) {
      console.log(`--- ${country} ---`);
      byCountry[country].forEach(name => console.log(`  - ${name}`));
  }
}

main();
