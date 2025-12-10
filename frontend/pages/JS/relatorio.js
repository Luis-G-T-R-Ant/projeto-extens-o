// Relatório: itens próximos da validade e estoque baixo
const { createClient } = supabase;
const supabaseUrl = 'https://olcnpzqxwhwthpwuuzwv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sY25wenF4d2h3dGhwd3V1end2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNzA2NTUsImV4cCI6MjA4MDY0NjY1NX0.GDTO8jNtOr-ZB1nPj9HqvytdaBt-eYoZnOLAauOjZLk';
const client = createClient(supabaseUrl, supabaseKey);

// Parâmetros
const DIAS_PARA_VENCER = 30; // próximos X dias
const LIMITE_ESTOQUE_PADRAO = 5; // fallback se estoque_minimo não estiver definido

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch (e) {
    return dateStr;
  }
}

async function carregarRelatorios() {
  const tabelaVencimento = document.getElementById('tabelaVencimento');

  tabelaVencimento.innerHTML = 'Carregando...';

  // Busca todos os insumos com campos necessários
  const { data, error } = await client
    .from('insumos')
    .select('id, nome, quantidade, validade, estoque_minimo, unidade_medida, preco, categorias_insumo (nome)')
    .order('nome', { ascending: true });

  if (error) {
    tabelaVencimento.innerHTML = `<p style="color:red;">Erro ao carregar dados: ${error.message}</p>`;
    console.error(error);
    return;
  }

  const hoje = new Date();
  const limiteData = new Date(hoje);
  limiteData.setDate(hoje.getDate() + DIAS_PARA_VENCER);

  const proximos = [];

  (data || []).forEach(item => {
    // validade
    let validade = item.validade || item.validade || null;
    let vencendo = false;
    if (validade) {
      const d = new Date(validade);
      if (!isNaN(d)) {
        if (d >= hoje && d <= limiteData) vencendo = true;
      }
    }

    if (vencendo) proximos.push(item);
  });

  // Renderiza tabela
  tabelaVencimento.innerHTML = renderTableProximidade(proximos);
}

function renderTableProximidade(items) {
  if (!items || items.length === 0) return '<p>Nenhum item próximo da validade.</p>';

  let html = '<table><thead><tr><th>Produto</th><th>Categoria</th><th>Validade</th><th>Quantidade</th><th>Unidade</th></tr></thead><tbody>';
  items.forEach(i => {
    const cat = i.categorias_insumo?.nome || '—';
    html += `<tr><td data-label="Produto">${i.nome}</td><td data-label="Categoria">${cat}</td><td data-label="Validade">${formatDate(i.validade)}</td><td data-label="Quantidade">${i.quantidade}</td><td data-label="Unidade">${i.unidade_medida || '—'}</td></tr>`;
  });
  html += '</tbody></table>';
  return html;
}

// Inicializa
document.addEventListener('DOMContentLoaded', () => {
  // mostra o número de dias no título
  const diasEl = document.getElementById('diasFiltro');
  if (diasEl) diasEl.textContent = DIAS_PARA_VENCER;
  carregarRelatorios();
});
