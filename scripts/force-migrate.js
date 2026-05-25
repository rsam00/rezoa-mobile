const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const departmentMap = {
  // Ouest
  'port-au-prince': 'Ouest',
  'pétion-ville': 'Ouest',
  'petion-ville': 'Ouest',
  'delmas': 'Ouest',
  'ti delmas': 'Ouest',
  'carrefour': 'Ouest',
  'croix-des-bouquets': 'Ouest',
  'croix chérie': 'Ouest',
  'tabarre': 'Ouest',
  // Nord
  'cap-haïtien': 'Nord',
  'cap-haitien': 'Nord',
  'dondon': 'Nord',
  // Artibonite
  'gonaïves': 'Artibonite',
  'saint marc': 'Artibonite',
  'saint-marc': 'Artibonite',
  'gros morne': 'Artibonite',
  'anse-rouge': 'Artibonite',
  'petite rivière de l’artibonite': 'Artibonite',
  "saint-michel-de-l'atalaye": 'Artibonite',
  // Sud
  'les cayes': 'Sud',
  'camp perrin': 'Sud',
  'cavaillon': 'Sud',
  'tiburon': 'Sud',
  // Sud-Est
  'jacmel': 'Sud-Est',
  'belle anse': 'Sud-Est',
  'cap rouge': 'Sud-Est',
  // Centre
  'mirebalais': 'Centre',
  'boucan carré': 'Centre',
  'saut d’eau': 'Centre',
  // Nord-Est
  'ouanaminthe': 'Nord-Est',
  'fort liberté': 'Nord-Est',
  'trou-du-nord': 'Nord-Est',
  // Nord-Ouest
  'port-de-paix': 'Nord-Ouest',
  // Grand'Anse
  'jeremie': 'Grand\'Anse',
  // Nippes
  'miragoane': 'Nippes'
};

async function main() {
  console.log('Forcing migration for all remaining stations...');
  
  const { data: stations, error } = await supabase.from('stations').select('id, city, country, department');
  if (error) {
    console.error('Failed to fetch:', error);
    return;
  }

  let updatedCount = 0;

  for (const station of stations) {
    let rawCity = station.city ? station.city.trim() : null;
    let newCity = null;
    let newCountry = station.country || 'Haiti';
    let newDepartment = station.department || null; // preserve if exists

    if (rawCity) {
      if (rawCity.toLowerCase() === 'haiti') {
        newCity = null;
        newCountry = 'Haiti';
      } else {
        const parts = rawCity.split(',');
        if (parts.length > 1) {
          newCity = parts[0].trim();
          const secondPart = parts[1].trim().toLowerCase();
          if (secondPart === 'haiti') {
            newCountry = 'Haiti';
          } else if (secondPart === 'rd') {
            newCountry = 'Dominican Republic';
          }
        } else {
          newCity = rawCity;
        }

        if (newCountry === 'Haiti' && newCity) {
          const lowerCity = newCity.toLowerCase();
          if (departmentMap[lowerCity]) {
            newDepartment = departmentMap[lowerCity];
          }
        }
        
        if (newCity && newCity.toLowerCase() === 'santiago') {
           newDepartment = 'Santiago';
           newCountry = 'Dominican Republic';
        }
      }
    }

    const payload = {};
    if (newCity !== station.city) payload.city = newCity;
    if (newCountry !== station.country) payload.country = newCountry;
    if (newDepartment !== station.department) payload.department = newDepartment;

    if (Object.keys(payload).length > 0) {
      const { error: updateError } = await supabase
        .from('stations')
        .update(payload)
        .eq('id', station.id);

      if (updateError) {
        console.error(`Failed to update [${station.id}]:`, updateError);
      } else {
        updatedCount++;
        console.log(`Updated [${station.id}]:`, payload);
      }
    }
  }
  console.log(`Updated ${updatedCount} stations in force pass.`);
}
main();
