import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { app } from "./src/app.js";
import db from "./src/models/index.js";

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 8080;

// Seed default roles and admin user
const seedDatabase = async () => {
  const { Role, User } = db;

  // Create default roles if they don't exist
  const [adminRole] = await Role.findOrCreate({
    where: { role_name: "admin" },
    defaults: { role_name: "admin" },
  });

  const [employeeRole] = await Role.findOrCreate({
    where: { role_name: "employee" },
    defaults: { role_name: "employee" },
  });

  console.log("✅ Default roles seeded (admin, employee)");

  // Create default admin user if it doesn't exist
  const adminExists = await User.findOne({
    where: { email: "admin@admin.com" },
  });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await User.create({
      emp_id: "ADMIN001",
      emp_name: "System Admin",
      email: "admin@admin.com",
      password: hashedPassword,
      location: "Head Office",
      role_id: adminRole.id,
    });
    console.log(
      "==Default admin user created (email: admin@admin.com, password: admin123)==",
    );
  } else {
    console.log("==Admin user already exists==");
  }
};

// Ensure optional permit_number columns accept NULL (heals legacy NOT NULL schemas
// created before the models were changed to allowNull: true). Safe to run on every boot.
const ensureNullablePermitColumns = async () => {
  const fixes = [
    "ALTER TABLE ppe_inspections MODIFY COLUMN permit_number VARCHAR(255) NULL",
    "ALTER TABLE tools_lists MODIFY COLUMN permit_number VARCHAR(255) NULL",
  ];
  for (const sql of fixes) {
    try {
      await db.sequelize.query(sql);
    } catch (err) {
      // Ignore if already nullable or table missing; log anything else
      if (!/already|duplicate|doesn't exist|unknown/i.test(err.message)) {
        console.log(`ℹ️ Schema check (${sql.split(" ")[2]}): ${err.message}`);
      }
    }
  }
};

// Connect to database and sync tables, then start server
const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    console.log("==Database connected successfully==");

    await ensureNullablePermitColumns();

    // Sync all models only if DB_SYNC is set to true (saves 10-20 seconds on startup)
    if (process.env.DB_SYNC === "true") {
      await db.sequelize.sync();
      console.log("==Database tables synced successfully==");
    }

    // Seed default data
    await seedDatabase();

    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error.message);
    process.exit(1);
  }
};

startServer();
