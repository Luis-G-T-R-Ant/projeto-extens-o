// auth.js - Controle de Permissões e Autenticação

// Redireciona se o usuário não tiver permissão
function verificarPermissao(podeAcessar) {
    const role = localStorage.getItem("role");

    if (!role) {
        // não logado → volta para login
        window.location.href = "login.html";
        return;
    }

    // se a página só aceita admins e funcionários, por exemplo:
    // verificarPermissao(["admin", "funcionario"]);
    if (!podeAcessar.includes(role)) {
        alert("Você não tem permissão para acessar esta página!");
        window.location.href = "menu.html";
    }
}

// Faz logout
function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}
