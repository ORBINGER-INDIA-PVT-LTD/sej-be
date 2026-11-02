/**
 * Change plant and location IDs from global uniqueness to vendor-scoped uniqueness.
 * Safe for existing data: removes only single-column unique indexes on the ID columns.
 * Run: node src/scripts/migrate_vendor_scoped_locations_plants.js
 */
import db from "../models/index.js";

const migrateTable = async (table, idColumn) => {
  const [indexes] = await db.sequelize.query(
    `SHOW INDEX FROM \`${table}\``
  );
  const groups = new Map();
  for (const index of indexes) {
    if (index.Key_name === "PRIMARY") continue;
    const group = groups.get(index.Key_name) || { nonUnique: index.Non_unique, columns: [] };
    group.columns.push(index.Column_name);
    groups.set(index.Key_name, group);
  }

  for (const [name, index] of groups) {
    if (Number(index.nonUnique) === 0 && index.columns.length === 1 && index.columns[0] === idColumn) {
      await db.sequelize.query(`ALTER TABLE \`${table}\` DROP INDEX \`${name}\``);
      console.log(`Dropped global unique index ${table}.${name}`);
    }
  }

  const [updatedIndexes] = await db.sequelize.query(`SHOW INDEX FROM \`${table}\``);
  const compositeIndexes = new Map();
  for (const index of updatedIndexes) {
    if (index.Key_name === "PRIMARY") continue;
    const columns = compositeIndexes.get(index.Key_name) || [];
    columns.push(index.Column_name);
    compositeIndexes.set(index.Key_name, columns);
  }
  const compositeExists = [...compositeIndexes.values()].some(
    (columns) => columns.length === 2 && columns[0] === "VendorCode" && columns[1] === idColumn
  );
  if (!compositeExists) {
    await db.sequelize.query(
      `ALTER TABLE \`${table}\` ADD UNIQUE INDEX \`uq_${table}_vendor_${idColumn}\` (\`VendorCode\`, \`${idColumn}\`)`
    );
    console.log(`Added vendor-scoped unique index ${table}.${idColumn}`);
  }
};

try {
  await db.sequelize.authenticate();
  await migrateTable("locations", "LocationId");
  await migrateTable("plants", "PlantId");
  console.log("Vendor-scoped location and plant uniqueness migration complete.");
} catch (error) {
  console.error("Migration failed:", error);
  process.exitCode = 1;
} finally {
  await db.sequelize.close();
}
