import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import { PASSOS_RDO, PERFIL, STATUS } from '../../constants';
import { useApp } from '../../store/AppContext';
import { validarRdo } from '../../domain/validation';
import { podeEditarOperacional } from '../../domain/workflow';
import { numeroFormatado } from '../../domain/rdo';
import { formatTime, nowISO } from '../../utils/date';
import { Banner, Button, EmptyState, IconButton, Screen, Txt, useUI } from '../../components/ui';
import { CommentItem } from '../../components/rdo';
import StepperBar from './StepperBar';
import { STEP_COMPONENTS } from './steps';

const PASSO_MASTER = { key: 'justificativa', letras: '✎', titulo: 'Justificativa e alterações', curto: 'Justificar', icone: 'pencil-lock-outline', ajuda: 'Toda edição pelo master exige justificativa e registra o antes/depois. Prefira devolver ao autor quando a mudança for técnica.' };

// Formulário do RDO por etapas (seção 13): salvamento automático, validações em tempo real e etapa final de revisão.
export default function RdoFormScreen({ route, navigation }) {
  const { rdoId, passo, modo = 'operacional' } = route.params;
  const { state, currentUser } = useApp();
  const rdo = state.rdos.find((r) => r.id === rdoId);
  const obra = rdo ? state.obras.find((o) => o.id === rdo.obraId) : null;
  const master = modo === 'master';
  const permitido =
    rdo && obra && (master ? currentUser.perfil === PERFIL.MASTER && [STATUS.SUBMETIDO, STATUS.EM_ANALISE].includes(rdo.status) : podeEditarOperacional(rdo, currentUser));

  if (!permitido) {
    return (
      <Screen title="RDO" back>
        <EmptyState
          icon="lock-outline"
          title="Edição indisponível"
          message="Este RDO não pode ser editado por você agora. Após o envio, só é possível corrigir se o master devolver ou abrir uma retificação."
          actionLabel="Voltar"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }
  return <RdoFormInner key={rdoId + modo} rdoInicial={rdo} obra={obra} modo={modo} passoParam={passo} navigation={navigation} />;
}

function RdoFormInner({ rdoInicial, obra, modo, passoParam, navigation }) {
  const { state, actions, currentUser, online } = useApp();
  const { confirm, toast } = useUI();
  const master = modo === 'master';
  const passos = master ? [...PASSOS_RDO.slice(0, -1), PASSO_MASTER] : PASSOS_RDO;
  const original = useRef(rdoInicial).current;

  const [draft, setDraft] = useState(rdoInicial);
  const [visitados, setVisitados] = useState(() => new Set());
  const [salvoEm, setSalvoEm] = useState(null);
  const [rodape, setRodape] = useState(null);
  const [rolagemAtiva, setRolagemAtiva] = useState(true);
  const scrollRef = useRef(null);

  const v = useMemo(() => validarRdo(draft, { obra, rdos: state.rdos }), [draft, obra, state.rdos]);

  const [indice, setIndice] = useState(() => {
    const idx = passos.findIndex((p) => p.key === passoParam);
    if (idx >= 0) return idx;
    if (rdoInicial.atualizadoEm === rdoInicial.criadoEm || master) return 0;
    const primeiro = passos.findIndex((p, i) => i < passos.length - 1 && ['erro', 'vazio'].includes(validarRdo(rdoInicial, { obra, rdos: state.rdos }).porPasso[p.key]?.estado));
    return primeiro >= 0 ? primeiro : passos.length - 1;
  });

  const passo = passos[indice];
  const ultimo = indice === passos.length - 1;
  const Step = STEP_COMPONENTS[passo.key];

  // ---- salvamento automático (RF-05) ----
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const sujo = useRef(false);
  const montado = useRef(false);

  const salvar = useCallback(
    (manual = false) => {
      if (master) return;
      actions.salvarRdo({ rdo: draftRef.current, manual });
      sujo.current = false;
      setSalvoEm(nowISO());
    },
    [actions, master],
  );

  useEffect(() => {
    if (!montado.current) {
      montado.current = true;
      return undefined;
    }
    sujo.current = true;
    if (master) return undefined;
    const t = setTimeout(() => salvar(false), 800);
    return () => clearTimeout(t);
  }, [draft, master, salvar]);

  // Ao sair da tela, grava o que ainda estiver pendente.
  useEffect(
    () => () => {
      if (sujo.current && !master) actions.salvarRdo({ rdo: draftRef.current });
    },
    [actions, master],
  );

  const update = useCallback((patch) => setDraft((d) => ({ ...d, ...(typeof patch === 'function' ? patch(d) : patch) })), []);

  const irPara = useCallback(
    (i) => {
      setVisitados((s) => new Set(s).add(passos[indice].key));
      setIndice(i);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    },
    [indice, passos],
  );

  const sair = async () => {
    if (master && JSON.stringify(draft) !== JSON.stringify(original)) {
      const ok = await confirm({ destructive: true, title: 'Descartar alterações?', message: 'As alterações feitas na edição do master ainda não foram salvas.', confirmLabel: 'Descartar', cancelLabel: 'Continuar editando' });
      if (!ok) return;
    }
    navigation.goBack();
  };

  const errosDoPasso = v.erros.filter((e) => e.passo === passo.key);
  const avisosDoPasso = v.avisos.filter((e) => e.passo === passo.key);
  const mostrarErros = visitados.has(passo.key) && !ultimo;
  const comentariosDoPasso = draft.comentarios.filter((c) => c.papel === PERFIL.MASTER && (c.contexto === passo.key || (passo.key === 'fotos' && c.contexto === 'fotos')));

  const ctx = { catalogos: state.catalogos, rdos: state.rdos, usuarios: state.users, currentUser, online, modo, original };

  return (
    <Screen
      title={`RDO nº ${numeroFormatado(draft)}${draft.versao > 1 ? ` · v${draft.versao}` : ''}`}
      subtitle={master ? `${obra.nome} · edição do master` : `${obra.nome} · ${salvoEm ? `salvo às ${formatTime(salvoEm)}` : 'salvamento automático'}`}
      back
      onBack={sair}
      right={
        master ? undefined : (
          <IconButton
            icon="content-save-outline"
            label="Salvar rascunho agora"
            color={colors.white}
            onPress={() => {
              salvar(true);
              toast.show({ type: 'success', title: 'Rascunho salvo', message: online ? 'Salvo no aparelho e na nuvem.' : 'Salvo no aparelho. Será sincronizado quando houver conexão.' });
            }}
          />
        )
      }
      headerExtra={<StepperBar passos={passos} indice={indice} porPasso={v.porPasso} visitados={visitados} progresso={v.progresso} onSelecionar={irPara} />}
      keyboard
      scrollRef={scrollRef}
      scrollEnabled={rolagemAtiva}
      footer={
        rodape || (
          <View style={styles.rodape}>
            {indice > 0 ? <Button title="Voltar" icon="chevron-left" variant="secondary" onPress={() => irPara(indice - 1)} style={{ flex: 1 }} /> : <Button title="Sair" variant="secondary" onPress={sair} style={{ flex: 1 }} />}
            {!ultimo ? <Button title="Avançar" iconRight="chevron-right" onPress={() => irPara(indice + 1)} style={{ flex: 1.5 }} /> : null}
          </View>
        )
      }
      hideFooterOnKeyboard
    >
      {master ? <Banner tone="gold" icon="pencil-lock-outline" title="Edição pelo master" message="As alterações exigem justificativa e ficam registradas (antes/depois) na trilha de auditoria. O autor é notificado." /> : null}
      {draft.status === STATUS.DEVOLVIDO && draft.devolucao ? <Banner tone="warning" icon="undo-variant" title="Devolvido para correção" message={draft.devolucao.motivo} /> : null}

      <View style={{ gap: 2 }}>
        <Txt v="label" color={colors.navy600}>
          ETAPA {indice + 1} DE {passos.length} · GRUPO {passo.letras}
        </Txt>
        <Txt v="h1" accessibilityRole="header">
          {passo.titulo}
        </Txt>
        <Txt v="small" muted>
          {passo.ajuda}
        </Txt>
        <Txt v="caption" subtle>
          Campos com * são obrigatórios para enviar.
        </Txt>
      </View>

      {comentariosDoPasso.length ? (
        <View style={{ gap: 8 }}>
          <Txt v="label" color={colors.warning}>
            COMENTÁRIOS DO MASTER NESTA ETAPA
          </Txt>
          {comentariosDoPasso.map((c) => (
            <CommentItem key={c.id} comentario={c} nome={state.users.find((u) => u.id === c.autorId)?.nome || 'Master'} fotos={draft.fotos} />
          ))}
        </View>
      ) : null}

      {mostrarErros && errosDoPasso.length ? (
        <Banner tone="danger" icon="alert-circle-outline" title={`${errosDoPasso.length} ${errosDoPasso.length === 1 ? 'pendência obrigatória' : 'pendências obrigatórias'} nesta etapa`}>
          {errosDoPasso.slice(0, 5).map((e, i) => (
            <Txt key={i} v="small" color={colors.danger}>
              • {e.mensagem}
            </Txt>
          ))}
        </Banner>
      ) : null}
      {avisosDoPasso.length && visitados.has(passo.key) ? (
        <Banner tone="warning" title="Atenção">
          {avisosDoPasso.slice(0, 4).map((e, i) => (
            <Txt key={i} v="small" color={colors.warning}>
              • {e.mensagem}
            </Txt>
          ))}
        </Banner>
      ) : null}

      <Step
        rdo={draft}
        update={update}
        obra={obra}
        ctx={ctx}
        validacao={v}
        erros={errosDoPasso}
        mostrarErros={visitados.has(passo.key)}
        irPara={(chave) => {
          const i = passos.findIndex((p) => p.key === chave);
          if (i >= 0) irPara(i);
        }}
        definirRodape={setRodape}
        bloquearRolagem={(b) => setRolagemAtiva(!b)}
        navigation={navigation}
        salvar={salvar}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  rodape: { flexDirection: 'row', gap: 10 },
});
