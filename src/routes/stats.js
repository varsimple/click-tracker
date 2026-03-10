import { Router } from "express"
import { customAlphabet } from "nanoid"
import db from "../db/database.js"

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8)
const router = Router()

function genSlug() {
  let slug
  do { slug = nanoid() } while (db.prepare("SELECT id FROM streams WHERE slug = ?").get(slug))
  return slug
}

// STREAMS
router.get("/streams", (req, res) => {
  res.json(db.prepare(`
    SELECT s.*, c.name as category_name
    FROM streams s
    LEFT JOIN categories c ON c.id = s.category_id
  `).all())
})

router.post("/streams", (req, res) => {
  const { name, target_url, utm_source, utm_medium, utm_campaign, category_id, tds_category_id, fallback_url } = req.body
  if (!name) return res.status(400).json({ error: "name обязателен" })
  const slug = genSlug()
  const result = db.prepare(`
    INSERT INTO streams (slug, name, target_url, utm_source, utm_medium, utm_campaign, category_id, tds_category_id, fallback_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(slug, name, target_url || null, utm_source, utm_medium, utm_campaign, category_id || null, tds_category_id || null, fallback_url || "https://google.com")
  res.json({ id: result.lastInsertRowid, slug, message: "Поток создан" })
})

router.delete("/streams/:id", (req, res) => {
  db.prepare("DELETE FROM streams WHERE id = ?").run(req.params.id)
  res.json({ message: "Удалено" })
})

router.put("/streams/:id", (req, res) => {
  const { name, target_url, utm_source, utm_medium, utm_campaign, category_id, tds_category_id, fallback_url } = req.body
  db.prepare(`
    UPDATE streams SET name=?, target_url=?, utm_source=?, utm_medium=?, utm_campaign=?, category_id=?, tds_category_id=?, fallback_url=?
    WHERE id=?
  `).run(name, target_url || null, utm_source, utm_medium, utm_campaign, category_id || null, tds_category_id || null, fallback_url || "https://google.com", req.params.id)
  res.json({ message: "Обновлено" })
})

// CLICKS
router.get("/clicks", (req, res) => {
  res.json(db.prepare(`
    SELECT s.name as stream_name, s.slug,
      COUNT(c.id) as total_clicks,
      SUM(c.is_bot) as bot_clicks,
      COUNT(c.id) - SUM(c.is_bot) as real_clicks
    FROM clicks c
    JOIN streams s ON s.id = c.stream_id
    GROUP BY c.stream_id
  `).all())
})

router.get("/clicks-log", (req, res) => {
  res.json(db.prepare(`
    SELECT c.*, s.name as stream_name, s.slug, cr.name as creative_name
    FROM clicks c
    JOIN streams s ON s.id = c.stream_id
    LEFT JOIN creatives cr ON cr.id = c.creative_id
    ORDER BY c.created_at DESC
    LIMIT 200
  `).all())
})

router.post("/clicks/:id/mark-bot", (req, res) => {
  db.prepare("UPDATE clicks SET is_bot = 1 WHERE id = ?").run(req.params.id)
  res.json({ message: "Помечен" })
})

// LEADS
router.get("/leads", (req, res) => {
  res.json(db.prepare(`
    SELECT s.name as stream_name,
      COUNT(l.id) as total_leads,
      SUM(l.payout) as total_payout
    FROM leads l
    JOIN clicks c ON c.uuid = l.click_uuid
    JOIN streams s ON s.id = c.stream_id
    GROUP BY c.stream_id
  `).all())
})

router.get("/leads-log", (req, res) => {
  res.json(db.prepare(`
    SELECT l.*, s.name as stream_name, cr.name as creative_name, c.ip, c.user_agent, c.referer
    FROM leads l
    JOIN clicks c ON c.uuid = l.click_uuid
    JOIN streams s ON s.id = c.stream_id
    LEFT JOIN creatives cr ON cr.id = c.creative_id
    ORDER BY l.created_at DESC
    LIMIT 200
  `).all())
})

// CREATIVES STATS
router.get("/creatives-stats", (req, res) => {
  res.json(db.prepare(`
    SELECT cr.id, cr.name, cr.target_url,
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
  `).all())
})

// SETTINGS
router.get("/settings", (req, res) => {
  const rows = db.prepare("SELECT * FROM settings").all()
  const result = {}
  rows.forEach(r => result[r.key] = r.value)
  res.json(result)
})

router.post("/settings", (req, res) => {
  const { key, value } = req.body
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value)
  res.json({ message: "Сохранено" })
})

export default router
