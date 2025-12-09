// Nome do cache
const CACHE_NAME = 'chicago-burguer-v1';
const RUNTIME_CACHE = 'chicago-burguer-runtime';

// Arquivos estáticos para cache durante instalação (caminhos relativos/globais)
const STATIC_ASSETS = [
  './pages/login.html',
  './pages/produtos.html',
  './pages/cadastro.html',
  './pages/cadprodutos.html',
  './pages/deletar.html',
  './pages/deletarprod.html',
  './styles/global.css',
  './styles/login.css',
  './styles/cadastro.css',
  './styles/produtos.css',
  './pages/JS/login.js',
  './pages/JS/cadastro.js',
  './pages/JS/cadprodu.js',
  './pages/JS/deletar.js',
  './pages/JS/delprod.js',
  './pages/JS/listarprod.js',
  './js/pwa-register.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
];

// Evento de instalação
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Cache de instalação aberto');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Alguns arquivos não puderam ser cacheados:', err);
      });
    })
  );
  self.skipWaiting();
});

// Evento de ativação
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE)
          .map((cacheName) => {
            console.log('Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  self.clients.claim();
});

// Evento de fetch - estratégia network-first com fallback para cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return;
  }

  // Estratégia diferente para APIs (network-first)
  if (url.origin.includes('supabase')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Estratégia cache-first para assets estáticos
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Estratégia network-first com cache fallback
  event.respondWith(networkFirst(request));
});

// Estratégia: Cache First (tenta cache primeiro)
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.add(request);
    }
    return response;
  } catch (err) {
    console.error('Erro ao fazer fetch:', err);
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
    console.error('Erro de rede:', err);
    
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

// Verifica se é um asset estático
function isStaticAsset(url) {
  return (
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.ttf')
  );
}

// Sincronização em background (opcional - para futuras implementações)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  console.log('Sincronizando dados...');
  // Implementar lógica de sincronização conforme necessário
}

// Notificações push (opcional)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Novo evento',
    icon: '/frontend/img/icon-192x192.png',
    badge: '/frontend/img/icon-96x96.png',
    tag: data.tag || 'notification'
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Chicago Burguer', options));
});
