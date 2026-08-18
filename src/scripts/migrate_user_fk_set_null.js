/**
 * migrate_user_fk_set_null.js
 *
 * Changes the user_id FK on all tables that reference users(id) to
 * ON DELETE SET NULL, so deleting a user keeps their records but
 * unlinks them (user_id -> NULL).
 *
 * Run: node src/scripts/migrate_user_fk_set_null.js
 */

import db from "../models/index.js";

const targets = [
  { table: "daily_job_plans", constraint: "daily_job_plans_ibfk_1" },
  { table: "ppe_checklists", constraint: "ppe_checklists_ibfk_1" },
  { table: "ppe_inspections", constraint: "ppe_inspections_ibfk_1" },
  { table: "ppecl", constraint: "ppecl_ibfk_1" },
  { table: "tool_box_tackles", constraint: "tool_box_tackles_ibfk_1" },
  { table: "tools_and_tackles", constraint: "tools_and_tackles_ibfk_1" },
  { table: "tools_lists", constraint: "tools_lists_ibfk_1" },
];

async function run() {
  const sequelize = db.sequelize;
  await sequelize.authenticate();
  console.log("✅ Connected to MySQL via Sequelize");

  for (const { table, constraint } of targets) {
    console.log(`\n🔧 Processing ${table} (${constraint})`);
    await sequelize.query(`ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${constraint}\``);
    console.log(`  ✅ Dropped FK ${constraint}`);
    await sequelize.query(`ALTER TABLE \`${table}\` MODIFY COLUMN user_id INT NULL`);
    console.log(`  ✅ user_id now nullable`);
    await sequelize.query(
      `ALTER TABLE \`${table}\` ADD CONSTRAINT \`${constraint}\` FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL`
    );
    console.log(`  ✅ Re-added FK with ON DELETE SET NULL`);
  }

  console.log("\n🎉 All user_id FKs are now ON DELETE SET NULL.");
  await sequelize.close();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});