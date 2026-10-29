import { createClient } from '@supabase/supabase-js';
import { config, supabaseConfigurado } from './config.js';

const opcoes = { auth: { persistSession: false, autoRefreshToken: false } };

// `db`: acesso do servidor ao banco e ao Storage (chave service_role). As regras de quem pode o quê
// são aplicadas nas rotas (docs/regras-de-negocio.md, seção 2); o RLS do banco é a segunda barreira.
export const db = supabaseConfigurado() ? createClient(config.supabaseUrl, config.supabaseServiceKey, opcoes) : null;

// `auth`: login com e-mail e senha pelo Supabase Auth (chave anon).
export const auth = supabaseConfigurado() ? createClient(config.supabaseUrl, config.supabaseAnonKey, opcoes) : null;
