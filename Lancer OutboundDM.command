#!/bin/bash
# Double-clic (Mac) : installe les dépendances au premier lancement, démarre l'app et ouvre le navigateur.
cd "$(dirname "$0")"
if ! command -v npm >/dev/null; then echo "Node.js n'est pas installé : télécharge-le sur https://nodejs.org puis relance."; read -r; exit 1; fi
[ -d node_modules ] || npm install
npm start
