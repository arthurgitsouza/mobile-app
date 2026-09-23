import React from 'react';
import { View } from 'react-native';
import { colors } from '../../../theme';
import { calcularHoras, totalHomemHora, totalTrabalhadores } from '../../../domain/rdo';
import { formatNumber, toNumber } from '../../../utils/format';
import { timeToMinutes } from '../../../utils/date';
import { Banner, Card, Txt } from '../../../components/ui';
import { ItemListEditor, TextField } from '../../../components/form';
import { alertaDoItem } from './helpers';

const CAMPOS = [
  { key: 'empresa', label: 'Empresa / equipe', type: 'select', options: (v, ctx) => ctx.catalogos.origensEmpresa, allowCustom: true, placeholder: 'Selecione a equipe' },
  { key: 'funcao', label: 'Função', type: 'select', options: (v, ctx) => ctx.catalogos.funcoes, allowCustom: true, required: true, help: 'Ex.: Pedreiro, Servente, Encarregado. Se não estiver na lista, digite a função.' },
  { key: 'quantidade', label: 'Quantidade de trabalhadores', type: 'stepper', required: true, min: 1, max: 500, help: 'O total do dia é calculado somando as funções (evita dupla contagem).' },
  { key: 'horaInicio', label: 'Início', type: 'time', half: true },
  { key: 'horaFim', label: 'Fim', type: 'time', half: true },
  { key: 'horas', label: 'Horas por trabalhador', type: 'number', required: true, suffix: 'h', help: 'Calculado pelo horário (1 h de intervalo em jornadas acima de 6 h). Ajuste se necessário.' },
  { key: 'observacao', label: 'Observações', type: 'textarea', placeholder: 'Ausências, mobilização, produtividade…' },
];

// Grupo C — Mão de obra por função, com total de efetivo e homem-hora calculado.
export default function StepMaoDeObra({ rdo, update, ctx, validacao, mostrarErros, erros }) {
  const contexto = { ...ctx, validacao, mostrarErros };
  const hh = totalHomemHora(rdo);
  return (
    <View style={{ gap: 14 }}>
      {rdo.reaproveitadoDe ? <Banner tone="info" icon="content-copy" message="Equipe copiada do RDO anterior. Ajuste presenças, ausências e horas do dia." /> : null}

      <Card tone="soft" style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ flex: 1 }}>
          <Txt v="caption" muted>
            Efetivo total
          </Txt>
          <Txt v="h1" accessibilityLabel={`${totalTrabalhadores(rdo)} trabalhadores`}>
            {totalTrabalhadores(rdo)}
          </Txt>
        </View>
        <View style={{ flex: 1 }}>
          <Txt v="caption" muted>
            Homem-hora
          </Txt>
          <Txt v="h1" accessibilityLabel={`${formatNumber(hh, 0)} homem-hora`}>
            {formatNumber(hh, 0)} <Txt v="small" muted>h</Txt>
          </Txt>
        </View>
      </Card>

      <ItemListEditor
        items={rdo.maoDeObra}
        onChange={(maoDeObra) => update({ maoDeObra })}
        fields={CAMPOS}
        ctx={contexto}
        tituloItem="Função"
        rotuloAdicionar="Adicionar função"
        vazio={{ icone: 'account-group-outline', titulo: 'Nenhuma função registrada', mensagem: 'Adicione as funções presentes no canteiro. Ex.: Pedreiro 4, Servente 6.' }}
        novoItem={() => ({ empresa: 'Equipe própria', funcao: '', quantidade: '1', horaInicio: '07:00', horaFim: '16:00', horas: '8', observacao: '' })}
        onDraft={(item, key) => {
          if (key === 'horaInicio' || key === 'horaFim') {
            if (timeToMinutes(item.horaInicio) !== null && timeToMinutes(item.horaFim) !== null) {
              const h = calcularHoras(item.horaInicio, item.horaFim);
              if (h) return { ...item, horas: h };
            }
          }
          return item;
        }}
        validar={(item) => ({
          quantidade: toNumber(item.quantidade) < 1 ? 'Informe ao menos 1 trabalhador.' : undefined,
          horas: !(toNumber(item.horas) > 0 && toNumber(item.horas) <= 24) ? 'Informe as horas (entre 0 e 24).' : undefined,
        })}
        resumo={(item, i, c) => ({
          icone: 'account-hard-hat',
          titulo: `${item.funcao || 'Função'} × ${item.quantidade}`,
          subtitulo: `${item.empresa || '—'} · ${item.horaInicio || '--:--'}–${item.horaFim || '--:--'} · ${item.horas || 0} h por pessoa`,
          chips: [{ label: `${formatNumber(toNumber(item.quantidade) * toNumber(item.horas), 0)} HH`, color: colors.navy700, bg: colors.blue100 }],
          alerta: alertaDoItem(c, item.id),
        })}
        erros={{ lista: erros.find((e) => e.campo === 'lista' && mostrarErros)?.mensagem }}
      />

      <TextField
        label="Observações sobre mobilização, ausência ou produtividade"
        value={rdo.observacaoMaoDeObra}
        onChangeText={(t) => update({ observacaoMaoDeObra: t })}
        multiline
        placeholder="Ex.: 2 serventes ausentes por atestado; equipe de alvenaria reforçada à tarde."
      />
    </View>
  );
}
