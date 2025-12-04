const fs = require('fs');
const path = require('path');

/* --- 1. CONFIGURATION (From Cloudflare Env Variables) --- */
const CONFIG_DATA = {
    // These names must match what you enter in Cloudflare Settings
    theme_csv: process.env.THEME_CSV_URL || "",
    links_csv: process.env.LINKS_CSV_URL || "",
    collections_csv: process.env.COLLECTIONS_CSV_URL || ""
};

const ASSETS_DIR = './assets';
const OUTPUT_MANIFEST = 'manifest.json';
const OUTPUT_CONFIG = 'config.json';

/* --- 2. GENERATE MANIFEST (Auto-Scan Images) --- */
function generateManifest() {
    const manifest = {
        profile_images: [],
        testimonials: [],
        delivery_proofs: [],
        payment_proofs: [],
        // We scan collections too just to verify files exist, 
        // though the CSV dictates which image goes with which category.
        collection_images: [] 
    };

    const readDir = (manifestKey, folderName) => {
        const fullPath = path.join(ASSETS_DIR, folderName);
        if (fs.existsSync(fullPath)) {
            const files = fs.readdirSync(fullPath).filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'].includes(ext);
            });
            manifest[manifestKey] = files;
            console.log(`✅ Found ${files.length} images in /${folderName}`);
        } else {
            console.warn(`⚠️ Warning: Folder /assets/${folderName} not found.`);
        }
    };

    readDir('profile_images', 'profile');
    readDir('testimonials', 'testimonials');
    readDir('delivery_proofs', 'delivery_proofs');
    readDir('payment_proofs', 'payment_proofs');
    readDir('collection_images', 'collections');

    fs.writeFileSync(OUTPUT_MANIFEST, JSON.stringify(manifest, null, 2));
}

/* --- 3. GENERATE CONFIG (Inject CSV Links) --- */
function generateConfig() {
    fs.writeFileSync(OUTPUT_CONFIG, JSON.stringify(CONFIG_DATA, null, 2));
    console.log("✅ Config generated with remote CSV links.");
}

// Execute
console.log("🚀 Starting Build Process...");
generateManifest();
generateConfig();
console.log("🎉 Build Complete.");