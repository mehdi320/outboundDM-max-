import { Router } from "express";
import { db } from "../db.js";
import { mapLog, toInt } from "../helpers.js";
import type { NewLog, UpdateLog } from "../../shared/types.js";

export const logsRouter = Router();

logsRouter.get("/", (req, res) => {
  const { produit_id, plateforme, prospect_id } = req.query;
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (produit_id) {
    clauses.push("produit_id = ?");
    params.push(Number(produit_id));
  }
  if (plateforme) {
    clauses.push("plateforme = ?");
    params.push(String(plateforme));
  }
  if (prospect_id) {
    clauses.push("prospect_id = ?");
    params.push(Number(prospect_id));
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(`SELECT * FROM logs ${where} ORDER BY date DESC, id DESC`)
    .all(...params);
  res.json((rows as Parameters<typeof mapLog>[0][]).map(mapLog));
});

logsRouter.post("/", (req, res) => {
  const body = req.body as NewLog;
  if (!body.produit_id || !body.script_id || !body.plateforme || !body.date) {
    return res.status(400).json({ error: "produit_id, script_id, plateforme et date sont requis." });
  }
  const result = db
    .prepare(
      `INSERT INTO logs (produit_id, script_id, prospect_id, plateforme, date, envoye, reponse, close, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      body.produit_id,
      body.script_id,
      body.prospect_id ?? null,
      body.plateforme,
      body.date,
      toInt(body.envoye, 1),
      toInt(body.reponse),
      toInt(body.close),
      body.note ?? null
    );
  const log = db.prepare("SELECT * FROM logs WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(mapLog(log as Parameters<typeof mapLog>[0]));
});

logsRouter.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM logs WHERE id = ?").get(id) as
    | Parameters<typeof mapLog>[0]
    | undefined;
  if (!existing) return res.status(404).json({ error: "Log introuvable." });

  const body = req.body as UpdateLog;
  db.prepare(
    `UPDATE logs SET script_id = ?, plateforme = ?, date = ?, envoye = ?, reponse = ?, close = ?, note = ?
     WHERE id = ?`
  ).run(
    body.script_id ?? existing.script_id,
    body.plateforme ?? existing.plateforme,
    body.date ?? existing.date,
    body.envoye !== undefined ? toInt(body.envoye) : existing.envoye,
    body.reponse !== undefined ? toInt(body.reponse) : existing.reponse,
    body.close !== undefined ? toInt(body.close) : existing.close,
    body.note !== undefined ? body.note : existing.note,
    id
  );
  const updated = db.prepare("SELECT * FROM logs WHERE id = ?").get(id);
  res.json(mapLog(updated as Parameters<typeof mapLog>[0]));
});

logsRouter.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  db.prepare("DELETE FROM logs WHERE id = ?").run(id);
  res.status(204).end();
});
