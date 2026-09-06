# Threads DM Copilot

Outil autonome d'assistance à la prospection Threads, à faible volume, pour bêta testeurs
d'un SaaS de facturation électronique BTP (cible : agences, media buyers).

**Ce que fait l'outil** : il ouvre le profil Threads de chaque prospect dans un vrai
navigateur, affiche le message déjà rédigé (généré en amont, ailleurs) prêt à copier, et
attend que tu confirmes toi-même l'action au clavier.

**Ce que l'outil ne fait jamais** : il n'écrit rien dans le champ de message Threads, ne
clique jamais sur "Envoyer", ne gère aucun login/mot de passe/2FA, ne simule aucun
comportement humain (pas de mouvement de souris, pas de vitesse de frappe, pas de gestion
de fingerprint). L'envoi reste un acte 100% humain, un par un, à ton rythme.

## Installation

```bash
cd threads-dm-copilot
npm install
```

`npm install` télécharge aussi Chromium pour Playwright (via `postinstall`).

## 1. Capturer ta session Threads

Le script ne gère aucun identifiant. Tu te connectes toi-même dans un navigateur ouvert
par Playwright, une seule fois :

```bash
npm run save-session
```

Une fenêtre Chromium s'ouvre sur la page de login Threads. Connecte-toi normalement
(identifiants + 2FA si demandé), attends d'être sur ton fil, puis reviens dans le
terminal et appuie sur Entrée. La session (cookies) est sauvegardée dans
`cookies/threads-session.json` — ce fichier est dans `.gitignore`, il ne sera jamais commit.

Si ta session expire (déconnexion, changement de mot de passe), relance simplement
`npm run save-session` pour la renouveler.

**Alternative manuelle** : si tu préfères exporter les cookies toi-même depuis les
DevTools ou une extension type "Cookie-Editor", le fichier doit respecter le format
`storageState` de Playwright (un objet JSON avec les clés `cookies` et `origins`) —
voir [la doc Playwright](https://playwright.dev/docs/auth#reuse-signed-in-state) pour le
détail exact du schéma.

## 2. Préparer le CSV de prospects

Copie `data/prospects.example.csv` vers `data/prospects.csv` (ignoré par git) et
remplis-le. Colonnes obligatoires :

| Colonne | Description |
|---|---|
| `nom` | Nom du prospect, pour l'affichage et le log |
| `url_profil_threads` | URL complète du profil (`https://www.threads.net/@pseudo`) |
| `contexte` | `agence` ou `media_buyer` (libre, sert juste au log/affichage) |
| `message_personnalise` | Le message déjà rédigé, prêt à envoyer tel quel |

Le sourcing des profils et la rédaction des messages se font ailleurs — cet outil ne
scrape rien et ne génère aucun texte.

## 3. Lancer un lot

```bash
npm start -- --csv data/prospects.csv --batch 5
```

- `--batch` (défaut 5) : nombre max de prospects traités dans cette exécution. Si le
  CSV en contient plus, seuls les N premiers sont pris ; le reste attend le prochain run.
- `--cookies` : chemin vers le fichier de session si tu veux en utiliser un autre que
  `cookies/threads-session.json`.

Pour chaque prospect, dans l'ordre :

1. Le navigateur ouvre son profil Threads.
2. Le terminal affiche le message à copier.
3. Tu vas coller et envoyer toi-même dans Threads (ou pas).
4. Tu reviens dans le terminal et tapes une touche :
   - `e` → envoyé
   - `p` → passer (rien fait, prospect à retraiter plus tard)
   - `x` → erreur (profil introuvable, compte suspendu, etc.)
   - `q` → quitter (arrête le lot en cours, ce qui a déjà été traité reste dans le log)

Aucune boucle continue : l'outil s'arrête de lui-même une fois le lot terminé ou la liste
épuisée.

## Logs

Chaque exécution écrit un fichier CSV horodaté dans `logs/` (`run_<date>.csv`), avec une
ligne par prospect traité : `timestamp,nom,url_profil_threads,contexte,statut`. Ces fichiers
sont ignorés par git (ils contiennent des données de prospects). Utilise-les pour calculer
ton taux de réponse une fois les retours connus (croise avec tes réponses reçues).

## Gérer les doublons entre deux runs

L'outil ne garde pas d'état entre deux exécutions : si tu relances avec le même CSV, il
retraite les mêmes lignes depuis le début. Retire du CSV les prospects déjà "envoyés"
avant de relancer, ou garde une colonne de suivi de ton côté.

## Structure

```
scripts/save-session.js   # capture unique de la session (login manuel, aucune gestion de mdp/2FA)
src/run.js                # boucle principale du copilote
src/csv.js                # chargement + validation du CSV
src/logger.js             # écriture du log horodaté
src/prompt.js             # attente de la validation clavier humaine
data/prospects.example.csv
cookies/                  # session Playwright, gitignored
logs/                     # logs d'exécution, gitignored
```

## Sécurité

- `cookies/*.json` et `data/*.csv` sont dans `.gitignore` dès le départ — ne les commit
  jamais, ne les partage jamais (les cookies donnent un accès direct à ton compte Threads).
- Aucun mot de passe ni secret n'est manipulé par le code : la seule authentification vient
  du fichier de session que tu génères toi-même.

## Fragilité connue

Threads change régulièrement ses classes CSS générées automatiquement. Le seul sélecteur
DOM utilisé (`src/run.js`, fonction `openProfile`) sert uniquement à vérifier que la page
a bien chargé avant de te laisser copier le message — s'il casse, l'outil affiche un
avertissement mais continue de fonctionner (aucune action automatique n'en dépend).
