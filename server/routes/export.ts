import { Router } from "express";
import { db } from "../db.js";

export const exportRouter = Router();

interface ExportRow {
  date: string;
  produit: string;
  script: string;
  prospect: string | null;
  plateforme: string;
  envoye: number;
  reponse: number;
  close: number;
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
        l.date as date,
        p.nom as produit,
        s.label as script,
        pr.pseudo as prospect,
        l.plateforme as plateforme,
        l.envoye as envoye,
        l.reponse as reponse,
        l.close as close,
        l.note as note
       FROM logs l
       JOIN products p ON p.id = l.produit_id
       JOIN scripts s ON s.id = l.script_id
       LEFT JOIN prospects pr ON pr.id = l.prospect_id
       ORDER BY l.date DESC, l.id DESC`
    )
    .all() as ExportRow[];

  const header = ["date", "produit", "script", "prospect", "plateforme", "envoye", "reponse", "close", "note"];

  const lines = rows.map((r) =>
    [
      r.date,
      r.produit,
      r.script,
      r.prospect ?? "",
      r.plateforme,
      r.envoye ? 1 : 0,
      r.reponse ? 1 : 0,
      r.close ? 1 : 0,
      r.note ?? "",
    ]
      .map(csvEscape)
      .join(",")
  );

  const csv = [header.join(","), ...lines].join("\n");
  const filename = `dm-prospection-export-${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send("﻿" + csv);
});
