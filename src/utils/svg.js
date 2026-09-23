// Geração de SVG em JS puro (QR code e assinatura desenhada), compartilhada entre a interface e o PDF.
import QRCodeCore from 'qrcode/lib/core/qrcode.js';

export function qrModules(texto) {
  const qr = QRCodeCore.create(texto, { errorCorrectionLevel: 'M' });
  return { size: qr.modules.size, data: qr.modules.data };
}

export function qrSvgPath({ size, data }) {
  let d = '';
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (data[y * size + x]) d += `M${x} ${y}h1v1h-1z`;
    }
  }
  return d;
}

export function qrSvg(texto, px = 120, cor = '#0C2038') {
  const m = qrModules(texto);
  const margem = 2;
  const box = m.size + margem * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="${-margem} ${-margem} ${box} ${box}"><rect x="${-margem}" y="${-margem}" width="${box}" height="${box}" fill="#fff"/><path d="${qrSvgPath(m)}" fill="${cor}"/></svg>`;
}

// Caminho SVG suavizado (curvas quadráticas entre pontos médios) a partir dos pontos de um traço.
export function tracoParaPath(pontos) {
  if (!pontos || pontos.length === 0) return '';
  if (pontos.length === 1) return `M ${pontos[0].x} ${pontos[0].y}`;
  let d = `M ${pontos[0].x} ${pontos[0].y}`;
  for (let i = 1; i < pontos.length - 1; i++) {
    const mx = (pontos[i].x + pontos[i + 1].x) / 2;
    const my = (pontos[i].y + pontos[i + 1].y) / 2;
    d += ` Q ${pontos[i].x} ${pontos[i].y} ${mx} ${my}`;
  }
  const u = pontos[pontos.length - 1];
  return `${d} L ${u.x} ${u.y}`;
}

export function assinaturaSvg(dados, largura = 180, altura = 72, cor = '#0C2038') {
  if (!dados?.tracos?.length) return '';
  const paths = dados.tracos
    .map((t) => (t.length === 1 ? `<circle cx="${t[0].x}" cy="${t[0].y}" r="1.6" fill="${cor}"/>` : `<path d="${tracoParaPath(t)}" stroke="${cor}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`))
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${dados.largura || 300} ${dados.altura || 120}" preserveAspectRatio="xMidYMid meet">${paths}</svg>`;
}
