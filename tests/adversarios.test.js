import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarReacao, VELOCIDADE_MAX } from '../jogo/adversarios.js';

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const DT = 1 / 60;

test('so gere quem tem comportamento', () => {
  const r = criarReacao({ a: { tipo: 'fechar', ponto: [10, 10] } }, { a: [0, 0], b: [5, 5] });
  assert.deepEqual(r.ids(), ['a']);
  assert.equal(r.posicao('b'), null);
});

test('fechar chega ao ponto', () => {
  const r = criarReacao({ a: { tipo: 'fechar', ponto: [5, 0] } }, { a: [0, 0] });
  for (let i = 0; i < 150; i++) r.atualizar(DT, { arthur: [0, 0], bola: [0, 0] });
  assert.ok(dist(r.posicao('a'), [5, 0]) < 0.6, `ficou em ${r.posicao('a')}`);
});

test('nunca passa da velocidade maxima', () => {
  const r = criarReacao({ a: { tipo: 'fechar', ponto: [40, 0] } }, { a: [0, 0] });
  let antes = r.posicao('a');
  for (let i = 0; i < 120; i++) {
    r.atualizar(DT, { arthur: [0, 0], bola: [0, 0] });
    const agora = r.posicao('a');
    assert.ok(dist(antes, agora) / DT <= VELOCIDADE_MAX + 1e-6);
    antes = agora;
  }
});

test('perseguir aproxima-se do arthur em movimento', () => {
  const r = criarReacao({ a: { tipo: 'perseguir', alvo: 'arthur' } }, { a: [0, 0] });
  let arthur = [3, 0];
  for (let i = 0; i < 120; i++) {
    arthur = [arthur[0] + 4 * DT, 0];
    r.atualizar(DT, { arthur, bola: [0, 0] });
  }
  assert.ok(dist(r.posicao('a'), arthur) < 3, `distancia final ${dist(r.posicao('a'), arthur)}`);
});

test('pressionar vai para a bola', () => {
  const r = criarReacao({ a: { tipo: 'pressionar' } }, { a: [0, 0] });
  for (let i = 0; i < 120; i++) r.atualizar(DT, { arthur: [0, 0], bola: [4, 3] });
  assert.ok(dist(r.posicao('a'), [4, 3]) < 1.2);
});

test('sem comportamentos nao rebenta', () => {
  const r = criarReacao({}, {});
  r.atualizar(DT, { arthur: [0, 0], bola: [0, 0] });
  assert.deepEqual(r.ids(), []);
});
