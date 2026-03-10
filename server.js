import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import trackRouter from "./src/routes/track.js";
import postbackRouter from "./src/routes/postback.js";
import statsRouter from "./src/routes/stats.js";
import categoriesRouter from "./src/routes/categories.js";
import creativesRouter from "./src/routes/creatives.js";

const app = express();
const PORT = process.env.PORT || 3000;
const LOGIN = process.env.LOGIN;
const PASSWORD = process.env.PASSWORD;

app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
  }),
);

app.post("/login", (req, res) => {
  const { login, password } = req.body;
  if (login === LOGIN && password === PASSWORD) {
    req.session.auth = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: "Неверный логин или пароль" });
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login.html");
});

app.use("/track", trackRouter);
app.use("/postback", postbackRouter);

function requireAuth(req, res, next) {
  if (req.session?.auth) return next();
  if (req.path === "/login.html" || req.path === "/login") return next();
  if (req.accepts("html")) return res.redirect("/login.html");
  return res.status(401).json({ error: "Не авторизован" });
}

app.use(requireAuth);
app.use("/stats", statsRouter);
app.use("/categories", categoriesRouter);
app.use("/creatives", creativesRouter);
app.use(express.static("public"));

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

//s
