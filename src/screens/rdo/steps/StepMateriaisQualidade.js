import React from 'react';
import { View } from 'react-native';
import { colors } from '../../../theme';
import { INSPECAO_MATERIAL, MOVIMENTO_MATERIAL, RESULTADOS_QUALIDADE, TIPOS_QUALIDADE, rotuloDe } from '../../../constants';
import { formatQuantidade, isValidNumber } from '../../../utils/format';
import { ItemListEditor } from '../../../components/form';
import { SectionTitle } from '../../../components/ui';
import { alertaDoItem } from './helpers';

const recebido = (v) => v.movimento === 'recebido';
const utilizado = (v) => v.movimento === 'utilizado';

const CAMPOS_MATERIAL = [
  { key: 'movimento', label: 'Movimento', type: 'chips', options: MOVIMENTO_MATERIAL, required: true },
  { key: 'material', label: 'Material', type: 'select', options: (v, ctx) => ctx.catalogos.materiais, allowCustom: true, required: true },
  { key: 'quantidade', label: 'Quantidade', type: 'number', half: true, required: true },
  { key: 'unidade', label: 'Unidade', type: 'select', options: (v, ctx) => ctx.catalogos.unidades, allowCustom: true, half: true, required: true },
  { key: 'fornecedor', label: 'Fornecedor', type: 'text', visible: recebido },
  { key: 'notaRomaneio', label: 'Nota / romaneio', type: 'text', half: true, visible: recebido },
  { key: 'lote', label: 'Lote', type: 'text', half: true, visible: recebido },
  { key: 'localAplicacao', label: 'Local de aplicação', type: 'select', options: (v, ctx) => ctx.catalogos.frentes, allowCustom: true, visible: utilizado },
  { key: 'inspecao', label: 'Inspeção / aceite', type: 'chips', options: INSPECAO_MATERIAL },
  { key: 'armazenamento', label: 'Armazenamento', type: 'text', placeholder: 'Ex.: Almoxarife, sobre pallets' },
];

const CAMPOS_QUALIDADE = [
  { key: 'tipo', label: 'Tipo', type: 'chips', options: TIPOS_QUALIDADE, required: true },
  { key: 'descricao', label: 'Descrição', type: 'textarea', required: true, placeholder: 'Ex.: Verificação de prumo e nível da alvenaria.' },
  { key: 'resultado', label: 'Resultado', type: 'chips', options: RESULTADOS_QUALIDADE, required: true },
  { key: 'documento', label: 'Documento associado', type: 'text', half: true, placeholder: 'Ex.: FVS-012' },
  { key: 'responsavel', label: 'Responsável', type: 'text', half: true, autoCapitalize: 'words' },
  { key: 'observacao', label: 'Observações', type: 'textarea' },
];

// Grupos F e G — Materiais e Qualidade (inspeções, ensaios, não conformidades, liberações).
export default function StepMateriaisQualidade({ rdo, update, ctx, validacao, mostrarErros }) {
  const contexto = { ...ctx, validacao, mostrarErros };
  const setSem = (chave) => (v) => update((d) => ({ semRegistro: { ...d.semRegistro, [chave]: v } }));
  return (
    <View style={{ gap: 20 }}>
      <View style={{ gap: 10 }}>
        <SectionTitle>Materiais recebidos e utilizados</SectionTitle>
        <ItemListEditor
          items={rdo.materiais}
          onChange={(materiais) => update({ materiais })}
          fields={CAMPOS_MATERIAL}
          ctx={contexto}
          tituloItem="Material"
          rotuloAdicionar="Adicionar material"
          semRegistro={{ value: rdo.semRegistro.materiais, onChange: setSem('materiais'), label: 'Sem materiais neste dia', descricao: 'Nada foi recebido nem utilizado.' }}
          novoItem={() => ({ movimento: 'utilizado', material: '', unidade: '', quantidade: '', fornecedor: '', notaRomaneio: '', lote: '', localAplicacao: '', inspecao: 'aceito', armazenamento: '' })}
          validar={(item) => ({ quantidade: !isValidNumber(item.quantidade) ? 'Informe a quantidade.' : undefined })}
          resumo={(item, i, c) => ({
            icone: item.movimento === 'recebido' ? 'truck-delivery-outline' : 'package-variant-closed',
            titulo: item.material || 'Material',
            subtitulo: `${formatQuantidade(item.quantidade)} ${item.unidade || ''}${item.notaRomaneio ? ` · ${item.notaRomaneio}` : ''}${item.localAplicacao ? ` · ${item.localAplicacao}` : ''}`,
            chips: [
              { label: rotuloDe(MOVIMENTO_MATERIAL, item.movimento), color: colors.info, bg: colors.infoBg },
              { label: rotuloDe(INSPECAO_MATERIAL, item.inspecao), color: item.inspecao === 'recusado' ? colors.danger : colors.navy700, bg: item.inspecao === 'recusado' ? colors.dangerBg : colors.blue100 },
            ],
            alerta: alertaDoItem(c, item.id),
          })}
        />
      </View>

      <View style={{ gap: 10 }}>
        <SectionTitle>Qualidade: inspeções, ensaios e não conformidades</SectionTitle>
        <ItemListEditor
          items={rdo.qualidade}
          onChange={(qualidade) => update({ qualidade })}
          fields={CAMPOS_QUALIDADE}
          ctx={contexto}
          tituloItem="Registro de qualidade"
          rotuloAdicionar="Adicionar registro"
          semRegistro={{ value: rdo.semRegistro.qualidade, onChange: setSem('qualidade'), label: 'Sem inspeções ou ensaios neste dia', descricao: 'Nenhum registro de qualidade a informar.' }}
          novoItem={() => ({ tipo: 'inspecao', descricao: '', resultado: 'conforme', documento: '', responsavel: '', observacao: '' })}
          resumo={(item, i, c) => ({
            icone: item.tipo === 'nao_conformidade' ? 'alert-decagram-outline' : 'clipboard-check-outline',
            titulo: rotuloDe(TIPOS_QUALIDADE, item.tipo),
            subtitulo: item.descricao,
            chips: [
              {
                label: rotuloDe(RESULTADOS_QUALIDADE, item.resultado),
                color: item.resultado === 'conforme' ? colors.success : item.resultado === 'nao_conforme' ? colors.danger : colors.warning,
                bg: item.resultado === 'conforme' ? colors.successBg : item.resultado === 'nao_conforme' ? colors.dangerBg : colors.warningBg,
              },
            ],
            alerta: alertaDoItem(c, item.id),
          })}
        />
      </View>
    </View>
  );
}
