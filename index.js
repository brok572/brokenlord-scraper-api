import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";

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

// ---------------- SCRAPER ----------------
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
      timeout: 10000,
      maxRedirects: 5,
      headers: {
        "User-Agent": "BrokenLordScraper/1.0"
      },
      validateStatus: () => true
    });

    const html = typeof response.data === "string" ? response.data : "";
    const $ = cheerio.load(html);

    const title = $("title").first().text() || null;
    const description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      null;

    const ogTitle = $('meta[property="og:title"]').attr("content") || null;
    const ogImage = $('meta[property="og:image"]').attr("content") || null;

    const metaTags = [];
    $("meta").each((_, el) => {
      const name = $(el).attr("name") || $(el).attr("property");
      const content = $(el).attr("content");
      if (name && content) metaTags.push({ name, content });
    });

    const links = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (href) links.push(href);
    });

    const images = [];
    $("img[src]").each((_, el) => {
      const src = $(el).attr("src");
      if (src) images.push(src);
    });

    res.json({
      status: true,
      brand: "Broken Lord",
      url: target,
      info: {
        status_code: response.status,
        content_type: response.headers["content-type"] || null,
        content_length: response.headers["content-length"] || null
      },
      meta: {
        title,
        description,
        og_title: ogTitle,
        og_image: ogImage,
        meta_tags: metaTags.slice(0, 50)
      },
      content: {
        links: links.slice(0, 200),
        images: images.slice(0, 200)
      }
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      brand: "Broken Lord",
      error: "Failed to fetch or parse URL",
      detail: err.message || String(err)
    });
  }
});

app.listen(3000, () => console.log("Broken Lord Scraper API running"));
