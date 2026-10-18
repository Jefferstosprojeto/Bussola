// Jogador 3D a partir do modelo da Mixamo: clone com esqueleto, equipamento pintado por peça,
// riscas, número nas costas e animações misturadas. Mesma interface do boneco.js, mais gesto().
import * as THREE from 'three';
import { clone as clonarComEsqueleto } from 'three/addons/utils/SkeletonUtils.js';
import { GESTOS, clipeDisponivel, escolherAnimacao, pecaDaMalha } from './animacao.js';

export const ALTURA_JOGADOR = 1.5;
const MISTURA = 0.25;
const LARGURA_RISCA = 0.07; // unidades da malha da camisola (vem quantizada: cerca de 5 cm)
const MEIO_TRONCO = 0.3; // nas mesmas unidades; fora disto (mangas) não há riscas, para não parecerem argolas
// O número tapa o 7 que vem pintado na textura original, por isso fica um pouco acima e maior.
const ALTURA_NUMERO = 0.73; // fração da altura onde fica o centro do número
const TAMANHO_NUMERO = 0.17; // fração da altura

function encontrarOsso(raiz, re) {
  let achado = null;
  raiz.traverse((o) => { if (!achado && o.isBone && re.test(o.name)) achado = o; });
  return achado ? achado.name : null;
}

export function prepararModelo(gltf) {
  const base = gltf.scene;
  base.updateMatrixWorld(true);
  const caixa = new THREE.Box3().setFromObject(base);
  const altura = caixa.max.y - caixa.min.y;
  const centroX = (caixa.max.x + caixa.min.x) / 2;
  // Costas da camisola: o vértice mais atrás (menor z, o modelo olha para +z) à altura do número.
  let zCostas = Infinity;
  const v = new THREE.Vector3();
  base.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.frustumCulled = false;
    if (pecaDaMalha(o.name) !== 'camisola') return;
    const pos = o.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      // Posição já com o esqueleto: o modelo vem quantizado e as posições cruas não estão em metros.
      o.getVertexPosition(i, v).applyMatrix4(o.matrixWorld);
      const y = (v.y - caixa.min.y) / altura;
      if (Math.abs(v.x - centroX) < 0.05 * altura && Math.abs(y - ALTURA_NUMERO) < 0.05) zCostas = Math.min(zCostas, v.z);
    }
  });
  if (!Number.isFinite(zCostas)) console.warn('jogador3d: costas da camisola não encontradas, jogadores sem número');
  return {
    base,
    escala: ALTURA_JOGADOR / altura,
    chao: caixa.min.y,
    clipes: new Map(gltf.animations.map((c) => [c.name, c])),
    materiais: new Map(),
    osso: encontrarOsso(base, /Spine2$/),
    costas: Number.isFinite(zCostas)
      ? { x: centroX, y: caixa.min.y + ALTURA_NUMERO * altura, z: zCostas - 0.004 * altura, lado: TAMANHO_NUMERO * altura }
      : null,
  };
}

// Material de uma peça para umas cores: a cor multiplica a textura branca do equipamento (mantém pregas e sombras).
function materialPeca(modelo, original, peca, cores) {
  const cor = peca === 'camisola' ? cores.camisola[0] : peca === 'calcoes' ? cores.calcoes : cores.meias || cores.camisola[0];
  const riscas = peca === 'camisola' && cores.camisola.length > 1 ? cores.camisola[1] : null;
  const chave = `${original.uuid}|${cor}|${riscas}`;
  if (modelo.materiais.has(chave)) return modelo.materiais.get(chave);
  const m = original.clone();
  m.color = new THREE.Color(cor);
  if (riscas) {
    const segunda = new THREE.Color(riscas);
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uRisca = { value: segunda };
      shader.uniforms.uLargura = { value: LARGURA_RISCA };
      shader.uniforms.uTronco = { value: MEIO_TRONCO };
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vRiscaX;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRiscaX = position.x;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vRiscaX;\nuniform vec3 uRisca;\nuniform float uLargura;\nuniform float uTronco;')
        .replace('#include <map_fragment>', '#include <map_fragment>\nif (abs(vRiscaX) < uTronco && mod(floor(vRiscaX / uLargura), 2.0) > 0.5) diffuseColor.rgb *= uRisca / max(diffuse, vec3(0.001));');
    };
    m.customProgramCacheKey = () => 'jogador3d-riscas';
  }
  modelo.materiais.set(chave, m);
  return m;
}

function texturaNumero(numero) {
  const tela = document.createElement('canvas');
  tela.width = 128;
  tela.height = 128;
  const ctx = tela.getContext('2d');
  ctx.font = '700 104px Oswald, "Arial Narrow", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#0C2A1E';
  ctx.strokeText(String(numero), 64, 68);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(String(numero), 64, 68);
  const t = new THREE.CanvasTexture(tela);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Cola o número nas costas, preso ao osso do peito para acompanhar a animação.
// Tem de correr antes de o corpo ser rodado e escalado: as costas estão nas coordenadas do modelo original.
function colarNumero(corpo, modelo, numero) {
  const osso = modelo.osso && corpo.getObjectByName(modelo.osso);
  if (!osso || !modelo.costas || numero == null) return null;
  const c = modelo.costas;
  const placa = new THREE.Mesh(
    new THREE.PlaneGeometry(c.lado, c.lado),
    new THREE.MeshBasicMaterial({ map: texturaNumero(numero), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }),
  );
  placa.position.set(c.x, c.y, c.z);
  placa.rotation.y = Math.PI; // virada para trás (-z)
  corpo.add(placa);
  corpo.updateMatrixWorld(true);
  osso.attach(placa);
  return placa;
}

export function criarJogador3d(modelo, { cores, guardaRedes = false, numero = null }) {
  const corpo = clonarComEsqueleto(modelo.base);
  corpo.traverse((o) => {
    if (!o.isMesh) return;
    const peca = pecaDaMalha(o.name);
    if (peca) o.material = materialPeca(modelo, o.material, peca, cores);
    o.castShadow = true;
    o.frustumCulled = false;
  });
  const placa = colarNumero(corpo, modelo, numero);
  corpo.scale.setScalar(modelo.escala);
  corpo.position.y = -modelo.chao * modelo.escala;
  corpo.rotation.y = Math.PI; // o modelo olha para +z; no jogo a frente é -z
  const grupo = new THREE.Group();
  grupo.add(corpo);

  const misturador = new THREE.AnimationMixer(corpo);
  const acoes = new Map();
  const acao = (nome) => {
    if (!acoes.has(nome)) acoes.set(nome, misturador.clipAction(modelo.clipes.get(nome)));
    return acoes.get(nome);
  };
  let atual = null;
  let gesto = null;
  misturador.addEventListener('finished', (ev) => {
    if (gesto && ev.action === acoes.get(gesto.nome)) gesto.terminado = true;
  });

  function mudarPara(nome, ritmo) {
    const real = clipeDisponivel(nome, modelo.clipes);
    if (!real) return;
    const a = acao(real);
    a.timeScale = ritmo;
    if (atual === real) return;
    const g = GESTOS[real];
    a.reset();
    a.setLoop(g && !g.repetir ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    a.clampWhenFinished = true;
    a.setEffectiveWeight(1).fadeIn(MISTURA).play();
    if (atual) acao(atual).fadeOut(MISTURA);
    atual = real;
  }

  return {
    grupo,
    animar(vel, dt) {
      const e = escolherAnimacao({ vel, guardaRedes, gesto });
      mudarPara(e.nome, e.ritmo);
      misturador.update(dt);
    },
    gesto(nome, desvio = 0) {
      const g = GESTOS[nome];
      if (!g || !modelo.clipes.has(nome)) return;
      gesto = { nome, repetir: g.repetir, terminado: false };
      if (atual === nome) atual = null; // o mesmo gesto outra vez recomeça
      mudarPara(nome, 1);
      acao(nome).time = desvio;
    },
    libertar() {
      misturador.stopAllAction();
      misturador.uncacheRoot(corpo);
      // Geometria e materiais são partilhados entre jogadores: só se liberta o que é deste jogador.
      // Cada clone tem esqueletos próprios, e o renderizador cria uma textura de ossos para cada um.
      corpo.traverse((o) => { if (o.isSkinnedMesh) o.skeleton.dispose(); });
      if (placa) {
        placa.material.map.dispose();
        placa.material.dispose();
        placa.geometry.dispose();
      }
    },
  };
}
