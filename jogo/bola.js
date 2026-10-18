// Bola com gomos, a rodar conforme anda, com arco (altura) e sombra no chão.
import * as THREE from 'three';

export const RAIO_BOLA = 0.11;

function texturaGomos() {
  const tela = document.createElement('canvas');
  tela.width = 256;
  tela.height = 128;
  const ctx = tela.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = '#111111';
  for (let fila = 0; fila < 3; fila++) {
    for (let col = 0; col < 6; col++) {
      const x = col * 43 + (fila % 2) * 21 + 10;
      const y = 22 + fila * 42;
      ctx.beginPath();
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
        ctx.lineTo(x + Math.cos(a) * 11, y + Math.sin(a) * 11);
      }
      ctx.fill();
    }
  }
  const t = new THREE.CanvasTexture(tela);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function criarBola(cena) {
  const malha = new THREE.Mesh(
    new THREE.SphereGeometry(RAIO_BOLA, 24, 16),
    new THREE.MeshStandardMaterial({ map: texturaGomos(), roughness: 0.45 }),
  );
  const sombra = new THREE.Mesh(
    new THREE.CircleGeometry(RAIO_BOLA * 1.3, 20),
    new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.35, depthWrite: false }),
  );
  sombra.rotation.x = -Math.PI / 2;
  cena.add(malha, sombra);

  const anterior = new THREE.Vector3();
  const eixo = new THREE.Vector3();
  const giro = new THREE.Quaternion();
  let primeiro = true;

  return {
    malha,
    colocar(wx, wz, altura = 0) {
      if (!primeiro) {
        const dx = wx - anterior.x;
        const dz = wz - anterior.z;
        const d = Math.hypot(dx, dz);
        // Rolar: roda à volta do eixo horizontal perpendicular ao movimento (cima × direção).
        if (d > 1e-5) {
          eixo.set(dz / d, 0, -dx / d);
          giro.setFromAxisAngle(eixo, d / RAIO_BOLA);
          malha.quaternion.premultiply(giro);
        }
      }
      primeiro = false;
      anterior.set(wx, 0, wz);
      malha.position.set(wx, RAIO_BOLA + altura, wz);
      sombra.position.set(wx, 0.012, wz);
      const s = 1 / (1 + altura * 0.6);
      sombra.scale.setScalar(s);
      sombra.material.opacity = 0.35 * s;
    },
    reiniciar() {
      primeiro = true;
    },
  };
}
