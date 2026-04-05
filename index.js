import express from "express";
import axios from "axios";

const app = express();

// ---------------- STATUS ----------------
app.get("/", (req, res) => {
  res.json({
    status: true,
    brand: "Broken Lord",
    message: "Scraper API is running",
    usage: "/scrape?url=https://example.com"
  });
});

// ---------------- SCRAPER (SAFE VERSION) ----------------
app.get("/scrape", async (req, res) => {
  const target = req.query.url;

  if (!target) {
    return res.status(400).json({
      status: false,
      brand: "Broken Lord",
      error: "Missing url parameter. Example: /scrape?url=https://example.com"
    });
  }

  if (!/^https?:\\/\\//i.test(target)) {
    return res.status(400).json({
      status: false,
      brand: "Broken Lord",
      error: "URL must start with http:// or https://"
    });
  }

  try {
    const response = await axios.get(target, {
      timeout: 8000,
      maxRedirects: 3,
      headers: {
        "User-Agent": "BrokenLordScraper/1.0"
      },
      validateStatus: () => true
    });

    const html = typeof response.data === "string" ? response.data : "";

    // -------- SAFE REGEX PARSING (NO CHEERIO) --------
    const titleMatch = html.match(/<title>(.*?)<\\/title>/i);
    const title = titleMatch ? titleMatch[1] : null;

    const descMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i
    );
    const description = descMatch ? descMatch[1] : null;

    const ogImageMatch = html.match(
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i
    );
    const ogImage = ogImageMatch ? ogImageMatch[1] : null;

    const links = [...html.matchAll(/href=["']([^"']+)["']/gi)]
      .map(m => m[1])
      .slice(0, 100);

    const images = [...html.matchAll(/<img[^>]*src=["']([^"']+)["']/gi)]
      .map(m => m[1])
      .slice(0, 100);

    res.json({
      status: true,
      brand: "Broken Lord",
      url: target,
      info: {
        status_code: response.status,
        content_type: response.headers["content-type"] || null
      },
      meta: {
        title,
        description,
        og_image: ogImage
      },
      content: {
        links,
        images
      }
    });

  } catch (err) {
    res.status(500).json({
      status: false,
      brand: "Broken Lord",
      error: "Failed to fetch URL",
      detail: err.message
    });
  }
});

app.listen(3000, () => console.log("Broken Lord Scraper API running"));
