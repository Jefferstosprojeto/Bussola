// Motor 3D do jogo: cena, jogadores, bola, câmara na 1ª pessoa, relógio, câmara lenta e gravação.
import * as THREE from 'three';
import { CAMPO } from './cenarios.js';
import { construirCampo } from './campo.js';
import { criarBoneco } from './boneco.js';
import { criarOlhar } from './olhar.js';
import { posicaoEm, trajetoriasDaVariante, yawParaPonto } from './regras.js';
import { criarReacao } from './adversarios.js';

const ALTURA_OLHOS = 1.4;
const RAIO_BOLA = 0.11;
const ABRANDAR = 0.6;
const ESCALA_MIN = 0.08;
const PASSO_GRAVACAO = 0.1;
const BALANCO = 0.04;
const DT_MAX = 0.05;

const CORES = {
  nos: { camisola: ['#1B5C3E', '#FFFFFF'], calcoes: '#FFFFFF' },
  eles: { camisola: ['#C2493B'], calcoes: '#3A1410' },
  grNos: { camisola: ['#E2932E'], calcoes: '#1A1A1A' },
  grEles: { camisola: ['#6A4FB5'], calcoes: '#1A1A1A' },
};

const paraMundo = (x, z) => [x - CAMPO.comprimento / 2, z - CAMPO.largura / 2];
const normalizar = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export function criarMotor(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch {
    throw new Error('sem-webgl');
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const cena = new THREE.Scene();
  cena.background = new THREE.Color('#9FD3F5');
  cena.fog = new THREE.Fog('#9FD3F5', 60, 140);
  cena.add(new THREE.HemisphereLight('#FFFFFF', '#2A5A2A', 1.1));
  const sol = new THREE.DirectionalLight('#FFFFFF', 1.4);
  sol.position.set(-20, 40, 10);
  cena.add(sol);
  cena.add(construirCampo(CAMPO));

  const bola = new THREE.Mesh(
    new THREE.SphereGeometry(RAIO_BOLA, 20, 14),
    new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.5 }),
  );
  cena.add(bola);

  const camara = new THREE.PerspectiveCamera(65, 1, 0.05, 200);
  camara.position.set(0, 30, 32);
  camara.lookAt(0, 0, 0);
  camara.rotation.order = 'YXZ';

  const olhar = criarOlhar(canvas);
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

  function limparBonecos() {
    for (const { boneco } of bonecos.values()) {
      cena.remove(boneco.grupo);
      boneco.libertar();
    }
    bonecos.clear();
  }

  function colocarBola(p) {
    const [wx, wz] = paraMundo(p[0], p[1]);
    bola.position.set(wx, RAIO_BOLA, wz);
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
    const rumo = vel > 0.3 ? Math.atan2(-dz, dx) : yawParaPonto(p, estado.bola);
    b.boneco.grupo.rotation.y = rumo - Math.PI / 2;
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

  function passoLance(dtReal) {
    const e = estado;
    const c = e.cenario;
    const falta = c.congelaEm - e.t;
    const escala = falta < ABRANDAR ? Math.max(ESCALA_MIN, falta / ABRANDAR) : 1;
    const dt = dtReal * escala;
    e.t = Math.min(c.congelaEm, e.t + dt);
    colocarBola(posicaoEm(c.bola, e.t));
    moverArthur(posicaoEm(e.traj.arthur, e.t), dt);
    for (const id of bonecos.keys()) colocarJogador(id, posicaoEm(e.traj[id], e.t), dt);
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

  function passoConsequencia(dt) {
    const e = estado;
    const k = e.cons;
    e.tc = Math.min(k.duracao, e.tc + dt);
    const pBola = posicaoEm(k.bola, e.tc);
    colocarBola(pBola);
    moverArthur(posicaoEm(k.nos.arthur, e.tc), dt);
    e.reacao.atualizar(dt, { arthur: e.arthur, bola: pBola });
    for (const id of bonecos.keys()) {
      const p = k.nos[id] ? posicaoEm(k.nos[id], e.tc) : e.reacao.posicao(id) || e.congelado[id];
      colocarJogador(id, p, dt);
    }
    if (Math.hypot(pBola[0] - e.arthur[0], pBola[1] - e.arthur[1]) > 1.5) {
      const alvo = yawParaPonto(e.arthur, pBola);
      e.yawCam += normalizar(alvo - e.yawCam) * Math.min(1, dt * 4);
    }
    e.pitch += (-0.08 - e.pitch) * Math.min(1, dt * 4);
    gravar(e.cenario.congelaEm + e.tc, 'consequencia');
    if (e.tc >= k.duracao) {
      e.fase = 'fim';
      if (e.callbacks.aoTerminar) e.callbacks.aoTerminar(e.frames);
    }
  }

  function atualizarCamara() {
    const e = estado;
    const [wx, wz] = paraMundo(e.arthur[0], e.arthur[1]);
    const balanco = Math.sin(e.passo) * BALANCO * Math.min(e.velArthur / 6, 1);
    camara.position.set(wx, ALTURA_OLHOS + balanco, wz);
    camara.rotation.y = e.yawCam - Math.PI / 2;
    camara.rotation.x = e.pitch;
  }

  function quadro() {
    requestAnimationFrame(quadro);
    ajustarTamanho();
    const dtReal = pausado ? 0 : Math.min(relogio.getDelta(), DT_MAX);
    olhar.atualizar(dtReal);
    if (estado) {
      if (estado.fase === 'lance') passoLance(dtReal);
      else if (estado.fase === 'consequencia') passoConsequencia(dtReal);
      if (estado) atualizarCamara();
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
        const cores = j.guardaRedes ? (j.equipa === 'nos' ? CORES.grNos : CORES.grEles) : CORES[j.equipa];
        const boneco = criarBoneco(cores);
        cena.add(boneco.grupo);
        bonecos.set(id, { boneco, ultima: posicaoEm(traj[id], 0) });
      }
      const base = (cenario.direcaoBase * Math.PI) / 180;
      olhar.reiniciar();
      olhar.ativo = true;
      estado = {
        fase: 'lance', cenario, variante: cenario.variantes[varianteId], traj, callbacks,
        t: 0, tc: 0, base, yawCam: base, pitch: 0,
        arthur: posicaoEm(traj.arthur, 0), velArthur: 0, passo: 0,
        bola: posicaoEm(cenario.bola, 0), frames: [], proximaGravacao: 0,
        cons: null, reacao: null, congelado: null,
      };
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
      e.fase = 'consequencia';
      relogio.getDelta();
    },
    parar() {
      estado = null;
      olhar.ativo = false;
      limparBonecos();
    },
  };
}
