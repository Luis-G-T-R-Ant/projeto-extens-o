// Movimentação de itens: remover unidades sem deletar o produto
const { createClient } = supabase;
const supabaseUrl = 'https://olcnpzqxwhwthpwuuzwv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sY25wenF4d2h3dGhwd3V1end2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNzA2NTUsImV4cCI6MjA4MDY0NjY1NX0.GDTO8jNtOr-ZB1nPj9HqvytdaBt-eYoZnOLAauOjZLk';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

let formMovimentacao, insumoSelect, quantidadeRemover, tipoMovimentacao, qtdAtual, feedback;

// Carregar lista de produtos no select
async function carregarProdutos() {
  try {
    const { data, error } = await supabaseClient
      .from('insumos')
      .select('id, nome, quantidade')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao carregar produtos:', error);
      feedback.textContent = 'Erro ao carregar produtos.';
      feedback.style.backgroundColor = '#f8d7da';
      feedback.style.color = '#721c24';
      feedback.style.display = 'block';
      return;
    }

    insumoSelect.innerHTML = '<option value="">Selecione um produto...</option>';
    (data || []).forEach(produto => {
      const option = document.createElement('option');
      option.value = produto.id;
      option.textContent = `${produto.nome} (${produto.quantidade} un)`;
      insumoSelect.appendChild(option);
    });
  } catch (err) {
    console.error('Erro:', err);
  }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  // Capturar elementos do DOM
  formMovimentacao = document.getElementById('formMovimentacao');
  insumoSelect = document.getElementById('insumoSelect');
  quantidadeRemover = document.getElementById('quantidadeRemover');
  tipoMovimentacao = document.getElementById('tipoMovimentacao');
  qtdAtual = document.getElementById('qtdAtual');
  feedback = document.getElementById('feedback');

  console.log('✓ Página de movimentação carregada');
  console.log('usuarioLogado no localStorage:', localStorage.getItem('usuarioLogado'));
  
  if (formMovimentacao) {
    formMovimentacao.addEventListener('submit', handleSubmit);
  }
  
  if (insumoSelect) {
    insumoSelect.addEventListener('change', handleInsumoChange);
  }
  
  carregarProdutos();
});

// Handler para mudança de insumo
async function handleInsumoChange() {
  if (!insumoSelect.value) {
    qtdAtual.textContent = '—';
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from('insumos')
      .select('quantidade')
      .eq('id', insumoSelect.value)
      .single();

    if (error) {
      console.error('Erro ao buscar quantidade:', error);
      qtdAtual.textContent = '—';
      return;
    }

    qtdAtual.textContent = `${data.quantidade || 0} unidades`;
  } catch (err) {
    console.error('Erro:', err);
  }
}

// Handler para submit do formulário
async function handleSubmit(e) {
  e.preventDefault();
  console.log('✓ Formulário submetido');

  const insumoId = insumoSelect.value;
  const qtdRemover = parseFloat(quantidadeRemover.value);
  const tipo = tipoMovimentacao.value;

  // Obter usuario_id do localStorage
  const usuarioLogadoStr = localStorage.getItem('usuarioLogado');
  let usuarioId = null;
  
  if (usuarioLogadoStr) {
    try {
      const usuarioLogado = JSON.parse(usuarioLogadoStr);
      usuarioId = usuarioLogado.id;
    } catch (e) {
      console.error('Erro ao parsear usuarioLogado:', e);
    }
  }

  console.log('Dados capturados:', { insumoId, qtdRemover, tipo, usuarioId });

  if (!insumoId || !qtdRemover || !tipo) {
    console.warn('Campos obrigatórios não preenchidos');
    feedback.textContent = 'Preencha todos os campos obrigatórios.';
    feedback.style.backgroundColor = '#f8d7da';
    feedback.style.color = '#721c24';
    feedback.style.display = 'block';
    return;
  }

  if (!usuarioId) {
    console.warn('usuarioId não encontrado no localStorage');
    feedback.textContent = 'Erro: Usuário não identificado. Faça login novamente.';
    feedback.style.backgroundColor = '#f8d7da';
    feedback.style.color = '#721c24';
    feedback.style.display = 'block';
    return;
  }

  if (qtdRemover <= 0) {
    console.warn('Quantidade inválida:', qtdRemover);
    feedback.textContent = 'A quantidade deve ser maior que zero.';
    feedback.style.backgroundColor = '#f8d7da';
    feedback.style.color = '#721c24';
    feedback.style.display = 'block';
    return;
  }

  try {
    // Buscar quantidade atual do insumo
    const { data: insumoData, error: erroInsumo } = await supabaseClient
      .from('insumos')
      .select('quantidade')
      .eq('id', insumoId)
      .single();

    if (erroInsumo) {
      throw erroInsumo;
    }

    const qtdAtualInsumo = parseFloat(insumoData.quantidade) || 0;
    console.log('Quantidade atual no DB:', qtdAtualInsumo);

    if (qtdRemover > qtdAtualInsumo) {
      console.warn('Quantidade solicitada maior que disponível');
      feedback.textContent = `Quantidade inválida. Disponível: ${qtdAtualInsumo} unidades.`;
      feedback.style.backgroundColor = '#f8d7da';
      feedback.style.color = '#721c24';
      feedback.style.display = 'block';
      return;
    }

    // 1. Registrar movimentação na tabela movimentacoes
    console.log('Inserindo movimentação com dados:', { insumo_id: insumoId, usuario_id: usuarioId, tipo_movimentacao: tipo, quantidade: qtdRemover });
    const { error: erroMovimentacao } = await supabaseClient
      .from('movimentacoes')
      .insert([
        {
          insumo_id: insumoId,
          usuario_id: usuarioId,
          tipo_movimentacao: tipo,
          quantidade: qtdRemover,
        },
      ]);

    if (erroMovimentacao) {
      console.error('Erro ao inserir movimentação:', erroMovimentacao);
      throw erroMovimentacao;
    }

    console.log('✓ Movimentação registrada');

    // 2. Atualizar quantidade do insumo (subtrair)
    const novaQtd = qtdAtualInsumo - qtdRemover;
    console.log('Atualizando insumo com nova quantidade:', novaQtd);
    const { error: erroUpdate } = await supabaseClient
      .from('insumos')
      .update({ quantidade: novaQtd })
      .eq('id', insumoId);

    if (erroUpdate) {
      console.error('Erro ao atualizar insumo:', erroUpdate);
      throw erroUpdate;
    }

    console.log('✓ Insumo atualizado');

    // Sucesso
    feedback.textContent = '✓ Movimentação registrada com sucesso!';
    feedback.style.backgroundColor = '#d4edda';
    feedback.style.color = '#155724';
    feedback.style.display = 'block';

    // Limpar formulário
    formMovimentacao.reset();
    qtdAtual.textContent = '—';
    carregarProdutos(); // Recarregar lista com novas quantidades

    setTimeout(() => {
      feedback.style.display = 'none';
    }, 4000);
  } catch (err) {
    console.error('Erro ao registrar movimentação:', err);
    feedback.textContent = `Erro: ${err.message}`;
    feedback.style.backgroundColor = '#f8d7da';
    feedback.style.color = '#721c24';
    feedback.style.display = 'block';
  }
}
