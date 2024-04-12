const cheerio = require("cheerio");
const axios = require("axios");

async function getDetails(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const scriptContent = $("script#__NEXT_DATA__").html();
    // console.log("Script Content:", scriptContent);
    return JSON.parse(scriptContent);
  } catch (error) {
    console.error(error);
  }
}

module.exports = getDetails;
