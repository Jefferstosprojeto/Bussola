// Giroscópio: rodar o telemóvel roda a cabeça no jogo. Matemática pura em cima; leitura do aparelho em baixo.
// A orientação segue o método do DeviceOrientationControls do Three.js (euler YXZ, -90° em X, ângulo do ecrã em Z).

const GRAUS = Math.PI / 180;
const normalizar = (a) => Math.atan2(Math.sin(a), Math.cos(a));

function quaternioYXZ(x, y, z) {
  const c1 = Math.cos(x / 2), c2 = Math.cos(y / 2), c3 = Math.cos(z / 2);
  const s1 = Math.sin(x / 2), s2 = Math.sin(y / 2), s3 = Math.sin(z / 2);
  return [s1 * c2 * c3 + c1 * s2 * s3, c1 * s2 * c3 - s1 * c2 * s3, c1 * c2 * s3 - s1 * s2 * c3, c1 * c2 * c3 + s1 * s2 * s3];
}

function multiplicar([ax, ay, az, aw], [bx, by, bz, bw]) {
  return [
    ax * bw + aw * bx + ay * bz - az * by,
    ay * bw + aw * by + az * bx - ax * bz,
    az * bw + aw * bz + ax * by - ay * bx,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

const MENOS_90_EM_X = [-Math.SQRT1_2, 0, 0, Math.SQRT1_2];

export function orientacaoParaAngulos({ alpha = 0, beta = 0, gamma = 0 }, anguloEcra = 0) {
  let q = quaternioYXZ(beta * GRAUS, alpha * GRAUS, -gamma * GRAUS);
  q = multiplicar(q, MENOS_90_EM_X);
  const meio = (-anguloEcra * GRAUS) / 2;
  q = multiplicar(q, [0, 0, Math.sin(meio), Math.cos(meio)]);
  const [x, y, z, w] = q;
  const m13 = 2 * (x * z + y * w);
  const m23 = 2 * (y * z - x * w);
  const m33 = 1 - 2 * (x * x + y * y);
  const m31 = 2 * (x * z - y * w);
  const m11 = 1 - 2 * (y * y + z * z);
  const pitch = Math.asin(-Math.max(-1, Math.min(1, m23)));
  const yaw = Math.abs(m23) < 0.9999999 ? Math.atan2(m13, m33) : Math.atan2(-m31, m11);
  return { yaw, pitch };
}

export function relativo(angulos, origem) {
  return { yaw: normalizar(angulos.yaw - origem.yaw), pitch: angulos.pitch - origem.pitch };
}

export function criarGiroscopio(janela = globalThis) {
  const Evento = janela.DeviceOrientationEvent;
  const temEvento = typeof Evento !== 'undefined';
  const toque = !!janela.matchMedia?.('(pointer: coarse)').matches;
  const precisaAutorizacao = temEvento && typeof Evento.requestPermission === 'function';
  let autorizado = temEvento && !precisaAutorizacao;
  let ligado = false;
  let ultimo = null;
  let origem = null;

  const anguloEcra = () => Number(janela.screen?.orientation?.angle ?? janela.orientation ?? 0) || 0;
  const aoMudar = (ev) => {
    if (ev.alpha == null && ev.beta == null && ev.gamma == null) return;
    ultimo = orientacaoParaAngulos(ev, anguloEcra());
  };

  return {
    disponivel: temEvento && toque,
    precisaAutorizacao,
    get autorizado() { return autorizado; },
    get ligado() { return ligado; },
    async pedirAutorizacao() {
      if (!temEvento) return false;
      if (!precisaAutorizacao) return autorizado;
      try {
        autorizado = (await Evento.requestPermission()) === 'granted';
      } catch {
        autorizado = false;
      }
      return autorizado;
    },
    ligar() {
      if (ligado) return true;
      if (!temEvento || !autorizado) return false;
      janela.addEventListener('deviceorientation', aoMudar);
      ligado = true;
      ultimo = null;
      origem = null;
      return true;
    },
    desligar() {
      if (!ligado) return;
      janela.removeEventListener('deviceorientation', aoMudar);
      ligado = false;
      ultimo = null;
      origem = null;
    },
    recalibrar() {
      origem = ultimo;
    },
    ler() {
      if (!ligado || !ultimo) return null;
      if (!origem) origem = ultimo;
      return relativo(ultimo, origem);
    },
  };
}
