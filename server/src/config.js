// Configuração lida das variáveis de ambiente (server/.env em desenvolvimento, painel do Render em produção).
export const config = {
  porta: Number(process.env.PORT || 3001),
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
  bucketFotos: process.env.SUPABASE_BUCKET_FOTOS || 'fotos-rdo',
  corsOrigins: (process.env.CORS_ORIGINS || '*')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};

export const supabaseConfigurado = () => !!(config.supabaseUrl && config.supabaseAnonKey && config.supabaseServiceKey);
