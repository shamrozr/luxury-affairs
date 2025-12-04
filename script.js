document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

let DB = {}; // Holds all data locally
let BRAND_DATA = {}; 

async function initApp() {
    // 1. Fetch Local Database (Instant)
    try {
        const res = await fetch('db.json');
        DB = await res.json();
    } catch (e) { console.error("DB Load Error", e); return; }

    // 2. Identify Brand from URL
    const path = window.location.pathname.replace(/^\/|\/$/g, ''); 
    const brandID = path || 'default'; // URL or default

    // 3. Process Data
    loadBrandData(brandID);
    loadCollections();
    
    // 4. Load Images & HTML (This fixes the missing sections)
    await loadImagesAndHTML();

    // 5. Icons
    setTimeout(() => { if(window.lucide) lucide.createIcons(); }, 100);
}

/* --- 1. BRAND LOGIC --- */
function loadBrandData(brandID) {
    const rows = DB.brands;
    
    // Find Brand (Col A = BrandID)
    let brandRow = rows.find(r => r[0].trim() === brandID);
    
    // Fallback: If not found, try 'default', or just Row 1 (Index 1)
    if (!brandRow) brandRow = rows.find(r => r[0].trim() === 'default');
    if (!brandRow && rows.length > 1) brandRow = rows[1]; 

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
        
        applyTheme(BRAND_DATA.themeIndex);
        updateUI();
    }
}

function applyTheme(index) {
    const theme = DB.themes.find(r => r[0].trim() == index);
    if(theme) {
        const root = document.documentElement;
        if(theme[1]) root.style.setProperty('--bg-dark', theme[1].trim());
        if(theme[2]) root.style.setProperty('--bg-gradient', theme[2].trim());
        if(theme[3]) root.style.setProperty('--gold', theme[3].trim());
        if(theme[4]) root.style.setProperty('--gold-light', theme[4].trim());
    }
}

function updateUI() {
    // Initials or Image
    const imgEl = document.querySelector('.profile-img');
    if(BRAND_DATA.img && BRAND_DATA.img.length > 4) {
        imgEl.src = `assets/profile/${BRAND_DATA.img}`;
    } else {
        imgEl.src = generateLuxuryInitials(BRAND_DATA.name);
    }

    // Text
    document.querySelector('.brand-name').textContent = BRAND_DATA.name;
    document.querySelector('.tagline').textContent = BRAND_DATA.tagline;

    // Socials
    const socialContainer = document.querySelector('.social-row');
    let html = '';
    if(BRAND_DATA.insta) html += `<a href="${BRAND_DATA.insta}" class="social-icon"><i data-lucide="instagram"></i></a>`;
    if(BRAND_DATA.tiktok) html += `<a href="${BRAND_DATA.tiktok}" class="social-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v6.14c0 3.48-2.32 6.66-5.83 7.57-4.14 1.05-8.31-1.76-8.91-5.78-.6-4.05 2.27-7.79 6.32-8.39.26-.04.52-.07.78-.08v4.18c-.8.02-1.6.21-2.29.58-1.95 1.05-2.74 3.47-1.8 5.53.94 2.06 3.44 3 5.56 2.15 1.6-.64 2.65-2.2 2.63-3.92V.02h-.54z"/></svg></a>`;
    if(BRAND_DATA.whatsapp) html += `<a href="${BRAND_DATA.whatsapp}" class="social-icon"><i data-lucide="message-circle"></i></a>`;
    socialContainer.innerHTML = html;
}

/* --- 2. HTML SECTION LOADER (Fixes missing sections) --- */
async function loadImagesAndHTML() {
    let manifest = {};
    try { const res = await fetch('manifest.json'); manifest = await res.json(); } catch(e) {}

    // LIST OF ALL SECTIONS TO LOAD
    const htmlFiles = [
        'about', 
        'how_to_order', 
        'vendor_access', 
        'testimonials', 
        'delivery_proof', 
        'payment_proof'
    ];

    for (const file of htmlFiles) {
        try {
            const res = await fetch(`sections/${file}.html`);
            const html = await res.text();
            
            // Inject HTML
            const el = document.getElementById(`${file}-section`);
            if(el) {
                el.innerHTML = html;
                
                // Post-Injection Logic (Text replacement & Images)
                if(file === 'about') {
                     document.querySelector('#about-section h2').innerText = `About ${BRAND_DATA.name}`;
                     document.querySelector('#about-section p').innerText = BRAND_DATA.about;
                }
                
                if(file === 'vendor_access') {
                    if(BRAND_DATA.vendor) document.querySelector('#vendor_access-section a').href = BRAND_DATA.vendor;
                }

                if(['testimonials', 'delivery_proof', 'payment_proof'].includes(file)) {
                    loadMarqueeImages(file, manifest);
                }
            }
        } catch(e) { console.error(`Failed to load ${file}`, e); }
    }
}

function loadMarqueeImages(key, manifest) {
    let images = [];
    let path = '';
    
    if(key === 'testimonials') { images = manifest.testimonials; path = 'assets/testimonials/'; }
    if(key === 'delivery_proof') { images = manifest.delivery_proofs; path = 'assets/delivery_proofs/'; }
    if(key === 'payment_proof') { images = manifest.payment_proofs; path = 'assets/payment_proofs/'; }

    const track = document.getElementById(`${key}-track`);
    if(track && images.length > 0) {
        const fullList = [...images, ...images, ...images]; // Triple loop
        let html = '';
        fullList.forEach((img, idx) => {
             const realIdx = idx % images.length;
             html += `<div class="marquee-item"><img src="${path}${img}" onclick="openZoom('${path}', '${img}', ${realIdx}, '${key}')" loading="lazy"></div>`;
        });
        track.innerHTML = html;
        
        if(!window.GALLERY_DATA) window.GALLERY_DATA = {};
        window.GALLERY_DATA[key] = images.map(i => path + i);
    }
}

/* --- 3. COLLECTIONS --- */
function loadCollections() {
    const rows = DB.collections.slice(1); // Skip header
    const grid = document.querySelector('.carousel-container');
    
    let html = '';
    // Top 6
    rows.slice(0, 6).forEach(r => {
        if(!r[0]) return;
        const img = r[1] ? `assets/collections/${r[1].trim()}` : 'assets/placeholder.jpg';
        // Check for link in column [2]
        const link = r[2] ? r[2] : null; 
        
        // If link exists, open in new tab. If not, open modal.
        const clickAction = link ? `window.open('${link}', '_blank')` : 'toggleCollectionModal(true)';
        
        html += `
        <div class="product-card" onclick="${clickAction}">
            <img src="${img}" loading="lazy" class="product-img">
            <div class="product-overlay"><div class="product-name">${r[0]}</div></div>
        </div>`;
    });
    grid.innerHTML = html;
}

// LOGO GENERATOR
function generateLuxuryInitials(name) {
    if(!name) return '';
    const canvas = document.createElement('canvas');
    canvas.width = 300; canvas.height = 300;
    const ctx = canvas.getContext('2d');
    const style = getComputedStyle(document.documentElement);
    const gold = style.getPropertyValue('--gold').trim();
    const bg = style.getPropertyValue('--bg-dark').trim();
    
    ctx.fillStyle = bg; ctx.fillRect(0,0,300,300);
    ctx.beginPath(); ctx.arc(150,150,140,0,2*Math.PI);
    ctx.lineWidth = 6; ctx.strokeStyle = gold; ctx.stroke();
    
    ctx.fillStyle = gold; 
    ctx.font = "500 110px 'Playfair Display', serif"; 
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    
    const initials = name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
    ctx.fillText(initials, 150, 150);
    return canvas.toDataURL();
}

/* --- MODALS --- */
function toggleCollectionModal(show) {
    const modal = document.getElementById('collection-modal');
    const grid = document.getElementById('modal-grid-container');
    if(show) {
        let html = '';
        DB.collections.slice(1).forEach(r => {
             if(!r[0]) return;
             const img = r[1] ? `assets/collections/${r[1].trim()}` : 'assets/placeholder.jpg';
             const link = r[2] || '#';
             html += `<a href="${link}" target="_blank" class="product-card"><img src="${img}" class="product-img"><div class="product-overlay"><div class="product-name">${r[0]}</div></div></a>`;
        });
        grid.innerHTML = html;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

let curImgs = [], curIdx = 0;
function openZoom(p, f, i, k) {
    const modal = document.getElementById('image-zoom-modal');
    curImgs = window.GALLERY_DATA[k]; curIdx = i;
    document.getElementById('img01').src = curImgs[curIdx];
    modal.classList.remove('hidden'); document.body.style.overflow = 'hidden';
}
function navZoom(d) {
    curIdx += d;
    if(curIdx < 0) curIdx = curImgs.length - 1;
    if(curIdx >= curImgs.length) curIdx = 0;
    document.getElementById('img01').src = curImgs[curIdx];
}
function closeZoom() {
    document.getElementById('image-zoom-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}