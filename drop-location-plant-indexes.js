import dotenv from 'dotenv';
dotenv.config();

import db from './src/models/index.js';

async function run() {
  try {
    await db.sequelize.authenticate();
    console.log("==Database connected successfully for cleanup==");

    // Drop unique index for LocationId in locations
    try {
      await db.sequelize.query(`ALTER TABLE locations DROP INDEX LocationId`);
      console.log("Dropped LocationId index from locations");
    } catch (e) {
      console.log("Failed to drop LocationId index:", e.message);
    }

    // Drop unique index for PlantId in plants
    try {
      await db.sequelize.query(`ALTER TABLE plants DROP INDEX PlantId`);
      console.log("Dropped PlantId index from plants");
    } catch (e) {
      console.log("Failed to drop PlantId index:", e.message);
    }

    console.log("==Cleanup complete!==");
    process.exit(0);
  } catch (error) {
    console.error("Error running script:", error);
    process.exit(1);
  }
}

run();
