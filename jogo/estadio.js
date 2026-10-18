// Estádio de fim de tarde: céu, luz baixa com sombras, bancadas em degraus, cobertura, publicidade e torres.
import * as THREE from 'three';
import { BANCADAS, PROFUNDIDADE_FILA, SUBIDA_FILA, ALTURA_BASE, geometriaBancada } from './bancadas.js';

const TEXTOS_PUBLICIDADE = ['BÚSSOLA DO AVANÇADO', 'VAMOS VITÓRIA!'];

function ceu(cena) {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      cimo: { value: new THREE.Color('#3E6FB8') },
      horizonte: { value: new THREE.Color('#F4B57C') },
      baixo: { value: new THREE.Color('#C98A5E') },
    },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 cimo; uniform vec3 horizonte; uniform vec3 baixo; varying vec3 vP;
      void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(horizonte, cimo, pow(h, 0.55)) : mix(horizonte, baixo, min(1.0, -h * 4.0));
      gl_FragColor = vec4(c, 1.0); }`,
  });
  cena.add(new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), material));

  // Nuvens: manchas suaves desenhadas em canvas.
  const tela = document.createElement('canvas');
  tela.width = 256;
  tela.height = 128;
  const ctx = tela.getContext('2d');
  for (let i = 0; i < 14; i++) {
    const x = 40 + Math.random() * 176;
    const y = 50 + Math.random() * 40;
    const r = 18 + Math.random() * 26;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,240,225,0.85)');
    g.addColorStop(1, 'rgba(255,240,225,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 128);
  }
  const tex = new THREE.CanvasTexture(tela);
  tex.colorSpace = THREE.SRGBColorSpace;
  for (let i = 0; i < 9; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
    const a = (i / 9) * Math.PI * 2 + Math.random() * 0.4;
    s.position.set(Math.cos(a) * 220, 55 + Math.random() * 45, Math.sin(a) * 220);
    s.scale.set(90, 40, 1);
    cena.add(s);
  }
}

function texturaPublicidade() {
  const tela = document.createElement('canvas');
  tela.width = 2048;
  tela.height = 64;
  const ctx = tela.getContext('2d');
  const n = 6;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 ? '#E2932E' : '#1B5C3E';
    ctx.fillRect((i * 2048) / n, 0, 2048 / n + 1, 64);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 38px Oswald, "Arial Narrow", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(TEXTOS_PUBLICIDADE[i % 2], ((i + 0.5) * 2048) / n, 34, 2048 / n - 24);
  }
  const t = new THREE.CanvasTexture(tela);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

export function construirEstadio(cena, campo) {
  const C = campo.comprimento;
  const L = campo.largura;
  const mundo = (x, z) => [x - C / 2, z - L / 2];

  cena.background = new THREE.Color('#F4B57C');
  cena.fog = new THREE.Fog('#E9B48A', 110, 280);
  ceu(cena);

  cena.add(new THREE.HemisphereLight('#CFE3FF', '#4A6B3A', 0.9));
  const sol = new THREE.DirectionalLight('#FFD2A0', 2.4);
  sol.position.set(-60, 30, -35);
  sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024);
  Object.assign(sol.shadow.camera, { left: -40, right: 40, top: 30, bottom: -30, near: 1, far: 160 });
  sol.shadow.bias = -0.0004;
  sol.shadow.normalBias = 0.02;
  cena.add(sol, sol.target);

  // Chão do estádio à volta do relvado.
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(220, 200), new THREE.MeshLambertMaterial({ color: '#3B4A3A' }));
  chao.rotation.x = -Math.PI / 2;
  chao.position.y = -0.05;
  cena.add(chao);

  // Bancadas em degraus: cada fila é um bloco do chão até ao seu degrau.
  const betao = new THREE.MeshLambertMaterial({ color: '#8C969A' });
  const cadeirasVerdes = new THREE.MeshLambertMaterial({ color: '#1B5C3E' });
  const cadeirasBrancas = new THREE.MeshLambertMaterial({ color: '#E8ECEA' });
  for (const b of BANCADAS) {
    const g = geometriaBancada(b, campo);
    const comprimento = g.fim - g.inicio;
    const meio = (g.inicio + g.fim) / 2;
    for (let fila = 0; fila < b.filas; fila++) {
      const altura = ALTURA_BASE + (fila + 1) * SUBIDA_FILA;
      const fixo = g.base + b.lado * (fila + 0.5) * PROFUNDIDADE_FILA;
      const material = fila === 0 ? betao : fila % 2 ? cadeirasVerdes : cadeirasBrancas;
      const caixa = b.eixo === 'x'
        ? new THREE.BoxGeometry(comprimento, altura, PROFUNDIDADE_FILA)
        : new THREE.BoxGeometry(PROFUNDIDADE_FILA, altura, comprimento);
      const m = new THREE.Mesh(caixa, material);
      const [wx, wz] = b.eixo === 'x' ? mundo(meio, fixo) : mundo(fixo, meio);
      m.position.set(wx, altura / 2, wz);
      cena.add(m);
    }
    if (b.cobertura) {
      const topo = ALTURA_BASE + (b.filas + 1) * SUBIDA_FILA;
      const fundo = b.filas * PROFUNDIDADE_FILA + 3;
      const telhado = new THREE.Mesh(
        new THREE.BoxGeometry(comprimento + 2, 0.3, fundo),
        new THREE.MeshLambertMaterial({ color: '#D9DDE0' }),
      );
      const [wx, wz] = mundo(meio, g.base + b.lado * (fundo / 2 - 1.5));
      telhado.position.set(wx, topo + 4.5, wz);
      telhado.rotation.x = b.lado * 0.08;
      cena.add(telhado);
      const pilar = new THREE.MeshLambertMaterial({ color: '#6E777B' });
      for (let k = 0; k <= 6; k++) {
        const [px, pz] = mundo(g.inicio + (k / 6) * comprimento, g.base + b.lado * (b.filas * PROFUNDIDADE_FILA + 0.5));
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, topo + 4.5, 8), pilar);
        p.position.set(px, (topo + 4.5) / 2, pz);
        cena.add(p);
      }
    }
  }

  // Placas de publicidade a 3 m das linhas, viradas para o campo.
  const tex = texturaPublicidade();
  const placa = (comprimento, x, z, rotY) => {
    const t = tex.clone();
    t.needsUpdate = true;
    t.repeat.set(comprimento / 40, 1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(comprimento, 0.9), new THREE.MeshBasicMaterial({ map: t }));
    const [wx, wz] = mundo(x, z);
    m.position.set(wx, 0.45, wz);
    m.rotation.y = rotY;
    cena.add(m);
  };
  placa(C + 6, C / 2, -3, 0);
  placa(C + 6, C / 2, L + 3, Math.PI);
  placa(L + 6, -3, L / 2, Math.PI / 2);
  placa(L + 6, C + 3, L / 2, -Math.PI / 2);

  // Torres de iluminação nos cantos, com o painel virado para o centro.
  const metal = new THREE.MeshLambertMaterial({ color: '#7A8287' });
  const luz = new THREE.MeshBasicMaterial({ color: '#FFF6D8' });
  for (const [x, z] of [[-16, -16], [C + 16, -16], [-16, L + 16], [C + 16, L + 16]]) {
    const [wx, wz] = mundo(x, z);
    const torre = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 28, 8), metal);
    torre.position.set(wx, 14, wz);
    const painel = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 0.4), luz);
    painel.position.set(wx, 28.5, wz);
    painel.lookAt(0, 0, 0);
    cena.add(torre, painel);
  }

  return {
    sol,
    definirSombras(ligadas) {
      sol.castShadow = ligadas;
    },
  };
}
