import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  agendarGestos, dispararAte, reacoesDoEvento, reacoesDoFim, intensidadeReacao, pontoDeFuga, REACOES_TORCIDA,
} from '../jogo/momentos.js';
import { CENARIOS } from '../jogo/cenarios.js';

const CONTACTO = { passe: 0.3, remate: 0.4, 'gr-defesa': 0.35, desarme: 0.5 };
const JOG = {
  arthur: { equipa: 'nos' }, 'n-mc': { equipa: 'nos' }, 'n-gr': { equipa: 'nos', guardaRedes: true },
  'e-cen': { equipa: 'eles' }, 'e-gr': { equipa: 'eles', guardaRedes: true },
};

test('agendarGestos antecipa o contacto e ignora o arthur e o golo', () => {
  const ag = agendarGestos([
    { t: 0, tipo: 'passe', jogador: 'n-mc' },
    { t: 1.2, tipo: 'remate', jogador: 'arthur' },
    { t: 2, tipo: 'defesa', jogador: 'e-gr' },
    { t: 2.3, tipo: 'golo' },
    { t: 1, tipo: 'perda', jogador: 'e-cen' },
  ], CONTACTO);
  assert.deepEqual(ag, [
    { t: 0, desvio: 0.3, jogador: 'n-mc', nome: 'passe' },
    { t: 0.5, desvio: 0, jogador: 'e-cen', nome: 'desarme' },
    { t: 1.65, desvio: 0, jogador: 'e-gr', nome: 'gr-defesa' },
  ]);
  assert.deepEqual(agendarGestos(undefined, CONTACTO), []);
});

test('dispararAte dispara cada item uma vez, incluindo t=0 e o fim', () => {
  const lista = [{ t: 0 }, { t: 1 }, { t: 2 }];
  let r = dispararAte(lista, 0, 0);
  assert.equal(r.disparados.length, 1);
  r = dispararAte(lista, r.indice, 0.5);
  assert.equal(r.disparados.length, 0);
  r = dispararAte(lista, r.indice, 2);
  assert.deepEqual(r.disparados, [{ t: 1 }, { t: 2 }]);
  r = dispararAte(lista, r.indice, 99);
  assert.equal(r.disparados.length, 0);
  assert.equal(r.indice, 3);
});

test('golo: torcida, som, festejo dos nossos e desanimo deles (sem arthur nem guarda-redes)', () => {
  const r = reacoesDoEvento({ t: 2, tipo: 'golo' }, [], JOG);
  assert.deepEqual(r.slice(0, 3), [{ acao: 'golo' }, { acao: 'torcida', tipo: 'golo' }, { acao: 'som', nome: 'golo' }]);
  const gestos = r.filter((a) => a.acao === 'gesto');
  assert.deepEqual(gestos, [
    { acao: 'gesto', jogador: 'n-mc', nome: 'festejo', desvio: 0 },
    { acao: 'gesto', jogador: 'e-cen', nome: 'desanimo', desvio: 0 },
  ]);
});

test('perda: roubar, uuuh e maos na cabeca', () => {
  assert.deepEqual(reacoesDoEvento({ t: 1, tipo: 'perda', jogador: 'e-cen' }, [], JOG), [
    { acao: 'roubar', jogador: 'e-cen' }, { acao: 'torcida', tipo: 'falhanco' }, { acao: 'som', nome: 'uuuh' },
  ]);
});

test('defesa so e falhanco se nao houver golo depois', () => {
  const def = { t: 2, tipo: 'defesa', jogador: 'e-gr' };
  assert.deepEqual(reacoesDoEvento(def, [def, { t: 2.3, tipo: 'golo' }], JOG), []);
  assert.deepEqual(reacoesDoEvento(def, [def], JOG), [{ acao: 'torcida', tipo: 'falhanco' }, { acao: 'som', nome: 'uuuh' }]);
  assert.deepEqual(reacoesDoEvento({ t: 0, tipo: 'passe', jogador: 'n-mc' }, [], JOG), []);
});

test('reacoesDoFim: aplauso so nas boas sem golo', () => {
  const aplauso = [{ acao: 'torcida', tipo: 'aplauso' }, { acao: 'som', nome: 'aplauso' }];
  assert.deepEqual(reacoesDoFim({ resultado: 'bom', eventos: [] }), aplauso);
  assert.deepEqual(reacoesDoFim({ resultado: 'bom', eventos: [{ t: 1, tipo: 'golo' }] }), []);
  assert.deepEqual(reacoesDoFim({ resultado: 'mau', eventos: [] }), []);
});

test('intensidadeReacao sobe, fica e desce', () => {
  assert.equal(intensidadeReacao('golo', -0.1), 0);
  assert.ok(Math.abs(intensidadeReacao('golo', 0.1) - 0.5) < 1e-9);
  assert.equal(intensidadeReacao('golo', 2), 1);
  assert.ok(intensidadeReacao('golo', REACOES_TORCIDA.golo.duracao - 0.3) < 1);
  assert.equal(intensidadeReacao('golo', REACOES_TORCIDA.golo.duracao + 0.1), 0);
  assert.equal(intensidadeReacao('nada', 1), 0);
});

test('pontoDeFuga vai para a nossa baliza e fica dentro do campo', () => {
  assert.deepEqual(pontoDeFuga([40, 6]), [26, 6]);
  assert.deepEqual(pontoDeFuga([10, 1]), [3, 3]);
  assert.deepEqual(pontoDeFuga([30, 34]), [16, 32]);
});

test('todos os cenarios: gestos agendados so para jogadores que existem', () => {
  for (const c of CENARIOS) {
    for (const g of agendarGestos(c.eventos, CONTACTO)) assert.ok(c.jogadores[g.jogador]);
    for (const v of Object.values(c.variantes)) {
      for (const k of Object.values(v.consequencias)) {
        for (const g of agendarGestos(k.eventos, CONTACTO)) assert.ok(c.jogadores[g.jogador], `${c.id}: ${g.jogador}`);
      }
    }
  }
});
