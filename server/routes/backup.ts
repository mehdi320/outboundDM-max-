import { Router } from "express";
import { db } from "../db.js";
import type { BackupPayload, Product, Script, Entry } from "../../shared/types.js";

export const backupRouter = Router();

backupRouter.get("/json", (_req, res) => {
  const products = db.prepare("SELECT * FROM products ORDER BY id ASC").all() as Product[];
  const scripts = db.prepare("SELECT * FROM scripts ORDER BY id ASC").all() as Script[];
  const entries = db.prepare("SELECT * FROM entries ORDER BY id ASC").all() as Entry[];

  const payload: BackupPayload = {
    version: 1,
    exported_at: new Date().toISOString(),
    products,
    scripts,
    entries,
  };

  const filename = `dm-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.json(payload);
});

function isValidPayload(body: unknown): body is BackupPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return Array.isArray(b.products) && Array.isArray(b.scripts) && Array.isArray(b.entries);
}

backupRouter.post("/json", (req, res) => {
  const body = req.body as unknown;
  if (!isValidPayload(body)) {
    return res.status(400).json({ error: "Fichier de sauvegarde invalide." });
  }

  const restore = db.transaction((payload: BackupPayload) => {
    db.prepare("DELETE FROM entries").run();
    db.prepare("DELETE FROM scripts").run();
    db.prepare("DELETE FROM products").run();

    const insertProduct = db.prepare(
      "INSERT INTO products (id, nom, objectif_dm_jour, created_at) VALUES (?, ?, ?, ?)"
    );
    for (const p of payload.products) {
      insertProduct.run(p.id, p.nom, p.objectif_dm_jour ?? null, p.created_at);
    }

    const insertScript = db.prepare(
      "INSERT INTO scripts (id, produit_id, label, contenu, created_at) VALUES (?, ?, ?, ?, ?)"
    );
    for (const s of payload.scripts) {
      insertScript.run(s.id, s.produit_id, s.label, s.contenu, s.created_at);
    }

    const insertEntry = db.prepare(
      `INSERT INTO entries
        (id, produit_id, script_id, plateforme, date, nb_dm_envoyes, nb_reponses, nb_deals_closes, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const e of payload.entries) {
      insertEntry.run(
        e.id,
        e.produit_id,
        e.script_id,
        e.plateforme,
        e.date,
        e.nb_dm_envoyes,
        e.nb_reponses,
        e.nb_deals_closes,
        e.note,
        e.created_at
      );
    }
  });

  try {
    restore(body);
    res.json({ ok: true, products: body.products.length, scripts: body.scripts.length, entries: body.entries.length });
  } catch (err) {
    res.status(400).json({ error: "Échec de la restauration : " + (err as Error).message });
  }
});
