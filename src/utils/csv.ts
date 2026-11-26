import type { NewProspect, Platform } from "@shared/types";
import { parseProfileLink } from "@/utils/profileLink";

const PLATFORM_ALIASES: Record<string, Platform> = {
  instagram: "Instagram",
  insta: "Instagram",
  ig: "Instagram",
  threads: "Threads",
  twitter: "Twitter",
  x: "Twitter",
};

function normalizePlatform(raw: string): Platform | null {
  const key = raw.trim().toLowerCase();
  return PLATFORM_ALIASES[key] ?? null;
}

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\s-]+/g, "_");
}

const PSEUDO_HEADERS = ["pseudo", "username", "handle", "compte", "nom_utilisateur", "user"];
const PRENOM_HEADERS = ["prenom", "first_name", "firstname", "name", "nom"];
const PLATEFORME_HEADERS = ["plateforme", "platform", "reseau", "network"];
const DETAIL_HEADERS = ["detail", "detail_personnalisation", "personnalisation", "note", "notes"];
const LIEN_HEADERS = ["lien", "url", "link", "profil", "profile", "lien_profil"];

// Excel/Sheets en français exportent avec ";" ; on détecte le séparateur sur la
// première ligne (hors guillemets) plutôt que de supposer ",".
function detectDelimiter(firstLine: string): string {
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0 };
  let inQuotes = false;
  for (const char of firstLine) {
    if (char === '"') inQuotes = !inQuotes;
    else if (!inQuotes && char in counts) counts[char]++;
  }
  const [best, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return count > 0 ? best : ",";
}

// Parseur CSV : champs entre guillemets, guillemets échappés, retours à la ligne
// dans un champ entre guillemets.
function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(current);
      current = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }
  row.push(current);
  rows.push(row);

  return rows.map((r) => r.map((f) => f.trim())).filter((r) => r.some((f) => f.length > 0));
}

export interface CsvParseResult {
  prospects: Omit<NewProspect, "produit_id">[];
  skipped: number;
  total: number;
}

export function parseProspectsCsv(text: string, defaultPlatform: Platform | null = null): CsvParseResult {
  const clean = text.replace(/^﻿/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
  const rows = parseCsv(clean, detectDelimiter(firstLine));
  if (rows.length === 0) return { prospects: [], skipped: 0, total: 0 };

  const header = rows[0].map(normalizeHeader);
  const find = (names: string[]) => header.findIndex((h) => names.includes(h));
  const pseudoIdx = find(PSEUDO_HEADERS);
  const lienIdx = find(LIEN_HEADERS);
  const hasHeader = pseudoIdx !== -1 || lienIdx !== -1;

  const idx = hasHeader
    ? {
        pseudo: pseudoIdx,
        lien: lienIdx,
        plateforme: find(PLATEFORME_HEADERS),
        detail: find(DETAIL_HEADERS),
        // "nom" ne compte comme prénom que s'il n'a pas servi de colonne pseudo
        prenom: header.findIndex((h, i) => PRENOM_HEADERS.includes(h) && i !== pseudoIdx),
      }
    : // sans en-tête : pseudo, plateforme, detail, prenom
      { pseudo: 0, lien: -1, plateforme: 1, detail: 2, prenom: 3 };

  const dataRows = hasHeader ? rows.slice(1) : rows;
  const prospects: Omit<NewProspect, "produit_id">[] = [];
  let skipped = 0;

  const get = (fields: string[], i: number) => (i >= 0 ? fields[i]?.trim() ?? "" : "");

  for (const fields of dataRows) {
    let pseudo = get(fields, idx.pseudo);
    const plateformeRaw = get(fields, idx.plateforme);
    let plateforme = plateformeRaw ? normalizePlatform(plateformeRaw) : null;

    // un lien de profil (dans la colonne lien OU collé dans la colonne pseudo)
    // fournit pseudo + plateforme
    const link = parseProfileLink(get(fields, idx.lien)) ?? parseProfileLink(pseudo);
    if (link) {
      pseudo = link.pseudo;
      plateforme = plateforme ?? link.plateforme;
    }

    plateforme = plateforme ?? defaultPlatform;
    pseudo = pseudo.replace(/^@/, "").trim();

    if (!pseudo || !plateforme) {
      skipped++;
      continue;
    }

    prospects.push({
      pseudo,
      prenom: get(fields, idx.prenom) || null,
      plateforme,
      detail_personnalisation: get(fields, idx.detail) || null,
    });
  }

  return { prospects, skipped, total: dataRows.length };
}
