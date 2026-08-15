import db from "../models/index.js";

async function fix() {
  const sequelize = db.sequelize;
  try {
    console.log("Adding VendorCode to organizations...");
    await sequelize.query(
      "ALTER TABLE `organizations` ADD COLUMN `VendorCode` VARCHAR(100) NULL AFTER `OrgName`"
    );
    console.log("✅ Fixed organizations table.");
  } catch (err) {
    if (err.original && err.original.code === "ER_DUP_FIELDNAME") {
      console.log("VendorCode already exists in organizations.");
    } else {
      console.error("Error:", err);
    }
  }
  await sequelize.close();
  process.exit(0);
}
fix();
