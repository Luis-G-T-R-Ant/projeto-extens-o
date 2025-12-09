// CONFIGURAR SUPABASE
const supabaseUrl = "https://olcnpzqxwhwthpwuuzwv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sY25wenF4d2h3dGhwd3V1end2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNzA2NTUsImV4cCI6MjA4MDY0NjY1NX0.GDTO8jNtOr-ZB1nPj9HqvytdaBt-eYoZnOLAauOjZLk";

// Inicializa o cliente Supabase
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// Normaliza nomes: trim, lowercase, remove acentos, colapsa espaços
function normalizeName(str) {
  if (!str || typeof str !== 'string') return '';
  // Normaliza para decomposed form to strip diacritics
  let s = str.normalize('NFD');
  // Remove diacritic marks (widely supported range)
  s = s.replace(/[\u0300-\u036f]/g, '');
  // Remove punctuation and other non-alphanumeric characters (keep spaces)
  s = s.replace(/[^0-9a-zA-Z\s]/g, '');
  // Trim, collapse multiple spaces and lowercase
  s = s.trim().toLowerCase().replace(/\s+/g, ' ');
  return s;
}

// CARREGAR CATEGORIAS DO SUPABASE
async function carregarCategorias() {
  const { data, error } = await supabaseClient
    .from("categorias_insumo")
    .select("id, nome")
    .order("nome");

  if (error) {
    console.error("Erro categorias:", error);
    alert("Erro ao carregar categorias: " + error.message);
    return;
  }

  const select = document.getElementById("categoria");
  select.innerHTML = '<option value="" disabled selected>Selecione a categoria</option>';

  data.forEach(cat => {
    const option = document.createElement("option");
    // ✅ CORREÇÃO 1: Mantém cat.id como STRING (UUID) para o valor da opção
    option.value = cat.id; 
    option.textContent = cat.nome;
    select.appendChild(option);
  });
}

// Inicializa as categorias ao carregar a página
// Carrega categorias e lista de nomes para autocomplete ao iniciar
document.addEventListener('DOMContentLoaded', () => {
  carregarCategorias();
  carregarProdutosNomes();
});

// CARREGAR NOMES DE PRODUTOS (para autocomplete)
async function carregarProdutosNomes() {
  try {
    const { data, error } = await supabaseClient
      .from('insumos')
      .select('nome')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao carregar nomes de produtos:', error);
      return;
    }

    const datalist = document.getElementById('produtosList');
    if (!datalist) return;

    datalist.innerHTML = '';
    data.forEach(item => {
      const option = document.createElement('option');
      option.value = item.nome;
      datalist.appendChild(option);
    });
  } catch (err) {
    console.error('Erro inesperado ao carregar nomes:', err);
  }
}

// SALVAR PRODUTO
async function salvarProduto() {
  const nome = document.getElementById("nome").value;
  const categoria = document.getElementById("categoria").value; // Já é a string UUID
  const unidade = document.getElementById("unidade").value;
  const quantidade = document.getElementById("quantidade").value;
  const preco = document.getElementById("preco").value;
  const validade = document.getElementById("validade").value;

  if (!nome || !categoria || !unidade || !quantidade || !preco) {
    alert("Preencha todos os campos obrigatórios!");
    return;
  }

  // Prepara os dados
  const dados = {
    nome: nome,
    // nome normalizado para coincidir com índice/trigger no banco
    nome_normalizado: normalizeName(nome),
    // ✅ CORREÇÃO 2: Envia a string UUID diretamente
    categoria_id: categoria, 
    unidade_medida: unidade,
    // ✅ CORREÇÃO 3: Garante que sejam números de ponto flutuante
    quantidade: parseFloat(quantidade), 
    preco: parseFloat(preco), 
    validade: validade || null,
    
    // Outras colunas
    descricao: "",
    is_perecivel: validade ? true : false,
    is_material_limpeza: false,
    estoque_minimo: 0,
  };

  // Normaliza o nome do produto para comparação local
  const nomeNormalizado = normalizeName(nome);

  try {
    // Busca todos os nomes (inclui quantidade) e compara localmente com normalização
    const { data: todosNomes, error: errFetch } = await supabaseClient
      .from('insumos')
      .select('id, nome, quantidade');

    if (errFetch) {
      console.error('Erro ao buscar nomes para verificação:', errFetch);
      alert('Erro ao verificar produto existente: ' + errFetch.message);
      return;
    }

    const existente = (todosNomes || []).find(item => normalizeName(item.nome) === nomeNormalizado);

    if (existente) {
      // Oferece opção de atualizar o produto existente (agora soma quantidade em vez de sobrescrever)
      const confirmarAtualizar = confirm(`O produto "${existente.nome}" já existe. Deseja somar a quantidade enviada (${quantidade}) à quantidade atual (${existente.quantidade})?`);
      if (!confirmarAtualizar) return;

      // Calcula nova quantidade somando (tratando possíveis NaN)
      const quantidadeAtual = parseFloat(existente.quantidade) || 0;
      const quantidadeNova = quantidadeAtual + (parseFloat(quantidade) || 0);

      // Prepara dados para update (somente quantidade e campos que desejar manter atualizados)
      const dadosUpdate = Object.assign({}, dados, { quantidade: quantidadeNova });

      // Executa update
      const { error: errUpdate } = await supabaseClient
        .from('insumos')
        .update(dadosUpdate)
        .eq('id', existente.id);

      if (errUpdate) {
        console.error('Erro ao atualizar produto:', errUpdate);
        alert('Erro ao atualizar produto: ' + errUpdate.message);
        return;
      }

      alert(`Produto "${existente.nome}" atualizado com sucesso! Quantidade anterior: ${quantidadeAtual}, nova quantidade: ${quantidadeNova}`);
      document.getElementById('formProdutos').reset();
      // Atualiza datalist e lista de nomes
      carregarProdutosNomes();
      return;
    }

    // Se não existe, tenta upsert por nome_normalizado para evitar race conditions
    const { data: upserted, error: errUpsert } = await supabaseClient
      .from('insumos')
      .upsert([dados], { onConflict: 'nome_normalizado' });

    if (errUpsert) {
      alert('Erro ao salvar produto: ' + errUpsert.message + '. Verifique se o ID da categoria é um UUID válido e se a RLS permite a inserção.');
      console.error(errUpsert);
      return;
    }

    alert('Produto salvo com sucesso!');
    document.getElementById('formProdutos').reset();
    carregarProdutosNomes();
    return;
  } catch (err) {
    console.error('Erro inesperado ao salvar produto:', err);
    alert('Erro inesperado ao salvar produto. Tente novamente.');
    return;
  }
}