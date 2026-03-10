import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db/database.js";
import { isBot } from "../middleware/botDetect.js";

const router = Router();

router.get("/:streamId", (req, res) => {
  const { streamId } = req.params;

  const stream = db.prepare("SELECT * FROM streams WHERE id = ?").get(streamId);
  if (!stream) return res.status(404).send("Поток не найден");

  const cookieKey = `stream_${streamId}`;
  if (req.cookies?.[cookieKey]) return res.redirect("https://google.com");

  const clickUuid = uuidv4();
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const userAgent = req.headers["user-agent"];
  const referer = req.headers["referer"] || null;
  const bot = isBot(userAgent);

  let targetUrl = stream.target_url;
  let creativeId = null;

  if (stream.tds_category_id) {
    const creatives = db
      .prepare("SELECT * FROM creatives WHERE category_id = ?")
      .all(stream.tds_category_id);
    if (creatives.length > 0) {
      const creative = creatives[Math.floor(Math.random() * creatives.length)];
      targetUrl = creative.target_url;
      creativeId = creative.id;
    }
  }

  db.prepare(
    `
    INSERT INTO clicks (uuid, stream_id, creative_id, ip, user_agent, referer, is_bot)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(clickUuid, streamId, creativeId, ip, userAgent, referer, bot ? 1 : 0);

  const url = new URL(targetUrl);
  url.searchParams.set("utm_source", stream.utm_source || "");
  url.searchParams.set("utm_medium", stream.utm_medium || "");
  url.searchParams.set("utm_campaign", stream.utm_campaign || "");
  url.searchParams.set("click_id", clickUuid);

  res.cookie(cookieKey, "1", { maxAge: 86400000 });
  return res.redirect(url.toString());
});

export default router;
