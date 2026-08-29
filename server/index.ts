import express from "express";
import cors from "cors";
import "./db.js";
import { productsRouter } from "./routes/products.js";
import { scriptsRouter } from "./routes/scripts.js";
import { prospectsRouter } from "./routes/prospects.js";
import { logsRouter } from "./routes/logs.js";
import { exportRouter } from "./routes/export.js";
import { backupRouter } from "./routes/backup.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api/products", productsRouter);
app.use("/api/scripts", scriptsRouter);
app.use("/api/prospects", prospectsRouter);
app.use("/api/logs", logsRouter);
app.use("/api/export", exportRouter);
app.use("/api/backup", backupRouter);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`[server] DM Prospection API sur http://localhost:${PORT}`);
});
