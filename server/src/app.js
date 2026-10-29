import express from 'express';
import { config, supabaseConfigurado } from './config.js';
import { db } from './supabase.js';
import { api } from './rotas/index.js';
import { ApiError, tratarErros } from './erros.js';

export function criarApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '2mb' }));

  // CORS: necessário só para a versão web do app; o app nativo não passa por CORS.
  app.use((req, res, next) => {
    const origem = req.get('origin');
    const liberada = config.corsOrigins.includes('*') || (origem && config.corsOrigins.includes(origem));
    if (liberada) res.set('Access-Control-Allow-Origin', origem || '*');
    res.set(
      'Access-Control-Allow-Headers',
      'Authorization, Content-Type, X-Device-Id, X-Device-Label, Idempotency-Key',
    );
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(204).end();
    next();
  });

  // Saúde da API e da conexão com o banco (usada pelo Render e para testar a configuração).
  app.get('/api/v1/health', async (_req, res) => {
    if (!supabaseConfigurado()) return res.json({ ok: true, modo: 'supabase', banco: 'nao_configurado' });
    const { error } = await db.from('usuarios').select('id', { head: true, count: 'exact' });
    res.status(error ? 503 : 200).json({ ok: !error, modo: 'supabase', banco: error ? 'erro' : 'conectado' });
  });

  app.use('/api/v1', api);
  app.use((req, _res, next) =>
    next(new ApiError(404, 'ROTA_INEXISTENTE', `A rota ${req.method} ${req.path} não existe.`)),
  );
  app.use(tratarErros);
  return app;
}
