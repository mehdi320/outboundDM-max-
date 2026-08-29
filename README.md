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
- **Générateur de variantes A/B** : colle un message déjà rédigé (message de référence) — il
  devient automatiquement **Script A**. L'app génère 5 variantes qui gardent le même fond
  mais varient la forme sur deux axes indépendants (règle du skill `dm-prospecting` :
  ne jamais faire varier le ton seul) :
  - **longueur** : courte (1-2 phrases) / développée (3-5 phrases)
  - **structure** : question ouverte, affirmation directe, référence à l'activité

  Le ton (formel/familier) n'est appliqué qu'en plus d'un changement de longueur ou de
  structure, jamais seul — une variante identique en longueur/structure avec juste des
  mots swappés n'est pas un vrai test A/B. Chaque variante se sauvegarde en un clic comme
  Script B, C, D... Aucun contenu n'est inventé : le texte de base reste le tien, seule la
  forme est recomposée. Chaque variante applique automatiquement des bonnes pratiques de
  cold outreach B2B (voir `src/utils/copywritingRules.ts`, basé sur le skill Claude Code
  `.claude/skills/dm-prospecting/`) :
  - un seul CTA par message, toujours à faible friction (question ouverte type "ça te dit ?"
    — les demandes d'appel/rdv/créneau sont détectées et retirées)
  - pas de jargon corporate, de formules IA génériques, de flatterie ("j'adore ton
    contenu"), de langage d'urgence ("plus que quelques places") ni de détail de prix dans
    l'ouverture (à garder pour une relance dédiée)
  - pas plus d'un emoji par message
  - recentrage automatique sur le prospect si le "je" domine trop sur le "tu/vous"

  Ce qui ne peut pas être garanti mécaniquement (ex: `{detail}` vraiment connecté au
  problème du prospect, et non juste décoratif, ou un message trop long) est signalé par
  un lint visible sous chaque variante — à vérifier avant de sauvegarder/envoyer, comme
  tout le reste dans cette app.
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
Pour ajouter une structure/combinaison au générateur de variantes : `src/utils/generator.ts`.
Pour changer la logique de rotation A/B : `buildQueue()` dans `src/components/Queue.tsx`.

## Scripts npm

- `npm run dev` — lance le serveur API et le front en parallèle
- `npm run build` — build de production du front (typecheck + bundle)
- `npm run typecheck` — vérification TypeScript uniquement
- `npm run preview` — prévisualise le build de production
