import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const apiFallback = () => ({
  name: 'api-fallback',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url.startsWith('/api/')) {
        try {
          const routePath = req.url.split('?')[0].replace('/api/', '');
          const filePath = path.resolve(__dirname, `./api/${routePath}.js`);
          
          if (fs.existsSync(filePath)) {
            const module = await server.ssrLoadModule(filePath);
            const handler = module.default;
            
            if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', async () => {
                try { req.body = body ? JSON.parse(body) : {}; } catch (e) { req.body = body; }
                res.status = (code) => { res.statusCode = code; return res; };
                res.json = (data) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); };
                await handler(req, res);
              });
            } else {
              const url = new URL(req.url, `http://${req.headers.host}`);
              req.query = Object.fromEntries(url.searchParams);
              res.status = (code) => { res.statusCode = code; return res; };
              res.json = (data) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); };
              await handler(req, res);
            }
            return;
          }
        } catch (e) {
          console.error('API Route Error:', e);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Internal Server Error' }));
          return;
        }
      }
      next();
    });
  }
});

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), apiFallback()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
