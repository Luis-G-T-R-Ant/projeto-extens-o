// CONFIGURAR SUPABASE
const supabaseUrl = "https://olcnpzqxwhwthpwuuzwv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sY25wenF4d2h3dGhwd3V1end2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNzA2NTUsImV4cCI6MjA4MDY0NjY1NX0.GDTO8jNtOr-ZB1nPj9HqvytdaBt-eYoZnOLAauOjZLk";

// ⚠️ CORREÇÃO 1: Usar 'supabase.createClient' e mudar o nome da variável para 'supabaseClient'
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// CARREGAR CATEGORIAS DO SUPABASE
async function carregarCategorias() {
  // ⚠️ CORREÇÃO 2: Usar 'supabaseClient'
  const { data, error } = await supabaseClient
    .from("categorias_insumo") // Certifique-se que esta tabela existe
    .select("id, nome")
    .order("nome");

  if (error) {
    console.error("Erro categorias:", error);
    alert("Erro ao carregar categorias: " + error.message);
    return;
  }

  const select = document.getElementById("categoria");
  
  // Limpa opções anteriores (exceto a primeira se for um placeholder)
  select.innerHTML = '<option value="" disabled selected>Selecione a categoria</option>';

  data.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat.id;
    option.textContent = cat.nome;
    select.appendChild(option);
  });
}

// Inicializa as categorias ao carregar a página
carregarCategorias();

// SALVAR PRODUTO
async function salvarProduto() {
  const nome = document.getElementById("nome").value;
  const categoria = document.getElementById("categoria").value;
  const unidade = document.getElementById("unidade").value;
  const quantidade = document.getElementById("quantidade").value;
  const preco = document.getElementById("preco").value;
  const validade = document.getElementById("validade").value;

  if (!nome || !categoria || !unidade || !quantidade || !preco) {
    alert("Preencha todos os campos obrigatórios!");
    return;
  }

  // ⚠️ CORREÇÃO 3: Usar 'supabaseClient'
  const { error } = await supabaseClient
    .from("insumos") // Certifique-se que a tabela mudou de 'produtos' para 'insumos'
    .insert([{
      nome: nome,
      categoria_id: parseInt(categoria), // Se o ID da categoria for número, converta
      unidade_medida: unidade,
      quantidade: parseFloat(quantidade), // Converta para número para evitar erro no banco
      preco: parseFloat(preco),           // Converta para número
      validade: validade || null,
      descricao: "",
      is_perecivel: validade ? true : false,
      is_material_limpeza: false, // Lógica fixa, verifique se isso atende
      estoque_minimo: 0,
      // created_at e updated_at geralmente são automáticos no banco, mas se precisar:
      // created_at: new Date() 
    }]);

  if (error) {
    alert("Erro ao salvar produto: " + error.message);
    console.log(error);
    return;
  }

  alert("Produto salvo com sucesso!");
  document.getElementById("formProdutos").reset(); // Limpa o form após salvar
}