import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { colors } from '../../theme';
import { CONTEXTOS_COMENTARIO } from '../../constants';
import { addDays, combineDateTime, hojeObra } from '../../utils/date';
import { Banner, BottomSheet, Button, Icon, Txt } from '../../components/ui';
import { DateField, SelectField, SwitchField, TextField, TimeField } from '../../components/form';
import CheckboxField from '../../components/form/CheckboxField';

// Comentário em contexto (RF-12): seção ou foto específica. `podeCliente`: master pode tornar visível ao cliente.
export function ComentarSheet({ visible, onClose, onEnviar, inicial, fotos = [], podeCliente, respondendo }) {
  const [contexto, setContexto] = useState('geral');
  const [ref, setRef] = useState(null);
  const [texto, setTexto] = useState('');
  const [aoCliente, setAoCliente] = useState(false);

  useEffect(() => {
    if (visible) {
      setContexto(inicial?.contexto || 'geral');
      setRef(inicial?.contextoRef || null);
      setTexto('');
      setAoCliente(!!respondendo);
    }
  }, [visible, inicial, respondendo]);

  const foto = ref ? fotos.find((f) => f.id === ref) : null;
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={respondendo ? 'Responder esclarecimento' : 'Novo comentário'}
      subtitle={respondendo ? 'A resposta ficará visível ao cliente.' : undefined}
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button title="Cancelar" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
          <Button title="Enviar" icon="send-outline" disabled={texto.trim().length < 3} onPress={() => onEnviar({ texto, contexto, contextoRef: ref, visibilidade: aoCliente || respondendo ? 'cliente' : 'interno' })} style={{ flex: 1.3 }} />
        </View>
      }
    >
      <SelectField label="Sobre" value={contexto} onChange={(v) => { setContexto(v); if (v !== 'fotos') setRef(null); }} options={CONTEXTOS_COMENTARIO} />
      {contexto === 'fotos' && fotos.length ? (
        <SelectField
          label="Foto"
          value={ref || ''}
          onChange={setRef}
          options={[{ value: '', label: 'Todas as fotos' }, ...fotos.map((f) => ({ value: f.id, label: `Foto ${String(f.numero).padStart(2, '0')} — ${f.legenda || 'sem legenda'}` }))]}
        />
      ) : null}
      {foto ? (
        <Banner tone="info" icon="image-outline" message={`Comentário vinculado à Foto ${String(foto.numero).padStart(2, '0')}.`} />
      ) : null}
      <TextField label="Comentário" required value={texto} onChangeText={setTexto} multiline placeholder="Descreva sua observação de forma objetiva…" maxLength={600} />
      {podeCliente && !respondendo ? (
        <SwitchField label="Visível ao cliente" description="Por padrão, comentários do master são internos (master e operacional)." value={aoCliente} onValueChange={setAoCliente} />
      ) : null}
    </BottomSheet>
  );
}

// Devolução com motivo obrigatório e prazo de correção (seção 5).
export function DevolverSheet({ visible, onClose, onConfirmar, comentariosNestaAnalise = 0 }) {
  const [motivo, setMotivo] = useState('');
  const [data, setData] = useState(hojeObra());
  const [hora, setHora] = useState('18:00');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (visible) {
      setMotivo('');
      setData(hojeObra());
      setHora('18:00');
      setErro('');
    }
  }, [visible]);

  const confirmar = () => {
    if (motivo.trim().length < 10) return setErro('Descreva o motivo com ao menos 10 caracteres.');
    onConfirmar({ motivo: motivo.trim(), prazo: combineDateTime(data, /^\d{2}:\d{2}$/.test(hora) ? hora : '18:00') });
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Devolver para correção"
      subtitle="O operacional é notificado com o motivo e o prazo."
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button title="Cancelar" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
          <Button title="Devolver" icon="undo-variant" onPress={confirmar} style={{ flex: 1.3 }} />
        </View>
      }
    >
      <TextField label="Motivo da devolução" required value={motivo} onChangeText={(t) => { setMotivo(t); setErro(''); }} multiline error={erro} placeholder="Ex.: Foto 03 sem local preciso; informe o eixo/pavimento e reenvie." maxLength={500} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1.4 }}>
          <DateField label="Prazo de correção" required value={data} onChange={setData} min={hojeObra()} max={addDays(hojeObra(), 15)} />
        </View>
        <View style={{ flex: 1 }}>
          <TimeField label="Hora" value={hora} onChangeText={setHora} />
        </View>
      </View>
      {comentariosNestaAnalise ? (
        <Banner tone="info" message={`${comentariosNestaAnalise} ${comentariosNestaAnalise === 1 ? 'comentário' : 'comentários'} em contexto acompanham a devolução.`} />
      ) : (
        <Banner tone="neutral" message="Dica: comente antes as seções/fotos específicas (ícone de balão em cada bloco) para orientar a correção." />
      )}
    </BottomSheet>
  );
}

// Envio ao cliente (etapa 5): canais e destinatários; WhatsApp/SMS só com integração e consentimento.
export function EnviarClienteSheet({ visible, onClose, onConfirmar, clientes = [] }) {
  const [email, setEmail] = useState(true);
  const [whats, setWhats] = useState(false);
  const temWhats = clientes.some((c) => c.canais?.whatsapp);

  useEffect(() => {
    if (visible) {
      setEmail(true);
      setWhats(false);
    }
  }, [visible]);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Enviar ao cliente"
      subtitle="O cliente recebe link seguro e solicitação de ciência/aceite."
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button title="Cancelar" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
          <Button title="Enviar" icon="account-arrow-right-outline" onPress={() => onConfirmar(['app', ...(email ? ['email'] : []), ...(whats ? ['whatsapp'] : [])])} style={{ flex: 1.3 }} />
        </View>
      }
    >
      <View style={{ gap: 6 }}>
        <Txt v="smallStrong">Destinatários</Txt>
        {clientes.length ? (
          clientes.map((c) => (
            <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="account-tie-outline" size={18} color={colors.navy600} />
              <Txt v="small">{c.nome} · {c.email}</Txt>
            </View>
          ))
        ) : (
          <Banner tone="warning" message="Nenhum usuário cliente vinculado a esta obra. Vincule um cliente em Obras → Editar." />
        )}
      </View>
      <CheckboxField label="Notificação no aplicativo (push)" description="Sempre ativa." value disabled />
      <CheckboxField label="E-mail com link seguro" value={email} onValueChange={setEmail} />
      <CheckboxField label="WhatsApp (opcional)" description={temWhats ? 'Integração opcional; depende de provedor, custo e consentimento.' : 'Nenhum destinatário consentiu com este canal.'} value={whats} onValueChange={setWhats} disabled={!temWhats} />
    </BottomSheet>
  );
}
