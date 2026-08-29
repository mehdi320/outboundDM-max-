import { Router } from "express";
import { db } from "../db.js";
import { mapLog, mapScript } from "../helpers.js";
import type { BackupPayload, Product, Prospect } from "../../shared/types.js";

export const backupRouter = Router();

backupRouter.get("/json", (_req, res) => {
  const products = db.prepare("SELECT * FROM products ORDER BY id ASC").all() as Product[];
  const scripts = (db.prepare("SELECT * FROM scripts ORDER BY id ASC").all() as Parameters<typeof mapScript>[0][]).map(
    mapScript
  );
  const prospects = db.prepare("SELECT * FROM prospects ORDER BY id ASC").all() as Prospect[];
  const logs = (db.prepare("SELECT * FROM logs ORDER BY id ASC").all() as Parameters<typeof mapLog>[0][]).map(mapLog);

  const payload: BackupPayload = {
    version: 2,
    exported_at: new Date().toISOString(),
    products,
    scripts,
    prospects,
    logs,
  };

  const filename = `dm-prospection-backup-${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.json(payload);
});

function isValidPayload(body: unknown): body is BackupPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    Array.isArray(b.products) &&
    Array.isArray(b.scripts) &&
    Array.isArray(b.prospects) &&
    Array.isArray(b.logs)
  );
}

backupRouter.post("/json", (req, res) => {
  const body = req.body as unknown;
  if (!isValidPayload(body)) {
    return res.status(400).json({ error: "Fichier de sauvegarde invalide (version incompatible ?)." });
  }

  const restore = db.transaction((payload: BackupPayload) => {
    db.prepare("DELETE FROM logs").run();
    db.prepare("DELETE FROM prospects").run();
    db.prepare("DELETE FROM scripts").run();
    db.prepare("DELETE FROM products").run();

    const insertProduct = db.prepare(
      "INSERT INTO products (id, nom, objectif_dm_jour, created_at) VALUES (?, ?, ?, ?)"
    );
    for (const p of payload.products) {
      insertProduct.run(p.id, p.nom, p.objectif_dm_jour ?? null, p.created_at);
    }

    const insertScript = db.prepare(
      "INSERT INTO scripts (id, produit_id, label, contenu, actif, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    );
    for (const s of payload.scripts) {
      insertScript.run(s.id, s.produit_id, s.label, s.contenu, s.actif ? 1 : 0, s.created_at);
    }

    const insertProspect = db.prepare(
      `INSERT INTO prospects (id, produit_id, pseudo, plateforme, detail_personnalisation, statut, date_ajout, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const pr of payload.prospects) {
      insertProspect.run(
        pr.id,
        pr.produit_id,
        pr.pseudo,
        pr.plateforme,
        pr.detail_personnalisation,
        pr.statut,
        pr.date_ajout,
        pr.created_at
      );
    }

    const insertLog = db.prepare(
      `INSERT INTO logs (id, produit_id, script_id, prospect_id, plateforme, date, envoye, reponse, close, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const l of payload.logs) {
      insertLog.run(
        l.id,
        l.produit_id,
        l.script_id,
        l.prospect_id,
        l.plateforme,
        l.date,
        l.envoye ? 1 : 0,
        l.reponse ? 1 : 0,
        l.close ? 1 : 0,
        l.note,
        l.created_at
      );
    }
  });

  try {
    restore(body);
    res.json({
      ok: true,
      products: body.products.length,
      scripts: body.scripts.length,
      prospects: body.prospects.length,
      logs: body.logs.length,
    });
  } catch (err) {
    res.status(400).json({ error: "Échec de la restauration : " + (err as Error).message });
  }
});
