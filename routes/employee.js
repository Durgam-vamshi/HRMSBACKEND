
const express = require('express');
const router = express.Router();
const ec = require('../controllers/employeeController');

module.exports = (db) => {
  router.get('/', (req, res) => ec.listEmployees(req, res, db));
  router.post('/', (req, res) => ec.createEmployee(req, res, db));
  router.get('/:id', (req, res) => ec.getEmployee(req, res, db));
  router.put('/:id', (req, res) => ec.updateEmployee(req, res, db));
  router.delete('/:id', (req, res) => ec.deleteEmployee(req, res, db));
  return router;
};
