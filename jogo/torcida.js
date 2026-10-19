// Torcida: milhares de adeptos verde e brancos numa só malha em instâncias, animados na placa gráfica.
// Balançam sempre; saltam no golo; mãos na cabeça no falhanço; aplaudem nas boas decisões.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { intensidadeReacao } from './momentos.js';

const VERDE = '#1B5C3E';
const BRANCO = '#F2F2F2';
const PELE = '#E2B596';
const N_BANDEIRAS = 14;

function comParte(geo, parte) {
  geo.setAttribute('parte', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count).fill(parte), 1));
  return geo;
}

function geometriaAdepto() {
  return mergeGeometries([
    comParte(new THREE.BoxGeometry(0.44, 0.62, 0.28).translate(0, 0.45, 0), 0),
    comParte(new THREE.SphereGeometry(0.12, 8, 6).translate(0, 0.9, 0), 1),
    comParte(new THREE.BoxGeometry(0.1, 0.46, 0.1).translate(-0.27, 0.52, 0), 2),
    comParte(new THREE.BoxGeometry(0.1, 0.46, 0.1).translate(0.27, 0.52, 0), 2),
    comParte(new THREE.BoxGeometry(0.46, 0.08, 0.3).translate(0, 0.74, 0), 3),
  ]);
}

function baralhar(lista) {
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return lista;
}

export function criarTorcida(cena, lugaresOriginais, campo) {
  // Baralhados: na qualidade baixa desenha-se só a primeira metade, espalhada por todas as bancadas.
  const lugares = baralhar([...lugaresOriginais]);
  const n = lugares.length;
  const geo = geometriaAdepto();
  const cor = new Float32Array(n * 3);
  const fase = new Float32Array(n);
  const cachecol = new Float32Array(n);
  const verde = new THREE.Color(VERDE);
  const branco = new THREE.Color(BRANCO);
  lugares.forEach((l, i) => {
    (l.cor === 0 ? verde : branco).toArray(cor, i * 3);
    fase[i] = l.fase;
    cachecol[i] = l.cor === 0 ? 1 : 0;
  });
  geo.setAttribute('aCor', new THREE.InstancedBufferAttribute(cor, 3));
  geo.setAttribute('aFase', new THREE.InstancedBufferAttribute(fase, 1));
  geo.setAttribute('aCachecol', new THREE.InstancedBufferAttribute(cachecol, 1));

  const u = {
    uTempo: { value: 0 }, uSalto: { value: 0 }, uMaos: { value: 0 }, uAplauso: { value: 0 },
    uPele: { value: new THREE.Color(PELE) }, uVerde: { value: verde }, uBranco: { value: branco },
  };
  const material = new THREE.MeshLambertMaterial({ color: '#FFFFFF' });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float parte; attribute vec3 aCor; attribute float aFase; attribute float aCachecol;
        uniform float uTempo, uSalto, uMaos, uAplauso; uniform vec3 uPele, uVerde, uBranco;
        varying vec3 vCor;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float fase = aFase * 6.2832;
        float balanco = sin(uTempo * 2.0 + fase) * 0.03;
        float pulo = abs(sin(uTempo * 8.0 + fase));
        float salto = uSalto * pulo * 0.4;
        if (parte > 1.5 && parte < 2.5) {
          float lado = sign(position.x);
          float ang = max(uMaos * 2.7, uSalto * (1.6 + 1.2 * pulo));
          ang = max(ang, uAplauso * (1.3 + 0.25 * sin(uTempo * 14.0 + fase)));
          vec2 ombro = vec2(lado * 0.27, 0.75);
          vec2 p = transformed.xy - ombro;
          float a = ang * lado;
          transformed.xy = vec2(p.x * cos(a) - p.y * sin(a), p.x * sin(a) + p.y * cos(a)) + ombro;
        }
        transformed.y += balanco + salto;
        vCor = parte < 0.5 ? aCor : parte < 1.5 ? uPele : parte < 2.5 ? aCor : (aCachecol > 0.5 ? uBranco : uVerde);`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCor;')
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( diffuse * vCor, opacity );');
  };

  const malha = new THREE.InstancedMesh(geo, material, n);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const eixoY = new THREE.Vector3(0, 1, 0);
  const um = new THREE.Vector3(1, 1, 1);
  const pos = new THREE.Vector3();
  lugares.forEach((l, i) => {
    pos.set(l.x - campo.comprimento / 2, l.y, l.z - campo.largura / 2);
    q.setFromAxisAngle(eixoY, l.rotY);
    malha.setMatrixAt(i, m.compose(pos, q, um));
  });
  malha.frustumCulled = false;
  cena.add(malha);

  // Bandeiras às riscas verde e brancas, a ondular, em alguns lugares das primeiras filas.
  const telaBandeira = document.createElement('canvas');
  telaBandeira.width = 64;
  telaBandeira.height = 32;
  const cb = telaBandeira.getContext('2d');
  for (let i = 0; i < 4; i++) {
    cb.fillStyle = i % 2 ? BRANCO : VERDE;
    cb.fillRect(i * 16, 0, 16, 32);
  }
  const texBandeira = new THREE.CanvasTexture(telaBandeira);
  texBandeira.colorSpace = THREE.SRGBColorSpace;
  const matBandeira = new THREE.MeshLambertMaterial({ map: texBandeira, side: THREE.DoubleSide });
  matBandeira.onBeforeCompile = (shader) => {
    shader.uniforms.uTempo = u.uTempo;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTempo;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.z += sin(position.x * 4.0 + uTempo * 6.0) * 0.08 * (position.x + 0.7);');
  };
  const geoBandeira = new THREE.PlaneGeometry(1.4, 0.9, 10, 1).translate(0.7, 0, 0);
  // Mastro fino do lugar até à ponta esquerda da bandeira, para não ficar a flutuar.
  const geoMastro = new THREE.CylinderGeometry(0.02, 0.02, 1.6, 6).translate(0, 0.8, 0);
  const matMastro = new THREE.MeshLambertMaterial({ color: '#9A9A9A' });
  const baixos = lugares.filter((l) => l.y < 2.6);
  for (let i = 0; i < N_BANDEIRAS && baixos.length; i++) {
    const l = baixos[Math.floor(Math.random() * baixos.length)];
    const X = l.x - campo.comprimento / 2;
    const Z = l.z - campo.largura / 2;
    const b = new THREE.Mesh(geoBandeira, matBandeira);
    b.position.set(X, l.y + 1.6, Z);
    // A face da bandeira (normal +z local) fica virada para o campo, como o adepto.
    b.rotation.y = l.rotY;
    cena.add(b);
    const mastro = new THREE.Mesh(geoMastro, matMastro);
    mastro.position.set(X, l.y, Z);
    cena.add(mastro);
  }

  let tempo = 0;
  let reacao = null;
  return {
    reagir(tipo) {
      reacao = { tipo, inicio: tempo };
    },
    atualizar(dt) {
      tempo += dt;
      u.uTempo.value = tempo;
      const k = reacao ? intensidadeReacao(reacao.tipo, tempo - reacao.inicio) : 0;
      u.uSalto.value = reacao?.tipo === 'golo' ? k : 0;
      u.uMaos.value = reacao?.tipo === 'falhanco' ? k : 0;
      u.uAplauso.value = reacao?.tipo === 'aplauso' ? k : 0;
    },
    // Novo lance: a torcida volta ao repouso, sem reações penduradas do anterior.
    reiniciar() {
      reacao = null;
      u.uSalto.value = 0;
      u.uMaos.value = 0;
      u.uAplauso.value = 0;
    },
    definirQualidade(nivel) {
      malha.count = nivel === 'baixa' ? Math.floor(n / 2) : n;
    },
  };
}
