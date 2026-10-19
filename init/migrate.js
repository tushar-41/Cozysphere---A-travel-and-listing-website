// Non-destructive backfill: gives pre-existing listings a category and guest capacity.
// Run once with: node init/migrate.js (uses ATLASDB_URL from .env)
require("dotenv").config();
const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const { inferCategory } = require("../utils/categories.js");

const MONGO_URL = process.env.ATLASDB_URL;

(async () => {
  await mongoose.connect(MONGO_URL);
  const listings = await Listing.collection
    .find({ $or: [{ category: { $exists: false } }, { maxGuests: { $exists: false } }] })
    .toArray();
  for (const l of listings) {
    const $set = {};
    if (!l.category) $set.category = inferCategory(l.title, l.description);
    if (!l.maxGuests) $set.maxGuests = 2 + (l.price > 3000 ? 6 : l.price > 1500 ? 4 : 2);
    await Listing.collection.updateOne({ _id: l._id }, { $set });
  }
  console.log(`backfilled ${listings.length} listings`);
  await mongoose.disconnect();
})();
