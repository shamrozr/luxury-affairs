document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

let DB = { brands: [], themes: [], collections: [] }; // Initialized to prevent undefined errors
let BRAND_DATA = {}; 
let AUTO_SCROLL_INTERVALS = [];

async function initApp() {
    // 1. Fetch Local Database (Created by build.js)
    try {
        const res = await fetch('db.json');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        DB = await res.json();
    } catch (e) { 
        console.error("DB Load Error", e); 
        // Fallback or exit if critical data is missing
        return; 
    }

    // 2. Identify Brand from URL
    const path = window.location.pathname.replace(/^\/|\/$/g, ''); 
    const brandID = path || 'default'; 

    // 3. Process Data
    loadBrandData(brandID);
    loadCollections();
    
    // 4. Load Images & HTML & Videos
    await loadImagesAndHTML();
    
    // 5. Initialize Icons & Auto Scroll
    // Using a slightly longer timeout to ensure DOM is ready
    setTimeout(() => { 
        if(window.lucide) lucide.createIcons(); 
        
        // Load videos randomly
        loadPromoVideos(); 
        
        // Start the robust animation loop
        startSmartAutoScroll();
    }, 800);
}

/* --- 1. BRAND DATA & THEME --- */
function loadBrandData(brandID) {
    if (!DB.brands) return;
    const rows = DB.brands;
    
    // Logic: URL Match -> Default -> First Row
    let brandRow = rows.find(r => r[0] && r[0].trim() === brandID);
    if (!brandRow) brandRow = rows.find(r => r[0] && r[0].trim() === 'default');
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
        updateFavicon();
    }
}

function applyTheme(index) {
    if (!DB.themes) return;
    const theme = DB.themes.find(r => r[0] && r[0].trim() == index);
    if(theme) {
        const root = document.documentElement;
        if(theme[1]) root.style.setProperty('--bg-dark', theme[1].trim());
        if(theme[2]) root.style.setProperty('--bg-gradient', theme[2].trim());
        if(theme[3]) root.style.setProperty('--gold', theme[3].trim());
        if(theme[4]) root.style.setProperty('--gold-light', theme[4].trim());
    }
}

function updateUI() {
    const imgEl = document.querySelector('.profile-img');
    if(imgEl) {
        if(BRAND_DATA.img && BRAND_DATA.img.length > 4) {
            imgEl.src = `assets/profile/${BRAND_DATA.img}`;
        } else {
            imgEl.src = generateLuxuryInitials(BRAND_DATA.name, 300);
        }
    }

    const nameEl = document.querySelector('.brand-name');
    if (nameEl) nameEl.textContent = BRAND_DATA.name || 'Luxury Store';
    
    const tagEl = document.querySelector('.tagline');
    if (tagEl) tagEl.textContent = BRAND_DATA.tagline || '';
    
    document.title = `${BRAND_DATA.name || 'Store'} | Luxury Affairs`;

    const socialContainer = document.querySelector('.social-row');
    if (socialContainer) {
        let html = '';
        if(BRAND_DATA.insta) {
            html += `<a href="${BRAND_DATA.insta}" target="_blank" class="social-icon"><i data-lucide="instagram"></i></a>`;
        }
        if(BRAND_DATA.tiktok) {
            html += `<a href="${BRAND_DATA.tiktok}" target="_blank" class="social-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v6.14c0 3.48-2.32 6.66-5.83 7.57-4.14 1.05-8.31-1.76-8.91-5.78-.6-4.05 2.27-7.79 6.32-8.39.26-.04.52-.07.78-.08v4.18c-.8.02-1.6.21-2.29.58-1.95 1.05-2.74 3.47-1.8 5.53.94 2.06 3.44 3 5.56 2.15 1.6-.64 2.65-2.2 2.63-3.92V.02h-.54z"/></svg></a>`;
        }
        if(BRAND_DATA.whatsapp) {
            html += `<a href="${BRAND_DATA.whatsapp}" target="_blank" class="social-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M18.403 5.633A8.919 8.919 0 0 0 12.053 3c-4.948 0-8.976 4.027-8.978 8.977 0 1.582.413 3.126 1.198 4.488L3.3 21.7l5.384-1.412a8.951 8.951 0 0 0 4.369 1.141h.004c4.948 0 8.975-4.026 8.977-8.976a8.91 8.91 0 0 0-3.631-6.82ZM12.054 19.92h-.003c-1.468 0-2.906-.395-4.16-1.14l-.299-.177-3.091.811.825-3.013-.194-.309a7.472 7.472 0 0 1-1.146-3.987c.002-4.12 3.354-7.473 7.478-7.473 1.998 0 3.876.779 5.289 2.193a7.447 7.447 0 0 1 2.19 5.291c-.002 4.12-3.356 7.473-7.483 7.473Zm4.093-5.603c-.224-.112-1.326-.654-1.531-.729-.206-.075-.355-.112-.505.112-.149.224-.579.729-.71.879-.13.149-.261.168-.485.056-.224-.112-.947-.349-1.804-1.113-.667-.595-1.117-1.329-1.248-1.554-.13-.224-.014-.345.098-.457.101-.1.224-.261.336-.392.112-.131.149-.224.224-.374.075-.149.037-.28-.019-.392-.056-.112-.505-1.217-.692-1.666-.181-.435-.366-.376-.504-.383-.13-.007-.28-.008-.429-.008-.15 0-.392.056-.597.28-.206.224-.785.767-.785 1.871 0 1.104.804 2.17.916 2.32.112.149 1.581 2.415 3.832 3.387 1.336.577 1.855.557 2.531.458.747-.108 1.326-.542 1.513-1.066.187-.524.187-.973.131-1.067-.056-.094-.206-.149-.43-.261Z"/></svg></a>`;
        }
        socialContainer.innerHTML = html;
    }

    const floatBtn = document.getElementById('floating-wa-btn');
    if (floatBtn) {
        if(BRAND_DATA.whatsapp) {
            floatBtn.href = BRAND_DATA.whatsapp;
            floatBtn.classList.remove('hidden');
        } else {
            floatBtn.classList.add('hidden');
        }
    }
}

function updateFavicon() {
    const link = document.getElementById('dynamic-favicon') || document.createElement('link');
    link.id = 'dynamic-favicon'; link.rel = 'icon';
    link.href = generateLuxuryInitials(BRAND_DATA.name, 64);
    if (!document.getElementById('dynamic-favicon')) document.head.appendChild(link);
}

// === THE SIGNATURE KNOT LOGO GENERATOR ===
function generateLuxuryInitials(name, size) {
    if(!name) return '';
    const canvas = document.createElement('canvas');
    canvas.width = size; 
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const style = getComputedStyle(document.documentElement);
    const gold = style.getPropertyValue('--gold').trim() || '#D4AF37';
    const goldLight = style.getPropertyValue('--gold-light').trim() || '#F2D574';
    const bgDark = style.getPropertyValue('--bg-dark').trim() || '#050a06';

    const cx = size / 2;
    const cy = size / 2;
    
    const bgGradient = ctx.createRadialGradient(cx, cy, size * 0.03, cx, cy, size * 0.7);
    bgGradient.addColorStop(0, bgDark);    
    bgGradient.addColorStop(1, "#000000"); 
    
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, size, size);

    const textGradient = ctx.createLinearGradient(0, 0, size, size);
    textGradient.addColorStop(0, gold);
    textGradient.addColorStop(0.5, goldLight);
    textGradient.addColorStop(1, gold);
    ctx.fillStyle = textGradient;

    ctx.font = `italic 700 ${size * 0.53}px 'Playfair Display', serif`; 
    ctx.textAlign = "center"; 
    ctx.textBaseline = "middle";
    
    const initials = name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
    const char1 = initials[0] || '';
    const char2 = initials[1] || '';

    ctx.globalAlpha = 1.0;
    ctx.fillText(char1, cx - (size * 0.12), cy); 

    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = size * 0.06;
    ctx.shadowOffsetX = -(size * 0.02);
    ctx.fillText(char2, cx + (size * 0.12), cy); 
    
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;

    ctx.strokeStyle = textGradient;
    ctx.lineWidth = size * 0.015; 
    ctx.lineCap = "round";
    
    ctx.beginPath();
    ctx.moveTo(cx - (size * 0.27), cy + (size * 0.23)); 
    ctx.quadraticCurveTo(
        cx, cy + (size * 0.3),                 
        cx + (size * 0.27), cy + (size * 0.2)  
    );
    ctx.stroke();

    return canvas.toDataURL();
}

/* --- 2. SECTION HTML LOADER --- */
async function loadImagesAndHTML() {
    let manifest = { testimonials: [], delivery_proofs: [], payment_proofs: [], videos: [] };
    try { 
        const res = await fetch('manifest.json'); 
        if (res.ok) manifest = await res.json(); 
    } catch(e) { console.warn("Manifest load failed, defaulting empty"); }

    const htmlFiles = ['about', 'how_to_order', 'vendor_access', 'testimonials', 'delivery_proof', 'payment_proof'];

    for (const file of htmlFiles) {
        try {
            const res = await fetch(`sections/${file}.html`);
            if (!res.ok) continue;
            const html = await res.text();
            
            const el = document.getElementById(`${file}-section`);
            if(el) {
                el.innerHTML = html;
                
                if(file === 'about') {
                     const h2 = document.querySelector('#about-section h2');
                     if(h2) h2.innerText = `About ${BRAND_DATA.name || 'Us'}`;
                     const p = document.querySelector('#about-section p');
                     if(p) p.innerText = BRAND_DATA.about || '';
                }
                if(file === 'vendor_access') {
                    const vendorLink = document.querySelector('#vendor_access-section a');
                    if(BRAND_DATA.vendor && vendorLink) vendorLink.href = BRAND_DATA.vendor;
                }
                if(['testimonials', 'delivery_proof', 'payment_proof'].includes(file)) {
                    loadMarqueeImages(file, manifest);
                }
            }
        } catch(e) { console.error(`Failed to load ${file}`, e); }
    }
}

/* --- 3. CAROUSEL & SORTING --- */
function loadMarqueeImages(key, manifest) {
    let files = [];
    let path = '';
    
    if(key === 'testimonials') { files = manifest.testimonials; path = 'assets/testimonials/'; }
    if(key === 'delivery_proof') { files = manifest.delivery_proofs; path = 'assets/delivery_proofs/'; }
    if(key === 'payment_proof') { files = manifest.payment_proofs; path = 'assets/payment_proofs/'; }

    if (!files) return;

    if(files.length > 0) {
        files.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    }

    let trackID = `${key}-track`; 
    if(!document.getElementById(trackID)) trackID = `${key.split('_')[0]}-track`; 
    const track = document.getElementById(trackID);
    
    if(track && files.length > 0) {
        track.classList.add('auto-scroll-track');
        
        let html = '';
        files.forEach((file, idx) => {
             const isVideo = file.match(/\.(mp4|mov|webm)$/i);
             const mediaPath = path + file;
             // Ensure paths are correct relative to index.html
             let innerContent = isVideo ? 
                 `<video src="${mediaPath}#t=0.1" preload="metadata" muted playsinline></video><div class="play-icon-overlay"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg></div>` : 
                 `<img src="${mediaPath}" loading="lazy">`;

             html += `<div class="marquee-item" onclick="openZoom('${mediaPath}', ${idx}, '${key}', ${isVideo ? 'true' : 'false'})">${innerContent}</div>`;
        });
        track.innerHTML = html;
        
        if(!window.GALLERY_DATA) window.GALLERY_DATA = {};
        window.GALLERY_DATA[key] = files.map(f => ({ path: path + f, type: f.match(/\.(mp4|mov|webm)$/i) ? 'video' : 'image' }));
    }
}

function loadCollections() {
    if (!DB.collections) return;
    const rows = DB.collections.slice(1); 
    const grid = document.querySelector('.carousel-container');
    
    if (!grid) return;

    rows.sort((a, b) => (a[0] || '').localeCompare(b[0] || ''));

    let html = '';
    rows.slice(0, 8).forEach(r => {
        if(!r[0]) return;
        const img = r[1] ? `assets/collections/${r[1].trim()}` : 'assets/placeholder.jpg';
        const link = r[2] ? r[2] : null; 
        const clickAction = link ? `window.open('${link}', '_blank')` : 'toggleCollectionModal(true)';
        
        html += `<div class="product-card" onclick="${clickAction}"><img src="${img}" loading="lazy" class="product-img"><div class="product-overlay"><div class="product-name">${r[0]}</div></div></div>`;
    });
    grid.innerHTML = html;
    grid.classList.add('auto-scroll-track');
}

/* --- 4. ROBUST FRAME-BASED SCROLL ENGINE --- */
function startSmartAutoScroll() {
    const tracks = document.querySelectorAll('.auto-scroll-track');
    
    tracks.forEach(track => {
        let isPaused = false;
        let isVisible = false; // Visibility Optimization
        let speed = 0.5; // Pixels per frame

        // 1. Pause on Hover/Touch
        track.addEventListener('mouseenter', () => isPaused = true);
        track.addEventListener('mouseleave', () => isPaused = false);
        track.addEventListener('touchstart', () => isPaused = true, { passive: true });
        track.addEventListener('touchend', () => setTimeout(() => isPaused = false, 2000));

        // 2. Visibility Check (Saves Battery)
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => { isVisible = entry.isIntersecting; });
        }, { threshold: 0 });
        observer.observe(track);

        // 3. Animation Loop (60fps)
        function animate() {
            // Only scroll if:
            // a) Content is wide enough to scroll
            // b) User is not touching/hovering
            // c) Section is actually visible on screen
            if (track.scrollWidth > track.clientWidth && !isPaused && isVisible) {
                
                // If we hit the end, loop back instantly
                if (track.scrollLeft >= (track.scrollWidth - track.clientWidth - 1)) {
                    track.scrollLeft = 0;
                } else {
                    track.scrollLeft += speed;
                }
            }
            requestAnimationFrame(animate);
        }
        
        // Start the engine
        animate();
    });
}

/* --- 5. RANDOM VIDEO SECTIONS --- */
async function loadPromoVideos() {
    let manifest = {};
    try { 
        const res = await fetch('manifest.json'); 
        if (res.ok) manifest = await res.json(); 
    } catch(e) { console.error("Manifest Error", e); return; }

    const videos = manifest.videos || [];
    if (videos.length < 1) return;

    const shuffled = videos.sort(() => 0.5 - Math.random());
    const video1 = shuffled[0];
    const video2 = shuffled[1] || shuffled[0]; 

    if(video1) renderVideoCard('promo-video-1', `assets/videos/${video1}`);
    if(video2 && videos.length > 1) renderVideoCard('promo-video-2', `assets/videos/${video2}`);
    
    initVideoObserver();
}

function renderVideoCard(targetId, src) {
    const container = document.getElementById(targetId);
    if (!container) return;

    container.innerHTML = `
        <div class="glass-card video-card">
            <video src="${src}" class="promo-video" muted playsinline loop preload="metadata"></video>
            <div class="video-hint-overlay">
                <i data-lucide="maximize-2" style="width:12px; height:12px;"></i> Tap to Expand
            </div>
        </div>
    `;

    const videoEl = container.querySelector('video');
    if (videoEl) {
        videoEl.addEventListener('click', () => {
            if (videoEl.requestFullscreen) {
                videoEl.requestFullscreen();
            } else if (videoEl.webkitRequestFullscreen) { 
                videoEl.webkitRequestFullscreen();
            } else if (videoEl.msRequestFullscreen) { 
                videoEl.msRequestFullscreen();
            }
            videoEl.muted = false;
        });
    }

    document.addEventListener("fullscreenchange", () => {
        if (!document.fullscreenElement && videoEl) videoEl.muted = true;
    });
}

function initVideoObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                video.play().catch(e => {}); // Autoplay might be blocked, prevent console error spam
            } else {
                video.pause();
            }
        });
    }, { threshold: 0.5 }); 

    const videos = document.querySelectorAll('.promo-video');
    videos.forEach(v => observer.observe(v));
    
    if(window.lucide) lucide.createIcons();
}

/* --- 6. MODALS --- */
function toggleCollectionModal(show) {
    const modal = document.getElementById('collection-modal');
    const grid = document.getElementById('modal-grid-container');
    if (!modal || !grid) return;

    if(show) {
        let html = '';
        if (DB.collections) {
            DB.collections.slice(1).forEach(r => {
                 if(!r[0]) return;
                 const img = r[1] ? `assets/collections/${r[1].trim()}` : 'assets/placeholder.jpg';
                 const link = r[2] || '#';
                 html += `<a href="${link}" target="_blank" class="product-card"><img src="${img}" class="product-img"><div class="product-overlay"><div class="product-name">${r[0]}</div></div></a>`;
            });
        }
        grid.innerHTML = html;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

let curGallery = [];
let curIdx = 0;

function openZoom(path, index, key, isVideo) {
    const modal = document.getElementById('image-zoom-modal');
    if (!window.GALLERY_DATA || !window.GALLERY_DATA[key]) return;
    
    curGallery = window.GALLERY_DATA[key];
    curIdx = index;
    renderModalContent();
    if(modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function renderModalContent() {
    if (!curGallery || curGallery.length === 0) return;
    const item = curGallery[curIdx];
    const imgEl = document.getElementById('img01');
    const existingVideo = document.getElementById('modal-active-video');
    
    if(existingVideo) existingVideo.remove();

    if(item.type === 'video') {
        if(imgEl) imgEl.style.display = 'none';
        const video = document.createElement('video');
        video.id = 'modal-active-video';
        video.src = item.path;
        video.controls = true;
        video.autoplay = true;
        video.className = 'modal-zoomed-video';
        if(imgEl) imgEl.parentNode.insertBefore(video, imgEl);
    } else {
        if(imgEl) {
            imgEl.style.display = 'block';
            imgEl.src = item.path;
        }
    }
}

function navZoom(d) {
    curIdx += d;
    if(curIdx < 0) curIdx = curGallery.length - 1;
    if(curIdx >= curGallery.length) curIdx = 0;
    renderModalContent();
}

function closeZoom() {
    const modal = document.getElementById('image-zoom-modal');
    if(modal) modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    const existingVideo = document.getElementById('modal-active-video');
    if(existingVideo) existingVideo.remove();
}