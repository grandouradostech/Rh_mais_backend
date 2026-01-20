const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // <--- IMPORTANTE

exports.login = async (req, res) => {
    console.log('--- Login Seguro (Bcrypt) ---');
    
    const { cpf, senha } = req.body;

    if (!cpf || !senha) {
        return res.status(400).json({ error: 'CPF e senha são obrigatórios.' });
    }

    try {
        const cpfLimpo = String(cpf).replace(/\D/g, ''); 

        // 1. Busca o usuário pelo CPF
        let { data: usuario, error } = await supabase
            .from('usuarios_sistema') 
            .select('*')
            .eq('cpf', cpfLimpo)
            .single();

        if (error || !usuario) {
            return res.status(401).json({ error: 'Usuário não encontrado.' });
        }

        // 2. A MÁGICA ACONTECE AQUI: Comparação de Hash
        const senhaBanco = usuario.senha || ''; // O Hash que está no banco
        
        // O bcrypt compara a senha digitada (texto) com o hash do banco
        const senhaConfere = await bcrypt.compare(String(senha), senhaBanco);

        if (!senhaConfere) {
            console.warn('Senha inválida (Hash não bateu).');
            return res.status(401).json({ error: 'Senha incorreta.' });
        }

        // 3. Sucesso: Gera o Token
        const perfil = usuario.perfil || 'user';
        const token = jwt.sign(
            { id: usuario.cpf, role: perfil },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        return res.json({
            sucesso: true,
            usuario: {
                nome: usuario.nome || "Colaborador", // Tente adicionar coluna 'nome' no usuarios_sistema depois
                role: perfil,
                id: usuario.cpf,
                foto: usuario.foto
            },
            token
        });

    } catch (err) {
        console.error("Erro interno:", err);
        return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
};