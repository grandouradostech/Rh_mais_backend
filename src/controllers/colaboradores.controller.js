const supabase = require('../config/supabase');
const fixText = require('../utils/textFixer'); // Importa o nosso corretor

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
        let query = supabase.from('QLP').select('*');
        if (req.userRole === 'admin') {
            console.log('-> Acesso ADMIN: Visualização completa.');
        } 
        else if (req.userRole === 'gestor') {
            console.log(`-> Acesso GESTOR: Filtrando liderados de "${req.userName}"`);
            query = query.ilike('LIDER', `%${req.userName}%`);
        } 
        else {
            console.log(`-> Acesso FUNCIONÁRIO: Restrito ao CPF ${req.userId}`);
            query = query.eq('CPF', req.userId);
        }
        const { data, error } = await query;

        if (error) throw error;
        if (!data || data.length === 0) {
            return res.json({ sucesso: true, dados: [] });
        }

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