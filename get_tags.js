const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  let allStations = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data: stations, error } = await supabase
      .from('stations')
      .select('tags')
      .range(page * pageSize, (page + 1) * pageSize - 1);
      
    if (error) {
      console.error(error);
      return;
    }
    if (stations.length === 0) break;
    allStations = allStations.concat(stations);
    page++;
  }

  const tagCounts = {};
  
  for (const station of allStations) {
    if (!station.tags) continue;
    // Assuming tags might be comma-separated strings or arrays
    let tags = [];
    if (Array.isArray(station.tags)) {
      tags = station.tags;
    } else if (typeof station.tags === 'string') {
      tags = station.tags.split(',').map(t => t.trim());
    }
    
    for (let tag of tags) {
      if (!tag) continue;
      const normalizedTag = tag.toLowerCase();
      tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
    }
  }

  // Sort by count descending
  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100); // Top 100 tags
    
  console.log("Top 100 Tags:");
  sortedTags.forEach(([tag, count]) => {
    console.log(`${tag}: ${count}`);
  });
}
main();
