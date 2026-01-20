/**
 * Utilitários para normalização e limpeza de dados
 * Fornece funções robustas para corrigir caracteres acentuados e especiais em português
 * Baseado no dicionário de correções do sistema legado.
 */
module.exports = (texto) => {
    if (typeof texto !== 'string' || !texto) return texto;

    // 1. Remover caracteres inválidos/corruptos (Replacement Character)
    texto = texto.replace(/\uFFFD/g, '');
    
    // 2. Dicionário completo de correções comuns (maiúsculas - substituição exata de palavra)
    const correcoesAcentos = {
        // Letras com til - Negação e Variados
        'NAO': 'NÃO', 'NOES': 'NÕES', 'NAE': 'NÃE',
        'MUITISSIMO': 'MUITÍSSIMO', 'OTIMO': 'ÓTIMO',
        'ACAO': 'AÇÃO', 'ACOES': 'AÇÕES', 'ALEM': 'ALÉM',
        'SAUCAO': 'SAUÇÃO', 'SITUACAO': 'SITUAÇÃO',
        'SITUACOES': 'SITUAÇÕES', 'SITUAES': 'SITUAÇÕES',
        'EXCECAO': 'EXCEÇÃO', 'EXCECOES': 'EXCEÇÕES',
        'PRESERVACAO': 'PRESERVAÇÃO', 'OBTENCAO': 'OBTENÇÃO',
        'ATENCAO': 'ATENÇÃO', 'INTENCAO': 'INTENÇÃO',
        'PENSAO': 'PENSÃO', 'REMUNERACAO': 'REMUNERAÇÃO',
        'REMUNERACOES': 'REMUNERAÇÕES', 'RETENCAO': 'RETENÇÃO',
        'CONVENCAO': 'CONVENÇÃO', 'DIMENSAO': 'DIMENSÃO',
        'DIMENSOES': 'DIMENSÕES', 'EXTENSAO': 'EXTENSÃO',
        'RETOMACAO': 'RETOMAÇÃO',
        'TAMBM': 'TAMBÉM', 'TAMBEM': 'TAMBÉM',
        'VISO': 'VISÃO', 'VISAO': 'VISÃO', 'VISOES': 'VISÕES',
        'JA': 'JÁ', 'J': 'JÁ', 'S': 'ÁS',

        // Acentos agudos, cedilhas, etc.
        'ANALISE': 'ANÁLISE', 'ANLISE': 'ANÁLISE',
        'ANALITICA': 'ANALÍTICA', 'ANALITICO': 'ANALÍTICO',
        'COMPETENCIA': 'COMPETÊNCIA', 'COMPETENCIAS': 'COMPETÊNCIAS', 'COMPETNCIAS': 'COMPETÊNCIAS',
        'BSICA': 'BÁSICA', 'BASICA': 'BÁSICA', 'BASICO': 'BÁSICO',
        'BASICOS': 'BÁSICOS', 'BASICAS': 'BÁSICAS',
        'LOGISTICA': 'LOGÍSTICA', 'LOGISTICO': 'LOGÍSTICO',
        'LOGISTICAS': 'LOGÍSTICAS', 'LOGISTICOS': 'LOGÍSTICOS',
        'METRICA': 'MÉTRICA', 'METRICAS': 'MÉTRICAS',
        'CRITICA': 'CRÍTICA', 'CRITICAS': 'CRÍTICAS', 'CRTICAS': 'CRÍTICAS',
        'CRITICO': 'CRÍTICO', 'CRITICOS': 'CRÍTICOS',
        'MODULO': 'MÓDULO', 'MODULOS': 'MÓDULOS',
        'FORMULA': 'FÓRMULA', 'FORMULAS': 'FÓRMULAS',
        'AREA': 'ÁREA', 'AREAS': 'ÁREAS',
        'ESPECIFICO': 'ESPECÍFICO', 'ESPECIFICOS': 'ESPECÍFICOS',
        'ESPECIFICA': 'ESPECÍFICA', 'ESPECIFICAS': 'ESPECÍFICAS',
        'EMPATICA': 'EMPÁTICA', 'EMPATICO': 'EMPÁTICO',
        'EMPATICAS': 'EMPÁTICAS', 'EMPATICOS': 'EMPÁTICOS',
        'EMPTICA': 'EMPÁTICA', 'EMPTICOS': 'EMPÁTICOS', 'EMPTICAS': 'EMPÁTICAS',
        'HIERARQUIA': 'HIERARQUIA', 'HIERARCHIA': 'HIERARQUIA',
        'HELIANDRO': 'HELIANDRO', 'ELIANDRO': 'ELIANDRO',
        'GESTO': 'GESTÃO', 'GESTOS': 'GESTÕES',
        'DISTRIBUICAO': 'DISTRIBUIÇÃO', 'DISTRIBUICOES': 'DISTRIBUIÇÕES', 'DISTRIBUIO': 'DISTRIBUIÇÃO',
        
        // Verbos Começar
        'COMEAR': 'COMEÇAR', 'COMECA': 'COMEÇA', 'COMECAM': 'COMEÇAM',
        'COMECANDO': 'COMEÇANDO', 'COMECOU': 'COMEÇOU', 'COMECADA': 'COMEÇADA',
        'COMECADO': 'COMEÇADO', 'COMECADAS': 'COMEÇADAS', 'COMECADOS': 'COMEÇADOS',
        'COMECARA': 'COMEÇARÁ', 'COMECARAO': 'COMEÇARÃO', 'COMECARIA': 'COMEÇARIA',
        'COMECO': 'COMEÇO', 'COMECOS': 'COMEÇOS',

        // Palavras com ência/ença
        'EXPERIENCIA': 'EXPERIÊNCIA', 'EXPERIENCIAS': 'EXPERIÊNCIAS',
        'EXISTENCIA': 'EXISTÊNCIA', 'PRESENCIA': 'PRESENÇA', 'AUSENCIA': 'AUSÊNCIA',
        'SEQUENCIA': 'SEQUÊNCIA', 'FREQUENCIA': 'FREQUÊNCIA', 'TENDENCIA': 'TENDÊNCIA',
        'AGENCIA': 'AGÊNCIA', 'REGENCIA': 'REGÊNCIA', 'DECENCIA': 'DECÊNCIA',
        'VIOLENCIA': 'VIOLÊNCIA', 'PACIENCIA': 'PACIÊNCIA', 'IMPACIENCIA': 'IMPACIÊNCIA',
        'INTELIGENCIA': 'INTELIGÊNCIA',

        // Outros
        'VEZ': 'VÊZ', 'EXEMPLO': 'EXEMPLO', 'OBRIGADO': 'OBRIGADO',
        'FUNCAO': 'FUNÇÃO', 'FUNCOES': 'FUNÇÕES',
        'NEGOCIACAO': 'NEGOCIAÇÃO', 'CONCEITUAL': 'CONCEITUAL',
        'CONFIANCA': 'CONFIANÇA', 'CONFIANCAS': 'CONFIANÇAS', 'CONFIANA': 'CONFIANÇA',
        'ATUACAO': 'ATUAÇÃO',
        'OPERACAO': 'OPERAÇÃO', 'OPERACOES': 'OPERAÇÕES', 'OPERACAES': 'OPERAÇÕES',
        'COMUNICACAO': 'COMUNICAÇÃO', 'COMUNICACOES': 'COMUNICAÇÕES',
        'CONVERSACAO': 'CONVERSAÇÃO', 'CONVERSACOES': 'CONVERSAÇÕES',
        'LIDERANCA': 'LIDERANÇA', 'LIDERACAS': 'LIDERANÇAS', 'LIDERANACAS': 'LIDERANÇAS', 'LIDERCA': 'LIDERANÇA',
        'INTERACAO': 'INTERAÇÃO', 'INTERACOES': 'INTERAÇÕES', 'INTERCA': 'INTERAÇÃO', 'INTERACAS': 'INTERAÇÕES',
        'DECISAO': 'DECISÃO', 'DECISOES': 'DECISÕES', 'DECISO': 'DECISÃO', 'DECIOES': 'DECISÕES',
        'PRIORIZACAO': 'PRIORIZAÇÃO', 'PRIORIZAR': 'PRIORIZAR', 'PRIORIZA': 'PRIORIZA', 'PRIOZACAO': 'PRIORIZAÇÃO',
        'REUNIAO': 'REUNIÃO', 'REUNIOES': 'REUNIÕES', 'REUNIE': 'REUNIÃO', 'REUNIES': 'REUNIÕES',
        'SEGURANCA': 'SEGURANÇA', 'SEGURANCAS': 'SEGURANÇAS', 'SEGURAN': 'SEGURANÇA',
        'PUBLICO': 'PÚBLICO', 'PUBLICA': 'PÚBLICA', 'PUBLICOS': 'PÚBLICOS', 'PUBLICAS': 'PÚBLICAS',
        'EXPRESSO': 'EXPRESSÃO', 'EXPRESSOES': 'EXPRESSÕES', 'EXPRESAO': 'EXPRESSÃO', 'EXPRESSAO': 'EXPRESSÃO',
        'VERIFICACAO': 'VERIFICAÇÃO', 'VERIFICACOES': 'VERIFICAÇÕES', 'VERIFICAO': 'VERIFICAÇÃO',
        'INFLUENCIA': 'INFLUÊNCIA', 'INFLUENCIAS': 'INFLUÊNCIAS', 'INFLUENCA': 'INFLUÊNCIA', 'INFLUENCAS': 'INFLUÊNCIAS',
        'ANTECIPACAO': 'ANTECIPAÇÃO', 'ANTECIPACOES': 'ANTECIPAÇÕES',
        'DIFICULDADE': 'DIFICULDADE', 'DIFICULDADES': 'DIFICULDADES',
        'CAPACIDADE': 'CAPACIDADE', 'CAPACIDADES': 'CAPACIDADES',
        'RESPONSABILIDADE': 'RESPONSABILIDADE', 'RESPONSABILIDADES': 'RESPONSABILIDADES',
        'ESTRATEGIA': 'ESTRATÉGIA', 'ESTRATEGIAS': 'ESTRATÉGIAS',
        'ESTRATEGICA': 'ESTRATÉGICA', 'ESTRATEGICAS': 'ESTRATÉGICAS',
        'ESTRATEGICO': 'ESTRATÉGICO', 'ESTRATEGICOS': 'ESTRATÉGICOS',
        'ENTREGA': 'ENTREGA', 'ENTREGAS': 'ENTREGAS',
        'RISCO': 'RISCO', 'RISCOS': 'RISCOS',
        'REATIVO': 'REATIVO', 'REATIVOS': 'REATIVOS', 'REATIVA': 'REATIVA', 'REATIVAS': 'REATIVAS',
        'PROATIVO': 'PROATIVO', 'PROATIVOS': 'PROATIVOS', 'PROATIVA': 'PROATIVA', 'PROATIVAS': 'PROATIVAS',
        'MENTOR': 'MENTOR', 'MENTORES': 'MENTORES', 'MENTORIA': 'MENTORIA', 'MENTORIAS': 'MENTORIAS',
        
        // Adicionados do seu log recente
        'RESUTADOS': 'RESULTADOS', 'ANALTICA': 'ANALÍTICA', 'ANLISE': 'ANÁLISE', 
        'AVANADO': 'AVANÇADO', 'DELEGAO': 'DELEGAÇÃO', 'DELEGA': 'DELEGAÇÃO'
    };

    // Aplicar correções do dicionário (palavras exatas)
    for (const [erro, correto] of Object.entries(correcoesAcentos)) {
        // \b garante que substitua apenas a palavra inteira, não partes de palavras
        const regex = new RegExp(`\\b${erro}\\b`, 'g');
        texto = texto.replace(regex, correto);
    }

    // 3. Correções baseadas em REGEX (Padrões quebrados com pontos ou caracteres estranhos)
    const correcoesEspeciais = [
        { padrao: /SEGURAN\.A/g, correto: 'SEGURANÇA' },
        { padrao: /seguran\.a/g, correto: 'segurança' },
        { padrao: /CONFIAN\.A/g, correto: 'CONFIANÇA' },
        { padrao: /confian\.a/g, correto: 'confiança' },
        { padrao: /AN\.LISE/g, correto: 'ANÁLISE' },
        { padrao: /an\.lise/g, correto: 'análise' },
        { padrao: /ANAL\.TICA/g, correto: 'ANALÍTICA' },
        { padrao: /anal\.tica/g, correto: 'analítica' },
        { padrao: /DECIS\.ES/g, correto: 'DECISÕES' },
        { padrao: /decis\.es/g, correto: 'decisões' },
        { padrao: /REUNI\.ES/g, correto: 'REUNIÕES' },
        { padrao: /reuni\.es/g, correto: 'reuniões' },
        { padrao: /OPERA\.\.ES/g, correto: 'OPERAÇÕES' },
        { padrao: /opera\.\.es/g, correto: 'operações' },
        { padrao: /COMUNICA\.\.O/g, correto: 'COMUNICAÇÃO' },
        { padrao: /comunica\.\.o/g, correto: 'comunicação' },
        // Regex genéricos da sua lista
        { erro: /\bH\b/g, correto: 'HÁ' },
        { erro: /SEGURAN.A E PRECISO/g, correto: 'SEGURANÇA E PRECISÃO' },
        { erro: /COM MAIS SEGURAN.A/g, correto: 'COM MAIS SEGURANÇA' },
        { erro: / E PRECISO\./g, correto: ' E PRECISÃO.' },
        { erro: /Opera[^ ]{1,4}es/gi, correto: 'Operações' },
        { erro: /OPERA[^ ]{1,4}ES/g, correto: 'OPERAÇÕES' },
        { erro: /LIDERANA/g, correto: 'LIDERANÇA' },
        { erro: /EXPRESSO/g, correto: 'EXPRESSÃO' },
        { erro: /PRIORIZAO/g, correto: 'PRIORIZAÇÃO' },
        { erro: /SITUAO/g, correto: 'SITUAÇÃO' },
        { erro: /360/g, correto: '360°' } // Correção específica do seu log (360º)
    ];

    correcoesEspeciais.forEach(item => {
        // Suporte para chave 'padrao' ou 'erro' para compatibilidade com seus dois estilos
        const regex = item.padrao || item.erro;
        texto = texto.replace(regex, item.correto);
    });
    
    // 4. Correções condicionais finais (Pega tudo que tem ? ou ponto no meio de palavras chaves)
    if (texto.match(/[\?\.]/)) {
         texto = texto.replace(/COMPET.NCIAS/g, 'COMPETÊNCIAS')
                      .replace(/SEGURAN.A/g, 'SEGURANÇA')
                      .replace(/CONFIAN.A/g, 'CONFIANÇA')
                      .replace(/AN.LISE/g, 'ANÁLISE')
                      .replace(/ANAL.TICA/g, 'ANALÍTICA')
                      .replace(/DECIS.ES/g, 'DECISÕES')
                      .replace(/REUNI.ES/g, 'REUNIÕES')
                      .replace(/COMUNICA..O/g, 'COMUNICAÇÃO')
                      .replace(/OPERA..ES/g, 'OPERAÇÕES')
                      .replace(/A..O/g, 'AÇÃO') // Para "Ação (O que fazer)"
                      .replace(/A..ES/g, 'AÇÕES')
                      .replace(/DELEGA..O/g, 'DELEGAÇÃO')
                      .replace(/DELEGA.O/g, 'DELEGAÇÃO')
                      .replace(/SITUA..ES/g, 'SITUAÇÕES');
    }

    return texto;
};