import { Router } from "express";
import db from "../db/database.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(
    db.prepare("SELECT * FROM creatives ORDER BY created_at DESC").all(),
  );
});

router.post("/", (req, res) => {
  const {
    name,
    target_url,
    category_id,
    utm_source,
    utm_medium,
    utm_campaign,
  } = req.body;
  if (!target_url)
    return res.status(400).json({ error: "target_url обязателен" });
  const result = db
    .prepare(
      `
    INSERT INTO creatives (name, target_url, category_id, utm_source, utm_medium, utm_campaign)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
    )
    .run(
      name,
      target_url,
      category_id || null,
      utm_source,
      utm_medium,
      utm_campaign,
    );
  res.json({ id: result.lastInsertRowid });
});

router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM creatives WHERE id = ?").run(req.params.id);
  res.json({ message: "Удалено" });
});

export default router;
