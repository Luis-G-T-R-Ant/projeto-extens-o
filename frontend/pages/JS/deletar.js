// =============================
// CONFIGURAÇÃO SUPABASE
// =============================
const { createClient } = supabase;

const supabaseUrl = "https://olcnpzqxwhwthpwuuzwv.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sY25wenF4d2h3dGhwd3V1end2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNzA2NTUsImV4cCI6MjA4MDY0NjY1NX0.GDTO8jNtOr-ZB1nPj9HqvytdaBt-eYoZnOLAauOjZLk";

const client = createClient(supabaseUrl, supabaseKey);

// pega o tbody da tabela
const usuariosTableBody = document
  .getElementById("usuariosTable")
  .querySelector("tbody");

// =============================
// CARREGAR USUÁRIOS
// =============================
async function carregarUsuarios() {
  usuariosTableBody.innerHTML = `
    <tr><td colspan="5">Carregando usuários...</td></tr>
  `;

  const { data: usuarios, error } = await client
    .from("usuarios")
    .select("id, nome, senha, created_at, perfil")
    .order("created_at", { ascending: false });

  if (error) {
    usuariosTableBody.innerHTML = `
      <tr><td colspan="5">Erro ao carregar usuários: ${error.message}</td></tr>
    `;
    console.error(error);
    return;
  }

  if (!usuarios || usuarios.length === 0) {
    usuariosTableBody.innerHTML = `
      <tr><td colspan="5">Nenhum usuário encontrado.</td></tr>
    `;
    return;
  }

  usuariosTableBody.innerHTML = "";

  usuarios.forEach((user) => {
    const tr = document.createElement("tr");

    const dataFormatada = new Date(user.created_at).toLocaleString("pt-BR");

    tr.innerHTML = `
      <td>${user.nome}</td>
      <td>${user.senha}</td>
      <td>${dataFormatada}</td>
      <td>${user.perfil.toUpperCase()}</td>
      <td>
        <button class="delete-btn" data-id="${user.id}">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    `;

    usuariosTableBody.appendChild(tr);
  });
}

// =============================
// EXCLUIR USUÁRIO (EVENTO)
// =============================
usuariosTableBody.addEventListener("click", async (e) => {
  const btn = e.target.closest(".delete-btn");
  if (!btn) return;

  const userId = btn.getAttribute("data-id");
  const userName = btn.closest("tr").children[0].textContent;

  const confirmar = confirm(
    `Tem certeza que deseja excluir o usuário "${userName}"?`
  );

  if (!confirmar) return;

  const { error } = await client
    .from("usuarios")
    .delete()
    .eq("id", userId);

  if (error) {
    alert("Erro ao excluir usuário: " + error.message);
    console.error(error);
    return;
  }

  alert(`Usuário "${userName}" excluído com sucesso!`);
  carregarUsuarios(); // recarrega a lista
});

// =============================
// INICIALIZA
// =============================
document.addEventListener("DOMContentLoaded", carregarUsuarios);
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

