document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

let DB = {}; 
let BRAND_DATA = {}; 

async function initApp() {
    // 1. Fetch Local Database
    try {
        const res = await fetch('db.json');
        DB = await res.json();
    } catch (e) { console.error("DB Load Error", e); return; }

    // 2. Identify Brand from URL
    const path = window.location.pathname.replace(/^\/|\/$/g, ''); 
    const brandID = path || 'default'; 

    // 3. Process Data
    loadBrandData(brandID);
    loadCollections();
    
    // 4. Load Images & HTML
    await loadImagesAndHTML();

    // 5. Icons & Favicon
    setTimeout(() => { if(window.lucide) lucide.createIcons(); }, 100);
}

/* --- 1. BRAND LOGIC --- */
function loadBrandData(brandID) {
    const rows = DB.brands;
    
    let brandRow = rows.find(r => r[0].trim() === brandID);
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
        updateFavicon(); // <--- NEW: Updates Browser Tab Icon
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

/* --- THIS FUNCTION REPLACES THE OLD updateUI() --- */
function updateUI() {
    // 1. Initials or Image
    const imgEl = document.querySelector('.profile-img');
    if(BRAND_DATA.img && BRAND_DATA.img.length > 4) {
        imgEl.src = `assets/profile/${BRAND_DATA.img}`;
    } else {
        imgEl.src = generateLuxuryInitials(BRAND_DATA.name, 300);
    }

    // 2. Text
    document.querySelector('.brand-name').textContent = BRAND_DATA.name;
    document.querySelector('.tagline').textContent = BRAND_DATA.tagline;
    document.title = `${BRAND_DATA.name} | Luxury Store`;

    // 3. Social Icons (With Real WhatsApp SVG)
    const socialContainer = document.querySelector('.social-row');
    let html = '';
    
    // Instagram
    if(BRAND_DATA.insta) {
        html += `<a href="${BRAND_DATA.insta}" target="_blank" class="social-icon"><i data-lucide="instagram"></i></a>`;
    }
    
    // TikTok
    if(BRAND_DATA.tiktok) {
        html += `<a href="${BRAND_DATA.tiktok}" target="_blank" class="social-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v6.14c0 3.48-2.32 6.66-5.83 7.57-4.14 1.05-8.31-1.76-8.91-5.78-.6-4.05 2.27-7.79 6.32-8.39.26-.04.52-.07.78-.08v4.18c-.8.02-1.6.21-2.29.58-1.95 1.05-2.74 3.47-1.8 5.53.94 2.06 3.44 3 5.56 2.15 1.6-.64 2.65-2.2 2.63-3.92V.02h-.54z"/></svg></a>`;
    }
    
    // WhatsApp (Header Icon - Real Logo)
    if(BRAND_DATA.whatsapp) {
        html += `<a href="${BRAND_DATA.whatsapp}" target="_blank" class="social-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M18.403 5.633A8.919 8.919 0 0 0 12.053 3c-4.948 0-8.976 4.027-8.978 8.977 0 1.582.413 3.126 1.198 4.488L3.3 21.7l5.384-1.412a8.951 8.951 0 0 0 4.369 1.141h.004c4.948 0 8.975-4.026 8.977-8.976a8.91 8.91 0 0 0-3.631-6.82ZM12.054 19.92h-.003c-1.468 0-2.906-.395-4.16-1.14l-.299-.177-3.091.811.825-3.013-.194-.309a7.472 7.472 0 0 1-1.146-3.987c.002-4.12 3.354-7.473 7.478-7.473 1.998 0 3.876.779 5.289 2.193a7.447 7.447 0 0 1 2.19 5.291c-.002 4.12-3.356 7.473-7.483 7.473Zm4.093-5.603c-.224-.112-1.326-.654-1.531-.729-.206-.075-.355-.112-.505.112-.149.224-.579.729-.71.879-.13.149-.261.168-.485.056-.224-.112-.947-.349-1.804-1.113-.667-.595-1.117-1.329-1.248-1.554-.13-.224-.014-.345.098-.457.101-.1.224-.261.336-.392.112-.131.149-.224.224-.374.075-.149.037-.28-.019-.392-.056-.112-.505-1.217-.692-1.666-.181-.435-.366-.376-.504-.383-.13-.007-.28-.008-.429-.008-.15 0-.392.056-.597.28-.206.224-.785.767-.785 1.871 0 1.104.804 2.17.916 2.32.112.149 1.581 2.415 3.832 3.387 1.336.577 1.855.557 2.531.458.747-.108 1.326-.542 1.513-1.066.187-.524.187-.973.131-1.067-.056-.094-.206-.149-.43-.261Z"/>
            </svg>
        </a>`;
    }
    
    socialContainer.innerHTML = html;

    // 4. Floating Widget Logic (NEW)
    const floatBtn = document.getElementById('floating-wa-btn');
    if(BRAND_DATA.whatsapp) {
        floatBtn.href = BRAND_DATA.whatsapp;
        floatBtn.classList.remove('hidden');
    } else {
        floatBtn.classList.add('hidden');
    }
}

// === DYNAMIC FAVICON GENERATOR ===
function updateFavicon() {
    const link = document.getElementById('dynamic-favicon') || document.createElement('link');
    link.id = 'dynamic-favicon';
    link.rel = 'icon';
    // Generate a tiny version (64x64) of the logo
    link.href = generateLuxuryInitials(BRAND_DATA.name, 64);
    document.head.appendChild(link);
}

/* --- 2. HTML SECTION LOADER --- */
async function loadImagesAndHTML() {
    let manifest = {};
    try { const res = await fetch('manifest.json'); manifest = await res.json(); } catch(e) {}

    const htmlFiles = ['about', 'how_to_order', 'vendor_access', 'testimonials', 'delivery_proof', 'payment_proof'];

    for (const file of htmlFiles) {
        try {
            const res = await fetch(`sections/${file}.html`);
            const html = await res.text();
            
            const el = document.getElementById(`${file}-section`);
            if(el) {
                el.innerHTML = html;
                
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
    
    // Correctly mapping keys to Manifest arrays
    if(key === 'testimonials') { images = manifest.testimonials; path = 'assets/testimonials/'; }
    if(key === 'delivery_proof') { images = manifest.delivery_proofs; path = 'assets/delivery_proofs/'; }
    if(key === 'payment_proof') { images = manifest.payment_proofs; path = 'assets/payment_proofs/'; }

    // Logic: Look for ID matching the key + "-track"
    const track = document.getElementById(`${key}-track`);
    
    if(track && images.length > 0) {
        const fullList = [...images, ...images, ...images]; 
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
    const rows = DB.collections.slice(1); 
    const grid = document.querySelector('.carousel-container');
    
    let html = '';
    rows.slice(0, 6).forEach(r => {
        if(!r[0]) return;
        const img = r[1] ? `assets/collections/${r[1].trim()}` : 'assets/placeholder.jpg';
        const link = r[2] ? r[2] : null; 
        const clickAction = link ? `window.open('${link}', '_blank')` : 'toggleCollectionModal(true)';
        
        html += `
        <div class="product-card" onclick="${clickAction}">
            <img src="${img}" loading="lazy" class="product-img">
            <div class="product-overlay"><div class="product-name">${r[0]}</div></div>
        </div>`;
    });
    grid.innerHTML = html;
}

// LOGO GENERATOR (Resizes based on input)
function generateLuxuryInitials(name, size) {
    if(!name) return '';
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    const style = getComputedStyle(document.documentElement);
    const gold = style.getPropertyValue('--gold').trim() || '#D4AF37';
    const bg = style.getPropertyValue('--bg-dark').trim() || '#000000';
    
    // Background
    ctx.fillStyle = bg; ctx.fillRect(0,0,size,size);
    
    // Ring (Scale line width based on size)
    ctx.beginPath(); 
    ctx.arc(size/2, size/2, (size/2)- (size * 0.05), 0, 2*Math.PI);
    ctx.lineWidth = size * 0.04; 
    ctx.strokeStyle = gold; ctx.stroke();
    
    // Text
    ctx.fillStyle = gold; 
    // Scale font size based on canvas size
    ctx.font = `500 ${size * 0.4}px 'Playfair Display', serif`; 
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    
    const initials = name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
    ctx.fillText(initials, size/2, size/2);
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