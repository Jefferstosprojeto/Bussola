// Escolha da animação de cada jogador e peças do equipamento. Funções puras, sem 3D.

export const VEL_PARADO = 0.4;
export const VEL_SPRINT = 5;
export const VEL_LARGA_GESTO = 1.5;
const VEL_CLIPE_CORRIDA = 3.5;
const VEL_CLIPE_SPRINT = 6.5;

export const GESTOS = {
  passe: { repetir: false },
  remate: { repetir: false },
  cabeca: { repetir: false },
  'gr-defesa': { repetir: false },
  desarme: { repetir: false },
  festejo: { repetir: true },
  desanimo: { repetir: true },
  aplauso: { repetir: true },
};

// Segundos desde o início do clipe até o pé (ou as mãos) tocarem na bola. Afinados na Tarefa 13.
export const CONTACTO = { passe: 0.45, remate: 0.9, 'gr-defesa': 0.5, desarme: 0.6 };

const RESERVA = { 'gr-parado': 'parado', sprint: 'correr' };

const limitar = (v, a, b) => Math.max(a, Math.min(b, v));

export function escolherAnimacao({ vel, guardaRedes, gesto }) {
  if (gesto && !gesto.terminado && (!gesto.repetir || vel < VEL_LARGA_GESTO)) return { nome: gesto.nome, ritmo: 1 };
  if (vel < VEL_PARADO) return { nome: guardaRedes ? 'gr-parado' : 'parado', ritmo: 1 };
  if (vel < VEL_SPRINT) return { nome: 'correr', ritmo: limitar(vel / VEL_CLIPE_CORRIDA, 0.6, 1.5) };
  return { nome: 'sprint', ritmo: limitar(vel / VEL_CLIPE_SPRINT, 0.8, 1.3) };
}

export function clipeDisponivel(nome, clipes) {
  if (clipes.has(nome)) return nome;
  const reserva = RESERVA[nome];
  return reserva && clipes.has(reserva) ? reserva : null;
}

const PECAS = [[/_Shirt$/i, 'camisola'], [/_Shorts$/i, 'calcoes'], [/_Socks$/i, 'meias']];

export function pecaDaMalha(nome) {
  for (const [re, peca] of PECAS) if (re.test(nome || '')) return peca;
  return null;
}
