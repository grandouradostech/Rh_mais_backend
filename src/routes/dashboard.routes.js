const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const dashboardController = require('../controllers/dashboard.controller');

// Rota GET /api/dashboard (Protegida pelo middleware)
router.get('/dashboard', authMiddleware, dashboardController.getDashboardData);

module.exports = router;