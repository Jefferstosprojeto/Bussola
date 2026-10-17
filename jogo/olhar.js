// Olhar à volta: dedo, rato (arrastar) e setas. Ângulos em radianos; yawRel positivo = esquerda.
const SENS_TOQUE = 0.006;
const SENS_RATO = 0.005;
const VEL_SETAS = 2.6;
const VEL_SETAS_VERTICAL = 1.2;
const PITCH_MAX = (25 * Math.PI) / 180;

export function criarOlhar(elemento) {
  const teclas = new Set();
  let arrasto = null;

  const s = {
    yawRel: 0,
    pitch: 0,
    ativo: false,
    atualizar(dt) {
      if (!s.ativo) return;
      if (teclas.has('ArrowLeft')) s.yawRel += VEL_SETAS * dt;
      if (teclas.has('ArrowRight')) s.yawRel -= VEL_SETAS * dt;
      if (teclas.has('ArrowUp')) s.pitch += VEL_SETAS_VERTICAL * dt;
      if (teclas.has('ArrowDown')) s.pitch -= VEL_SETAS_VERTICAL * dt;
      limitar();
    },
    reiniciar() {
      s.yawRel = 0;
      s.pitch = 0;
      arrasto = null;
      teclas.clear();
    },
  };

  function limitar() {
    s.yawRel = Math.max(-Math.PI, Math.min(Math.PI, s.yawRel));
    s.pitch = Math.max(-PITCH_MAX, Math.min(PITCH_MAX, s.pitch));
  }

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
    s.yawRel -= (ev.clientX - arrasto.x) * k;
    s.pitch -= (ev.clientY - arrasto.y) * k;
    arrasto.x = ev.clientX;
    arrasto.y = ev.clientY;
    limitar();
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
