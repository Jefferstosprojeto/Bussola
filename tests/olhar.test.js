import { test } from 'node:test';
import assert from 'node:assert/strict';
import { combinarOlhar, PITCH_MAX } from '../jogo/olhar.js';

test('sem giroscopio fica o dedo', () => {
  assert.deepEqual(combinarOlhar({ yaw: 1, pitch: 0.1 }, null), { yaw: 1, pitch: 0.1 });
});

test('soma dedo e giroscopio e da a volta em pi', () => {
  const r = combinarOlhar({ yaw: 3, pitch: 0 }, { yaw: 0.5, pitch: 0 });
  assert.ok(Math.abs(r.yaw - (3.5 - 2 * Math.PI)) < 1e-9);
});

test('pitch total limitado', () => {
  assert.equal(combinarOlhar({ yaw: 0, pitch: 0.3 }, { yaw: 0, pitch: 0.4 }).pitch, PITCH_MAX);
  assert.equal(combinarOlhar({ yaw: 0, pitch: -0.3 }, { yaw: 0, pitch: -0.4 }).pitch, -PITCH_MAX);
});
