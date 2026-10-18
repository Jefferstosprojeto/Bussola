// Olhar à volta: dedo, rato (arrastar), setas e giroscópio. Ângulos em radianos; yawRel positivo = esquerda.
const SENS_TOQUE = 0.006;
const SENS_RATO = 0.005;
const VEL_SETAS = 2.6;
const VEL_SETAS_VERTICAL = 1.2;
export const PITCH_MAX = (25 * Math.PI) / 180;

const limitar = (v, a, b) => Math.max(a, Math.min(b, v));

// O giroscópio soma-se ao dedo; a yaw total dá a volta em ±π, o pitch fica limitado.
export function combinarOlhar(dedo, giro) {
  if (!giro) return { yaw: dedo.yaw, pitch: dedo.pitch };
  const y = dedo.yaw + giro.yaw;
  return { yaw: Math.atan2(Math.sin(y), Math.cos(y)), pitch: limitar(dedo.pitch + giro.pitch, -PITCH_MAX, PITCH_MAX) };
}

export function criarOlhar(elemento, giroscopio = null) {
  const teclas = new Set();
  const dedo = { yaw: 0, pitch: 0 };
  let arrasto = null;

  function limitarDedo() {
    dedo.yaw = limitar(dedo.yaw, -Math.PI, Math.PI);
    dedo.pitch = limitar(dedo.pitch, -PITCH_MAX, PITCH_MAX);
  }

  const s = {
    yawRel: 0,
    pitch: 0,
    ativo: false,
    atualizar(dt) {
      if (!s.ativo) return;
      if (teclas.has('ArrowLeft')) dedo.yaw += VEL_SETAS * dt;
      if (teclas.has('ArrowRight')) dedo.yaw -= VEL_SETAS * dt;
      if (teclas.has('ArrowUp')) dedo.pitch += VEL_SETAS_VERTICAL * dt;
      if (teclas.has('ArrowDown')) dedo.pitch -= VEL_SETAS_VERTICAL * dt;
      limitarDedo();
      const c = combinarOlhar(dedo, giroscopio ? giroscopio.ler() : null);
      s.yawRel = c.yaw;
      s.pitch = c.pitch;
    },
    reiniciar() {
      dedo.yaw = 0;
      dedo.pitch = 0;
      s.yawRel = 0;
      s.pitch = 0;
      arrasto = null;
      teclas.clear();
      // A direção atual do telemóvel passa a ser "em frente".
      if (giroscopio) giroscopio.recalibrar();
    },
  };

  elemento.addEventListener('pointerdown', (ev) => {
    if (!s.ativo) return;
    arrasto = { x: ev.clientX, y: ev.clientY, id: ev.pointerId };
    try {
      if (elemento.setPointerCapture) elemento.setPointerCapture(ev.pointerId);
    } catch {
      // Sem captura o arrasto continua a funcionar dentro do elemento.
    }
  });
  elemento.addEventListener('pointermove', (ev) => {
    if (!s.ativo || !arrasto || ev.pointerId !== arrasto.id) return;
    const k = ev.pointerType === 'mouse' ? SENS_RATO : SENS_TOQUE;
    dedo.yaw -= (ev.clientX - arrasto.x) * k;
    dedo.pitch -= (ev.clientY - arrasto.y) * k;
    arrasto.x = ev.clientX;
    arrasto.y = ev.clientY;
    limitarDedo();
  });
  const largar = () => { arrasto = null; };
  elemento.addEventListener('pointerup', largar);
  elemento.addEventListener('pointercancel', largar);

  window.addEventListener('keydown', (ev) => {
    if (!ev.key?.startsWith('Arrow')) return;
    if (s.ativo) ev.preventDefault();
    teclas.add(ev.key);
  });
  window.addEventListener('keyup', (ev) => teclas.delete(ev.key));
  window.addEventListener('blur', () => teclas.clear());

  return s;
}
