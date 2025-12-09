// Registra o Service Worker se disponível
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Tenta diferentes caminhos do service worker
    const swPaths = [
      '/frontend/service-worker.js',
      '../service-worker.js',
      './service-worker.js'
    ];

    let registered = false;

    swPaths.forEach(path => {
      if (!registered) {
        navigator.serviceWorker.register(path)
          .then((registration) => {
            console.log('Service Worker registrado com sucesso em:', path, registration);
            registered = true;
          })
          .catch((error) => {
            console.warn(`Erro ao registrar Service Worker em ${path}:`, error);
          });
      }
    });
  });

  // Verifica atualizações periodicamente
  setInterval(() => {
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        registration.update();
      }
    });
  }, 60000); // A cada 60 segundos
}

// Detecta quando volta online
window.addEventListener('online', () => {
  console.log('Conexão restaurada');
});

// Detecta quando fica offline
window.addEventListener('offline', () => {
  console.log('Modo offline ativado');
});
