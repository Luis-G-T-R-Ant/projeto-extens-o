// CONFIGURAR SUPABASE
const supabaseUrl = "https://olcnpzqxwhwthpwuuzwv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sY25wenF4d2h3dGhwd3V1end2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNzA2NTUsImV4cCI6MjA4MDY0NjY1NX0.GDTO8jNtOr-ZB1nPj9HqvytdaBt-eYoZnOLAauOjZLk";

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// Normaliza nomes
function normalizeName(str) {
  if (!str || typeof str !== 'string') return '';
  let s = str.normalize('NFD');
  s = s.replace(/[\u0300-\u036f]/g, '');
  s = s.replace(/[^0-9a-zA-Z\s]/g, '');
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
    option.value = cat.id;
    option.textContent = cat.nome;
    select.appendChild(option);
  });
}

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

// GERAR CÓDIGO DE LOTE AUTOMÁTICO
function gerarCodigoLote(nomeProduto, validade) {
  const nomeAbrev = normalizeName(nomeProduto)
    .split(' ')
    .slice(0, 2)
    .map(p => p.substring(0, 3).toUpperCase())
    .join('-');
  
  const dataFormatada = validade 
    ? new Date(validade).toISOString().slice(0, 10).replace(/-/g, '')
    : 'SEMVAL';
  
  const timestamp = Date.now().toString().slice(-4);
  
  return `${nomeAbrev}-${dataFormatada}-${timestamp}`;
}

// SALVAR PRODUTO COM LOTE
async function salvarProduto() {
  const nome = document.getElementById("nome").value.trim();
  const categoria = document.getElementById("categoria").value;
  const unidade = document.getElementById("unidade").value;
  const quantidade = document.getElementById("quantidade").value;
  const preco = document.getElementById("preco").value;
  const validade = document.getElementById("validade").value;
  const localizacao = document.getElementById("localizacao")?.value || null;

  if (!nome || !categoria || !unidade || !quantidade || !preco) {
    alert("Preencha todos os campos obrigatórios!");
    return;
  }

  const qtdNum = parseFloat(quantidade);
  const precoNum = parseFloat(preco);

  if (qtdNum <= 0) {
    alert("Quantidade deve ser maior que zero!");
    return;
  }

  try {
    // 1. Verificar se o produto já existe
    const nomeNormalizado = normalizeName(nome);
    const { data: produtoExistente, error: errBusca } = await supabaseClient
      .from('insumos')
      .select('id, nome')
      .eq('nome_normalizado', nomeNormalizado)
      .maybeSingle();

    if (errBusca && errBusca.code !== 'PGRST116') {
      console.error('Erro ao buscar produto:', errBusca);
      alert('Erro ao verificar produto: ' + errBusca.message);
      return;
    }

    let insumoId;

    // 2. Se o produto NÃO existe, criar
    if (!produtoExistente) {
      const dadosInsumo = {
        nome: nome,
        nome_normalizado: nomeNormalizado,
        categoria_id: categoria,
        unidade_medida: unidade,
        quantidade: 0, // Será atualizado pelo trigger ao criar o lote
        preco: precoNum,
        validade: null, // Validade agora é por lote
        descricao: "",
        is_perecivel: validade ? true : false,
        is_material_limpeza: false,
        estoque_minimo: 0,
      };

      const { data: novoInsumo, error: errInsert } = await supabaseClient
        .from('insumos')
        .insert([dadosInsumo])
        .select()
        .single();

      if (errInsert) {
        console.error('Erro ao criar produto:', errInsert);
        alert('Erro ao criar produto: ' + errInsert.message);
        return;
      }

      insumoId = novoInsumo.id;
      console.log('✅ Produto criado:', novoInsumo);
    } else {
      insumoId = produtoExistente.id;
      console.log('📦 Produto já existe, criando novo lote');
    }

    // 3. Criar LOTE para este produto
    const codigoLote = gerarCodigoLote(nome, validade);
    
    const dadosLote = {
      insumo_id: insumoId,
      codigo_lote: codigoLote,
      quantidade: qtdNum,
      validade: validade || null,
      preco_unitario: precoNum,
      localizacao: localizacao,
      fornecedor: null,
      nota_fiscal: null
    };

    const { data: novoLote, error: errLote } = await supabaseClient
      .from('lotes_insumo')
      .insert([dadosLote])
      .select()
      .single();

    if (errLote) {
      console.error('Erro ao criar lote:', errLote);
      alert('Erro ao criar lote: ' + errLote.message);
      return;
    }

    console.log('✅ Lote criado:', novoLote);

    // 4. Sucesso!
    const validadeTexto = validade 
      ? new Date(validade).toLocaleDateString('pt-BR')
      : 'sem validade';
    
    alert(
      `✅ Lote cadastrado com sucesso!\n\n` +
      `Produto: ${nome}\n` +
      `Código do Lote: ${codigoLote}\n` +
      `Quantidade: ${qtdNum} ${unidade}\n` +
      `Validade: ${validadeTexto}\n` +
      `Preço: R$ ${precoNum.toFixed(2)}`
    );

    // Limpar formulário
    document.getElementById('formProdutos').reset();
    carregarProdutosNomes();

  } catch (err) {
    console.error('Erro inesperado:', err);
    alert('Erro inesperado ao salvar: ' + err.message);
  }
}

// BUSCAR LOTES DE UM PRODUTO (para visualização)
async function buscarLotesProduto(nomeProduto) {
  try {
    const { data, error } = await supabaseClient
      .from('vw_estoque_consolidado')
      .select('*')
      .eq('produto', nomeProduto)
      .order('validade', { ascending: true });

    if (error) {
      console.error('Erro ao buscar lotes:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Erro:', err);
    return [];
  }
}

// MOSTRAR LOTES EXISTENTES AO SELECIONAR PRODUTO
async function mostrarLotesExistentes() {
  const nomeProduto = document.getElementById('nome').value.trim();
  const containerLotes = document.getElementById('lotesExistentes');
  
  if (!containerLotes || !nomeProduto) return;

  const lotes = await buscarLotesProduto(nomeProduto);
  
  if (lotes.length === 0) {
    containerLotes.innerHTML = '<p style="color: #666; font-size: 12px;">Nenhum lote encontrado para este produto.</p>';
    return;
  }

  let html = '<div style="margin-top: 10px; padding: 10px; background: #f0f0f0; border-radius: 8px;">';
  html += '<h4 style="margin: 0 0 8px 0; color: #2e7d32; font-size: 14px;">📦 Lotes Existentes:</h4>';
  
  lotes.forEach(lote => {
    const validadeTexto = lote.validade 
      ? new Date(lote.validade).toLocaleDateString('pt-BR')
      : 'Sem validade';
    
    const statusColor = {
      'VENCIDO': '#e53935',
      'CRITICO': '#ff9800',
      'ATENCAO': '#ffc107',
      'OK': '#4caf50',
      'SEM_VALIDADE': '#757575'
    }[lote.status_validade] || '#757575';

    html += `
      <div style="padding: 6px; margin: 4px 0; background: white; border-radius: 4px; border-left: 3px solid ${statusColor}; font-size: 12px;">
        <strong>${lote.codigo_lote}</strong> - 
        ${lote.quantidade} ${lote.unidade_medida || 'un'} - 
        Val: ${validadeTexto}
        ${lote.localizacao ? ` - ${lote.localizacao}` : ''}
      </div>
    `;
  });
  
  html += '</div>';
  containerLotes.innerHTML = html;
}

// Event listener para mostrar lotes ao digitar
document.addEventListener('DOMContentLoaded', () => {
  carregarCategorias();
  carregarProdutosNomes();

  const inputNome = document.getElementById('nome');
  if (inputNome) {
    inputNome.addEventListener('blur', mostrarLotesExistentes);
  }
});