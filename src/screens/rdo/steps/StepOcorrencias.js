import React from 'react';
import { View } from 'react-native';
import { colors } from '../../../theme';
import { formatDate, timeToMinutes } from '../../../utils/date';
import { ItemListEditor } from '../../../components/form';
import { SectionTitle } from '../../../components/ui';
import { alertaDoItem, proximoCodigoOcorrencia } from './helpers';

const CAMPOS_OCORRENCIA = [
  { key: 'codigo', type: 'readonly', label: 'Código (automático)' },
  { key: 'fato', label: 'Fato', type: 'textarea', required: true, placeholder: 'Ex.: Interferência hidráulica não indicada no projeto, identificada no eixo C/4.', help: 'Descreva o fato de forma objetiva: o quê, onde e quando.' },
  { key: 'horario', label: 'Horário', type: 'time', required: true, half: true },
  { key: 'local', label: 'Local', type: 'select', options: (v, ctx) => ctx.catalogos.frentes, allowCustom: true, half: true, placeholder: 'Ex.: Eixo C/4' },
  { key: 'partes', label: 'Partes envolvidas', type: 'text', placeholder: 'Ex.: Encarregado e Engenharia' },
  { key: 'impactoPrazo', label: 'Impacta o prazo', type: 'switch' },
  { key: 'impactoCusto', label: 'Impacta o custo', type: 'switch' },
  { key: 'impactoQualidade', label: 'Impacta a qualidade', type: 'switch' },
  { key: 'acaoImediata', label: 'Ação imediata', type: 'textarea', placeholder: 'Ex.: Área isolada; solicitada orientação ao projetista.' },
  { key: 'responsavel', label: 'Responsável pela providência', type: 'text', autoCapitalize: 'words' },
  { key: 'prazo', label: 'Prazo da providência (opcional)', type: 'date' },
];

const CAMPOS_VISITA = [
  { key: 'visitante', label: 'Visitante', type: 'text', required: true, autoCapitalize: 'words' },
  { key: 'empresaCargo', label: 'Empresa / cargo', type: 'text', placeholder: 'Ex.: Grupo Horizonte — Gerente de Projetos' },
  { key: 'entrada', label: 'Entrada', type: 'time', half: true },
  { key: 'saida', label: 'Saída', type: 'time', half: true },
  { key: 'motivo', label: 'Motivo da visita', type: 'textarea', required: true },
  { key: 'orientacao', label: 'Orientação / decisão', type: 'textarea', help: 'Instruções recebidas e decisões tomadas durante a visita.' },
  { key: 'atendidoPor', label: 'Atendido por', type: 'text', autoCapitalize: 'words' },
];

// Grupos I e J — Ocorrências e comunicações; visitas e orientações.
export default function StepOcorrencias({ rdo, update, ctx, validacao, mostrarErros }) {
  const contexto = { ...ctx, validacao, mostrarErros };
  const setSem = (chave) => (v) => update((d) => ({ semRegistro: { ...d.semRegistro, [chave]: v } }));
  return (
    <View style={{ gap: 20 }}>
      <View style={{ gap: 10 }}>
        <SectionTitle>Ocorrências e comunicações</SectionTitle>
        <ItemListEditor
          items={rdo.ocorrencias}
          onChange={(ocorrencias) => update({ ocorrencias })}
          fields={CAMPOS_OCORRENCIA}
          ctx={contexto}
          tituloItem="Ocorrência"
          rotuloAdicionar="Registrar ocorrência"
          semRegistro={{ value: rdo.semRegistro.ocorrencias, onChange: setSem('ocorrencias'), label: 'Sem ocorrências neste dia', descricao: 'Nenhum fato relevante, interferência ou impedimento.' }}
          novoItem={() => ({ codigo: proximoCodigoOcorrencia(rdo.ocorrencias), fato: '', horario: '', local: '', partes: '', impactoPrazo: false, impactoCusto: false, impactoQualidade: false, acaoImediata: '', responsavel: '', prazo: '', observacao: '' })}
          validar={(item) => ({ horario: timeToMinutes(item.horario) === null ? 'Informe o horário no formato HH:MM.' : undefined })}
          resumo={(item, i, c) => ({
            icone: 'alert-octagon-outline',
            titulo: `${item.codigo} · ${item.horario || '--:--'}${item.local ? ` · ${item.local}` : ''}`,
            subtitulo: item.fato,
            chips: [
              item.impactoPrazo && { label: 'Prazo', color: colors.warning, bg: colors.warningBg },
              item.impactoCusto && { label: 'Custo', color: colors.warning, bg: colors.warningBg },
              item.impactoQualidade && { label: 'Qualidade', color: colors.warning, bg: colors.warningBg },
              item.prazo && { label: `Providência até ${formatDate(item.prazo)}`, color: colors.navy700, bg: colors.blue100 },
            ].filter(Boolean),
            alerta: alertaDoItem(c, item.id),
          })}
        />
      </View>

      <View style={{ gap: 10 }}>
        <SectionTitle>Visitas e orientações</SectionTitle>
        <ItemListEditor
          items={rdo.visitas}
          onChange={(visitas) => update({ visitas })}
          fields={CAMPOS_VISITA}
          ctx={contexto}
          tituloItem="Visita"
          rotuloAdicionar="Registrar visita"
          semRegistro={{ value: rdo.semRegistro.visitas, onChange: setSem('visitas'), label: 'Sem visitas neste dia', descricao: 'Nenhuma visita ou orientação externa recebida.' }}
          novoItem={() => ({ visitante: '', empresaCargo: '', entrada: '', saida: '', motivo: '', orientacao: '', atendidoPor: '' })}
          resumo={(item, i, c) => ({
            icone: 'account-eye-outline',
            titulo: item.visitante || 'Visitante',
            subtitulo: [item.empresaCargo, item.entrada && `${item.entrada}–${item.saida || '…'}`, item.motivo].filter(Boolean).join(' · '),
            alerta: alertaDoItem(c, item.id),
          })}
        />
      </View>
    </View>
  );
}
