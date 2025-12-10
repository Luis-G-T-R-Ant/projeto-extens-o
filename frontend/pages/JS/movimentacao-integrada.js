// ============================================
// MOVIMENTAÇÃO INTEGRADA - movimentacao.js
// ============================================
// Substitui o arquivo JS/movimentacao.js existente

(async function() {
  'use strict';

  // Elementos DOM
  const formMovimentacao = document.getElementById('formMovimentacao');
  const selectProduto = document.getElementById('insumoSelect');
  const selectLote = document.createElement('select');
  const inputQuantidade = document.getElementById('quantidadeRemover');
  const selectTipo = document.getElementById('tipoMovimentacao');
  const qtdAtual = document.getElementById('qtdAtual');
  const feedback = document.getElementById('feedback');

  let lotesDisponiveis = [];
  let loteAtual = null;

  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================

  async function inicializar() {
    // Verifica autenticação
    if (!SistemaLotes.verificarAutenticacao()) return;

    // Adiciona campo de seleção de lote ao formulário
    criarCampoLote();
    
    // Carrega produtos
    await carregarProdutos();

    // Event listeners
    selectProduto.addEventListener('change', handleProdutoChange);
    selectLote.addEventListener('change', handleLoteChange);
    formMovimentacao.addEventListener('submit', handleSubmit);
  }

  // ==========================================
  // INTERFACE
  // ==========================================

  function criarCampoLote() {
    // Encontra o grupo do campo de quantidade
    const grupoQuantidade = inputQuantidade.closest('.form-group');
    
    // Cria novo grupo para o lote
    const grupoLote = document.createElement('div');
    grupoLote.className = 'form-group';
    grupoLote.id = 'grupoLote';
    grupoLote.style.display = 'none';
    
    const label = document.createElement('label');
    label.htmlFor = 'loteSelect';
    label.innerHTML = 'Selecione o Lote <span style="color: #e53935;">*</span>';
    
    selectLote.id = 'loteSelect';
    selectLote.required = true;
    selectLote.innerHTML = '<option value="">Selecione um lote...</option>';
    
    grupoLote.appendChild(label);
    grupoLote.appendChild(selectLote);
    
    // Insere antes do campo de quantidade
    grupoQuantidade.parentNode.insertBefore(grupoLote, grupoQuantidade);
  }

  function mostrarFeedback(mensagem, tipo = 'sucesso') {
    feedback.textContent = mensagem;
    feedback.style.display = 'block';
    
    if (tipo === 'sucesso') {
      feedback.style.backgroundColor = '#d4edda';
      feedback.style.color = '#155724';
    } else {
      feedback.style.backgroundColor = '#f8d7da';
      feedback.style.color = '#721c24';
    }

    setTimeout(() => {
      feedback.style.display = 'none';
    }, 4000);
  }

  // ==========================================
  // CARREGAR DADOS
  // ==========================================

  async function carregarProdutos() {
    try {
      const lotes = await SistemaLotes.buscarTodosLotes();
      const produtos = SistemaLotes.agruparLotesPorProduto(lotes);

      selectProduto.innerHTML = '<option value="">Selecione um produto...</option>';

      Object.values(produtos).forEach(produto => {
        const option = document.createElement('option');
        option.value = produto.nome;
        option.textContent = `${produto.nome} (${produto.quantidadeTotal.toFixed(1)} ${produto.unidade_medida})`;
        option.dataset.quantidadeTotal = produto.quantidadeTotal;
        selectProduto.appendChild(option);
      });

    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      mostrarFeedback('Erro ao carregar produtos', 'erro');
    }
  }

  async function carregarLotesProduto(nomeProduto) {
    try {
      lotesDisponiveis = await SistemaLotes.buscarLotesPorProduto(nomeProduto);

      selectLote.innerHTML = '<option value="">Selecione um lote...</option>';

      if (lotesDisponiveis.length === 0) {
        selectLote.innerHTML = '<option value="">Nenhum lote disponível</option>';
        document.getElementById('grupoLote').style.display = 'none';
        qtdAtual.textContent = '0 unidades';
        return;
      }

      lotesDisponiveis.forEach(lote => {
        const option = document.createElement('option');
        option.value = lote.lote_id;
        
        const validadeTexto = lote.validade 
          ? SistemaLotes.formatarData(lote.validade)
          : 'Sem validade';
        
        const statusIcone = SistemaLotes.getIconeStatus(lote.status_validade);
        
        option.textContent = `${lote.codigo_lote} - ${lote.quantidade} ${lote.unidade_medida} - Val: ${validadeTexto} ${statusIcone}`;
        option.dataset.quantidade = lote.quantidade;
        option.dataset.codigoLote = lote.codigo_lote;
        
        selectLote.appendChild(option);
      });

      document.getElementById('grupoLote').style.display = 'block';

      // Auto-seleciona se houver apenas um lote
      if (lotesDisponiveis.length === 1) {
        selectLote.value = lotesDisponiveis[0].lote_id;
        handleLoteChange();
      }

    } catch (err) {
      console.error('Erro ao carregar lotes:', err);
      mostrarFeedback('Erro ao carregar lotes do produto', 'erro');
    }
  }

  // ==========================================
  // HANDLERS
  // ==========================================

  function handleProdutoChange() {
    const nomeProduto = selectProduto.value;
    
    if (!nomeProduto) {
      document.getElementById('grupoLote').style.display = 'none';
      qtdAtual.textContent = '—';
      inputQuantidade.value = '';
      inputQuantidade.max = '';
      return;
    }

    // Mostra quantidade total do produto
    const option = selectProduto.selectedOptions[0];
    const qtdTotal = option.dataset.quantidadeTotal || 0;
    qtdAtual.textContent = `Total: ${parseFloat(qtdTotal).toFixed(1)} unidades`;

    // Carrega lotes deste produto
    carregarLotesProduto(nomeProduto);
  }

  function handleLoteChange() {
    const loteId = selectLote.value;
    
    if (!loteId) {
      inputQuantidade.value = '';
      inputQuantidade.max = '';
      loteAtual = null;
      return;
    }

    const option = selectLote.selectedOptions[0];
    const quantidade = parseFloat(option.dataset.quantidade || 0);
    
    loteAtual = lotesDisponiveis.find(l => l.lote_id === loteId);
    
    qtdAtual.textContent = `Lote ${option.dataset.codigoLote}: ${quantidade.toFixed(1)} unidades disponíveis`;
    
    // Define quantidade máxima baseada no tipo
    const tipo = selectTipo.value;
    if (tipo === 'saida') {
      inputQuantidade.max = quantidade;
    } else {
      inputQuantidade.max = '';
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const loteId = selectLote.value;
    const quantidade = parseFloat(inputQuantidade.value);
    const tipo = selectTipo.value;
    const usuario = SistemaLotes.getUsuarioLogado();

    // Validações
    if (!loteId || !quantidade || !tipo || !usuario) {
      mostrarFeedback('Preencha todos os campos obrigatórios', 'erro');
      return;
    }

    if (quantidade <= 0) {
      mostrarFeedback('A quantidade deve ser maior que zero', 'erro');
      return;
    }

    // Validação extra para saída
    if (tipo === 'saida' && loteAtual) {
      const qtdDisponivel = parseFloat(loteAtual.quantidade || 0);
      if (quantidade > qtdDisponivel) {
        mostrarFeedback(`Quantidade insuficiente! Disponível: ${qtdDisponivel}`, 'erro');
        return;
      }
    }

    try {
      // Registra movimentação
      await SistemaLotes.registrarMovimentacaoLote({
        loteId: loteId,
        quantidade: quantidade,
        tipo: tipo,
        usuarioId: usuario.id,
        observacao: `${tipo.toUpperCase()} - Lote: ${loteAtual?.codigo_lote || loteId}`
      });

      mostrarFeedback(`✅ Movimentação registrada com sucesso!`, 'sucesso');

      // Limpa formulário
      formMovimentacao.reset();
      document.getElementById('grupoLote').style.display = 'none';
      qtdAtual.textContent = '—';

      // Recarrega produtos
      await carregarProdutos();

    } catch (err) {
      console.error('Erro ao registrar movimentação:', err);
      mostrarFeedback(`Erro: ${err.message}`, 'erro');
    }
  }

  // Adiciona handler para tipo de movimentação
  selectTipo.addEventListener('change', () => {
    if (loteAtual && selectTipo.value === 'saida') {
      inputQuantidade.max = loteAtual.quantidade;
    } else {
      inputQuantidade.max = '';
    }
  });

  // ==========================================
  // INICIAR
  // ==========================================

  document.addEventListener('DOMContentLoaded', inicializar);

})();