    // ========= CONFIGURAÇÃO SUPABASE (Não alterada) =========
    const supabaseUrl = "https://olcnpzqxwhwthpwuuzwv.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sY25wenF4d2h3dGhwd3V1end2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNzA2NTUsImV4cCI6MjA4MDY0NjY1NX0.GDTO8jNtOr-ZB1nPj9HqvytdaBt-eYoZnOLAauOjZLk";

    // Inicializa o cliente Supabase corretamente
    const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

    // ========= ELEMENTOS DOM (Atualizado para o novo container) =========
    const lista = document.getElementById("listaProdutos");
    const inputPesquisa = document.getElementById("pesquisa");
    // Novo elemento DOM para os checkboxes
    const containerFiltrosCategoria = document.getElementById("containerFiltrosCategoria"); 


    // === 1. Carregar Categorias do Banco (e popular com CHECKBOXES) ===
    async function carregarFiltros() {
        const { data: categorias, error } = await supabaseClient
            .from("categorias_insumo")
            .select("id, nome")
            .order("nome");
            
        if (error) {
            console.error("Erro ao carregar categorias para filtro:", error);
        } else {
            
            containerFiltrosCategoria.innerHTML = '';
            
            // Cria um checkbox para "Todos" (opcional)
            const todosLabel = document.createElement("label");
            todosLabel.innerHTML = `
                <input type="checkbox" name="filtroCategoria" value="" checked>
                Todos
            `;
            // Adiciona um listener para recarregar produtos ao clicar em qualquer checkbox
            todosLabel.querySelector('input').addEventListener('change', carregarProdutos);
            containerFiltrosCategoria.appendChild(todosLabel);
            
            
            categorias.forEach(cat => {
                const label = document.createElement("label");
                // ⚠️ Importante: o valor do checkbox é o UUID da categoria
                label.innerHTML = `
                    <input type="checkbox" name="filtroCategoria" value="${cat.id}">
                    ${cat.nome}
                `;
                // Adiciona o listener
                label.querySelector('input').addEventListener('change', carregarProdutos);
                containerFiltrosCategoria.appendChild(label);
            });
        }

        // Após carregar os filtros, carrega os produtos
        carregarProdutos();
    }


    // ========= 2. CARREGAR E EXIBIR PRODUTOS (COM MÚLTIPLOS CHECKBOXES) =========
    async function carregarProdutos() {

        lista.innerHTML = `<p style="text-align:center;">Carregando...</p>`;
        
        let query = supabaseClient
            .from("insumos")
            .select(`*, categoria_id(nome)`); 

        // 🔍 Filtro por nome (Pesquisa)
        if (inputPesquisa.value.trim() !== "") {
            query = query.ilike("nome", `%${inputPesquisa.value.trim()}%`);
        }

        // 🏷 CORREÇÃO CRÍTICA: Lógica para MÚLTIPLOS CHECKBOXES
        
        // 1. Coleta todos os checkboxes de filtro marcados (exceto o 'Todos')
        const checkboxes = document.querySelectorAll('input[name="filtroCategoria"]:checked');
        
        const categoriasSelecionadas = Array.from(checkboxes)
            // Filtra para pegar apenas os UUIDs (exclui o checkbox 'Todos' se ele tiver value="")
            .map(input => input.value)
            .filter(value => value !== ""); 

        // 2. Aplica o filtro 'in' se houver categorias selecionadas.
        // Se o array estiver vazio, ele carregará todos os produtos (comportamento desejado)
        if (categoriasSelecionadas.length > 0) {
            query = query.in("categoria_id", categoriasSelecionadas);
        }
        
        // Executa a busca
        const { data: insumos, error } = await query.order("nome", { ascending: true });

        if (error) {
            lista.innerHTML = `<p style="color:red;">Erro ao carregar produtos. Verifique as RLS e o esquema do banco.</p>`;
            console.error(error);
            return;
        }

        if (!insumos || insumos.length === 0) {
            lista.innerHTML = `<p style="text-align:center;">Nenhum produto encontrado.</p>`;
            return;
        }

        // ===============================================
        // GERAR TABELA HTML PARA EXIBIÇÃO
        // ===============================================

        let tabelaHTML = `
            <table>
                <thead>
                    <tr>
                        <th></th> <th>Produto</th>
                        <th>Categoria</th>
                        <th>Quantidade</th>
                        <th>Unidade</th>
                        <th>Preço Unitário</th>
                        <th>Validade</th>
                    </tr>
                </thead>
                <tbody>
        `;

        insumos.forEach(insumo => {
            const nomeCategoria = insumo.categoria_id ? insumo.categoria_id.nome : 'Sem Categoria';
            const precoFormatado = insumo.preco ? parseFloat(insumo.preco).toFixed(2).replace('.', ',') : '0,00';
            
            let validadeFormatada = 'N/A';
            if (insumo.validade) {
                const dataValidade = new Date(insumo.validade + 'T00:00:00'); 
                validadeFormatada = dataValidade.toLocaleDateString('pt-BR');
            }

            tabelaHTML += `
                <tr>
                    <td>
                        <div class="list-item-container"> 
                        </div>
                    </td>
                    <td><p class="list-item-title">${insumo.nome}</p></td>
                    <td>${nomeCategoria}</td>
                    <td>${insumo.quantidade}</td>
                    <td>${insumo.unidade_medida}</td>
                    <td>R$ ${precoFormatado}</td>
                    <td>${validadeFormatada}</td>
                </tr>
            `;
        });

        tabelaHTML += `
                </tbody>
            </table>
        `;

        lista.innerHTML = tabelaHTML;
    }

    // Atualizar a lista sempre que o usuário digitar na caixa de pesquisa
    inputPesquisa.addEventListener("input", carregarProdutos);

    // Inicia carregando os filtros ao carregar a página
    window.onload = carregarFiltros;
