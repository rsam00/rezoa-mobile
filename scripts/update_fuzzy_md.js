const { createClient } = require('@supabase/supabase-js');
const stringSimilarity = require('string-similarity');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function guessStreamMetadata(station) {
  let bitrate = 128;
  let format = 'mp3';
  
  const text = (station.name + ' ' + station.stream_url).toLowerCase();
  
  if (text.includes('32k')) bitrate = 32;
  else if (text.includes('64k')) bitrate = 64;
  else if (text.includes('96k')) bitrate = 96;
  else if (text.includes('128k')) bitrate = 128;
  else if (text.includes('192k')) bitrate = 192;
  else if (text.includes('256k')) bitrate = 256;
  else if (text.includes('320k')) bitrate = 320;
  
  if (text.includes('aac') || text.includes('m4a')) format = 'aac';
  else if (text.includes('flac')) format = 'flac';
  else if (text.includes('ogg')) format = 'ogg';

  let label = 'Standard';
  if (bitrate >= 192 || format === 'flac') label = 'High Quality';
  if (bitrate <= 64) label = 'Data Saver';

  return { url: station.stream_url, bitrate, format, label, originalName: station.name };
}

async function main() {
  let allStations = [];
  let from = 0;
  let to = 999;
  let hasMore = true;

  console.log("Fetching stations...");
  while (hasMore) {
    const { data, error } = await supabase.from('stations').select('id, name, stream_url').range(from, to);
    if (error) {
      console.error(error);
      break;
    }
    if (data.length === 0) {
      hasMore = false;
    } else {
      allStations = allStations.concat(data);
      from += 1000;
      to += 1000;
    }
  }

  function cleanName(n) {
      return n.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim();
  }

  const groups = [];
  const SIMILARITY_THRESHOLD = 0.85;

  for (let i = 0; i < allStations.length; i++) {
    const station = allStations[i];
    if (!station.name) continue;
    
    const cleanedName = cleanName(station.name);
    let matchedGroup = null;

    for (let g of groups) {
      const leadName = cleanName(g.stations[0].name);
      const similarity = stringSimilarity.compareTwoStrings(cleanedName, leadName);
      
      // Removed the aggressive isSubset logic that grouped "Public Radio" with everything
      if (similarity > SIMILARITY_THRESHOLD) {
        matchedGroup = g;
        break;
      }
    }

    if (matchedGroup) {
      matchedGroup.stations.push(station);
    } else {
      groups.push({ stations: [station] });
    }
  }

  const duplicates = groups.filter(g => g.stations.length > 1);
  duplicates.sort((a, b) => b.stations.length - a.stations.length);

  let md = `# Consolidated Stations Report\n\n`;
  md += `This document reflects how the ${duplicates.length} duplicate groups will be consolidated using the new JSON \`streams\` array architecture.\n\n`;
  md += `*Note: Very broad groups like "Public Radio" have been separated by removing overly aggressive fuzzy matching rules.* \n\n`;

  for (const group of duplicates) {
    const lead = group.stations[0];
    const streams = group.stations.map(st => guessStreamMetadata(st));
    streams.sort((a, b) => a.bitrate - b.bitrate);

    md += `### ${lead.name} (${group.stations.length} streams)\n`;
    md += `**Primary ID:** \`${lead.id}\`\n\n`;
    
    md += `| Label | Format | Bitrate | Original Station Name | URL |\n`;
    md += `|---|---|---|---|---|\n`;
    
    for (const st of streams) {
      md += `| **${st.label}** | ${st.format.toUpperCase()} | ${st.bitrate}k | ${st.originalName} | \`${st.url}\` |\n`;
    }
    md += `\n`;
  }

  fs.writeFileSync('similar_stations_fuzzy.md', md);
  console.log('Saved updated schema format to similar_stations_fuzzy.md');
}

main();
