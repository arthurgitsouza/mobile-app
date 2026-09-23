import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import { EVENTOS_PUBLICOS, PERFIL, STATUS } from '../../constants';
import { useApp } from '../../store/AppContext';
import { useNow } from '../../hooks/useNow';
import { numeroFormatado } from '../../domain/rdo';
import { acoesDisponiveis, estaBloqueado, podeVerRdo } from '../../domain/workflow';
import { nomeUsuario, perfilUsuario } from '../../domain/selectors';
import { formatDate, formatDateTime, nomeDiaCurto, tempoRelativo } from '../../utils/date';
import { Banner, BottomSheet, Button, Card, EmptyState, IconButton, ListRow, Screen, SegmentedTabs, StatusBadge, Txt, useUI } from '../../components/ui';
import { AuditItem, CommentItem, PhotoViewer, RdoSections, WorkflowTimeline } from '../../components/rdo';
import { ComentarSheet, DevolverSheet, EnviarClienteSheet } from './sheets';

export default function RdoDetailScreen({ route, navigation }) {
  const { rdoId, tab: tabInicial = 'conteudo' } = route.params;
  const { state, actions, currentUser, online, getState } = useApp();
  const { confirm, prompt, notice, toast } = useUI();
  const now = useNow();
  const [tab, setTab] = useState(tabInicial);
  const [fotoIdx, setFotoIdx] = useState(null);
  const [comentar, setComentar] = useState(null);
  const [devolver, setDevolver] = useState(false);
  const [enviar, setEnviar] = useState(false);
  const [mais, setMais] = useState(false);

  const rdo = state.rdos.find((r) => r.id === rdoId);
  const obra = rdo ? state.obras.find((o) => o.id === rdo.obraId) : null;
  const perfil = currentUser.perfil;
  const master = perfil === PERFIL.MASTER;
  const cliente = perfil === PERFIL.CLIENTE;
  const nomeDe = (id) => nomeUsuario(state, id);

  // Auditoria de visualização (RF-19) e início automático da análise pelo master.
  useEffect(() => {
    if (!rdo || !obra || !podeVerRdo(rdo, currentUser, obra)) return;
    actions.registrarVisualizacao({ rdoId, userId: currentUser.id });
    if (master && rdo.status === STATUS.SUBMETIDO) actions.iniciarAnalise({ rdoId, userId: currentUser.id });
  }, [rdoId]); // eslint-disable-line react-hooks/exhaustive-deps

  const versoes = useMemo(
    () => (rdo ? state.rdos.filter((r) => r.obraId === rdo.obraId && r.numero === rdo.numero).sort((a, b) => a.versao - b.versao) : []),
    [state.rdos, rdo],
  );

  if (!rdo || !obra) {
    return (
      <Screen title="RDO" back>
        <EmptyState icon="file-question-outline" title="RDO não encontrado" message="O registro pode ter sido excluído ou não está mais disponível." actionLabel="Voltar" onAction={() => navigation.goBack()} />
      </Screen>
    );
  }
  if (!podeVerRdo(rdo, currentUser, obra)) {
    return (
      <Screen title="RDO" back>
        <EmptyState icon="lock-outline" title="Sem acesso" message="Você só visualiza as obras e os RDOs liberados para o seu perfil." actionLabel="Voltar" onAction={() => navigation.goBack()} />
      </Screen>
    );
  }

  const comentarios = cliente ? rdo.comentarios.filter((c) => c.visibilidade === 'cliente') : rdo.comentarios;
  const historico = [...rdo.auditoria].filter((a) => !cliente || EVENTOS_PUBLICOS.includes(a.evento)).sort((a, b) => (a.dataHora < b.dataHora ? 1 : -1));
  const acoes = acoesDisponiveis(rdo, currentUser, obra);
  const principal = acoes.find((a) => a.tipo === 'accent');
  const secundaria = acoes.find((a) => a.tipo === 'secondary' && a !== principal);
  const overflow = acoes.filter((a) => a !== principal && a !== secundaria);
  const podeComentar = acoes.some((a) => a.key === 'comentar');
  const clientesDaObra = state.users.filter((u) => u.perfil === PERFIL.CLIENTE && u.ativo && (obra.usuarioIds || []).includes(u.id));
  const original = rdo.retificaDe ? state.rdos.find((r) => r.id === rdo.retificaDe) : null;
  const vigente = rdo.retificadoPor ? state.rdos.find((r) => r.id === rdo.retificadoPor) : null;

  const exigeConexao = async (o) => {
    if (online) return true;
    await notice({ icon: 'cloud-off-outline', title: 'Sem conexão', message: `${o} registra data/hora e evidências no servidor e não está disponível offline. Reconecte-se para continuar.` });
    return false;
  };

  const executar = async (key) => {
    setMais(false);
    switch (key) {
      case 'editar':
        return navigation.navigate('RdoForm', { rdoId });
      case 'revisar_enviar':
        return navigation.navigate('RdoForm', { rdoId, passo: 'revisao' });
      case 'comentar':
        return setComentar({ contexto: 'geral' });
      case 'devolver':
        if (await exigeConexao('A devolução')) setDevolver(true);
        return undefined;
      case 'editar_master':
        return navigation.navigate('RdoForm', { rdoId, modo: 'master' });
      case 'validar':
        if (await exigeConexao('A assinatura do master')) navigation.navigate('SignMaster', { rdoId });
        return undefined;
      case 'enviar_cliente':
        if (await exigeConexao('O envio ao cliente')) setEnviar(true);
        return undefined;
      case 'reenviar': {
        if (!(await exigeConexao('O reenvio'))) return undefined;
        const ok = await confirm({ title: 'Reenviar notificação?', message: 'O cliente receberá novamente push e e-mail com o link de acesso ao RDO.', confirmLabel: 'Reenviar' });
        if (ok) {
          actions.reenviarNotificacaoCliente({ rdoId, userId: currentUser.id });
          toast.show({ type: 'success', title: 'Notificação reenviada', message: 'Push e e-mail enviados ao cliente (simulado).' });
        }
        return undefined;
      }
      case 'assinar_cliente':
        if (await exigeConexao('A ciência/aceite')) navigation.navigate('SignClient', { rdoId });
        return undefined;
      case 'pdf':
        return navigation.navigate('PdfViewer', { rdoId });
      case 'retificar': {
        if (!(await exigeConexao('A retificação'))) return undefined;
        const motivo = await prompt({ icon: 'file-restore-outline', title: 'Retificar RDO', message: 'Cria uma nova versão vinculada. A versão original e o motivo permanecem no histórico.', placeholder: 'Motivo da retificação (obrigatório)', confirmLabel: 'Abrir retificação' });
        if (motivo) {
          const s = actions.retificarRdo({ rdoId, userId: currentUser.id, motivo });
          const nova = s.rdos.find((r) => r.retificaDe === rdoId);
          toast.show({ type: 'success', title: 'Retificação aberta', message: 'O autor foi notificado para corrigir e reenviar a nova versão.' });
          if (nova) navigation.replace('RdoDetail', { rdoId: nova.id });
        }
        return undefined;
      }
      case 'cancelar': {
        if (!(await exigeConexao('O cancelamento'))) return undefined;
        const motivo = await prompt({ destructive: true, title: 'Cancelar RDO', message: 'O cancelamento é lógico: o registro e o histórico são preservados, com o motivo informado.', placeholder: 'Motivo do cancelamento (obrigatório)', confirmLabel: 'Cancelar RDO' });
        if (motivo) {
          actions.cancelarRdo({ rdoId, userId: currentUser.id, motivo });
          toast.show({ type: 'info', title: 'RDO cancelado', message: 'Histórico preservado.' });
        }
        return undefined;
      }
      case 'excluir': {
        const ok = await confirm({ destructive: true, title: 'Excluir definitivamente?', message: 'Exceção permitida só para registros não assinados. A exclusão física não pode ser desfeita e fica registrada na auditoria geral.', confirmLabel: 'Continuar' });
        if (!ok) return undefined;
        const motivo = await prompt({ destructive: true, title: 'Motivo da exclusão', placeholder: 'Informe o motivo (obrigatório)', confirmLabel: 'Excluir' });
        if (motivo) {
          actions.excluirRdo({ rdoId, userId: currentUser.id, motivo });
          toast.show({ type: 'info', title: 'RDO excluído', message: 'Evento registrado na auditoria geral.' });
          navigation.goBack();
        }
        return undefined;
      }
      default:
        return undefined;
    }
  };

  const enviarComentario = ({ texto, contexto, contextoRef, visibilidade }) => {
    actions.comentarRdo({ rdoId, userId: currentUser.id, texto, contexto, contextoRef, visibilidade });
    setComentar(null);
    setTab('comentarios');
    toast.show({ type: 'success', title: 'Comentário registrado' });
  };

  const abrirFoto = (i) => setFotoIdx(i);
  const foto = fotoIdx != null ? rdo.fotos[fotoIdx] : null;

  const rodape =
    principal || secundaria ? (
      <View style={styles.rodape}>
        {secundaria ? <Button title={secundaria.label} icon={secundaria.icone} variant="secondary" onPress={() => executar(secundaria.key)} style={{ flex: 1 }} /> : null}
        {principal ? <Button title={principal.label} icon={principal.icone} variant="accent" onPress={() => executar(principal.key)} style={{ flex: 1.4 }} /> : null}
      </View>
    ) : undefined;

  return (
    <Screen
      title={`RDO nº ${numeroFormatado(rdo)}${rdo.versao > 1 ? ` · v${rdo.versao}` : ''}`}
      subtitle={`${obra.nome} · ${nomeDiaCurto(rdo.data)}, ${formatDate(rdo.data)}`}
      back
      right={overflow.length ? <IconButton icon="dots-vertical" label="Mais ações" color={colors.white} onPress={() => setMais(true)} /> : undefined}
      footer={rodape}
    >
      <View style={styles.resumo}>
        <StatusBadge status={rdo.status} />
        <Txt v="small" muted style={{ flex: 1, textAlign: 'right' }} numberOfLines={2}>
          {nomeDe(rdo.autorId)}
          {rdo.submetidoEm ? ` · enviado ${tempoRelativo(rdo.submetidoEm, now)}` : ' · em preenchimento'}
        </Txt>
      </View>

      <Card>
        <WorkflowTimeline rdo={rdo} />
      </Card>

      {rdo.sync?.pendente ? <Banner tone="warning" icon="cloud-off-outline" title="Aguardando sincronização" message="Este RDO foi enviado sem conexão e será entregue ao master automaticamente quando a rede voltar." /> : null}
      {rdo.status === STATUS.DEVOLVIDO && rdo.devolucao ? (
        <Banner tone="warning" icon="undo-variant" title={`Devolvido por ${nomeDe(rdo.devolucao.por)} — corrigir até ${formatDateTime(rdo.devolucao.prazo)}`} message={rdo.devolucao.motivo} />
      ) : null}
      {rdo.esclarecimentoPendente ? (
        <Banner
          tone="info"
          icon="help-circle-outline"
          title={master ? 'O cliente solicitou esclarecimento' : 'Esclarecimento solicitado'}
          message={master ? 'Responda em Comentários; a resposta fica visível ao cliente e libera a assinatura.' : 'Sua dúvida foi enviada ao responsável técnico. Você será avisado quando houver resposta.'}
          actionLabel={master ? 'Ver e responder' : undefined}
          onAction={() => setTab('comentarios')}
        />
      ) : null}
      {estaBloqueado(rdo) && ![STATUS.RETIFICADO, STATUS.CANCELADO].includes(rdo.status) ? (
        <Banner tone="gold" icon="lock-check-outline" title="Conteúdo bloqueado" message="Após a assinatura do master o conteúdo não pode ser alterado. Correções geram retificação vinculada, preservando esta versão." />
      ) : null}
      {rdo.status === STATUS.RETIFICADO && vigente ? (
        <Banner tone="warning" icon="file-restore-outline" title="Versão substituída" message={`Retificada pela versão ${vigente.versao}.`} actionLabel="Abrir versão vigente" onAction={() => navigation.push('RdoDetail', { rdoId: vigente.id })} />
      ) : null}
      {rdo.status === STATUS.CANCELADO && rdo.cancelamento ? (
        <Banner tone="danger" icon="file-cancel-outline" title={`Cancelado por ${nomeDe(rdo.cancelamento.por)} em ${formatDateTime(rdo.cancelamento.em)}`} message={rdo.cancelamento.motivo} />
      ) : null}
      {original ? (
        <Banner tone="info" icon="file-restore-outline" title={`Retificação da versão ${original.versao}`} message={rdo.motivoRetificacao} actionLabel="Ver versão original" onAction={() => navigation.push('RdoDetail', { rdoId: original.id })} />
      ) : null}

      <SegmentedTabs
        items={[
          { key: 'conteudo', label: 'Conteúdo', icon: 'file-document-outline' },
          { key: 'comentarios', label: 'Comentários', count: comentarios.length },
          { key: 'historico', label: 'Histórico', icon: 'history' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'conteudo' ? (
        <>
          <RdoSections
            rdo={rdo}
            obra={obra}
            rdos={state.rdos}
            nomeDe={nomeDe}
            comentarios={comentarios}
            onComentarSecao={podeComentar ? (chave) => setComentar({ contexto: chave }) : undefined}
            onAbrirFoto={abrirFoto}
            onVerAssinatura={(quem) => navigation.navigate('Receipt', { rdoId, quem })}
          />
          {versoes.length > 1 ? (
            <Card style={{ gap: 4 }}>
              <Txt v="label" color={colors.navy600}>
                VERSÕES DESTE RDO
              </Txt>
              {versoes.map((v) => (
                <ListRow
                  key={v.id}
                  icon="file-restore-outline"
                  title={`Versão ${v.versao}${v.id === rdo.id ? ' (esta)' : ''}`}
                  subtitle={v.motivoRetificacao || 'Versão original'}
                  badge={<StatusBadge status={v.status} size="sm" />}
                  chevron={false}
                  onPress={v.id === rdo.id ? undefined : () => navigation.push('RdoDetail', { rdoId: v.id })}
                />
              ))}
            </Card>
          ) : null}
        </>
      ) : null}

      {tab === 'comentarios' ? (
        <>
          {comentarios.length ? (
            comentarios.map((c) => <CommentItem key={c.id} comentario={c} nome={nomeDe(c.autorId)} fotos={rdo.fotos} />)
          ) : (
            <EmptyState icon="comment-outline" title="Sem comentários" message={podeComentar ? 'Comente uma seção específica pelo ícone de balão ou use o botão abaixo.' : 'Ainda não há comentários neste RDO.'} />
          )}
          {podeComentar ? <Button title="Novo comentário" icon="comment-plus-outline" variant="tonal" onPress={() => setComentar({ contexto: 'geral' })} /> : null}
        </>
      ) : null}

      {tab === 'historico' ? (
        <>
          <Banner tone="neutral" icon="shield-lock-outline" message="Trilha de auditoria somente leitura: criação, visualização, alteração, comentário, assinatura, envio e cancelamento." />
          <Card>
            {historico.map((a, i) => (
              <AuditItem key={a.id} evento={a} nome={nomeDe(a.usuarioId)} papel={perfilUsuario(state, a.usuarioId)} ultimo={i === historico.length - 1} />
            ))}
          </Card>
        </>
      ) : null}

      <ComentarSheet
        visible={!!comentar}
        onClose={() => setComentar(null)}
        inicial={comentar}
        fotos={rdo.fotos}
        podeCliente={master && (rdo.status === STATUS.ENVIADO_CLIENTE || rdo.status === STATUS.FINALIZADO)}
        respondendo={master && rdo.esclarecimentoPendente}
        onEnviar={enviarComentario}
      />
      <DevolverSheet
        visible={devolver}
        onClose={() => setDevolver(false)}
        comentariosNestaAnalise={rdo.comentarios.filter((c) => c.papel === PERFIL.MASTER && c.tipo === 'comentario' && rdo.auditoria.some((a) => a.evento === 'analise_iniciada')).length}
        onConfirmar={({ motivo, prazo }) => {
          actions.devolverRdo({ rdoId, userId: currentUser.id, motivo, prazo });
          setDevolver(false);
          toast.show({ type: 'success', title: 'RDO devolvido', message: 'O operacional foi notificado com o motivo e o prazo.' });
          navigation.goBack();
        }}
      />
      <EnviarClienteSheet
        visible={enviar}
        onClose={() => setEnviar(false)}
        clientes={clientesDaObra}
        onConfirmar={(canais) => {
          actions.enviarAoCliente({ rdoId, userId: currentUser.id, canais });
          setEnviar(false);
          const falhou = getState().notifications.some((n) => n.tipo === 'falha_entrega' && n.rdoId === rdoId && !n.resolvida && n.dataHora >= now);
          toast.show(falhou ? { type: 'warning', title: 'Enviado com falha de e-mail', message: 'Push entregue. Veja em Avisos para reenviar o e-mail.' } : { type: 'success', title: 'Enviado ao cliente', message: 'Push e e-mail simulados entregues.' });
        }}
      />
      {foto ? (
        <PhotoViewer
          fotos={rdo.fotos}
          indice={fotoIdx}
          onIndice={setFotoIdx}
          onClose={() => setFotoIdx(null)}
          nomeAutor={nomeDe}
          vinculoRotulo={(f) => (f.vinculo?.tipo === 'ocorrencia' ? rdo.ocorrencias.find((o) => o.id === f.vinculo.id)?.codigo : f.vinculo?.tipo === 'atividade' ? rdo.atividades.find((a) => a.id === f.vinculo.id)?.servico : null)}
          onComentar={podeComentar ? (f) => { setFotoIdx(null); setComentar({ contexto: 'fotos', contextoRef: f.id }); } : undefined}
        />
      ) : null}

      <BottomSheet visible={mais} onClose={() => setMais(false)} title="Mais ações">
        <View>
          {overflow.map((a) => (
            <ListRow key={a.key} icon={a.icone} title={a.label} danger={a.tipo === 'danger'} onPress={() => executar(a.key)} />
          ))}
        </View>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  resumo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rodape: { flexDirection: 'row', gap: 10 },
});
