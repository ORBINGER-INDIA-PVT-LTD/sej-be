import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "../src/routes/auth.routes.js";
import dailyJobPlanRoutes from "../src/routes/dailyJobPlan.routes.js";
import toolsAndTacklesRoutes from "../src/routes/toolsAndTackles.routes.js";
import ppeChecklistRoutes from "../src/routes/ppeChecklist.routes.js";
import toolBoxTackleRoutes from "../src/routes/toolBoxTackle.routes.js";
import employeeRoutes from "../src/routes/employee.routes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Safe execution of job API Running..." });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/daily-job-plans", dailyJobPlanRoutes);
app.use("/api/tools-and-tackles", toolsAndTacklesRoutes);
app.use("/api/ppe-checklists", ppeChecklistRoutes);
app.use("/api/tool-box-tackles", toolBoxTackleRoutes);
app.use("/api/employees", employeeRoutes);

export { app };
