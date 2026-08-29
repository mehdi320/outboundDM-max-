import { Router } from "express";
import { db } from "../db.js";
import { mapScript, toInt } from "../helpers.js";
import type { NewScript, UpdateScript } from "../../shared/types.js";

export const scriptsRouter = Router();

scriptsRouter.get("/", (req, res) => {
  const produitId = req.query.produit_id;
  const rows = produitId
    ? db.prepare("SELECT * FROM scripts WHERE produit_id = ? ORDER BY created_at ASC").all(Number(produitId))
    : db.prepare("SELECT * FROM scripts ORDER BY created_at ASC").all();
  res.json((rows as Parameters<typeof mapScript>[0][]).map(mapScript));
});

scriptsRouter.post("/", (req, res) => {
  const body = req.body as NewScript;
  if (!body.produit_id || !body.label || !body.label.trim()) {
    return res.status(400).json({ error: "produit_id et label sont requis." });
  }
  const result = db
    .prepare("INSERT INTO scripts (produit_id, label, contenu, actif) VALUES (?, ?, ?, 1)")
    .run(body.produit_id, body.label.trim(), body.contenu ?? null);
  const script = db.prepare("SELECT * FROM scripts WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(mapScript(script as Parameters<typeof mapScript>[0]));
});

scriptsRouter.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM scripts WHERE id = ?").get(id) as
    | Parameters<typeof mapScript>[0]
    | undefined;
  if (!existing) return res.status(404).json({ error: "Script introuvable." });

  const body = req.body as UpdateScript;
  const label = body.label !== undefined ? body.label.trim() : existing.label;
  const contenu = body.contenu !== undefined ? body.contenu : existing.contenu;
  const actif = body.actif !== undefined ? toInt(body.actif) : existing.actif;

  if (!label) return res.status(400).json({ error: "Le label est requis." });

  db.prepare("UPDATE scripts SET label = ?, contenu = ?, actif = ? WHERE id = ?").run(
    label,
    contenu,
    actif,
    id
  );
  const updated = db.prepare("SELECT * FROM scripts WHERE id = ?").get(id);
  res.json(mapScript(updated as Parameters<typeof mapScript>[0]));
});

scriptsRouter.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  db.prepare("DELETE FROM scripts WHERE id = ?").run(id);
  res.status(204).end();
});
