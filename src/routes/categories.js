import { Router } from "express";
import db from "../db/database.js";

const router = Router();

// GET все категории
router.get("/", (req, res) => {
  const categories = db.prepare("SELECT * FROM categories").all();
  res.json(categories);
});
// POST создать
router.post("/", (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: "name и type обязательны" });
  }
  const result = db
    .prepare(
      `
  INSERT INTO categories (name, type) VALUES (?, ?)
`,
    )
    .run(name, type);

  res.json({ id: result.lastInsertRowid, message: "Категория создана" });
});

// DELETE удалить
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM categories WHERE id = ?").run(id);
  res.json({ message: "Удалено" });
});

export default router;
