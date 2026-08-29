import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "..", "data");
const DB_PATH = path.join(DATA_DIR, "dm-tracker.sqlite3");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL UNIQUE,
    objectif_dm_jour INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS scripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produit_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    contenu TEXT,
    actif INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS prospects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produit_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    pseudo TEXT NOT NULL,
    plateforme TEXT NOT NULL CHECK (plateforme IN ('Instagram', 'Threads', 'Twitter')),
    detail_personnalisation TEXT,
    statut TEXT NOT NULL DEFAULT 'a_contacter'
      CHECK (statut IN ('a_contacter', 'contacte', 'repondu', 'close', 'ignore')),
    date_ajout TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produit_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    script_id INTEGER NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
    prospect_id INTEGER REFERENCES prospects(id) ON DELETE SET NULL,
    plateforme TEXT NOT NULL CHECK (plateforme IN ('Instagram', 'Threads', 'Twitter')),
    date TEXT NOT NULL,
    envoye INTEGER NOT NULL DEFAULT 0,
    reponse INTEGER NOT NULL DEFAULT 0,
    close INTEGER NOT NULL DEFAULT 0,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- table héritée d'une version antérieure de l'app (saisie agrégée), non utilisée par le code actuel
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produit_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    script_id INTEGER NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
    plateforme TEXT NOT NULL CHECK (plateforme IN ('Instagram', 'Threads', 'Twitter')),
    date TEXT NOT NULL,
    nb_dm_envoyes INTEGER NOT NULL DEFAULT 0,
    nb_reponses INTEGER NOT NULL DEFAULT 0,
    nb_deals_closes INTEGER NOT NULL DEFAULT 0,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_scripts_produit ON scripts(produit_id);
  CREATE INDEX IF NOT EXISTS idx_prospects_produit ON prospects(produit_id);
  CREATE INDEX IF NOT EXISTS idx_prospects_statut ON prospects(statut);
  CREATE INDEX IF NOT EXISTS idx_prospects_plateforme ON prospects(plateforme);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_prospects_dedupe ON prospects(produit_id, pseudo, plateforme);
  CREATE INDEX IF NOT EXISTS idx_logs_produit ON logs(produit_id);
  CREATE INDEX IF NOT EXISTS idx_logs_script ON logs(script_id);
  CREATE INDEX IF NOT EXISTS idx_logs_prospect ON logs(prospect_id);
  CREATE INDEX IF NOT EXISTS idx_logs_date ON logs(date);
`);

const productColumns = db.prepare("PRAGMA table_info(products)").all() as { name: string }[];
if (!productColumns.some((c) => c.name === "objectif_dm_jour")) {
  db.exec("ALTER TABLE products ADD COLUMN objectif_dm_jour INTEGER");
}

const scriptColumns = db.prepare("PRAGMA table_info(scripts)").all() as { name: string }[];
if (!scriptColumns.some((c) => c.name === "actif")) {
  db.exec("ALTER TABLE scripts ADD COLUMN actif INTEGER NOT NULL DEFAULT 1");
}
