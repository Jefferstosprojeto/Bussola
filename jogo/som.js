// Som do estádio com Web Audio: ciclos de ambiente e efeitos. Sem som (bloqueado ou ficheiros em falta), o jogo segue.

export const SONS = {
  estadio: 'jogo/sons/estadio.mp3',
  canticos: 'jogo/sons/canticos.mp3',
  apito: 'jogo/sons/apito.mp3',
  golo: 'jogo/sons/golo.mp3',
  uuuh: 'jogo/sons/uuuh.mp3',
  aplauso: 'jogo/sons/aplauso.mp3',
};
export const VOLUMES = { estadio: 0.45, canticos: 0.22, apito: 0.7, golo: 1, uuuh: 0.85, aplauso: 0.75 };
export const CICLOS = ['estadio', 'canticos'];

export function criarSom({ ligado = true, janela = globalThis, buscar = (url) => janela.fetch(url) } = {}) {
  const Contexto = janela.AudioContext || janela.webkitAudioContext;
  const buffers = new Map();
  const ciclos = [];
  let ctx = null;
  let mestre = null;
  let estaLigado = ligado;
  let ambiente = false;

  function contexto() {
    if (ctx || !Contexto) return ctx;
    try {
      ctx = new Contexto();
      mestre = ctx.createGain();
      mestre.gain.value = estaLigado ? 1 : 0;
      mestre.connect(ctx.destination);
    } catch {
      ctx = null;
    }
    return ctx;
  }

  async function carregarUm(nome) {
    const c = contexto();
    if (!c) return;
    try {
      const r = await buscar(SONS[nome]);
      if (!r.ok) return;
      const dados = await r.arrayBuffer();
      // Forma com funções de retorno: funciona também no Safari antigo.
      buffers.set(nome, await new Promise((ok, falha) => c.decodeAudioData(dados, ok, falha)));
    } catch {
      // Fica sem este som.
    }
  }

  function fonte(nome, repetir) {
    const b = buffers.get(nome);
    if (!ctx || !b) return null;
    const f = ctx.createBufferSource();
    f.buffer = b;
    f.loop = repetir;
    const g = ctx.createGain();
    g.gain.value = VOLUMES[nome] ?? 1;
    f.connect(g).connect(mestre);
    f.start();
    return f;
  }

  return {
    async carregar(aoProgresso = () => {}) {
      const nomes = Object.keys(SONS);
      let feitos = 0;
      await Promise.all(nomes.map((n) => carregarUm(n).then(() => aoProgresso(++feitos / nomes.length))));
    },
    // Chamar num toque ou tecla: o iPhone só deixa tocar depois de um gesto do utilizador.
    desbloquear() {
      const c = contexto();
      if (c && c.state === 'suspended') c.resume().catch(() => {});
    },
    tocar(nome) {
      try {
        fonte(nome, false);
      } catch {
        // Sem som não há erro.
      }
    },
    iniciarAmbiente() {
      if (ambiente) return;
      ambiente = true;
      for (const n of CICLOS) {
        try {
          const f = fonte(n, true);
          if (f) ciclos.push(f);
        } catch {
          // Sem este ciclo.
        }
      }
    },
    pararAmbiente() {
      ambiente = false;
      for (const f of ciclos.splice(0)) {
        try {
          f.stop();
        } catch {
          // Já parado.
        }
      }
    },
    definirLigado(v) {
      estaLigado = !!v;
      if (mestre) mestre.gain.value = estaLigado ? 1 : 0;
    },
    get ligado() {
      return estaLigado;
    },
  };
}
