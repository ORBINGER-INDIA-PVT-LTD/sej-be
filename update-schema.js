import dotenv from 'dotenv';
dotenv.config();

import db from './src/models/index.js';

async function run() {
  try {
    await db.sequelize.authenticate();
    console.log("==Connected to DB for schema update==");

    // Add columns to tools_list_items table
    console.log("Adding columns to tools_list_items...");
    try {
      await db.sequelize.query("ALTER TABLE tools_list_items ADD COLUMN after_report TEXT NULL");
      console.log("Added after_report to tools_list_items");
    } catch (e) {
      console.log("after_report might already exist or failed:", e.message);
    }

    try {
      await db.sequelize.query("ALTER TABLE tools_list_items ADD COLUMN after_report_date DATE NULL");
      console.log("Added after_report_date to tools_list_items");
    } catch (e) {
      console.log("after_report_date might already exist or failed:", e.message);
    }

    // Drop columns from tools_lists if they exist
    console.log("Dropping legacy columns from tools_lists...");
    try {
      await db.sequelize.query("ALTER TABLE tools_lists DROP COLUMN after_report");
      console.log("Dropped after_report from tools_lists");
    } catch (e) {
      console.log("No after_report column in tools_lists to drop:", e.message);
    }

    try {
      await db.sequelize.query("ALTER TABLE tools_lists DROP COLUMN after_report_date");
      console.log("Dropped after_report_date from tools_lists");
    } catch (e) {
      console.log("No after_report_date column in tools_lists to drop:", e.message);
    }

    console.log("==Schema update complete==");
    process.exit(0);
  } catch (error) {
    console.error("Error updating schema:", error);
    process.exit(1);
  }
}

run();
