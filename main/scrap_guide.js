const getDetails = require("./fetch");
const { insertData } = require("../utils/insert_data");
const puppeteer = require("puppeteer");

async function fetchRestaurants(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--start-maximized"],
    timeout: 6000000,
    protocolTimeout: 6000000,
    defaultViewport: null,
  });
  const page = await browser.newPage();
  await page.goto(url);

  await page.waitForSelector('a[data-testid="venue-name-link"]');
  const hrefValues = await page.$$eval(
    'a[data-testid="venue-name-link"]',
    (links) => links.map((link) => link.getAttribute("href"))
  );

  await browser.close();

  const lastSegments = hrefValues.map((uri) => {
    const segments = uri.split("/"); // Split the URI by '/'
    return segments.pop(); // Get the last segment
  });

  return lastSegments;
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
  const country = "United States";
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

async function guide_scraper(url, city, MONGODB_URI, DB_NAME) {
  try {
    // Get the list of slugs in the city
    const slugs = await fetchRestaurants(url);
    const priceSymbol = "$";
    const identifier = url.split("/").pop(); // This is collection name
    console.log(identifier);
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
    await insertData(reviewsDetails, MONGODB_URI, DB_NAME, identifier);
  } catch (error) {
    console.error("Failed to fetch review details:", error);
  }
}

module.exports = {
  guide_scraper: guide_scraper,
};
