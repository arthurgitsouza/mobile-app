import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { colors } from '../../../../theme';
import { ROTULOS_CAMPOS } from '../../../../constants/rotulos';
import { conteudoTecnico } from '../../../../domain/rdo';
import { diffConteudo } from '../../../../utils/object';
import { useApp } from '../../../../store/AppContext';
import { haptic } from '../../../../utils/feedback';
import { Banner, Button, Card, Txt, useUI } from '../../../../components/ui';
import { TextField } from '../../../../components/form';
import { styles } from './styles';

// Edição pelo master (seção 9): justificativa obrigatória + registro antes/depois. Preferir devolver ao autor.
export default function StepJustificativa({ rdo, ctx, definirRodape, navigation }) {
  const { actions, currentUser } = useApp();
  const { toast } = useUI();
  const [justificativa, setJustificativa] = useState('');
  const alteracoes = useMemo(
    () => diffConteudo(conteudoTecnico(ctx.original), conteudoTecnico(rdo), ROTULOS_CAMPOS),
    [ctx.original, rdo],
  );
  const ok = alteracoes.length > 0 && justificativa.trim().length >= 10;

  const salvar = () => {
    actions.editarComoMaster({ rdoId: rdo.id, userId: currentUser.id, novo: rdo, justificativa, alteracoes });
    haptic.success();
    toast.show({
      type: 'success',
      title: 'Alterações registradas',
      message: 'Antes/depois e justificativa gravados na auditoria; o autor foi notificado.',
    });
    navigation.goBack();
  };

  useEffect(() => {
    definirRodape(
      <View style={styles.rowGap10}>
        <Button title="Cancelar" variant="secondary" onPress={() => navigation.goBack()} style={styles.flex1} />
        <Button
          title="Salvar alterações"
          icon="content-save-check-outline"
          variant="accent"
          disabled={!ok}
          onPress={salvar}
          style={styles.flex16}
        />
      </View>,
    );
    return () => definirRodape(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok, justificativa, alteracoes]);

  return (
    <View style={styles.gap14}>
      <Banner
        tone="warning"
        icon="lightbulb-on-outline"
        title="Prefira devolver ao autor"
        message="Quando a mudança for técnica (quantidades, horários, equipe), devolva o RDO ao operacional em vez de editar. Use a edição para ajustes pontuais."
      />
      <Card style={styles.gap8}>
        <Txt v="label" color={colors.navy600}>
          ALTERAÇÕES DETECTADAS ({alteracoes.length})
        </Txt>
        {alteracoes.length ? (
          alteracoes.slice(0, 30).map((a, i) => (
            <View key={i} style={styles.gap1}>
              <Txt v="smallStrong">{a.caminho}</Txt>
              <Txt v="caption" muted>
                {a.antes} → {a.depois}
              </Txt>
            </View>
          ))
        ) : (
          <Txt v="small" muted>
            Nenhuma alteração ainda. Volte às etapas anteriores e ajuste o que for necessário.
          </Txt>
        )}
        {alteracoes.length > 30 ? (
          <Txt v="caption" subtle>
            … e mais {alteracoes.length - 30} alterações.
          </Txt>
        ) : null}
      </Card>
      <TextField
        label="Justificativa da edição"
        required
        multiline
        value={justificativa}
        onChangeText={setJustificativa}
        placeholder="Explique por que os dados foram alterados (mín. 10 caracteres)."
        help="Fica registrada com o antes/depois e é enviada ao autor."
        error={justificativa && justificativa.trim().length < 10 ? 'Descreva com ao menos 10 caracteres.' : undefined}
      />
    </View>
  );
}
