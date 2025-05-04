require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const puppeteer = require('puppeteer');

const URL = 'https://www.realmadrid.com/en-US/tickets?filter-tickets=vip;general&filter-football=primer-equipo-masculino';
const CHECK_INTERVAL = 10 * 1000;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages],
  partials: ['CHANNEL'],
});

async function checkTickets() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  try {
    await page.goto(URL, {
      waitUntil: ['domcontentloaded', 'networkidle2'],
      timeout: 10000
    })
    await new Promise(res => setTimeout(res, 10000)); // give time for dynamic content

    const foundMatches = await page.evaluate(() => {
      const result = { mallorca: false, celta: false };
      const cards = Array.from(document.querySelectorAll('app-all-event-card'));

      for (const card of cards) {
        const text = card.innerText.toLowerCase();
        const spans = Array.from(card.querySelectorAll('span.rm-button__content.ng-star-inserted'));

        const hasBuyButton = spans.some(span => span.innerText.trim() === 'Buy tickets');

        if (text.includes('mallorca') && hasBuyButton) {
          result.mallorca = true;
        }

        if (text.includes('celta') && hasBuyButton) {
          result.celta = true;
        }
      }

      return result;
    });

    return foundMatches;
  } catch (err) {
    console.error('❌ Error checking tickets:', err);
    return { mallorca: false, celta: false };
  } finally {
    await browser.close();
  }
}

async function startChecker() {
  let notifiedMallorca = false;

  setInterval(async () => {
    const { mallorca, celta } = await checkTickets();

    console.log(`[${new Date().toLocaleTimeString()}] Celta de Vigo tickets: ${celta ? '✅ Available' : '❌ Not yet'}`);
    console.log(`[${new Date().toLocaleTimeString()}] Mallorca tickets: ${mallorca ? '✅ Available' : '❌ Not yet'}`);

    if (mallorca && !notifiedMallorca) {
      try {
        const user = await client.users.fetch(process.env.USER_ID);
        await user.send(`🎟️ Mallorca tickets are available! Buy now: ${URL}`);
        console.log('✅ Mallorca notification sent!');
        notifiedMallorca = true;
      } catch (err) {
        console.error('❌ Failed to send Discord message:', err);
      }
    }
  }, CHECK_INTERVAL);
}

client.once('ready', () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  startChecker();
});

client.login(process.env.DISCORD_TOKEN);
