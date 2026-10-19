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

test('pressionar vai para a bola quando ela esta perto do arthur', () => {
  const r = criarReacao({ a: { tipo: 'pressionar' } }, { a: [0, 0] });
  for (let i = 0; i < 120; i++) r.atualizar(DT, { arthur: [4, 4], bola: [4, 3] });
  assert.ok(dist(r.posicao('a'), [4, 3]) < 1.2, `ficou em ${r.posicao('a')}`);
});

test('pressionar vai ao arthur enquanto a bola esta longe dele', () => {
  const r = criarReacao({ a: { tipo: 'pressionar' } }, { a: [0, 0] });
  for (let i = 0; i < 120; i++) r.atualizar(DT, { arthur: [6, 0], bola: [0, 8] });
  const p = r.posicao('a');
  assert.ok(dist(p, [6, 0]) < 1.2, `ficou em ${p}`);
  assert.ok(dist(p, [0, 8]) > 5, 'nao devia ir para a bola');
});

test('sem comportamentos nao rebenta', () => {
  const r = criarReacao({}, {});
  r.atualizar(DT, { arthur: [0, 0], bola: [0, 0] });
  assert.deepEqual(r.ids(), []);
});

test('redirecionar um perseguidor manda-o para o ponto de fuga', () => {
  const r = criarReacao({ a: { tipo: 'perseguir', alvo: 'arthur' } }, { a: [20, 10] });
  r.redirecionar('a', [6, 10]);
  for (let i = 0; i < 240; i++) r.atualizar(DT, { arthur: [20, 10], bola: [20, 10] });
  assert.ok(dist(r.posicao('a'), [6, 10]) < 0.6, `ficou em ${r.posicao('a')}`);
});

test('redirecionar quem nao reagia cria-o no inicio; sem inicio nao faz nada', () => {
  const r = criarReacao({}, {});
  r.redirecionar('b', [5, 5]);
  assert.deepEqual(r.ids(), []);
  r.redirecionar('b', [5, 5], [15, 5]);
  assert.deepEqual(r.ids(), ['b']);
  assert.deepEqual(r.posicao('b'), [15, 5]);
  for (let i = 0; i < 180; i++) r.atualizar(DT, { arthur: [0, 0], bola: [0, 0] });
  assert.ok(dist(r.posicao('b'), [5, 5]) < 0.6);
});
