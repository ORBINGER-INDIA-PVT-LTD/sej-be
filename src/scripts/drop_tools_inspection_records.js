/**
 * drop_tools_inspection_records.js
 *
 * Drops ONLY the tools inspection record tables (tools_list_items, tools_lists)
 * and recreates them empty. Tool templates (tools_and_tackles / tool_statuses)
 * are NOT touched.
 *
 * Run: node src/scripts/drop_tools_inspection_records.js
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

  const itemCount = await countRows("tools_list_items");
  const listCount = await countRows("tools_lists");
  console.log(`📊 About to delete: ${listCount} inspection(s), ${itemCount} tool item(s)`);

  console.log("\n🧹 Dropping tools_list_items...");
  await sequelize.query("DROP TABLE IF EXISTS `tools_list_items`");
  console.log("✅ Dropped tools_list_items");

  console.log("🧹 Dropping tools_lists...");
  await sequelize.query("DROP TABLE IF EXISTS `tools_lists`");
  console.log("✅ Dropped tools_lists");

  console.log("\n🔨 Recreating tables from models...");
  await db.ToolsList.sync();
  await db.ToolsListItem.sync();
  console.log("✅ Recreated tools_lists and tools_list_items (with location column)");

  const [[{ count: newListCount }]] = await sequelize.query(
    "SELECT COUNT(*) AS count FROM tools_lists"
  );
  console.log(`\n🎉 Done! tools_lists is now empty (${newListCount} records).`);
  await sequelize.close();
}
run().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});