const fs = require('fs');
const path = require('path');

const API_URL = "https://de1.api.radio-browser.info/json/stations/search?countrycode=US&limit=100&order=clickcount&reverse=true&hidebroken=true";
const OUTPUT_PATH = path.join(__dirname, '../data/us_top_100_clicks.json');

async function fetchUsTop100() {
  console.log(`📡 Fetching Top 100 US Stations from Radio Browser API...`);
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2));
    console.log(`✅ Successfully saved ${data.length} stations to: ${OUTPUT_PATH}`);
    
    console.log('\n🏆 Top 5 Stations in the list:');
    data.slice(0, 5).forEach((station, index) => {
        console.log(`  ${index + 1}. ${station.name.trim()} (${station.state || 'N/A'}) - ${station.clickcount} clicks`);
    });

  } catch (error) {
    console.error(`❌ Failed to fetch stations:`, error);
  }
}

fetchUsTop100();
