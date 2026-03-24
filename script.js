// [REF-JS-STATE] 
let restaurants = JSON.parse(localStorage.getItem('wishlistRistoranti_Premium')) || [];
let editingId = null;
let piattoRowCounter = 0; 
let userLat = null;
let userLng = null;
let tickerInterval = null;

// [REF-JS-DOM]
const form = document.getElementById('restaurant-form');
const listContainer = document.getElementById('restaurant-list');
const dietPicker = document.getElementById('diet-picker');
const editDietPicker = document.getElementById('edit-diet-picker');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');

// [REF-JS-STORAGE & AUTOSAVE]
function saveToLocal() { localStorage.setItem('wishlistRistoranti_Premium', JSON.stringify(restaurants)); }

window.addEventListener('beforeunload', saveToLocal);
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveToLocal();
});

document.getElementById('btn-export').addEventListener('click', () => {
    if (restaurants.length === 0) return alert("Nessun dato da salvare!");
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(restaurants));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `TasteList_Backup_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
});

document.getElementById('import-file').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            if (Array.isArray(importedData)) {
                restaurants = importedData;
                saveToLocal();
                renderList();
                alert("Collezione importata con successo! 🎉");
            } else alert("Formato non valido.");
        } catch (err) { alert("Errore di lettura."); }
    };
    reader.readAsText(file);
    e.target.value = '';
});

// [REF-JS-DIET]
function setupDietPicker(picker) {
    const buttons = picker.querySelectorAll('.diet-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            picker.setAttribute('data-diet', btn.getAttribute('data-val'));
        });
    });
}
setupDietPicker(dietPicker);
setupDietPicker(editDietPicker);

// [REF-JS-CUSTOM-RATING]
function setupCustomRating(id) {
    const container = document.getElementById(id);
    if(!container) return;
    const items = container.querySelectorAll('span');
    items.forEach(item => {
        item.addEventListener('click', () => {
            const currentVal = container.getAttribute('data-rating');
            const clickedVal = item.getAttribute('data-val');
            
            if (currentVal === clickedVal) {
                setRatingUI(container, 0);
            } else {
                setRatingUI(container, clickedVal);
            }
        });
    });
}
function setRatingUI(container, rating) {
    container.setAttribute('data-rating', rating);
    const items = container.querySelectorAll('span');
    items.forEach(st => st.classList.toggle('active', st.getAttribute('data-val') <= rating));
}

['stars-general', 'beans-crema', 'cookie-savoiardo', 'beans-caffe', 'cakes-tiramisu', 
 'pizza-impasto', 'pizza-ingredienti', 'pizza-voto',
 'edit-stars-general', 'edit-beans-crema', 'edit-cookie-savoiardo', 'edit-beans-caffe', 'edit-cakes-tiramisu',
 'edit-pizza-impasto', 'edit-pizza-ingredienti', 'edit-pizza-voto'].forEach(setupCustomRating);

// [REF-JS-DYNAMIC-PIATTI-FORTi]
function addPiattoForteRow(containerId, initialData = null) {
    piattoRowCounter++;
    const container = document.getElementById(containerId);
    const row = document.createElement('div');
    row.className = 'piatto-row';
    row.style.marginBottom = '12px';
    row.style.paddingBottom = '12px';
    row.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
    
    const ratingId = `pf-rating-${piattoRowCounter}`;
    
    row.innerHTML = `
        <div class="form-row mb-compact">
            <div class="input-group" style="flex: 2; margin-bottom: 0;">
                <input type="text" class="pf-nome glass-input" placeholder="Nome piatto..." value="${initialData ? (initialData.nome || '') : ''}">
            </div>
            <div class="input-group" style="flex: 1; margin-bottom: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.2); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                <div class="custom-rating interactive pf-voto" id="${ratingId}" data-rating="${initialData ? (initialData.voto || 0) : 0}">
                    <span data-val="1">🏆</span><span data-val="2">🏆</span><span data-val="3">🏆</span><span data-val="4">🏆</span><span data-val="5">🏆</span>
                </div>
            </div>
            <button type="button" class="btn-delete-row" onclick="this.closest('.piatto-row').remove()" style="margin: auto 0; margin-left: 8px;">✖</button>
        </div>
        <textarea class="pf-note glass-input" rows="1" placeholder="Note...">${initialData ? (initialData.note || '') : ''}</textarea>
    `;
    
    container.appendChild(row);
    setupCustomRating(ratingId);
    if (initialData && initialData.voto > 0) {
        setRatingUI(document.getElementById(ratingId), initialData.voto);
    }
}

function getPiattiFortiData(containerId) {
    const container = document.getElementById(containerId);
    const rows = container.querySelectorAll('.piatto-row');
    const data = [];
    rows.forEach(row => {
        const nome = row.querySelector('.pf-nome').value.trim();
        const voto = parseInt(row.querySelector('.pf-voto').getAttribute('data-rating')) || 0;
        const note = row.querySelector('.pf-note').value.trim();
        if (nome || voto > 0 || note) {
            data.push({ nome, voto, note });
        }
    });
    return data;
}

document.getElementById('btn-add-piatto').addEventListener('click', () => addPiattoForteRow('piatti-forti-container'));
document.getElementById('edit-btn-add-piatto').addEventListener('click', () => addPiattoForteRow('edit-piatti-forti-container'));

// [REF-JS-TIPOLOGIA-CUSTOM] 
function handleTipologia(selectId, customId) {
    const select = document.getElementById(selectId);
    const custom = document.getElementById(customId);
    select.addEventListener('change', () => {
        if (select.value === 'Altro') {
            custom.classList.remove('hidden');
            custom.required = true;
        } else {
            custom.classList.add('hidden');
            custom.required = false;
        }
    });
}
handleTipologia('tipologia', 'tipologia-custom');
handleTipologia('edit-tipologia', 'edit-tipologia-custom');

// [REF-JS-GPS]
window.captureGPS = function(btn, inputId, latId, lngId) {
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳';
    navigator.geolocation.getCurrentPosition(
        pos => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            document.getElementById(latId).value = lat;
            document.getElementById(lngId).value = lng;
            document.getElementById(inputId).value = `https://maps.google.com/?q=${lat},${lng}`;
            btn.innerHTML = '✅';
            setTimeout(() => btn.innerHTML = originalText, 2000);
        },
        err => {
            alert("Impossibile ottenere la posizione. Controlla i permessi del browser.");
            btn.innerHTML = originalText;
        }
    );
};

// [REF-JS-RENDER-FILTERS]
const filterStato = document.getElementById('filter-stato');
const filterTipologia = document.getElementById('filter-tipologia');
const filterDegustazione = document.getElementById('filter-degustazione');
const sortList = document.getElementById('sort-list');

filterStato.addEventListener('change', renderList);
filterTipologia.addEventListener('change', renderList);
filterDegustazione.addEventListener('change', renderList);

sortList.addEventListener('change', function(e) {
    if (e.target.value === 'Distanza') {
        if (!userLat) {
            showToast("📍 Rilevamento posizione...");
            navigator.geolocation.getCurrentPosition(
                pos => {
                    userLat = pos.coords.latitude;
                    userLng = pos.coords.longitude;
                    showToast("✅ Posizione trovata!");
                    renderList();
                },
                err => {
                    alert("Impossibile ottenere la posizione. Impossibile ordinare per distanza.");
                    e.target.value = 'Recenti';
                    renderList();
                }
            );
            return;
        }
    }
    renderList();
});

// Calcolo distanza Haversine (km)
function getDistance(lat1, lon1, lat2, lng2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// SVG Icons per i contatti
const iconWeb = `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
const iconIg = `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`;
const iconTel = `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`;
const iconMaps = `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
const iconShare = `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>`;

// [REF-JS-DASHBOARD] - Utilizzo dello spazio "forzato" per evitare l'errore grafico
function startDashboardTicker() {
    const ticker = document.getElementById('ticker-content');
    if(!ticker) return;

    const total = restaurants.length;
    const visitati = restaurants.filter(r => r.stato === 'Visitato' || r.stato === 'Preferito').length;
    const preferiti = restaurants.filter(r => r.stato === 'Preferito').length;
    const pizze = restaurants.filter(r => r.pizzaVoto > 0).length;
    const tiramisu = restaurants.filter(r => r.ratingTiramisu > 0).length;
    
    let avgRating = 0;
    const rated = restaurants.filter(r => r.ratingRistorante > 0);
    if (rated.length > 0) {
        avgRating = (rated.reduce((sum, r) => sum + r.ratingRistorante, 0) / rated.length).toFixed(1);
    }

    const stats = [
        `📊 Hai salvato <strong style="margin: 0 4px;">${total}</strong> ${total === 1 ? 'locale' : 'locali'} in totale`,
        `😋 Ne hai già visitati <strong style="margin: 0 4px;">${visitati}</strong>`,
        `❤️ Hai <strong style="margin: 0 4px;">${preferiti}</strong> ${preferiti === 1 ? 'locale' : 'locali'} nei preferiti`,
        `⭐ Voto medio dei tuoi assaggi: <strong style="margin: 0 4px;">${avgRating}</strong>`,
        `🍕 Hai recensito <strong style="margin: 0 4px;">${pizze}</strong> ${pizze === 1 ? 'pizza' : 'pizze'}`,
        `🍰 Hai degustato <strong style="margin: 0 4px;">${tiramisu}</strong> tiramisù`
    ];

    ticker.innerHTML = stats.map((s, i) => `<div class="ticker-item ${i===0?'active':''}">${s}</div>`).join('');

    if (tickerInterval) clearInterval(tickerInterval);
    
    let currentIndex = 0;
    const items = ticker.querySelectorAll('.ticker-item');
    if(items.length <= 1) return;

    tickerInterval = setInterval(() => {
        items[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % items.length;
        items[currentIndex].classList.add('active');
    }, 3500);
}

window.updateListRating = function(id, val) {
    const r = restaurants.find(res => res.id === id);
    if (r) {
        if (r.ratingRistorante == val) r.ratingRistorante = 0; 
        else r.ratingRistorante = parseInt(val);
        saveToLocal();
        renderList();
    }
};

function renderList() {
    const fStato = filterStato.value;
    const fTipo = filterTipologia.value;
    const fDegu = filterDegustazione.value;
    const sList = sortList.value;

    let filtered = restaurants.filter(r => {
        let matchStato = fStato === 'Tutti' || r.stato === fStato;
        let matchTipo = fTipo === 'Tutte' || r.tipologia === fTipo;
        
        if (fTipo === 'Altro') {
            const standardTypes = ["Pizzeria", "Trattoria", "Giapponese", "Cinese", "Indiano", "Thailandese", "Libanese", "Drink&Pub", "Colazione", "Brunch"];
            matchTipo = !standardTypes.includes(r.tipologia);
        }

        let matchDegu = true;
        if (fDegu === 'Tiramisu') matchDegu = r.ratingTiramisu > 0 || r.tiraCremaVote > 0 || r.tiraSavVote > 0 || r.tiraCaffeVote > 0;
        if (fDegu === 'Pizza') matchDegu = r.pizzaVoto > 0 || r.pizzaImpastoVote > 0 || r.pizzaIngVote > 0;
        if (fDegu === 'PiattoForte') {
            const hasArray = r.piattiForti && r.piattiForti.length > 0;
            const hasLegacy = r.piattoForteNome || r.piattoForteVoto > 0;
            matchDegu = hasArray || hasLegacy;
        }

        return matchStato && matchTipo && matchDegu;
    });

    if (sList === 'Alfabetico') {
        filtered.sort((a,b) => a.nome.localeCompare(b.nome));
    } else if (sList === 'Voto') {
        filtered.sort((a,b) => (b.ratingRistorante || 0) - (a.ratingRistorante || 0));
    } else if (sList === 'Distanza' && userLat && userLng) {
        filtered.sort((a,b) => {
            const distA = (a.lat && a.lng) ? getDistance(userLat, userLng, a.lat, a.lng) : Infinity;
            const distB = (b.lat && b.lng) ? getDistance(userLat, userLng, b.lat, b.lng) : Infinity;
            return distA - distB;
        });
    } else {
        filtered.sort((a,b) => b.id - a.id);
    }

    startDashboardTicker();

    listContainer.innerHTML = filtered.length ? '' : '<div style="text-align:center; padding: 3rem 1rem; opacity: 0.5;">📭<br><br>Nessun locale trovato nel diario.</div>';
    
    filtered.forEach((r, index) => {
        let dietIcon = '🍽️';
        if (r.diet === 'Vegano') dietIcon = '🌱';
        else if (r.diet === 'Vegetariano') dietIcon = '🥗';
        else if (r.diet === 'Drink') dietIcon = '🍹';
        
        let domain = "";
        try { if(r.link && !r.link.includes('google.com/search')) domain = new URL(r.link).hostname; } catch(e){}
        let iconHtml = domain ? `<img src="https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=64" alt="Logo">` : `${dietIcon}`;

        // I link si vedono solo se contengono testo (o sono autogenerati all'inserimento). 
        // Se l'utente li cancella nella modifica, diventano "" (falsy) e l'icona scompare!
        let webLink = r.link && r.link.trim() !== "" ? r.link : null;
        let mapsLink = r.maps && r.maps.trim() !== "" ? r.maps : null;
        let telLink = r.telefono && r.telefono.trim() !== "" ? r.telefono : null;
        
        let igLink = null;
        if (r.instagram && r.instagram.trim() !== "") {
            igLink = r.instagram.startsWith('http') ? r.instagram : `https://www.instagram.com/${r.instagram.replace('@', '')}`;
        }

        let statoBadge = '';
        let isPreferito = r.stato === 'Preferito';
        if(r.stato === 'Visitato') statoBadge = '✅ Visitato';
        else if (isPreferito) statoBadge = '❤️ Preferito';
        else statoBadge = '🧐 Da Testare';

        let distanceBadge = '';
        if (sList === 'Distanza' && userLat && userLng && r.lat && r.lng) {
            const d = getDistance(userLat, userLng, r.lat, r.lng);
            distanceBadge = `<span class="badge" style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid #3b82f6;">📍 ${d.toFixed(1)} km</span>`;
        }

        let piattiList = r.piattiForti ? [...r.piattiForti] : [];
        if (r.piattoForteNome || r.piattoForteVoto > 0 || r.piattoForteNote) {
            piattiList.unshift({ nome: r.piattoForteNome, voto: r.piattoForteVoto, note: r.piattoForteNote });
        }

        const hasTiramisu = r.ratingTiramisu > 0 || r.tiraCremaVote > 0 || r.tiraSavVote > 0 || r.tiraCaffeVote > 0 || r.recensioneTiramisu;
        const hasPizza = r.pizzaVoto > 0 || r.pizzaImpastoVote > 0 || r.pizzaIngVote > 0 || r.pizzaRecensione;
        const hasPiattoForte = piattiList.length > 0;
        
        const showDegustazioni = hasTiramisu || hasPizza || hasPiattoForte;

        let staticStarsHtml = '';
        if (r.stato === 'Visitato' || isPreferito) {
            staticStarsHtml += `<div class="static-rating">`;
            for (let i=1; i<=5; i++) {
                let isFilled = i <= (r.ratingRistorante || 0);
                staticStarsHtml += `<span class="${isFilled ? 'active' : ''}">★</span>`;
            }
            staticStarsHtml += `</div>`;
        }

        const card = document.createElement('div');
        card.className = 'restaurant-card';
        card.style.animationDelay = `${index * 0.05}s`;
        card.ondblclick = () => openEditModal(r.id);
        
        card.innerHTML = `
            <div class="card-header" style="display: flex; gap: 12px; align-items: flex-start; margin-bottom: 6px;">
                <div class="card-main-icon" style="width: 42px; height: 42px; font-size: 1.2rem;">${iconHtml}</div>
                <div class="card-title-area" style="flex: 1;">
                    <h3 style="font-size: 1.15rem; margin-bottom: 2px;">${r.nome}</h3>
                    <div class="card-badges" style="display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin-top: 4px;">
                        <span class="badge" style="padding: 2px 6px; font-size: 0.65rem;">${r.tipologia}</span>
                        <span class="badge ghost" style="padding: 2px 6px; font-size: 0.65rem;">${statoBadge}</span>
                        ${distanceBadge}
                        ${staticStarsHtml}
                    </div>
                </div>
                <div class="card-top-actions" style="display: flex; gap: 6px; align-items: center;">
                    <button class="btn-top-action share" onclick="event.stopPropagation(); openShareModal(${r.id})" title="Condividi">${iconShare}</button>
                    <button class="btn-top-action fav ${isPreferito ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(${r.id})" title="${isPreferito ? 'Rimuovi dai Preferiti' : 'Aggiungi ai Preferiti'}">${isPreferito ? '❤️' : '🤍'}</button>
                    <button class="btn-top-action delete" onclick="event.stopPropagation(); deleteRest(${r.id})" title="Elimina">✖</button>
                </div>
            </div>
            
            ${r.noteGenerali ? `<div class="card-notes" style="font-size: 0.8rem; margin-bottom: 10px; padding: 6px 10px;">"${r.noteGenerali}"</div>` : ''}

            <div class="card-social-links" style="display: flex; gap: 8px; margin-bottom: 10px;">
                ${mapsLink ? `<a href="${mapsLink}" target="_blank" class="btn-action-circle maps" onclick="event.stopPropagation()">${iconMaps}</a>` : ''}
                ${webLink ? `<a href="${webLink}" target="_blank" class="btn-action-circle web" onclick="event.stopPropagation()">${iconWeb}</a>` : ''}
                ${igLink ? `<a href="${igLink}" target="_blank" class="btn-action-circle ig" onclick="event.stopPropagation()">${iconIg}</a>` : ''}
                ${telLink ? `<a href="tel:${telLink}" class="btn-action-circle tel" onclick="event.stopPropagation()">${iconTel}</a>` : ''}
            </div>

            ${showDegustazioni ? `
                <details class="tira-accordion" onclick="event.stopPropagation()">
                    <summary>
                        <span style="display:flex; align-items:center; gap:6px;"><span style="font-size:1.1rem;">🍷</span> Note di Degustazione</span>
                        <span class="arrow-icon">▼</span>
                    </summary>
                    <div class="tira-accordion-content">
                        
                        ${hasPizza ? `
                        <h4 style="margin-top: 10px; margin-bottom: 6px; font-size: 0.8rem; color: #fca5a5; text-transform: uppercase; border-bottom: 1px solid rgba(252, 165, 165, 0.2); padding-bottom: 4px;">🍕 Report Pizza ${r.pizzaTipo ? `(${r.pizzaTipo})` : ''}</h4>
                        <div class="tira-report-grid">
                            ${r.pizzaImpastoVote > 0 ? `<div class="tira-report-item"><span class="title">Impasto</span><span class="icons">${'🌾'.repeat(r.pizzaImpastoVote)}</span><span class="note">${r.pizzaImpastoNote || ''}</span></div>` : ''}
                            ${r.pizzaIngVote > 0 ? `<div class="tira-report-item"><span class="title">Ingredienti</span><span class="icons">${'🍅'.repeat(r.pizzaIngVote)}</span><span class="note">${r.pizzaIngNote || ''}</span></div>` : ''}
                            ${r.pizzaVoto > 0 ? `<div class="tira-report-item" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); grid-column: span 2;"><span class="title" style="color:#fca5a5;">Voto Finale</span><span class="icons">${'🍕'.repeat(r.pizzaVoto)}</span><span class="note">${r.pizzaRecensione || ''}</span></div>` : ''}
                        </div>
                        ` : ''}

                        ${hasPiattoForte ? `
                        <h4 style="margin-top: 10px; margin-bottom: 6px; font-size: 0.8rem; color: #a7f3d0; text-transform: uppercase; border-bottom: 1px solid rgba(167, 243, 208, 0.2); padding-bottom: 4px;">🍝 Piatti Forti / Specialità</h4>
                        ${piattiList.map(pf => `
                            <div class="tira-report-item" style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); margin-bottom: 8px;">
                                <span class="title" style="color:#a7f3d0; font-size: 0.9rem;">${pf.nome || 'Specialità'}</span>
                                ${pf.voto > 0 ? `<span class="icons">${'🏆'.repeat(pf.voto)}</span>` : ''}
                                <span class="note">${pf.note || ''}</span>
                            </div>
                        `).join('')}
                        ` : ''}

                        ${hasTiramisu ? `
                        <h4 style="margin-top: 10px; margin-bottom: 6px; font-size: 0.8rem; color: #fde047; text-transform: uppercase; border-bottom: 1px solid rgba(253, 224, 71, 0.2); padding-bottom: 4px;">🍰 Report Tiramisù</h4>
                        <div class="tira-report-grid">
                            ${r.tiraCremaVote > 0 ? `<div class="tira-report-item"><span class="title">Crema</span><span class="icons">${'🍮'.repeat(r.tiraCremaVote)}</span><span class="note">${r.tiraCremaNote || ''}</span></div>` : ''}
                            ${r.tiraSavVote > 0 ? `<div class="tira-report-item"><span class="title">Savoiardo</span><span class="icons">${'🍪'.repeat(r.tiraSavVote)}</span><span class="note">${r.tiraSavNote || ''}</span></div>` : ''}
                            ${r.tiraCaffeVote > 0 ? `<div class="tira-report-item"><span class="title">Caffè</span><span class="icons">${'☕'.repeat(r.tiraCaffeVote)}</span><span class="note">${r.tiraCaffeNote || ''}</span></div>` : ''}
                            ${r.ratingTiramisu > 0 ? `<div class="tira-report-item" style="background: rgba(234, 179, 8, 0.15); border: 1px solid rgba(234, 179, 8, 0.3);"><span class="title" style="color:#fbbf24;">Voto Finale</span><span class="icons">${'🍰'.repeat(r.ratingTiramisu)}</span><span class="note">${r.recensioneTiramisu || ''}</span></div>` : ''}
                        </div>
                        ` : ''}

                    </div>
                </details>
            ` : ''}
        `;
        listContainer.appendChild(card);
    });
}

// [REF-JS-TOGGLE-FAVORITE]
window.toggleFavorite = function(id) {
    const r = restaurants.find(res => res.id === id);
    if(r) {
        if(r.stato === 'Preferito') {
            r.stato = 'Visitato'; 
        } else {
            r.stato = 'Preferito';
        }
        saveToLocal();
        renderList();
    }
};

// [REF-JS-SHARE-MODAL] 
window.openShareModal = function(id) {
    const r = restaurants.find(res => res.id === id);
    if(!r) return;
    
    let text = `🍽️ *${r.nome}*\n`;
    text += `📍 Tipologia: ${r.tipologia}\n\n`;
    
    let mapsLink = r.maps && r.maps.trim() !== "" ? r.maps : `https://maps.google.com/?q=${encodeURIComponent(r.nome + " " + r.tipologia)}`;
    text += `🗺️ Posizione: ${mapsLink}\n`;
    
    if (r.link && r.link.trim() !== "" && !r.link.includes('google.com/search')) text += `🌐 Web: ${r.link}\n`;
    
    let igLink = r.instagram && r.instagram.trim() !== "" ? r.instagram : "";
    if (igLink && !igLink.startsWith('http')) igLink = `https://www.instagram.com/${igLink.replace('@', '')}`;
    if (igLink && !igLink.includes('google.com/search')) text += `📸 IG: ${igLink}\n`;
    
    const waLink = `https://wa.me/?text=${encodeURIComponent(text)}`;
    const mailLink = `mailto:?subject=${encodeURIComponent("Scopri questo locale: " + r.nome)}&body=${encodeURIComponent(text)}`;
    
    document.getElementById('share-wa').href = waLink;
    document.getElementById('share-mail').href = mailLink;
    
    const nativeBtn = document.getElementById('share-native');
    nativeBtn.onclick = function(e) {
        e.preventDefault();
        if (navigator.share) {
            navigator.share({
                title: r.nome,
                text: text
            }).catch(err => console.log('Condivisione annullata', err));
        } else {
            alert("Il tuo browser non supporta questa funzione. Usa i tasti WhatsApp o Email.");
        }
    };
    
    const modal = document.getElementById('share-modal');
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('show'), 10);
};

window.closeShareModal = function() {
    const modal = document.getElementById('share-modal');
    modal.classList.remove('show');
    setTimeout(() => modal.classList.add('hidden'), 300);
};

// [REF-JS-TOAST] 
function showToast(message) {
    const toast = document.getElementById('toast-alert');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}

// [REF-JS-SUBMIT] 
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('nome').value;
    
    let tipologiaValue = document.getElementById('tipologia').value;
    if (tipologiaValue === 'Altro') tipologiaValue = document.getElementById('tipologia-custom').value;

    // Generazione in background di URL REALI e funzionanti
    let searchQuery = encodeURIComponent(nome + " " + tipologiaValue);
    let linkValue = `https://www.google.com/search?q=${searchQuery}`;
    let mapsValue = `https://maps.google.com/?q=${searchQuery}`;
    let instagramValue = `https://www.google.com/search?q=${encodeURIComponent(nome + " " + tipologiaValue + " instagram")}`;

    const piattiFortiArr = getPiattiFortiData('piatti-forti-container');

    restaurants.unshift({
        id: Date.now(),
        nome,
        stato: document.getElementById('stato').value,
        tipologia: tipologiaValue,
        diet: document.getElementById('diet-picker').getAttribute('data-diet'),
        link: linkValue,
        maps: mapsValue,
        instagram: instagramValue,
        noteGenerali: document.getElementById('note-generali').value,
        ratingRistorante: parseInt(document.getElementById('stars-general').getAttribute('data-rating')) || 0,
        
        tiraCremaVote: parseInt(document.getElementById('beans-crema').getAttribute('data-rating')) || 0,
        tiraCremaNote: document.getElementById('note-crema').value,
        tiraSavVote: parseInt(document.getElementById('cookie-savoiardo').getAttribute('data-rating')) || 0,
        tiraSavNote: document.getElementById('note-savoiardo').value,
        tiraCaffeVote: parseInt(document.getElementById('beans-caffe').getAttribute('data-rating')) || 0,
        tiraCaffeNote: document.getElementById('note-caffe').value,
        ratingTiramisu: parseInt(document.getElementById('cakes-tiramisu').getAttribute('data-rating')) || 0,
        recensioneTiramisu: document.getElementById('recensione-tiramisu').value,
        
        pizzaImpastoVote: parseInt(document.getElementById('pizza-impasto').getAttribute('data-rating')) || 0,
        pizzaImpastoNote: document.getElementById('note-pizza-impasto').value,
        pizzaIngVote: parseInt(document.getElementById('pizza-ingredienti').getAttribute('data-rating')) || 0,
        pizzaIngNote: document.getElementById('note-pizza-ingredienti').value,
        pizzaTipo: document.getElementById('tipo-pizza').value,
        pizzaVoto: parseInt(document.getElementById('pizza-voto').getAttribute('data-rating')) || 0,
        pizzaRecensione: document.getElementById('recensione-pizza').value,

        piattiForti: piattiFortiArr,

        telefono: ""
    });
    
    saveToLocal();
    renderList();
    
    if (tipologiaValue === 'Drink&Pub') {
        showToast("🍻 Andiamo a bere!");
    } else {
        showToast("🍽️ Andiamo a mangiare!");
    }

    form.reset();
    document.getElementById('tipologia-custom').classList.add('hidden');
    document.querySelectorAll('#restaurant-form .custom-rating').forEach(st => setRatingUI(st, 0));
    
    document.getElementById('piatti-forti-container').innerHTML = '';
    addPiattoForteRow('piatti-forti-container');
    
    document.getElementById('stato').value = '';
    document.getElementById('tipologia').value = '';
    document.querySelectorAll('#diet-picker .diet-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('diet-picker').setAttribute('data-diet', '');
});

// [REF-JS-DELETE]
window.deleteRest = function(id) { 
    if(confirm("Rimuovere definitivamente questo locale?")) { 
        restaurants = restaurants.filter(r => r.id !== id); 
        saveToLocal(); renderList(); 
    } 
};

// [REF-JS-MODAL-OPEN]
window.openEditModal = function(id) {
    editingId = id;
    const r = restaurants.find(res => res.id === id);
    if (!r) return;

    document.getElementById('edit-nome').value = r.nome;
    document.getElementById('edit-telefono').value = r.telefono || '';
    document.getElementById('edit-link').value = r.link || '';
    document.getElementById('edit-maps').value = r.maps || '';
    document.getElementById('edit-instagram').value = r.instagram || '';
    document.getElementById('edit-note-generali').value = r.noteGenerali || '';
    
    document.getElementById('edit-lat').value = r.lat || '';
    document.getElementById('edit-lng').value = r.lng || '';

    document.getElementById('edit-note-crema').value = r.tiraCremaNote || '';
    document.getElementById('edit-note-savoiardo').value = r.tiraSavNote || '';
    document.getElementById('edit-note-caffe').value = r.tiraCaffeNote || '';
    document.getElementById('edit-recensione-tiramisu').value = r.recensioneTiramisu || '';

    document.getElementById('edit-note-pizza-impasto').value = r.pizzaImpastoNote || '';
    document.getElementById('edit-note-pizza-ingredienti').value = r.pizzaIngNote || '';
    document.getElementById('edit-tipo-pizza').value = r.pizzaTipo || '';
    document.getElementById('edit-recensione-pizza').value = r.pizzaRecensione || '';

    document.getElementById('edit-stato').value = r.stato || '';

    const editTipoSelect = document.getElementById('edit-tipologia');
    const editTipoCustom = document.getElementById('edit-tipologia-custom');
    let optionExists = Array.from(editTipoSelect.options).some(opt => opt.value === r.tipologia);
    if (optionExists) { editTipoSelect.value = r.tipologia; editTipoCustom.classList.add('hidden'); } 
    else { editTipoSelect.value = 'Altro'; editTipoCustom.classList.remove('hidden'); editTipoCustom.value = r.tipologia; }

    document.querySelectorAll('#edit-diet-picker .diet-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('edit-diet-picker').setAttribute('data-diet', r.diet || '');
    if (r.diet) {
        const dietBtn = document.querySelector(`#edit-diet-picker [data-val="${r.diet}"]`);
        if(dietBtn) dietBtn.classList.add('active');
    }

    setRatingUI(document.getElementById('edit-stars-general'), r.ratingRistorante || 0);
    setRatingUI(document.getElementById('edit-beans-crema'), r.tiraCremaVote || 0);
    setRatingUI(document.getElementById('edit-cookie-savoiardo'), r.tiraSavVote || 0);
    setRatingUI(document.getElementById('edit-beans-caffe'), r.tiraCaffeVote || 0);
    setRatingUI(document.getElementById('edit-cakes-tiramisu'), r.ratingTiramisu || 0);
    
    setRatingUI(document.getElementById('edit-pizza-impasto'), r.pizzaImpastoVote || 0);
    setRatingUI(document.getElementById('edit-pizza-ingredienti'), r.pizzaIngVote || 0);
    setRatingUI(document.getElementById('edit-pizza-voto'), r.pizzaVoto || 0);

    const editContainer = document.getElementById('edit-piatti-forti-container');
    editContainer.innerHTML = ''; 
    
    let piattiList = r.piattiForti ? [...r.piattiForti] : [];
    if (r.piattoForteNome || r.piattoForteVoto > 0 || r.piattoForteNote) {
        piattiList.unshift({ nome: r.piattoForteNome, voto: r.piattoForteVoto, note: r.piattoForteNote });
    }
    
    if (piattiList.length > 0) {
        piattiList.forEach(pf => addPiattoForteRow('edit-piatti-forti-container', pf));
    } else {
        addPiattoForteRow('edit-piatti-forti-container'); 
    }

    editModal.classList.remove('hidden');
    setTimeout(() => editModal.classList.add('show'), 10);
};

// [REF-JS-MODAL-CLOSE]
window.closeEditModal = function() { 
    editModal.classList.remove('show'); 
    setTimeout(() => { editModal.classList.add('hidden'); editingId = null; }, 300);
};

// [REF-JS-SUBMIT-MODIFICA]
editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const idx = restaurants.findIndex(r => r.id === editingId);
    if (idx !== -1) {
        let tipologiaValue = document.getElementById('edit-tipologia').value;
        if (tipologiaValue === 'Altro') tipologiaValue = document.getElementById('edit-tipologia-custom').value;

        const piattiFortiArr = getPiattiFortiData('edit-piatti-forti-container');

        let eLat = document.getElementById('edit-lat').value || null;
        let eLng = document.getElementById('edit-lng').value || null;

        // Se l'utente svuota intenzionalmente la casella (diventa ""), l'icona scompare per quel link!
        restaurants[idx] = {
            ...restaurants[idx],
            nome: document.getElementById('edit-nome').value,
            stato: document.getElementById('edit-stato').value,
            tipologia: tipologiaValue,
            diet: document.getElementById('edit-diet-picker').getAttribute('data-diet'),
            telefono: document.getElementById('edit-telefono').value.trim(),
            link: document.getElementById('edit-link').value.trim(),
            maps: document.getElementById('edit-maps').value.trim(),
            instagram: document.getElementById('edit-instagram').value.trim(),
            lat: eLat ? parseFloat(eLat) : restaurants[idx].lat, 
            lng: eLng ? parseFloat(eLng) : restaurants[idx].lng,
            noteGenerali: document.getElementById('edit-note-generali').value,
            ratingRistorante: parseInt(document.getElementById('edit-stars-general').getAttribute('data-rating')) || 0,
            
            tiraCremaVote: parseInt(document.getElementById('edit-beans-crema').getAttribute('data-rating')) || 0,
            tiraCremaNote: document.getElementById('edit-note-crema').value,
            tiraSavVote: parseInt(document.getElementById('edit-cookie-savoiardo').getAttribute('data-rating')) || 0,
            tiraSavNote: document.getElementById('edit-note-savoiardo').value,
            tiraCaffeVote: parseInt(document.getElementById('edit-beans-caffe').getAttribute('data-rating')) || 0,
            tiraCaffeNote: document.getElementById('edit-note-caffe').value,
            ratingTiramisu: parseInt(document.getElementById('edit-cakes-tiramisu').getAttribute('data-rating')) || 0,
            recensioneTiramisu: document.getElementById('edit-recensione-tiramisu').value,

            pizzaImpastoVote: parseInt(document.getElementById('edit-pizza-impasto').getAttribute('data-rating')) || 0,
            pizzaImpastoNote: document.getElementById('edit-note-pizza-impasto').value,
            pizzaIngVote: parseInt(document.getElementById('edit-pizza-ingredienti').getAttribute('data-rating')) || 0,
            pizzaIngNote: document.getElementById('edit-note-pizza-ingredienti').value,
            pizzaTipo: document.getElementById('edit-tipo-pizza').value,
            pizzaVoto: parseInt(document.getElementById('edit-pizza-voto').getAttribute('data-rating')) || 0,
            pizzaRecensione: document.getElementById('edit-recensione-pizza').value,

            piattiForti: piattiFortiArr,
            piattoForteNome: null, piattoForteVoto: null, piattoForteNote: null
        };
        
        saveToLocal();
        renderList();
        closeEditModal();
    }
});

// [REF-JS-INIT]
addPiattoForteRow('piatti-forti-container'); 
renderList();

// [REF-JS-PWA-SERVICE-WORKER] 
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => {
            console.log('SW fallita:', err);
        });
    });
}