
require("dotenv").config();
const express = require("express");
const bodyParser = require("express").json;
const cors = require("cors");
const { initDb } = require("./config/db");
const { authMiddleware } = require("./middlewares/authMiddleware");
const { errorHandler } = require("./middlewares/errorHandler");

const app = express();

// Parse JSON body
app.use(bodyParser());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const PORT = process.env.PORT || 5000;

(async () => {
  const db = await initDb();

  app.get("/health", (req, res) => res.json({ ok: true }));

  // Auth routes
  const authRouter = require("./routes/auth")(db);
  app.use("/api/auth", authRouter);

  // Protected routes
  app.use("/api", authMiddleware);

  const dashboardRoutes = require("./routes/dashboard");

  app.use(
    "/api/dashboard",
    authMiddleware,
    async (req, res, next) => {
      req.db = db;
      next();
    },
    dashboardRoutes
  );

  const employeesRouter = require("./routes/employee")(db);
  const teamsRouter = require("./routes/teams")(db);
  const logsRouter = require("./routes/logs")(db);

  app.use("/api/employees", employeesRouter);
  app.use("/api/teams", teamsRouter);
  app.use("/api/logs", logsRouter);

  // Global error handler
  app.use(errorHandler);

  app.get("/", (req, res) => {
    res.send("HRMS Backend is running");
  });

  app.listen(PORT, () => {
    console.log(`HRMS backend listening on port ${PORT}`);
  });
})();
