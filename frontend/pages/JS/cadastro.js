const { createClient } = supabase;
// Configurar Supabase
const supabaseUrl = 'https://olcnpzqxwhwthpwuuzwv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sY25wenF4d2h3dGhwd3V1end2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNzA2NTUsImV4cCI6MjA4MDY0NjY1NX0.GDTO8jNtOr-ZB1nPj9HqvytdaBt-eYoZnOLAauOjZLk'
const client = createClient(supabaseUrl, supabaseKey);

// Formulário
const formCadastro = document.getElementById('formCadastro');

formCadastro.addEventListener('submit', async (e) => {
  e.preventDefault();

  const usuario = document.getElementById('usuario').value.trim();
  const senha = document.getElementById('senha').value;
  const confirmarSenha = document.getElementById('confirmar_senha').value;
  const perfil = document.querySelector('select[name="perfil"]').value;

  // Validação simples
  if (!usuario || !senha || !confirmarSenha || !perfil) {
    alert('Preencha todos os campos!');
    return;
  }

  if (senha !== confirmarSenha) {
    alert('As senhas não conferem!');
    return;
  }

  // Inserir no Supabase
  const { data, error } = await client
    .from('usuarios')
    .insert([
      { nome: usuario, senha: senha, perfil: perfil }
    ]);

  if (error) {
    alert('Erro ao cadastrar: ' + error.message);
  } else {
    alert(`Usuário ${usuario} cadastrado com sucesso!`);
    formCadastro.reset(); // limpa o formulário
  }
});
document.addEventListener("DOMContentLoaded", () => {
  // Pega o perfil do usuário logado
  const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
  
  if (!usuarioLogado) {
    // Se não estiver logado, redireciona para login
    alert("Você precisa estar logado para acessar esta página.");
    window.location.href = "login.html";
    return;
  }

  if (usuarioLogado.perfil !== "adm") {
    // Se não for ADM, impede acesso
    alert("Acesso negado! Apenas administradores podem acessar esta página.");
    window.location.href = "produtos.html"; // redireciona para produtos
    return;
  }

  // Se for ADM, carrega os usuários normalmente
  carregarUsuarios();
});

