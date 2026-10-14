import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../services/api/client.js';

export default function useAcao(acao) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const montado = useRef(true);
  const pendente = useRef(null);

  useEffect(() => {
    montado.current = true;

    return () => {
      montado.current = false;
    };
  }, []);

  const executar = useCallback(
    (...args) => {
      if (pendente.current) return pendente.current;

      setCarregando(true);
      setErro(null);

      const resultado = Promise.resolve()
        .then(() => acao(...args))
        .catch((e) => {
          if (montado.current) {
            setErro(
              e instanceof ApiError
                ? e
                : new ApiError({
                    mensagem: e?.message || 'Não foi possível concluir.',
                  }),
            );
          }

          return undefined;
        })
        .finally(() => {
          pendente.current = null;

          if (montado.current) {
            setCarregando(false);
          }
        });

      pendente.current = resultado;
      return resultado;
    },
    [acao],
  );

  return { executar, carregando, erro };
}