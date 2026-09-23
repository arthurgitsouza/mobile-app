import React from 'react';
import { View } from 'react-native';
import { colors } from '../../../theme';
import { TIPOS_INCIDENTE, rotuloDe } from '../../../constants';
import { totalTrabalhadores } from '../../../domain/rdo';
import { Button, Card } from '../../../components/ui';
import { IntegerField, ItemListEditor, SwitchField, TextField } from '../../../components/form';
import { alertaDoItem } from './helpers';

const CAMPOS_INCIDENTE = [
  { key: 'tipo', label: 'Tipo', type: 'select', options: TIPOS_INCIDENTE, required: true },
  { key: 'descricao', label: 'Descrição do ocorrido', type: 'textarea', required: true, placeholder: 'O que aconteceu, onde e com quem (evite dados desnecessários — LGPD).' },
  { key: 'providencia', label: 'Providências tomadas', type: 'textarea' },
];

// Grupo H — Segurança e meio ambiente: DDS, EPI/EPC, permissões, inspeções, incidentes, resíduos e providências.
export default function StepSeguranca({ rdo, update, ctx, validacao, mostrarErros }) {
  const s = rdo.seguranca;
  const set = (patch) => update((d) => ({ seguranca: { ...d.seguranca, ...patch } }));
  const contexto = { ...ctx, validacao, mostrarErros };
  const efetivo = totalTrabalhadores(rdo);

  return (
    <View style={{ gap: 14 }}>
      <SwitchField label="DDS realizado" description="Diálogo Diário de Segurança com a equipe." value={s.dds.realizado} onValueChange={(v) => set({ dds: { ...s.dds, realizado: v } })} />
      {s.dds.realizado ? (
        <Card style={{ gap: 14 }}>
          <TextField label="Tema do DDS" value={s.dds.tema} onChangeText={(t) => set({ dds: { ...s.dds, tema: t } })} placeholder="Ex.: Trabalho em altura e uso de EPI" />
          <IntegerField label="Participantes" value={s.dds.participantes} onChangeText={(t) => set({ dds: { ...s.dds, participantes: t } })} placeholder="Nº de participantes" />
          {efetivo > 0 && s.dds.participantes !== String(efetivo) ? (
            <Button title={`Usar o efetivo total (${efetivo})`} variant="tonal" size="sm" full={false} icon="account-group-outline" onPress={() => set({ dds: { ...s.dds, participantes: String(efetivo) } })} />
          ) : null}
        </Card>
      ) : null}

      <SwitchField label="EPI/EPC conferidos" description="Capacetes, luvas, botas, guarda-corpos e proteções coletivas." value={s.epiEpc.conferidos} onValueChange={(v) => set({ epiEpc: { ...s.epiEpc, conferidos: v } })} />
      {s.epiEpc.conferidos ? <TextField label="Observações sobre EPI/EPC" value={s.epiEpc.observacao} onChangeText={(t) => set({ epiEpc: { ...s.epiEpc, observacao: t } })} multiline /> : null}

      <TextField label="Permissões de trabalho emitidas" value={s.permissoes} onChangeText={(t) => set({ permissoes: t })} multiline placeholder="Ex.: PT de trabalho em altura — fachada leste." />
      <TextField label="Inspeções de segurança" value={s.inspecoes} onChangeText={(t) => set({ inspecoes: t })} multiline placeholder="Ex.: Inspeção de rotina realizada pelo encarregado." />

      <SwitchField
        label="Sem acidentes, incidentes ou quase acidentes"
        description={s.incidentes.length ? 'Remova os incidentes abaixo para marcar esta opção.' : 'Confirme que o dia transcorreu sem ocorrências de segurança.'}
        value={s.semIncidentes}
        onValueChange={(v) => set({ semIncidentes: v })}
        disabled={s.incidentes.length > 0}
        tone="gold"
      />
      {!s.semIncidentes ? (
        <ItemListEditor
          items={s.incidentes}
          onChange={(incidentes) => set({ incidentes })}
          fields={CAMPOS_INCIDENTE}
          ctx={contexto}
          tituloItem="Incidente"
          rotuloAdicionar="Registrar incidente / quase acidente"
          novoItem={() => ({ tipo: 'quase_acidente', descricao: '', providencia: '' })}
          resumo={(item, i, c) => ({
            icone: 'alert-outline',
            titulo: rotuloDe(TIPOS_INCIDENTE, item.tipo),
            subtitulo: item.descricao,
            chips: [{ label: item.providencia ? 'Com providência' : 'Sem providência', color: item.providencia ? colors.success : colors.warning, bg: item.providencia ? colors.successBg : colors.warningBg }],
            alerta: alertaDoItem(c, item.id),
          })}
        />
      ) : null}

      <TextField label="Resíduos gerados e destinação" value={s.residuos} onChangeText={(t) => set({ residuos: t })} multiline placeholder="Ex.: Entulho de alvenaria — caçamba nº 3." />
      <TextField label="Condicionantes ambientais" value={s.condicionantes} onChangeText={(t) => set({ condicionantes: t })} multiline />
      <TextField label="Providências" value={s.providencias} onChangeText={(t) => set({ providencias: t })} multiline placeholder="Ex.: Área isolada e sinalizada." />
    </View>
  );
}
