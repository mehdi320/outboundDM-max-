import type { NewProspect, Platform } from "@shared/types";

const PLATFORM_ALIASES: Record<string, Platform> = {
  instagram: "Instagram",
  ig: "Instagram",
  threads: "Threads",
  twitter: "Twitter",
  x: "Twitter",
};

function normalizePlatform(raw: string): Platform | null {
  const key = raw.trim().toLowerCase();
  return PLATFORM_ALIASES[key] ?? null;
}

// Parseur CSV minimal : gère les champs entre guillemets et les virgules échappées.
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

export interface CsvParseResult {
  prospects: Omit<NewProspect, "produit_id">[];
  skipped: number;
  total: number;
}

export function parseProspectsCsv(text: string): CsvParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { prospects: [], skipped: 0, total: 0 };

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const pseudoIdx = header.findIndex((h) => ["pseudo", "username", "nom"].includes(h));
  const plateformeIdx = header.findIndex((h) => ["plateforme", "platform"].includes(h));
  const detailIdx = header.findIndex((h) => ["detail", "détail", "detail_personnalisation", "note"].includes(h));

  const hasHeader = pseudoIdx !== -1;
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const prospects: Omit<NewProspect, "produit_id">[] = [];
  let skipped = 0;

  for (const line of dataLines) {
    const fields = parseCsvLine(line);
    const pseudo = hasHeader ? fields[pseudoIdx] : fields[0];
    const plateformeRaw = hasHeader && plateformeIdx !== -1 ? fields[plateformeIdx] : fields[1];
    const detail = hasHeader && detailIdx !== -1 ? fields[detailIdx] : fields[2];

    const plateforme = plateformeRaw ? normalizePlatform(plateformeRaw) : null;

    if (!pseudo?.trim() || !plateforme) {
      skipped++;
      continue;
    }

    prospects.push({
      pseudo: pseudo.trim().replace(/^@/, ""),
      plateforme,
      detail_personnalisation: detail?.trim() || null,
    });
  }

  return { prospects, skipped, total: dataLines.length };
}
