require("dotenv").config();
const express = require("express");
const bodyParser = require("express").json;
const cors = require("cors");
const { initDb } = require("./config/db");
const { authMiddleware } = require("./middlewares/authMiddleware");
const { errorHandler } = require("./middlewares/errorHandler");

const app = express();

// app.use(
//   cors({
//     origin: [
//       "http://localhost:5173",
//       "http://127.0.0.1:5173",
//       "https://hrmsfrontend-5gyx.vercel.app",
//     ],
//     credentials: true,
//     allowedHeaders: ["Content-Type", "Authorization"],
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//   })
// );

app.use(bodyParser());

const PORT = process.env.PORT || 5000;

(async () => {
  const db = await initDb();

  app.get("/health", (req, res) => res.json({ ok: true }));

  // Auth routes
  const authRouter = require("./routes/auth")(db);
  app.use("/api/auth", authRouter);

  // protected routes
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

  app.use(errorHandler);

  app.get("/", (req, res) => {
    res.send("HRMS Backend is running ");
  });

  app.listen(PORT, () => {
    console.log(`HRMS backend listening on port ${PORT}`);
  });
})();
