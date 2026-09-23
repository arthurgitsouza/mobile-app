import React from 'react';
import { View } from 'react-native';
import { colors } from '../../../theme';
import { CONDICOES_EQUIPAMENTO, rotuloDe } from '../../../constants';
import { resumoEquipamentos } from '../../../domain/rdo';
import { formatHoras, formatQuantidade, isFilled, isValidNumber, toNumber } from '../../../utils/format';
import { Card, Txt } from '../../../components/ui';
import { ItemListEditor } from '../../../components/form';
import { alertaDoItem } from './helpers';

const parado = (v) => ['parado', 'manutencao'].includes(v.condicao) || toNumber(v.horasParadas) > 0;

const CAMPOS = [
  { key: 'tipo', label: 'Tipo de equipamento', type: 'select', options: (v, ctx) => ctx.catalogos.equipamentos, allowCustom: true, required: true },
  { key: 'identificacao', label: 'Identificação / patrimônio', type: 'text', placeholder: 'Ex.: BET-01', autoCapitalize: 'characters' },
  { key: 'quantidade', label: 'Quantidade', type: 'stepper', min: 1, max: 99, required: true },
  { key: 'horasDisponiveis', label: 'Horas disponíveis', type: 'number', suffix: 'h', half: true, required: true },
  { key: 'horasProdutivas', label: 'Horas produtivas', type: 'number', suffix: 'h', half: true, required: true },
  { key: 'horasParadas', label: 'Horas paradas', type: 'number', suffix: 'h', help: 'Calculadas (disponíveis − produtivas); ajuste se preciso. Parada exige motivo.' },
  { key: 'condicao', label: 'Condição', type: 'chips', options: CONDICOES_EQUIPAMENTO, required: true },
  { key: 'motivoParada', label: 'Motivo da parada', type: 'textarea', visible: parado, placeholder: 'Ex.: Chuva, quebra da correia, aguardando peça…' },
  { key: 'operador', label: 'Operador', type: 'text', autoCapitalize: 'words' },
  { key: 'observacao', label: 'Observações', type: 'textarea', placeholder: 'Ex.: 2 viagens de material de aterro.' },
];

// Grupo D — Equipamentos: tipo, patrimônio, quantidade, horas disponíveis/produtivas/paradas, motivo e condição.
export default function StepEquipamentos({ rdo, update, ctx, validacao, mostrarErros }) {
  const contexto = { ...ctx, validacao, mostrarErros };
  const r = resumoEquipamentos(rdo);
  return (
    <View style={{ gap: 14 }}>
      {rdo.equipamentos.length ? (
        <Card tone="soft" style={{ flexDirection: 'row', gap: 12 }}>
          {[['Unidades', r.unidades], ['Produtivas', formatHoras(r.horasProdutivas)], ['Paradas', formatHoras(r.horasParadas)]].map(([l, v]) => (
            <View key={l} style={{ flex: 1 }}>
              <Txt v="caption" muted>
                {l}
              </Txt>
              <Txt v="h2">{v}</Txt>
            </View>
          ))}
        </Card>
      ) : null}
      <ItemListEditor
        items={rdo.equipamentos}
        onChange={(equipamentos) => update({ equipamentos })}
        fields={CAMPOS}
        ctx={contexto}
        tituloItem="Equipamento"
        rotuloAdicionar="Adicionar equipamento"
        vazio={{ icone: 'excavator', titulo: 'Nenhum equipamento registrado', mensagem: 'Registre betoneiras, compactadores, caminhões e demais equipamentos usados no dia.' }}
        novoItem={() => ({ tipo: '', identificacao: '', quantidade: '1', horasDisponiveis: '8', horasProdutivas: '', horasParadas: '0', motivoParada: '', operador: '', condicao: 'operante', observacao: '' })}
        onDraft={(item, key) => {
          if ((key === 'horasDisponiveis' || key === 'horasProdutivas') && isValidNumber(item.horasDisponiveis) && isValidNumber(item.horasProdutivas)) {
            const paradas = Math.max(0, toNumber(item.horasDisponiveis) - toNumber(item.horasProdutivas));
            return { ...item, horasParadas: String(Math.round(paradas * 100) / 100).replace('.', ',') };
          }
          return item;
        }}
        validar={(item) => ({
          horasProdutivas: toNumber(item.horasProdutivas) + toNumber(item.horasParadas) > toNumber(item.horasDisponiveis) + 0.001 ? 'Produtivas + paradas excedem as horas disponíveis.' : undefined,
          motivoParada: parado(item) && !isFilled(item.motivoParada) ? 'Equipamento parado exige o motivo.' : undefined,
          horasParadas: parado(item) && !(toNumber(item.horasParadas) > 0) ? 'Equipamento parado exige a duração (horas paradas).' : undefined,
        })}
        resumo={(item, i, c) => ({
          icone: 'excavator',
          titulo: `${item.tipo || 'Equipamento'}${toNumber(item.quantidade) > 1 ? ` × ${item.quantidade}` : ''}`,
          subtitulo: `${item.identificacao ? `${item.identificacao} · ` : ''}Disp. ${formatQuantidade(item.horasDisponiveis)} h · Prod. ${formatQuantidade(item.horasProdutivas)} h · Paradas ${formatQuantidade(item.horasParadas)} h`,
          chips: [
            {
              label: rotuloDe(CONDICOES_EQUIPAMENTO, item.condicao),
              color: parado(item) ? colors.danger : item.condicao === 'operante' ? colors.success : colors.warning,
              bg: parado(item) ? colors.dangerBg : item.condicao === 'operante' ? colors.successBg : colors.warningBg,
            },
          ],
          alerta: alertaDoItem(c, item.id),
        })}
      />
    </View>
  );
}
