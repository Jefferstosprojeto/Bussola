// Motor 3D do jogo: estádio, torcida, jogadores, bola, câmara na 1ª pessoa, relógio, câmara lenta,
// momentos (gestos, golo, perda), qualidade automática e gravação para a repetição.
import * as THREE from 'three';
import { CAMPO } from './cenarios.js';
import { construirCampo } from './campo.js';
import { construirEstadio } from './estadio.js';
import { gerarLugares } from './bancadas.js';
import { criarTorcida } from './torcida.js';
import { criarBola, RAIO_BOLA } from './bola.js';
import { criarBoneco } from './boneco.js';
import { criarJogador3d } from './jogador3d.js';
import { CONTACTO } from './animacao.js';
import { criarOlhar } from './olhar.js';
import { agendarGestos, dispararAte, pontoDeFuga, reacoesDoEvento, reacoesDoFim } from './momentos.js';
import { criarMedidorFps } from './qualidade.js';
import { alturaEm, alvoCamara, pitchParaBola, posicaoEm, trajetoriasDaVariante, yawParaPonto } from './regras.js';
import { criarReacao } from './adversarios.js';

const ALTURA_OLHOS = 1.4;
const ABRANDAR = 0.6;
const ESCALA_MIN = 0.08;
const PASSO_GRAVACAO = 0.1;
const BALANCO = 0.04;
const DT_MAX = 0.05;
const DIST_MIN_ARTHUR = 1.3;
const TEMPO_FESTEJO = 2.2;
const ALVO_FESTEJO = [64, 17.5]; // a bancada atrás da baliza adversária
const PITCH_FESTEJO = 0.12;
const DIST_BOLA_LADRAO = 0.7;
const VEL_TREMOR = 5;
const TREMOR = 0.012;

const CORES = {
  nos: { camisola: ['#1B5C3E', '#FFFFFF'], calcoes: '#FFFFFF', meias: '#1B5C3E' },
  eles: { camisola: ['#C2493B'], calcoes: '#3A1410', meias: '#C2493B' },
  grNos: { camisola: ['#E2932E'], calcoes: '#1A1A1A', meias: '#E2932E' },
  grEles: { camisola: ['#6A4FB5'], calcoes: '#1A1A1A', meias: '#6A4FB5' },
};
const NUMEROS = {
  'n-gr': 1, 'n-de': 2, 'n-dc': 4, 'n-dd': 3, 'n-mc': 8, 'n-ad': 9,
  'e-gr': 1, 'e-lat': 2, 'e-cen': 4, 'e-lat2': 3, 'e-med': 6, 'e-av1': 9, 'e-av2': 11,
};

const paraMundo = (x, z) => [x - CAMPO.comprimento / 2, z - CAMPO.largura / 2];
const normalizar = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const ordenar = (eventos) => [...(eventos || [])].sort((a, b) => a.t - b.t);

export function criarMotor(canvas, { modelo = null, som = null, giroscopio = null } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch {
    throw new Error('sem-webgl');
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const cena = new THREE.Scene();
  const estadio = construirEstadio(cena, CAMPO);
  const campo = construirCampo(CAMPO);
  cena.add(campo.grupo);
  const torcida = criarTorcida(cena, gerarLugares(CAMPO), CAMPO);
  const bola = criarBola(cena);

  const camara = new THREE.PerspectiveCamera(65, 1, 0.05, 400);
  camara.position.set(0, 30, 32);
  camara.lookAt(0, 0, 0);
  camara.rotation.order = 'YXZ';

  const olhar = criarOlhar(canvas, giroscopio);
  const medidor = criarMedidorFps();
  const bonecos = new Map();
  const relogio = new THREE.Clock();
  let estado = null;
  let pausado = false;
  let largura = 0;
  let altura = 0;

  document.addEventListener('visibilitychange', () => {
    pausado = document.hidden;
    relogio.getDelta();
  });

  function ajustarTamanho() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === largura && h === altura) return;
    largura = w;
    altura = h;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.fov = camara.aspect < 1 ? 85 : 65;
    camara.updateProjectionMatrix();
  }

  function fabricarJogador(id, j) {
    const cores = j.guardaRedes ? (j.equipa === 'nos' ? CORES.grNos : CORES.grEles) : CORES[j.equipa];
    if (modelo) {
      try {
        return criarJogador3d(modelo, { cores, guardaRedes: !!j.guardaRedes, numero: NUMEROS[id] ?? null });
      } catch {
        // Se o modelo falhar a meio, este jogador fica com o boneco simples.
      }
    }
    return criarBoneco(cores);
  }

  function limparBonecos() {
    for (const { boneco } of bonecos.values()) {
      cena.remove(boneco.grupo);
      boneco.libertar();
    }
    bonecos.clear();
  }

  function colocarBola(p, alturaBola) {
    const [wx, wz] = paraMundo(p[0], p[1]);
    bola.colocar(wx, wz, alturaBola);
    estado.bola = p;
  }

  function colocarJogador(id, p, dt) {
    const b = bonecos.get(id);
    if (!b) return;
    const dx = p[0] - b.ultima[0];
    const dz = p[1] - b.ultima[1];
    const vel = dt > 0 ? Math.hypot(dx, dz) / dt : 0;
    const [wx, wz] = paraMundo(p[0], p[1]);
    b.boneco.grupo.position.set(wx, 0, wz);
    b.rumo = vel > 0.3 ? Math.atan2(-dz, dx) : yawParaPonto(p, estado.bola);
    b.boneco.grupo.rotation.y = b.rumo - Math.PI / 2;
    b.boneco.animar(vel, dt);
    b.ultima = p;
  }

  function moverArthur(p, dt) {
    const e = estado;
    const vel = dt > 0 ? Math.hypot(p[0] - e.arthur[0], p[1] - e.arthur[1]) / dt : 0;
    e.passo += vel * dt * 2.2;
    e.velArthur = vel;
    e.arthur = p;
  }
  function gravar(t, fase) {
    const e = estado;
    if (t < e.proximaGravacao) return;
    e.proximaGravacao = t + PASSO_GRAVACAO;
    const pos = { arthur: e.arthur };
    for (const [id, b] of bonecos) pos[id] = b.ultima;
    e.frames.push({ t, fase, pos, bola: e.bola });
  }

  function aplicar(a) {
    const e = estado;
    if (a.acao === 'gesto') bonecos.get(a.jogador)?.boneco.gesto(a.nome, a.desvio || 0);
    else if (a.acao === 'torcida') torcida.reagir(a.tipo);
    else if (a.acao === 'som') som?.tocar(a.nome);
    else if (a.acao === 'golo') {
      e.golo = true;
      campo.abanarRede();
      e.callbacks.aoGolo?.();
    } else if (a.acao === 'roubar') {
      const p = e.reacao?.posicao(a.jogador) || bonecos.get(a.jogador)?.ultima;
      if (p && e.reacao) {
        e.ladrao = a.jogador;
        e.reacao.redirecionar(a.jogador, pontoDeFuga(p), p);
      }
    }
  }

  // Dispara os gestos agendados e os eventos que o relógio já passou (cada um uma só vez).
  function disparar(t) {
    const e = estado;
    const g = dispararAte(e.agenda, e.iAgenda, t);
    e.iAgenda = g.indice;
    for (const x of g.disparados) aplicar({ acao: 'gesto', jogador: x.jogador, nome: x.nome, desvio: x.desvio });
    const v = dispararAte(e.eventos, e.iEventos, t);
    e.iEventos = v.indice;
    for (const ev of v.disparados) for (const a of reacoesDoEvento(ev, e.eventos, e.cenario.jogadores)) aplicar(a);
  }

  function passoLance(dtReal) {
    const e = estado;
    const c = e.cenario;
    const falta = c.congelaEm - e.t;
    const escala = falta < ABRANDAR ? Math.max(ESCALA_MIN, falta / ABRANDAR) : 1;
    const dt = dtReal * escala;
    e.t = Math.min(c.congelaEm, e.t + dt);
    colocarBola(posicaoEm(c.bola, e.t), alturaEm(c.bola, e.t));
    moverArthur(posicaoEm(e.traj.arthur, e.t), dt);
    for (const id of bonecos.keys()) colocarJogador(id, posicaoEm(e.traj[id], e.t), dt);
    disparar(e.t);
    e.yawCam = e.base + olhar.yawRel;
    e.pitch = olhar.pitch;
    if (e.callbacks.aoOlhar) e.callbacks.aoOlhar(e.t, olhar.yawRel);
    gravar(e.t, 'lance');
    if (e.t >= c.congelaEm) {
      e.fase = 'congelado';
      olhar.ativo = false;
      if (e.callbacks.aoCongelar) e.callbacks.aoCongelar();
    }
  }

  // Na consequência, ninguém fica em cima da câmara: empurra para fora até DIST_MIN_ARTHUR.
  function afastarDeArthur(p) {
    const a = estado.arthur;
    const dx = p[0] - a[0];
    const dz = p[1] - a[1];
    const d = Math.hypot(dx, dz);
    if (d >= DIST_MIN_ARTHUR) return p;
    if (d < 1e-6) {
      const y = estado.yawCam;
      return [a[0] - Math.cos(y) * DIST_MIN_ARTHUR, a[1] + Math.sin(y) * DIST_MIN_ARTHUR];
    }
    return [a[0] + (dx / d) * DIST_MIN_ARTHUR, a[1] + (dz / d) * DIST_MIN_ARTHUR];
  }

  function passoConsequencia(dt) {
    const e = estado;
    const k = e.cons;
    const fim = k.duracao + (e.golo ? TEMPO_FESTEJO : 0);
    e.tc = Math.min(fim, e.tc + dt);
    const t = Math.min(e.tc, k.duracao);
    if (!e.ladrao) colocarBola(posicaoEm(k.bola, t), alturaEm(k.bola, t));
    moverArthur(posicaoEm(k.nos.arthur, t), dt);
    e.reacao.atualizar(dt, { arthur: e.arthur, bola: e.bola });
    for (const id of bonecos.keys()) {
      const p = k.nos[id] ? posicaoEm(k.nos[id], t) : e.reacao.posicao(id) || e.congelado[id];
      colocarJogador(id, afastarDeArthur(p), dt);
    }
    // Quem roubou leva a bola à frente dos pés.
    if (e.ladrao) {
      const b = bonecos.get(e.ladrao);
      if (b) colocarBola([b.ultima[0] + Math.cos(b.rumo) * DIST_BOLA_LADRAO, b.ultima[1] - Math.sin(b.rumo) * DIST_BOLA_LADRAO], 0);
    }
    disparar(t);
    if (t >= k.duracao && !e.fimDisparado) {
      e.fimDisparado = true;
      for (const a of reacoesDoFim(k)) aplicar(a);
    }

    // Câmara: no golo vira para a bancada; numa perda segue a bola; senão segue o lance.
    let alvo;
    if (e.golo) alvo = ALVO_FESTEJO;
    else if (e.ladrao) alvo = e.bola;
    else alvo = alvoCamara(k.bola, t, e.arthur);
    if (alvo && Math.hypot(alvo[0] - e.arthur[0], alvo[1] - e.arthur[1]) > 0.5) e.alvoYaw = yawParaPonto(e.arthur, alvo);
    const suave = Math.min(1, dt * (e.golo ? 2.5 : 4));
    e.yawCam += normalizar(e.alvoYaw - e.yawCam) * suave;
    const distBola = Math.hypot(e.bola[0] - e.arthur[0], e.bola[1] - e.arthur[1]);
    const alvoPitch = e.golo ? PITCH_FESTEJO : pitchParaBola(distBola, ALTURA_OLHOS, RAIO_BOLA);
    e.pitch += (alvoPitch - e.pitch) * suave;
    gravar(e.cenario.congelaEm + e.tc, 'consequencia');
    if (e.tc >= fim) {
      e.fase = 'fim';
      if (e.callbacks.aoTerminar) e.callbacks.aoTerminar(e.frames);
    }
  }

  function atualizarCamara() {
    const e = estado;
    const [wx, wz] = paraMundo(e.arthur[0], e.arthur[1]);
    const balanco = Math.sin(e.passo) * BALANCO * Math.min(e.velArthur / 6, 1);
    // Leve tremor no sprint.
    const tremor = e.velArthur > VEL_TREMOR ? TREMOR : 0;
    camara.position.set(wx + (Math.random() - 0.5) * tremor, ALTURA_OLHOS + balanco + (Math.random() - 0.5) * tremor, wz);
    camara.rotation.y = e.yawCam - Math.PI / 2;
    camara.rotation.x = e.pitch;
  }

  function quadro() {
    requestAnimationFrame(quadro);
    ajustarTamanho();
    const dtReal = pausado ? 0 : Math.min(relogio.getDelta(), DT_MAX);
    olhar.atualizar(dtReal);
    torcida.atualizar(dtReal);
    campo.atualizar(dtReal);
    if (estado) {
      const emJogo = estado.fase === 'lance' || estado.fase === 'consequencia';
      if (estado.fase === 'lance') passoLance(dtReal);
      else if (estado.fase === 'consequencia') passoConsequencia(dtReal);
      if (estado) atualizarCamara();
      if (emJogo && medidor.registar(dtReal)) {
        torcida.definirQualidade('baixa');
        estadio.definirSombras(false);
      }
    }
    renderer.render(cena, camara);
  }
  requestAnimationFrame(quadro);

  return {
    jogar(cenario, varianteId, callbacks = {}) {
      limparBonecos();
      const traj = trajetoriasDaVariante(cenario, varianteId);
      for (const [id, j] of Object.entries(cenario.jogadores)) {
        if (id === 'arthur') continue;
        const boneco = fabricarJogador(id, j);
        cena.add(boneco.grupo);
        bonecos.set(id, { boneco, ultima: posicaoEm(traj[id], 0), rumo: 0 });
      }
      const base = (cenario.direcaoBase * Math.PI) / 180;
      olhar.reiniciar();
      olhar.ativo = true;
      bola.reiniciar();
      const eventos = ordenar(cenario.eventos);
      estado = {
        fase: 'lance', cenario, variante: cenario.variantes[varianteId], traj, callbacks,
        t: 0, tc: 0, base, yawCam: base, pitch: 0,
        arthur: posicaoEm(traj.arthur, 0), velArthur: 0, passo: 0,
        bola: posicaoEm(cenario.bola, 0), frames: [], proximaGravacao: 0,
        cons: null, reacao: null, congelado: null, alvoYaw: base,
        eventos, iEventos: 0, agenda: agendarGestos(eventos, CONTACTO), iAgenda: 0,
        golo: false, ladrao: null, fimDisparado: false,
      };
      som?.iniciarAmbiente();
      som?.tocar('apito');
      relogio.getDelta();
    },
    continuar(opcaoId, callbacks = {}) {
      const e = estado;
      if (!e || e.fase !== 'congelado') return;
      e.cons = e.variante.consequencias[opcaoId];
      e.congelado = {};
      for (const id of Object.keys(e.traj)) e.congelado[id] = posicaoEm(e.traj[id], e.cenario.congelaEm);
      e.reacao = criarReacao(e.cons.adversarios || {}, e.congelado);
      e.callbacks = callbacks;
      e.tc = 0;
      e.alvoYaw = e.yawCam;
      e.eventos = ordenar(e.cons.eventos);
      e.iEventos = 0;
      e.agenda = agendarGestos(e.eventos, CONTACTO);
      e.iAgenda = 0;
      e.golo = false;
      e.ladrao = null;
      e.fimDisparado = false;
      e.fase = 'consequencia';
      relogio.getDelta();
    },
    parar() {
      estado = null;
      olhar.ativo = false;
      som?.pararAmbiente();
      limparBonecos();
    },
  };
}
