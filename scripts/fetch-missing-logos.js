const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClearbit(domain) {
  try {
    const url = `https://logo.clearbit.com/${domain}`;
    await axios.head(url, { 
      timeout: 5000, 
      maxRedirects: 5, 
      signal: AbortSignal.timeout(6000),
      validateStatus: (status) => status < 400 
    });
    return url;
  } catch (e) {
    return null;
  }
}

async function scrapeWebsite(websiteUrl) {
  try {
    const res = await axios.get(websiteUrl, { 
      timeout: 5000, 
      maxRedirects: 3, 
      signal: AbortSignal.timeout(6000),
      headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'} 
    });
    const $ = cheerio.load(res.data);
    
    let img = $('meta[property="og:image"]').attr('content');
    if (img) return resolveUrl(websiteUrl, img);
    
    img = $('link[rel="apple-touch-icon"]').attr('href');
    if (img) return resolveUrl(websiteUrl, img);
    
    img = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href');
    if (img && !img.endsWith('.ico')) return resolveUrl(websiteUrl, img);
    
    img = $('img[src*="logo"]').attr('src') || $('img[alt*="logo" i]').attr('src') || $('img[class*="logo" i]').attr('src');
    if (img) return resolveUrl(websiteUrl, img);
    
    return null;
  } catch(e) {
    return null;
  }
}

function resolveUrl(base, relative) {
  try {
    return new URL(relative, base).href;
  } catch (e) {
    return null;
  }
}

async function main() {
    console.log('Fetching all stations...');
    let page = 0;
    const pageSize = 1000;
    let allStations = [];
    
    while(true) {
        const {data, error} = await supabase
            .from('stations')
            .select('id, name, website, logo')
            .range(page * pageSize, (page + 1) * pageSize - 1);
            
        if (error) { console.error(error); return; }
        if (data.length === 0) break;
        allStations = allStations.concat(data);
        page++;
    }
    
    const targetStations = allStations.filter(s => (!s.logo || s.logo.trim() === '') && s.website && s.website.startsWith('http'));
    console.log(`Found ${targetStations.length} stations to process.`);

    // Clear the file
    fs.writeFileSync('scripts/fetch-missing-logos.sql', '');
    
    let count = 0;
    let foundLogos = 0;
    const batchSize = 10;
    for (let i = 0; i < targetStations.length; i += batchSize) {
        const batch = targetStations.slice(i, i + batchSize);
        const results = await Promise.all(batch.map(async (s) => {
            try {
                const urlObj = new URL(s.website);
                const domain = urlObj.hostname.replace(/^www\./, '');
                
                let logoUrl = await checkClearbit(domain);
                if (!logoUrl) {
                    logoUrl = await scrapeWebsite(s.website);
                }
                
                if (logoUrl) {
                    return `UPDATE stations SET logo = '${logoUrl.replace(/'/g, "''")}' WHERE id = '${s.id}';\n`;
                }
            } catch (e) {
                // invalid url or parsing error
            }
            return null;
        }));
        
        for (const res of results) {
            if (res) {
                fs.appendFileSync('scripts/fetch-missing-logos.sql', res);
                foundLogos++;
            }
        }
        
        count += batch.length;
        console.log(`Processed ${count}/${targetStations.length} ... Found ${foundLogos} logos so far`);
    }
    
    console.log(`Finished! Generated ${foundLogos} SQL updates in scripts/fetch-missing-logos.sql`);
}

main();
