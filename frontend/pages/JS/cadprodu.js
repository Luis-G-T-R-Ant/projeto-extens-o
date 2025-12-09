// CONFIGURAR SUPABASE
const supabaseUrl = "https://olcnpzqxwhwthpwuuzwv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sY25wenF4d2h3dGhwd3V1end2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNzA2NTUsImV4cCI6MjA4MDY0NjY1NX0.GDTO8jNtOr-ZB1nPj9HqvytdaBt-eYoZnOLAauOjZLk";

// Inicializa o cliente Supabase
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

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
document.addEventListener('DOMContentLoaded', carregarCategorias);

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

  const { error } = await supabaseClient
    .from("insumos")
    .insert([dados]);

  if (error) {
    alert("Erro ao salvar produto: " + error.message + ". Verifique se o ID da categoria é um UUID válido e se a RLS permite a inserção.");
    console.error(error);
    return;
  }

  alert("Produto salvo com sucesso!");
  document.getElementById("formProdutos").reset();
}