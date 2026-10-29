// O banco usa snake_case (padrão do Postgres); a API e o app usam camelCase (docs/api.md).
const paraCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const paraSnake = (s) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

export function doBanco(linha) {
  if (!linha) return linha;
  return Object.fromEntries(Object.entries(linha).map(([k, v]) => [paraCamel(k), v]));
}

export function paraBanco(objeto) {
  return Object.fromEntries(Object.entries(objeto).map(([k, v]) => [paraSnake(k), v]));
}

// Usuário como a API devolve: sem auth_id e sem nenhum dado de senha.
export function usuarioParaApi(linha) {
  const { authId, termosAceitos, ...usuario } = doBanco(linha);
  return usuario;
}
