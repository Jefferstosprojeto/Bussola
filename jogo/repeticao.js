// Repetição 2D do lance, vista de cima, com a zona de pressão ou o espaço livre realçados.

const PAUSA_FINAL = 1.2;
const MOSTRAR_DESTAQUE_ANTES = 1.5;

export function quadroEm(frames, t) {
  if (!frames.length) return null;
  if (t <= frames[0].t) return frames[0];
  let lo = 0;
  let hi = frames.length - 1;
  while (lo < hi) {
    const meio = (lo + hi + 1) >> 1;
    if (frames[meio].t <= t) lo = meio;
    else hi = meio - 1;
  }
  return frames[lo];
}

export function criarRepeticao(tela, { frames, jogadores, destaque, congelaEm, campo }) {
  const ctx = tela.getContext('2d');
  const C = campo.comprimento;
  const L = campo.largura;
  const fim = frames.length ? frames[frames.length - 1].t : 0;
  let escala = 1;
  let raf = 0;
  let inicio = 0;

  const px = (m) => m * escala;

  function dimensionar() {
    const r = Math.min(window.devicePixelRatio || 1, 2);
    const w = tela.clientWidth || 300;
    tela.width = Math.round(w * r);
    tela.height = Math.round(((w * L) / C) * r);
    escala = tela.width / C;
  }

  function circulo(x, z, raio, preenchimento, contorno, espessura) {
    ctx.beginPath();
    ctx.arc(px(x), px(z), px(raio), 0, Math.PI * 2);
    if (preenchimento) {
      ctx.fillStyle = preenchimento;
      ctx.fill();
    }
    if (contorno) {
      ctx.strokeStyle = contorno;
      ctx.lineWidth = px(espessura);
      ctx.stroke();
    }
  }

  function desenharCampo() {
    ctx.fillStyle = '#3E8E4A';
    ctx.fillRect(0, 0, tela.width, tela.height);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = px(0.25);
    ctx.strokeRect(px(0.15), px(0.15), px(C - 0.3), px(L - 0.3));
    ctx.beginPath();
    ctx.moveTo(px(C / 2), 0);
    ctx.lineTo(px(C / 2), px(L));
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px(C / 2), px(L / 2), px(6), 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeRect(0, px((L - 20) / 2), px(9), px(20));
    ctx.strokeRect(px(C - 9), px((L - 20) / 2), px(9), px(20));
  }

  function corDe(j) {
    if (j.guardaRedes) return j.equipa === 'nos' ? '#E2932E' : '#6A4FB5';
    return j.equipa === 'nos' ? '#FFFFFF' : '#C2493B';
  }

  function desenhar(t) {
    const q = quadroEm(frames, t);
    if (!q) return;
    desenharCampo();
    if (t >= congelaEm - MOSTRAR_DESTAQUE_ANTES) {
      const cor = destaque.tipo === 'pressao' ? 'rgba(194,73,59,.45)' : 'rgba(127,211,154,.55)';
      circulo(destaque.centro[0], destaque.centro[1], destaque.raio, cor, '#FFFFFF', 0.15);
    }
    for (const [id, p] of Object.entries(q.pos)) {
      if (id === 'arthur') continue;
      const j = jogadores[id];
      circulo(p[0], p[1], 0.9, corDe(j), j.equipa === 'nos' ? '#1B5C3E' : '#FFFFFF', 0.25);
    }
    const a = q.pos.arthur;
    circulo(a[0], a[1], 1.15, '#FFFFFF', '#E2932E', 0.5);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `700 ${px(2)}px Oswald, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Tu', px(a[0]), px(Math.max(2, a[1] - 1.8)));
    circulo(q.bola[0], q.bola[1], 0.55, '#FFFFFF', '#111111', 0.18);
  }

  function ciclo(agora) {
    const t = ((agora - inicio) / 1000) % (fim + PAUSA_FINAL);
    desenhar(Math.min(t, fim));
    raf = requestAnimationFrame(ciclo);
  }

  return {
    tocar() {
      dimensionar();
      cancelAnimationFrame(raf);
      inicio = performance.now();
      raf = requestAnimationFrame(ciclo);
    },
    parar() {
      cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}
