const express = require('express');
const router = express.Router();
const tc = require('../controllers/teamController');

module.exports = (db) => {
  router.get('/', (req, res) => tc.listTeams(req, res, db));
  router.post('/', (req, res) => tc.createTeam(req, res, db));
  router.get('/:id', (req, res) => tc.getTeam(req, res, db));
  router.put('/:id', (req, res) => tc.updateTeam(req, res, db));
  router.delete('/:id', (req, res) => tc.deleteTeam(req, res, db));
  router.post('/:teamId/assign', (req, res) => tc.assignToTeam(req, res, db));
  router.post('/:teamId/unassign', (req, res) => tc.unassignFromTeam(req, res, db));
  return router;
};
