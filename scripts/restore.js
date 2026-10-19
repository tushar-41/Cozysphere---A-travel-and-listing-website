// Loads a backup made by scripts/backup.js into the configured database.
//
//   node scripts/restore.js [backupDir] [--if-empty]
//
// backupDir defaults to the newest folder in ./backups (or $BACKUP_DIR).
// A collection that already holds documents is never overwritten, so this is safe
// to re-run (it restores into ATLASDB_URL).
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();
const { inferCategory } = require("../utils/categories.js");

const { EJSON } = mongoose.mongo.BSON;
const url = process.env.ATLASDB_URL;
const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));

function pickBackupDir() {
  const root = process.env.BACKUP_DIR || path.join(__dirname, "..", "backups");
  if (args[0]) return path.resolve(args[0]);
  if (!fs.existsSync(root)) return null;
  if (fs.existsSync(path.join(root, "_summary.json"))) return root;
  const dirs = fs.readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(root, d.name, "_summary.json")))
    .map((d) => d.name)
    .sort();
  return dirs.length ? path.join(root, dirs[dirs.length - 1]) : null;
}

(async () => {
  const dir = pickBackupDir();
  if (!dir) {
    console.log("No backup found, starting with an empty database.");
    return;
  }
  await mongoose.connect(url, { serverSelectionTimeoutMS: 30000 });
  const db = mongoose.connection.db;
  console.log(`Restoring ${dir} into "${db.databaseName}"`);

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".json") || file.startsWith("_")) continue;
    const name = path.basename(file, ".json");
    const col = db.collection(name);
    if ((await col.estimatedDocumentCount()) > 0) {
      console.log(`  ${name}: already has data, skipped`);
      continue;
    }
    const docs = EJSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    if (name === "listings") {
      // Backups taken before categories/guest limits existed get sensible defaults.
      for (const l of docs) {
        if (!l.category) l.category = inferCategory(l.title, l.description);
        if (!l.maxGuests) l.maxGuests = 2 + (l.price > 3000 ? 6 : l.price > 1500 ? 4 : 2);
      }
    }
    if (docs.length) await col.insertMany(docs, { ordered: false });
    console.log(`  ${name}: ${docs.length} restored`);
  }
  await mongoose.disconnect();
})().catch((err) => {
  console.error("Restore failed:", err.message);
  process.exit(1);
});
