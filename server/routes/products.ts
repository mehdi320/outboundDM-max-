import { Router } from "express";
import { db } from "../db.js";
import type { NewProduct, Product, UpdateProduct } from "../../shared/types.js";

export const productsRouter = Router();

productsRouter.get("/", (_req, res) => {
  const products = db
    .prepare("SELECT * FROM products ORDER BY created_at ASC")
    .all() as Product[];
  res.json(products);
});

productsRouter.post("/", (req, res) => {
  const body = req.body as NewProduct;
  if (!body.nom || !body.nom.trim()) {
    return res.status(400).json({ error: "Le nom du produit est requis." });
  }
  try {
    const result = db
      .prepare("INSERT INTO products (nom) VALUES (?)")
      .run(body.nom.trim());
    const product = db
      .prepare("SELECT * FROM products WHERE id = ?")
      .get(result.lastInsertRowid) as Product;
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: "Ce produit existe déjà." });
  }
});

productsRouter.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as
    | Product
    | undefined;
  if (!existing) return res.status(404).json({ error: "Produit introuvable." });

  const body = req.body as UpdateProduct;
  const nom = body.nom !== undefined ? body.nom.trim() : existing.nom;
  const objectif =
    body.objectif_dm_jour !== undefined ? body.objectif_dm_jour : existing.objectif_dm_jour;

  if (!nom) return res.status(400).json({ error: "Le nom du produit est requis." });

  try {
    db.prepare("UPDATE products SET nom = ?, objectif_dm_jour = ? WHERE id = ?").run(
      nom,
      objectif,
      id
    );
    const updated = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as Product;
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Ce nom de produit existe déjà." });
  }
});

productsRouter.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  db.prepare("DELETE FROM products WHERE id = ?").run(id);
  res.status(204).end();
});
