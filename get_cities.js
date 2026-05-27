const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('stations').select('city');
  if (error) {
    console.error(error);
    return;
  }
  const cities = [...new Set(data.map(d => d.city).filter(s => s))];
  cities.sort();
  console.log(JSON.stringify(cities, null, 2));
}
main();
