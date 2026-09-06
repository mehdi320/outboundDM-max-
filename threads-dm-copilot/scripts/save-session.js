// Capture unique de la session Threads.
//
// Ce script n'automatise AUCUN login : il ouvre un vrai navigateur, TU te
// connectes toi-même (identifiants + 2FA si demandé), puis tu appuies sur
// Entrée dans le terminal quand tu es sur ton fil Threads. Le script se
// contente de sauvegarder l'état de session (cookies + storage) que
// Playwright pourra réutiliser ensuite pour ouvrir des pages déjà connecté.
//
// Usage : npm run save-session

const path = require('path');
const readline = require('readline');
const { chromium } = require('playwright');

const COOKIES_PATH = path.join(__dirname, '..', 'cookies', 'threads-session.json');

function waitForEnter(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, () => { rl.close(); resolve(); }));
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://www.threads.net/login');

  console.log('\nConnecte-toi manuellement à Threads dans la fenêtre ouverte (identifiants + 2FA si besoin).');
  await waitForEnter('Une fois connecté et sur ton fil Threads, reviens ici et appuie sur Entrée...\n');

  await context.storageState({ path: COOKIES_PATH });
  console.log(`Session sauvegardée dans ${COOKIES_PATH}`);
  console.log('Ce fichier est ignoré par git (.gitignore) — ne le partage jamais.');

  await browser.close();
}

main().catch((err) => {
  console.error('Erreur lors de la capture de session :', err);
  process.exit(1);
});
