const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const controller = require('../controllers/colaboradores.controller');

// O prefixo '/api' vem do server.js, aqui definimos o resto: '/colaboradores'
// Resultado final: /api/colaboradores
router.get('/colaboradores', authMiddleware, controller.listar);

module.exports = router;