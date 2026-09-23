import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

// Fotos (RF-10): câmera ou galeria. A compressão (qualidade 80%) é registrada nos metadados da foto.
export const QUALIDADE_FOTO = 0.8;

export async function capturarFoto() {
  try {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return { erro: 'Permita o acesso à câmera nas configurações do aparelho para fotografar.' };
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: QUALIDADE_FOTO });
    if (r.canceled) return { cancelado: true };
    return { assets: r.assets };
  } catch (e) {
    return { erro: 'A câmera não está disponível neste aparelho. Use a galeria.' };
  }
}

// O seletor do sistema não exige permissão de mídia (Android moderno/iOS 14+).
export async function escolherDaGaleria(limite = 6) {
  try {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: limite, quality: QUALIDADE_FOTO,
    });
    if (r.canceled) return { cancelado: true };
    return { assets: r.assets };
  } catch (e) {
    return { erro: 'Não foi possível abrir a galeria.' };
  }
}

// Coordenada opcional e consentida (LGPD): pedida foto a foto.
export async function obterCoordenada() {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return { erro: 'Permissão de localização negada. A coordenada é opcional.' };
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { coordenada: { lat: pos.coords.latitude, lng: pos.coords.longitude, precisao: pos.coords.accuracy || 0 } };
  } catch (e) {
    return { erro: 'Não foi possível obter a localização agora.' };
  }
}
