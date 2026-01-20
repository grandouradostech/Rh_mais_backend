const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // 1. Busca o token no Header (Authorization: Bearer <token>)
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }

    // 2. Separa o "Bearer" do token hash
    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
        return res.status(401).json({ error: 'Token mal formatado.' });
    }

    const [scheme, token] = parts;

    // 3. Verifica a assinatura criptográfica
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido ou expirado.' });
        }

        // 4. Sucesso: Coloca o ID do usuário na requisição para uso posterior
        req.userId = decoded.id;
        req.userRole = decoded.role;
        return next();
    });
};