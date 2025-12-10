// Histórico de movimentações de itens
const { createClient } = supabase;
const supabaseUrl = 'https://olcnpzqxwhwthpwuuzwv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sY25wenF4d2h3dGhwd3V1end2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNzA2NTUsImV4cCI6MjA4MDY0NjY1NX0.GDTO8jNtOr-ZB1nPj9HqvytdaBt-eYoZnOLAauOjZLk';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

const tabelaHistorico = document.getElementById('tabelaHistorico');
const dataInicio = document.getElementById('dataInicio');
const dataFim = document.getElementById('dataFim');
const btnFiltrar = document.getElementById('btnFiltrar');
const btnLimparFiltro = document.getElementById('btnLimparFiltro');

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return dateStr;
  }
}

function formatMotivo(motivo) {
  const motivos = {
    'entrada': 'Entrada',
    'saida': 'Saída',
    'ajuste': 'Ajuste',
    'transferencia': 'Transferência',
    'devolucao': 'Devolução',
  };
  return motivos[motivo] || motivo;
}

async function carregarHistorico(dataStart = null, dataEnd = null) {
  tabelaHistorico.innerHTML = 'Carregando...';

  try {
    let query = supabaseClient
      .from('movimentacoes')
      .select('id, insumo_id, usuario_id, tipo_movimentacao, quantidade, created_at')
      .order('created_at', { ascending: false });

    // Filtrar por período se fornecido
    if (dataStart) {
      query = query.gte('created_at', `${dataStart}T00:00:00`);
    }
    if (dataEnd) {
      query = query.lte('created_at', `${dataEnd}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) {
      tabelaHistorico.innerHTML = `<p style="color:red;">Erro ao carregar histórico: ${error.message}</p>`;
      console.error(error);
      return;
    }

    if (!data || data.length === 0) {
      tabelaHistorico.innerHTML = '<p>Nenhuma movimentação encontrada.</p>';
      return;
    }

    // Buscar nomes dos insumos e usuários
    const insumoIds = [...new Set(data.map(d => d.insumo_id))];
    const usuarioIds = [...new Set(data.map(d => d.usuario_id))];

    let insumosMap = {};
    let usuariosMap = {};

    if (insumoIds.length > 0) {
      const { data: insumos } = await supabaseClient
        .from('insumos')
        .select('id, nome')
        .in('id', insumoIds);
      
      if (insumos) {
        insumos.forEach(ins => {
          insumosMap[ins.id] = ins.nome;
        });
      }
    }

    if (usuarioIds.length > 0) {
      const { data: usuarios } = await supabaseClient
        .from('usuarios')
        .select('id, nome')
        .in('id', usuarioIds);
      
      if (usuarios) {
        usuarios.forEach(usr => {
          usuariosMap[usr.id] = usr.nome;
        });
      }
    }

    // Enriquecer dados com nomes
    const dataEnriquecida = data.map(mov => ({
      ...mov,
      insumo_nome: insumosMap[mov.insumo_id] || '—',
      usuario_nome: usuariosMap[mov.usuario_id] || '—'
    }));

    tabelaHistorico.innerHTML = renderTable(dataEnriquecida);
  } catch (err) {
    console.error('Erro:', err);
    tabelaHistorico.innerHTML = `<p style="color:red;">Erro ao carregar dados.</p>`;
  }
}

function renderTable(movimentacoes) {
  let html = `
    <table>
      <thead>
        <tr>
          <th>Produto</th>
          <th>Tipo</th>
          <th>Quantidade</th>
          <th>Usuário</th>
          <th>Data</th>
        </tr>
      </thead>
      <tbody>
  `;

  movimentacoes.forEach(mov => {
    html += `
      <tr>
        <td data-label="Produto">${mov.insumo_nome}</td>
        <td data-label="Tipo">${formatMotivo(mov.tipo_movimentacao)}</td>
        <td data-label="Quantidade">${mov.quantidade}</td>
        <td data-label="Usuário">${mov.usuario_nome}</td>
        <td data-label="Data">${formatDate(mov.created_at)}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;
  return html;
}

// Event listeners para filtro
btnFiltrar.addEventListener('click', () => {
  const inicio = dataInicio.value;
  const fim = dataFim.value;
  if (inicio || fim) {
    carregarHistorico(inicio, fim);
  }
});

btnLimparFiltro.addEventListener('click', () => {
  dataInicio.value = '';
  dataFim.value = '';
  carregarHistorico();
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  carregarHistorico();
});
