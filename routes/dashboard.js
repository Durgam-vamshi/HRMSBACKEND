
const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/dashboardController");

router.get("/stats", async (req, res) => {
  const db = req.db;
  return getDashboardStats(req, res, db);
});

module.exports = router;
