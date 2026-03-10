const BOT_SIGNATURES = [
  "bot",
  "crawler",
  "spider",
  "headless",
  "phantom",
  "selenium",
  "wget",
  "curl",
  "python",
  "java",
  "go-http",
];

export function isBot(userAgent) {
  if (!userAgent) return true; // нет user-agent — точно бот

  const ua = userAgent.toLowerCase();
  return BOT_SIGNATURES.some((signature) => ua.includes(signature));
}
