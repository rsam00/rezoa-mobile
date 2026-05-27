const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('stations')
    .update({ department: 'California' })
    .eq('id', '608bc971-3ec5-4c05-8143-de96c3bdb030')
    .select();
  console.log("Update response:", data, error);
}
main();
