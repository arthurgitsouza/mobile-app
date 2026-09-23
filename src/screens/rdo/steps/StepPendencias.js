import React from 'react';
import { View } from 'react-native';
import { colors, criticidadeMeta } from '../../../theme';
import { CRITICIDADES, ORIGENS_PENDENCIA, STATUS_PENDENCIA, rotuloDe } from '../../../constants';
import { formatDate } from '../../../utils/date';
import { ItemListEditor, TextField } from '../../../components/form';
import { SectionTitle } from '../../../components/ui';
import { alertaDoItem } from './helpers';

const CAMPOS = [
  { key: 'descricao', label: 'Pendência', type: 'textarea', required: true, placeholder: 'Ex.: Projetista deverá confirmar a solução da interferência hidráulica no eixo C/4.', help: 'Toda pendência precisa de dono e prazo — sem isso ela vira apenas uma anotação.' },
  { key: 'origem', label: 'Origem', type: 'select', options: ORIGENS_PENDENCIA, required: true },
  { key: 'responsavel', label: 'Responsável', type: 'text', required: true, autoCapitalize: 'words', placeholder: 'Ex.: Coordenação de Projetos' },
  { key: 'prazo', label: 'Prazo (data)', type: 'date', required: true, half: true },
  { key: 'prazoHora', label: 'Hora', type: 'time', half: true },
  { key: 'criticidade', label: 'Criticidade', type: 'chips', options: CRITICIDADES, required: true },
  { key: 'status', label: 'Status', type: 'chips', options: STATUS_PENDENCIA, required: true },
];

// Grupo L — Pendências (origem, responsável, prazo, criticidade, status) e planejamento do próximo dia.
export default function StepPendencias({ rdo, update, ctx, validacao, mostrarErros }) {
  const contexto = { ...ctx, validacao, mostrarErros };
  const setPlan = (patch) => update((d) => ({ planejamento: { ...d.planejamento, ...patch } }));
  return (
    <View style={{ gap: 20 }}>
      <View style={{ gap: 10 }}>
        <SectionTitle>Pendências</SectionTitle>
        <ItemListEditor
          items={rdo.pendencias}
          onChange={(pendencias) => update({ pendencias })}
          fields={CAMPOS}
          ctx={contexto}
          tituloItem="Pendência"
          rotuloAdicionar="Adicionar pendência"
          semRegistro={{ value: rdo.semRegistro.pendencias, onChange: (v) => update((d) => ({ semRegistro: { ...d.semRegistro, pendencias: v } })), label: 'Sem pendências neste dia', descricao: 'Nada aguardando ação de terceiros.' }}
          novoItem={() => ({ descricao: '', origem: 'execucao', responsavel: '', prazo: '', prazoHora: '', criticidade: 'media', status: 'aberta' })}
          resumo={(item, i, c) => {
            const m = criticidadeMeta[item.criticidade] || criticidadeMeta.media;
            return {
              icone: 'clipboard-list-outline',
              titulo: item.descricao || 'Pendência',
              subtitulo: `${rotuloDe(ORIGENS_PENDENCIA, item.origem)} · ${item.responsavel || 'sem responsável'} · prazo ${formatDate(item.prazo)}${item.prazoHora ? ` ${item.prazoHora}` : ''}`,
              chips: [
                { label: m.label, color: m.color, bg: m.bg },
                { label: rotuloDe(STATUS_PENDENCIA, item.status), color: item.status === 'resolvida' ? colors.success : colors.navy700, bg: item.status === 'resolvida' ? colors.successBg : colors.blue100 },
              ],
              alerta: alertaDoItem(c, item.id),
            };
          }}
        />
      </View>

      <View style={{ gap: 14 }}>
        <SectionTitle>Planejamento</SectionTitle>
        <TextField label="Atividades previstas para o próximo dia" value={rdo.planejamento.proximoDia} onChangeText={(t) => setPlan({ proximoDia: t })} multiline placeholder="Ex.: Prosseguir alvenaria dos eixos D–F e concretagem das sapatas restantes." />
        <TextField label="Restrições e impedimentos" value={rdo.planejamento.restricoes} onChangeText={(t) => setPlan({ restricoes: t })} multiline placeholder="Ex.: Definição do projetista para a interferência do eixo C/4." />
        <TextField label="Observações gerais" value={rdo.observacoesGerais} onChangeText={(t) => update({ observacoesGerais: t })} multiline />
      </View>
    </View>
  );
}
