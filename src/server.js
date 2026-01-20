require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Importação das Rotas
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const colaboradoresRoutes = require('./routes/colaboradores.routes'); // <--- ESSENCIAL

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware Global
app.use(cors()); 
app.use(express.json()); 

// === REGISTRO DAS ROTAS ===

// 1. Rotas de Autenticação (Login) -> /auth/login
app.use('/auth', authRoutes);

// 2. Rotas da API (Protegidas) -> /api/dashboard, /api/colaboradores
app.use('/api', dashboardRoutes);
app.use('/api', colaboradoresRoutes); // <--- A LINHA QUE FALTAVA

// Rota de teste na raiz (opcional, só pra saber se tá vivo)
app.get('/', (req, res) => {
    res.send('Servidor Backend rodando! 🚀');
});

app.listen(PORT, () => {
    console.log(`🔥 Backend rodando na porta ${PORT}`);
});