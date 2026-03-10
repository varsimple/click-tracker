import { Router } from "express";
import db from "../db/database.js";

const router = Router();

router.get("/", (req, res) => {
  const { click_id, payout, status } = req.query;

  if (!click_id) {
    return res.status(400).send("click_id обязателен");
  }

  // 1. Проверяем что такой клик существует
  const click = db.prepare("SELECT * FROM clicks WHERE uuid = ?").get(click_id);

  if (!click) {
    return res.status(404).send("Клик не найден");
  }

  // 2. Записываем лид
  db.prepare(
    `
    INSERT INTO leads (click_uuid, payout, status)
    VALUES (?, ?, ?)
  `,
  ).run(click_id, payout || 0, status || "approved");

  return res.send("OK");
});

export default router;
