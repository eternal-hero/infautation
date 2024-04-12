const getDetails = require("./fetch");
const { insertData } = require("../utils/insert_data");
const puppeteer = require("puppeteer");

async function fetchSlugs(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--start-maximized"],
    timeout: 6000000,
    protocolTimeout: 6000000,
    defaultViewport: null,
  });
  const page = await browser.newPage();
  await page.goto(url);

  await page.waitForSelector('a[data-testid="reviewCard-title"]');
  const hrefValues = await page.$$eval(
    'a[data-testid="reviewCard-title"]',
    (links) => links.map((link) => link.getAttribute("href"))
  );
  const priceSymbol = await page.$eval(
    '[data-testid="searchResultCard-price"]',
    (el) => el.children[0].innerText
  );

  await browser.close();

  const lastSegments = hrefValues.map((uri) => {
    const segments = uri.split("/"); // Split the URI by '/'
    return segments.pop(); // Get the last segment
  });

  return { lastSegments, priceSymbol };
}

async function fetchReviewDetails(citySlug, restaurantSlug, priceSymbol) {
  const details = await getDetails(
    `https://www.theinfatuation.com/${citySlug}/reviews/${restaurantSlug}`
  );

  const baseQueryPath = `postReviewCollection({"limit":1,"where":{"canonicalPath":"/${citySlug}","slug":{"name":"${restaurantSlug}"}}})`;

  const reviewItem =
    details.props.pageProps.initialApolloState.ROOT_QUERY[baseQueryPath]
      .items[0];

  // Extract the details
  const name = reviewItem.title;
  const description = reviewItem.preview;
  const cuisine = reviewItem['cuisineTagsCollection({"limit":2})'].items.map(
    (item) => item.name
  );
  const streetAddress = reviewItem.venue.street;
  const neighborhood =
    reviewItem['neighborhoodTagsCollection({"limit":2})'].items[0]
      ?.displayName ?? "";

  const phoneNumber = reviewItem.venue.phone;
  const country = reviewItem.venue.country;
  const source = "The Infatuation";
  const city = reviewItem.venue.city;
  const rating = reviewItem.rating;
  const latitude = reviewItem.venue.latlong.lat;
  const longitude = reviewItem.venue.latlong.lon;
  const url = `https://www.theinfatuation.com/${citySlug}/reviews/${restaurantSlug}`;
  const entriesBlock = reviewItem.headerImageV2;

  const photos = (entriesBlock || []).flatMap((item) =>
    item && item.public_id
      ? [
          `https://res.cloudinary.com/the-infatuation/image/upload/c_fill,w_3840,ar_4:3,g_center,f_auto/${item.public_id}`,
        ]
      : []
  );
  const website = reviewItem.venue.url;
  const perfectFor = reviewItem["perfectForCollection"].items.map(
    (item) => item.name
  );

  const priceVal = reviewItem.venue.price;
  const price = priceSymbol.repeat(priceVal);

  // Return the details in an object
  return {
    name,
    description,
    cuisine,
    streetAddress,
    neighborhood,
    phoneNumber,
    country,
    source,
    city,
    rating,
    latitude,
    longitude,
    url,
    photos,
    website,
    perfectFor,
    price,
  };
}

async function slug_scraper(url, city, MONGODB_URI, DB_NAME, COLLECTION_NAME) {
  try {
    // Get the list of slugs in the city
    const fetchSlugsResult = await fetchSlugs(url);
    const slugs = fetchSlugsResult.lastSegments;
    const priceSymbol = fetchSlugsResult.priceSymbol;
    console.log(priceSymbol);

    console.log(slugs);
    console.log(slugs.length);
    const reviewsDetails = [];

    // Using a for loop to fetch details for each slug
    let index = 0;
    for (const slug of slugs) {
      index += 1;
      try {
        const detail = await fetchReviewDetails(city, slug, priceSymbol);
        reviewsDetails.push(detail);
        console.log(index, `Fetched details for ${slug}`);
      } catch (e) {}
    }
    console.log(reviewsDetails);
    // await insertData(reviewsDetails, MONGODB_URI, DB_NAME, COLLECTION_NAME);
  } catch (error) {
    console.error("Failed to fetch review details:", error);
  }
}

module.exports = {
  slug_scraper: slug_scraper,
};
