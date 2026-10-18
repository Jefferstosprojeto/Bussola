import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gerarLugares, AFASTAMENTO, ALTURA_BASE, BANCADAS } from '../jogo/bancadas.js';
import { CAMPO } from '../jogo/cenarios.js';

function lcg(semente) {
  let s = semente;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

test('milhares de lugares com tudo cheio', () => {
  const n = gerarLugares(CAMPO, { fracao: 1, aleatorio: () => 0.5 }).length;
  assert.ok(n > 3500 && n < 4600, `lugares: ${n}`);
});

test('fracao 0,5 deixa cerca de metade', () => {
  const todos = gerarLugares(CAMPO, { fracao: 1, aleatorio: lcg(1) }).length;
  const metade = gerarLugares(CAMPO, { fracao: 0.5, aleatorio: lcg(1) }).length;
  assert.ok(metade > todos * 0.4 && metade < todos * 0.6, `${metade} de ${todos}`);
});

test('ninguem dentro do campo nem antes do afastamento, todos acima do muro', () => {
  for (const l of gerarLugares(CAMPO, { fracao: 1, aleatorio: lcg(2) })) {
    const dentroX = l.x > -AFASTAMENTO + 0.01 && l.x < CAMPO.comprimento + AFASTAMENTO - 0.01;
    const dentroZ = l.z > -AFASTAMENTO + 0.01 && l.z < CAMPO.largura + AFASTAMENTO - 0.01;
    assert.ok(!(dentroX && dentroZ), `lugar em (${l.x.toFixed(1)}, ${l.z.toFixed(1)})`);
    assert.ok(l.y > ALTURA_BASE);
    assert.ok(l.cor === 0 || l.cor === 1);
    assert.ok(l.fase >= 0 && l.fase < 1);
  }
});

test('todos olham para o campo', () => {
  const cx = CAMPO.comprimento / 2;
  const cz = CAMPO.largura / 2;
  for (const l of gerarLugares(CAMPO, { fracao: 1, aleatorio: lcg(3) })) {
    const frente = [Math.sin(l.rotY), Math.cos(l.rotY)];
    assert.ok(frente[0] * (cx - l.x) + frente[1] * (cz - l.z) > 0, `lugar em (${l.x.toFixed(1)}, ${l.z.toFixed(1)}) de costas`);
  }
});

test('ha uma bancada principal com cobertura', () => {
  assert.equal(BANCADAS.filter((b) => b.cobertura).length, 1);
});
