console.log('🚀 Intentando iniciar Next.js...');

try {
  const next = require('next');
  const app = next({ dev: false });
  const handle = app.getRequestHandler();

  console.log('📝 Next.js cargado, preparando...');
  
  app.prepare()
    .then(() => {
      console.log('✅ Next.js preparado exitosamente');
      
      const server = require('http').createServer(async (req, res) => {
        console.log(`📥 Request: ${req.method} ${req.url}`);
        try {
          await handle(req, res);
        } catch (error) {
          console.error('❌ Error manejando request:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/html');
          res.end(`
            <h1>❌ Internal Server Error</h1>
            <p><strong>URL:</strong> ${req.url}</p>
            <p><strong>Error:</strong> ${error.message}</p>
            <pre>${error.stack}</pre>
          `);
        }
      });

      const PORT = process.env.PORT || 3000;
      server.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Next.js servidor corriendo en puerto ${PORT}`);
      });
      
      server.on('error', (err) => {
        console.error('❌ Error del servidor:', err);
      });
    })
    .catch((err) => {
      console.error('❌ Error al preparar Next.js:', err.message);
      console.error('Stack completo:', err.stack);
      
      // Servidor de fallback para mostrar el error
      const http = require('http');
      const fallbackServer = http.createServer((req, res) => {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <h1>❌ Error de Next.js</h1>
          <p><strong>Error:</strong> ${err.message}</p>
          <pre>${err.stack}</pre>
        `);
      });
      
      const PORT = process.env.PORT || 3000;
      fallbackServer.listen(PORT, '0.0.0.0', () => {
        console.log(`🆘 Servidor de error corriendo en puerto ${PORT}`);
      });
    });

} catch (err) {
  console.error('❌ Error crítico al cargar Next.js:', err.message);
  console.error('Stack:', err.stack);
}