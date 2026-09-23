import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import { PERFIL } from '../../constants';
import { useApp } from '../../store/AppContext';
import { normalizar } from '../../utils/format';
import { BottomSheet, Button, Card, EmptyState, Icon, IconButton, Screen, Txt, useUI } from '../../components/ui';
import { SearchBar, SelectField, TextField } from '../../components/form';
import { CATALOGOS } from './CadastrosScreen';

// Editor de uma lista da biblioteca (funções, equipamentos, serviços…). Serviços têm unidade padrão.
export default function CatalogScreen({ route, navigation }) {
  const { chave } = route.params;
  const meta = CATALOGOS[chave];
  const { state, actions, currentUser } = useApp();
  const { confirm, toast } = useUI();
  const lista = state.catalogos[chave];
  const servicos = chave === 'servicos';
  const [busca, setBusca] = useState('');
  const [edit, setEdit] = useState(null); // { indice, nome, unidade }

  const filtrados = useMemo(() => {
    const q = normalizar(busca);
    return lista.map((item, indice) => ({ item, indice })).filter(({ item }) => !q || normalizar(servicos ? item.nome : item).includes(q));
  }, [lista, busca, servicos]);

  if (!meta || currentUser.perfil !== PERFIL.MASTER) {
    return (
      <Screen title="Biblioteca" back>
        <EmptyState icon="lock-outline" title="Acesso restrito" />
      </Screen>
    );
  }

  const salvar = () => {
    const nome = edit.nome.trim();
    if (!nome) return setEdit({ ...edit, erro: 'Informe o nome.' });
    if (lista.some((x, i) => i !== edit.indice && normalizar(servicos ? x.nome : x) === normalizar(nome))) return setEdit({ ...edit, erro: 'Já existe um item com este nome.' });
    const novo = servicos ? { nome, unidade: edit.unidade || 'un' } : nome;
    const nova = edit.indice == null ? [...lista, novo] : lista.map((x, i) => (i === edit.indice ? novo : x));
    actions.salvarCatalogo({ chave, lista: nova });
    setEdit(null);
    toast.show({ type: 'success', title: 'Biblioteca atualizada' });
    return undefined;
  };

  const remover = async (indice) => {
    const ok = await confirm({ destructive: true, title: 'Remover item?', message: 'RDOs já registrados não são alterados; o item só deixa de aparecer nas sugestões.', confirmLabel: 'Remover' });
    if (ok) actions.salvarCatalogo({ chave, lista: lista.filter((_, i) => i !== indice) });
  };

  return (
    <Screen
      title={meta.titulo}
      subtitle={`${lista.length} itens`}
      back
      keyboard
      right={<IconButton icon="plus-circle-outline" label="Adicionar item" color={colors.white} onPress={() => setEdit({ indice: null, nome: '', unidade: servicos ? 'm²' : '' })} />}
      headerExtra={<SearchBar onDark value={busca} onChangeText={setBusca} placeholder="Buscar" style={{ marginTop: 8 }} />}
    >
      <Txt v="small" muted>
        {meta.desc}. Estes itens aparecem como sugestões nos formulários do RDO. Valores digitados livremente pelo operacional valem só para aquele registro: o Master decide o que entra na biblioteca.
      </Txt>
      {filtrados.length === 0 ? <EmptyState icon={meta.icone} title="Nenhum item" message="Toque em + para adicionar." /> : null}
      {filtrados.map(({ item, indice }) => (
        <Card key={`${indice}-${servicos ? item.nome : item}`} onPress={() => setEdit({ indice, nome: servicos ? item.nome : item, unidade: servicos ? item.unidade : '' })} style={styles.linha} padded={false}>
          <View style={styles.conteudo}>
            <Icon name={meta.icone} size={20} color={colors.navy600} />
            <Txt v="body" style={{ flex: 1 }} numberOfLines={2}>
              {servicos ? item.nome : item}
            </Txt>
            {servicos ? (
              <Txt v="smallStrong" muted>
                {item.unidade}
              </Txt>
            ) : null}
            <IconButton icon="trash-can-outline" label={`Remover ${servicos ? item.nome : item}`} color={colors.danger} onPress={() => remover(indice)} size={22} />
          </View>
        </Card>
      ))}
      <Button title="Adicionar item" icon="plus" variant="tonal" onPress={() => setEdit({ indice: null, nome: '', unidade: servicos ? 'm²' : '' })} />

      <BottomSheet
        visible={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.indice == null ? 'Novo item' : 'Editar item'}
        footer={
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title="Cancelar" variant="secondary" onPress={() => setEdit(null)} style={{ flex: 1 }} />
            <Button title="Salvar" icon="check" onPress={salvar} style={{ flex: 1.3 }} />
          </View>
        }
      >
        {edit ? (
          <>
            <TextField label="Nome" required value={edit.nome} onChangeText={(t) => setEdit({ ...edit, nome: t, erro: undefined })} error={edit.erro} autoCapitalize="sentences" />
            {servicos ? <SelectField label="Unidade padrão" required value={edit.unidade} onChange={(u) => setEdit({ ...edit, unidade: u })} options={state.catalogos.unidades} allowCustom /> : null}
          </>
        ) : null}
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  linha: { paddingHorizontal: 12 },
  conteudo: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52 },
});
