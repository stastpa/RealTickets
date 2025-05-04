const express = require("express");
const { scrapeLogic, waitForDiscordReady } = require("./scrapeLogic");

const app = express();
const PORT = process.env.PORT || 4000;

app.get("/scrape", async (req, res) => {
  try {
    await scrapeLogic(); // wait for the logic to finish
    res.send("✅ Scrape completed. Check logs."); // finish response
  } catch (err) {
    console.error("❌ Scrape failed:", err);
    res.status(500).send("❌ Scrape failed. Check logs.");
  }
});


app.get("/", (req, res) => {
  res.send("Render Puppeteer server is up and running!");
});

// Wait for Discord bot to be ready before starting server
waitForDiscordReady().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Listening on port ${PORT}`);
  });
});
