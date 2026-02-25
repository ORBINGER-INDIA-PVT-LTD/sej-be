import { Sequelize } from "sequelize";
import RoleModel from "./role.model.js";
import UserModel from "./user.model.js";
import EmployeeModel from "./employee.model.js";
import DailyJobPlanModel from "./dailyJobPlan.model.js";
import HazardModel from "./hazard.model.js";
import ToolsAndTacklesModel from "./toolsAndTackles.model.js";
import ToolStatusModel from "./toolStatus.model.js";
import PPEChecklistModel from "./ppeChecklist.model.js";
import PPEChecklistItemModel from "./ppeChecklistItem.model.js";
import ToolBoxTackleModel from "./toolBoxTackle.model.js";
import ToolBoxTackleActionModel from "./toolBoxTackleAction.model.js";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
  }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Role = RoleModel(sequelize, Sequelize);
db.User = UserModel(sequelize, Sequelize);
db.Employee = EmployeeModel(sequelize, Sequelize);
db.DailyJobPlan = DailyJobPlanModel(sequelize, Sequelize);
db.Hazard = HazardModel(sequelize, Sequelize);
db.ToolsAndTackles = ToolsAndTacklesModel(sequelize, Sequelize);
db.ToolStatus = ToolStatusModel(sequelize, Sequelize);
db.PPEChecklist = PPEChecklistModel(sequelize, Sequelize);
db.PPEChecklistItem = PPEChecklistItemModel(sequelize, Sequelize);
db.ToolBoxTackle = ToolBoxTackleModel(sequelize, Sequelize);
db.ToolBoxTackleAction = ToolBoxTackleActionModel(sequelize, Sequelize);

// Associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

export default db;
