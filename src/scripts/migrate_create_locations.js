/**
 * migrate_create_locations.js
 *
 * Creates the locations table.
 * Safe migration — does NOT delete or truncate any data.
 * Run: node src/scripts/migrate_create_locations.js
 */

import db from "../models/index.js";

async function run() {
  const sequelize = db.sequelize;

  await sequelize.authenticate();
  console.log("✅ Connected to MySQL via Sequelize");

  console.log("\n📦 Creating locations table...");
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`locations\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`LocationId\` VARCHAR(10) NOT NULL UNIQUE,
      \`LocationName\` VARCHAR(255) NOT NULL,
      \`VendorCode\` VARCHAR(255) NULL,
      \`org_id\` INT NULL,
      \`createdAt\` DATETIME NOT NULL,
      \`updatedAt\` DATETIME NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("  ✅ locations table created");

  console.log("\n🎉 Migration complete!");
  await sequelize.close();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});