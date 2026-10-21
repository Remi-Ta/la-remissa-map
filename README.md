# La Rémissa Map

Application mobile-first qui affiche vos lieux sur une carte et dans une liste de fiches façon Softr.

## Structure — volontairement réduite à 5 fichiers

```
remissa-map/
├── .nojekyll          # empêche GitHub Pages d'utiliser Jekyll (obligatoire, voir plus bas)
├── index.html          # Application complète : HTML + CSS + JS, tout dans ce seul fichier
├── admin.html          # Page d'administration : HTML + CSS + JS, tout dans ce seul fichier
├── data/
│   └── lieux.csv        # VOS DONNÉES
├── photos/              # VOS PHOTOS (12.jpg, 13.jpg…) — à créer
└── README.md
```

**Pourquoi si peu de fichiers ?** Les allers-retours précédents ont montré que le vrai problème n'était pas technique mais la synchronisation : remplacer un fichier JS sans remplacer le HTML qui va avec (ou l'inverse) casse tout silencieusement. Avec tout regroupé dans `index.html` et `admin.html`, il n'y a plus qu'un seul fichier à remplacer par page — impossible de se retrouver avec une version dépareillée.

Seule dépendance externe restante : **MapLibre GL JS** (la carte), chargée depuis `unpkg.com` — le plus fiable qui soit, utilisé par des millions de sites. PapaParse est intégré directement dans le HTML.

## ⚠️ Le fichier `.nojekyll`

Sans lui, GitHub Pages essaie de traiter vos fichiers avec Jekyll, ce qui peut faire échouer le déploiement ("Failing after 8s") à cause de séquences de caractères dans le code minifié. Il doit être **présent à la racine du dépôt**, vide. Comme son nom commence par un point, vérifiez bien qu'il a été poussé (certains explorateurs de fichiers le masquent).

## Fond de carte : MapLibre (gris neutre, sans clé API)

La carte utilise **MapLibre GL JS** avec le style vectoriel gris clair **CARTO Positron** : gratuit, sans clé API, sans quota à gérer. Si ce style ne répond pas, l'app bascule automatiquement sur des tuiles raster CARTO grises, donc la carte a toujours un fond. Les pins (colorés par catégorie) et les clusters sont dessinés directement par MapLibre, ce qui est plus fluide sur mobile qu'avec des marqueurs HTML.

Si une photo ne se charge pas (lien expiré, hébergeur indisponible), la fiche affiche l'encart « Pas de photo » au lieu d'une image cassée.

## Photos des lieux

Les liens de photos Google Maps expirent : le plus fiable est d'héberger les photos dans le dépôt.

1. Téléchargez la photo sur votre ordinateur et renommez-la avec un numéro, en minuscules : `12.jpg`.
2. Dans le dépôt GitHub, créez un dossier `photos/` (la première fois) puis glissez-y l'image (Add file > Upload files).
3. Dans la colonne `Photos` du CSV, écrivez `12` (ou `12.jpg`) : l'app va chercher `photos/12.jpg`.

Sans extension, l'app essaie `.jpg`, puis `.jpeg`, `.png`, `.webp`. GitHub est sensible à la casse : `12.JPG` et `12.jpg` sont deux fichiers différents. Une URL complète reste acceptée. Si l'image est introuvable, la fiche affiche « Pas de photo ». Conseil : réduire les photos à environ 800 px de large (moins de 200 Ko) pour un affichage rapide sur mobile.

## Mettre à jour vos lieux

**Option A — page admin** : ouvrez `admin.html`, importez le CSV existant, éditez via le formulaire, téléchargez le CSV, remplacez `data/lieux.csv` dans votre dépôt.

**Option B — édition directe sur GitHub** : ouvrez `data/lieux.csv` sur github.com, crayon "Edit this file", modifiez, "Commit changes".

Colonnes obligatoires, exactement : `Nom du lieu`, `Catégorie`, `Statut`, `Adresse`, `URL Google Maps`, `Photos`, `Informations`, `Site web`, `Testé le`, `Latitude`, `Longitude`.

## Déploiement

1. Poussez les 5 éléments ci-dessus vers un dépôt GitHub public (`.nojekyll` inclus, bien vérifier qu'il y est).
2. **Settings > Pages > Source** : branche `main`, dossier `/ (root)`.
3. Site : `https://votre-nom.github.io/nom-du-depot/` — admin : `.../admin.html`.

## Personnaliser

Tout se trouve directement dans la balise `<script>` de `index.html` (recherchez ces noms avec Ctrl+F) :
- `CATEGORY_COLORS` / `STATUS_STYLES` — couleurs
- `WELCOME_MESSAGES` — messages d'accueil aléatoires
- `DEFAULT_CENTER` / `DEFAULT_ZOOM` — centrage carte (actuellement Île-de-France)
- `clusterRadius` / `clusterMaxZoom` (dans `setupMapLayers()`) — sensibilité du regroupement en clusters

La couleur d'accent (`#B34E6B`) est dans la balise `<style>`, variable `--color-primary`.
