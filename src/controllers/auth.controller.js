const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// === 1. LOGIN ===
exports.login = async (req, res) => {
    console.log('--- Login Seguro (RBAC) ---');
    const { cpf, senha } = req.body;

    if (!cpf || !senha) return res.status(400).json({ error: 'CPF e senha são obrigatórios.' });

    try {
        const cpfLimpo = String(cpf).replace(/\D/g, ''); 
        
        let { data: usuario, error } = await supabase
            .from('usuarios_sistema') 
            .select('*')
            .eq('cpf', cpfLimpo)
            .single();

        if (error || !usuario) return res.status(401).json({ error: 'Usuário não encontrado.' });

        const senhaBanco = usuario.senha || '';
        const senhaConfere = await bcrypt.compare(String(senha), senhaBanco);

        if (!senhaConfere) return res.status(401).json({ error: 'Senha incorreta.' });

        // Validação de Status (QLP)
        if (usuario.perfil !== 'admin') {
            const { data: dadosRH } = await supabase
                .from('QLP')
                .select('CLASSIFICACAO, SITUACAO')
                .eq('CPF', cpfLimpo) 
                .maybeSingle(); 

            if (dadosRH) {
                const situacao = (dadosRH.SITUACAO || '').toUpperCase().trim();
                if (situacao.includes('DESLIGADO') || situacao.includes('AFASTADO')) {
                    return res.status(403).json({ error: 'Acesso negado: Colaborador desligado ou afastado.' });
                }
            }
        }

        const perfil = usuario.perfil || 'funcionario';
        const token = jwt.sign(
            { id: usuario.cpf, role: perfil, nome: usuario.nome },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        return res.json({
            sucesso: true,
            usuario: { nome: usuario.nome, role: perfil, id: usuario.cpf, foto: usuario.foto },
            token
        });

    } catch (err) {
        console.error("Erro no Login:", err);
        return res.status(500).json({ error: 'Erro interno.' });
    }
};

// === 2. REGISTER ===
exports.register = async (req, res) => {
    console.log('--- Novo Registro ---');
    const { cpf, senha } = req.body;

    if (!cpf || !senha) return res.status(400).json({ error: 'Dados incompletos.' });

    try {
        const cpfLimpo = String(cpf).replace(/\D/g, '');

        const { data: usuarioExistente } = await supabase
            .from('usuarios_sistema').select('id').eq('cpf', cpfLimpo).single();

        if (usuarioExistente) return res.status(400).json({ error: 'CPF já cadastrado.' });

        const { data: funcionarioQLP } = await supabase
            .from('QLP').select('NOME, SITUACAO').eq('CPF', cpfLimpo).maybeSingle();

        if (!funcionarioQLP) return res.status(403).json({ error: 'CPF não encontrado na base de RH.' });

        const salt = await bcrypt.genSalt(10);
        const hashSenha = await bcrypt.hash(senha, salt);

        const { error: erroCriacao } = await supabase.from('usuarios_sistema').insert([{
            cpf: cpfLimpo,
            nome: funcionarioQLP.NOME,
            senha: hashSenha,
            perfil: 'funcionario',
            foto: null
        }]);

        if (erroCriacao) throw erroCriacao;

        return res.status(201).json({ sucesso: true, mensagem: 'Cadastro realizado!' });

    } catch (err) {
        console.error("Erro no Registro:", err);
        return res.status(500).json({ error: 'Erro ao cadastrar.' });
    }
};

// === 3. LISTAR TODOS OS USUÁRIOS (MODO DIAGNÓSTICO) ===
exports.listarUsuarios = async (req, res) => {
    try {
        console.log(`[DEBUG] Tentando listar usuários. Quem pede: ${req.userName} (${req.userRole})`);

        // Trava de Segurança (Mantida)
        if (req.userRole !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
        }

        const { data, error } = await supabase
            .from('usuarios_sistema')
            .select('*'); // Tenta pegar tudo

        if (error) {
            console.error("❌ Erro vindo do Supabase:", error);
            throw error; // Joga para o catch abaixo
        }

        console.log(`✅ Sucesso! ${data.length} usuários encontrados.`);
        return res.json({ sucesso: true, dados: data });

    } catch (err) {
        console.error("🔥 Erro CRÍTICO no try/catch:", err);
        
        // TRUQUE DE MESTRE: Devolve o erro técnico para o frontend (só para debug)
        return res.status(500).json({ 
            error: 'ERRO TÉCNICO: ' + (err.message || JSON.stringify(err)),
            details: err
        });
    }
};
// === 4. ALTERAR PERFIL (ADMIN) ===
exports.alterarPerfil = async (req, res) => {
    try {
        if (req.userRole !== 'admin') return res.status(403).json({ error: 'Acesso negado.' });

        const { cpfAlvo, novoPerfil } = req.body;
        
        const { error } = await supabase
            .from('usuarios_sistema')
            .update({ perfil: novoPerfil })
            .eq('cpf', cpfAlvo);

        if (error) throw error;
        return res.json({ sucesso: true, mensagem: 'Perfil atualizado!' });

    } catch (err) {
        console.error("Erro alterar perfil:", err);
        return res.status(500).json({ error: 'Erro ao atualizar.' });
    }
};