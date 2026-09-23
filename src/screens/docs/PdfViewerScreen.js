import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors, radius } from '../../theme';
import { EVENTOS_PUBLICOS } from '../../constants';
import { useApp } from '../../store/AppContext';
import { hashCurto, payloadVerificacao, verificarIntegridade } from '../../domain/integridade';
import { numeroFormatado } from '../../domain/rdo';
import { nowISO } from '../../utils/date';
import { montarHtmlRdo, nomeArquivoPdf } from '../../utils/pdf';
import { compartilharPdf, fotosParaBase64, imprimir } from '../../services/arquivos';
import { Banner, Button, Card, EmptyState, Icon, Screen, SectionTitle, StatusBadge, Txt, useUI } from '../../components/ui';
import { AuditItem, QRCodeView, RdoSections } from '../../components/rdo';
import { nomeUsuario, perfilUsuario } from '../../domain/selectors';
import { podeVerRdo } from '../../domain/workflow';

// PDF e central de arquivos (seção 13): pré-visualização do documento + geração real do PDF (expo-print) e compartilhamento.
export default function PdfViewerScreen({ route, navigation }) {
  const { rdoId } = route.params;
  const { state, actions, currentUser } = useApp();
  const { notice, toast } = useUI();
  const [gerando, setGerando] = useState(null);
  const [check, setCheck] = useState(null);
  const rdo = state.rdos.find((r) => r.id === rdoId);
  const obra = rdo ? state.obras.find((o) => o.id === rdo.obraId) : null;

  if (!rdo || !obra || !podeVerRdo(rdo, currentUser, obra)) {
    return (
      <Screen title="PDF do RDO" back>
        <EmptyState icon="file-question-outline" title="Documento indisponível" actionLabel="Voltar" onAction={() => navigation.goBack()} />
      </Screen>
    );
  }

  const finalizado = rdo.status === 'finalizado';
  const nomeArquivo = nomeArquivoPdf(rdo, obra);
  const nomeDe = (id) => nomeUsuario(state, id);
  const hash = rdo.hashFinal || rdo.hashTecnico;
  // O cliente vê só os eventos públicos (seção 4); master/operacional veem a trilha completa (sem "visualizado").
  const trilha = [...rdo.auditoria]
    .filter((a) => a.evento !== 'visualizacao')
    .filter((a) => currentUser.perfil !== 'cliente' || EVENTOS_PUBLICOS.includes(a.evento))
    .sort((a, b) => (a.dataHora > b.dataHora ? 1 : -1));

  const gerar = async (modo) => {
    setGerando(modo);
    try {
      const fotosBase64 = await fotosParaBase64(rdo.fotos);
      const html = montarHtmlRdo({ rdo, obra, nomeDe, rdos: state.rdos, fotosBase64, geradoEm: nowISO() });
      if (modo === 'imprimir') await imprimir(html);
      else await compartilharPdf(html, nomeArquivo);
      actions.registrarPdf({ rdoId, userId: currentUser.id });
      toast.show({ type: 'success', title: modo === 'imprimir' ? 'Impressão iniciada' : 'PDF gerado', message: finalizado ? nomeArquivo : 'Minuta gerada (sem valor de assinatura completa).' });
    } catch (e) {
      await notice({ icon: 'file-alert-outline', title: 'Não foi possível gerar o PDF', message: 'Tente novamente. Se o problema persistir, verifique o espaço livre do aparelho.' });
    } finally {
      setGerando(null);
    }
  };

  const copiar = async () => {
    try {
      await Clipboard.setStringAsync(hash);
      toast.show({ type: 'success', title: 'Hash copiado' });
    } catch (e) {
      toast.show({ type: 'info', title: 'Hash', message: hash });
    }
  };

  return (
    <Screen title={finalizado ? 'PDF final' : 'PDF (minuta)'} subtitle={`RDO nº ${numeroFormatado(rdo)} · ${obra.nome}`} back>
      {!finalizado ? (
        <Banner tone="warning" icon="watermark" title="Minuta — sem valor de assinatura completa" message="O PDF oficial (com hash e QR de verificação) é gerado ao final do fluxo, depois da ciência/aceite do cliente." />
      ) : (
        <Banner tone="success" icon="check-decagram-outline" title="PDF final disponível" message="Documento com dados, fotos, comentários, assinaturas, datas e identificadores de verificação." />
      )}

      <Card style={styles.arquivo}>
        <View style={styles.pdfIcon}>
          <Icon name="file-pdf-box" size={38} color={colors.danger} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt v="bodyStrong" numberOfLines={2}>
            {nomeArquivo}
          </Txt>
          <Txt v="caption" muted>
            A4 · aprox. {Math.round(120 + rdo.fotos.length * 480)} KB
          </Txt>
          <StatusBadge status={rdo.status} size="sm" />
        </View>
      </Card>

      <View style={{ gap: 10 }}>
        <Button title={finalizado ? 'Compartilhar / salvar PDF' : 'Gerar minuta em PDF'} icon="share-variant-outline" onPress={() => gerar('compartilhar')} loading={gerando === 'compartilhar'} disabled={!!gerando} />
        <Button title="Imprimir" icon="printer-outline" variant="secondary" onPress={() => gerar('imprimir')} loading={gerando === 'imprimir'} disabled={!!gerando} />
      </View>

      {hash ? (
        <>
          <SectionTitle>Verificação de autenticidade</SectionTitle>
          <Card style={{ alignItems: 'center', gap: 10 }}>
            <QRCodeView value={payloadVerificacao(rdo)} size={140} />
            <Txt v="caption" muted style={{ textAlign: 'center' }}>
              Hash SHA-256 {rdo.hashFinal ? 'final (conteúdo + assinaturas)' : 'do conteúdo técnico'}
            </Txt>
            <Txt v="small" mono selectable style={{ textAlign: 'center' }}>
              {hash}
            </Txt>
            <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
              <Button title="Copiar hash" icon="content-copy" variant="secondary" size="sm" onPress={copiar} style={{ flex: 1 }} />
              <Button title="Verificar integridade" icon="shield-search" variant="tonal" size="sm" onPress={() => setCheck(verificarIntegridade(rdo))} style={{ flex: 1 }} />
            </View>
            {check ? (
              check.ok ? (
                <Banner tone="success" icon="shield-check" title="Documento íntegro" message={`Hash recalculado ${hashCurto(check.calculado, 12)} confere com a assinatura.`} style={{ alignSelf: 'stretch' }} />
              ) : (
                <Banner tone="danger" icon="shield-alert" title="Divergência detectada" message="O conteúdo não corresponde ao hash assinado." style={{ alignSelf: 'stretch' }} />
              )
            ) : null}
          </Card>
        </>
      ) : null}

      <SectionTitle>Pré-visualização do conteúdo</SectionTitle>
      <RdoSections rdo={rdo} obra={obra} rdos={state.rdos} nomeDe={nomeDe} comentarios={[]} onVerAssinatura={(quem) => navigation.navigate('Receipt', { rdoId, quem })} />

      {trilha.length ? (
        <>
          <SectionTitle>Trilha de aprovação</SectionTitle>
          <Card>
            {trilha.map((a, i) => (
              <AuditItem key={a.id} evento={a} nome={nomeDe(a.usuarioId)} papel={perfilUsuario(state, a.usuarioId)} ultimo={i === trilha.length - 1} />
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  arquivo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pdfIcon: { width: 60, height: 60, borderRadius: radius.md, backgroundColor: colors.dangerBg, alignItems: 'center', justifyContent: 'center' },
});
