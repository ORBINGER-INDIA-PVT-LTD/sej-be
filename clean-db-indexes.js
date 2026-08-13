import dotenv from 'dotenv';
dotenv.config();

import db from './src/models/index.js';

async function run() {
  try {
    await db.sequelize.authenticate();
    console.log("==Database connected successfully for cleanup==");

    // Check users indexes
    const [usersIndexes] = await db.sequelize.query("SHOW INDEX FROM users");
    console.log(`Found ${usersIndexes.length} indexes on users.`);
    for (const idx of usersIndexes) {
      const name = idx.Key_name;
      if (name !== 'PRIMARY' && name !== 'emp_id' && (name.startsWith('emp_id') || name.includes('users_emp_id'))) {
        console.log(`Dropping index ${name} from users...`);
        try {
          await db.sequelize.query(`ALTER TABLE users DROP INDEX \`${name}\``);
        } catch (e) {
          console.error(`Failed to drop users index ${name}:`, e.message);
        }
      }
    }

    // Check roles indexes
    const [rolesIndexes] = await db.sequelize.query("SHOW INDEX FROM roles");
    console.log(`Found ${rolesIndexes.length} indexes on roles.`);
    for (const idx of rolesIndexes) {
      const name = idx.Key_name;
      if (name !== 'PRIMARY' && name !== 'role_name' && (name.startsWith('role_name') || name.includes('role_name_unique') || name.includes('roles_role_name'))) {
        console.log(`Dropping index ${name} from roles...`);
        try {
          await db.sequelize.query(`ALTER TABLE roles DROP INDEX \`${name}\``);
        } catch (e) {
          console.error(`Failed to drop roles index ${name}:`, e.message);
        }
      }
    }

    console.log("==Cleanup complete!==");
    process.exit(0);
  } catch (error) {
    console.error("Error running script:", error);
    process.exit(1);
  }
}

run();
