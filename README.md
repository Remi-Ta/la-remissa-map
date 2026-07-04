# La Rémissa Map

Application mobile-first (HTML / CSS / JS pur, aucune dépendance à installer) qui lit vos lieux depuis Google Sheets et les affiche sur une carte Leaflet (fond OpenStreetMap / CartoDB, 100% gratuit et illimité) et dans une liste de fiches façon Softr.

## 1. Connecter votre Google Sheets

1. Ouvrez votre fichier Google Sheets.
2. Menu **Fichier > Partager > Publier sur le web**.
3. Choisissez l'onglet contenant vos lieux, format **Valeurs séparées par des virgules (.csv)**, cliquez sur **Publier**.
4. Copiez le lien généré, du type :
   `https://docs.google.com/spreadsheets/d/e/2PACX-xxxxxxxxxxxxxxxxxxx/pub?output=csv`
5. Ouvrez `js/app.js` et remplacez la ligne :
   ```js
   const SHEET_CSV_URL = "COLLEZ_ICI_VOTRE_URL_CSV_GOOGLE_SHEETS";
   ```
   par votre lien.

⚠️ Les colonnes doivent être nommées **exactement** ainsi (accents inclus) :
`Nom du lieu`, `Catégorie`, `Statut`, `Adresse`, `URL Google Maps`, `Photos`, `Informations`, `Site web`, `Date d'ajout`, `Latitude`, `Longitude`.

La colonne `Latitude`/`Longitude` doit contenir des nombres décimaux (ex : `48.8566`). Les lignes sans coordonnées valides s'affichent quand même dans la liste, mais pas sur la carte.

La colonne `Photos` peut contenir une ou plusieurs URL (séparées par une virgule, un espace ou un retour à la ligne) ; seule la première est utilisée.

## 2. Tester en local

Ouvrez simplement `index.html` dans un navigateur, ou lancez un petit serveur local (recommandé pour éviter certains blocages CORS) :
```
npx serve .
```

## 3. Héberger gratuitement sur GitHub Pages

1. Créez un dépôt GitHub (public) et poussez-y tout le contenu de ce dossier (`index.html`, `css/`, `js/`).
2. Dans le dépôt : **Settings > Pages > Source**, choisissez la branche `main` et le dossier `/ (root)`.
3. Votre app sera disponible à `https://votre-nom.github.io/nom-du-depot/`.

## 4. Personnaliser

- **Couleurs des catégories / statuts** : tout est centralisé en haut de `js/app.js` (`CATEGORY_COLORS`, `STATUS_STYLES`) et repris automatiquement dans `css/style.css`.
- **Messages de bienvenue aléatoires** : liste `WELCOME_MESSAGES` dans `js/app.js`.
- **Centre par défaut de la carte** : `DEFAULT_CENTER` / `DEFAULT_ZOOM` dans `js/app.js` (utile si vos lieux n'ont pas encore de coordonnées).
- **Couleur des boutons/accent** : variable CSS `--color-primary` dans `css/style.css` (actuellement `#B34E6B`).

## Structure des fichiers

```
remissa-map/
├── index.html          # Structure de la page (header, recherche, carte, liste, modale)
├── css/style.css        # Toute la charte graphique
├── js/app.js            # Chargement des données + logique (carte, filtres, recherche, modale)
└── README.md
```

## Notes techniques

- La carte utilise **Leaflet.js** avec le fond **CartoDB Positron** (gratuit, sans clé API, sans limite d'utilisation) — pas besoin de la clé Google Maps.
- Le CSV est lu et parsé avec **PapaParse**, directement dans le navigateur (aucun serveur/backend requis).
- La recherche filtre en temps réel `Nom du lieu`, `Adresse` et `Informations`, insensible aux accents et à la casse.
- L'application fonctionne entièrement côté client : aucune donnée n'est stockée, elle est relue depuis Google Sheets à chaque chargement de page.
