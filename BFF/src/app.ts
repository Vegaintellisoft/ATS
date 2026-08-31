import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import candidateRoutes from "./routes/candidate.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import organizationRoutes from "./routes/organization.routes.js";
import teamsRoutes from "./routes/teams.routes.js";
import usersRoutes from "./routes/users.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import accountRoutes from "./routes/account.routes.js";
import requirementRoutes from "./routes/requirement.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import roleRoutes from "./routes/role.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

// ── Auth routes (public + protected inside) ─────────────────
app.use("/api/v1/auth", authRoutes);

// ── Feature routes (all protected inside via authenticate) ──
app.use("/api/v1/organizations", organizationRoutes);
app.use("/api/v1/teams", teamsRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/accounts", accountRoutes);
app.use("/api/v1/requirements", requirementRoutes);
app.use("/api/v1/applications", applicationRoutes);
app.use("/api/v1", candidateRoutes);
app.use("/api/v1", resumeRoutes);
app.use("/api/v1", reportsRoutes);
app.use("/api/v1/roles", roleRoutes);

export default app;