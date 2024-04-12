require("dotenv").config();
const { MongoClient } = require("mongodb");

/* Modify the connection string as per your MongoDB database configurations, host and port */
const url = process.env.MONGODB_URI;

MongoClient.connect(url, function (err, client) {
  if (err) {
    console.log("Error occurred while connecting to MongoDB Atlas...\n", err);
  }
  console.log("Connected...");

  const dbName = "theInfautationGuide"; // Replace with your database name

  client.db(dbName).dropDatabase(function (err, result) {
    if (err) {
      console.log("Error occurred while deleting the database.\n", err);
    }
    console.log(result);
    client.close();
  });
});
