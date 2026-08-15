import db from "../models/index.js";

async function runMigration() {
  try {
    console.log("Starting Multi-Tenancy DB Migration...");
    const queryInterface = db.sequelize.getQueryInterface();

    // 1. Get default Organization ID
    const [orgs] = await db.sequelize.query("SELECT id FROM organizations ORDER BY id ASC LIMIT 1;");
    const defaultOrgId = orgs && orgs.length > 0 ? orgs[0].id : 1;
    console.log(`Default Organization ID for backfilling: ${defaultOrgId}`);

    const tablesToMigrate = [
      "users",
      "employees",
      "daily_job_plans",
      "tool_box_tackles",
      "tools_lists",
      "ppe_inspections",
      "ppe_checklists",
      "tools_and_tackles",
      "ppecl"
    ];

    for (const table of tablesToMigrate) {
      // Check if table exists
      const tableExists = await queryInterface.showAllTables().then(tables => tables.includes(table));
      if (!tableExists) {
        console.log(`Table '${table}' does not exist, skipping.`);
        continue;
      }

      // Check table column descriptions
      const tableDescription = await queryInterface.describeTable(table);
      
      if (!tableDescription.org_id) {
        console.log(`Adding 'org_id' column to table '${table}'...`);
        await db.sequelize.query(
          `ALTER TABLE \`${table}\` ADD COLUMN \`org_id\` INT NULL;`
        );
        console.log(`Added 'org_id' column to '${table}'.`);
      } else {
        console.log(`Table '${table}' already has 'org_id' column.`);
      }

      // Backfill existing rows with null org_id to defaultOrgId
      const [updateResult] = await db.sequelize.query(
        `UPDATE \`${table}\` SET \`org_id\` = ${defaultOrgId} WHERE \`org_id\` IS NULL;`
      );
      console.log(`Backfilled table '${table}' (affected rows: ${updateResult.affectedRows || 0}).`);
    }

    console.log("Multi-Tenancy DB Migration completed successfully with ZERO data loss!");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

runMigration();
