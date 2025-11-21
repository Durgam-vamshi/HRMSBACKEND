const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/logController');

module.exports = (db) => {
  router.get('/', (req, res) => getLogs(req, res, db));
  return router;
};
