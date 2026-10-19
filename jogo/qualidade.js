// Medidor de fps: avisa uma vez se a média ficar abaixo do mínimo durante uns segundos seguidos.

export const FPS_MINIMO = 45;
export const SEGUNDOS_ABAIXO = 2;
const SUAVIZAR = 0.1;

export function criarMedidorFps({ minimo = FPS_MINIMO, segundos = SEGUNDOS_ABAIXO } = {}) {
  let media = null;
  let abaixo = 0;
  let disparado = false;
  return {
    registar(dt) {
      if (disparado || !(dt > 0)) return false;
      media = media === null ? dt : media + (dt - media) * SUAVIZAR;
      abaixo = 1 / media < minimo ? abaixo + dt : 0;
      if (abaixo >= segundos - 1e-9) {
        disparado = true;
        return true;
      }
      return false;
    },
    get disparado() {
      return disparado;
    },
  };
}
