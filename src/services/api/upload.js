import { ApiError } from './client.js';

export async function montarUploadFoto(foto, { web = typeof document !== 'undefined' } = {}) {
  if (!foto?.uri) {
    throw new ApiError({
      codigo: 'FOTO_INDISPONIVEL',
      mensagem: 'A foto não está disponível no aparelho. Selecione-a novamente.',
    });
  }
  const nome = foto.nome || foto.uri.split(/[?#]/)[0].split('/').at(-1) || 'foto.jpg';
  const extensao = nome.split('.').at(-1).toLowerCase();
  const tipo = foto.mimeType || { png: 'image/png', webp: 'image/webp', heic: 'image/heic' }[extensao] || 'image/jpeg';
  const body = new FormData();
  body.append('legenda', foto.legenda || '');
  if (web) {
    const resposta = await fetch(foto.uri);
    if (!resposta.ok) throw new ApiError({ codigo: 'FOTO_INDISPONIVEL', mensagem: 'Não foi possível ler a foto.' });
    body.append('arquivo', await resposta.blob(), nome);
  } else {
    body.append('arquivo', { uri: foto.uri, name: nome, type: tipo });
  }
  return body;
}
