// ============================================
// PRODUTOS INTEGRADO - produtos-integrado.js
// ============================================
// Este arquivo SUBSTITUI o JS/listarprod.js
// Salve como: JS/produtos-integrado.js

(async function() {
  'use strict';

  const lista = document.getElementById('listaProdutos');
  const inputPesquisa = document.getElementById('pesquisa');
  const containerFiltrosCategoria = document.getElementById('containerFiltrosCategoria');

  let todosLotes = [];
  let categoriasDisponiveis = [];

  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================

  async function inicializar() {
    await carregarFiltros();
  }

  // ==========================================
  // CARREGAR FILTROS
  // ==========================================

  async function carregarFiltros() {
    try {
      const client = SistemaLotes.getClient();
      const { data: categorias, error } = await client
        .from('categorias_insumo')
        .select('id, nome')
        .order('nome');

      if (error) throw error;

      categoriasDisponiveis = categorias || [];
      
      containerFiltrosCategoria.innerHTML = '';

      // Checkbox "Todos"
      const todosLabel = document.createElement('label');
      todosLabel.innerHTML = `
        <input type="checkbox" name="filtroCategoria" value="" checked>
        Todos
      `;
      todosLabel.querySelector('input').addEventListener('change', carregarProdutos);
      containerFiltrosCategoria.appendChild(todosLabel);

      // Checkboxes por categoria
      categorias.forEach(cat => {
        const label = document.createElement('label');
        label.innerHTML = `
          <input type="checkbox" name="filtroCategoria" value="${cat.id}">
          ${cat.nome}
        `;
        label.querySelector('input').addEventListener('change', carregarProdutos);
        containerFiltrosCategoria.appendChild(label);
      });

      await carregarProdutos();

    } catch (err) {
      console.error('Erro ao carregar filtros:', err);
    }
  }

  // ==========================================
  // CARREGAR PRODUTOS
  // ==========================================

  async function carregarProdutos() {
    lista.innerHTML = '<p style="text-align:center;">Carregando...</p>';

    try {
      // Filtros selecionados
      const textoPesquisa = inputPesquisa.value.trim().toLowerCase();
      
      const checkboxes = document.querySelectorAll('input[name="filtroCategoria"]:checked');
      const categoriasSelecionadas = Array.from(checkboxes)
        .map(input => input.value)
        .filter(value => value !== '');

      // Busca todos os lotes
      todosLotes = await SistemaLotes.buscarTodosLotes();

      // Filtra por categoria
      let lotesFiltrados = todosLotes;
      if (categoriasSelecionadas.length > 0) {
        lotesFiltrados = todosLotes.filter(l => 
          categoriasSelecionadas.includes(l.categoria_id)
        );
      }

      // Filtra por texto de pesquisa
      if (textoPesquisa) {
        lotesFiltrados = lotesFiltrados.filter(l =>
          l.produto.toLowerCase().includes(textoPesquisa)
        );
      }

      // Agrupa por produto
      const produtos = SistemaLotes.agruparLotesPorProduto(lotesFiltrados);

      if (Object.keys(produtos).length === 0) {
        lista.innerHTML = '<p style="text-align:center;">Nenhum produto encontrado.</p>';
        return;
      }

      // Renderiza tabela
      renderizarTabela(produtos);

    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      lista.innerHTML = '<p style="color:red; text-align:center;">Erro ao carregar produtos.</p>';
    }
  }

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  function renderizarTabela(produtos) {
    let html = `
      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Categoria</th>
            <th>Quantidade Total</th>
            <th>Unidade</th>
            <th>Valor Total</th>
            <th>Nº Lotes</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
    `;

    Object.values(produtos).forEach(produto => {
      const qtdTotal = produto.quantidadeTotal.toFixed(1);
      const valorTotal = SistemaLotes.formatarMoeda(produto.valorTotal);
      const numLotes = produto.lotes.length;

      // Determina status pior entre os lotes
      const statusPior = determinarStatusPior(produto.lotes);
      const corStatus = SistemaLotes.getCorStatus(statusPior);
      const iconeStatus = SistemaLotes.getIconeStatus(statusPior);

      html += `
        <tr>
          <td data-label="Produto"><strong>${produto.nome}</strong></td>
          <td data-label="Categoria">${produto.categoria}</td>
          <td data-label="Quantidade Total">${qtdTotal}</td>
          <td data-label="Unidade">${produto.unidade_medida}</td>
          <td data-label="Valor Total">${valorTotal}</td>
          <td data-label="Nº Lotes">${numLotes}</td>
          <td data-label="Status">
            <span style="color: ${corStatus}; font-size: 18px;">${iconeStatus}</span>
          </td>
          <td data-label="Ações">
            <button 
              class="btn-detalhes" 
              onclick="window.mostrarDetalhesProduct('${produto.nome.replace(/'/g, "\\'")}')"
              style="padding: 6px 12px; background: #2e7d32; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
            >
              <i class="fas fa-eye"></i> Ver Lotes
            </button>
          </td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    lista.innerHTML = html;
  }

  function determinarStatusPior(lotes) {
    const prioridade = {
      'VENCIDO': 4,
      'CRITICO': 3,
      'ATENCAO': 2,
      'OK': 1,
      'SEM_VALIDADE': 0
    };

    let piorStatus = 'SEM_VALIDADE';
    let maiorPrioridade = 0;

    lotes.forEach(lote => {
      const prioridadeAtual = prioridade[lote.status_validade] || 0;
      if (prioridadeAtual > maiorPrioridade) {
        maiorPrioridade = prioridadeAtual;
        piorStatus = lote.status_validade;
      }
    });

    return piorStatus;
  }

  // ==========================================
  // MODAL DE DETALHES
  // ==========================================

  window.mostrarDetalhesProduct = async function(nomeProduto) {
    const lotes = await SistemaLotes.buscarLotesPorProduto(nomeProduto);

    if (lotes.length === 0) {
      alert('Nenhum lote encontrado para este produto.');
      return;
    }

    let html = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; align-items: center; justify-content: center;" onclick="this.remove()">
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 900px; max-height: 80vh; overflow-y: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.3);" onclick="event.stopPropagation()">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #2e7d32;">📦 ${nomeProduto}</h2>
            <button onclick="this.closest('[style*=fixed]').remove()" style="background: #e53935; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">
              ✕ Fechar
            </button>
          </div>
          
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #2e7d32; color: white;">
                <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Código Lote</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Quantidade</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Validade</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Status</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Localização</th>
              </tr>
            </thead>
            <tbody>
    `;

    lotes.forEach(lote => {
      const validadeTexto = lote.validade 
        ? SistemaLotes.formatarData(lote.validade)
        : 'Sem validade';
      
      const diasTexto = lote.dias_para_vencer !== null
        ? `${lote.dias_para_vencer} dias`
        : '—';

      const corStatus = SistemaLotes.getCorStatus(lote.status_validade);
      const iconeStatus = SistemaLotes.getIconeStatus(lote.status_validade);

      html += `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px; border: 1px solid #ddd;">${lote.codigo_lote}</td>
          <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">${lote.quantidade} ${lote.unidade_medida}</td>
          <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">${validadeTexto}<br><small style="color: #666;">${diasTexto}</small></td>
          <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">
            <span style="color: ${corStatus}; font-size: 20px;">${iconeStatus}</span>
          </td>
          <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">${lote.localizacao || '—'}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  };

  // ==========================================
  // EVENT LISTENERS
  // ==========================================

  inputPesquisa.addEventListener('input', carregarProdutos);

  // ==========================================
  // INICIAR
  // ==========================================

  document.addEventListener('DOMContentLoaded', inicializar);

})();