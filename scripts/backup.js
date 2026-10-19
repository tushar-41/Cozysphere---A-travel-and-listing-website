// Dumps every collection of the configured database to backups/<timestamp>/<collection>.json
// (Extended JSON, so ObjectIds and Dates survive a round trip).
//
//   node scripts/backup.js            -> database from ATLASDB_URL
//   node scripts/backup.js <mongoUrl> -> explicit database
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const { EJSON } = mongoose.mongo.BSON;
const url = process.argv[2] || process.env.ATLASDB_URL;
// Sessions are short-lived and encrypted with SECRET, so they are not worth carrying over.
const SKIP = new Set(["sessions"]);

(async () => {
  await mongoose.connect(url, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = path.join(__dirname, "..", "backups", stamp);
  fs.mkdirSync(dir, { recursive: true });

  const summary = { database: db.databaseName, createdAt: new Date().toISOString(), collections: {} };
  for (const { name } of await db.listCollections({}, { nameOnly: true }).toArray()) {
    if (SKIP.has(name) || name.startsWith("system.")) continue;
    const docs = await db.collection(name).find({}).toArray();
    fs.writeFileSync(path.join(dir, `${name}.json`), EJSON.stringify(docs, { relaxed: false }, 2));
    summary.collections[name] = docs.length;
  }
  fs.writeFileSync(path.join(dir, "_summary.json"), JSON.stringify(summary, null, 2));
  console.log(`Backup of "${summary.database}" written to ${dir}`);
  console.table(summary.collections);
  await mongoose.disconnect();
})().catch((err) => {
  console.error("Backup failed:", err.message);
  process.exit(1);
});
