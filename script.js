document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

let APP_CONFIG = {};
let BRAND_DATA = {}; 
let COLLECTION_DATA = []; 

async function initApp() {
    try {
        const configRes = await fetch('config.json');
        if (!configRes.ok) throw new Error("Config missing");
        APP_CONFIG = await configRes.json();
    } catch (e) { console.error("Config Error", e); return; }

    // 1. Identify Brand from URL
    const path = window.location.pathname.replace(/^\/|\/$/g, ''); 
    const brandID = path; 

    // 2. Load Data
    await Promise.all([
        loadBrandData(APP_CONFIG.links_csv, brandID),
        loadCollections(APP_CONFIG.collections_csv),
        loadImagesAndHTML()
    ]);

    // 3. Icons
    setTimeout(() => { if(window.lucide) lucide.createIcons(); }, 500);
}

/* --- 1. BRAND DATA & THEME --- */
async function loadBrandData(csvUrl, brandID) {
    if(!csvUrl) return;
    const rows = await fetchCSV(csvUrl);
    
    // CSV Structure (0-9):
    // [0]BrandID, [1]Name, [2]Tagline, [3]About, [4]ProfileImg, [5]ThemeID, [6]WhatsApp, [7]Insta, [8]TikTok, [9]VendorLink
    
    let brandRow;

    // SCENARIO A: User typed a name (e.g. /milaya)
    if (brandID) {
        brandRow = rows.find(r => r[0].trim() === brandID);
    }
    
    // SCENARIO B: Plain URL -> Load 'default'
    if (!brandRow) {
        brandRow = rows.find(r => r[0].trim() === 'default');
    }

    // SCENARIO C: Fallback to first data row (Row 2) if still nothing
    if (!brandRow && rows.length > 1) {
        brandRow = rows[1];
    }
    
    if (brandRow) {
        BRAND_DATA = {
            id: brandRow[0],
            name: brandRow[1],
            tagline: brandRow[2],
            about: brandRow[3], // Commas here are now safe
            img: brandRow[4],
            themeIndex: parseInt(brandRow[5]) || 1,
            whatsapp: brandRow[6],
            insta: brandRow[7],
            tiktok: brandRow[8],
            vendor: brandRow[9]
        };
        
        await applyTheme(APP_CONFIG.theme_csv, BRAND_DATA.themeIndex);
        updateTextContent();
    }
}

async function applyTheme(csvUrl, index) {
    const rows = await fetchCSV(csvUrl);
    const theme = rows.find(r => r[0].trim() == index); 
    if(theme) {
        const root = document.documentElement;
        if(theme[1]) root.style.setProperty('--bg-dark', theme[1].trim());
        if(theme[2]) root.style.setProperty('--bg-gradient', theme[2].trim());
        if(theme[3]) root.style.setProperty('--gold', theme[3].trim());
        if(theme[4]) root.style.setProperty('--gold-light', theme[4].trim());
    }
}

function updateTextContent() {
    // 1. Profile Image or NEW Luxury Initials
    const imgEl = document.querySelector('.profile-img');
    if(BRAND_DATA.img && BRAND_DATA.img.length > 4) {
        imgEl.src = `assets/profile/${BRAND_DATA.img}`;
    } else {
        imgEl.src = generateLuxuryInitials(BRAND_DATA.name);
    }

    // 2. Text
    document.querySelector('.brand-name').textContent = BRAND_DATA.name || "Luxury Store";
    document.querySelector('.tagline').textContent = BRAND_DATA.tagline || "Welcome";
    
    const aboutTextEl = document.querySelector('#about-section');
    if(aboutTextEl) {
        // Injecting the About HTML structure dynamically
        aboutTextEl.innerHTML = `
            <div class="glass-card">
                <h2 class="card-title">About ${BRAND_DATA.name}</h2>
                <p class="text-content">${BRAND_DATA.about || "Welcome to our luxury collection."}</p>
            </div>
        `;
    }

    // 3. Social Links
    const socialContainer = document.querySelector('.social-row');
    if(socialContainer) {
        let socialHtml = '';
        const createIcon = (url, icon, label) => {
            if(!url || url.length < 5) return '';
            return `<a href="${url}" target="_blank" class="social-icon" aria-label="${label}"><i data-lucide="${icon}"></i></a>`;
        };

        if(BRAND_DATA.insta) socialHtml += createIcon(BRAND_DATA.insta, 'instagram', 'Instagram');
        
        if(BRAND_DATA.tiktok) {
            socialHtml += `<a href="${BRAND_DATA.tiktok}" target="_blank" class="social-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v6.14c0 3.48-2.32 6.66-5.83 7.57-4.14 1.05-8.31-1.76-8.91-5.78-.6-4.05 2.27-7.79 6.32-8.39.26-.04.52-.07.78-.08v4.18c-.8.02-1.6.21-2.29.58-1.95 1.05-2.74 3.47-1.8 5.53.94 2.06 3.44 3 5.56 2.15 1.6-.64 2.65-2.2 2.63-3.92V.02h-.54z"/></svg></a>`;
        }
        
        if(BRAND_DATA.whatsapp) socialHtml += createIcon(BRAND_DATA.whatsapp, 'message-circle', 'WhatsApp');
        
        socialContainer.innerHTML = socialHtml;
        if(window.lucide) lucide.createIcons();
    }

    // 4. Update Vendor Link
    const vendorSection = document.getElementById('vendor_access-section');
    if(vendorSection && BRAND_DATA.vendor) {
        vendorSection.innerHTML = `
            <section class="glass-card" style="border-color: var(--gold); text-align: center; background: rgba(20, 20, 20, 0.4);">
                <h2 class="card-title" style="justify-content: center;">Start Your Own Business</h2>
                <p class="text-content">Gain access to our exclusive, verified vendors list.</p>
                <div class="vendor-price">$29 <span class="vendor-strike">$99</span></div>
                <a href="${BRAND_DATA.vendor}" target="_blank" class="btn-gold">Instant Access <i data-lucide="arrow-down" style="display: inline; vertical-align: middle; margin-left: 5px;"></i></a>
            </section>
        `;
        if(window.lucide) lucide.createIcons();
    }
}

// === NEW LUXURY LOGO GENERATOR (Serif + Gold Ring) ===
function generateLuxuryInitials(name) {
    if(!name) return '';
    const canvas = document.createElement('canvas');
    canvas.width = 300; canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    // Get Theme Colors (Fallback to Gold/Black if variable missing)
    const style = getComputedStyle(document.documentElement);
    const goldColor = style.getPropertyValue('--gold').trim() || '#D4AF37';
    const bgColor = style.getPropertyValue('--bg-dark').trim() || '#050a06';
    
    // 1. Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2. Gold Ring Border
    ctx.beginPath();
    ctx.arc(150, 150, 140, 0, 2 * Math.PI);
    ctx.lineWidth = 6;
    ctx.strokeStyle = goldColor;
    ctx.stroke();
    
    // 3. Text (Serif)
    ctx.fillStyle = goldColor;
    ctx.font = "500 110px 'Playfair Display', serif"; 
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Initials
    const initials = name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
    ctx.fillText(initials, 150, 150);
    
    return canvas.toDataURL();
}

/* --- 2. COLLECTIONS --- */
async function loadCollections(csvUrl) {
    if(!csvUrl) return;
    const grid = document.querySelector('.carousel-container');
    grid.innerHTML = '<div class="skeleton-loader"></div><div class="skeleton-loader"></div>';

    const rows = await fetchCSV(csvUrl);
    COLLECTION_DATA = rows.slice(1).map(r => ({ name: r[0], img: r[1], link: r[2] })).filter(i => i.name);

    let html = '';
    COLLECTION_DATA.slice(0, 6).forEach(item => { html += createCollectionCard(item); });
    grid.innerHTML = html;
}

function createCollectionCard(item) {
    const imgPath = item.img ? `assets/collections/${item.img.trim()}` : 'assets/placeholder.jpg';
    return `
        <div class="product-card" onclick="toggleCollectionModal(true)">
            <img src="${imgPath}" loading="lazy" alt="${item.name}" class="product-img">
            <div class="product-overlay"><div class="product-name">${item.name}</div></div>
        </div>
    `;
}

/* --- 3. IMAGES & PROOFS --- */
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
                const fullList = [...images, ...images, ...images];
                let html = '';
                fullList.forEach((img, index) => {
                    const originalIndex = index % images.length; 
                    html += `<div class="marquee-item"><img src="${basePath}${img}" onclick="openZoom('${basePath}', '${img}', ${originalIndex}, '${section}')" loading="lazy"></div>`;
                });
                track.innerHTML = html;
                if(!window.GALLERY_DATA) window.GALLERY_DATA = {};
                window.GALLERY_DATA[section] = images.map(i => basePath + i);
            }
        }
    });
}

/* --- MODALS --- */
function toggleCollectionModal(show) {
    const modal = document.getElementById('collection-modal');
    const grid = document.getElementById('modal-grid-container');
    if(show) {
        let html = '';
        COLLECTION_DATA.forEach(item => {
            const imgPath = item.img ? `assets/collections/${item.img.trim()}` : 'assets/placeholder.jpg';
            html += `<a href="${item.link || '#'}" target="_blank" class="product-card"><img src="${imgPath}" class="product-img"><div class="product-overlay"><div class="product-name">${item.name}</div></div></a>`;
        });
        grid.innerHTML = html;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

let currentModalImages = [];
let currentModalIndex = 0;

function openZoom(basePath, filename, index, sectionKey) {
    const modal = document.getElementById('image-zoom-modal');
    currentModalImages = window.GALLERY_DATA[sectionKey];
    currentModalIndex = index;
    updateZoomImage();
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function updateZoomImage() {
    const img = document.getElementById('img01');
    img.src = currentModalImages[currentModalIndex];
}

function navZoom(direction) {
    currentModalIndex += direction;
    if(currentModalIndex < 0) currentModalIndex = currentModalImages.length - 1;
    if(currentModalIndex >= currentModalImages.length) currentModalIndex = 0;
    updateZoomImage();
}

function closeZoom() { 
    document.getElementById('image-zoom-modal').classList.add('hidden'); 
    document.body.style.overflow = 'auto';
}

/* --- IMPROVED CSV PARSER (Handles "Quoted Text, With Commas") --- */
async function fetchCSV(url) {
    try {
        const res = await fetch(url); 
        const text = await res.text();
        
        // Complex Regex to handle commas inside quotes
        const pattern = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
        
        // Manual split to be safer
        const rows = [];
        const lines = text.split('\n');
        
        lines.forEach(line => {
            const row = [];
            let inQuote = false;
            let currentCell = '';
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuote = !inQuote;
                } else if (char === ',' && !inQuote) {
                    row.push(currentCell.replace(/^"|"$/g, '').trim()); // Remove quotes
                    currentCell = '';
                } else {
                    currentCell += char;
                }
            }
            row.push(currentCell.replace(/^"|"$/g, '').trim());
            if(row.length > 1) rows.push(row);
        });
        
        return rows;
    } catch(e) { console.error("CSV Parse Error", e); return []; }
}