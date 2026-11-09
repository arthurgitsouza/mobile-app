import React from 'react';
import { View } from 'react-native';
import { TURNOS } from '../../../../constants';
import { colors } from '../../../../theme';
import { FUSO_OBRA_LABEL, hojeObra, nomeDiaSemana } from '../../../../utils/date';
import { Banner, Card, KeyValue, Txt } from '../../../../components/ui';
import { ChipGroup, DateField, SwitchField, TextField } from '../../../../components/form';
import { numeroFormatado } from '../../../../domain/rdo';
import { msgErro } from '../helpers';
import { styles } from './styles';

// Grupo A — Identificação. Dados da obra vêm do cadastro (não editáveis aqui); data, turno e responsável são do dia.
export default function StepIdentificacao({ rdo, update, obra, erros, mostrarErros, validacao }) {
  const duplicado = validacao.avisos.find((a) => a.passo === 'identificacao' && /Já existe/.test(a.mensagem));
  const i = rdo.identificacao;
  const sp = rdo.semProducao;
  return (
    <View style={styles.gap14}>
      <SwitchField
        label="Não foi possível prosseguir com a atividade"
        description="Marque se uma emergência ou imprevisto impediu o trabalho hoje."
        value={!!sp.interrupcao}
        onValueChange={(interrupcao) =>
          update((d) => ({ semProducao: { ...d.semProducao, interrupcao, ativo: interrupcao } }))
        }
        tone="gold"
      />
      {sp.interrupcao ? (
        <TextField
          label="Justificativa da interrupção"
          required
          multiline
          value={sp.justificativa}
          onChangeText={(t) => update((d) => ({ semProducao: { ...d.semProducao, justificativa: t } }))}
          error={msgErro(erros, 'justificativaInterrupcao', mostrarErros)}
          placeholder="Descreva o motivo (mínimo 10 caracteres)."
        />
      ) : null}
      <Card style={styles.gap8}>
        <Txt v="label" color={colors.navy600}>
          DADOS DA OBRA (DO CADASTRO)
        </Txt>
        <KeyValue inline label="Número / versão" value={`${numeroFormatado(rdo)} · v${rdo.versao} (automático)`} />
        <KeyValue inline label="Obra" value={obra.nome} />
        <KeyValue inline label="Contrato / OS" value={[i.contrato, i.os].filter(Boolean).join(' · ')} />
        <KeyValue inline label="Cliente" value={i.cliente} />
        <KeyValue inline label="Empresa executora" value={i.empresa} />
        <KeyValue inline label="Endereço" value={i.endereco} />
        <KeyValue inline label="Engenheiro / RT" value={i.engenheiroRT} />
        <KeyValue inline label="Período contratual" value={i.periodoContratual} />
      </Card>

      <DateField
        label="Data do RDO"
        required
        value={rdo.data}
        max={hojeObra()}
        onChange={(data) => update({ data })}
        help="Datas futuras não são permitidas. Planejamento vai na etapa Pendências."
        error={msgErro(erros, 'data', mostrarErros)}
      />
      <KeyValue inline label="Dia da semana" value={nomeDiaSemana(rdo.data)} />
      {duplicado ? (
        <Banner tone="warning" icon="content-copy" title="Possível RDO duplicado" message={duplicado.mensagem} />
      ) : null}

      <ChipGroup
        label="Turno"
        required
        options={TURNOS}
        value={rdo.turno}
        onChange={(turno) => update({ turno })}
        error={msgErro(erros, 'turno', mostrarErros)}
      />
      <TextField
        label="Responsável pelo preenchimento"
        required
        value={i.responsavelPreenchimento}
        onChangeText={(t) => update((d) => ({ identificacao: { ...d.identificacao, responsavelPreenchimento: t } }))}
        error={msgErro(erros, 'responsavel', mostrarErros)}
        autoCapitalize="words"
      />
      <KeyValue inline label="Fuso horário da obra" value={FUSO_OBRA_LABEL} />
    </View>
  );
}
