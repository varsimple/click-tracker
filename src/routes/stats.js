import { Router } from "express";
import db from "../db/database.js";

const router = Router();

router.get("/streams", (req, res) => {
  res.json(db.prepare("SELECT * FROM streams").all());
});

router.post("/streams", (req, res) => {
  const {
    name,
    target_url,
    utm_source,
    utm_medium,
    utm_campaign,
    category_id,
    tds_category_id,
  } = req.body;
  if (!name) return res.status(400).json({ error: "name обязателен" });
  const result = db
    .prepare(
      `
    INSERT INTO streams (name, target_url, utm_source, utm_medium, utm_campaign, category_id, tds_category_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
    )
    .run(
      name,
      target_url || null,
      utm_source,
      utm_medium,
      utm_campaign,
      category_id || null,
      tds_category_id || null,
    );
  res.json({ id: result.lastInsertRowid, message: "Поток создан" });
});

router.delete("/streams/:id", (req, res) => {
  db.prepare("DELETE FROM streams WHERE id = ?").run(req.params.id);
  res.json({ message: "Удалено" });
});

router.put("/streams/:id", (req, res) => {
  const {
    name,
    target_url,
    utm_source,
    utm_medium,
    utm_campaign,
    category_id,
    tds_category_id,
  } = req.body;
  db.prepare(
    `
    UPDATE streams SET name=?, target_url=?, utm_source=?, utm_medium=?, utm_campaign=?, category_id=?, tds_category_id=?
    WHERE id=?
  `,
  ).run(
    name,
    target_url || null,
    utm_source,
    utm_medium,
    utm_campaign,
    category_id || null,
    tds_category_id || null,
    req.params.id,
  );
  res.json({ message: "Обновлено" });
});

router.get("/clicks", (req, res) => {
  res.json(
    db
      .prepare(
        `
    SELECT s.name as stream_name,
      COUNT(c.id) as total_clicks,
      SUM(c.is_bot) as bot_clicks,
      COUNT(c.id) - SUM(c.is_bot) as real_clicks
    FROM clicks c
    JOIN streams s ON s.id = c.stream_id
    GROUP BY c.stream_id
  `,
      )
      .all(),
  );
});

router.get("/clicks-log", (req, res) => {
  res.json(
    db
      .prepare(
        `
    SELECT c.*, s.name as stream_name, cr.name as creative_name
    FROM clicks c
    JOIN streams s ON s.id = c.stream_id
    LEFT JOIN creatives cr ON cr.id = c.creative_id
    ORDER BY c.created_at DESC
    LIMIT 200
  `,
      )
      .all(),
  );
});

router.get("/leads", (req, res) => {
  res.json(
    db
      .prepare(
        `
    SELECT s.name as stream_name,
      COUNT(l.id) as total_leads,
      SUM(l.payout) as total_payout
    FROM leads l
    JOIN clicks c ON c.uuid = l.click_uuid
    JOIN streams s ON s.id = c.stream_id
    GROUP BY c.stream_id
  `,
      )
      .all(),
  );
});

router.get("/leads-log", (req, res) => {
  res.json(
    db
      .prepare(
        `
    SELECT l.*, s.name as stream_name, cr.name as creative_name, c.ip, c.user_agent, c.referer
    FROM leads l
    JOIN clicks c ON c.uuid = l.click_uuid
    JOIN streams s ON s.id = c.stream_id
    LEFT JOIN creatives cr ON cr.id = c.creative_id
    ORDER BY l.created_at DESC
    LIMIT 200
  `,
      )
      .all(),
  );
});

router.get("/creatives-stats", (req, res) => {
  res.json(
    db
      .prepare(
        `
    SELECT
      cr.id, cr.name, cr.target_url,
      COUNT(c.id) as total_clicks,
      SUM(c.is_bot) as bot_clicks,
      COUNT(c.id) - SUM(c.is_bot) as real_clicks,
      COUNT(l.id) as total_leads,
      COALESCE(SUM(l.payout), 0) as total_payout
    FROM creatives cr
    LEFT JOIN clicks c ON c.creative_id = cr.id
    LEFT JOIN leads l ON l.click_uuid = c.uuid
    GROUP BY cr.id
    ORDER BY total_clicks DESC
  `,
      )
      .all(),
  );
});

router.post("/clicks/:id/mark-bot", (req, res) => {
  db.prepare("UPDATE clicks SET is_bot = 1 WHERE id = ?").run(req.params.id);
  res.json({ message: "Помечен" });
});

export default router;
