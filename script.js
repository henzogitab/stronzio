const URL_BOWSERINATOR = 'https://raw.githubusercontent.com/Bowserinator/Periodic-Table-JSON/master/PeriodicTableJSON.json';
const URL_GOODMAN = 'https://gist.githubusercontent.com/GoodmanSciences/c2dd862cd38f21b0ad36b8f96b4bf1ee/raw/';

const tableContainer = document.getElementById('periodic-table');
const modal = document.getElementById('element-modal');
const modalBody = document.getElementById('modal-body');
const closeBtn = document.querySelector('.close-btn');

const searchFilter = document.getElementById('search-filter');
const categoryFilter = document.getElementById('category-filter');
const phaseFilter = document.getElementById('phase-filter');

let mergedElementsData = [];

async function init() {
    try {
        const resBowser = await fetch(URL_BOWSERINATOR);
        if (!resBowser.ok) throw new Error("Errore nel database principale");
        const dataBowser = await resBowser.json();

        let dataGoodman = [];
        try {
            const resGoodman = await fetch(URL_GOODMAN);
            if (resGoodman.ok) {
                const parsedGoodman = await resGoodman.json();
                if (Array.isArray(parsedGoodman)) {
                    dataGoodman = parsedGoodman;
                }
            }
        } catch (e) {
            console.warn("DB secondario (Goodman) non raggiungibile. Procedo solo con il principale.", e);
        }

        mergedElementsData = dataBowser.elements.map(b_el => {
            const g_el = dataGoodman.find(g => g.atomicNumber === b_el.number) || {};
            return { ...b_el, extraData: g_el };
        });
        
        renderTable(mergedElementsData);

        // Listeners
        searchFilter.addEventListener('input', applyFilters);
        categoryFilter.addEventListener('change', applyFilters);
        phaseFilter.addEventListener('change', applyFilters);

    } catch (error) {
        console.error("Errore critico:", error);
        tableContainer.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color: #ff5555;">Errore: ${error.message}. Usa un server locale (es. Live Server).</p>`;
    }
}

function renderTable(elements) {
    elements.forEach(el => {
        if (!el.xpos || !el.ypos) return;

        const tile = document.createElement('div');
        let cleanCategory = (el.category || 'unknown').split(',')[0].trim().toLowerCase().replace(/\s+/g, '-');
        
        tile.className = `element-tile category-${cleanCategory}`;
        
        // Salviamo i dati per i filtri
        tile.dataset.category = cleanCategory;
        tile.dataset.phase = el.phase || 'Unknown';
        tile.dataset.name = el.name.toLowerCase();
        tile.dataset.symbol = el.symbol.toLowerCase();

        tile.style.gridColumn = el.xpos;
        tile.style.gridRow = el.ypos;
        
        tile.innerHTML = `
            <span class="el-number">${el.number}</span>
            <span class="el-symbol">${el.symbol}</span>
            <span class="el-name">${el.name}</span>
        `;

        tile.addEventListener('click', () => openModal(el));
        tableContainer.appendChild(tile);
    });
}

function applyFilters() {
    const searchTerm = searchFilter.value.toLowerCase();
    const selectedCategory = categoryFilter.value;
    const selectedPhase = phaseFilter.value;
    const tiles = document.querySelectorAll('.element-tile');
    
    tiles.forEach(tile => {
        const matchSearch = tile.dataset.name.includes(searchTerm) || tile.dataset.symbol.includes(searchTerm);
        const matchCategory = selectedCategory === 'all' || tile.dataset.category === selectedCategory;
        const matchPhase = selectedPhase === 'all' || tile.dataset.phase === selectedPhase;
        
        tile.classList.toggle('hidden', !(matchSearch && matchCategory && matchPhase));
    });
}

function openModal(el) {
    const imageUrl = el.image && el.image.url ? el.image.url : 'https://via.placeholder.com/300x200?text=Immagine+Non+Disponibile';
    const imageTitle = el.image && el.image.title ? el.image.title : el.name;

    let enValue = el.electronegativity_pauling || el.extraData.electronegativity || null;
    let enHtml = 'N/D';
    if (enValue) {
        let percentage = Math.min((enValue / 4.0) * 100, 100); 
        enHtml = `
            ${enValue}
            <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: ${percentage}%"></div>
            </div>
        `;
    }

    // Qui aggiungiamo il bottone Wikipedia usando el.source
    modalBody.innerHTML = `
        <div class="modal-header">
            <div class="modal-symbol">${el.symbol}</div>
            <div>
                <h2 style="margin:0">${el.name} (${el.number})</h2>
                <em style="color:#aaa">${el.category}</em>
            </div>
        </div>

        <div class="modal-body-layout">
            <div class="modal-image-container">
                <img src="${imageUrl}" alt="Foto di ${el.name}">
                <div class="image-attribution">${imageTitle}</div>
            </div>

            <div class="modal-info">
                <p><strong>Massa Atomica:</strong> ${el.atomic_mass || 'N/D'} u</p>
                <p><strong>Stato (ambiente):</strong> ${el.phase || 'N/D'}</p>
                <p><strong>Configurazione Elettronica:</strong> ${el.electron_configuration || 'N/D'}</p>
                <p><strong>Elettronegatività (Pauling):</strong> ${enHtml}</p>
                <p><strong>Densità:</strong> ${el.density ? el.density + ' g/cm³' : 'N/D'}</p>
                <p><strong>Punto di Fusione:</strong> ${el.melt ? el.melt + ' K' : 'N/D'}</p>
                <p><strong>Punto di Ebollizione:</strong> ${el.boil ? el.boil + ' K' : 'N/D'}</p>
                <p><strong>Scoperto da:</strong> ${el.discovered_by || 'Sconosciuto'}</p>
                <p style="font-size: 0.9rem; margin-top: 15px;"><strong>Descrizione:</strong> ${el.summary || 'Nessuna descrizione.'}</p>
                
                <a href="${el.source}" target="_blank" rel="noopener noreferrer" class="wiki-btn">
                    Leggi di più su Wikipedia ↗
                </a>
            </div>
        </div>
    `;
    modal.classList.add('show');
}

closeBtn.addEventListener('click', () => modal.classList.remove('show'));
window.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('show');
});

init();
