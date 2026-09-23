import { Platform } from 'react-native';

// Evidências do dispositivo para assinaturas (seção 11). No protótipo o IP é simulado; o back-end
// registrará o IP real. O identificador é um ID de instalação gerado no primeiro uso (minimização).
export function deviceLabel() {
  const so = Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web';
  return `${so} ${Platform.Version ?? ''} • Expo Go`.replace(/\s+/g, ' ').trim();
}

export function evidenciasDoAparelho(deviceId, metodo2fa) {
  return {
    ip: 'IP registrado pelo servidor (simulado)',
    dispositivo: `${deviceLabel()} • ${String(deviceId || 'sem-id').slice(-6)}`,
    metodo2fa,
  };
}
