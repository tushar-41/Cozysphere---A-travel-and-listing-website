const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const { inferCategory } = require("../utils/categories.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/listing";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDb = async () => {
  await Listing.deleteMany({});
  initData.data = initData.data.map((obj) => ({
    ...obj,
    owner: "67d587c3b66216fa59747f03",
    category: inferCategory(obj.title, obj.description),
    maxGuests: 2 + (obj.price > 3000 ? 6 : obj.price > 1500 ? 4 : 2),
  }));
  await Listing.insertMany(initData.data);
  console.log("data was initialised");
};

initDb();
