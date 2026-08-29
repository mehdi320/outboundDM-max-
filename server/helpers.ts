export function toBool(value: unknown): boolean {
  return value === 1 || value === true;
}

export function toInt(value: boolean | undefined, fallback: 0 | 1 = 0): 0 | 1 {
  if (value === undefined) return fallback;
  return value ? 1 : 0;
}

interface RawScript {
  id: number;
  produit_id: number;
  label: string;
  contenu: string | null;
  actif: number;
  created_at: string;
}

export function mapScript(row: RawScript) {
  return { ...row, actif: toBool(row.actif) };
}

import type { Platform } from "../shared/types.js";

interface RawLog {
  id: number;
  produit_id: number;
  script_id: number;
  prospect_id: number | null;
  plateforme: Platform;
  date: string;
  envoye: number;
  reponse: number;
  close: number;
  note: string | null;
  created_at: string;
}

export function mapLog(row: RawLog) {
  return { ...row, envoye: toBool(row.envoye), reponse: toBool(row.reponse), close: toBool(row.close) };
}
