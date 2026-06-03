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

function cleanNameForMatching(n) {
  return n.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
}

function normalizeUrl(url) {
  if (!url) return '';
  return url.toLowerCase().trim().replace(/\/$/, '');
}

async function main() {
  let allStations = [];
  let from = 0;
  let to = 999;
  let hasMore = true;

  console.log("Fetching stations...");
  while (hasMore) {
    // We now select the existing 'streams' column as well
    const { data, error } = await supabase.from('stations').select('id, name, stream_url, streams, description, city, department').range(from, to);
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

  console.log(`Loaded ${allStations.length} stations. Processing exact URL duplicates first...`);

  // 1. Filter out EXACT URL duplicates first
  const uniqueUrlMap = new Map();
  const exactUrlDuplicatesToDelete = [];
  
  const uniqueStations = [];
  
  for (const station of allStations) {
    const url = normalizeUrl(station.stream_url);
    if (url.length > 5 && uniqueUrlMap.has(url)) {
      exactUrlDuplicatesToDelete.push(station.id);
    } else {
      uniqueUrlMap.set(url, station);
      uniqueStations.push(station);
    }
  }

  console.log(`Found ${exactUrlDuplicatesToDelete.length} exact URL duplicates to delete.`);

  // 2. Pre-process names for fuzzy matching
  for (let station of uniqueStations) {
    if (!station.name) continue;
    
    const match = station.name.match(/^([A-Z0-9-]{3,6}(?:\s+\d{2,3}(?:\.\d{1,2})?)?)\s+(.*Public Radio.*)/i);
    if (match) station.name = match[1].trim();
    
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

  // 3. Group by Name Similarity
  const groups = [];
  const SIMILARITY_THRESHOLD = 0.85;

  for (let i = 0; i < uniqueStations.length; i++) {
    const station = uniqueStations[i];
    if (!station.name) continue;
    
    const cleanedName = cleanNameForMatching(station.name);
    let matchedGroup = null;

    for (let g of groups) {
      const leadName = cleanNameForMatching(g.stations[0].name);
      if (cleanedName.length === 0 || leadName.length === 0) continue;

      const similarity = stringSimilarity.compareTwoStrings(cleanedName, leadName);
      const isSubset = cleanedName.includes(leadName) || leadName.includes(cleanedName);
      
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
  console.log(`Found ${duplicates.length} name groups to consolidate.`);

  // 4. Generate SQL
  let sql = '-- Migration script to merge NEW duplicate stations into streams column (V2)\n\n';

  // Add exact URL deletes
  if (exactUrlDuplicatesToDelete.length > 0) {
    sql += `-- Deleting exact URL duplicates\n`;
    const idsStr = exactUrlDuplicatesToDelete.map(id => `'${id}'`).join(',\n  ');
    sql += `DELETE FROM stations WHERE id IN (\n  ${idsStr}\n);\n\n`;
  }

  // Add group consolidations
  for (const group of duplicates) {
    const lead = group.stations[0];
    
    // Start with existing streams from the lead station if any
    let allStreams = [];
    if (lead.streams && Array.isArray(lead.streams)) {
      allStreams = [...lead.streams];
    }
    
    // Add the lead's main stream_url if not already in the array
    const leadMeta = guessStreamMetadata(lead);
    if (!allStreams.find(s => s.url === leadMeta.url)) {
      allStreams.push(leadMeta);
    }

    // Add all duplicate stations' streams to the array
    for (let i = 1; i < group.stations.length; i++) {
      const st = group.stations[i];
      // Include their existing streams array if they had one
      if (st.streams && Array.isArray(st.streams)) {
        st.streams.forEach(existingStream => {
           if (!allStreams.find(s => s.url === existingStream.url)) allStreams.push(existingStream);
        });
      }
      // Include their main stream_url
      const meta = guessStreamMetadata(st);
      if (!allStreams.find(s => s.url === meta.url)) {
        allStreams.push(meta);
      }
    }

    allStreams.sort((a, b) => a.bitrate - b.bitrate);
    
    const streamsJson = JSON.stringify(allStreams).replace(/'/g, "''");
    const safeName = getCleanDisplayName(lead.name).replace(/'/g, "''");
    
    sql += `-- Consolidating: ${safeName}\n`;
    sql += `UPDATE stations SET name = '${safeName}', streams = '${streamsJson}'::jsonb WHERE id = '${lead.id}';\n`;

    const idsToDelete = group.stations.slice(1).map(st => st.id);
    if (idsToDelete.length > 0) {
      const idsStr = idsToDelete.map(id => `'${id}'`).join(', ');
      sql += `DELETE FROM stations WHERE id IN (${idsStr});\n`;
    }
    sql += '\n';
  }

  fs.writeFileSync('scripts/migrate_streams_data_v2.sql', sql);
  console.log('✅ Saved SQL to scripts/migrate_streams_data_v2.sql');
}

main();
