const supabase = require('../config/supabase');
const fixText = require('../utils/textFixer'); // Importa o nosso corretor

const normalizeForMatch = (value) => {
    if (value === null || value === undefined) return '';
    let text = typeof value === 'string' ? value : String(value);
    text = text.trim();
    text = fixText(text);
    text = text.toLowerCase();
    text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    text = text.replace(/\s+/g, ' ');
    return text;
};

// Função auxiliar para pegar valor com segurança e aplicar a correção
const safeGet = (obj, key) => {
    if (!obj) return null;
    
    // Tenta pegar a chave exata ou minúscula
    let valor = obj[key] !== undefined ? obj[key] : (obj[key.toLowerCase()] !== undefined ? obj[key.toLowerCase()] : null);

    if (typeof valor === 'string') {
        valor = valor.trim(); 
        valor = fixText(valor); // Chama o script de limpeza aqui!
    }
    
    return valor;
};

exports.listar = async (req, res) => {
    try {
        console.log(`[Listar] Usuário: ${req.userName} | Perfil: ${req.userRole}`);
        const isAdmin = req.userRole === 'admin';
        let isGestor = req.userRole === 'gestor';
        let isFuncionario = !isAdmin && !isGestor;

        if (!isAdmin && isFuncionario) {
            const nomeUsuarioNorm = normalizeForMatch(req.userName);
            if (nomeUsuarioNorm && nomeUsuarioNorm !== normalizeForMatch('Usuário')) {
                const cpfUsuario = String(req.userId || '').trim();
                const orParts = [`LIDER.ilike.%${req.userName}%`];
                if (cpfUsuario) orParts.push(`LIDER.ilike.%${cpfUsuario}%`);

                const probe = await supabase
                    .from('QLP')
                    .select('ID')
                    .or(orParts.join(','))
                    .limit(1);

                if (!probe.error && Array.isArray(probe.data) && probe.data.length > 0) {
                    console.log(`-> Perfil ajustado: "${req.userName}" reconhecido como LÍDER (gestor).`);
                    isGestor = true;
                    isFuncionario = false;
                } else if (!probe.error) {
                    const lideres = await supabase.from('QLP').select('LIDER');
                    if (lideres.error) throw lideres.error;

                    const nomeNorm = normalizeForMatch(req.userName);
                    const cpfNorm = normalizeForMatch(req.userId);
                    const encontrado = (lideres.data || []).some((row) => {
                        const liderNorm = normalizeForMatch(row.LIDER ?? row.lider);
                        if (!liderNorm) return false;
                        if (nomeNorm && liderNorm.includes(nomeNorm)) return true;
                        if (cpfNorm && liderNorm.includes(cpfNorm)) return true;
                        return false;
                    });

                    if (encontrado) {
                        console.log(`-> Perfil ajustado: "${req.userName}" reconhecido como LÍDER (gestor).`);
                        isGestor = true;
                        isFuncionario = false;
                    }
                }
            }
        }

        console.log(`[Listar] Acesso: ${isAdmin ? 'admin' : isGestor ? 'gestor' : 'funcionario'}`);

        let data = null;
        let error = null;

        if (isAdmin) {
            console.log('-> Acesso ADMIN: Visualização completa.');
            ({ data, error } = await supabase.from('QLP').select('*'));
        } else if (isGestor) {
            const nomeGestor = normalizeForMatch(req.userName);
            if (!nomeGestor || nomeGestor === normalizeForMatch('Usuário')) {
                return res.status(403).json({ error: 'Acesso gestor sem nome válido para filtrar liderados.' });
            }

            const nomeRaw = String(req.userName || '').trim();
            const cpfGestor = String(req.userId || '').trim();
            const nomePartes = nomeRaw.split(/\s+/).filter(Boolean);
            const primeiroNome = nomePartes[0] || '';
            const primeiroDois = nomePartes.slice(0, 2).join(' ');

            const orParts = [];
            if (nomeRaw) orParts.push(`LIDER.ilike.%${nomeRaw}%`);
            if (primeiroDois && primeiroDois !== nomeRaw) orParts.push(`LIDER.ilike.%${primeiroDois}%`);
            if (primeiroNome && primeiroNome !== nomeRaw && primeiroNome !== primeiroDois) orParts.push(`LIDER.ilike.%${primeiroNome}%`);
            if (cpfGestor) orParts.push(`LIDER.ilike.%${cpfGestor}%`);

            console.log(`-> Acesso GESTOR: Filtrando liderados por LIDER usando ${orParts.length} chaves`);
            ({ data, error } = await supabase
                .from('QLP')
                .select('*')
                .or(orParts.join(',')));

            if (!error && (!data || data.length === 0)) {
                const fallback = await supabase.from('QLP').select('CPF,LIDER');
                if (fallback.error) throw fallback.error;
                const allRows = fallback.data || [];

                const nomeGestorNorm = normalizeForMatch(req.userName);
                const cpfGestorNorm = normalizeForMatch(req.userId);

                const cpfs = allRows.filter((row) => {
                    const liderNorm = normalizeForMatch(row.LIDER ?? row.lider);
                    if (!liderNorm) return false;
                    if (liderNorm === nomeGestorNorm) return true;
                    if (nomeGestorNorm && liderNorm.includes(nomeGestorNorm)) return true;
                    if (cpfGestorNorm && (liderNorm === cpfGestorNorm || liderNorm.includes(cpfGestorNorm))) return true;
                    return false;
                }).map((row) => String(row.CPF || '').trim()).filter(Boolean);

                if (cpfs.length > 0) {
                    const full = await supabase.from('QLP').select('*').in('CPF', cpfs);
                    if (full.error) throw full.error;
                    data = full.data || [];
                } else {
                    data = [];
                }
            }

            if (!error) {
                if (cpfGestor) {
                    const proprio = await supabase.from('QLP').select('*').eq('CPF', cpfGestor).maybeSingle();
                    if (proprio.error) throw proprio.error;

                    if (proprio.data) {
                        const jaTem = Array.isArray(data) && data.some((row) => String(row.CPF || '').trim() === cpfGestor);
                        if (!jaTem) {
                            data = Array.isArray(data) ? [proprio.data, ...data] : [proprio.data];
                        }
                    }
                }
            }
        } else {
            console.log(`-> Acesso FUNCIONÁRIO: Restrito ao CPF ${req.userId}`);
            ({ data, error } = await supabase.from('QLP').select('*').eq('CPF', req.userId));
        }

        if (error) throw error;
        if (!data || data.length === 0) {
            console.log('[Listar] Retorno: 0 registros');
            return res.json({ sucesso: true, dados: [] });
        }
        console.log(`[Listar] Retorno: ${data.length} registros`);

        const colaboradoresFormatados = data.map(colab => {
            const pdi = [];
            for (let i = 1; i <= 7; i++) {
                const comp = safeGet(colab, `COMPETENCIA_${i}`);
                if (comp) { 
                    pdi.push({
                        competencia: comp,
                        situacaoAcao: safeGet(colab, `SITUACAO_DA_ACAO_${i}`),
                        acao: safeGet(colab, `O_QUE_FAZER_${i}`),
                        motivo: safeGet(colab, `POR_QUE_FAZER_${i}`),
                        ajuda: safeGet(colab, `QUE_PODE_ME_AJUDAR_${i}`),
                        como: safeGet(colab, `COMO_VOU_FAZER_${i}`),
                        prazo: safeGet(colab, `DATA_DE_TERMINO_${i}`),
                        status: safeGet(colab, `STATUS_${i}`)
                    });
                }
            }

            return {
                id: safeGet(colab, 'ID'),
                nome: safeGet(colab, 'NOME'),
                cpf: safeGet(colab, 'CPF'),
                cargo: safeGet(colab, 'CARGO_ATUAL'),
                area: safeGet(colab, 'ATIVIDADE'),
                tempoEmpresa: safeGet(colab, 'TEMPO_DE_EMPRESA'),
                escolaridade: safeGet(colab, 'ESCOLARIDADE'),
                salario: safeGet(colab, 'SALARIO'),
                pcd: safeGet(colab, 'PCD'), 
                contato: safeGet(colab, 'CONTATO'),
                contatoEmergencia: safeGet(colab, 'CONT_FAMILIAR'),
                turno: safeGet(colab, 'TURNO'),
                lider: safeGet(colab, 'LIDER'),
                cargoAntigo: safeGet(colab, 'CARGO_ANTIGO'),
                dataPromocao: safeGet(colab, 'DATA_DA_PROMOCAO'),
                classificacao: safeGet(colab, 'CLASSIFICACAO'),
                situacao: safeGet(colab, 'SITUACAO'),
                foto: safeGet(colab, 'FOTO_PERFIL'),
                cicloGente: pdi 
            };
        });

        colaboradoresFormatados.sort((a, b) => {
            if(!a.nome) return 1;
            if(!b.nome) return -1;
            return a.nome.localeCompare(b.nome);
        });

        res.header("Content-Type", "application/json; charset=utf-8");
        
        return res.json({
            sucesso: true,
            dados: colaboradoresFormatados
        });

    } catch (error) {
        console.error('Erro backend:', error.message);
        return res.status(500).json({ error: 'Erro ao buscar dados.' });
    }
};
