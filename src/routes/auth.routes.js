const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Rotas Públicas
router.post('/login', authController.login);
router.post('/register', authController.register);

// Rotas Protegidas (Admin)
// Se authController.listarUsuarios estiver undefined, o erro acontece aqui 👇
router.get('/users', authMiddleware, authController.listarUsuarios);
router.put('/users/role', authMiddleware, authController.alterarPerfil);

module.exports = router;