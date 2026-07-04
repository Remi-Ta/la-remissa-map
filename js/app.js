/* =========================================================================
   LA RÉMISSA MAP — app.js
   Application mobile-first : Google Sheets -> Carte Leaflet + Liste + Recherche
   ========================================================================= */

/* ============================================================
   1. CONFIGURATION — À MODIFIER PAR VOUS
   ============================================================
   Remplacez l'URL ci-dessous par le lien CSV public de votre Google Sheets.

   Comment l'obtenir :
   1. Ouvrez votre Google Sheets
   2. Fichier > Partager > Publier sur le web
   3. Choisissez l'onglet contenant vos lieux, format "Valeurs séparées par
      des virgules (.csv)", puis cliquez sur "Publier"
   4. Copiez le lien fourni (il ressemble à) :
      https://docs.google.com/spreadsheets/d/e/VOTRE_ID_LONG/pub?output=csv
   5. Collez-le ci-dessous, entre guillemets.

   Alternative (sans "Publier sur le web", juste le fichier partagé en lecture
   pour "toute personne disposant du lien") — remplacez SHEET_ID et GID :
      https://docs.google.com/spreadsheets/d/SHEET_ID/export?format=csv&gid=GID
   ============================================================ */
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1nUi98P-PI_oCzzQU9JSOIxGas_jwmxs3ME_xdEjMXS4/edit?usp=sharing";

// Centre par défaut de la carte si aucune coordonnée n'est trouvée (Paris)
const DEFAULT_CENTER = [48.8566, 2.3522];
const DEFAULT_ZOOM = 12;

/* ============================================================
   2. CHARTE GRAPHIQUE — couleurs des catégories et statuts
   ============================================================ */
const CATEGORY_COLORS = {
  "À boire & à manger": "#F4B942",
  "Au vert":            "#2ECC71",
  "Emplettes":          "#A07855",
  "Cul'ture":           "#3498DB",
  "Expériences":        "#BB86FC",
  "Au schlof !":        "#E91E63",
  "Divers":             "#4A5568",
};
const CATEGORY_ORDER = Object.keys(CATEGORY_COLORS);
const DEFAULT_CATEGORY_COLOR = "#4A5568";

const STATUS_STYLES = {
  "À faire":   { bg: "#E2E8F0", text: "#475569" },
  "Approuvé":  { bg: "#A7F3D0", text: "#065F46" },
  "Bof bof":   { bg: "#FEF3C7", text: "#92400E" },
};
const STATUS_ORDER = Object.keys(STATUS_STYLES);

const WELCOME_MESSAGES = [
  "Bienvenue — Tout est prêt",
  "Prêt à explorer nos lieux favoris ?",
  "Une envie de sortie ? On a ce qu'il faut.",
  "Bienvenue — La carte n'attend que vous",
  "Toujours à jour, toujours par ici",
];

/* ============================================================
   3. ÉTAT DE L'APPLICATION
   ============================================================ */
const state = {
  allPlaces: [],
  filtered: [],
  category: "all",   // "all" ou une des clés de CATEGORY_COLORS
  status: "all",     // "all" ou une des clés de STATUS_STYLES
  search: "",
  map: null,
  markersLayer: null,
};

/* ============================================================
   4. OUTILS
   ============================================================ */

// Normalise un texte pour une recherche insensible aux accents/majuscules
function normalize(str) {
  return (str || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function categoryColor(cat) {
  return CATEGORY_COLORS[cat] || DEFAULT_CATEGORY_COLOR;
}

// Récupère la première URL valide d'une cellule "Photos" (qui peut contenir
// plusieurs liens séparés par une virgule, un retour à la ligne ou un espace)
function firstPhotoUrl(raw) {
  if (!raw) return null;
  const parts = raw.split(/[\n, ]+/).map(s => s.trim()).filter(Boolean);
  const found = parts.find(p => /^https?:\/\//i.test(p));
  return found || null;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

/* ============================================================
   5. CHARGEMENT DES DONNÉES (Google Sheets -> CSV -> objets)
   ============================================================ */
function loadData() {
  if (!SHEET_CSV_URL || SHEET_CSV_URL.includes("COLLEZ_ICI")) {
    showError("Aucune URL Google Sheets configurée. Ouvrez js/app.js et renseignez SHEET_CSV_URL.");
    return;
  }

  Papa.parse(SHEET_CSV_URL, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      try {
        state.allPlaces = results.data
          .map(rowToPlace)
          .filter(p => p.nom); // on ignore les lignes vides / sans nom
        document.getElementById("loadingState").hidden = true;
        buildFilterChips();
        applyFilters();
      } catch (err) {
        console.error(err);
        showError("Erreur lors de la lecture des données.");
      }
    },
    error: (err) => {
      console.error(err);
      showError("Impossible de joindre le fichier Google Sheets. Vérifiez que le lien est public.");
    },
  });
}

// Transforme une ligne du CSV (colonnes françaises exactes) en objet "place"
function rowToPlace(row) {
  const lat = parseFloat((row["Latitude"] || "").toString().replace(",", "."));
  const lng = parseFloat((row["Longitude"] || "").toString().replace(",", "."));

  return {
    nom: (row["Nom du lieu"] || "").trim(),
    categorie: (row["Catégorie"] || "").trim(),
    statut: (row["Statut"] || "").trim(),
    adresse: (row["Adresse"] || "").trim(),
    urlMaps: (row["URL Google Maps"] || "").trim(),
    photo: firstPhotoUrl(row["Photos"]),
    infos: (row["Informations"] || "").trim(),
    site: (row["Site web"] || "").trim(),
    dateAjout: (row["Date d'ajout"] || "").trim(),
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
  };
}

function showError(message) {
  document.getElementById("loadingState").hidden = true;
  const errEl = document.getElementById("errorState");
  errEl.hidden = false;
  errEl.querySelector("p").textContent = message;
}

/* ============================================================
   6. CARTE LEAFLET (fond CartoDB Positron — gratuit et illimité)
   ============================================================ */
function initMap() {
  state.map = L.map("map", { zoomControl: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20,
  }).addTo(state.map);

  state.markersLayer = L.layerGroup().addTo(state.map);
}

function makeDivIcon(color) {
  return L.divIcon({
    className: "custom-marker",
    html: `<span style="background:${color}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function renderMarkers(places) {
  state.markersLayer.clearLayers();
  const withCoords = places.filter(p => p.lat !== null && p.lng !== null);

  withCoords.forEach(place => {
    const marker = L.marker([place.lat, place.lng], {
      icon: makeDivIcon(categoryColor(place.categorie)),
    });
    marker.on("click", () => openModal(place));
    marker.addTo(state.markersLayer);
  });

  // Ajuste la vue pour englober tous les marqueurs visibles (une seule fois
  // idéalement au premier chargement, mais on le fait à chaque filtre pour
  // que la carte reste pertinente — sans zoomer trop près si un seul point)
  if (withCoords.length > 0) {
    const bounds = L.latLngBounds(withCoords.map(p => [p.lat, p.lng]));
    state.map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
  }
}

/* ============================================================
   7. LISTE (cartes façon Softr)
   ============================================================ */
function renderCards(places) {
  const grid = document.getElementById("cardsGrid");
  const empty = document.getElementById("emptyState");

  grid.innerHTML = "";

  if (places.length === 0) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  const frag = document.createDocumentFragment();

  places.forEach(place => {
    const card = document.createElement("article");
    card.className = "place-card";
    card.tabIndex = 0;

    const statusStyle = STATUS_STYLES[place.statut] || { bg: "#E2E8F0", text: "#475569" };

    card.innerHTML = `
      ${place.photo
        ? `<img class="place-card-photo" src="${escapeHtml(place.photo)}" alt="${escapeHtml(place.nom)}" loading="lazy">`
        : `<div class="place-card-photo placeholder">Pas de photo</div>`
      }
      <div class="place-card-body">
        <h3 class="place-card-title">${escapeHtml(place.nom)}</h3>
        <div class="badge-row">
          ${place.categorie ? `<span class="badge" style="background:${categoryColor(place.categorie)}">${escapeHtml(place.categorie)}</span>` : ""}
          ${place.statut ? `<span class="badge badge-status" style="background:${statusStyle.bg};color:${statusStyle.text}">${escapeHtml(place.statut)}</span>` : ""}
        </div>
        ${place.adresse ? `<p class="place-card-address">📍 ${escapeHtml(place.adresse)}</p>` : ""}
      </div>
    `;

    card.addEventListener("click", () => openModal(place));
    frag.appendChild(card);
  });

  grid.appendChild(frag);
}

/* ============================================================
   8. MODALE DE DÉTAILS
   ============================================================ */
function openModal(place) {
  const statusStyle = STATUS_STYLES[place.statut] || { bg: "#E2E8F0", text: "#475569" };
  const content = document.getElementById("modalContent");

  content.innerHTML = `
    ${place.photo
      ? `<img class="modal-photo" src="${escapeHtml(place.photo)}" alt="${escapeHtml(place.nom)}">`
      : ""
    }
    <div class="modal-body">
      <h2 class="modal-title">${escapeHtml(place.nom)}</h2>
      <div class="badge-row">
        ${place.categorie ? `<span class="badge" style="background:${categoryColor(place.categorie)}">${escapeHtml(place.categorie)}</span>` : ""}
        ${place.statut ? `<span class="badge badge-status" style="background:${statusStyle.bg};color:${statusStyle.text}">${escapeHtml(place.statut)}</span>` : ""}
      </div>
      ${place.adresse ? `<p class="modal-address">📍 ${escapeHtml(place.adresse)}</p>` : ""}
      ${place.dateAjout ? `<p class="modal-date">Ajouté le ${escapeHtml(place.dateAjout)}</p>` : ""}
      ${place.infos ? `<p class="modal-description">${escapeHtml(place.infos)}</p>` : ""}
      ${place.site ? `<p class="modal-links"><a href="${escapeHtml(place.site)}" target="_blank" rel="noopener">🔗 Site web</a></p>` : ""}
      ${place.urlMaps
        ? `<a class="btn-primary" href="${escapeHtml(place.urlMaps)}" target="_blank" rel="noopener">Ouvrir dans Google Maps</a>`
        : ""
      }
    </div>
  `;

  document.getElementById("modalOverlay").hidden = false;
  document.body.style.overflow = "hidden";
}

function closeModal() {
  document.getElementById("modalOverlay").hidden = true;
  document.body.style.overflow = "";
}

/* ============================================================
   9. FILTRES (catégorie + statut) & RECHERCHE OUVERTE
   ============================================================ */
function buildFilterChips() {
  // Catégories réellement présentes dans les données, dans l'ordre de la charte
  const presentCategories = CATEGORY_ORDER.filter(cat =>
    state.allPlaces.some(p => p.categorie === cat)
  );
  // + éventuelles catégories non prévues dans la charte mais présentes dans le sheet
  const extraCategories = [...new Set(state.allPlaces.map(p => p.categorie))]
    .filter(cat => cat && !CATEGORY_ORDER.includes(cat));

  const categories = [...presentCategories, ...extraCategories];

  const catContainer = document.getElementById("categoryChips");
  catContainer.innerHTML = `<button class="chip active" data-cat="all">Toutes</button>` +
    categories.map(cat => `
      <button class="chip" data-cat="${escapeHtml(cat)}">
        <span class="dot" style="background:${categoryColor(cat)}"></span>${escapeHtml(cat)}
      </button>
    `).join("");

  catContainer.querySelectorAll(".chip").forEach(btn => {
    btn.addEventListener("click", () => {
      catContainer.querySelectorAll(".chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.category = btn.dataset.cat;
      applyFilters();
    });
  });

  // Statuts
  const presentStatuses = STATUS_ORDER.filter(s => state.allPlaces.some(p => p.statut === s));
  const statusContainer = document.getElementById("statusSegment");
  statusContainer.innerHTML = `<button class="status-chip active" data-status="all" style="background:#eee;color:#333">Tous</button>` +
    presentStatuses.map(s => {
      const style = STATUS_STYLES[s];
      return `<button class="status-chip" data-status="${escapeHtml(s)}" style="background:${style.bg};color:${style.text}">${escapeHtml(s)}</button>`;
    }).join("");

  statusContainer.querySelectorAll(".status-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      statusContainer.querySelectorAll(".status-chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.status = btn.dataset.status;
      applyFilters();
    });
  });
}

function applyFilters() {
  const term = normalize(state.search);

  state.filtered = state.allPlaces.filter(place => {
    if (state.category !== "all" && place.categorie !== state.category) return false;
    if (state.status !== "all" && place.statut !== state.status) return false;

    if (term) {
      const haystack = normalize(`${place.nom} ${place.adresse} ${place.infos}`);
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  renderMarkers(state.filtered);
  renderCards(state.filtered);
}

/* ============================================================
   10. NAVIGATION (Carte / Liste)
   ============================================================ */
function switchView(viewId) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(viewId).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.querySelector(`.nav-btn[data-view="${viewId}"]`).classList.add("active");

  // Leaflet a besoin d'un recalcul de taille quand son conteneur redevient visible
  if (viewId === "mapView" && state.map) {
    setTimeout(() => state.map.invalidateSize(), 50);
  }
}

/* ============================================================
   11. INITIALISATION
   ============================================================ */
function init() {
  // Message de bienvenue aléatoire
  document.getElementById("welcomeText").textContent =
    WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];

  initMap();

  // Recherche instantanée
  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearSearch");
  searchInput.addEventListener("input", (e) => {
    state.search = e.target.value;
    clearBtn.hidden = state.search.length === 0;
    applyFilters();
  });
  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    state.search = "";
    clearBtn.hidden = true;
    applyFilters();
    searchInput.focus();
  });

  // Onglets bas de page
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });

  // Modale
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("modalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "modalOverlay") closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  loadData();
}

document.addEventListener("DOMContentLoaded", init);
