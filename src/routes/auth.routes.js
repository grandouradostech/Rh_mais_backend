const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Define a rota POST /login
console.log('ggg');

router.post('/login', authController.login);

module.exports = router;