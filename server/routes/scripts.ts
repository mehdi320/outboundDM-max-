import { Router } from "express";
import { db } from "../db.js";
import type { NewScript, Script } from "../../shared/types.js";

export const scriptsRouter = Router();

scriptsRouter.get("/", (req, res) => {
  const produitId = req.query.produit_id;
  const scripts = produitId
    ? (db
        .prepare("SELECT * FROM scripts WHERE produit_id = ? ORDER BY created_at ASC")
        .all(Number(produitId)) as Script[])
    : (db.prepare("SELECT * FROM scripts ORDER BY created_at ASC").all() as Script[]);
  res.json(scripts);
});

scriptsRouter.post("/", (req, res) => {
  const body = req.body as NewScript;
  if (!body.produit_id || !body.label || !body.label.trim()) {
    return res.status(400).json({ error: "produit_id et label sont requis." });
  }
  const result = db
    .prepare("INSERT INTO scripts (produit_id, label, contenu) VALUES (?, ?, ?)")
    .run(body.produit_id, body.label.trim(), body.contenu ?? null);
  const script = db
    .prepare("SELECT * FROM scripts WHERE id = ?")
    .get(result.lastInsertRowid) as Script;
  res.status(201).json(script);
});

scriptsRouter.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  db.prepare("DELETE FROM scripts WHERE id = ?").run(id);
  res.status(204).end();
});
