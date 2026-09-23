import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { colors } from '../../../theme';
import { formatDateTime } from '../../../utils/date';
import { Banner, BottomSheet, Button, KeyValue, useUI } from '../../../components/ui';
import { ChipGroup, SelectField, SwitchField, TextField } from '../../../components/form';
import { PhotoTile } from '../../../components/rdo';
import { obterCoordenada } from '../../../services/media';

// Legenda obrigatória, local, vínculo com atividade/ocorrência e coordenada opcional/consentida (RF-10).
export default function PhotoEditorSheet({ foto, rdo, catalogos, nomeAutor, onSalvar, onRemover, onClose }) {
  const { toast } = useUI();
  const [d, setD] = useState(foto);
  const [erro, setErro] = useState('');
  const [buscandoGps, setBuscandoGps] = useState(false);

  useEffect(() => {
    setD(foto);
    setErro('');
  }, [foto]);

  if (!foto || !d) return null;
  const tipoVinculo = d.vinculo?.tipo || '';

  const setVinculoTipo = (tipo) => setD({ ...d, vinculo: tipo ? { tipo, id: null } : null });
  const opcoesVinculo =
    tipoVinculo === 'atividade'
      ? rdo.atividades.map((a) => ({ value: a.id, label: `${a.servico}${a.frente ? ` — ${a.frente}` : ''}` }))
      : rdo.ocorrencias.map((o) => ({ value: o.id, label: `${o.codigo} — ${o.fato.slice(0, 50)}` }));

  const alternarGps = async (ligar) => {
    if (!ligar) return setD({ ...d, coordenada: null });
    setBuscandoGps(true);
    const r = await obterCoordenada();
    setBuscandoGps(false);
    if (r.erro) return toast.show({ type: 'warning', title: 'Localização indisponível', message: r.erro });
    setD({ ...d, coordenada: r.coordenada });
    return undefined;
  };

  const salvar = () => {
    if (!d.legenda.trim()) return setErro('A legenda é obrigatória: ela transforma a imagem em evidência compreensível.');
    return onSalvar({ ...d, legenda: d.legenda.trim() });
  };

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title={`Foto ${String(d.numero).padStart(2, '0')}`}
      subtitle="Legenda, local e vínculo transformam a imagem em evidência."
      fullHeight
      footer={
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title="Cancelar" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
            <Button title="Salvar foto" icon="check" onPress={salvar} style={{ flex: 1.3 }} />
          </View>
          <Button title="Remover foto" icon="trash-can-outline" variant="danger" size="sm" onPress={() => onRemover(d)} />
        </View>
      }
    >
      <View style={{ alignItems: 'center' }}>
        <PhotoTile foto={d} width={300} ratio={0.62} showState={false} />
      </View>
      <TextField
        label="Legenda"
        required
        value={d.legenda}
        onChangeText={(t) => {
          setD({ ...d, legenda: t });
          setErro('');
        }}
        multiline
        error={erro}
        placeholder="Ex.: Tubulação encontrada no eixo C/4 antes da execução"
        maxLength={200}
      />
      <SelectField label="Local" value={d.local} onChange={(v) => setD({ ...d, local: v })} options={catalogos.frentes} allowCustom placeholder="Ex.: Eixo C/4, pavimento térreo" help="Local preciso: eixo, pavimento ou frente de serviço." />
      <ChipGroup
        label="Vincular a"
        options={[{ value: '', label: 'Nenhum' }, { value: 'atividade', label: 'Atividade', disabled: !rdo.atividades.length }, { value: 'ocorrencia', label: 'Ocorrência', disabled: !rdo.ocorrencias.length }]}
        value={tipoVinculo}
        onChange={setVinculoTipo}
        required
      />
      {tipoVinculo ? (
        <SelectField
          label={tipoVinculo === 'atividade' ? 'Atividade' : 'Ocorrência'}
          value={d.vinculo?.id || ''}
          onChange={(id) => setD({ ...d, vinculo: { tipo: tipoVinculo, id } })}
          options={opcoesVinculo}
        />
      ) : null}
      <SwitchField
        label="Registrar localização (GPS)"
        description={d.coordenada ? `${d.coordenada.lat.toFixed(5)}, ${d.coordenada.lng.toFixed(5)} (±${Math.round(d.coordenada.precisao)} m)` : 'Opcional. Só é coletada com a sua autorização, foto a foto.'}
        value={!!d.coordenada}
        onValueChange={alternarGps}
        disabled={buscandoGps}
      />
      <View style={{ gap: 6, backgroundColor: colors.blue50, borderRadius: 12, padding: 12 }}>
        <KeyValue inline label="Data/hora" value={formatDateTime(d.dataHora)} />
        <KeyValue inline label="Autoria" value={nomeAutor(d.autorId)} />
        <KeyValue inline label="Arquivo" value={d.meta ? `${d.meta.largura}×${d.meta.altura} px · compressão ${d.meta.compressao}%` : '—'} />
      </View>
      <Banner tone="neutral" icon="shield-check-outline" message="A compressão aplicada fica registrada e o arquivo original é preservado pelo servidor quando necessário." />
    </BottomSheet>
  );
}
