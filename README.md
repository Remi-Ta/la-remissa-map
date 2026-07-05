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
└── README.md
```

**Pourquoi si peu de fichiers ?** Les allers-retours précédents ont montré que le vrai problème n'était pas technique mais la synchronisation : remplacer un fichier JS sans remplacer le HTML qui va avec (ou l'inverse) casse tout silencieusement. Avec tout regroupé dans `index.html` et `admin.html`, il n'y a plus qu'un seul fichier à remplacer par page — impossible de se retrouver avec une version dépareillée.

Seule dépendance externe restante : **Leaflet** (la carte), chargée depuis son CDN officiel `unpkg.com` — le plus fiable qui soit, utilisé par des millions de sites. PapaParse et le clustering sont maintenant intégrés directement dans le HTML.

## ⚠️ Le fichier `.nojekyll`

Sans lui, GitHub Pages essaie de traiter vos fichiers avec Jekyll, ce qui peut faire échouer le déploiement ("Failing after 8s") à cause de séquences de caractères dans le code minifié. Il doit être **présent à la racine du dépôt**, vide. Comme son nom commence par un point, vérifiez bien qu'il a été poussé (certains explorateurs de fichiers le masquent).

## Fond de carte : Thunderforest.Atlas

Le code est configuré pour utiliser le fond **Thunderforest.Atlas**, mais Thunderforest nécessite une **clé API gratuite** (contrairement à CartoDB) :

1. Créez un compte gratuit sur [thunderforest.com/pricing](https://www.thunderforest.com/pricing/)
2. Récupérez votre clé API
3. Ouvrez `index.html`, cherchez la ligne :
   ```js
   const THUNDERFOREST_API_KEY = ""; // <-- collez votre clé ici
   ```
4. Collez votre clé entre les guillemets

**Tant qu'aucune clé n'est renseignée**, l'app bascule automatiquement sur le fond **CartoDB Positron** (gratuit, sans clé) pour que la carte reste utilisable. C'est très probablement ce qui causait le filigrane que vous avez vu : les tuiles Thunderforest affichent un filigrane "à usage d'évaluation" tant qu'aucune clé valide n'est fournie — avec une vraie clé, ce filigrane disparaît.

## Mettre à jour vos lieux

**Option A — page admin** : ouvrez `admin.html`, importez le CSV existant, éditez via le formulaire, téléchargez le CSV, remplacez `data/lieux.csv` dans votre dépôt.

**Option B — édition directe sur GitHub** : ouvrez `data/lieux.csv` sur github.com, crayon "Edit this file", modifiez, "Commit changes".

Colonnes obligatoires, exactement : `Nom du lieu`, `Catégorie`, `Statut`, `Adresse`, `URL Google Maps`, `Photos`, `Informations`, `Site web`, `Date d'ajout`, `Latitude`, `Longitude`.

## Déploiement

1. Poussez les 5 éléments ci-dessus vers un dépôt GitHub public (`.nojekyll` inclus, bien vérifier qu'il y est).
2. **Settings > Pages > Source** : branche `main`, dossier `/ (root)`.
3. Site : `https://votre-nom.github.io/nom-du-depot/` — admin : `.../admin.html`.

## Personnaliser

Tout se trouve directement dans la balise `<script>` de `index.html` (recherchez ces noms avec Ctrl+F) :
- `CATEGORY_COLORS` / `STATUS_STYLES` — couleurs
- `WELCOME_MESSAGES` — messages d'accueil aléatoires
- `DEFAULT_CENTER` / `DEFAULT_ZOOM` — centrage carte (actuellement Île-de-France)
- `THUNDERFOREST_API_KEY` — clé API du fond de carte
- `maxClusterRadius` (dans `initMap()`) — sensibilité du regroupement en clusters

La couleur d'accent (`#B34E6B`) est dans la balise `<style>`, variable `--color-primary`.
