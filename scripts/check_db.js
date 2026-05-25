const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('stations').select('id, name, city, department, country').ilike('name', '%Nibonibo%');
  if (error) {
    console.error(error);
  } else {
    console.log("DB Result:", JSON.stringify(data, null, 2));
  }
}
main();
