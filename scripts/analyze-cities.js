const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('stations').select('id, name, city, country');
  if (error) {
    console.error(error);
    return;
  }
  
  const cities = new Set();
  data.forEach(s => {
    if (s.city) cities.add(s.city.trim());
  });
  
  console.log("Unique cities in DB:", Array.from(cities).sort());
}
main();
