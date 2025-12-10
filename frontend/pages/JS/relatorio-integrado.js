// ============================================
// RELATÓRIO INTEGRADO - relatorio.js
// ============================================
// Substitui o arquivo JS/relatorio.js existente

(async function() {
  'use strict';

  const tabelaVencimento = document.getElementById('tabelaVencimento');
  const diasFiltro = document.getElementById('diasFiltro');
  
  let DIAS_PADRAO = 30;

  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================

  async function inicializar() {
    await carregarRelatorios();
  }

  // ==========================================
  // CARREGAR RELATÓRIOS
  // ==========================================

  async function carregarRelatorios() {
    tabelaVencimento.innerHTML = '<p style="text-align:center;">Carregando...</p>';

    try {
      // Busca produtos próximos da validade
      const proximosVencimento = await SistemaLotes.buscarProximosVencimento(DIAS_PADRAO);
      
      // Busca produtos vencidos
      const vencidos = await SistemaLotes.buscarProdutosVencidos();

      // Renderiza relatório
      renderizarRelatorio(vencidos, proximosVencimento);

    } catch (err) {
      console.error('Erro ao carregar relatórios:', err);
      tabelaVencimento.innerHTML = '<p style="color:red; text-align:center;">Erro ao carregar relatórios.</p>';
    }
  }

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  function renderizarRelatorio(vencidos, proximos) {
    let html = '';

    // Seção de VENCIDOS
    if (vencidos.length > 0) {
      html += `
        <div style="background: #fff3cd; border-left: 4px solid #e53935; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="color: #e53935; margin: 0 0 15px 0;">
            ❌ Produtos Vencidos (${vencidos.length})
          </h3>
          ${renderizarTabelaVencimento(vencidos, true)}
        </div>
      `;
    }

    // Seção de PRÓXIMOS DA VALIDADE
    if (proximos.length > 0) {
      html += `
        <div style="background: #fff9e6; border-left: 4px solid #ff9800; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="color: #ff9800; margin: 0 0 15px 0;">
            ⚠️ Próximos da Validade (${proximos.length})
          </h3>
          ${renderizarTabelaVencimento(proximos, false)}
        </div>
      `;
    }

    // Se não houver itens
    if (vencidos.length === 0 && proximos.length === 0) {
      html = `
        <div style="text-align: center; padding: 40px; background: #e8f5e9; border-radius: 8px;">
          <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
          <h3 style="color: #2e7d32; margin: 0 0 8px 0;">Tudo em Ordem!</h3>
          <p style="color: #666; margin: 0;">Nenhum produto vencido ou próximo da validade nos próximos ${DIAS_PADRAO} dias.</p>
        </div>
      `;
    }

    tabelaVencimento.innerHTML = html;
  }

  function renderizarTabelaVencimento(lotes, isVencido) {
    let html = `
      <table style="width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <thead>
          <tr style="background: ${isVencido ? '#e53935' : '#ff9800'}; color: white;">
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Produto</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Código Lote</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Categoria</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Quantidade</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Validade</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">${isVencido ? 'Vencido há' : 'Vence em'}</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Localização</th>
          </tr>
        </thead>
        <tbody>
    `;

    lotes.forEach(lote => {
      const validadeTexto = SistemaLotes.formatarData(lote.validade);
      const diasTexto = lote.dias_para_vencer !== null
        ? `${Math.abs(lote.dias_para_vencer)} dias`
        : '—';

      const corLinha = isVencido ? '#ffebee' : '#fff3e0';

      html += `
        <tr style="border-bottom: 1px solid #eee; background: ${corLinha};">
          <td style="padding: 12px; border: 1px solid #ddd;">
            <strong>${lote.produto}</strong>
          </td>
          <td style="padding: 12px; text-align: center; border: 1px solid #ddd; font-family: monospace; font-size: 11px;">
            ${lote.codigo_lote}
          </td>
          <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">
            ${lote.categoria}
          </td>
          <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">
            <strong>${lote.quantidade}</strong> ${lote.unidade_medida}
          </td>
          <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">
            ${validadeTexto}
          </td>
          <td style="padding: 12px; text-align: center; border: 1px solid #ddd; color: ${isVencido ? '#e53935' : '#ff9800'}; font-weight: bold;">
            ${diasTexto}
          </td>
          <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">
            ${lote.localizacao || '—'}
          </td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    return html;
  }

  // ==========================================
  // SEÇÃO DE ESTOQUE BAIXO (ADICIONAL)
  // ==========================================

  async function adicionarSecaoEstoqueBaixo() {
    try {
      const estoqueBaixo = await SistemaLotes.buscarEstoqueBaixo();

      if (estoqueBaixo.length === 0) return;

      const secaoEstoque = document.createElement('section');
      secaoEstoque.id = 'estoque-baixo';
      secaoEstoque.style.cssText = 'margin-top: 40px;';

      secaoEstoque.innerHTML = `
        <h3 style="color: #ff9800; margin-bottom: 16px;">⚠️ Produtos com Estoque Baixo</h3>
        <div id="tabelaEstoqueBaixo"></div>
      `;

      const proximasValidade = document.getElementById('proximas-validade');
      proximasValidade.parentNode.insertBefore(secaoEstoque, proximasValidade.nextSibling);

      renderizarEstoqueBaixo(estoqueBaixo);
    } catch (err) {
      console.error('Erro ao buscar estoque baixo:', err);
    }
  }

  function renderizarEstoqueBaixo(produtos) {
    const container = document.getElementById('tabelaEstoqueBaixo');
    
    let html = `
      <table style="width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <thead>
          <tr style="background: #ff9800; color: white;">
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Produto</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Categoria</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Quantidade Atual</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Estoque Mínimo</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Status</th>
          </tr>
        </thead>
        <tbody>
    `;

    produtos.forEach(produto => {
      const percentual = (produto.quantidadeTotal / produto.estoqueMinimo) * 100;
      const statusCor = percentual < 50 ? '#e53935' : '#ff9800';

      html += `
        <tr style="border-bottom: 1px solid #eee; background: #fff3e0;">
          <td style="padding: 12px; border: 1px solid #ddd;">
            <strong>${produto.nome}</strong>
          </td>
          <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">
            ${produto.categoria}
          </td>
          <td style="padding: 12px; text-align: center; border: 1px solid #ddd; color: ${statusCor}; font-weight: bold;">
            ${produto.quantidadeTotal.toFixed(1)} ${produto.unidade_medida}
          </td>
          <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">
            ${produto.estoqueMinimo} ${produto.unidade_medida}
          </td>
          <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">
            <div style="background: #eee; border-radius: 10px; overflow: hidden; height: 20px; position: relative;">
              <div style="background: ${statusCor}; height: 100%; width: ${percentual}%; transition: width 0.3s;"></div>
              <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 11px; font-weight: bold; color: #333;">
                ${percentual.toFixed(0)}%
              </span>
            </div>
          </td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  }

  // ==========================================
  // CONTROLE DE FILTRO DE DIAS
  // ==========================================

  function criarControlesDias() {
    const section = document.getElementById('proximas-validade');
    const controles = document.createElement('div');
    controles.style.cssText = 'display: flex; gap: 10px; align-items: center; margin-bottom: 20px;';
    
    controles.innerHTML = `
      <label for="inputDias" style="font-weight: 600; color: #2e7d32;">Filtrar próximos:</label>
      <input 
        type="number" 
        id="inputDias" 
        value="${DIAS_PADRAO}" 
        min="1" 
        max="365"
        style="width: 80px; padding: 8px; border: 2px solid #2e7d32; border-radius: 6px; font-size: 14px;"
      >
      <span style="color: #666;">dias</span>
      <button 
        id="btnAtualizarDias"
        style="padding: 8px 16px; background: #2e7d32; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;"
      >
        Atualizar
      </button>
    `;

    section.insertBefore(controles, section.querySelector('h3'));

    document.getElementById('btnAtualizarDias').addEventListener('click', () => {
      const novosDias = parseInt(document.getElementById('inputDias').value) || 30;
      DIAS_PADRAO = novosDias;
      diasFiltro.textContent = novosDias;
      carregarRelatorios();
    });
  }

  // ==========================================
  // INICIAR
  // ==========================================

  document.addEventListener('DOMContentLoaded', async () => {
    criarControlesDias();
    await inicializar();
    await adicionarSecaoEstoqueBaixo();
  });

})();