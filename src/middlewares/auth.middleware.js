const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // 1. Busca o token no Header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
        return res.status(401).json({ error: 'Token mal formatado.' });
    }

    const [scheme, token] = parts;

    // 2. Verifica e Decodifica
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido ou expirado.' });
        }

        // 3. Injeta dados de segurança na requisição
        req.userId = decoded.id;     // CPF
        req.userRole = decoded.role; // admin, gestor, funcionario
        req.userName = decoded.nome; // Nome (usado para filtrar LIDER)

        return next();
    });
};