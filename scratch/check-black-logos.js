require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');
const Jimp = require('jimp');

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function checkBlackLogos() {
  console.log('Fetching stations from database...');
  let allStations = [];
  let from = 0;
  const limit = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('stations')
      .select('id, name, logo')
      .not('logo', 'is', null)
      .range(from, from + limit - 1);
      
    if (error) {
      console.error('Error:', error);
      break;
    }
    
    if (data.length === 0) break;
    
    allStations = allStations.concat(data);
    from += limit;
  }

  console.log(`Found ${allStations.length} stations with logos.`);
  
  const uniqueUrls = [...new Set(allStations.map(s => s.logo))];
  console.log(`Checking ${uniqueUrls.length} unique logos...`);

  const blackUrls = [];
  let count = 0;

  const batchSize = 30;
  for (let i = 0; i < uniqueUrls.length; i += batchSize) {
    const batch = uniqueUrls.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (url) => {
      try {
        const image = await Jimp.read(url);
        let isBlack = true;
        
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
          if (!isBlack) return;
          const r = this.bitmap.data[idx + 0];
          const g = this.bitmap.data[idx + 1];
          const b = this.bitmap.data[idx + 2];
          const a = this.bitmap.data[idx + 3];
          
          if (a > 10 && (r > 20 || g > 20 || b > 20)) {
            isBlack = false;
          }
        });

        if (isBlack) {
          blackUrls.push(url);
          console.log('FOUND BLACK LOGO:', url);
        }
      } catch (e) {
      }
    }));
    
    count += batchSize;
    if (count % 300 === 0) console.log(`Processed ${count}...`);
  }

  console.log('\n--- RESULTS ---');
  if (blackUrls.length > 0) {
    console.log(`Found ${blackUrls.length} black logos.`);
    allStations.filter(s => blackUrls.includes(s.logo)).forEach(s => {
      console.log(`- ${s.name}: ${s.logo}`);
    });
  } else {
    console.log('No all-black logos found.');
  }
}

checkBlackLogos();
