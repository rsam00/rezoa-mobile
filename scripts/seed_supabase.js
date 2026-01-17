const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
// Replace these if they are not picked up from environment or passed as args
const SUPABASE_URL = 'https://glpnkailgttqvyyfeuoo.supabase.co';
const SUPABASE_KEY = 'sb_secret_Fxv_TDwdPNSDglpeI8hi4g_8v6X8Wt6'; // Service role key needed for write access

if (!SUPABASE_KEY || SUPABASE_KEY === 'ENTER_YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ Error: Please provide your Supabase SERVICE_ROLE_KEY in the script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
  console.log('🚀 Starting Supabase Seeding...');

  try {
    // 1. Seed Stations
    console.log('📡 Seeding Stations...');
    const stationsPath = path.join(__dirname, '../data/working_stations_2.ts');
    const stationsContent = fs.readFileSync(stationsPath, 'utf8');
    // Extract array using regex (crude but effective for this one-time task)
    const stationsArrayMatch = stationsContent.match(/export const stations = (\[[\s\S]*?\]);/);
    if (!stationsArrayMatch) throw new Error('Could not parse stations file');
    
    // We need to clean the TS to make it valid JS if there are types, 
    // but these files are mostly pure objects.
    const stations = eval(stationsArrayMatch[1]);

    const { error: sError } = await supabase
      .from('stations')
      .upsert(stations.map(s => ({
        id: s.id,
        name: s.name,
        logo: s.logo,
        stream_url: s.streamUrl,
        website: s.website,
        city: s.city,
        country: s.country,
        language: s.language,
        description: s.description,
        frequency: s.frequency,
        tags: s.tag || []
      })));

    if (sError) throw sError;
    console.log(`✅ Seeded ${stations.length} stations.`);

    // 2. Seed Programs
    console.log('📅 Seeding Programs...');
    const programsPath = path.join(__dirname, '../data/programs_updated.ts');
    const programsContent = fs.readFileSync(programsPath, 'utf8');
    const programsArrayMatch = programsContent.match(/export const programs = (\[[\s\S]*?\]);/);
    if (!programsArrayMatch) throw new Error('Could not parse programs file');
    
    // Define constants used in the file so eval handles them
    const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const WEEKDAYS_AND_SATURDAY = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const FULL_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const POSTER_4VEH_URL = 'https://4veh.org/wp-content/uploads/';
    const POSTER_SWEET_URL = 'https://www.sweetfmhaiti.com/j4/images/';
    
    const programs = eval(programsArrayMatch[1]);

    const { error: pError } = await supabase
      .from('programs')
      .upsert(programs.map(p => ({
        station_id: p.stationId,
        name: p.name,
        host: p.host,
        poster: p.poster,
        description: p.description,
        schedules: p.schedules
      })));

    if (pError) throw pError;
    console.log(`✅ Seeded ${programs.length} programs.`);

    console.log('🎉 Seeding completed successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  }
}

seed();
