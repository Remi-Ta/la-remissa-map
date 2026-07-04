/* =========================================================================
   ADMIN.JS — gestion locale des lieux (sans backend)
   Les données sont gardées dans localStorage pendant l'édition, puis
   exportées en CSV pour être commitées dans data/lieux.csv sur GitHub.
   ========================================================================= */

const CSV_COLUMNS = [
  "Nom du lieu", "Catégorie", "Statut", "Adresse", "URL Google Maps",
  "Photos", "Informations", "Site web", "Date d'ajout", "Latitude", "Longitude",
];

const CATEGORY_SUGGESTIONS = [
  "À boire & à manger", "Au vert", "Emplettes", "Cul'ture",
  "Expériences", "Au schlof !", "Divers",
];
const STATUS_SUGGESTIONS = ["À faire", "Approuvé", "Bof bof"];

const STORAGE_KEY = "remissa_admin_places";

let places = []; // tableau d'objets avec les clés CSV_COLUMNS

/* ---------------- Persistance locale (localStorage) ---------------- */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    places = raw ? JSON.parse(raw) : [];
  } catch {
    places = [];
  }
}
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
}

/* ---------------- Rendu du tableau ---------------- */
function renderTable() {
  const tbody = document.getElementById("placesTableBody");
  const empty = document.getElementById("adminEmptyState");
  document.getElementById("countLabel").textContent = places.length;

  tbody.innerHTML = "";
  if (places.length === 0) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  places.forEach((p, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(p["Nom du lieu"])}</td>
      <td>${escapeHtml(p["Catégorie"])}</td>
      <td>${escapeHtml(p["Statut"])}</td>
      <td>${escapeHtml(p["Adresse"])}</td>
      <td class="row-actions">
        <button data-action="edit" data-index="${index}">✏️</button>
        <button data-action="del" data-index="${index}" class="del-btn">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("button[data-action='edit']").forEach(btn => {
    btn.addEventListener("click", () => startEdit(parseInt(btn.dataset.index, 10)));
  });
  tbody.querySelectorAll("button[data-action='del']").forEach(btn => {
    btn.addEventListener("click", () => deletePlace(parseInt(btn.dataset.index, 10)));
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

/* ---------------- Formulaire : lecture / écriture ---------------- */
function readFormAsPlace() {
  return {
    "Nom du lieu": document.getElementById("f_nom").value.trim(),
    "Catégorie": document.getElementById("f_categorie").value.trim(),
    "Statut": document.getElementById("f_statut").value.trim(),
    "Adresse": document.getElementById("f_adresse").value.trim(),
    "URL Google Maps": document.getElementById("f_urlMaps").value.trim(),
    "Photos": document.getElementById("f_photos").value.trim(),
    "Informations": document.getElementById("f_infos").value.trim(),
    "Site web": document.getElementById("f_site").value.trim(),
    "Date d'ajout": document.getElementById("f_date").value.trim(),
    "Latitude": document.getElementById("f_lat").value.trim(),
    "Longitude": document.getElementById("f_lng").value.trim(),
  };
}

function fillFormWithPlace(p) {
  document.getElementById("f_nom").value = p["Nom du lieu"] || "";
  document.getElementById("f_categorie").value = p["Catégorie"] || "";
  document.getElementById("f_statut").value = p["Statut"] || "";
  document.getElementById("f_adresse").value = p["Adresse"] || "";
  document.getElementById("f_urlMaps").value = p["URL Google Maps"] || "";
  document.getElementById("f_photos").value = p["Photos"] || "";
  document.getElementById("f_infos").value = p["Informations"] || "";
  document.getElementById("f_site").value = p["Site web"] || "";
  document.getElementById("f_date").value = p["Date d'ajout"] || "";
  document.getElementById("f_lat").value = p["Latitude"] || "";
  document.getElementById("f_lng").value = p["Longitude"] || "";
}

function resetForm() {
  document.getElementById("placeForm").reset();
  document.getElementById("editIndex").value = "-1";
  document.getElementById("formTitle").textContent = "2. Ajouter un lieu";
  document.getElementById("submitBtn").textContent = "Ajouter à la liste";
  document.getElementById("cancelEditBtn").hidden = true;
}

/* ---------------- Actions : ajouter / éditer / supprimer ---------------- */
function startEdit(index) {
  const p = places[index];
  if (!p) return;
  fillFormWithPlace(p);
  document.getElementById("editIndex").value = index;
  document.getElementById("formTitle").textContent = "2. Modifier le lieu";
  document.getElementById("submitBtn").textContent = "Enregistrer les modifications";
  document.getElementById("cancelEditBtn").hidden = false;
  window.scrollTo({ top: document.getElementById("formTitle").offsetTop - 20, behavior: "smooth" });
}

function deletePlace(index) {
  if (!confirm(`Supprimer "${places[index]["Nom du lieu"]}" ?`)) return;
  places.splice(index, 1);
  saveToStorage();
  renderTable();
}

function handleFormSubmit(e) {
  e.preventDefault();
  const place = readFormAsPlace();
  if (!place["Nom du lieu"]) return;

  const editIndex = parseInt(document.getElementById("editIndex").value, 10);
  if (editIndex >= 0) {
    places[editIndex] = place;
  } else {
    places.push(place);
  }
  saveToStorage();
  renderTable();
  resetForm();
}

/* ---------------- Import CSV ---------------- */
function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const imported = results.data
        .filter(row => (row["Nom du lieu"] || "").trim())
        .map(row => {
          const place = {};
          CSV_COLUMNS.forEach(col => { place[col] = (row[col] || "").toString().trim(); });
          return place;
        });
      places = imported;
      saveToStorage();
      renderTable();
      alert(`${imported.length} lieu(x) importé(s).`);
    },
    error: (err) => {
      alert("Erreur de lecture du fichier CSV : " + err.message);
    },
  });

  e.target.value = ""; // permet de réimporter le même fichier si besoin
}

/* ---------------- Export CSV ---------------- */
function handleExport() {
  const csv = Papa.unparse(places, { columns: CSV_COLUMNS });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "lieux.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleReset() {
  if (!confirm("Tout effacer ? Cette action est irréversible (pensez à exporter avant si besoin).")) return;
  places = [];
  saveToStorage();
  renderTable();
}

/* ---------------- Initialisation ---------------- */
function initDatalists() {
  document.getElementById("categoryOptions").innerHTML =
    CATEGORY_SUGGESTIONS.map(c => `<option value="${escapeHtml(c)}">`).join("");
  document.getElementById("statusOptions").innerHTML =
    STATUS_SUGGESTIONS.map(s => `<option value="${escapeHtml(s)}">`).join("");
}

function init() {
  initDatalists();
  loadFromStorage();
  renderTable();

  document.getElementById("placeForm").addEventListener("submit", handleFormSubmit);
  document.getElementById("cancelEditBtn").addEventListener("click", resetForm);
  document.getElementById("importFile").addEventListener("change", handleImportFile);
  document.getElementById("exportBtn").addEventListener("click", handleExport);
  document.getElementById("resetBtn").addEventListener("click", handleReset);
}

document.addEventListener("DOMContentLoaded", init);
