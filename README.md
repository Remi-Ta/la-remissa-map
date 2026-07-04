# La Rémissa Map

Application mobile-first (HTML / CSS / JS pur, aucune dépendance à installer) qui affiche vos lieux sur une carte Leaflet (fond OpenStreetMap / CartoDB, 100% gratuit et illimité) et dans une liste de fiches façon Softr.

## Comment fonctionnent les données

Après plusieurs essais avec une lecture en direct de Google Sheets (bloquée par des restrictions CORS propres à GitHub Pages), la solution retenue est plus simple et 100% fiable :

**Vos lieux vivent dans un fichier `data/lieux.csv`, à l'intérieur même de votre dépôt GitHub.**

Ça élimine tout problème réseau : le fichier est chargé depuis le même site (aucune requête externe), donc ça marche toujours, partout, sans configuration.

## 1. Mettre à jour vos lieux — 3 façons possibles

### Option A — La page admin incluse (recommandé, la plus simple)

1. Ouvrez `admin.html` (en local ou une fois déployé, à l'adresse `.../admin.html`).
2. Cliquez sur **"Importer un fichier CSV"** pour charger `data/lieux.csv` existant (ou un export de votre Google Sheets), et continuez à l'éditer.
3. Ajoutez / modifiez / supprimez vos lieux dans le formulaire et le tableau (tout est sauvegardé automatiquement dans votre navigateur pendant que vous travaillez).
4. Cliquez sur **"Télécharger le CSV"**.
5. Remplacez le fichier `data/lieux.csv` de votre dépôt par celui téléchargé (sur github.com : ouvrez `data/lieux.csv`, bouton crayon "Edit this file", supprimez le contenu, collez le nouveau, "Commit changes" — ou bien "Add file > Upload files" en glissant le fichier téléchargé).

⚠️ La page admin utilise le stockage local de votre navigateur (`localStorage`) : elle ne synchronise rien automatiquement avec GitHub. C'est un outil pour préparer confortablement votre fichier CSV avant de le publier — pensez à exporter avant de fermer l'onglet si vous n'avez pas fini.

### Option B — Éditer le CSV directement sur GitHub

1. Sur github.com, ouvrez `data/lieux.csv`.
2. Bouton crayon (Edit this file).
3. Modifiez le texte directement (format CSV : une ligne = un lieu, valeurs entre guillemets).
4. "Commit changes".

### Option C — Continuer à utiliser Google Sheets comme brouillon

Tenez votre tableau Google Sheets comme avant, puis :
`Fichier > Télécharger > Valeurs séparées par des virgules (.csv)`, renommez le fichier téléchargé en `lieux.csv`, remplacez-le dans `data/` de votre dépôt (Option A étape 5, ou Option B).

Dans tous les cas, gardez **exactement** les mêmes en-têtes de colonnes :
`Nom du lieu`, `Catégorie`, `Statut`, `Adresse`, `URL Google Maps`, `Photos`, `Informations`, `Site web`, `Date d'ajout`, `Latitude`, `Longitude`.

La colonne `Latitude`/`Longitude` doit contenir des nombres décimaux (ex : `48.8566`). Les lignes sans coordonnées valides s'affichent quand même dans la liste, mais pas sur la carte.

La colonne `Photos` accepte une URL brute, ou le format Softr `nomfichier.png (https://...)` — la première URL trouvée dans le texte est utilisée.

## 2. Tester en local

Lancez un petit serveur local (nécessaire ici car le navigateur bloque parfois la lecture de fichiers locaux en `fetch` sans serveur) :
```
npx serve .
```
puis ouvrez l'URL affichée.

## 3. Héberger gratuitement sur GitHub Pages

1. Créez un dépôt GitHub (public) et poussez-y tout le contenu de ce dossier (`index.html`, `admin.html`, `css/`, `js/`, `data/`).
2. Dans le dépôt : **Settings > Pages > Source**, choisissez la branche `main` et le dossier `/ (root)`.
3. Votre app sera disponible à `https://votre-nom.github.io/nom-du-depot/`, et l'admin à `https://votre-nom.github.io/nom-du-depot/admin.html`.

💡 Pensez à ne pas partager publiquement le lien `admin.html` si vous ne voulez pas que d'autres personnes puissent voir/modifier le formulaire (il n'y a pas de mot de passe — n'importe qui connaissant l'URL peut y accéder, mais personne ne peut modifier vos données réelles sans faire elle-même un commit sur votre dépôt GitHub).

## 4. Personnaliser

- **Couleurs des catégories / statuts** : tout est centralisé en haut de `js/app.js` (`CATEGORY_COLORS`, `STATUS_STYLES`) et repris automatiquement dans `css/style.css`.
- **Suggestions de catégories/statuts dans l'admin** : `CATEGORY_SUGGESTIONS` / `STATUS_SUGGESTIONS` dans `js/admin.js`.
- **Messages de bienvenue aléatoires** : liste `WELCOME_MESSAGES` dans `js/app.js`.
- **Centre par défaut de la carte** : `DEFAULT_CENTER` / `DEFAULT_ZOOM` dans `js/app.js`.
- **Couleur des boutons/accent** : variable CSS `--color-primary` dans `css/style.css` (actuellement `#B34E6B`).

## Structure des fichiers

```
remissa-map/
├── index.html          # Application principale (header, recherche, carte, liste, modale)
├── admin.html           # Page d'administration (formulaire + import/export CSV)
├── css/
│   ├── style.css        # Charte graphique principale
│   └── admin.css        # Styles additionnels pour l'admin
├── js/
│   ├── app.js            # Chargement du CSV + logique carte/filtres/recherche/modale
│   └── admin.js          # Logique du formulaire admin (localStorage, import/export CSV)
├── data/
│   └── lieux.csv         # VOS DONNÉES — à mettre à jour régulièrement
└── README.md
```

## Notes techniques

- La carte utilise **Leaflet.js** avec le fond **CartoDB Positron** (gratuit, sans clé API, sans limite d'utilisation).
- Le CSV est lu et parsé avec **PapaParse**, directement dans le navigateur (aucun serveur/backend requis).
- La recherche filtre en temps réel `Nom du lieu`, `Adresse` et `Informations`, insensible aux accents et à la casse.
- Aucune base de données externe, aucun serveur : tout est statique, donc gratuit et hébergeable n'importe où (GitHub Pages, Netlify, etc.).
