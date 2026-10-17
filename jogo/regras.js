// Regras do jogo: funções puras, sem 3D nem DOM.

export const LIMIAR_SCAN = (70 * Math.PI) / 180;
export const LIMIAR_REARME = (30 * Math.PI) / 180;
export const JANELA_SCAN = 4;
export const MIN_SCANS = 2;
export const CHAVE_RECORDES = 'bussola-jogo-recordes';

export function posicaoEm(pontos, t) {
  if (t <= pontos[0][0]) return [pontos[0][1], pontos[0][2]];
  for (let i = 1; i < pontos.length; i++) {
    const [t1, x1, z1] = pontos[i];
    if (t <= t1) {
      const [t0, x0, z0] = pontos[i - 1];
      const f = t1 === t0 ? 1 : (t - t0) / (t1 - t0);
      return [x0 + (x1 - x0) * f, z0 + (z1 - z0) * f];
    }
  }
  const u = pontos[pontos.length - 1];
  return [u[1], u[2]];
}

export function trajetoriasDaVariante(cenario, varianteId) {
  const alteracoes = cenario.variantes[varianteId].alteracoes || {};
  const out = {};
  for (const [id, j] of Object.entries(cenario.jogadores)) out[id] = alteracoes[id] || j.pontos;
  return out;
}

export function sortearVariante(cenario, rng = Math.random) {
  const ids = Object.keys(cenario.variantes);
  return ids[Math.min(ids.length - 1, Math.floor(rng() * ids.length))];
}

export function criarContadorScans() {
  const tempos = [];
  let armado = true;
  return {
    registar(t, yawRel) {
      const a = Math.abs(yawRel);
      if (armado && a > LIMIAR_SCAN) {
        tempos.push(t);
        armado = false;
      } else if (!armado && a < LIMIAR_REARME) {
        armado = true;
      }
    },
    total: () => tempos.length,
    entre: (t0, t1) => tempos.filter((t) => t >= t0 && t <= t1).length,
  };
}

export function calcularEstrelas({ scansJanela, atencaoCerta, decisaoCerta }) {
  const scan = scansJanela >= MIN_SCANS;
  const atencao = !!atencaoCerta;
  const decisao = !!decisaoCerta;
  return { scan, atencao, decisao, total: Number(scan) + Number(atencao) + Number(decisao) };
}

export function criarArmazem(storage) {
  let dados = {};
  try {
    const bruto = storage ? storage.getItem(CHAVE_RECORDES) : null;
    const lido = bruto ? JSON.parse(bruto) : null;
    if (lido && typeof lido === 'object') dados = lido;
  } catch {
    dados = {};
  }
  const melhor = (id) => (typeof dados[id] === 'number' ? dados[id] : 0);
  return {
    melhor,
    guardar(id, estrelas) {
      if (estrelas <= melhor(id)) return false;
      dados[id] = estrelas;
      try {
        if (storage) storage.setItem(CHAVE_RECORDES, JSON.stringify(dados));
      } catch {
        // Sem armazenamento: o recorde fica só nesta sessão.
      }
      return true;
    },
  };
}

export function estaDesbloqueado(cenario, armazem) {
  const d = cenario.desbloqueio;
  return !d || armazem.melhor(d.cenario) >= d.estrelas;
}

export function yawParaPonto(de, para) {
  return Math.atan2(de[1] - para[1], para[0] - de[0]);
}
