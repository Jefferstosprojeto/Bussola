// Jogador 3D simples, com balanço de pernas e braços ao correr. A frente é o -z local.
import * as THREE from 'three';

const PELE = '#E8B89A';

function texturaRiscas(cores) {
  const tela = document.createElement('canvas');
  tela.width = 64;
  tela.height = 8;
  const ctx = tela.getContext('2d');
  const n = 6;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = cores[i % cores.length];
    ctx.fillRect((i * tela.width) / n, 0, tela.width / n + 1, tela.height);
  }
  const t = new THREE.CanvasTexture(tela);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function caixa(l, a, p, cor, mapa) {
  const material = new THREE.MeshLambertMaterial(mapa ? { map: mapa } : { color: cor });
  return new THREE.Mesh(new THREE.BoxGeometry(l, a, p), material);
}

export function criarBoneco({ camisola, calcoes }) {
  const grupo = new THREE.Group();

  const tronco = caixa(0.42, 0.5, 0.24, camisola[0], camisola.length > 1 ? texturaRiscas(camisola) : null);
  tronco.position.y = 1.05;
  grupo.add(tronco);

  const calc = caixa(0.42, 0.18, 0.25, calcoes);
  calc.position.y = 0.73;
  grupo.add(calc);

  const cabeca = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), new THREE.MeshLambertMaterial({ color: PELE }));
  cabeca.position.y = 1.48;
  grupo.add(cabeca);

  const membro = (largura, comprimento, cor, x, y) => {
    const pivo = new THREE.Group();
    pivo.position.set(x, y, 0);
    const m = caixa(largura, comprimento, largura, cor);
    m.position.y = -comprimento / 2;
    pivo.add(m);
    grupo.add(pivo);
    return pivo;
  };
  const pernaE = membro(0.13, 0.66, camisola[0], -0.11, 0.66);
  const pernaD = membro(0.13, 0.66, camisola[0], 0.11, 0.66);
  const bracoE = membro(0.1, 0.48, PELE, -0.27, 1.27);
  const bracoD = membro(0.1, 0.48, PELE, 0.27, 1.27);

  const sombra = new THREE.Mesh(
    new THREE.CircleGeometry(0.35, 20),
    new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.22, depthWrite: false }),
  );
  sombra.rotation.x = -Math.PI / 2;
  sombra.position.y = 0.01;
  grupo.add(sombra);

  let fase = 0;
  return {
    grupo,
    animar(velocidade, dt) {
      fase += velocidade * dt * 3.2;
      const amp = Math.min(velocidade / 6, 1) * 0.8;
      const s = Math.sin(fase) * amp;
      pernaE.rotation.x = s;
      pernaD.rotation.x = -s;
      bracoE.rotation.x = -s * 0.8;
      bracoD.rotation.x = s * 0.8;
    },
    // Os bonecos simples não têm gestos; existe para terem a mesma interface do jogador3d.
    gesto() {},
    libertar() {
      grupo.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (o.material.map) o.material.map.dispose();
          o.material.dispose();
        }
      });
    },
  };
}
