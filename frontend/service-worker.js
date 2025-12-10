// ============================================
// SERVICE WORKER ATUALIZADO - v2.0
// ============================================
// Substitui o service-worker.js existente

// ⚠️ IMPORTANTE: Altere a versão do cache para forçar atualização
const CACHE_NAME = 'chicago-burguer-v2.0'; // ← MUDOU DE v1 PARA v2.0
const RUNTIME_CACHE = 'chicago-burguer-runtime-v2.0';

// Arquivos estáticos para cache - ATUALIZADOS
const STATIC_ASSETS = [
  './pages/login.html',
  './pages/produtos.html',
  './pages/cadastro.html',
  './pages/cadprodutos.html',
  './pages/deletar.html',
  './pages/deletarprod.html',
  './pages/movimentacao.html',
  './pages/relatorio.html',
  './pages/historico.html',
  './pages/lotes.html',
  './styles/global.css',
  './styles/login.css',
  './styles/cadastro.css',
  './styles/produtos.css',
  './styles/movimentacao.css',
  './styles/relatorio.css',
  './styles/historico.css',
  // ⭐ NOVOS ARQUIVOS DO SISTEMA INTEGRADO
  './pages/JS/sistema-lotes-core.js',
  './pages/JS/movimentacao-integrada.js',
  './pages/JS/produtos-integrado.js',
  './pages/JS/relatorio-integrado.js',
  './pages/JS/lotes-integrado.js',
  // Arquivos antigos mantidos para compatibilidade
  './pages/JS/login.js',
  './pages/JS/cadastro.js',
  './pages/JS/cadprodu.js',
  './pages/JS/deletar.js',
  './pages/JS/delprod.js',
  './pages/JS/historico.js',
  './js/pwa-register.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
];

// Evento de instalação
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker v2.0...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache v2.0 aberto');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Alguns arquivos não puderam ser cacheados:', err);
        // Continua mesmo se alguns arquivos falharem
        return Promise.resolve();
      });
    }).then(() => {
      console.log('[SW] Instalação concluída');
      // Força ativação imediata
      return self.skipWaiting();
    })
  );
});

// Evento de ativação - LIMPA CACHES ANTIGOS
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker v2.0...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      console.log('[SW] Caches existentes:', cacheNames);
      
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Remove TODOS os caches antigos (v1, v1.1, etc)
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => {
            console.log('[SW] Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('[SW] Caches antigos removidos');
      // Assume controle de todas as páginas imediatamente
      return self.clients.claim();
    }).then(() => {
      console.log('[SW] Service Worker v2.0 ativado e no controle');
      
      // Recarrega todas as páginas abertas
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          console.log('[SW] Notificando cliente para recarregar:', client.url);
          client.postMessage({
            type: 'SW_UPDATED',
            version: '2.0',
            message: 'Sistema atualizado! Por favor, recarregue a página.'
          });
        });
      });
    })
  );
});

// Evento de fetch - estratégia otimizada
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return;
  }

  // Estratégia para APIs Supabase: SEMPRE network-first
  if (url.origin.includes('supabase')) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Estratégia para assets estáticos: cache-first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Estratégia para páginas HTML: network-first com cache fallback
  if (url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Default: network-first
  event.respondWith(networkFirst(request));
});

// Estratégia: Network Only (sempre da rede)
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (err) {
    console.error('[SW] Erro de rede (network-only):', err);
    return new Response(JSON.stringify({ 
      error: 'Você está offline. Dados não disponíveis.' 
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Estratégia: Cache First (tenta cache primeiro)
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    // Retorna do cache e atualiza em background
    fetchAndUpdateCache(request, cache);
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    console.error('[SW] Erro ao fazer fetch (cache-first):', err);
    return new Response('Conteúdo não disponível offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Estratégia: Network First (tenta rede primeiro)
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    // Cache da resposta se for bem-sucedida
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (err) {
    console.error('[SW] Erro de rede (network-first):', err);
    
    // Tenta cache como fallback
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }

    // Resposta padrão para offline
    return new Response('Você está offline. Alguns recursos podem não estar disponíveis.', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Atualiza cache em background
async function fetchAndUpdateCache(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
  } catch (err) {
    // Ignora erros em background
  }
}

// Verifica se é um asset estático
function isStaticAsset(url) {
  return (
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.gif') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.ttf')
  );
}

// Mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Recebido comando SKIP_WAITING');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] Limpando todos os caches...');
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        console.log('[SW] Todos os caches limpos');
      })
    );
  }
});

// Sincronização em background (opcional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  console.log('[SW] Sincronizando dados...');
  // Implementar lógica de sincronização conforme necessário
}

// Notificações push (opcional)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Novo evento',
    icon: '/img/verde.jpg',
    badge: '/img/verde.jpg',
    tag: data.tag || 'notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Chicago Burguer', options)
  );
});