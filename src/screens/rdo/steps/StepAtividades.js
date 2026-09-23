import React from 'react';
import { View } from 'react-native';
import { colors } from '../../../theme';
import { SITUACOES_ATIVIDADE, rotuloDe } from '../../../constants';
import { acumuladoAnterior } from '../../../domain/rdo';
import { formatQuantidade, isFilled, isValidNumber, toNumber } from '../../../utils/format';
import { Banner } from '../../../components/ui';
import { ItemListEditor, SwitchField, TextField } from '../../../components/form';
import { alertaDoItem, msgErro } from './helpers';

const CAMPOS = [
  { key: 'frente', label: 'Frente / local', type: 'select', options: (v, ctx) => ctx.catalogos.frentes, allowCustom: true, placeholder: 'Ex.: Pavimento térreo, eixos B–D' },
  { key: 'servico', label: 'Serviço', type: 'select', options: (v, ctx) => ctx.catalogos.servicos.map((s) => s.nome), allowCustom: true, required: true },
  { key: 'descricao', label: 'Descrição', type: 'textarea', placeholder: 'Ex.: Execução de alvenaria de vedação no pavimento térreo, eixos B–D.' },
  { key: 'quantidadeDia', label: 'Quantidade executada no dia', type: 'number', required: true, suffix: (v) => v.unidade || '', help: 'Serviço + unidade + quantidade permitem comparar produção e planejamento.' },
  { key: 'unidade', label: 'Unidade', type: 'select', options: (v, ctx) => ctx.catalogos.unidades, allowCustom: true, required: true },
  {
    key: 'acumulado', type: 'readonly', label: 'Acumulado (anterior + do dia)',
    readOnlyText: (v, ctx) => (v.servico ? `${formatQuantidade(acumuladoAnterior(ctx.rdos, ctx.rdo.obraId, v.servico, ctx.rdo.data, ctx.rdo.id) + toNumber(v.quantidadeDia))} ${v.unidade || ''}` : '—'),
  },
  { key: 'referenciaEAP', label: 'Referência EAP / cronograma', type: 'text', half: true, placeholder: 'Ex.: 3.2' },
  { key: 'percentual', label: '% do serviço', type: 'number', suffix: '%', half: true, placeholder: '0–100' },
  { key: 'situacao', label: 'Situação', type: 'chips', options: SITUACOES_ATIVIDADE },
  { key: 'observacao', label: 'Observações', type: 'textarea' },
];

// Grupo E — Atividades: local, serviço, unidade, quantidade do dia, acumulado, EAP, percentual e situação.
export default function StepAtividades({ rdo, update, ctx, validacao, mostrarErros, erros }) {
  const contexto = { ...ctx, rdo, validacao, mostrarErros };
  const sp = rdo.semProducao;
  return (
    <View style={{ gap: 14 }}>
      {rdo.reaproveitadoDe ? <Banner tone="info" icon="content-copy" message="Atividades copiadas do RDO anterior sem quantidades: informe o que foi executado hoje." /> : null}

      <SwitchField
        label="Dia sem produção"
        description="Marque se nenhuma atividade foi executada e justifique (ex.: chuva forte, feriado, paralisação)."
        value={sp.ativo}
        onValueChange={(ativo) => update((d) => ({ semProducao: { ...d.semProducao, ativo } }))}
        tone="gold"
      />
      {sp.ativo ? (
        <TextField
          label="Justificativa do dia sem produção"
          required
          multiline
          value={sp.justificativa}
          onChangeText={(t) => update((d) => ({ semProducao: { ...d.semProducao, justificativa: t } }))}
          error={msgErro(erros, 'justificativa', mostrarErros)}
          placeholder="Descreva o motivo com fatos objetivos."
        />
      ) : null}

      {!sp.ativo || rdo.atividades.length ? (
        <ItemListEditor
          items={rdo.atividades}
          onChange={(atividades) => update({ atividades })}
          fields={CAMPOS}
          ctx={contexto}
          tituloItem="Atividade"
          rotuloAdicionar="Adicionar atividade"
          vazio={{ icone: 'hammer-wrench', titulo: 'Nenhuma atividade registrada', mensagem: 'Descreva o que foi executado hoje ou marque “Dia sem produção”.' }}
          novoItem={() => ({ frente: '', servico: '', descricao: '', unidade: '', quantidadeDia: '', referenciaEAP: '', percentual: '', situacao: 'em_andamento', observacao: '' })}
          onDraft={(item, key, value, c) => {
            if (key === 'servico' && !isFilled(item.unidade)) {
              const s = c.catalogos.servicos.find((x) => x.nome.toLowerCase() === String(value).toLowerCase());
              if (s) return { ...item, unidade: s.unidade };
            }
            return item;
          }}
          validar={(item) => ({
            quantidadeDia: !isValidNumber(item.quantidadeDia) ? 'Informe a quantidade executada no dia.' : undefined,
            percentual: isFilled(item.percentual) && !(toNumber(item.percentual) >= 0 && toNumber(item.percentual) <= 100) ? 'Percentual entre 0 e 100.' : undefined,
          })}
          resumo={(item, i, c) => ({
            icone: 'hammer-wrench',
            titulo: item.servico || 'Serviço',
            subtitulo: [item.frente, `${formatQuantidade(item.quantidadeDia)} ${item.unidade || ''} no dia`, item.percentual ? `${item.percentual}% do serviço` : null].filter(Boolean).join(' · '),
            chips: [{ label: rotuloDe(SITUACOES_ATIVIDADE, item.situacao), color: colors.navy700, bg: colors.blue100 }],
            alerta: alertaDoItem(c, item.id),
          })}
          erros={{ lista: msgErro(erros, 'lista', mostrarErros) }}
        />
      ) : null}
    </View>
  );
}
