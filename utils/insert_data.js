const { MongoClient } = require("mongodb");

async function insertData(listings, MONGODB_URI, db_name, collection_name) {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected correctly to server");

    const collection = client.db(db_name).collection(collection_name);

    const result = await collection.insertMany(listings);
    console.log(`${result.insertedCount} documents were inserted`);
  } catch (err) {
    console.log(err.stack);
  } finally {
    await client.close();
  }
}

module.exports = {
  insertData: insertData,
};
