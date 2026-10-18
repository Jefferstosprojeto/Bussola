import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  escolherAnimacao, clipeDisponivel, pecaDaMalha, GESTOS, CONTACTO, VEL_PARADO, VEL_SPRINT,
} from '../jogo/animacao.js';

test('locomocao por velocidade', () => {
  assert.deepEqual(escolherAnimacao({ vel: 0, guardaRedes: false, gesto: null }), { nome: 'parado', ritmo: 1 });
  assert.deepEqual(escolherAnimacao({ vel: 0, guardaRedes: true, gesto: null }), { nome: 'gr-parado', ritmo: 1 });
  const corrida = escolherAnimacao({ vel: 3.5, guardaRedes: false, gesto: null });
  assert.equal(corrida.nome, 'correr');
  assert.ok(Math.abs(corrida.ritmo - 1) < 1e-9);
  assert.equal(escolherAnimacao({ vel: VEL_PARADO + 0.01, guardaRedes: false, gesto: null }).ritmo, 0.6);
  const sprint = escolherAnimacao({ vel: VEL_SPRINT + 1, guardaRedes: false, gesto: null });
  assert.equal(sprint.nome, 'sprint');
  assert.ok(sprint.ritmo >= 0.8 && sprint.ritmo <= 1.3);
});

test('gesto de uma vez manda ate acabar; gesto repetido larga quando o jogador corre', () => {
  const passe = { nome: 'passe', repetir: false, terminado: false };
  assert.deepEqual(escolherAnimacao({ vel: 6, guardaRedes: false, gesto: passe }), { nome: 'passe', ritmo: 1 });
  assert.equal(escolherAnimacao({ vel: 6, guardaRedes: false, gesto: { ...passe, terminado: true } }).nome, 'sprint');
  const festejo = { nome: 'festejo', repetir: true, terminado: false };
  assert.equal(escolherAnimacao({ vel: 0.5, guardaRedes: false, gesto: festejo }).nome, 'festejo');
  assert.equal(escolherAnimacao({ vel: 3, guardaRedes: false, gesto: festejo }).nome, 'correr');
});

test('clipeDisponivel usa reservas e devolve null sem clipe', () => {
  const so = new Map([['parado', 1], ['correr', 1]]);
  assert.equal(clipeDisponivel('gr-parado', so), 'parado');
  assert.equal(clipeDisponivel('sprint', so), 'correr');
  assert.equal(clipeDisponivel('passe', so), null);
  assert.equal(clipeDisponivel('correr', so), 'correr');
});

test('pecaDaMalha reconhece camisola, calcoes e meias', () => {
  assert.equal(pecaDaMalha('Ch38_Shirt'), 'camisola');
  assert.equal(pecaDaMalha('Ch38_Shorts'), 'calcoes');
  assert.equal(pecaDaMalha('Ch38_Socks'), 'meias');
  assert.equal(pecaDaMalha('Ch38_Body'), null);
  assert.equal(pecaDaMalha('Ch38_Hair'), null);
  assert.equal(pecaDaMalha(undefined), null);
});

test('todos os gestos com contacto existem em GESTOS', () => {
  for (const nome of Object.keys(CONTACTO)) assert.ok(GESTOS[nome], nome);
});
