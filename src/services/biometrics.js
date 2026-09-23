import * as LocalAuthentication from 'expo-local-authentication';

// Biometria do aparelho (RF-01). No Expo Go/iOS o Face ID não é suportado (exige development build);
// nesse caso o sistema oferece o código do aparelho ou a função fica indisponível — sempre com fallback.
export async function biometriaDisponivel() {
  try {
    const [hardware, cadastrada] = await Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync()]);
    return hardware && cadastrada;
  } catch (e) {
    return false;
  }
}

export async function autenticarBiometria(motivo = 'Confirme sua identidade') {
  try {
    const r = await LocalAuthentication.authenticateAsync({
      promptMessage: motivo,
      cancelLabel: 'Cancelar',
      fallbackLabel: 'Usar código do aparelho',
    });
    return !!r.success;
  } catch (e) {
    return false;
  }
}
