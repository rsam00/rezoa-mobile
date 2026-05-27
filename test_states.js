const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('stations').select('id, city, country, department');
  if (error) {
    console.error(error);
    return;
  }
  const countries = [...new Set(data.map(d => d.country).filter(s => s))];
  countries.sort();
  console.log("Countries:", countries.slice(0, 50));
  
  const depts = [...new Set(data.map(d => d.department).filter(s => s))];
  depts.sort();
  console.log("Departments:", depts);

}
main();
