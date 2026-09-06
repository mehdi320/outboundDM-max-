// Copilote d'envoi Threads — AUCUN envoi automatisé.
//
// Ce script ouvre chaque profil dans un vrai navigateur visible, affiche le
// message déjà rédigé pour que tu le copies toi-même, et attend une touche
// pour savoir ce que tu as fait. Il n'écrit jamais dans le champ de message
// Threads, ne clique jamais sur "Envoyer", ne simule aucun comportement
// humain : le rythme et l'action d'envoi restent entièrement les tiens.
//
// Usage : npm start -- --csv data/prospects.csv --batch 5

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { loadProspects } = require('./csv');
const { createRunLogger } = require('./logger');
const { askAction } = require('./prompt');

const DEFAULT_COOKIES_PATH = path.join(__dirname, '..', 'cookies', 'threads-session.json');
const DEFAULT_CSV_PATH = path.join(__dirname, '..', 'data', 'prospects.csv');
const DEFAULT_LOG_DIR = path.join(__dirname, '..', 'logs');
const DEFAULT_BATCH_SIZE = 5;

function parseArgs(argv) {
  const args = { csv: DEFAULT_CSV_PATH, batch: DEFAULT_BATCH_SIZE, cookies: DEFAULT_COOKIES_PATH };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--csv') args.csv = path.resolve(argv[++i]);
    else if (argv[i] === '--batch') args.batch = Math.max(1, parseInt(argv[++i], 10) || DEFAULT_BATCH_SIZE);
    else if (argv[i] === '--cookies') args.cookies = path.resolve(argv[++i]);
  }
  return args;
}

function printProspect(prospect, index, total) {
  const bar = '─'.repeat(60);
  console.log(`\n${bar}`);
  console.log(`Prospect ${index + 1}/${total} — ${prospect.nom} (${prospect.contexte})`);
  console.log(prospect.url_profil_threads);
  console.log(bar);
  console.log('Message à copier :\n');
  console.log(prospect.message_personnalise);
  console.log(`\n${bar}`);
}

async function openProfile(context, url) {
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // Sélecteur de vérification uniquement — on ne clique et n'écrit rien ici,
  // on veut juste savoir si la page a bien chargé un profil avant de te
  // laisser copier/coller le message. Threads change régulièrement ses
  // classes CSS générées ; si ce sélecteur casse un jour, l'outil continue
  // (avertissement seulement) car il n'est pas requis pour fonctionner.
  const PROFILE_LOADED_SELECTOR = 'header, [role="main"]';
  try {
    await page.waitForSelector(PROFILE_LOADED_SELECTOR, { timeout: 8000 });
  } catch {
    console.log('⚠️  Impossible de confirmer le chargement du profil (interface Threads '
      + 'peut-être modifiée). Vérifie visuellement dans le navigateur avant de continuer.');
  }

  return page;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(args.cookies)) {
    console.error(`Aucune session trouvée (${args.cookies}).`);
    console.error('Lance d\'abord : npm run save-session');
    process.exit(1);
  }

  const allProspects = loadProspects(args.csv);
  const batch = allProspects.slice(0, args.batch);

  if (allProspects.length > batch.length) {
    console.log(`CSV : ${allProspects.length} prospects trouvés, seuls les ${batch.length} `
      + 'premiers seront traités cette exécution (limite de batch).');
  }

  const { filePath: logPath, log } = createRunLogger(args.logDir || DEFAULT_LOG_DIR);
  console.log(`Log de cette exécution : ${logPath}`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ storageState: args.cookies });

  const counts = { envoye: 0, passe: 0, erreur: 0 };
  let stoppedEarly = false;

  for (let i = 0; i < batch.length; i += 1) {
    const prospect = batch[i];
    const page = await openProfile(context, prospect.url_profil_threads);
    printProspect(prospect, i, batch.length);

    const action = await askAction();

    if (action === 'quitter') {
      stoppedEarly = true;
      await page.close();
      break;
    }

    log(prospect, action);
    counts[action] += 1;
    await page.close();
  }

  await browser.close();

  console.log('\n--- Résumé ---');
  console.log(`Envoyés : ${counts.envoye}`);
  console.log(`Passés  : ${counts.passe}`);
  console.log(`Erreurs : ${counts.erreur}`);
  if (stoppedEarly) console.log('(Arrêt manuel avant la fin du lot)');
  console.log(`Log complet : ${logPath}`);
}

main().catch((err) => {
  console.error('Erreur :', err.message);
  process.exit(1);
});
