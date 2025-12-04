document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

let APP_CONFIG = {};
let COLLECTION_DATA = []; 

async function initApp() {
    // 1. Get Config
    try {
        const configRes = await fetch('config.json');
        if (!configRes.ok) throw new Error("Config missing");
        APP_CONFIG = await configRes.json();
    } catch (e) { console.error("⚠️ Config load failed", e); return; }

    // 2. Load Assets & Theme
    await Promise.all([
        loadTheme(APP_CONFIG.theme_csv),
        loadImagesAndHTML()
    ]);

    // 3. Load Data & Initialize Icons
    await loadSocialLinks(APP_CONFIG.links_csv);
    await loadCollections(APP_CONFIG.collections_csv);
    
    // Initialize Lucide Icons after content is loaded
    setTimeout(() => {
        lucide.createIcons();
    }, 500);
}

/* --- THEME ENGINE (Updated for Gradients) --- */
// CSV Expected: [ID, BgDarkHex, GradientHex, GoldHex, LightGoldHex]
async function loadTheme(csvUrl) {
    if(!csvUrl) return;
    const rows = await fetchCSV(csvUrl);
    if(rows.length < 2) return;

    const randomIndex = Math.floor(Math.random() * (rows.length - 1)) + 1;
    const theme = rows[randomIndex];

    if(theme && theme.length >= 4) {
        const root = document.documentElement;
        // Update CSS variables based on new CSV structure expectation
        root.style.setProperty('--bg-dark', theme[1].trim());
        root.style.setProperty('--bg-gradient', theme[2].trim());
        root.style.setProperty('--gold', theme[3].trim());
        // Optional light gold if it exists in CSV column 4
        if(theme[4]) root.style.setProperty('--gold-light', theme[4].trim());
    }
}

/* --- SOCIAL LINKS (Updated for Lucide Icons) --- */
async function loadSocialLinks(csvUrl) {
    if(!csvUrl) return;
    const rows = await fetchCSV(csvUrl);
    
    const container = document.querySelector('#hero-section .social-row');
    if(container) {
        let html = '';
        // Skip header. CSV: [Key, Label, URL, IconName(e.g. 'instagram')]
        for(let i=1; i<rows.length; i++) {
            const row = rows[i];
            if(row[2] && row[3]) {
                const iconName = row[3].trim().toLowerCase();
                let iconHtml = `<i data-lucide="${iconName}"></i>`;
                
                // Special handling for TikTok if you want the specific SVG from mockup
                if(iconName === 'tiktok') {
                     iconHtml = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v6.14c0 3.48-2.32 6.66-5.83 7.57-4.14 1.05-8.31-1.76-8.91-5.78-.6-4.05 2.27-7.79 6.32-8.39.26-.04.52-.07.78-.08v4.18c-.8.02-1.6.21-2.29.58-1.95 1.05-2.74 3.47-1.8 5.53.94 2.06 3.44 3 5.56 2.15 1.6-.64 2.65-2.2 2.63-3.92V.02h-.54z"/></svg>`;
                }

                html += `<a href="${row[2]}" target="_blank" class="social-icon" aria-label="${row[1]}">
                            ${iconHtml}
                         </a>`;
            }
        }
        container.innerHTML = html;
    }
}

/* --- COLLECTIONS (Updated Card Style) --- */
async function loadCollections(csvUrl) {
    if(!csvUrl) return;
    const rows = await fetchCSV(csvUrl);
    COLLECTION_DATA = rows.slice(1).map(r => ({ name: r[0], img: r[1], link: r[2] })).filter(i => i.name);

    const grid = document.querySelector('.carousel-container');
    if(grid) {
        let html = '';
        // Show top 6 in carousel
        COLLECTION_DATA.slice(0, 6).forEach(item => { html += createCollectionCard(item); });
        grid.innerHTML = html;
    }
}

function createCollectionCard(item) {
    const imgPath = item.img ? `assets/collections/${item.img.trim()}` : 'assets/placeholder.jpg';
    const linkUrl = item.link ? item.link : '#';
    return `
        <a href="${linkUrl}" target="_blank" class="product-card">
            <img src="${imgPath}" loading="lazy" alt="${item.name}" class="product-img">
            <div class="product-overlay"><div class="product-name">${item.name}</div></div>
        </a>
    `;
}

/* --- IMAGES & HTML LOADER --- */
async function loadImagesAndHTML() {
    let manifest = {};
    try { const res = await fetch('manifest.json'); manifest = await res.json(); } catch(e) {}

    const sections = ['header', 'hero', 'about', 'how_to_order', 'collections', 'testimonials', 'vendor_access', 'delivery_proof', 'payment_proof'];
    
    for (const section of sections) {
        try {
            const res = await fetch(`sections/${section}.html`);
            const html = await res.text();
            document.getElementById(`${section}-section`).innerHTML = html;
            
            // Inject Images based on section
            if(section === 'header' && manifest.profile_images) {
                const randomImg = manifest.profile_images[Math.floor(Math.random() * manifest.profile_images.length)];
                document.querySelector('.profile-img').src = `assets/profile/${randomImg}`;
            }
            if(section === 'testimonials') populateMarquee('testimonials-track', manifest.testimonials, 'assets/testimonials/');
            if(section === 'delivery_proof') populateMarquee('delivery-track', manifest.delivery_proofs, 'assets/delivery_proofs/');
            if(section === 'payment_proof') populateMarquee('payment-track', manifest.payment_proofs, 'assets/payment_proofs/');
        } catch(e) {}
    }
}

function populateMarquee(elementId, images, basePath) {
    const track = document.getElementById(elementId);
    if(!track || !images || images.length === 0) return;
    let html = '';
    images.forEach(img => {
        html += `<div class="marquee-item"><img src="${basePath}${img}" onclick="openZoom(this.src)" loading="lazy"></div>`;
    });
    // Duplicate twice for smoother infinite scroll
    track.innerHTML = html + html + html; 
}

/* --- MODALS --- */
function toggleCollectionModal(show) {
    const modal = document.getElementById('collection-modal');
    const grid = document.getElementById('modal-grid-container');
    if(show) {
        let html = '';
        COLLECTION_DATA.forEach(item => html += createCollectionCard(item));
        grid.innerHTML = html;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
         lucide.createIcons(); // Refresh icons in modal
    } else {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

function openZoom(src) {
    document.getElementById('image-zoom-modal').classList.remove('hidden');
    document.getElementById('img01').src = src;
}
function closeZoom() { document.getElementById('image-zoom-modal').classList.add('hidden'); }

async function fetchCSV(url) {
    try {
        const res = await fetch(url); const text = await res.text();
        return text.split('\n').map(row => row.split(',')).filter(r => r.length > 1);
    } catch(e) { return []; }
}