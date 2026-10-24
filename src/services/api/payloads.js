const numeros = new Set([
  'temperatura',
  'precipitacaoMm',
  'quantidade',
  'horas',
  'horasDisponiveis',
  'horasProdutivas',
  'horasParadas',
  'quantidadeDia',
  'percentual',
  'participantes',
]);

export function selecionar(objeto = {}, campos = []) {
  return Object.fromEntries(
    campos.filter((campo) => objeto[campo] !== undefined).map((campo) => [campo, objeto[campo]]),
  );
}

export function converterNumeros(valor, paraTela = false) {
  if (Array.isArray(valor)) return valor.map((item) => converterNumeros(item, paraTela));
  if (!valor || typeof valor !== 'object') return valor;
  return Object.fromEntries(
    Object.entries(valor).map(([chave, item]) => {
      if (numeros.has(chave)) {
        if (paraTela && (typeof item === 'number' || item === null)) return [chave, item == null ? '' : String(item)];
        if (!paraTela && typeof item === 'string') {
          const texto = item.trim().replace(',', '.');
          if (!texto) return [chave, null];
          if (Number.isFinite(Number(texto))) return [chave, Number(texto)];
        }
      }
      return [chave, converterNumeros(item, paraTela)];
    }),
  );
}

export function assinaturaParaApi(assinatura) {
  if (!assinatura) return assinatura;
  const dados = selecionar(assinatura, ['tracos', 'largura', 'altura', 'segundoFator']);
  if (!dados.segundoFator && assinatura.metodo2fa) {
    dados.segundoFator = selecionar({ metodo: assinatura.metodo2fa, codigo: assinatura.codigo }, ['metodo', 'codigo']);
  }
  return dados;
}

export function conteudoParaApi(rdo = {}) {
  const dados = selecionar(rdo, [
    'data',
    'turno',
    'clima',
    'maoDeObra',
    'observacaoMaoDeObra',
    'equipamentos',
    'semProducao',
    'atividades',
    'materiais',
    'qualidade',
    'seguranca',
    'ocorrencias',
    'visitas',
    'pendencias',
    'planejamento',
    'semRegistro',
    'observacoesGerais',
  ]);
  if (rdo.identificacao) dados.identificacao = selecionar(rdo.identificacao, ['responsavelPreenchimento']);
  if (rdo.declaracao) dados.declaracao = selecionar(rdo.declaracao, ['aceita']);
  if (rdo.assinaturaOperacional) dados.assinaturaOperacional = assinaturaParaApi(rdo.assinaturaOperacional);
  return converterNumeros(dados);
}

export function rdoParaTela(rdo) {
  const convertido = converterNumeros(rdo, true);
  return {
    ...convertido,
    fotos: (convertido.fotos || []).map((foto) => ({
      ...foto,
      uri: foto.url || foto.uri,
      envio: foto.url ? 'enviada' : foto.envio,
    })),
  };
}
