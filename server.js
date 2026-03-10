import express from "express";
import cookieParser from "cookie-parser";
import trackRouter from "./src/routes/track.js";
import postbackRouter from "./src/routes/postback.js";
import statsRouter from "./src/routes/stats.js";
import categoriesRouter from "./src/routes/categories.js";
import creativesRouter from "./src/routes/creatives.js";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());
app.use("/track", trackRouter);
app.use("/postback", postbackRouter);
app.use("/stats", statsRouter);
app.use("/categories", categoriesRouter);
app.use("/creatives", creativesRouter);
app.use(express.static("public"));

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
