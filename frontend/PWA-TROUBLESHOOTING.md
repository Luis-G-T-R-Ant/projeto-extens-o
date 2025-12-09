# ✅ Checklist de Instalação PWA - Chicago Burguer

## 🔍 Como Verificar se a PWA Está Funcionando

### Chrome DevTools

1. **Abra o DevTools** (F12 ou Ctrl+Shift+I)
2. Vá para a aba **Application** (ou **Aplicação**)
3. Procure por **Manifest** na lateral esquerda

#### ✅ O que você deve ver em "Manifest":

```
Name: Chicago Burguer - Hamburgeria
Short name: Chicago Burguer
Start URL: ./pages/login.html
Display: standalone
Theme color: #008000
Icons: 1 icon
Status: ✓ No issues detected
```

#### ✅ Service Worker Status:

- Deve estar em **Service Workers** na lateral
- Status: **activated and running** (ativado e funcionando)
- Checkbox **Update on reload** é opcional

#### ✅ Cache Storage:

- Deve aparecer um cache chamado `chicago-burguer-v1`
- Contém arquivos CSS, JS, HTML cacheados

---

## 🚀 Se a Opção de Instalar NÃO Aparecer

### 1️⃣ Verificar o Manifest

Abra o Chrome DevTools → Application → Manifest e procure por:

```json
{
  "name": "Chicago Burguer - Hamburgeria",
  "short_name": "Chicago Burguer",
  "start_url": "./pages/login.html",
  "display": "standalone",
  "theme_color": "#008000",
  "background_color": "#ffffff",
  "icons": [{...}]
}
```

**Se aparecer erro:** O arquivo `manifest.json` não está acessível. Verifique:
- Arquivo existe em `/frontend/manifest.json`
- Acesse diretamente no navegador: `http://localhost/frontend/manifest.json`

### 2️⃣ Verificar Service Worker

Em Application → Service Workers, você deve ver:

```
http://localhost/frontend/service-worker.js
Status: activated and running (← IMPORTANTE)
```

**Se estiver com erro ("install" ou "activate"):**
- Abra Console (F12 → Console tab)
- Procure por mensagens de erro em vermelho
- Clique em Service Workers e veja os logs

### 3️⃣ Verificar HTTPS ou Localhost

⚠️ **PWAs REQUEREM:**
- ✅ HTTPS em produção
- ✅ localhost (para testes)
- ✅ 127.0.0.1 (para testes)
- ❌ IP local (ex: 192.168.1.100) - NÃO funciona, use HTTPS

### 4️⃣ Limpar Cache e Cookies

Se ainda não funcionar:

```
Chrome: Ctrl+Shift+Delete
Firefox: Ctrl+Shift+Delete
Safari: Preferences → Privacy → Manage Website Data
```

Depois:
1. Feche completamente o navegador
2. Abra em **aba anônima/privada**
3. Acesse `http://localhost/frontend/` (ou seu URL)

---

## 📱 Como Instalar a PWA

### Android (Chrome)

1. Abra a app em Chrome
2. Toque no menu **⋮** (canto superior direito)
3. Selecione **"Install app"** ou **"Instalar app"**
4. Confirme
5. A app será adicionada à tela inicial

### iOS (Safari)

1. Abra a app em Safari
2. Toque em **Compartilhar** (ícone com seta)
3. Role para baixo e selecione **"Adicionar à Tela de Início"**
4. Dê um nome (ou use o sugerido)
5. Toque em **Adicionar**
6. A app será adicionada à tela inicial

### Desktop (Chrome/Edge)

1. Abra a app
2. Procure por um **ícone de instalação** na barra de endereço (geralmente à direita)
3. Clique nele
4. Confirme a instalação

---

## 🐛 Troubleshooting Avançado

### Service Worker não registra

Verifique no Console:

```javascript
// No Console (F12 → Console), execute:
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers registrados:', registrations);
})
```

**Se retornar array vazio:** o Service Worker não está registrado

**Solução:**
1. Verifique que `js/pwa-register.js` está sendo carregado
2. Veja erros no Console
3. Limpe cache e recarregue (Ctrl+F5)

### Manifest não carrega

No Console, execute:

```javascript
fetch('manifest.json')
  .then(r => r.json())
  .then(data => console.log('Manifest:', data))
  .catch(err => console.error('Erro:', err))
```

Se der erro 404: o arquivo não está no caminho correto

### App não instala mesmo com tudo certo

Possíveis causas:
- Falta de ícone válido (Chrome requer pelo menos 192x192px)
- Manifest inválido (JSON mal formatado)
- Service Worker com erro de inicialização
- Não está em HTTPS/localhost

---

## ✅ Checklist Final

- [ ] Arquivo `manifest.json` existe em `/frontend/`
- [ ] Arquivo `service-worker.js` existe em `/frontend/`
- [ ] Arquivo `js/pwa-register.js` existe e é carregado
- [ ] Todas as páginas HTML têm a tag `<link rel="manifest" href="manifest.json">`
- [ ] Há um ícone válido (pelo menos 192x192px) em `img/`
- [ ] Está em HTTPS ou localhost
- [ ] DevTools → Application → Manifest não tem erros
- [ ] DevTools → Application → Service Workers mostra status "activated and running"
- [ ] Console não tem erros em vermelho

---

## 📞 Se Ainda Não Funcionar

1. **Verifique o console do navegador** (F12 → Console)
   - Procure por erros em vermelho
   - Copie a mensagem de erro completa

2. **Teste em aba anônima**
   - Pode haver cache de tentativas anteriores

3. **Verifique o endereço correto**
   - Deve ser: `http://localhost/frontend/` ou similar
   - Abra o manifest diretamente: `http://localhost/frontend/manifest.json`

4. **Teste em outro navegador**
   - Chrome (melhor suporte)
   - Edge (baseado em Chromium)
   - Firefox (suporte parcial)

---

**Última atualização:** Dezembro 2025
