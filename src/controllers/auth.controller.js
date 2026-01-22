const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
    console.log('--- Login Seguro com Verificação de Status (QLP) ---');
    
    const { cpf, senha } = req.body;

    if (!cpf || !senha) {
        return res.status(400).json({ error: 'CPF e senha são obrigatórios.' });
    }

    try {
        const cpfLimpo = String(cpf).replace(/\D/g, ''); 
        let { data: usuario, error } = await supabase
            .from('usuarios_sistema') 
            .select('*')
            .eq('cpf', cpfLimpo)
            .single();

        if (error || !usuario) {
            return res.status(401).json({ error: 'Usuário não encontrado.' });
        }

        const senhaBanco = usuario.senha || '';
        const senhaConfere = await bcrypt.compare(String(senha), senhaBanco);

        if (!senhaConfere) {
            console.warn('Senha inválida.');
            return res.status(401).json({ error: 'Senha incorreta.' });
        }
        if (usuario.perfil !== 'admin') {
            
            const { data: dadosRH, error: erroRH } = await supabase
                .from('QLP')
                .select('CLASSIFICACAO, SITUACAO')
                .eq('CPF', cpfLimpo) 
                .maybeSingle(); 

            if (dadosRH) {
                const classificacao = (dadosRH.CLASSIFICACAO || '').toUpperCase().trim();
                const situacao = (dadosRH.SITUACAO || '').toUpperCase().trim();

                console.log(`[Login Check] CPF: ${cpfLimpo} | Classificação: ${classificacao} | Situação: ${situacao}`);

                if (classificacao === 'RECUPERAR' || classificacao.includes('DESLIGAR')) {
                    return res.status(403).json({ error: 'Acesso negado. Consulte seu gestor (Status: Recuperação/Bloqueado).' });
                }

                if (situacao.includes('DESLIGADO') || situacao.includes('AFASTADO')) {
                    return res.status(403).json({ error: 'Acesso não permitido para colaboradores desligados ou afastados.' });
                }
            } else {
                console.warn("Usuário logou, mas não foi encontrado na tabela QLP.");
            }
        }
        const perfil = usuario.perfil || 'user';
        const token = jwt.sign(
            { id: usuario.cpf, role: perfil },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        return res.json({
            sucesso: true,
            usuario: {
                nome: usuario.nome || "Colaborador",
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