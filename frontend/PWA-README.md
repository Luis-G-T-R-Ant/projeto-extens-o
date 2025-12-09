# Chicago Burguer - PWA (Progressive Web App)

## 🚀 Instruções de Configuração PWA

O projeto foi transformado em uma Progressive Web App (PWA), permitindo instalação em dispositivos mobile e funcionamento offline.

### 📋 O que foi implementado

1. **Manifest.json** - Configuração da app
   - Nome e descrição
   - Ícones em múltiplos tamanhos
   - Tema e cores
   - Shortcuts (atalhos rápidos)

2. **Service Worker** - Funcionalidades offline
   - Cache de assets estáticos
   - Network-first para APIs (Supabase)
   - Sincronização automática
   - Suporte para notificações push

3. **Tags PWA** - Integração em todas as páginas HTML
   - Manifest link
   - Meta tags de tema
   - Apple mobile web app
   - Ícones personalizados

### 🎯 Como Usar

#### **Em Smartphones (Android/iOS)**

1. **Android Chrome:**
   - Abra a página no Chrome
   - Toque no menu (⋮) > "Instalar app"
   - A app será adicionada à tela inicial

2. **iOS Safari:**
   - Abra a página em Safari
   - Toque em Compartilhar > "Adicionar à Tela de Início"
   - Dê um nome e confirme
   - A app será adicionada à tela inicial

3. **Desktop (PWA)**
   - Chrome/Edge: Clique no ícone de instalação na barra de endereço
   - Firefox: Clique no ícone de menu > Instalar app

#### **Funcionamento Offline**

- Assets estáticos (CSS, JS, imagens) são cacheados automaticamente
- Requisições à API (Supabase) usam estratégia "network-first"
  - Se estiver online: usa dados do servidor
  - Se estiver offline: usa cache disponível

### 📦 Arquivos Principais

```
frontend/
├── manifest.json           # Configuração da PWA
├── service-worker.js       # Service worker para cache e offline
├── js/
│   └── pwa-register.js     # Registro do service worker
├── img/
│   ├── icon-192x192.png    # Ícone 192x192px (recomendado)
│   ├── icon-512x512.png    # Ícone 512x512px (recomendado)
│   └── verde.jpg           # Imagem de fundo
└── pages/
    └── [Todas as páginas com tags PWA]
```

### 🖼️ Ícones Necessários

Para melhor experiência, adicione os seguintes ícones em `frontend/img/`:

- `icon-192x192.png` - Ícone 192x192px (obrigatório)
- `icon-512x512.png` - Ícone 512x512px (obrigatório)
- `icon-96x96.png` - Ícone 96x96px (opcional)
- `icon-192x192-maskable.png` - Ícone adaptativo 192x192px
- `icon-512x512-maskable.png` - Ícone adaptativo 512x512px

**Nota:** Por enquanto, os ícones usam a imagem de fundo. Substitua pelos ícones reais da marca.

### 🔄 Estratégias de Cache

#### **Cache-First** (Assets Estáticos)
- CSS, JS, imagens, fontes
- Usa cache primeiro, depois faz fetch de atualizações

#### **Network-First** (Dados da API)
- Chamadas ao Supabase
- Tenta rede primeiro, usa cache se offline

### 📱 Recursos PWA Ativados

✅ Instalação em tela inicial  
✅ Modo standalone (sem barra do navegador)  
✅ Funcionamento offline  
✅ Cache inteligente  
✅ Sincronização em background (preparado)  
✅ Suporte a notificações push (preparado)  
✅ Atalhos rápidos na tela inicial  

### ⚙️ Configuração do Servidor

Para que a PWA funcione corretamente:

1. **HTTPS obrigatório** - PWAs requerem HTTPS em produção
2. **CORS configurado** - Se usar servidor separado
3. **Headers MIME corretos** - `.js` como `application/javascript`
4. **Cache-Control headers** - Para controlar cache do navegador

**Exemplo com Node/Express:**

```javascript
app.use((req, res, next) => {
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});
```

### 🐛 Troubleshooting

**Service Worker não registra?**
- Verificar console do navegador (F12 > Console)
- Verificar se está em HTTPS ou localhost
- Limpar cache: Ctrl+Shift+Delete

**App não aparece para instalar?**
- Verificar se manifest.json está acessível
- Verificar HTTPS/localhost
- Abrir em aba anônima (sem cache antigo)

**Dados offline não sincronizam?**
- Estratégia network-first sincroniza quando online
- Implementar fila de sincronização em background (future)

### 📚 Referências

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Google PWA Checklist](https://developers.google.com/web/progressive-web-apps/checklist)
- [Service Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**Versão PWA:** v1.0  
**Data:** Dezembro 2025
