# DM Prospection

Application locale de prospection DM (Threads, Instagram, Twitter/X) — usage strictement
personnel, mono-utilisateur, tourne uniquement en local. **Aucun envoi automatisé** : l'app
prépare le message (variables remplies, script assigné en rotation A/B), tu cliques
"Copier", tu vas coller et envoyer toi-même dans Threads/Instagram/Twitter, puis tu cliques
"Suivant". L'app ne se connecte à aucun compte, aucune API de messagerie, aucun réseau social.

## Stack

- **Front** : Vite + React + TypeScript + Tailwind CSS
- **Back** : Express (local) + SQLite via `better-sqlite3`
- Les deux tournent ensemble avec `npm run dev` (front sur `:5173`, API sur `:3001`, proxy Vite sur `/api`)

## Démarrage

```bash
npm install
npm run dev
```

Ouvre `http://localhost:5173` (aussi accessible depuis ton téléphone sur le même réseau via
`http://<ip-de-ta-machine>:5173`, ou utilise `npm run dev -- --host` côté client si besoin).
Les données sont stockées dans `data/dm-tracker.sqlite3` (créé automatiquement, ignoré par git).

## Modèle de données

- **Produit** : `id`, `nom`, `objectif_dm_jour` (optionnel)
- **Script** : `id`, `produit_id`, `label`, `contenu` (variables `{prenom}`, `{detail}`, `{produit}`), `actif`
- **Prospect** : `id`, `produit_id`, `pseudo`, `plateforme`, `detail_personnalisation`, `statut`
  (`a_contacter` / `contacte` / `repondu` / `close` / `ignore`), `date_ajout`
- **Log** : `id`, `produit_id`, `script_id`, `prospect_id`, `plateforme`, `date`,
  `envoye`/`reponse`/`close` (booléens), `note`

## Fonctionnalités

- **Produits** : onglets en haut, créer/supprimer
- **Scripts** : créer/éditer/supprimer, activer/désactiver pour la rotation A/B, variables
  `{prenom}` `{detail}` `{produit}`
- **Générateur de messages A/B** : choisis un angle (douleur/bénéfice/curiosité/preuve
  sociale), génère 5 variantes qui varient longueur et structure (question ouverte,
  affirmation directe, référence à l'activité, ton formel/familier). Chaque variante peut
  être sauvegardée en un clic comme nouveau script.
- **Prospects** : ajout manuel ou **import CSV en masse** (colonnes `pseudo`, `plateforme`,
  `detail`), filtrable par plateforme/statut, changement de statut en ligne, dédoublonnage
  automatique
- **File d'exécution** (le cœur de l'app) : choisis produit + plateforme, l'app assigne
  chaque prospect "à contacter" à un script en rotation équilibrée (A/B/C/A/B/C...), affiche
  le message avec les variables déjà remplies, un prospect à la fois en plein écran. Bouton
  "Copier le message" → colle dans Threads → "Suivant" (marque contacté + log
  automatiquement). "Passer" pour sauter sans marquer, "Ignorer définitivement" pour exclure.
  Compteur de session visible.
- **Statuts** : marquer un prospect "répondu" ou "closé" depuis la liste des prospects met à
  jour automatiquement le log correspondant (pour le dashboard)
- **Dashboard par script** : total envoyés, taux de réponse, taux de close/répondants, taux
  de close global, filtrable par plateforme, meilleur script mis en avant (seuil 10 DM
  envoyés), tableau croisé script × plateforme, tendance hebdomadaire du taux de réponse
- **Journal** : historique de tous les logs, recherche, tri par colonne, cases à cocher
  envoyé/réponse/close, suppression
- **Export CSV** des logs, **sauvegarde/restauration JSON complète**

## Structure du projet

```
shared/types.ts        # types partagés front/back (Product, Script, Prospect, Log...)
server/
  db.ts                 # init SQLite + schéma + migrations idempotentes
  helpers.ts             # conversions booléens SQLite <-> TS
  index.ts               # serveur Express
  routes/                 # products, scripts, prospects (+bulk +contact), logs, export, backup
src/
  api/client.ts           # wrapper fetch vers l'API
  hooks/                  # useProducts, useScripts, useProspects, useLogs
  utils/
    metrics.ts             # calcul des taux et du meilleur script
    generator.ts           # banque de templates du générateur A/B
    template.ts             # remplissage des variables {prenom}/{detail}/{produit}
    csv.ts                  # parseur CSV pour l'import de prospects
  components/
    ProductTabs, ScriptManager, ScriptGenerator,
    ProspectList, ProspectImport,
    Queue,                  # file d'exécution plein écran
    Dashboard, ScriptCard, PlatformFilter, PlatformMatrix, TrendChart, DailyGoal,
    Journal, JournalRow, ExportButton, BackupControls
  App.tsx
data/                    # fichier SQLite local (créé au runtime, gitignored)
```

Pour ajouter une métrique : `src/utils/metrics.ts` + `src/components/Dashboard.tsx`.
Pour ajouter un angle ou des templates au générateur : `src/utils/generator.ts`.
Pour changer la logique de rotation A/B : `buildQueue()` dans `src/components/Queue.tsx`.

## Scripts npm

- `npm run dev` — lance le serveur API et le front en parallèle
- `npm run build` — build de production du front (typecheck + bundle)
- `npm run typecheck` — vérification TypeScript uniquement
- `npm run preview` — prévisualise le build de production
