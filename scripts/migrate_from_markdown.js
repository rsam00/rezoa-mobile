const fs = require('fs');

function parseMarkdown() {
  const md = fs.readFileSync('similar_stations_fuzzy.md', 'utf8');
  const lines = md.split('\n');
  
  let currentGroup = null;
  const groups = [];

  for (let line of lines) {
    line = line.trim();
    
    // Detect new group
    if (line.startsWith('### ')) {
      if (currentGroup) {
        groups.push(currentGroup);
      }
      
      const header = line.substring(4);
      // Remove " (X streams)" from the end
      const nameMatch = header.match(/(.*?)\s*\(\d+\s*streams?\)/);
      const name = nameMatch ? nameMatch[1].trim() : header.trim();
      
      currentGroup = {
        name: name,
        primaryId: null,
        streams: []
      };
    } 
    // Detect Primary ID
    else if (line.startsWith('**Primary ID:**')) {
      const match = line.match(/`([^`]+)`/);
      if (match && currentGroup) {
        currentGroup.primaryId = match[1];
      }
    }
    // Detect table row
    else if (line.startsWith('|') && !line.includes('---|')) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 6) {
        const label = parts[1].replace(/\*\*/g, '').trim();
        const format = parts[2].toLowerCase();
        
        // Bitrate is like "128k"
        let bitrateRaw = parts[3].toLowerCase();
        let bitrate = parseInt(bitrateRaw.replace(/[^\d]/g, ''));
        if (isNaN(bitrate)) bitrate = 128; // default fallback
        
        const originalName = parts[4];
        
        const urlMatch = parts[5].match(/`([^`]+)`/);
        if (urlMatch && label !== 'Label') { // Skip header row
          currentGroup.streams.push({
            url: urlMatch[1],
            bitrate: bitrate,
            format: format,
            label: label
          });
        }
      }
    }
  }
  
  if (currentGroup) {
    groups.push(currentGroup);
  }
  
  return groups;
}

function generateSQL(groups) {
  let sql = '-- Migration script to merge duplicate stations into streams column\n';
  sql += '-- Generated from user-curated similar_stations_fuzzy.md\n\n';

  for (const group of groups) {
    if (!group.primaryId || group.streams.length === 0) continue;
    
    // 1. Update the primary station with the new name and streams array
    const streamsJson = JSON.stringify(group.streams).replace(/'/g, "''");
    const safeName = group.name.replace(/'/g, "''");
    
    sql += `UPDATE stations SET name = '${safeName}', streams = '${streamsJson}'::jsonb WHERE id = '${group.primaryId}';\n`;
    
    // 2. Delete the duplicate stations based on matching URLs (excluding the primary ID)
    const urls = group.streams.map(s => `'${s.url.replace(/'/g, "''")}'`).join(', ');
    if (urls.length > 0) {
      sql += `DELETE FROM stations WHERE stream_url IN (${urls}) AND id != '${group.primaryId}';\n`;
    }
    
    sql += '\n';
  }

  fs.writeFileSync('scripts/migrate_streams_data.sql', sql);
  console.log(`Saved SQL to scripts/migrate_streams_data.sql for ${groups.length} curated groups.`);
}

const parsedGroups = parseMarkdown();
generateSQL(parsedGroups);
