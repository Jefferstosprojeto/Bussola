import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarMedidorFps } from '../jogo/qualidade.js';

function correr(m, dts, segundos) {
  let disparos = 0;
  let t = 0;
  let i = 0;
  let quando = null;
  while (t < segundos) {
    const dt = dts[i++ % dts.length];
    t += dt;
    if (m.registar(dt)) { disparos++; quando = t; }
  }
  return { disparos, quando };
}

test('60 fps nunca baixa a qualidade', () => {
  assert.equal(correr(criarMedidorFps(), [1 / 60], 10).disparos, 0);
});

test('30 fps baixa uma vez ao fim de cerca de 2 s', () => {
  const r = correr(criarMedidorFps(), [1 / 30], 10);
  assert.equal(r.disparos, 1);
  assert.ok(r.quando >= 1.9 && r.quando <= 2.3, `disparou em ${r.quando}`);
});

test('um solavanco por segundo nao baixa', () => {
  const dts = [...Array(59).fill(1 / 60), 0.05];
  assert.equal(correr(criarMedidorFps(), dts, 10).disparos, 0);
});

test('ignora dt zero (pausa)', () => {
  const m = criarMedidorFps();
  assert.equal(m.registar(0), false);
  assert.equal(m.disparado, false);
});
