/**
 * migrate_tbt_location_duration.js
 *
 * Adds location and duration columns to tool_box_tackles.
 * Safe migration — does NOT delete or truncate any data.
 * Run: node src/scripts/migrate_tbt_location_duration.js
 */

import db from "../models/index.js";

const columns = [
  { name: "location", definition: "VARCHAR(255) NULL" },
  { name: "duration", definition: "VARCHAR(100) NULL" },
];

async function run() {
  const sequelize = db.sequelize;

  await sequelize.authenticate();
  console.log("✅ Connected to MySQL via Sequelize");

  console.log("\n📦 Adding location and duration columns to tool_box_tackles...");
  for (const col of columns) {
    try {
      await sequelize.query(
        `ALTER TABLE \`tool_box_tackles\` ADD COLUMN \`${col.name}\` ${col.definition}`,
      );
      console.log(`  ✅ Added ${col.name} to tool_box_tackles`);
    } catch (err) {
      if (err.original && err.original.code === "ER_DUP_FIELDNAME") {
        console.log(`  ⏭️  ${col.name} already exists in tool_box_tackles`);
      } else {
        console.error(`  ❌ Error adding ${col.name}:`, err.message);
      }
    }
  }

  console.log("\n🎉 Migration complete! Existing data preserved.");
  await sequelize.close();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
