import { Router } from "express"
import { v4 as uuidv4 } from "uuid"
import db from "../db/database.js"
import { isBot } from "../middleware/botDetect.js"

const router = Router()

router.get("/:slug", (req, res) => {
  const { slug } = req.params

  const stream = db.prepare("SELECT * FROM streams WHERE slug = ?").get(slug)
  if (!stream) return res.status(404).send("Поток не найден")

  const cookieKey = `stream_${stream.id}`
  const fallback = stream.fallback_url || "https://google.com"

  if (req.cookies?.[cookieKey]) return res.redirect(fallback)

  const clickUuid = uuidv4()
  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress
  const userAgent = req.headers["user-agent"]
  const referer = req.headers["referer"] || null
  const bot = isBot(userAgent)

  let targetUrl = stream.target_url
  let creativeId = null

  if (stream.tds_category_id) {
    const creatives = db.prepare("SELECT * FROM creatives WHERE category_id = ?").all(stream.tds_category_id)
    if (creatives.length > 0) {
      const creative = creatives[Math.floor(Math.random() * creatives.length)]
      targetUrl = creative.target_url
      creativeId = creative.id
    }
  }

  if (!targetUrl) return res.redirect(fallback)

  db.prepare(`
    INSERT INTO clicks (uuid, stream_id, creative_id, ip, user_agent, referer, is_bot)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(clickUuid, stream.id, creativeId, ip, userAgent, referer, bot ? 1 : 0)

  const url = new URL(targetUrl)
  if (stream.utm_source) url.searchParams.set("utm_source", stream.utm_source)
  if (stream.utm_medium) url.searchParams.set("utm_medium", stream.utm_medium)
  if (stream.utm_campaign) url.searchParams.set("utm_campaign", stream.utm_campaign)
  url.searchParams.set("click_id", clickUuid)

  res.cookie(cookieKey, "1", { maxAge: 86400000 })
  return res.redirect(url.toString())
})

export default router
