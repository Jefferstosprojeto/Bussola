import { test } from 'node:test';
import assert from 'node:assert/strict';
import { orientacaoParaAngulos, relativo, criarGiroscopio } from '../jogo/giroscopio.js';

const G = Math.PI / 180;
const perto = (a, b, tol = 1, msg) => assert.ok(Math.abs(a - b) <= tol * G, `${msg}: ${(a / G).toFixed(2)} vs ${(b / G).toFixed(2)}`);

function rodar(ori0, ori1, ecra) {
  return relativo(orientacaoParaAngulos(ori1, ecra), orientacaoParaAngulos(ori0, ecra));
}

test('ao alto: rodar 30 graus para a esquerda da yaw +30', () => {
  const r = rodar({ alpha: 0, beta: 85, gamma: 0 }, { alpha: 30, beta: 85, gamma: 0 }, 0);
  perto(r.yaw, 30 * G, 1, 'yaw');
  perto(r.pitch, 0, 1, 'pitch');
});

test('ao alto: inclinar o topo para tras olha para cima', () => {
  perto(rodar({ alpha: 0, beta: 85, gamma: 0 }, { alpha: 0, beta: 95, gamma: 0 }, 0).pitch, 10 * G, 1, 'pitch');
});

test('beta 90 (telemovel direito) nao salta', () => {
  const a = orientacaoParaAngulos({ alpha: 0, beta: 90, gamma: 0 }, 0);
  const b = orientacaoParaAngulos({ alpha: 20, beta: 90, gamma: 0 }, 0);
  perto(relativo(b, a).yaw, 20 * G, 1, 'yaw');
  perto(a.pitch, 0, 1, 'pitch');
});

test('deitado (ecra a 90 e a 270): rodar 30 graus da yaw +30', () => {
  perto(rodar({ alpha: 0, beta: 0, gamma: -85 }, { alpha: 30, beta: 0, gamma: -85 }, 90).yaw, 30 * G, 1, 'yaw 90');
  perto(rodar({ alpha: 0, beta: 0, gamma: 85 }, { alpha: 30, beta: 0, gamma: 85 }, 270).yaw, 30 * G, 1, 'yaw 270');
});

test('cruzar o norte (alpha 359 para 1) da +2 graus, nao -358', () => {
  perto(rodar({ alpha: 359, beta: 85, gamma: 0 }, { alpha: 1, beta: 85, gamma: 0 }, 0).yaw, 2 * G, 0.5, 'yaw');
});

function janelaFalsa({ pedir } = {}) {
  const ouvintes = {};
  const DeviceOrientationEvent = function () {};
  if (pedir) DeviceOrientationEvent.requestPermission = pedir;
  return {
    DeviceOrientationEvent,
    matchMedia: () => ({ matches: true }),
    screen: { orientation: { angle: 0 } },
    addEventListener: (n, f) => { ouvintes[n] = f; },
    removeEventListener: (n) => { delete ouvintes[n]; },
    emitir: (ev) => ouvintes.deviceorientation && ouvintes.deviceorientation(ev),
    ouvintes,
  };
}

test('sem sensor: indisponivel, ligar falha, ler da null', () => {
  const g = criarGiroscopio({ matchMedia: () => ({ matches: true }) });
  assert.equal(g.disponivel, false);
  assert.equal(g.ligar(), false);
  assert.equal(g.ler(), null);
});

test('android (sem pedido): liga, le relativo ao primeiro valor e recalibra', () => {
  const j = janelaFalsa();
  const g = criarGiroscopio(j);
  assert.equal(g.precisaAutorizacao, false);
  assert.equal(g.ligar(), true);
  assert.equal(g.ler(), null);
  j.emitir({ alpha: 10, beta: 85, gamma: 0 });
  perto(g.ler().yaw, 0, 0.1, 'primeira leitura');
  j.emitir({ alpha: 40, beta: 85, gamma: 0 });
  perto(g.ler().yaw, 30 * G, 1, 'depois de rodar');
  g.recalibrar();
  perto(g.ler().yaw, 0, 0.1, 'recalibrado');
  g.desligar();
  assert.equal(g.ligado, false);
  assert.equal(j.ouvintes.deviceorientation, undefined);
});

test('iphone: pedirAutorizacao concedida e recusada', async () => {
  const sim = criarGiroscopio(janelaFalsa({ pedir: async () => 'granted' }));
  assert.equal(sim.precisaAutorizacao, true);
  assert.equal(sim.ligar(), false);
  assert.equal(await sim.pedirAutorizacao(), true);
  assert.equal(sim.ligar(), true);
  const nao = criarGiroscopio(janelaFalsa({ pedir: async () => 'denied' }));
  assert.equal(await nao.pedirAutorizacao(), false);
  assert.equal(nao.ligar(), false);
  const erro = criarGiroscopio(janelaFalsa({ pedir: async () => { throw new Error('x'); } }));
  assert.equal(await erro.pedirAutorizacao(), false);
});
