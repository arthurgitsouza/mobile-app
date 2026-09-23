import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../../../theme';
import { PASSOS_RDO } from '../../../constants';
import { DECLARACAO_OPERACIONAL } from '../../../constants/texts';
import { resumoEquipamentos, totalHomemHora, totalTrabalhadores } from '../../../domain/rdo';
import { formatNumber, contar } from '../../../utils/format';
import { nowISO } from '../../../utils/date';
import { haptic } from '../../../utils/feedback';
import { useApp } from '../../../store/AppContext';
import { Banner, Button, Card, Icon, ListRow, SectionTitle, Txt, useUI } from '../../../components/ui';
import CheckboxField from '../../../components/form/CheckboxField';
import { SignaturePad } from '../../../components/rdo';
import SubmitProgress from './SubmitProgress';

function Numero({ icone, valor, rotulo }) {
  return (
    <View style={styles.num}>
      <Icon name={icone} size={20} color={colors.navy600} />
      <Txt v="h2">{valor}</Txt>
      <Txt v="caption" muted numberOfLines={1}>
        {rotulo}
      </Txt>
    </View>
  );
}

// Grupo M — Revisão antes do envio: validações, resumo, declaração de responsabilidade e assinatura do responsável.
export default function StepRevisao({ rdo, update, obra, validacao, irPara, definirRodape, bloquearRolagem, navigation, salvar }) {
  const { actions, online, currentUser } = useApp();
  const { confirm, toast } = useUI();
  const [enviando, setEnviando] = useState(false);
  const eq = resumoEquipamentos(rdo);
  const { valido, erros, avisos } = validacao;
  const nomeDe = (chave) => PASSOS_RDO.find((p) => p.key === chave);
  const agrupar = (lista) => lista.reduce((acc, e) => ({ ...acc, [e.passo]: [...(acc[e.passo] || []), e] }), {});
  const errosPorPasso = agrupar(erros.filter((e) => e.passo !== 'revisao'));
  const errosRevisao = erros.filter((e) => e.passo === 'revisao');
  const avisosPorPasso = agrupar(avisos);

  const enviar = async () => {
    const ok = await confirm({
      icon: 'send-check-outline',
      title: 'Enviar ao master?',
      message: online ? 'Depois do envio você só poderá editar se o master devolver o RDO para correção.' : 'Você está sem conexão: o RDO ficará salvo no aparelho e será enviado ao master automaticamente quando a rede voltar.',
      confirmLabel: 'Enviar',
    });
    if (!ok) return;
    salvar(false);
    setEnviando(true);
  };

  const concluir = () => {
    actions.salvarRdo({ rdo });
    actions.submeterRdo({ rdoId: rdo.id, userId: currentUser.id, online });
    setEnviando(false);
    haptic.success();
    toast.show(
      online
        ? { type: 'success', title: 'RDO enviado ao master', message: 'Notificação entregue (simulada). Você será avisado se houver devolução.' }
        : { type: 'info', icon: 'cloud-off-outline', title: 'Salvo no aparelho', message: 'Será enviado ao master quando a conexão voltar.' },
    );
    navigation.replace('RdoDetail', { rdoId: rdo.id });
  };

  // Rodapé fixo com as ações finais (o contêiner do formulário o renderiza no lugar de Voltar/Avançar).
  useEffect(() => {
    definirRodape(
      <View style={{ gap: 8 }}>
        {!valido ? (
          <Txt v="caption" color={colors.danger} style={{ textAlign: 'center', fontWeight: '700' }}>
            {contar(erros.length, 'pendência obrigatória', 'pendências obrigatórias')} impedem o envio.
          </Txt>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button title="Voltar" icon="chevron-left" variant="secondary" onPress={() => irPara('pendencias')} style={{ flex: 1 }} />
          <Button title="Enviar ao master" icon="send-check-outline" variant="accent" disabled={!valido} onPress={enviar} style={{ flex: 1.8 }} />
        </View>
      </View>,
    );
    return () => definirRodape(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valido, erros.length, online, rdo]);

  return (
    <View style={{ gap: 14 }}>
      {valido ? (
        <Banner tone="success" icon="check-decagram-outline" title="Tudo certo para enviar" message={avisos.length ? `${contar(avisos.length, 'aviso')} não bloqueiam o envio, mas vale conferir.` : 'Todas as validações obrigatórias foram atendidas.'} />
      ) : (
        <Banner tone="danger" icon="alert-circle-outline" title={`${contar(erros.length, 'pendência obrigatória', 'pendências obrigatórias')}`} message="Corrija os itens abaixo para liberar o envio ao master." />
      )}

      {Object.keys(errosPorPasso).length ? (
        <View style={{ gap: 4 }}>
          <SectionTitle>Pendências obrigatórias</SectionTitle>
          <Card padded={false} style={{ paddingHorizontal: 12 }}>
            {Object.entries(errosPorPasso).map(([chave, lista], i) => (
              <ListRow
                key={chave}
                icon={nomeDe(chave)?.icone}
                iconBg={colors.dangerBg}
                iconColor={colors.danger}
                title={`${nomeDe(chave)?.titulo} (${lista.length})`}
                subtitle={lista.slice(0, 3).map((e) => e.mensagem).join('\n')}
                onPress={() => irPara(chave)}
                style={i ? { borderTopWidth: 1, borderTopColor: colors.divider } : undefined}
                right={<Txt v="smallStrong" color={colors.blue500}>Corrigir</Txt>}
                chevron={false}
              />
            ))}
          </Card>
        </View>
      ) : null}

      {Object.keys(avisosPorPasso).length ? (
        <View style={{ gap: 4 }}>
          <SectionTitle>Avisos (não bloqueiam)</SectionTitle>
          <Card padded={false} style={{ paddingHorizontal: 12 }}>
            {Object.entries(avisosPorPasso).map(([chave, lista], i) => (
              <ListRow
                key={chave}
                icon="alert-outline"
                iconBg={colors.warningBg}
                iconColor={colors.warning}
                title={`${nomeDe(chave)?.titulo} (${lista.length})`}
                subtitle={lista.slice(0, 3).map((e) => e.mensagem).join('\n')}
                onPress={() => irPara(chave)}
                style={i ? { borderTopWidth: 1, borderTopColor: colors.divider } : undefined}
                right={<Txt v="smallStrong" color={colors.blue500}>Ver</Txt>}
                chevron={false}
              />
            ))}
          </Card>
        </View>
      ) : null}

      <SectionTitle>Resumo do dia</SectionTitle>
      <View style={styles.resumo}>
        <Numero icone="account-group-outline" valor={totalTrabalhadores(rdo)} rotulo="Efetivo" />
        <Numero icone="clock-outline" valor={formatNumber(totalHomemHora(rdo), 0)} rotulo="Homem-hora" />
        <Numero icone="excavator" valor={eq.unidades} rotulo="Equipamentos" />
        <Numero icone="hammer-wrench" valor={rdo.atividades.length} rotulo="Atividades" />
        <Numero icone="camera-outline" valor={rdo.fotos.length} rotulo="Fotos" />
        <Numero icone="alert-octagon-outline" valor={rdo.ocorrencias.length} rotulo="Ocorrências" />
      </View>
      <Button
        title="Pré-visualizar o PDF (minuta)"
        icon="file-pdf-box"
        variant="secondary"
        onPress={() => {
          salvar(true);
          navigation.navigate('PdfViewer', { rdoId: rdo.id });
        }}
      />

      <SectionTitle>Declaração de responsabilidade</SectionTitle>
      <CheckboxField
        label="Declaro que as informações são verdadeiras"
        description={DECLARACAO_OPERACIONAL}
        required
        value={rdo.declaracao.aceita}
        onValueChange={(aceita) => update({ declaracao: { aceita, dataHora: aceita ? nowISO() : null } })}
        error={errosRevisao.find((e) => e.campo === 'declaracao')?.mensagem}
      />

      {obra.exigeAssinaturaOperacional ? (
        <View style={{ gap: 8 }}>
          <SectionTitle>Assinatura do responsável pelo preenchimento</SectionTitle>
          <Txt v="small" muted>
            Esta obra exige a assinatura do operacional. O desenho é apenas a representação visual; a validade decorre da sessão autenticada e da trilha de auditoria.
          </Txt>
          <SignaturePad
            value={rdo.assinaturaOperacional}
            onDrawingChange={bloquearRolagem}
            onChange={(dados) =>
              update({ assinaturaOperacional: dados ? { usuarioId: currentUser.id, nome: currentUser.nome, dataHora: nowISO(), ...dados } : null })
            }
          />
          {errosRevisao.find((e) => e.campo === 'assinatura') ? (
            <Txt v="caption" color={colors.danger}>
              {errosRevisao.find((e) => e.campo === 'assinatura').mensagem}
            </Txt>
          ) : null}
        </View>
      ) : null}

      {!online ? <Banner tone="warning" icon="cloud-off-outline" message="Você está offline. Ao enviar, o RDO fica salvo no aparelho e é entregue ao master quando a conexão voltar." /> : null}

      <SubmitProgress visible={enviando} fotos={rdo.fotos} online={online} onConcluir={concluir} />
    </View>
  );
}

const styles = StyleSheet.create({
  resumo: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  num: {
    width: '31%', flexGrow: 1, alignItems: 'center', gap: 2, paddingVertical: 12, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
});
