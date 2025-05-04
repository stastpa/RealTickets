const express = require("express");
const { scrapeLogic } = require("./scrapeLogic");
const app = express();

const PORT = process.env.PORT || 4000;

app.get("/scrape", async (req, res) => {
  await scrapeLogic(); // run the logic
  res.send("✅ Scrape triggered. Check logs.");
});

app.get("/", (req, res) => {
  res.send("Render Puppeteer server is up and running!");
});

app.listen(PORT, () => {
  console.log(`🚀 Listening on port ${PORT}`);
});
