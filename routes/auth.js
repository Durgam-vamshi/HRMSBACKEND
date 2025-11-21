
const express = require('express');
const router = express.Router();
const { register, login, logout } = require('../controllers/authController');

module.exports = (db) => {
  router.post('/register', (req, res) => register(req, res, db));
  router.post('/login', (req, res) => login(req, res, db));
  
  router.post('/logout', (req, res) => logout(req, res, db));
  return router;
};
