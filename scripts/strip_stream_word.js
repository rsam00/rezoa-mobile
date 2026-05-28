const fs = require('fs');
let md = fs.readFileSync('similar_stations_fuzzy.md', 'utf8');
md = md.replace(/\(\s*stream\s*\)/gi, '');
fs.writeFileSync('similar_stations_fuzzy.md', md);
console.log('Stripped (stream) from similar_stations_fuzzy.md');
