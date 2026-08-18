import { Sequelize } from "sequelize";
import RoleModel from "./role.model.js";
import UserModel from "./user.model.js";
import EmployeeModel from "./employee.model.js";
import DailyJobPlanModel from "./dailyJobPlan.model.js";
import HazardModel from "./hazard.model.js";
import PPEChecklistModel from "./ppeChecklist.model.js";
import PPEChecklistItemModel from "./ppeChecklistItem.model.js";
import ToolBoxTackleModel from "./toolBoxTackle.model.js";
import ToolBoxTackleActionModel from "./toolBoxTackleAction.model.js";
import OrganizationModel from "./organization.model.js";
import ToolsAndTacklesModel from "./toolsAndTackles.model.js";
import ToolStatusModel from "./toolStatus.model.js";
import PpeclModel from "./ppecl.model.js";
import PpeclStatusModel from "./ppeclStatus.model.js";
import ToolsListModel from "./toolsList.model.js";
import ToolsListItemModel from "./toolsListItem.model.js";
import PpeInspectionModel from "./ppeInspection.model.js";
import PpeInspectionItemModel from "./ppeInspectionItem.model.js";
import PpeInspectionEmployeeModel from "./ppeInspectionEmployee.model.js";
import LocationModel from "./location.model.js";
import PlantModel from "./plant.model.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sequelizeOptions = {
  host: process.env.DB_HOST,
  dialect: "mysql",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  logging: false,
};

// Automatically enable SSL support for AWS RDS endpoints or when DB_SSL is true
if (
  process.env.DB_SSL === "true" ||
  (process.env.DB_HOST && process.env.DB_HOST.includes("amazonaws.com"))
) {
  const pemPath = path.join(__dirname, "../config/global-bundle.pem");
  if (fs.existsSync(pemPath)) {
    sequelizeOptions.dialectOptions = {
      ssl: {
        ca: fs.readFileSync(pemPath),
        rejectUnauthorized: true,
      },
    };
  }
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  sequelizeOptions
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Role = RoleModel(sequelize, Sequelize);
db.User = UserModel(sequelize, Sequelize);
db.Employee = EmployeeModel(sequelize, Sequelize);
db.DailyJobPlan = DailyJobPlanModel(sequelize, Sequelize);
db.Hazard = HazardModel(sequelize, Sequelize);
db.PPEChecklist = PPEChecklistModel(sequelize, Sequelize);
db.PPEChecklistItem = PPEChecklistItemModel(sequelize, Sequelize);
db.ToolBoxTackle = ToolBoxTackleModel(sequelize, Sequelize);
db.ToolBoxTackleAction = ToolBoxTackleActionModel(sequelize, Sequelize);
db.Organization = OrganizationModel(sequelize, Sequelize);
db.ToolsAndTackles = ToolsAndTacklesModel(sequelize, Sequelize);
db.ToolStatus = ToolStatusModel(sequelize, Sequelize);
db.Ppecl = PpeclModel(sequelize, Sequelize);
db.PpeclStatus = PpeclStatusModel(sequelize, Sequelize);
db.ToolsList = ToolsListModel(sequelize, Sequelize);
db.ToolsListItem = ToolsListItemModel(sequelize, Sequelize);
db.PpeInspection = PpeInspectionModel(sequelize, Sequelize);
db.PpeInspectionEmployee = PpeInspectionEmployeeModel(sequelize, Sequelize);
db.PpeInspectionItem = PpeInspectionItemModel(sequelize, Sequelize);
db.Location = LocationModel(sequelize, Sequelize);
db.Plant = PlantModel(sequelize, Sequelize);

// Associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

export default db;
