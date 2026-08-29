# DM Tracker

Application locale de suivi de prospection DM (Instagram, Threads, Twitter/X).
Usage strictement personnel, mono-utilisateur, tourne uniquement en local. Aucune donnée ne quitte ta machine.

## Stack

- **Front** : Vite + React + TypeScript + Tailwind CSS
- **Back** : Express (local) + SQLite via `better-sqlite3`
- Les deux tournent ensemble avec `npm run dev` (front sur `:5173`, API sur `:3001`, proxy Vite sur `/api`)

## Démarrage

```bash
npm install
npm run dev
```

Ouvre `http://localhost:5173`. Les données sont stockées dans `data/dm-tracker.sqlite3` (créé automatiquement au premier lancement, ignoré par git).

## Modèle de données

- **Produit** : `id`, `nom`
- **Script** : `id`, `produit_id`, `label`, `contenu` (texte libre optionnel)
- **Entrée journalière** : `id`, `produit_id`, `script_id`, `plateforme`, `date`, `nb_dm_envoyes`, `nb_reponses`, `nb_deals_closes`, `note`

## Fonctionnalités

- Onglets produits (créer/supprimer)
- Gestion des scripts par produit (variantes A/B/C, texte du message conservé)
- Formulaire d'ajout d'entrée (produit/script/plateforme/date pré-remplie à aujourd'hui + les 3 chiffres + note)
- Dashboard par script : total envoyés, taux de réponse, taux de close/répondants, taux de close global, avec mise en avant automatique du meilleur script (taux de réponse le plus haut, seuil d'éligibilité de 10 DM envoyés)
- Filtre par plateforme sur le dashboard
- Journal chronologique éditable et supprimable, ligne par ligne
- Export CSV de toutes les entrées

## Structure du projet

```
shared/types.ts        # types partagés front/back (Product, Script, Entry...)
server/
  db.ts                 # init SQLite + schéma
  index.ts              # serveur Express
  routes/                # products.ts, scripts.ts, entries.ts, export.ts
src/
  api/client.ts          # wrapper fetch vers l'API
  hooks/                 # useProducts, useScripts, useEntries
  utils/metrics.ts       # calcul des taux et du meilleur script
  components/             # ProductTabs, ScriptManager, EntryForm, Dashboard,
                          # ScriptCard, PlatformFilter, Journal, JournalRow, ExportButton
  App.tsx
data/                    # fichier SQLite local (créé au runtime, gitignored)
```

Pour ajouter une métrique ou un filtre : `src/utils/metrics.ts` et `src/components/Dashboard.tsx` sont les points d'entrée naturels. Pour ajouter un champ au modèle : `shared/types.ts` + migration dans `server/db.ts` + route correspondante.

## Scripts npm

- `npm run dev` — lance le serveur API et le front en parallèle
- `npm run build` — build de production du front (typecheck + bundle)
- `npm run typecheck` — vérification TypeScript uniquement
- `npm run preview` — prévisualise le build de production
