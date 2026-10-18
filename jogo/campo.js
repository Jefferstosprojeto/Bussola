// Campo de futebol de 7 em 3D: relva com riscas e grão, linhas, áreas e balizas com rede que abana no golo.
import * as THREE from 'three';

const LARGURA_LINHA = 0.12;
const AREA_FUNDO = 9;
const AREA_LARGURA = 20;
const BALIZA_LARGURA = 6;
const BALIZA_ALTURA = 2;

function texturaRelva(n) {
  const tela = document.createElement('canvas');
  tela.width = 1024;
  tela.height = 1024;
  const ctx = tela.getContext('2d');
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 ? '#3A8A45' : '#45994F';
    ctx.fillRect((i * tela.width) / n, 0, tela.width / n + 1, tela.height);
  }
  // Grão da relva: pontos claros e escuros aleatórios.
  for (let k = 0; k < 60000; k++) {
    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
    ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
  }
  const t = new THREE.CanvasTexture(tela);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function texturaRede() {
  const tela = document.createElement('canvas');
  tela.width = 64;
  tela.height = 64;
  const ctx = tela.getContext('2d');
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(tela);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function construirCampo({ comprimento: C, largura: L }) {
  const g = new THREE.Group();
  const p = (x, z) => [x - C / 2, z - L / 2];
  const branco = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });

  const fora = new THREE.Mesh(new THREE.PlaneGeometry(C + 24, L + 20), new THREE.MeshLambertMaterial({ color: '#357A40' }));
  fora.rotation.x = -Math.PI / 2;
  fora.position.y = -0.02;
  fora.receiveShadow = true;
  g.add(fora);

  const relva = new THREE.Mesh(new THREE.PlaneGeometry(C, L), new THREE.MeshLambertMaterial({ map: texturaRelva(11) }));
  relva.rotation.x = -Math.PI / 2;
  relva.receiveShadow = true;
  g.add(relva);

  const faixa = (xa, za, xb, zb) => {
    const [ax, az] = p(xa, za);
    const [bx, bz] = p(xb, zb);
    const comp = Math.hypot(bx - ax, bz - az);
    const m = new THREE.Mesh(new THREE.BoxGeometry(comp + LARGURA_LINHA, 0.01, LARGURA_LINHA), branco);
    m.position.set((ax + bx) / 2, 0.005, (az + bz) / 2);
    m.rotation.y = Math.atan2(-(bz - az), bx - ax);
    g.add(m);
  };
  const retangulo = (x0, z0, x1, z1) => {
    faixa(x0, z0, x1, z0);
    faixa(x1, z0, x1, z1);
    faixa(x1, z1, x0, z1);
    faixa(x0, z1, x0, z0);
  };

  retangulo(0, 0, C, L);
  faixa(C / 2, 0, C / 2, L);
  const zArea = (L - AREA_LARGURA) / 2;
  retangulo(0, zArea, AREA_FUNDO, zArea + AREA_LARGURA);
  retangulo(C - AREA_FUNDO, zArea, C, zArea + AREA_LARGURA);

  const circulo = new THREE.Mesh(new THREE.RingGeometry(6 - LARGURA_LINHA / 2, 6 + LARGURA_LINHA / 2, 64), branco);
  circulo.rotation.x = -Math.PI / 2;
  circulo.position.y = 0.006;
  g.add(circulo);
  const marca = new THREE.Mesh(new THREE.CircleGeometry(0.15, 16), branco);
  marca.rotation.x = -Math.PI / 2;
  marca.position.y = 0.006;
  g.add(marca);

  const poste = new THREE.MeshLambertMaterial({ color: '#FFFFFF' });
  const redes = [];
  for (const [x, lado] of [[0, -1], [C, 1]]) {
    const [bx] = p(x, 0);
    for (const z of [L / 2 - BALIZA_LARGURA / 2, L / 2 + BALIZA_LARGURA / 2]) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, BALIZA_ALTURA, 10), poste);
      m.position.set(bx, BALIZA_ALTURA / 2, p(0, z)[1]);
      g.add(m);
    }
    const trave = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, BALIZA_LARGURA, 10), poste);
    trave.rotation.x = Math.PI / 2;
    trave.position.set(bx, BALIZA_ALTURA, 0);
    g.add(trave);
    const rede = new THREE.Group();
    const fundo = 1.2;
    const plano = (l, a, rx, ry, px, py, pz) => {
      const tex = texturaRede();
      tex.repeat.set(l / 0.15, a / 0.15);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(l, a), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, depthWrite: false }));
      m.rotation.set(rx, ry, 0);
      m.position.set(px, py, pz);
      rede.add(m);
      return m;
    };
    const tras = plano(BALIZA_LARGURA, BALIZA_ALTURA, 0, Math.PI / 2, lado * fundo, BALIZA_ALTURA / 2, 0);
    plano(fundo, BALIZA_ALTURA, 0, 0, lado * fundo / 2, BALIZA_ALTURA / 2, -BALIZA_LARGURA / 2);
    plano(fundo, BALIZA_ALTURA, 0, 0, lado * fundo / 2, BALIZA_ALTURA / 2, BALIZA_LARGURA / 2);
    // Teto horizontal: deitar o plano basta (fundo ao longo de X, largura da baliza ao longo de Z).
    plano(fundo, BALIZA_LARGURA, -Math.PI / 2, 0, lado * fundo / 2, BALIZA_ALTURA, 0);
    rede.position.x = bx;
    g.add(rede);
    redes.push({ rede, tras, lado });
  }

  // Só a rede dos adversários abana, porque é aí que há golos.
  const redeDeles = redes.find((r) => r.lado === 1);
  let tAbanar = -1;
  return {
    grupo: g,
    abanarRede() { tAbanar = 0; },
    atualizar(dt) {
      if (tAbanar < 0) return;
      tAbanar += dt;
      const a = Math.exp(-3.5 * tAbanar) * 0.35;
      redeDeles.tras.position.x = redeDeles.lado * (1.2 + a * Math.abs(Math.sin(tAbanar * 22)));
      redeDeles.rede.scale.y = 1 + a * 0.15 * Math.sin(tAbanar * 18);
      if (a < 0.002) {
        tAbanar = -1;
        redeDeles.tras.position.x = redeDeles.lado * 1.2;
        redeDeles.rede.scale.y = 1;
      }
    },
  };
}
