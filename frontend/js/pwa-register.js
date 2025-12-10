// ============================================
// PWA REGISTER ATUALIZADO - pwa-register.js
// ============================================
// Substitui o js/pwa-register.js existente

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('../service-worker.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registrado com sucesso:', registration.scope);

        // Verifica atualizações a cada 60 segundos
        setInterval(() => {
          registration.update();
        }, 60000);

        // Listener para novas versões
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('[PWA] Nova versão do Service Worker encontrada!');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] Nova versão disponível!');
              
              // Mostra notificação para o usuário
              mostrarNotificacaoAtualizacao(newWorker);
            }
          });
        });
      })
      .catch((error) => {
        console.error('[PWA] Erro ao registrar Service Worker:', error);
      });

    // Listener para mensagens do Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        console.log('[PWA] Service Worker atualizado:', event.data);
        mostrarNotificacaoSistemaAtualizado();
      }
    });

    // Listener para quando o SW toma controle
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] Novo Service Worker assumiu o controle');
      
      // Mostra banner de atualização
      mostrarBannerAtualizacao();
    });
  });
}

// Mostra notificação de atualização disponível
function mostrarNotificacaoAtualizacao(worker) {
  const banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
    color: white;
    padding: 15px 20px;
    text-align: center;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-family: Arial, sans-serif;
    animation: slideDown 0.3s ease-out;
  `;

  banner.innerHTML = `
    <style>
      @keyframes slideDown {
        from { transform: translateY(-100%); }
        to { transform: translateY(0); }
      }
      #update-banner button {
        background: white;
        color: #2e7d32;
        border: none;
        padding: 8px 20px;
        border-radius: 20px;
        font-weight: bold;
        cursor: pointer;
        margin: 0 5px;
        transition: 0.2s;
      }
      #update-banner button:hover {
        transform: scale(1.05);
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }
      #update-banner button.dismiss {
        background: transparent;
        color: white;
        border: 2px solid white;
      }
    </style>
    <strong>🎉 Nova versão disponível!</strong> 
    <span style="margin: 0 10px;">Sistema atualizado para melhor experiência.</span>
    <button onclick="window.atualizarAgora()">Atualizar Agora</button>
    <button class="dismiss" onclick="window.dispensarAtualizacao()">Depois</button>
  `;

  document.body.appendChild(banner);

  // Funções globais
  window.atualizarAgora = () => {
    worker.postMessage({ type: 'SKIP_WAITING' });
    banner.remove();
    
    // Mostra loading
    const loading = document.createElement('div');
    loading.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 30px 40px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 9999999;
      text-align: center;
      font-family: Arial, sans-serif;
    `;
    loading.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 15px;">⏳</div>
      <div style="font-size: 18px; color: #2e7d32; font-weight: bold;">Atualizando...</div>
      <div style="font-size: 14px; color: #666; margin-top: 8px;">Aguarde alguns segundos</div>
    `;
    document.body.appendChild(loading);

    // Recarrega após 1 segundo
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  window.dispensarAtualizacao = () => {
    banner.remove();
  };
}

// Mostra notificação de sistema já atualizado
function mostrarNotificacaoSistemaAtualizado() {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
    color: white;
    padding: 20px 25px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    z-index: 999999;
    font-family: Arial, sans-serif;
    max-width: 350px;
    animation: slideInRight 0.4s ease-out;
  `;

  notification.innerHTML = `
    <style>
      @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    </style>
    <div style="display: flex; align-items: center; gap: 15px;">
      <div style="font-size: 32px;">✅</div>
      <div>
        <div style="font-weight: bold; margin-bottom: 5px;">Sistema Atualizado!</div>
        <div style="font-size: 13px; opacity: 0.9;">Recarregue a página para ver as mudanças</div>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  // Remove após 5 segundos
  setTimeout(() => {
    notification.style.animation = 'slideInRight 0.4s ease-out reverse';
    setTimeout(() => notification.remove(), 400);
  }, 5000);
}

// Mostra banner para recarregar página
function mostrarBannerAtualizacao() {
  const banner = document.createElement('div');
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #ff9800;
    color: white;
    padding: 12px 20px;
    text-align: center;
    z-index: 999999;
    font-family: Arial, sans-serif;
    font-weight: bold;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;

  banner.innerHTML = `
    ⚠️ Página atualizada! <a href="#" onclick="window.location.reload(); return false;" style="color: white; text-decoration: underline; margin-left: 10px;">Clique aqui para recarregar</a>
  `;

  document.body.appendChild(banner);

  // Auto-recarrega após 3 segundos
  setTimeout(() => {
    window.location.reload();
  }, 3000);
}

// Função para limpar cache manualmente (use no console se necessário)
window.limparCachePWA = async function() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    for (const registration of registrations) {
      await registration.unregister();
      console.log('[PWA] Service Worker desregistrado');
    }
    
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log('[PWA] Cache removido:', cacheName);
      }
    }
    
    console.log('[PWA] Todos os caches e Service Workers removidos!');
    alert('Cache limpo! Recarregando página...');
    window.location.reload();
  }
};

// Log de informações para debug
console.log('[PWA] Script de registro carregado');
console.log('[PWA] Para limpar cache manualmente, execute: window.limparCachePWA()');
console.log('[PWA] Versão: 2.0 - Sistema Integrado');