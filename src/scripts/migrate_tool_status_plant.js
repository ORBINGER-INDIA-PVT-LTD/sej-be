/**
 * migrate_tool_status_plant.js
 *
 * Adds plant column to tool_status.
 * Safe migration — does NOT delete or truncate any data.
 * Run: node src/scripts/migrate_tool_status_plant.js
 */

import db from "../models/index.js";

async function run() {
  const sequelize = db.sequelize;

  await sequelize.authenticate();
  console.log("✅ Connected to MySQL via Sequelize");

  console.log("\n📦 Adding plant column to tool_status...");
  try {
    await sequelize.query(
      "ALTER TABLE `tool_status` ADD COLUMN `plant` VARCHAR(255) NULL DEFAULT 'All'"
    );
    console.log("  ✅ Added plant to tool_status");
  } catch (err) {
    if (err.original && err.original.code === "ER_DUP_FIELDNAME") {
      console.log("  ⏭️  plant already exists in tool_status");
    } else {
      console.error("  ❌ Error adding plant:", err.message);
    }
  }

  console.log("\n🎉 Migration complete! Existing data preserved.");
  await sequelize.close();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});