document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

let APP_CONFIG = {};
let BRAND_DATA = {}; // Stores the specific brand info
let COLLECTION_DATA = []; 

// State for Modal Navigation
let currentModalImages = [];
let currentModalIndex = 0;

async function initApp() {
    try {
        const configRes = await fetch('config.json');
        if (!configRes.ok) throw new Error("Config missing");
        APP_CONFIG = await configRes.json();
    } catch (e) { console.error("Config Error", e); return; }

    // 1. Identify Brand from URL (e.g., /june_nicole)
    const path = window.location.pathname.replace(/^\/|\/$/g, ''); // Remove slashes
    const brandID = path || 'default'; // Fallback to first row if empty

    // 2. Load Data in Parallel
    await Promise.all([
        loadBrandData(APP_CONFIG.links_csv, brandID), // Loads Theme & Socials
        loadCollections(APP_CONFIG.collections_csv),
        loadImagesAndHTML()
    ]);

    // 3. Icons & UI Polish
    setTimeout(() => { if(window.lucide) lucide.createIcons(); }, 500);
}

/* --- 1. BRAND DATA & THEME ENGINE --- */
async function loadBrandData(csvUrl, brandID) {
    if(!csvUrl) return;
    const rows = await fetchCSV(csvUrl);
    // CSV Structure Expectation:
    // [0]BrandID, [1]Name, [2]Tagline, [3]About, [4]ProfileImg, [5]ThemeID, [6]WhatsApp, [7]Insta, [8]TikTok, [9]VendorLink
    
    // Find row matching BrandID, or default to first data row
    let brandRow = rows.find(r => r[0].trim() === brandID);
    if (!brandRow && rows.length > 1) brandRow = rows[1]; // Fallback to first brand
    
    if (brandRow) {
        BRAND_DATA = {
            id: brandRow[0],
            name: brandRow[1],
            tagline: brandRow[2],
            about: brandRow[3],
            img: brandRow[4],
            themeIndex: parseInt(brandRow[5]) || 1,
            whatsapp: brandRow[6],
            insta: brandRow[7],
            tiktok: brandRow[8],
            vendor: brandRow[9]
        };
        
        // Load Theme Colors (Fetch Theme CSV and pick by Index)
        await applyTheme(APP_CONFIG.theme_csv, BRAND_DATA.themeIndex);
        
        // Update Text Content
        updateTextContent();
    }
}

async function applyTheme(csvUrl, index) {
    const rows = await fetchCSV(csvUrl);
    // Find row where ThemeID matches
    const theme = rows.find(r => r[0].trim() == index); 
    if(theme) {
        const root = document.documentElement;
        // [ID, BgDark, Gradient, Gold, LightGold]
        root.style.setProperty('--bg-dark', theme[1].trim());
        root.style.setProperty('--bg-gradient', theme[2].trim());
        root.style.setProperty('--gold', theme[3].trim());
        if(theme[4]) root.style.setProperty('--gold-light', theme[4].trim());
    }
}

function updateTextContent() {
    // 1. Profile Image or Initials
    const imgEl = document.querySelector('.profile-img');
    if(BRAND_DATA.img && BRAND_DATA.img.includes('.')) {
        imgEl.src = `assets/profile/${BRAND_DATA.img}`;
    } else {
        // Generate Initials
        imgEl.src = generateInitialsImage(BRAND_DATA.name);
    }

    // 2. Text
    document.querySelector('.brand-name').textContent = BRAND_DATA.name;
    document.querySelector('.tagline').textContent = BRAND_DATA.tagline;
    document.querySelector('#about-text').textContent = BRAND_DATA.about;

    // 3. Social Links
    const socialContainer = document.querySelector('.social-row');
    let socialHtml = '';
    
    // Helper for icons
    const createIcon = (url, icon, label) => {
        if(!url) return '';
        return `<a href="${url}" target="_blank" class="social-icon" aria-label="${label}"><i data-lucide="${icon}"></i></a>`;
    };

    socialHtml += createIcon(BRAND_DATA.insta, 'instagram', 'Instagram');
    // Custom TikTok SVG
    if(BRAND_DATA.tiktok) {
        socialHtml += `<a href="${BRAND_DATA.tiktok}" target="_blank" class="social-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v6.14c0 3.48-2.32 6.66-5.83 7.57-4.14 1.05-8.31-1.76-8.91-5.78-.6-4.05 2.27-7.79 6.32-8.39.26-.04.52-.07.78-.08v4.18c-.8.02-1.6.21-2.29.58-1.95 1.05-2.74 3.47-1.8 5.53.94 2.06 3.44 3 5.56 2.15 1.6-.64 2.65-2.2 2.63-3.92V.02h-.54z"/></svg></a>`;
    }
    socialHtml += createIcon(BRAND_DATA.whatsapp, 'message-circle', 'WhatsApp');
    socialContainer.innerHTML = socialHtml;

    // 4. Update Vendor Link
    const vendorBtn = document.getElementById('vendor-btn');
    if(vendorBtn) vendorBtn.href = BRAND_DATA.vendor || '#';
}

function generateInitialsImage(name) {
    const canvas = document.createElement('canvas');
    canvas.width = 150; canvas.height = 150;
    const ctx = canvas.getContext('2d');
    
    // Background (Theme Gold)
    const goldColor = getComputedStyle(document.documentElement).getPropertyValue('--gold').trim();
    ctx.fillStyle = goldColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Text (Dark Theme BG)
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-dark').trim();
    ctx.fillStyle = bgColor;
    ctx.font = "bold 60px 'DM Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Get Initials (e.g. Milaya Bags -> MB)
    const initials = name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
    ctx.fillText(initials, canvas.width/2, canvas.height/2);
    
    return canvas.toDataURL();
}


/* --- 2. COLLECTIONS (With Skeleton Loader) --- */
async function loadCollections(csvUrl) {
    if(!csvUrl) return;
    
    // Show Skeleton / Remove Loading State
    const grid = document.querySelector('.carousel-container');
    grid.innerHTML = '<div class="skeleton-loader"></div><div class="skeleton-loader"></div><div class="skeleton-loader"></div>';

    const rows = await fetchCSV(csvUrl);
    COLLECTION_DATA = rows.slice(1).map(r => ({ name: r[0], img: r[1], link: r[2] })).filter(i => i.name);

    let html = '';
    // Show top 6
    COLLECTION_DATA.slice(0, 6).forEach(item => { html += createCollectionCard(item); });
    grid.innerHTML = html;
}

function createCollectionCard(item) {
    const imgPath = item.img ? `assets/collections/${item.img.trim()}` : 'assets/placeholder.jpg';
    // Link triggers Modal instead of external
    return `
        <div class="product-card" onclick="toggleCollectionModal(true)">
            <img src="${imgPath}" loading="lazy" alt="${item.name}" class="product-img">
            <div class="product-overlay"><div class="product-name">${item.name}</div></div>
        </div>
    `;
}

/* --- 3. TESTIMONIALS & PROOFS (Navigation Logic) --- */
async function loadImagesAndHTML() {
    let manifest = {};
    try { const res = await fetch('manifest.json'); manifest = await res.json(); } catch(e) {}

    const sections = ['testimonials', 'delivery_proof', 'payment_proof'];
    
    sections.forEach(section => {
        let images = [];
        let basePath = '';
        if(section === 'testimonials') { images = manifest.testimonials; basePath = 'assets/testimonials/'; }
        if(section === 'delivery_proof') { images = manifest.delivery_proofs; basePath = 'assets/delivery_proofs/'; }
        if(section === 'payment_proof') { images = manifest.payment_proofs; basePath = 'assets/payment_proofs/'; }

        if(images && images.length > 0) {
            const track = document.getElementById(`${section}-track`);
            if(track) {
                // Triple duplicate for gapless infinite scroll
                const fullList = [...images, ...images, ...images];
                let html = '';
                fullList.forEach((img, index) => {
                    // Pass the ORIGINAL list index for modal navigation
                    const originalIndex = index % images.length; 
                    html += `<div class="marquee-item"><img src="${basePath}${img}" onclick="openZoom('${basePath}', '${img}', ${originalIndex}, '${section}')" loading="lazy"></div>`;
                });
                track.innerHTML = html;
                
                // Save list to global object for navigation referencing
                if(!window.GALLERY_DATA) window.GALLERY_DATA = {};
                window.GALLERY_DATA[section] = images.map(i => basePath + i);
            }
        }
    });
}

/* --- 4. MODALS (Fixed & Themed) --- */

// Collection Modal
function toggleCollectionModal(show) {
    const modal = document.getElementById('collection-modal');
    const grid = document.getElementById('modal-grid-container');
    if(show) {
        let html = '';
        COLLECTION_DATA.forEach(item => {
            const imgPath = item.img ? `assets/collections/${item.img.trim()}` : 'assets/placeholder.jpg';
            html += `
                <a href="${item.link || '#'}" target="_blank" class="product-card">
                    <img src="${imgPath}" class="product-img">
                    <div class="product-overlay"><div class="product-name">${item.name}</div></div>
                </a>`;
        });
        grid.innerHTML = html;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

// Image Zoom Modal (With Arrows)
function openZoom(basePath, filename, index, sectionKey) {
    const modal = document.getElementById('image-zoom-modal');
    
    // Set Current Context
    currentModalImages = window.GALLERY_DATA[sectionKey];
    currentModalIndex = index;
    
    updateZoomImage();
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Lock Scroll
}

function updateZoomImage() {
    const img = document.getElementById('img01');
    img.src = currentModalImages[currentModalIndex];
}

function navZoom(direction) {
    // direction: -1 (prev) or 1 (next)
    currentModalIndex += direction;
    
    // Loop around
    if(currentModalIndex < 0) currentModalIndex = currentModalImages.length - 1;
    if(currentModalIndex >= currentModalImages.length) currentModalIndex = 0;
    
    updateZoomImage();
}

function closeZoom() { 
    document.getElementById('image-zoom-modal').classList.add('hidden'); 
    document.body.style.overflow = 'auto';
}

/* --- HELPER --- */
async function fetchCSV(url) {
    try {
        const res = await fetch(url); const text = await res.text();
        return text.split('\n').map(row => row.split(',')).filter(r => r.length > 1);
    } catch(e) { return []; }
}