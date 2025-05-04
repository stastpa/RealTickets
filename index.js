const express = require("express");
const { scrapeLogic } = require("./scrapeLogic");
const app = express();

const PORT = process.env.PORT || 4000;

// 🔧 res is handled inside scrapeLogic, no need to send another response
app.get("/scrape", async (req, res) => {
  await scrapeLogic(res); // this sends the response
});

app.get("/", (req, res) => {
  res.send("Render Puppeteer server is up and running!");
});

app.listen(PORT, () => {
  console.log(`🚀 Listening on port ${PORT}`);
});
