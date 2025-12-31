const fs = require('fs');
const path = require('path');

/* --- CONFIGURATION --- */
const CONFIG = {
    theme_url: process.env.THEME_CSV_URL,
    links_url: process.env.LINKS_CSV_URL,
    collections_url: process.env.COLLECTIONS_CSV_URL
};

const OUTPUT_DB = 'db.json';
const OUTPUT_MANIFEST = 'manifest.json';

/* --- 1. FETCH & PARSE CSV --- */
async function fetchAndParseCSV(url) {
    if (!url) return [];
    try {
        const response = await fetch(url);
        const text = await response.text();
        
        // Handle CSV parsing (handling quoted commas)
        const pattern = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
        const rows = [];
        const lines = text.split('\n');
        
        lines.forEach(line => {
            const row = [];
            let inQuote = false;
            let currentCell = '';
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') { inQuote = !inQuote; } 
                else if (char === ',' && !inQuote) {
                    row.push(currentCell.replace(/^"|"$/g, '').trim());
                    currentCell = '';
                } else { currentCell += char; }
            }
            row.push(currentCell.replace(/^"|"$/g, '').trim());
            if(row.length > 1) rows.push(row);
        });
        return rows;
    } catch (error) {
        console.error("Error fetching CSV:", error);
        return [];
    }
}

async function buildDatabase() {
    console.log("🚀 Downloading Google Sheets data...");
    
    const [themes, brands, collections] = await Promise.all([
        fetchAndParseCSV(CONFIG.theme_url),
        fetchAndParseCSV(CONFIG.links_url),
        fetchAndParseCSV(CONFIG.collections_url)
    ]);

    const database = {
        themes: themes,
        brands: brands,
        collections: collections
    };

    fs.writeFileSync(OUTPUT_DB, JSON.stringify(database, null, 2));
    console.log(`✅ Data saved to ${OUTPUT_DB}`);
}

/* --- 2. GENERATE IMAGE MANIFEST --- */
function buildManifest() {
    const manifest = {
        profile_images: [],
        testimonials: [],
        delivery_proofs: [],
        payment_proofs: [],
        videos: [] 
    };

    const readDir = (key, folder) => {
        const fullPath = path.join('./assets', folder);
        if (fs.existsSync(fullPath)) {
            // Filter to ensure we only get files, not system files like .DS_Store
            manifest[key] = fs.readdirSync(fullPath).filter(f => !f.startsWith('.'));
            console.log(`📸 Found ${manifest[key].length} files in ${folder}`);
        }
    };

    readDir('profile_images', 'profile');
    readDir('testimonials', 'testimonials');
    readDir('delivery_proofs', 'delivery_proofs');
    readDir('payment_proofs', 'payment_proofs');
    readDir('videos', 'videos'); // Scans the new videos folder

    fs.writeFileSync(OUTPUT_MANIFEST, JSON.stringify(manifest, null, 2));
}

// Run Build
(async () => {
    await buildDatabase();
    buildManifest();
    console.log("🎉 Build Complete.");
})();