import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quadroEm } from '../jogo/repeticao.js';

test('quadroEm escolhe o ultimo quadro ate ao tempo pedido', () => {
  const f = [{ t: 0.1 }, { t: 0.2 }, { t: 0.4 }];
  assert.equal(quadroEm([], 1), null);
  assert.equal(quadroEm(f, 0), f[0]);
  assert.equal(quadroEm(f, 0.25), f[1]);
  assert.equal(quadroEm(f, 0.4), f[2]);
  assert.equal(quadroEm(f, 9), f[2]);
});
