import dotenv from 'dotenv';
dotenv.config();

import db from './src/models/index.js';

const PPE_KEYS = [
  "helmet",
  "safety_goggles",
  "nose_mask",
  "hand_gloves",
  "fr_jacket",
  "safety_shoes",
  "full_body_harness",
  "physical_fit_for_duty",
  "calibration_co_detector",
];

const normalizeEmployee = (emp) => {
  if (!emp) return null;
  if (typeof emp === "string") {
    const trimmed = emp.trim();
    if (!trimmed) return null;
    const item = { name: trimmed };
    PPE_KEYS.forEach((key) => {
      item[key] = "NA";
    });
    return item;
  }
  if (typeof emp === "object") {
    const name = (emp.name || emp.employee || emp.emp_name || "").trim();
    if (!name) return null;
    const item = { name };
    PPE_KEYS.forEach((key) => {
      item[key] = emp[key] || "NA";
    });
    return item;
  }
  return null;
};

const parseJsonArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

async function run() {
  try {
    await db.sequelize.authenticate();
    console.log("== Connected to DB for Tool Box Talk employee PPE update ==");

    const ToolBoxTackle = db.ToolBoxTackle;
    const records = await ToolBoxTackle.findAll();
    console.log(`Found ${records.length} Tool Box Talk records.`);

    let updatedCount = 0;
    for (const record of records) {
      const currentEmployees = parseJsonArray(record.employees);
      let needsUpdate = false;

      const normalized = currentEmployees.map((emp) => {
        if (typeof emp === "string") {
          needsUpdate = true;
        } else if (typeof emp === "object") {
          for (const key of PPE_KEYS) {
            if (!emp[key]) {
              needsUpdate = true;
              break;
            }
          }
        }
        return normalizeEmployee(emp);
      }).filter(Boolean);

      if (needsUpdate || normalized.length !== currentEmployees.length) {
        await record.update({ employees: normalized });
        updatedCount++;
      }
    }

    console.log(`Successfully updated ${updatedCount} records to include PPE checklist (NA default for legacy data).`);
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

run();
