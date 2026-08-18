/**
 * migrate_create_plants.js
 *
 * Creates the plants table.
 * Safe migration — does NOT delete or truncate any data.
 * Run: node src/scripts/migrate_create_plants.js
 */

import db from "../models/index.js";

async function run() {
  const sequelize = db.sequelize;

  await sequelize.authenticate();
  console.log("✅ Connected to MySQL via Sequelize");

  console.log("\n📦 Creating plants table...");
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`plants\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`PlantId\` VARCHAR(10) NOT NULL UNIQUE,
      \`PlantName\` VARCHAR(255) NOT NULL,
      \`VendorCode\` VARCHAR(255) NULL,
      \`org_id\` INT NULL,
      \`createdAt\` DATETIME NOT NULL,
      \`updatedAt\` DATETIME NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("  ✅ plants table created");

  console.log("\n🎉 Migration complete!");
  await sequelize.close();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});