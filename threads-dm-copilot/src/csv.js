const fs = require('fs');
const { parse } = require('csv-parse/sync');

const REQUIRED_COLUMNS = ['nom', 'url_profil_threads', 'contexte', 'message_personnalise'];

function loadProspects(csvPath) {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV introuvable : ${csvPath}`);
  }

  const raw = fs.readFileSync(csvPath, 'utf8');
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true });

  if (rows.length === 0) {
    throw new Error('CSV vide.');
  }

  const headers = Object.keys(rows[0]);
  const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    throw new Error(`Colonnes manquantes dans le CSV : ${missing.join(', ')}`);
  }

  rows.forEach((row, i) => {
    REQUIRED_COLUMNS.forEach((col) => {
      if (!row[col] || row[col].trim() === '') {
        throw new Error(`Ligne ${i + 2} du CSV : champ "${col}" vide.`);
      }
    });
  });

  return rows;
}

module.exports = { loadProspects, REQUIRED_COLUMNS };
