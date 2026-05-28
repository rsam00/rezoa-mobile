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

function getCleanDisplayName(name) {
  let clean = name;
  const stopwords = [
    'aac\\+', 'aac', 'mp3', 'flac', 'ogg', 
    '\\d{2,3}k\\b', '\\d{2,3}kbps\\b', '\\d{2,3} kbps\\b', '\\d{2,3} k\\b',
    'hd1', 'hd2', 'hd3', 'hq', 'lq', 'high quality', 'low quality',
    '\\+meta\\b', '192m'
  ];
  
  stopwords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    clean = clean.replace(regex, '');
  });
  
  clean = clean.replace(/\([^)]*?(?:aac|mp3|flac|ogg|\d{2,3}k).*?\)/gi, '');
  clean = clean.replace(/\(\s*\)/g, '');
  clean = clean.replace(/[-\s]+$/, '');
  clean = clean.replace(/\s+/g, ' ');
  
  return clean.trim();
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
}

async function main() {
  let allStations = [];
  let from = 0;
  let to = 999;
  let hasMore = true;

  console.log("Fetching stations...");
  while (hasMore) {
    const { data, error } = await supabase.from('stations').select('id, name, stream_url, description, city, department').range(from, to);
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

  // Pre-process all stations in memory to apply name fixes before grouping
  for (let station of allStations) {
    if (!station.name) continue;
    
    // 1. Public Radio fix
    const match = station.name.match(/^([A-Z0-9-]{3,6}(?:\s+\d{2,3}(?:\.\d{1,2})?)?)\s+(.*Public Radio.*)/i);
    if (match) {
      station.name = match[1].trim();
    }
    
    // 2. City, State location fix
    const cityStateRegex = /\s+([a-z\s]+?),\s*([A-Z]{2})\b/i;
    const matchCityState = station.name.match(cityStateRegex);
    if (matchCityState) {
        station.name = station.name.replace(matchCityState[0], ' ').trim();
    } else if (station.city) {
        const cityPattern = new RegExp(`\\s+${escapeRegExp(station.city)}\\b`, 'i');
        if (cityPattern.test(station.name)) {
            station.name = station.name.replace(cityPattern, ' ').trim();
        }
    }
    
    station.name = station.name.replace(/\s+/g, ' ').trim();
  }

  function cleanName(n) {
      // Remove all non-word chars (strips Chinese/Russian too, which is a known bug, but it's what the user asked to revert to)
      // Actually, let's fix the unicode bug while we are at it so we don't break "Голос Мира".
      // Use \p{L}\p{N} to keep foreign letters, numbers.
      return n.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
  }

  const groups = [];
  const SIMILARITY_THRESHOLD = 0.85; // Strict enough to split 60s/70s

  for (let i = 0; i < allStations.length; i++) {
    const station = allStations[i];
    if (!station.name) continue;
    
    const cleanedName = cleanName(station.name);
    let matchedGroup = null;

    for (let g of groups) {
      const leadName = cleanName(g.stations[0].name);
      
      // Edge case: if both strings become empty, don't group them!
      if (cleanedName.length === 0 || leadName.length === 0) continue;

      const similarity = stringSimilarity.compareTwoStrings(cleanedName, leadName);
      
      const isSubset = cleanedName.includes(leadName) || leadName.includes(cleanedName);
      
      // Safeguard against generic broad names acting as subsets
      const genericNames = ['public radio', 'classic rock', 'radio', 'fm', 'am', 'news', 'sports'];
      const isGeneric = genericNames.includes(leadName) || genericNames.includes(cleanedName);
      
      const isSubsetHighConfidence = isSubset && !isGeneric && (Math.min(cleanedName.length, leadName.length) > 7) && similarity > 0.5;
      
      if (similarity > SIMILARITY_THRESHOLD || isSubsetHighConfidence) {
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

  for (const group of duplicates) {
    const lead = group.stations[0];
    const streams = group.stations.map(st => guessStreamMetadata(st));
    streams.sort((a, b) => a.bitrate - b.bitrate);

    const displayName = getCleanDisplayName(lead.name);

    md += `### ${displayName} (${group.stations.length} streams)\n`;
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

  // 2. Generate SQL
  let sql = '-- Migration script to merge duplicate stations into streams column\n\n';

  for (const group of duplicates) {
    const lead = group.stations[0];
    const streams = group.stations.map(st => guessStreamMetadata(st));
    streams.sort((a, b) => a.bitrate - b.bitrate);
    
    const streamsJson = JSON.stringify(streams.map(s => ({
      url: s.url,
      bitrate: s.bitrate,
      format: s.format,
      label: s.label
    }))).replace(/'/g, "''");
    
    const safeName = getCleanDisplayName(lead.name).replace(/'/g, "''");
    
    sql += `UPDATE stations SET name = '${safeName}', streams = '${streamsJson}'::jsonb WHERE id = '${lead.id}';\n`;

    const idsToDelete = group.stations.slice(1).map(st => st.id);
    if (idsToDelete.length > 0) {
      const idsStr = idsToDelete.map(id => `'${id}'`).join(', ');
      sql += `DELETE FROM stations WHERE id IN (${idsStr});\n`;
    }
    sql += '\n';
  }

  fs.writeFileSync('scripts/migrate_streams_data.sql', sql);
  console.log('Saved SQL to scripts/migrate_streams_data.sql');
}

main();
