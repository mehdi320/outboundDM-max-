const fs = require('fs');
const path = require('path');

function timestampForFilename() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function createRunLogger(logDir) {
  fs.mkdirSync(logDir, { recursive: true });
  const filePath = path.join(logDir, `run_${timestampForFilename()}.csv`);
  fs.writeFileSync(filePath, 'timestamp,nom,url_profil_threads,contexte,statut\n', 'utf8');

  function log(prospect, statut) {
    const timestamp = new Date().toISOString();
    const fields = [timestamp, prospect.nom, prospect.url_profil_threads, prospect.contexte, statut]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',');
    fs.appendFileSync(filePath, fields + '\n', 'utf8');
  }

  return { filePath, log };
}

module.exports = { createRunLogger };
