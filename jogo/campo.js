// Campo de futebol de 7 em 3D: relva às riscas, linhas, áreas e balizas.
import * as THREE from 'three';

const LARGURA_LINHA = 0.12;
const AREA_FUNDO = 9;
const AREA_LARGURA = 20;
const BALIZA_LARGURA = 6;
const BALIZA_ALTURA = 2;

function texturaRiscas(n) {
  const tela = document.createElement('canvas');
  tela.width = 512;
  tela.height = 8;
  const ctx = tela.getContext('2d');
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 ? '#367F42' : '#3E8E4A';
    ctx.fillRect((i * tela.width) / n, 0, tela.width / n + 1, tela.height);
  }
  const t = new THREE.CanvasTexture(tela);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function construirCampo({ comprimento: C, largura: L }) {
  const g = new THREE.Group();
  const p = (x, z) => [x - C / 2, z - L / 2];
  const branco = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });

  const fora = new THREE.Mesh(new THREE.PlaneGeometry(C + 24, L + 20), new THREE.MeshLambertMaterial({ color: '#2F6B3A' }));
  fora.rotation.x = -Math.PI / 2;
  fora.position.y = -0.02;
  g.add(fora);

  const relva = new THREE.Mesh(new THREE.PlaneGeometry(C, L), new THREE.MeshLambertMaterial({ map: texturaRiscas(11) }));
  relva.rotation.x = -Math.PI / 2;
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
  const rede = new THREE.MeshBasicMaterial({ color: '#FFFFFF', wireframe: true, transparent: true, opacity: 0.35 });
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
    const r = new THREE.Mesh(new THREE.BoxGeometry(1.2, BALIZA_ALTURA, BALIZA_LARGURA, 4, 4, 8), rede);
    r.position.set(bx + lado * 0.6, BALIZA_ALTURA / 2, 0);
    g.add(r);
  }
  return g;
}
