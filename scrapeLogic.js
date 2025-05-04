const puppeteer = require('puppeteer');

const URL = 'https://www.realmadrid.com/en-US/tickets?filter-tickets=vip;general&filter-football=primer-equipo-masculino';

async function scrapeLogic(res) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  try {
    await page.goto(URL, {
      waitUntil: ['domcontentloaded', 'networkidle2'],
      timeout: 10000
    });
    await new Promise(res => setTimeout(res, 10000));

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

    console.log('🎟️ Scraping completed:', foundMatches);
    res.json(foundMatches);
  } catch (err) {
    console.error('❌ Error in scraping:', err);
    res.status(500).json({ error: 'Scraping failed', details: err.message });
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeLogic };
