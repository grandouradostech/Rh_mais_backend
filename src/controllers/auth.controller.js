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
        
        // Busca usuário (Select * funciona pois pega todas as colunas existentes)
        let { data: usuario, error } = await supabase
            .from('usuarios_sistema') 
            .select('*')
            .eq('cpf', cpfLimpo)
            .single();

        if (error || !usuario) return res.status(401).json({ error: 'Usuário não encontrado.' });

        const senhaBanco = usuario.senha || '';
        const senhaConfere = await bcrypt.compare(String(senha), senhaBanco);

        if (!senhaConfere) return res.status(401).json({ error: 'Senha incorreta.' });

        // Validação de Status no RH (Tabela QLP)
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

        let nomeUsuario = usuario.nome;
        if (!nomeUsuario) {
            const { data: dadosNome } = await supabase
                .from('QLP')
                .select('NOME')
                .eq('CPF', cpfLimpo)
                .maybeSingle();

            nomeUsuario = dadosNome?.NOME || null;
        }

        nomeUsuario = nomeUsuario || 'Usuário';
        const perfil = String(usuario.perfil || 'funcionario').trim().toLowerCase();

        const token = jwt.sign(
            { id: usuario.cpf, role: perfil, nome: nomeUsuario },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        return res.json({
            sucesso: true,
            usuario: { nome: nomeUsuario, role: perfil, id: usuario.cpf, foto: usuario.foto },
            token
        });

    } catch (err) {
        console.error("Erro no Login:", err);
        return res.status(500).json({ error: 'Erro interno.' });
    }
};

// === 2. REGISTER (Ajustado para sua tabela) ===
exports.register = async (req, res) => {
    console.log('--- Novo Registro ---');
    const { cpf, senha } = req.body;

    if (!cpf || !senha) return res.status(400).json({ error: 'Dados incompletos.' });

    try {
        const cpfLimpo = String(cpf).replace(/\D/g, '');

        // 1. Verifica duplicidade
        // CORREÇÃO: Buscamos 'cpf' em vez de 'id', pois sua tabela não tem id
        const { data: usuarioExistente } = await supabase
            .from('usuarios_sistema')
            .select('cpf') 
            .eq('cpf', cpfLimpo)
            .single();

        if (usuarioExistente) return res.status(400).json({ error: 'CPF já cadastrado.' });

        // 2. Valida na QLP (RH) e pega o NOME oficial
        const { data: funcionarioQLP } = await supabase
            .from('QLP')
            .select('NOME, SITUACAO')
            .eq('CPF', cpfLimpo)
            .maybeSingle();

        if (!funcionarioQLP) return res.status(403).json({ error: 'CPF não encontrado na base de RH.' });

        // 3. Cria usuário
        const salt = await bcrypt.genSalt(10);
        const hashSenha = await bcrypt.hash(senha, salt);

        // AQUI ESTAVA O ERRO ANTES: Estamos inserindo 'nome'. 
        // Agora que você rodou o SQL do Passo 1, isso vai funcionar!
        const { error: erroCriacao } = await supabase.from('usuarios_sistema').insert([
            {
                cpf: cpfLimpo,
                nome: funcionarioQLP.NOME, // Importante: Coluna deve existir no banco
                senha: hashSenha,
                perfil: 'funcionario',
                foto: null
            }
        ]);

        if (erroCriacao) {
            console.error("Erro Supabase:", erroCriacao); // Log para ajudar se der erro
            throw erroCriacao;
        }

        return res.status(201).json({ sucesso: true, mensagem: 'Cadastro realizado!' });

    } catch (err) {
        console.error("Erro no Registro:", err);
        return res.status(500).json({ error: 'Erro ao cadastrar.' });
    }
};

// === 3. LISTAR USUÁRIOS (ADMIN) ===
exports.listarUsuarios = async (req, res) => {
    try {
        if (req.userRole !== 'admin') return res.status(403).json({ error: 'Acesso negado.' });

        const { data, error } = await supabase
            .from('usuarios_sistema')
            .select('*')
            .order('nome', { ascending: true, nullsFirst: false }); // nullsFirst false joga quem ta sem nome pro final

        if (error) throw error;
        return res.json({ sucesso: true, dados: data });

    } catch (err) {
        console.error("Erro listar:", err);
        return res.status(500).json({ error: 'Erro ao buscar dados.' });
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
        console.error("Erro update:", err);
        return res.status(500).json({ error: 'Erro ao atualizar.' });
    }
};
