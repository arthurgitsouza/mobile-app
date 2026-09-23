import React from 'react';
import { View } from 'react-native';
import { colors } from '../../../theme';
import { CONDICOES_TEMPO, FONTES_CLIMA, IMPACTOS_CLIMA, PERIODOS_CLIMA } from '../../../constants';
import { duracaoChuvaMin } from '../../../domain/rdo';
import { formatDuracao } from '../../../utils/date';
import { Banner, Button, Card, Icon, Txt } from '../../../components/ui';
import { ChipGroup, NumberField, SwitchField, TextField, TimeField } from '../../../components/form';
import { msgErro } from './helpers';

const CHUVA = ['chuva_fraca', 'chuva_moderada', 'chuva_forte'];

// Grupo B — Condições climáticas: manhã/tarde/noite; se choveu, duração, precipitação, impacto e horas paralisadas.
export default function StepClima({ rdo, update, erros, mostrarErros }) {
  const c = rdo.clima;
  const setClima = (patch) => update((d) => ({ clima: { ...d.clima, ...patch } }));
  const setPeriodo = (key, patch) => update((d) => ({ clima: { ...d.clima, periodos: { ...d.clima.periodos, [key]: { ...d.clima.periodos[key], ...patch } } } }));
  const duracao = duracaoChuvaMin(c);
  const marcouChuva = Object.values(c.periodos).some((p) => CHUVA.includes(p.condicao));

  return (
    <View style={{ gap: 14 }}>
      {msgErro(erros, 'periodos', mostrarErros) ? <Banner tone="danger" message={msgErro(erros, 'periodos', mostrarErros)} /> : null}

      {PERIODOS_CLIMA.map((p) => (
        <Card key={p.key} style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name={p.icone} size={20} color={colors.navy600} />
            <Txt v="bodyStrong">{p.label}</Txt>
          </View>
          <ChipGroup scroll options={CONDICOES_TEMPO} value={c.periodos[p.key].condicao} onChange={(v) => setPeriodo(p.key, { condicao: v })} />
          {c.periodos[p.key].condicao ? (
            <NumberField label="Temperatura (opcional)" value={c.periodos[p.key].temperatura} onChangeText={(t) => setPeriodo(p.key, { temperatura: t })} suffix="°C" placeholder="Ex.: 28" />
          ) : null}
        </Card>
      ))}

      {marcouChuva && !c.choveu ? (
        <Banner tone="info" icon="weather-pouring" message="Você registrou chuva em um período. Marque “Houve chuva” para informar duração, precipitação e impacto." actionLabel="Marcar que houve chuva" onAction={() => setClima({ choveu: true })} />
      ) : null}

      <SwitchField label="Houve chuva" description="Ao marcar, informe duração e/ou precipitação e o impacto no serviço." value={c.choveu} onValueChange={(v) => setClima({ choveu: v })} />

      {c.choveu ? (
        <Card style={{ gap: 14 }}>
          {msgErro(erros, 'chuva', mostrarErros) ? <Banner tone="danger" message={msgErro(erros, 'chuva', mostrarErros)} /> : null}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <TimeField label="Início da chuva" value={c.chuvaInicio} onChangeText={(t) => setClima({ chuvaInicio: t })} error={msgErro(erros, 'chuvaHorario', mostrarErros)} />
            </View>
            <View style={{ flex: 1 }}>
              <TimeField label="Fim da chuva" value={c.chuvaFim} onChangeText={(t) => setClima({ chuvaFim: t })} />
            </View>
          </View>
          {duracao !== null ? (
            <Txt v="smallStrong" color={colors.info}>
              Duração: {formatDuracao(duracao)} ({duracao} min)
            </Txt>
          ) : null}
          <NumberField label="Precipitação registrada" value={c.precipitacaoMm} onChangeText={(t) => setClima({ precipitacaoMm: t })} suffix="mm" placeholder="Ex.: 4" help="Se conhecida (pluviômetro da obra ou estação)." />
          <ChipGroup label="Impacto no serviço" required options={IMPACTOS_CLIMA} value={c.impacto} onChange={(v) => setClima({ impacto: v })} />
          {c.impacto && c.impacto !== 'nenhum' ? (
            <View style={{ gap: 8 }}>
              <TimeField
                label="Horas paralisadas (HH:MM)"
                required
                value={c.horasParalisadas}
                onChangeText={(t) => setClima({ horasParalisadas: t })}
                error={msgErro(erros, 'horasParalisadas', mostrarErros)}
                help="Tempo em que o serviço ficou parado por causa do tempo."
              />
              {duracao !== null && !c.horasParalisadas ? (
                <Button title={`Usar a duração da chuva (${formatDuracao(duracao)})`} icon="timer-outline" variant="tonal" size="sm" full={false} onPress={() => setClima({ horasParalisadas: formatDuracao(duracao) })} />
              ) : null}
            </View>
          ) : null}
        </Card>
      ) : null}

      <ChipGroup label="Fonte do dado" options={FONTES_CLIMA} value={c.fonte} onChange={(v) => setClima({ fonte: v || 'manual' })} required help="A integração meteorológica automática será uma evolução futura." />
      <TextField label="Observações sobre o clima" value={c.observacao} onChangeText={(t) => setClima({ observacao: t })} multiline placeholder="Ex.: Concretagem externa suspensa por 35 min." />
    </View>
  );
}
