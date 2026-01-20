exports.getDashboardData = (req, res) => {
    // Aqui você buscaria no banco de dados real
    res.json({
        sucesso: true,
        mensagem: 'Dados secretos do dashboard acessados com sucesso!',
        usuario_logado_id: req.userId, // Veio do Token JWT
        stats: {
            total_funcionarios: 150,
            ativos: 145,
            ferias: 5
        }
    });
};