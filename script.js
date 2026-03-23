// [REF-JS-STATE] 
let restaurants = JSON.parse(localStorage.getItem('wishlistRistoranti_Premium')) || [];
let editingId = null;
let currentFilter = 'Tutti'; 

// [REF-JS-DOM]
const form = document.getElementById('restaurant-form');
const listContainer = document.getElementById('restaurant-list');
const dietPicker = document.getElementById('diet-picker');
const editDietPicker = document.getElementById('edit-diet-picker');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');

// [REF-JS-STORAGE]
function saveToLocal() { localStorage.setItem('wishlistRistoranti_Premium', JSON.stringify(restaurants)); }
window.addEventListener('beforeunload', saveToLocal);

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

// [REF-JS-SEARCH-WEB] 
const btnSearchWeb = document.getElementById('btn-search-web');
if (btnSearchWeb) {
    btnSearchWeb.addEventListener('click', function() {
        const nome = document.getElementById('nome').value.trim();
        if (!nome) return alert("Scrivi il nome del locale prima di cercare!");
        window.open(`https://www.google.com/search?q=${encodeURIComponent(nome + " ristorante")}`, "_blank");
    });
}

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
            setRatingUI(container, item.getAttribute('data-val'));
        });
    });
}
function setRatingUI(container, rating) {
    container.setAttribute('data-rating', rating);
    const items = container.querySelectorAll('span');
    items.forEach(st => st.classList.toggle('active', st.getAttribute('data-val') <= rating));
}

['stars-general', 'beans-crema', 'cookie-savoiardo', 'beans-caffe', 'cakes-tiramisu', 
 'edit-stars-general', 'edit-beans-crema', 'edit-cookie-savoiardo', 'edit-beans-caffe', 'edit-cakes-tiramisu'].forEach(setupCustomRating);

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

// [REF-JS-RENDER-FILTERS]
const filterStato = document.getElementById('filter-stato');
const filterTipologia = document.getElementById('filter-tipologia');
filterStato.addEventListener('change', renderList);
filterTipologia.addEventListener('change', renderList);

// SVG Icons per i contatti
const iconWeb = `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
const iconIg = `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`;
const iconTel = `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`;

function renderList() {
    const fStato = filterStato.value;
    const fTipo = filterTipologia.value;

    const filtered = restaurants.filter(r => {
        let matchStato = fStato === 'Tutti' || r.stato === fStato;
        let matchTipo = fTipo === 'Tutte' || r.tipologia === fTipo;
        
        if (fTipo === 'Altro') {
            const standardTypes = ["Pizzeria", "Trattoria", "Giapponese", "Cinese", "Indiano", "Thailandese", "Libanese", "Pub"];
            matchTipo = !standardTypes.includes(r.tipologia);
        }
        return matchStato && matchTipo;
    });

    document.getElementById('stats-totali').textContent = restaurants.length;

    listContainer.innerHTML = filtered.length ? '' : '<div style="text-align:center; padding: 3rem 1rem; opacity: 0.5;">📭<br><br>Nessun locale trovato.</div>';
    
    filtered.forEach((r, index) => {
        let dietIcon = r.diet === 'Vegano' ? '🌱' : (r.diet === 'Vegetariano' ? '🥗' : '🍽️');
        
        let domain = "";
        try { if(r.link && !r.link.includes('google.com/search')) domain = new URL(r.link).hostname; } catch(e){}
        let iconHtml = domain ? `<img src="https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=64" class="rest-icon" alt="Logo">` : `<div class="rest-icon-fallback">${dietIcon}</div>`;

        let igLink = '';
        if (r.instagram && r.instagram.trim() !== "") {
            igLink = r.instagram.startsWith('http') ? r.instagram : `https://www.instagram.com/${r.instagram.replace('@', '')}`;
        } else {
            igLink = `https://www.google.com/search?q=${encodeURIComponent("site:instagram.com " + r.nome)}`;
        }

        const card = document.createElement('div');
        card.className = 'restaurant-card';
        card.style.animationDelay = `${index * 0.05}s`;
        card.ondblclick = () => openEditModal(r.id);
        
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <div style="flex:1; padding-right:12px;">
                    <div style="margin-bottom: 6px;">
                        <span class="badge">${r.tipologia}</span>
                        <span class="badge" style="background: transparent; border: 1px solid var(--border-color);">${r.stato === 'Visitato' ? '✅ Visitato' : '📍 Da Testare'}</span>
                    </div>
                    
                    <div style="display:flex; align-items:center; flex-wrap:wrap; gap: 8px; margin-top:6px;">
                        ${iconHtml}
                        <span style="color:var(--text-main); font-weight:700; font-size:1.2rem; line-height: 1.2;">${r.nome}</span>
                        ${r.stato === 'Visitato' && r.ratingRistorante > 0 ? `<span style="color:var(--star-filled); font-size:1.1rem; text-shadow: 0 0 8px rgba(251,191,36,0.6); margin-left: 5px;">${'★'.repeat(r.ratingRistorante)}</span>` : ''}
                    </div>
                    
                    ${r.noteGenerali ? `<p style="font-size:0.85rem; color:var(--text-muted); margin-top:6px; font-weight:300;">${r.noteGenerali}</p>` : ''}
                </div>
                
                <div class="card-actions-wrapper">
                    <button class="btn-delete" onclick="event.stopPropagation(); deleteRest(${r.id})" title="Elimina">✖</button>
                    
                    <div class="action-buttons">
                        <a href="${r.link}" target="_blank" class="btn-circle web" title="Sito Web" onclick="event.stopPropagation()">${iconWeb}</a>
                        <a href="${igLink}" target="_blank" class="btn-circle ig" title="Instagram" onclick="event.stopPropagation()">${iconIg}</a>
                        ${r.telefono ? `<a href="tel:${r.telefono}" class="btn-circle tel" title="Chiama" onclick="event.stopPropagation()">${iconTel}</a>` : ''}
                    </div>
                </div>
            </div>

            ${(r.ratingTiramisu > 0 || r.tiraCremaVote > 0 || r.tiraSavVote > 0 || r.tiraCaffeVote > 0 || r.recensioneTiramisu) ? `
                <details class="tira-accordion" onclick="event.stopPropagation()">
                    <summary>
                        <span style="display:flex; align-items:center; gap:6px;"><span style="font-size:1.2rem;">🍰</span> Report Tiramisù</span>
                        <span class="arrow-icon">▼</span>
                    </summary>
                    <div class="tira-accordion-content">
                        <div class="tira-report-grid">
                            ${r.tiraCremaVote > 0 ? `<div class="tira-report-item"><span class="title">Crema</span><span class="icons">${'🍮'.repeat(r.tiraCremaVote)}</span><span class="note">${r.tiraCremaNote || ''}</span></div>` : ''}
                            ${r.tiraSavVote > 0 ? `<div class="tira-report-item"><span class="title">Savoiardo</span><span class="icons">${'🍪'.repeat(r.tiraSavVote)}</span><span class="note">${r.tiraSavNote || ''}</span></div>` : ''}
                            ${r.tiraCaffeVote > 0 ? `<div class="tira-report-item"><span class="title">Caffè</span><span class="icons">${'☕'.repeat(r.tiraCaffeVote)}</span><span class="note">${r.tiraCaffeNote || ''}</span></div>` : ''}
                            ${r.ratingTiramisu > 0 ? `<div class="tira-report-item" style="background: rgba(234, 179, 8, 0.15); border: 1px solid rgba(234, 179, 8, 0.3);"><span class="title" style="color:#fbbf24;">Voto Finale</span><span class="icons">${'🍰'.repeat(r.ratingTiramisu)}</span><span class="note">${r.recensioneTiramisu || ''}</span></div>` : ''}
                        </div>
                    </div>
                </details>
            ` : ''}
        `;
        listContainer.appendChild(card);
    });
}

// [REF-JS-SUBMIT] 
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('nome').value;
    
    let tipologiaValue = document.getElementById('tipologia').value;
    if (tipologiaValue === 'Altro') tipologiaValue = document.getElementById('tipologia-custom').value;

    let linkValue = document.getElementById('link').value;
    if (!linkValue || linkValue.trim() === "") linkValue = `https://www.google.com/search?q=${encodeURIComponent(nome + " ristorante")}`;

    restaurants.unshift({
        id: Date.now(),
        nome,
        stato: document.getElementById('stato').value,
        tipologia: tipologiaValue,
        diet: document.getElementById('diet-picker').getAttribute('data-diet'),
        link: linkValue,
        instagram: document.getElementById('instagram').value,
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
        telefono: ""
    });
    
    saveToLocal();
    renderList();
    
    form.reset();
    document.getElementById('tipologia-custom').classList.add('hidden');
    document.querySelectorAll('#restaurant-form .custom-rating').forEach(st => setRatingUI(st, 0));
    
    document.getElementById('stato').value = 'Da Testare';
    document.querySelector('#diet-picker [data-val="Normale"]').click();
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
    document.getElementById('edit-instagram').value = r.instagram || '';
    document.getElementById('edit-note-generali').value = r.noteGenerali || '';
    
    document.getElementById('edit-note-crema').value = r.tiraCremaNote || '';
    document.getElementById('edit-note-savoiardo').value = r.tiraSavNote || '';
    document.getElementById('edit-note-caffe').value = r.tiraCaffeNote || '';
    document.getElementById('edit-recensione-tiramisu').value = r.recensioneTiramisu || '';

    document.getElementById('edit-stato').value = r.stato || 'Da Testare';

    const editTipoSelect = document.getElementById('edit-tipologia');
    const editTipoCustom = document.getElementById('edit-tipologia-custom');
    let optionExists = Array.from(editTipoSelect.options).some(opt => opt.value === r.tipologia);
    if (optionExists) { editTipoSelect.value = r.tipologia; editTipoCustom.classList.add('hidden'); } 
    else { editTipoSelect.value = 'Altro'; editTipoCustom.classList.remove('hidden'); editTipoCustom.value = r.tipologia; }

    const dietBtn = document.querySelector(`#edit-diet-picker [data-val="${r.diet || 'Normale'}"]`);
    if(dietBtn) dietBtn.click();

    setRatingUI(document.getElementById('edit-stars-general'), r.ratingRistorante || 0);
    setRatingUI(document.getElementById('edit-beans-crema'), r.tiraCremaVote || 0);
    setRatingUI(document.getElementById('edit-cookie-savoiardo'), r.tiraSavVote || 0);
    setRatingUI(document.getElementById('edit-beans-caffe'), r.tiraCaffeVote || 0);
    setRatingUI(document.getElementById('edit-cakes-tiramisu'), r.ratingTiramisu || 0);

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

        let linkValue = document.getElementById('edit-link').value;
        let nomeModificato = document.getElementById('edit-nome').value;
        if (!linkValue || linkValue.trim() === "") linkValue = `https://www.google.com/search?q=${encodeURIComponent(nomeModificato + " ristorante")}`;

        restaurants[idx] = {
            ...restaurants[idx],
            nome: nomeModificato,
            stato: document.getElementById('edit-stato').value,
            tipologia: tipologiaValue,
            diet: document.getElementById('edit-diet-picker').getAttribute('data-diet'),
            telefono: document.getElementById('edit-telefono').value,
            link: linkValue,
            instagram: document.getElementById('edit-instagram').value,
            noteGenerali: document.getElementById('edit-note-generali').value,
            ratingRistorante: parseInt(document.getElementById('edit-stars-general').getAttribute('data-rating')) || 0,
            
            tiraCremaVote: parseInt(document.getElementById('edit-beans-crema').getAttribute('data-rating')) || 0,
            tiraCremaNote: document.getElementById('edit-note-crema').value,
            tiraSavVote: parseInt(document.getElementById('edit-cookie-savoiardo').getAttribute('data-rating')) || 0,
            tiraSavNote: document.getElementById('edit-note-savoiardo').value,
            tiraCaffeVote: parseInt(document.getElementById('edit-beans-caffe').getAttribute('data-rating')) || 0,
            tiraCaffeNote: document.getElementById('edit-note-caffe').value,
            ratingTiramisu: parseInt(document.getElementById('edit-cakes-tiramisu').getAttribute('data-rating')) || 0,
            recensioneTiramisu: document.getElementById('edit-recensione-tiramisu').value
        };
        
        saveToLocal();
        renderList();
        closeEditModal();
    }
});

// [REF-JS-INIT]
renderList();

// [REF-JS-PWA-SERVICE-WORKER] Installazione del Service Worker per la Web App
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(reg => {
            console.log('Service Worker registrato con successo.', reg);
        }).catch(err => {
            console.log('Service Worker registrazione fallita:', err);
        });
    });
}