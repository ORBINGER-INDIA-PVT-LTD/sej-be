/**
 * migrate_vendorcode.js
 * 
 * Adds VendorCode column to all operational tables and truncates them for a fresh start.
 * The `organizations` table is NOT cleared.
 * Run: node src/scripts/migrate_vendorcode.js
 */

import db from "../models/index.js";

async function run() {
  const sequelize = db.sequelize;

  console.log("✅ Connected to MySQL via Sequelize");

  // Tables that need VendorCode column
  const tables = [
    "users",
    "employees",
    "daily_job_plans",
    "tool_box_tackles",
    "tools_lists",
    "ppe_inspections",
    "ppe_checklists",
    "tools_and_tackles",
    "ppecl",
  ];

  // Add VendorCode column to each table if not exists
  console.log("\n📦 Adding VendorCode columns...");
  for (const table of tables) {
    try {
      await sequelize.query(
        `ALTER TABLE \`${table}\` ADD COLUMN \`VendorCode\` VARCHAR(100) NULL AFTER \`id\``
      );
      console.log(`  ✅ Added VendorCode to ${table}`);
    } catch (err) {
      if (err.original && err.original.code === "ER_DUP_FIELDNAME") {
        console.log(`  ⏭️  VendorCode already exists in ${table}`);
      } else {
        console.error(`  ❌ Error altering ${table}:`, err.message);
      }
    }
  }

  // Truncate all child/leaf tables first, then parent tables
  const truncateOrder = [
    // Children first
    "hazards",
    "tool_box_tackle_actions",
    "tools_list_items",
    "ppe_inspection_employees",
    "ppe_inspection_items",
    "ppe_checklist_items",
    "tool_status",
    "ppecl_status",
    // Then parents
    "ppecl",
    "tools_and_tackles",
    "ppe_checklists",
    "ppe_inspections",
    "tools_lists",
    "tool_box_tackles",
    "daily_job_plans",
    "employees",
    "users",
  ];

  console.log("\n🗑️  Truncating tables for fresh start...");
  
  // Disable FK checks
  await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

  for (const table of truncateOrder) {
    try {
      await sequelize.query(`TRUNCATE TABLE \`${table}\``);
      console.log(`  ✅ Truncated ${table}`);
    } catch (err) {
      console.log(`  ⚠️  Could not truncate ${table}: ${err.message}`);
    }
  }

  // Re-enable FK checks
  await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

  console.log("\n🎉 Migration complete! All tables cleared. Organizations preserved.");
  await sequelize.close();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
