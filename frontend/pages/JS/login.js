const { createClient } = supabase;

// Configurar Supabase
const supabaseUrl = 'https://olcnpzqxwhwthpwuuzwv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sY25wenF4d2h3dGhwd3V1end2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNzA2NTUsImV4cCI6MjA4MDY0NjY1NX0.GDTO8jNtOr-ZB1nPj9HqvytdaBt-eYoZnOLAauOjZLk';
const client = createClient(supabaseUrl, supabaseKey);

// Referências aos elementos
const usuarioSelect = document.getElementById('usuarioSelect');
const formLogin = document.getElementById('formLogin');

// FUNÇÃO PARA CARREGAR OS USUÁRIOS NO SELECT
async function carregarUsuarios() {
    try {
        const { data: usuarios, error } = await client
            .from('usuarios')
            .select('nome')
            .order('nome', { ascending: true });

        if (error) {
            console.error('Erro ao carregar usuários:', error);
            alert('Erro ao carregar lista de usuários!');
            return;
        }

        // Limpa o select
        usuarioSelect.innerHTML = '';

        // Adiciona opção padrão
        const optionPadrao = document.createElement('option');
        optionPadrao.value = '';
        optionPadrao.textContent = 'Selecione um usuário';
        optionPadrao.disabled = true;
        optionPadrao.selected = true;
        usuarioSelect.appendChild(optionPadrao);

        // Adiciona cada usuário
        usuarios.forEach(usuario => {
            const option = document.createElement('option');
            option.value = usuario.nome;
            option.textContent = usuario.nome;
            usuarioSelect.appendChild(option);
        });

        console.log(`${usuarios.length} usuários carregados com sucesso!`);
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao conectar com o banco de dados!');
    }
}

// EVENTO DE LOGIN
formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario = usuarioSelect.value;
    const senha = document.getElementById('senha').value;

    // Validações
    if (!usuario) {
        alert('Selecione um usuário!');
        return;
    }

    if (!senha) {
        alert('Digite sua senha!');
        return;
    }

    try {
        // Consulta o usuário no Supabase
        const { data, error } = await client
            .from('usuarios')
            .select('*')
            .eq('nome', usuario)
            .eq('senha', senha)
            .single();

        // Se não encontrou o usuário
        if (error && error.code === 'PGRST116') {
            alert('Usuário ou senha inválidos!');
            return;
        }

        if (error) {
            console.error('Erro no login:', error);
            alert('Erro ao tentar fazer login!');
            return;
        }

        if (!data) {
            alert('Usuário ou senha inválidos!');
            return;
        }

        // Login bem-sucedido! Salva o usuário na sessão
        const usuarioLogado = {
            id: data.id,
            nome: data.nome,
            perfil: data.perfil // 'admin' ou 'funcionario'
        };

        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));

        alert(`Bem-vindo(a), ${data.nome}!\nPerfil: ${data.perfil}`);

        // Redireciona para a página de produtos
        window.location.href = 'produtos.html';

    } catch (error) {
        console.error('Erro no login:', error);
        alert('Erro ao fazer login. Tente novamente!');
    }
});

// CARREGA OS USUÁRIOS QUANDO A PÁGINA CARREGAR
window.addEventListener('DOMContentLoaded', () => {
    carregarUsuarios();
});

// OU simplesmente chame direto:
carregarUsuarios();