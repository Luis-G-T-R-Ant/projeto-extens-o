# 🚀 Guia Prático - Usando o Novo Sistema CSS

## 📌 Rápida Referência

### Variáveis CSS Mais Usadas

```css
/* Cores */
color: var(--text-color);              /* Texto principal: #121212 */
background: var(--bg-white);           /* Fundo branco */
border-color: var(--border-color);     /* Bordas: #e0e0e0 */

/* Espaçamentos */
padding: var(--spacing-md);            /* 12px */
margin-bottom: var(--spacing-lg);      /* 16px */
gap: var(--spacing-sm);                /* 8px */

/* Efeitos */
box-shadow: var(--shadow-md);          /* Sombra média */
border-radius: var(--radius-md);       /* Bordas arredondadas 8px */

/* Componentes */
@media (max-width: 768px) { /* Tablets e menores */ }
@media (max-width: 480px) { /* Celulares */ }
```

---

## 🎨 Componentes Reutilizáveis

### Botão Padrão

```html
<button class="btn">Clique aqui</button>
<button class="btn btn-primary">Enviar</button>
```

**CSS Automático:**
- Hover: fundo escuro + elevação (-1px)
- Focus: outline removido, sombra de foco
- Disabled: opacidade 60%

### Input de Texto

```html
<input type="text" class="input" placeholder="Digite aqui">
```

**CSS Automático:**
- Border de 1px em #e0e0e0
- Focus: borda verde (#008000) + sombra verde
- Font size responsivo (14px → 13px → 12px)

### Cards Mobile (Tabelas)

```html
<table>
  <tr>
    <td data-label="Produto">Arroz</td>
    <td data-label="Preço">R$ 5,00</td>
  </tr>
</table>
```

**Comportamento:**
- Desktop: tabela normal com headers
- Mobile (<700px): converte em cards com labels

---

## 📱 Padrão de Breakpoints

### Quando Usar Cada Um

```css
/* Desktop Grande (1920px) */
.desktop-only {
  display: block;
}

/* Tablets e Desktops Pequenos */
@media (max-width: 1024px) {
  .padding-container {
    padding: 0 12px; /* reduz de 15px */
  }
}

/* Tablets (iPad) */
@media (max-width: 768px) {
  .flex-layout {
    flex-direction: column; /* muda para vertical */
  }
}

/* Celulares (iPhone, Android) */
@media (max-width: 480px) {
  .btn {
    width: 100%; /* botão full-width */
  }
}

/* Muito Pequenos (Galaxy Fold, etc) */
@media (max-width: 360px) {
  .font-size {
    font-size: 11px; /* reduz ao mínimo */
  }
}
```

---

## ✏️ Exemplos de Implementação

### Exemplo 1: Novo Formulário

```html
<form class="my-form">
  <div class="form-group">
    <label>Email</label>
    <input type="email" placeholder="seu@email.com">
  </div>
  
  <div class="form-group">
    <label>Senha</label>
    <input type="password" placeholder="••••••">
  </div>
  
  <button class="btn btn-primary">Enviar</button>
</form>
```

```css
.my-form {
  max-width: 400px;
  padding: var(--spacing-xl);      /* 20px */
  background: var(--bg-white);
  border-radius: var(--radius-lg); /* 12px */
  box-shadow: var(--shadow-md);
  margin: 0 auto;
}

.form-group {
  margin-bottom: var(--spacing-lg); /* 16px */
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);            /* 8px */
}

/* Em tablets */
@media (max-width: 768px) {
  .my-form {
    padding: var(--spacing-lg);     /* 16px */
    border-radius: var(--radius-md);
  }

  .form-group {
    margin-bottom: var(--spacing-md); /* 12px */
  }
}

/* Em celulares */
@media (max-width: 480px) {
  .my-form {
    padding: var(--spacing-md);      /* 12px */
  }

  .form-group {
    margin-bottom: var(--spacing-sm); /* 8px */
  }
}
```

### Exemplo 2: Container Responsivo

```html
<div class="container">
  <h1>Título</h1>
  <div class="content">
    Conteúdo aqui
  </div>
</div>
```

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);      /* 16px horizontal */
  width: 100%;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .container {
    padding: 0 var(--spacing-md);    /* 12px */
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 var(--spacing-sm);    /* 8px */
  }
}
```

### Exemplo 3: Menu Responsivo

```html
<nav class="navbar">
  <div class="nav-brand">Logo</div>
  <ul class="nav-menu">
    <li><a href="#">Home</a></li>
    <li><a href="#">Sobre</a></li>
    <li><a href="#">Contato</a></li>
  </ul>
</nav>
```

```css
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-white);
  border-bottom: 1px solid var(--border-light);
}

.nav-menu {
  display: flex;
  gap: var(--spacing-lg);
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-menu a {
  color: var(--text-color);
  text-decoration: none;
  transition: color 0.3s ease;
}

.nav-menu a:hover {
  color: var(--color-primary);
}

/* Em tablets e celulares */
@media (max-width: 768px) {
  .nav-menu {
    flex-direction: column;
    gap: var(--spacing-md);
    position: absolute;
    top: 60px;
    left: 0;
    right: 0;
    background: var(--bg-white);
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--border-color);
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
  }

  .nav-menu.active {
    max-height: 500px;
  }
}
```

---

## 🎯 Checklist para Novas Funcionalidades

Quando adicionar novo CSS, siga este checklist:

- [ ] Usar variáveis CSS (não hardcode de cores/tamanhos)
- [ ] Adicionar media query para 1024px
- [ ] Adicionar media query para 768px
- [ ] Adicionar media query para 480px
- [ ] Testar em 360px (Galaxy Fold)
- [ ] Adicionar `box-sizing: border-box` em containers
- [ ] Usar `transition: ... ease` (não `linear`)
- [ ] Adicionar `focus` state para inputs
- [ ] Adicionar `hover` state para interativos
- [ ] Adicionar `disabled` state se aplicável
- [ ] Remover `!important` a menos que absolutamente necessário
- [ ] Validar em navegadores: Chrome, Firefox, Safari

---

## 🐛 Debugging & Troubleshooting

### Problema: Texto muito pequeno em celular
```css
/* Verificar se há font-size mínimo */
font-size: clamp(12px, 2vw, 16px);  /* min 12px, max 16px */
```

### Problema: Layout quebrado em 480px
```css
/* Adicione media query 480px */
@media (max-width: 480px) {
  .flex-layout {
    flex-direction: column; /* força vertical */
  }
}
```

### Problema: Overflow horizontal
```css
/* Verifique box-sizing */
* { box-sizing: border-box; } /* adicione se falta */

/* Ou reduza padding */
padding: 0 8px; /* em vez de 15px */
```

### Problema: Botões não clicáveis em mobile
```css
/* Aumente altura mínima */
button {
  height: 44px; /* Apple recomenda mínimo 44px */
  min-width: 44px;
}
```

---

## 📊 Tabela de Referência Rápida

### Tamanhos de Fonte
| Uso | Desktop | Tablet | Mobile |
|-----|---------|--------|--------|
| Título | 24px | 20px | 18px |
| Subtítulo | 18px | 16px | 14px |
| Padrão | 14px | 13px | 12px |
| Pequeno | 12px | 11px | 10px |

### Espaçamentos
| Variável | Valor | Quando Usar |
|----------|-------|-----------|
| `--spacing-xs` | 4px | Gaps muito pequenas |
| `--spacing-sm` | 8px | Gaps padrão, margin-bottom |
| `--spacing-md` | 12px | Padding padrão |
| `--spacing-lg` | 16px | Padding em botões/inputs |
| `--spacing-xl` | 20px | Padding em panels/forms |

### Cores
| Variável | Cor | Uso |
|----------|-----|-----|
| `--color-primary` | #008000 | Botões, links, highlights |
| `--text-color` | #121212 | Texto principal |
| `--text-secondary` | #555555 | Texto secundário, labels |
| `--border-color` | #e0e0e0 | Bordas, linhas |
| `--bg-white` | #ffffff | Fundo de cards/panels |

---

## 🔗 Arquivos CSS Editados

1. **global.css** - Variáveis, reset, componentes base
2. **produtos.css** - Página de lista de produtos
3. **login.css** - Página de login
4. **cadastro.css** - Páginas de cadastro (usuários, produtos)
5. **movimentacao.css** - Página de movimentação
6. **historico.css** - Página de histórico
7. **relatorio.css** - Página de relatório

---

## 📞 Suporte e Perguntas

**P: Preciso adicionar novo breakpoint?**  
R: Use os 5 existentes (1024/768/480/360px). Se realmente necessário, adicione entre dois (ex: 640px).

**P: Devo usar `rem` em vez de `px`?**  
R: Mantenha `px` para consistência com código existente. Use variáveis CSS para fácil ajuste.

**P: Como customizar cores para tema escuro?**  
R: Crie novo `:root` dentro de `@media (prefers-color-scheme: dark)`.

**P: Transições podem quebrar performance?**  
R: Não com `transform` e `opacity`. Evite animar `width`, `height`, `top`, `left`.

---

**Última atualização:** 10/12/2025  
**Versão:** 1.0  
**Status:** ✅ Pronto para uso
