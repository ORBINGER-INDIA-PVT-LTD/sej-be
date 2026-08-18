/**
 * drop_ppe_inspection_records.js
 *
 * Drops ONLY the PPE inspection record tables (ppe_inspection_items,
 * ppe_inspection_employees, ppe_inspections) and recreates them empty.
 * PPE templates (ppecl / ppecl_status) are NOT touched.
 *
 * Run: node src/scripts/drop_ppe_inspection_records.js
 */

import db from "../models/index.js";

async function run() {
  const sequelize = db.sequelize;

  await sequelize.authenticate();
  console.log("✅ Connected to MySQL via Sequelize");

  const countRows = async (table) => {
    try {
      const [[{ count }]] = await sequelize.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
      return count;
    } catch {
      return 0;
    }
  };

  const itemCount = await countRows("ppe_inspection_items");
  const empCount = await countRows("ppe_inspection_employees");
  const inspCount = await countRows("ppe_inspections");
  console.log(
    `📊 About to delete: ${inspCount} inspection(s), ${empCount} employee row(s), ${itemCount} item row(s)`
  );

  console.log("\n🧹 Dropping ppe_inspection_items...");
  await sequelize.query("DROP TABLE IF EXISTS `ppe_inspection_items`");
  console.log("✅ Dropped ppe_inspection_items");

  console.log("🧹 Dropping ppe_inspection_employees...");
  await sequelize.query("DROP TABLE IF EXISTS `ppe_inspection_employees`");
  console.log("✅ Dropped ppe_inspection_employees");

  console.log("🧹 Dropping ppe_inspections...");
  await sequelize.query("DROP TABLE IF EXISTS `ppe_inspections`");
  console.log("✅ Dropped ppe_inspections");

  console.log("\n🔨 Recreating tables from models...");
  await db.PpeInspection.sync();
  await db.PpeInspectionEmployee.sync();
  await db.PpeInspectionItem.sync();
  console.log("✅ Recreated ppe_inspections, ppe_inspection_employees, ppe_inspection_items (with location column)");

  const [[{ count: newInspCount }]] = await sequelize.query(
    "SELECT COUNT(*) AS count FROM ppe_inspections"
  );
  console.log(`\n🎉 Done! ppe_inspections is now empty (${newInspCount} records).`);
  await sequelize.close();
}

run().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});