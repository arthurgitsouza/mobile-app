import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius } from '../../theme';
import { uid } from '../../utils/format';
import { haptic } from '../../utils/feedback';
import { Badge, BottomSheet, Button, Card, EmptyState, Icon, Txt, useUI } from '../ui';
import SchemaForm, { validarSchema } from './SchemaForm';
import { SwitchField } from './pickers';

/**
 * Lista editável de itens (mão de obra, equipamentos, atividades…): cartões + folha de edição.
 * - fields: schema do item.           - novoItem(): item inicial.
 * - resumo(item, i, ctx): { icone, titulo, subtitulo, chips: [{label, color, bg, icon}], alerta }.
 * - validar(item, ctx): { campo: mensagem } (regras além dos obrigatórios).
 * - onDraft(draft, key, value, ctx): devolve o rascunho ajustado (cálculos automáticos).
 * - semRegistro: { value, onChange, label, descricao } — marca explícita de "sem itens" (ex.: sem visitas).
 */
export default function ItemListEditor({
  items = [], onChange, fields, novoItem, resumo, validar, onDraft, ctx = {}, tituloItem = 'Item', rotuloAdicionar = 'Adicionar',
  vazio, semRegistro, max, erros = {}, rodape,
}) {
  const { confirm } = useUI();
  const [edit, setEdit] = useState(null); // { item, novo }
  const [errs, setErrs] = useState({});

  const abrir = (item, novo = false) => {
    setErrs({});
    setEdit({ item: { ...item }, novo });
  };

  const setCampo = (key, value) => {
    setEdit((e) => {
      let item = { ...e.item, [key]: value };
      if (onDraft) item = onDraft(item, key, value, ctx) || item;
      return { ...e, item };
    });
    if (errs[key]) setErrs((x) => ({ ...x, [key]: undefined }));
  };

  const salvar = () => {
    const todos = { ...validarSchema(fields, edit.item, ctx), ...(validar ? validar(edit.item, ctx) : {}) };
    const limpos = Object.fromEntries(Object.entries(todos).filter(([, v]) => v));
    if (Object.keys(limpos).length) {
      setErrs(limpos);
      haptic.warning();
      return;
    }
    const lista = edit.novo ? [...items, edit.item] : items.map((x) => (x.id === edit.item.id ? edit.item : x));
    onChange(lista);
    setEdit(null);
    haptic.tap();
  };

  const excluir = async (item) => {
    const ok = await confirm({ title: 'Excluir item?', message: 'O item será removido deste RDO.', confirmLabel: 'Excluir', destructive: true });
    if (ok) {
      onChange(items.filter((x) => x.id !== item.id));
      setEdit(null);
    }
  };

  const ocultarLista = semRegistro?.value;
  const podeAdicionar = !max || items.length < max;

  return (
    <View style={{ gap: 10 }}>
      {semRegistro ? (
        <SwitchField label={semRegistro.label} description={semRegistro.descricao} value={!!semRegistro.value} onValueChange={semRegistro.onChange} />
      ) : null}

      {ocultarLista ? null : (
        <>
          {items.length === 0 && vazio ? <EmptyState icon={vazio.icone} title={vazio.titulo} message={vazio.mensagem} /> : null}
          {items.map((item, i) => {
            const r = resumo(item, i, ctx);
            return (
              <Card key={item.id} onPress={() => abrir(item)} accessibilityLabel={`${r.titulo}. Toque para editar.`} style={styles.item}>
                <View style={styles.itemRow}>
                  {r.icone ? (
                    <View style={styles.itemIcon}>
                      <Icon name={r.icone} size={22} color={colors.navy600} />
                    </View>
                  ) : null}
                  <View style={{ flex: 1, gap: 3 }}>
                    <Txt v="bodyStrong" numberOfLines={2}>
                      {r.titulo}
                    </Txt>
                    {r.subtitulo ? (
                      <Txt v="small" muted numberOfLines={3}>
                        {r.subtitulo}
                      </Txt>
                    ) : null}
                    {r.chips?.length ? (
                      <View style={styles.chips}>
                        {r.chips.map((c, ci) => (
                          <Badge key={ci} label={c.label} color={c.color} bg={c.bg} icon={c.icon} size="sm" />
                        ))}
                      </View>
                    ) : null}
                    {r.alerta ? (
                      <View style={styles.alert}>
                        <Icon name="alert-circle-outline" size={14} color={colors.warning} />
                        <Txt v="caption" color={colors.warning} style={{ flex: 1 }}>
                          {r.alerta}
                        </Txt>
                      </View>
                    ) : null}
                  </View>
                  <Pressable onPress={() => excluir(item)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Excluir ${r.titulo}`} style={styles.del}>
                    <Icon name="trash-can-outline" size={22} color={colors.danger} />
                  </Pressable>
                </View>
              </Card>
            );
          })}
          {podeAdicionar ? <Button title={rotuloAdicionar} icon="plus" variant="tonal" onPress={() => abrir({ id: uid('it'), ...novoItem(ctx) }, true)} /> : null}
          {erros.lista ? (
            <View style={styles.alert}>
              <Icon name="alert-circle-outline" size={15} color={colors.danger} />
              <Txt v="caption" color={colors.danger} style={{ flex: 1 }}>
                {erros.lista}
              </Txt>
            </View>
          ) : null}
        </>
      )}
      {rodape}

      <BottomSheet
        visible={!!edit}
        onClose={() => setEdit(null)}
        title={edit ? `${edit.novo ? 'Novo' : 'Editar'} ${tituloItem.toLowerCase()}` : ''}
        fullHeight
        footer={
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title="Cancelar" variant="secondary" onPress={() => setEdit(null)} style={{ flex: 1 }} />
              <Button title={edit?.novo ? 'Adicionar' : 'Salvar'} icon="check" onPress={salvar} style={{ flex: 1.3 }} />
            </View>
            {edit && !edit.novo ? <Button title="Excluir item" variant="danger" size="sm" icon="trash-can-outline" onPress={() => excluir(edit.item)} /> : null}
          </View>
        }
      >
        {edit ? <SchemaForm fields={fields} values={edit.item} onChange={setCampo} errors={errs} ctx={ctx} /> : null}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { padding: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  itemIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.blue100, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  del: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
