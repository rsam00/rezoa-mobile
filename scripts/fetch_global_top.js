const https = require('https');
const fs = require('fs');
const path = require('path');

// Helper to fetch JSON from a URL
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

async function fetchGlobalTop100() {
  console.log('🚀 Starting Global Top 100 Fetch from Radio Browser API...');

  try {
    // 1. Get an available server
    console.log('📡 Finding an available Radio Browser server...');
    const servers = await fetchJson('https://all.api.radio-browser.info/json/servers');
    
    if (!servers || servers.length === 0) {
      throw new Error('No Radio Browser servers found.');
    }
    
    const serverHostname = servers[0].name;
    console.log(`✅ Using server: ${serverHostname}`);

    // 2. Fetch Top 100 by Clicks
    const topClicksUrl = `https://${serverHostname}/json/stations/topclick/100`;
    console.log(`\n📥 Fetching Top 100 stations by Clicks...`);
    const topClicksData = await fetchJson(topClicksUrl);
    
    // 3. Fetch Top 100 by Votes
    const topVotesUrl = `https://${serverHostname}/json/stations/topvote/100`;
    console.log(`📥 Fetching Top 100 stations by Votes...`);
    const topVotesData = await fetchJson(topVotesUrl);

    // 4. Format the data to keep it clean
    const formatStation = (s, rank) => ({
      rank,
      id: s.stationuuid,
      name: s.name.trim(),
      country: s.country,
      language: s.language,
      tags: s.tags,
      streamUrl: s.url_resolved || s.url,
      website: s.homepage,
      clicks: s.clickcount,
      votes: s.votes
    });

    const formattedClicks = topClicksData.map((s, i) => formatStation(s, i + 1));
    const formattedVotes = topVotesData.map((s, i) => formatStation(s, i + 1));

    // 5. Save to files
    const outputDir = path.join(__dirname, '../data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const clicksFilePath = path.join(outputDir, 'global_top_100_clicks.json');
    const votesFilePath = path.join(outputDir, 'global_top_100_votes.json');

    fs.writeFileSync(clicksFilePath, JSON.stringify(formattedClicks, null, 2));
    fs.writeFileSync(votesFilePath, JSON.stringify(formattedVotes, null, 2));

    console.log('\n🎉 Successfully fetched and saved the Global Top 100 lists!');
    console.log(`📁 Top Clicks saved to: ${clicksFilePath}`);
    console.log(`📁 Top Votes saved to: ${votesFilePath}`);

    // Output a quick preview
    console.log('\n🏆 Top 5 by Clicks:');
    formattedClicks.slice(0, 5).forEach(s => console.log(`   ${s.rank}. ${s.name} (${s.clicks} clicks)`));

    console.log('\n🏆 Top 5 by Votes:');
    formattedVotes.slice(0, 5).forEach(s => console.log(`   ${s.rank}. ${s.name} (${s.votes} votes)`));

  } catch (error) {
    console.error('\n❌ Error fetching top stations:', error.message);
  }
}

fetchGlobalTop100();
