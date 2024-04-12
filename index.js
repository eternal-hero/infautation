require("dotenv").config();
const { slug_scraper } = require("./main/scrap_slugs");
const { guide_scraper } = require("./main/scrap_guide");
// Slug spot page url and city name
const url = process.env.SLUG_URL;
const guide_url = process.env.GUIDE_URL;
const city = process.env.CITY_NAME;

// Database and collection names

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;
const COLLECTION_NAME = process.env.COLLECTION_NAME;

(async () => {
  console.log("started scraping...");
  // slug_scraper(url, city, MONGODB_URI, DB_NAME, COLLECTION_NAME);
  guide_scraper(url, city, MONGODB_URI, DB_NAME);
})();
