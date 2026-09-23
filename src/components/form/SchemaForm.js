import React from 'react';
import { StyleSheet, View } from 'react-native';
import { isFilled } from '../../utils/format';
import { KeyValue, SectionTitle } from '../ui';
import Field from './Field';
import { IntegerField, NumberField, TextField, TimeField } from './inputs';
import { ChipGroup, DateField, SelectField, StepperField, SwitchField } from './pickers';

// Formulário declarativo: cada campo do documento-base (seção 7) é descrito por um "spec".
// spec: { key, label, type, required, help, placeholder, options, allowCustom, suffix, visible(values, ctx),
//         half, min, max, readOnlyText(values, ctx), maxLength, multiline }
const resolve = (v, values, ctx) => (typeof v === 'function' ? v(values, ctx) : v);

function renderCampo(f, values, onChange, errors, ctx) {
  const value = values[f.key];
  const common = { label: f.label, required: f.required, help: f.help, error: errors[f.key] };
  const set = (v) => onChange(f.key, v);
  const suffix = resolve(f.suffix, values, ctx);

  switch (f.type) {
    case 'section':
      return <SectionTitle key={f.key}>{f.label}</SectionTitle>;
    case 'readonly':
      return <KeyValue key={f.key} label={f.label} value={f.readOnlyText ? f.readOnlyText(values, ctx) : value} />;
    case 'textarea':
      return <TextField key={f.key} {...common} value={value} onChangeText={set} placeholder={f.placeholder} multiline maxLength={f.maxLength} />;
    case 'number':
      return <NumberField key={f.key} {...common} value={value} onChangeText={set} placeholder={f.placeholder} suffix={suffix} />;
    case 'integer':
      return <IntegerField key={f.key} {...common} value={value} onChangeText={set} placeholder={f.placeholder} suffix={suffix} />;
    case 'time':
      return <TimeField key={f.key} {...common} value={value} onChangeText={set} />;
    case 'date':
      return <DateField key={f.key} {...common} value={value} onChange={set} min={resolve(f.min, values, ctx)} max={resolve(f.max, values, ctx)} />;
    case 'select':
      return <SelectField key={f.key} {...common} value={value} onChange={set} options={resolve(f.options, values, ctx)} allowCustom={f.allowCustom} placeholder={f.placeholder} />;
    case 'chips':
      return <ChipGroup key={f.key} {...common} value={value} onChange={set} options={resolve(f.options, values, ctx)} multi={f.multi} />;
    case 'switch':
      return <SwitchField key={f.key} label={f.label} description={f.help} value={!!value} onValueChange={set} />;
    case 'stepper':
      return <StepperField key={f.key} {...common} value={value} onChange={set} min={f.min ?? 0} max={f.max ?? 999} suffix={suffix} />;
    default:
      return <TextField key={f.key} {...common} value={value} onChangeText={set} placeholder={f.placeholder} maxLength={f.maxLength} suffix={suffix} autoCapitalize={f.autoCapitalize || 'sentences'} />;
  }
}

export default function SchemaForm({ fields, values, onChange, errors = {}, ctx = {}, gap = 14 }) {
  const visiveis = fields.filter((f) => !f.visible || f.visible(values, ctx));
  const blocos = [];
  for (let i = 0; i < visiveis.length; i++) {
    const f = visiveis[i];
    const prox = visiveis[i + 1];
    if (f.half && prox?.half) {
      blocos.push([f, prox]);
      i++;
    } else blocos.push([f]);
  }
  return (
    <View style={{ gap }}>
      {blocos.map((b) =>
        b.length === 2 ? (
          <View key={b[0].key} style={styles.pair}>
            <View style={styles.half}>{renderCampo(b[0], values, onChange, errors, ctx)}</View>
            <View style={styles.half}>{renderCampo(b[1], values, onChange, errors, ctx)}</View>
          </View>
        ) : (
          renderCampo(b[0], values, onChange, errors, ctx)
        ),
      )}
    </View>
  );
}

// Validação de obrigatórios a partir do schema (somente campos visíveis).
export function validarSchema(fields, values, ctx = {}) {
  const errs = {};
  for (const f of fields) {
    if (f.visible && !f.visible(values, ctx)) continue;
    if (f.required && ['text', 'textarea', 'number', 'integer', 'time', 'date', 'select', 'chips', undefined].includes(f.type) && !isFilled(values[f.key])) {
      errs[f.key] = 'Campo obrigatório.';
    }
  }
  return errs;
}

export { Field };

const styles = StyleSheet.create({
  pair: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
});
