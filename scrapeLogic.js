require("dotenv").config();
const puppeteer = require("puppeteer");
const { Client, GatewayIntentBits } = require("discord.js");

const URL = "https://www.realmadrid.com/en-US/tickets?filter-tickets=vip;general&filter-football=primer-equipo-masculino";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages],
  partials: ['CHANNEL'],
});

let discordReady = false;
let notifiedMallorca = false;

client.once("ready", () => {
  discordReady = true;
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);

async function scrapeLogic() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();

  try {
    await page.goto(URL, {
      waitUntil: ["domcontentloaded", "networkidle2"],
      timeout: 10000
    });

    await new Promise(res => setTimeout(res, 10000)); // Wait for content

    const foundMatches = await page.evaluate(() => {
      const result = { mallorca: false, celta: false };
      const cards = Array.from(document.querySelectorAll('app-all-event-card'));

      for (const card of cards) {
        const text = card.innerText.toLowerCase();
        const spans = Array.from(card.querySelectorAll('span.rm-button__content.ng-star-inserted'));
        const hasBuyButton = spans.some(span => span.innerText.trim() === "Buy tickets");

        if (text.includes("mallorca") && hasBuyButton) {
          result.mallorca = true;
        }

        if (text.includes("celta") && hasBuyButton) {
          result.celta = true;
        }
      }

      return result;
    });

    console.log(`[${new Date().toLocaleTimeString()}] Celta de Vigo tickets: ${foundMatches.celta ? '✅ Available' : '❌ Not yet'}`);
    console.log(`[${new Date().toLocaleTimeString()}] Mallorca tickets: ${foundMatches.mallorca ? '✅ Available' : '❌ Not yet'}`);

    if (foundMatches.mallorca && !notifiedMallorca && discordReady) {
      try {
        const user = await client.users.fetch(process.env.USER_ID);
        await user.send(`🎟️ Mallorca tickets are available! Buy now: ${URL}`);
        console.log("✅ Mallorca notification sent!");
        notifiedMallorca = true;
      } catch (err) {
        console.error("❌ Failed to send Discord message:", err);
      }
    }

  } catch (err) {
    console.error("❌ Error during scraping:", err);
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeLogic };
