// ============================================
// MÓDULO CORE - SISTEMA INTEGRADO DE LOTES
// ============================================
// Este arquivo deve ser incluído em TODAS as páginas do sistema

const SistemaLotes = (function() {
  'use strict';

  // Configuração Supabase centralizada
  const SUPABASE_CONFIG = {
    url: "https://olcnpzqxwhwthpwuuzwv.supabase.co",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sY25wenF4d2h3dGhwd3V1end2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNzA2NTUsImV4cCI6MjA4MDY0NjY1NX0.GDTO8jNtOr-ZB1nPj9HqvytdaBt-eYoZnOLAauOjZLk"
  };

  let supabaseClient = null;

  // Inicializa o cliente Supabase
  function inicializar() {
    if (typeof supabase === 'undefined') {
      console.error('Supabase library não carregada!');
      return false;
    }
    supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
    return true;
  }

  // ==========================================
  // FUNÇÕES DE LOTES
  // ==========================================

  /**
   * Busca todos os lotes de um produto específico
   * @param {string} produtoNome - Nome do produto
   * @returns {Promise<Array>} Lista de lotes
   */
  async function buscarLotesPorProduto(produtoNome) {
    try {
      const { data, error } = await supabaseClient
        .from('vw_estoque_consolidado')
        .select('*')
        .eq('produto', produtoNome)
        .order('validade', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao buscar lotes:', err);
      return [];
    }
  }

  /**
   * Busca lote específico por ID
   * @param {string} loteId - UUID do lote
   * @returns {Promise<Object|null>}
   */
  async function buscarLotePorId(loteId) {
    try {
      const { data, error } = await supabaseClient
        .from('vw_estoque_consolidado')
        .select('*')
        .eq('lote_id', loteId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao buscar lote:', err);
      return null;
    }
  }

  /**
   * Busca todos os lotes consolidados com filtros opcionais
   * @param {Object} filtros - { status, produto, categoriaId }
   * @returns {Promise<Array>}
   */
  async function buscarTodosLotes(filtros = {}) {
    try {
      let query = supabaseClient
        .from('vw_estoque_consolidado')
        .select('*')
        .order('produto', { ascending: true })
        .order('validade', { ascending: true, nullsFirst: false });

      if (filtros.status) {
        query = query.eq('status_validade', filtros.status);
      }

      if (filtros.produto) {
        query = query.ilike('produto', `%${filtros.produto}%`);
      }

      if (filtros.categoriaId) {
        query = query.eq('categoria_id', filtros.categoriaId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao buscar lotes:', err);
      return [];
    }
  }

  /**
   * Agrupa lotes por produto
   * @param {Array} lotes - Array de lotes
   * @returns {Object} Objeto com produtos agrupados
   */
  function agruparLotesPorProduto(lotes) {
    const produtos = {};
    
    lotes.forEach(lote => {
      const nomeProduto = lote.produto;
      
      if (!produtos[nomeProduto]) {
        produtos[nomeProduto] = {
          nome: nomeProduto,
          categoria: lote.categoria,
          categoria_id: lote.categoria_id,
          unidade_medida: lote.unidade_medida,
          lotes: [],
          quantidadeTotal: 0,
          valorTotal: 0
        };
      }
      
      produtos[nomeProduto].lotes.push(lote);
      produtos[nomeProduto].quantidadeTotal += parseFloat(lote.quantidade || 0);
      produtos[nomeProduto].valorTotal += parseFloat(lote.quantidade || 0) * parseFloat(lote.preco_unitario || 0);
    });

    return produtos;
  }

  // ==========================================
  // FUNÇÕES DE MOVIMENTAÇÃO
  // ==========================================

  /**
   * Registra movimentação em um lote específico
   * @param {Object} movimentacao - Dados da movimentação
   * @returns {Promise<boolean>}
   */
  async function registrarMovimentacaoLote(movimentacao) {
    const {
      loteId,
      quantidade,
      tipo,
      usuarioId,
      observacao
    } = movimentacao;

    if (!loteId || !quantidade || !tipo || !usuarioId) {
      console.error('Dados incompletos para movimentação');
      return false;
    }

    try {
      // 1. Buscar dados atuais do lote
      const { data: lote, error: erroLote } = await supabaseClient
        .from('lotes_insumo')
        .select('*, insumos(id, nome)')
        .eq('id', loteId)
        .single();

      if (erroLote) throw erroLote;

      const quantidadeAtual = parseFloat(lote.quantidade || 0);
      const quantidadeMovimentada = parseFloat(quantidade);

      // 2. Validar quantidade disponível (para saídas)
      if (tipo === 'saida' && quantidadeMovimentada > quantidadeAtual) {
        throw new Error(`Quantidade insuficiente no lote. Disponível: ${quantidadeAtual}`);
      }

      // 3. Calcular nova quantidade
      let novaQuantidade;
      if (tipo === 'entrada') {
        novaQuantidade = quantidadeAtual + quantidadeMovimentada;
      } else if (tipo === 'saida') {
        novaQuantidade = quantidadeAtual - quantidadeMovimentada;
      } else {
        novaQuantidade = quantidadeMovimentada; // ajuste direto
      }

      // 4. Registrar movimentação
      const { error: erroMovimentacao } = await supabaseClient
        .from('movimentacoes')
        .insert([{
          insumo_id: lote.insumo_id,
          usuario_id: usuarioId,
          tipo_movimentacao: tipo,
          quantidade: quantidadeMovimentada,
          observacao: observacao || `Lote: ${lote.codigo_lote}`
        }]);

      if (erroMovimentacao) throw erroMovimentacao;

      // 5. Atualizar quantidade do lote
      const { error: erroUpdate } = await supabaseClient
        .from('lotes_insumo')
        .update({ quantidade: novaQuantidade })
        .eq('id', loteId);

      if (erroUpdate) throw erroUpdate;

      // 6. Se quantidade ficou zerada, pode deletar o lote (opcional)
      if (novaQuantidade <= 0) {
        await supabaseClient
          .from('lotes_insumo')
          .delete()
          .eq('id', loteId);
      }

      return true;
    } catch (err) {
      console.error('Erro ao registrar movimentação:', err);
      throw err;
    }
  }

  /**
   * Busca histórico de movimentações
   * @param {Object} filtros - { dataInicio, dataFim, insumoId, usuarioId }
   * @returns {Promise<Array>}
   */
  async function buscarHistoricoMovimentacoes(filtros = {}) {
    try {
      let query = supabaseClient
        .from('movimentacoes')
        .select(`
          *,
          insumos(nome),
          usuarios(nome)
        `)
        .order('created_at', { ascending: false });

      if (filtros.dataInicio) {
        query = query.gte('created_at', `${filtros.dataInicio}T00:00:00`);
      }

      if (filtros.dataFim) {
        query = query.lte('created_at', `${filtros.dataFim}T23:59:59`);
      }

      if (filtros.insumoId) {
        query = query.eq('insumo_id', filtros.insumoId);
      }

      if (filtros.usuarioId) {
        query = query.eq('usuario_id', filtros.usuarioId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
      return [];
    }
  }

  // ==========================================
  // FUNÇÕES DE RELATÓRIO
  // ==========================================

  /**
   * Busca produtos próximos da validade
   * @param {number} dias - Quantidade de dias
   * @returns {Promise<Array>}
   */
  async function buscarProximosVencimento(dias = 30) {
    try {
      const { data, error } = await supabaseClient
        .from('vw_estoque_consolidado')
        .select('*')
        .not('validade', 'is', null)
        .lte('dias_para_vencer', dias)
        .gte('dias_para_vencer', 0)
        .order('dias_para_vencer', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao buscar vencimentos:', err);
      return [];
    }
  }

  /**
   * Busca produtos já vencidos
   * @returns {Promise<Array>}
   */
  async function buscarProdutosVencidos() {
    try {
      const { data, error } = await supabaseClient
        .from('vw_estoque_consolidado')
        .select('*')
        .eq('status_validade', 'VENCIDO')
        .order('validade', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao buscar vencidos:', err);
      return [];
    }
  }

  /**
   * Busca produtos com estoque baixo
   * @returns {Promise<Array>}
   */
  async function buscarEstoqueBaixo() {
    try {
      // Agrupa lotes por produto e compara com estoque mínimo
      const { data: lotes, error } = await supabaseClient
        .from('vw_estoque_consolidado')
        .select('*');

      if (error) throw error;

      const produtos = agruparLotesPorProduto(lotes);
      const estoqueBaixo = [];

      for (const produtoNome in produtos) {
        const produto = produtos[produtoNome];
        
        // Buscar estoque mínimo do insumo
        const { data: insumo } = await supabaseClient
          .from('insumos')
          .select('estoque_minimo')
          .eq('nome', produtoNome)
          .single();

        const estoqueMinimo = insumo?.estoque_minimo || 5;

        if (produto.quantidadeTotal <= estoqueMinimo) {
          estoqueBaixo.push({
            ...produto,
            estoqueMinimo
          });
        }
      }

      return estoqueBaixo;
    } catch (err) {
      console.error('Erro ao buscar estoque baixo:', err);
      return [];
    }
  }

  // ==========================================
  // FUNÇÕES UTILITÁRIAS
  // ==========================================

  /**
   * Formata data para exibição
   * @param {string} dataStr - Data em string
   * @returns {string}
   */
  function formatarData(dataStr) {
    if (!dataStr) return '—';
    try {
      return new Date(dataStr).toLocaleDateString('pt-BR');
    } catch {
      return dataStr;
    }
  }

  /**
   * Formata data e hora
   * @param {string} dataStr - Data em string
   * @returns {string}
   */
  function formatarDataHora(dataStr) {
    if (!dataStr) return '—';
    try {
      return new Date(dataStr).toLocaleString('pt-BR');
    } catch {
      return dataStr;
    }
  }

  /**
   * Formata moeda
   * @param {number} valor
   * @returns {string}
   */
  function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  }

  /**
   * Retorna cor baseada no status da validade
   * @param {string} status
   * @returns {string}
   */
  function getCorStatus(status) {
    const cores = {
      'VENCIDO': '#e53935',
      'CRITICO': '#ff9800',
      'ATENCAO': '#ffc107',
      'OK': '#4caf50',
      'SEM_VALIDADE': '#757575'
    };
    return cores[status] || '#757575';
  }

  /**
   * Retorna ícone baseado no status
   * @param {string} status
   * @returns {string}
   */
  function getIconeStatus(status) {
    const icones = {
      'VENCIDO': '❌',
      'CRITICO': '🔴',
      'ATENCAO': '⚠️',
      'OK': '✅',
      'SEM_VALIDADE': '➖'
    };
    return icones[status] || '➖';
  }

  /**
   * Obtém usuário logado
   * @returns {Object|null}
   */
  function getUsuarioLogado() {
    try {
      const userData = localStorage.getItem('usuarioLogado');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  /**
   * Verifica se usuário está logado
   * @returns {boolean}
   */
  function verificarAutenticacao() {
    const usuario = getUsuarioLogado();
    if (!usuario) {
      alert('Você precisa estar logado para acessar esta página.');
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  // ==========================================
  // API PÚBLICA
  // ==========================================

  return {
    // Inicialização
    inicializar,
    
    // Lotes
    buscarLotesPorProduto,
    buscarLotePorId,
    buscarTodosLotes,
    agruparLotesPorProduto,
    
    // Movimentação
    registrarMovimentacaoLote,
    buscarHistoricoMovimentacoes,
    
    // Relatórios
    buscarProximosVencimento,
    buscarProdutosVencidos,
    buscarEstoqueBaixo,
    
    // Utilitários
    formatarData,
    formatarDataHora,
    formatarMoeda,
    getCorStatus,
    getIconeStatus,
    getUsuarioLogado,
    verificarAutenticacao,
    
    // Acesso ao cliente Supabase
    getClient: () => supabaseClient
  };
})();

// Auto-inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    SistemaLotes.inicializar();
  });
} else {
  SistemaLotes.inicializar();
}