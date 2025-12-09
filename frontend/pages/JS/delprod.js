// --- Criar cliente Supabase ---
const { createClient } = supabase;

const supabaseUrl = 'https://olcnpzqxwhwthpwuuzwv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sY25wenF4d2h3dGhwd3V1end2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNzA2NTUsImV4cCI6MjA4MDY0NjY1NX0.GDTO8jNtOr-ZB1nPj9HqvytdaBt-eYoZnOLAauOjZLk';

const client = createClient(supabaseUrl, supabaseKey);

// --- Seleção do corpo da tabela ---
const produtosTableBody = document
  .getElementById('produtosTable')
  .querySelector('tbody');

// --- Carregar produtos ---
async function carregarProdutos() {
  produtosTableBody.innerHTML = `<tr><td colspan="7">Carregando produtos...</td></tr>`;

  const { data: produtos, error } = await client
    .from('insumos')
    .select(`
      id,
      nome,
      quantidade,
      unidade_medida,
      preco,
      validade,
      categorias_insumo (nome)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    produtosTableBody.innerHTML = `<tr><td colspan="7">Erro: ${error.message}</td></tr>`;
    return;
  }

  if (produtos.length === 0) {
    produtosTableBody.innerHTML = `<tr><td colspan="7">Nenhum produto encontrado</td></tr>`;
    return;
  }

  produtosTableBody.innerHTML = '';

  produtos.forEach(prod => {
    const categoriaNome = prod.categorias_insumo?.nome || '—';
    const validadeFormatada = prod.validade
      ? new Date(prod.validade).toLocaleDateString('pt-BR')
      : '—';

    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${prod.nome}</td>
      <td>${categoriaNome}</td>
      <td>${prod.unidade_medida}</td>
      <td>${prod.quantidade}</td>
      <td>R$ ${Number(prod.preco).toFixed(2)}</td>
      <td>${validadeFormatada}</td>
      <td>
        <button class="delete-btn" data-id="${prod.id}">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    `;

    produtosTableBody.appendChild(tr);
  });
}

// --- Excluir produto ---
produtosTableBody.addEventListener('click', async (e) => {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;

  const idProduto = btn.getAttribute('data-id');
  const nomeProduto = btn.closest('tr').children[0].textContent;

  const confirmDelete = confirm(
    `Tem certeza que deseja excluir o produto "${nomeProduto}"?`
  );
  if (!confirmDelete) return;

  const { error } = await client
    .from('insumos')
    .delete()
    .eq('id', idProduto);

  if (error) {
    alert('Erro ao excluir: ' + error.message);
    return;
  }

  alert(`Produto "${nomeProduto}" excluído com sucesso!`);
  carregarProdutos();
});

// --- Carregar ao iniciar ---
document.addEventListener('DOMContentLoaded', carregarProdutos);
