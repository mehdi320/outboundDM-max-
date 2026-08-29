import { Router } from "express";
import { db } from "../db.js";
import type { NewEntry, UpdateEntry, Entry } from "../../shared/types.js";

export const entriesRouter = Router();

entriesRouter.get("/", (req, res) => {
  const { produit_id, plateforme } = req.query;
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

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const entries = db
    .prepare(`SELECT * FROM entries ${where} ORDER BY date DESC, created_at DESC`)
    .all(...params) as Entry[];
  res.json(entries);
});

function validateEntryBody(body: Partial<NewEntry>) {
  if (
    body.produit_id == null ||
    body.script_id == null ||
    !body.plateforme ||
    !body.date
  ) {
    return "produit_id, script_id, plateforme et date sont requis.";
  }
  if (!["Instagram", "Threads", "Twitter"].includes(body.plateforme)) {
    return "plateforme invalide.";
  }
  return null;
}

entriesRouter.post("/", (req, res) => {
  const body = req.body as NewEntry;
  const error = validateEntryBody(body);
  if (error) return res.status(400).json({ error });

  const result = db
    .prepare(
      `INSERT INTO entries
        (produit_id, script_id, plateforme, date, nb_dm_envoyes, nb_reponses, nb_deals_closes, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      body.produit_id,
      body.script_id,
      body.plateforme,
      body.date,
      body.nb_dm_envoyes ?? 0,
      body.nb_reponses ?? 0,
      body.nb_deals_closes ?? 0,
      body.note ?? null
    );
  const entry = db
    .prepare("SELECT * FROM entries WHERE id = ?")
    .get(result.lastInsertRowid) as Entry;
  res.status(201).json(entry);
});

entriesRouter.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM entries WHERE id = ?").get(id) as
    | Entry
    | undefined;
  if (!existing) return res.status(404).json({ error: "Entrée introuvable." });

  const body = req.body as UpdateEntry;
  const merged: Entry = { ...existing, ...body };

  db.prepare(
    `UPDATE entries SET
      produit_id = ?, script_id = ?, plateforme = ?, date = ?,
      nb_dm_envoyes = ?, nb_reponses = ?, nb_deals_closes = ?, note = ?
     WHERE id = ?`
  ).run(
    merged.produit_id,
    merged.script_id,
    merged.plateforme,
    merged.date,
    merged.nb_dm_envoyes,
    merged.nb_reponses,
    merged.nb_deals_closes,
    merged.note,
    id
  );

  const updated = db.prepare("SELECT * FROM entries WHERE id = ?").get(id) as Entry;
  res.json(updated);
});

entriesRouter.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  db.prepare("DELETE FROM entries WHERE id = ?").run(id);
  res.status(204).end();
});
