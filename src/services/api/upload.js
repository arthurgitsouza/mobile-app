import { ApiError } from './client.js';

export async function montarUploadFoto(foto, { web = typeof document !== 'undefined', metadados = true } = {}) {
  if (!foto?.uri) {
    throw new ApiError({
      codigo: 'FOTO_INDISPONIVEL',
      mensagem: 'A foto não está disponível no aparelho. Selecione-a novamente.',
    });
  }
  const nome = foto.nome || foto.uri.split(/[?#]/)[0].split('/').at(-1) || 'foto.jpg';
  const extensao = nome.split('.').at(-1).toLowerCase();
  const tipo =
    foto.mimeType ||
    { png: 'image/png', webp: 'image/webp', heic: 'image/heic', pdf: 'application/pdf' }[extensao] ||
    'image/jpeg';
  const body = new FormData();
  if (metadados) body.append('legenda', foto.legenda || '');
  const campos = {
    local: foto.local,
    vinculoTipo: foto.vinculo?.tipo,
    vinculoId: foto.vinculo?.id,
    capturadaEm: foto.capturadaEm || foto.dataHora,
    latitude: foto.latitude ?? foto.localizacao?.latitude,
    longitude: foto.longitude ?? foto.localizacao?.longitude,
    largura: foto.largura,
    altura: foto.altura,
    compressao: foto.compressao,
  };
  Object.entries(campos).forEach(([chave, valor]) => {
    if (metadados && valor !== undefined && valor !== null) body.append(chave, String(valor));
  });
  if (web) {
    const resposta = await fetch(foto.uri);
    if (!resposta.ok) throw new ApiError({ codigo: 'FOTO_INDISPONIVEL', mensagem: 'Não foi possível ler a foto.' });
    body.append('arquivo', await resposta.blob(), nome);
  } else {
    body.append('arquivo', { uri: foto.uri, name: nome, type: tipo });
  }
  return body;
}
