/**
 * migrate_location_forms.js
 *
 * Adds location columns to tools_lists and ppe_inspections.
 * Safe migration — does NOT delete or truncate any data.
 * Run: node src/scripts/migrate_location_forms.js
 */

import db from "../models/index.js";

const tableColumns = [
  {
    table: "tools_lists",
    columns: [{ name: "location", definition: "VARCHAR(255) NULL" }],
  },
  {
    table: "ppe_inspections",
    columns: [{ name: "location", definition: "VARCHAR(255) NULL" }],
  },
];

async function run() {
  const sequelize = db.sequelize;

  await sequelize.authenticate();
  console.log("✅ Connected to MySQL via Sequelize");

  for (const { table, columns } of tableColumns) {
    console.log(`\n📦 Adding columns to ${table}...`);
    for (const col of columns) {
      try {
        await sequelize.query(
          `ALTER TABLE \`${table}\` ADD COLUMN \`${col.name}\` ${col.definition}`,
        );
        console.log(`  ✅ Added ${col.name} to ${table}`);
      } catch (err) {
        if (err.original && err.original.code === "ER_DUP_FIELDNAME") {
          console.log(`  ⏭️  ${col.name} already exists in ${table}`);
        } else {
          console.error(`  ❌ Error adding ${col.name}:`, err.message);
        }
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