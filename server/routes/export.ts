import { Router } from "express";
import { db } from "../db.js";

export const exportRouter = Router();

interface ExportRow {
  entry_id: number;
  date: string;
  produit: string;
  script: string;
  plateforme: string;
  nb_dm_envoyes: number;
  nb_reponses: number;
  nb_deals_closes: number;
  note: string | null;
}

function csvEscape(value: string | number | null): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

exportRouter.get("/csv", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT
        e.id as entry_id,
        e.date as date,
        p.nom as produit,
        s.label as script,
        e.plateforme as plateforme,
        e.nb_dm_envoyes as nb_dm_envoyes,
        e.nb_reponses as nb_reponses,
        e.nb_deals_closes as nb_deals_closes,
        e.note as note
       FROM entries e
       JOIN products p ON p.id = e.produit_id
       JOIN scripts s ON s.id = e.script_id
       ORDER BY e.date DESC, e.id DESC`
    )
    .all() as ExportRow[];

  const header = [
    "date",
    "produit",
    "script",
    "plateforme",
    "nb_dm_envoyes",
    "nb_reponses",
    "nb_deals_closes",
    "taux_reponse_%",
    "taux_close_global_%",
    "note",
  ];

  const lines = rows.map((r) => {
    const tauxReponse = r.nb_dm_envoyes > 0 ? (r.nb_reponses / r.nb_dm_envoyes) * 100 : 0;
    const tauxCloseGlobal =
      r.nb_dm_envoyes > 0 ? (r.nb_deals_closes / r.nb_dm_envoyes) * 100 : 0;
    return [
      r.date,
      r.produit,
      r.script,
      r.plateforme,
      r.nb_dm_envoyes,
      r.nb_reponses,
      r.nb_deals_closes,
      tauxReponse.toFixed(2),
      tauxCloseGlobal.toFixed(2),
      r.note ?? "",
    ]
      .map(csvEscape)
      .join(",");
  });

  const csv = [header.join(","), ...lines].join("\n");
  const filename = `dm-tracker-export-${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send("﻿" + csv);
});
