// Bancadas à volta do campo: geometria e lugares dos adeptos. Puro, em coordenadas do jogo (x, z) e metros.

export const AFASTAMENTO = 6;
export const PROFUNDIDADE_FILA = 0.8;
export const SUBIDA_FILA = 0.45;
export const ALTURA_BASE = 1.2;
export const EXTENSAO = 6;
export const ESPACO_LUGAR = 0.6;

// eixo: ao longo de que coordenada corre a bancada; lado: -1 antes do campo, +1 depois.
export const BANCADAS = [
  { id: 'esquerda', eixo: 'x', lado: -1, filas: 12 },
  { id: 'principal', eixo: 'x', lado: 1, filas: 16, cobertura: true },
  { id: 'fundo-nosso', eixo: 'z', lado: -1, filas: 9 },
  { id: 'fundo-deles', eixo: 'z', lado: 1, filas: 9 },
];

export function geometriaBancada(b, campo) {
  const comprimento = b.eixo === 'x' ? campo.comprimento : campo.largura;
  const outro = b.eixo === 'x' ? campo.largura : campo.comprimento;
  const ext = b.eixo === 'x' ? EXTENSAO : 0;
  return {
    inicio: -ext,
    fim: comprimento + ext,
    base: b.lado < 0 ? -AFASTAMENTO : outro + AFASTAMENTO,
  };
}

// Rumo (rotação em y) para olhar para o campo; a frente de um adepto é +z local.
function rumo(b) {
  if (b.eixo === 'x') return b.lado < 0 ? 0 : Math.PI;
  return b.lado < 0 ? Math.PI / 2 : -Math.PI / 2;
}

export function gerarLugares(campo, { fracao = 0.92, aleatorio = Math.random } = {}) {
  const lugares = [];
  for (const b of BANCADAS) {
    const g = geometriaBancada(b, campo);
    const rotY = rumo(b);
    for (let fila = 0; fila < b.filas; fila++) {
      const fixo = g.base + b.lado * (fila + 0.5) * PROFUNDIDADE_FILA;
      const y = ALTURA_BASE + (fila + 1) * SUBIDA_FILA;
      const n = Math.floor((g.fim - g.inicio) / ESPACO_LUGAR);
      for (let k = 0; k < n; k++) {
        if (aleatorio() > fracao) continue;
        const s = g.inicio + (k + 0.5) * ESPACO_LUGAR + (aleatorio() - 0.5) * 0.15;
        lugares.push({
          x: b.eixo === 'x' ? s : fixo,
          z: b.eixo === 'x' ? fixo : s,
          y,
          rotY,
          cor: aleatorio() < 0.6 ? 0 : 1,
          fase: Math.min(0.999999, aleatorio()),
        });
      }
    }
  }
  return lugares;
}
