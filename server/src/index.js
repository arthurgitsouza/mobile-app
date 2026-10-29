import { criarApp } from './app.js';
import { config, supabaseConfigurado } from './config.js';

criarApp().listen(config.porta, () => {
  console.log(`API do RDO Mobile em http://localhost:${config.porta}/api/v1`);
  if (!supabaseConfigurado())
    console.warn('Atenção: preencha o server/.env (veja server/.env.example) para ligar ao Supabase.');
});
