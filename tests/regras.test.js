import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  posicaoEm, trajetoriasDaVariante, sortearVariante, criarContadorScans,
  calcularEstrelas, criarArmazem, estaDesbloqueado, yawParaPonto, alvoCamara, pitchParaBola,
  LIMIAR_SCAN, CHAVE_RECORDES,
} from '../jogo/regras.js';

const graus = (g) => (g * Math.PI) / 180;

test('posicaoEm interpola e limita nas pontas', () => {
  const p = [[0, 0, 0], [2, 10, 4], [4, 10, 8]];
  assert.deepEqual(posicaoEm(p, -1), [0, 0]);
  assert.deepEqual(posicaoEm(p, 1), [5, 2]);
  assert.deepEqual(posicaoEm(p, 3), [10, 6]);
  assert.deepEqual(posicaoEm(p, 9), [10, 8]);
});

test('trajetoriasDaVariante aplica alteracoes por cima da base', () => {
  const c = {
    jogadores: { a: { pontos: [[0, 1, 1]] }, b: { pontos: [[0, 2, 2]] } },
    variantes: { pressao: { alteracoes: { b: [[0, 9, 9]] } }, espaco: {} },
  };
  assert.deepEqual(trajetoriasDaVariante(c, 'pressao'), { a: [[0, 1, 1]], b: [[0, 9, 9]] });
  assert.deepEqual(trajetoriasDaVariante(c, 'espaco'), { a: [[0, 1, 1]], b: [[0, 2, 2]] });
});

test('sortearVariante usa o rng', () => {
  const c = { variantes: { pressao: {}, espaco: {} } };
  assert.equal(sortearVariante(c, () => 0), 'pressao');
  assert.equal(sortearVariante(c, () => 0.99), 'espaco');
  assert.equal(sortearVariante(c, () => 1), 'espaco');
});

test('contador de scans com histerese', () => {
  const s = criarContadorScans();
  s.registar(0.0, 0);
  s.registar(0.1, graus(74));
  assert.equal(s.total(), 1);
  s.registar(0.2, graus(80));
  s.registar(0.3, graus(34));
  s.registar(0.4, graus(75));
  assert.equal(s.total(), 1, 'sem voltar abaixo de 30 graus nao conta outra vez');
  s.registar(0.5, graus(20));
  s.registar(0.6, graus(-75));
  assert.equal(s.total(), 2, 'olhar para a direita tambem conta');
  assert.equal(s.entre(0.55, 1), 1);
  assert.equal(s.entre(0, 0.1), 1);
});

test('limiar exato de 70 graus nao conta', () => {
  const s = criarContadorScans();
  s.registar(0, LIMIAR_SCAN);
  assert.equal(s.total(), 0);
});

test('calcularEstrelas', () => {
  assert.deepEqual(
    calcularEstrelas({ scansJanela: 2, atencaoCerta: true, decisaoCerta: false }),
    { scan: true, atencao: true, decisao: false, total: 2 },
  );
  assert.equal(calcularEstrelas({ scansJanela: 1, atencaoCerta: true, decisaoCerta: true }).scan, false);
  assert.equal(calcularEstrelas({ scansJanela: 5, atencaoCerta: true, decisaoCerta: true }).total, 3);
});

function storageFalso(inicial = {}) {
  const dados = { ...inicial };
  return {
    getItem: (k) => (k in dados ? dados[k] : null),
    setItem: (k, v) => { dados[k] = String(v); },
    dados,
  };
}

test('armazem guarda so recordes novos', () => {
  const st = storageFalso();
  const a = criarArmazem(st);
  assert.equal(a.melhor('x'), 0);
  assert.equal(a.guardar('x', 0), false);
  assert.equal(a.guardar('x', 2), true);
  assert.equal(a.guardar('x', 1), false);
  assert.equal(a.melhor('x'), 2);
  assert.deepEqual(JSON.parse(st.dados[CHAVE_RECORDES]), { x: 2 });
  assert.equal(criarArmazem(st).melhor('x'), 2, 'le o que foi guardado');
});

test('armazem com storage que falha', () => {
  const mau = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); } };
  const a = criarArmazem(mau);
  assert.equal(a.melhor('x'), 0);
  assert.equal(a.guardar('x', 3), true);
  assert.equal(a.melhor('x'), 3, 'fica em memoria durante a sessao');
  const nulo = criarArmazem(null);
  assert.equal(nulo.guardar('y', 1), true);
  const lixo = criarArmazem(storageFalso({ [CHAVE_RECORDES]: '{nao e json' }));
  assert.equal(lixo.melhor('x'), 0);
});

test('estaDesbloqueado', () => {
  const a = criarArmazem(storageFalso({ [CHAVE_RECORDES]: JSON.stringify({ um: 2 }) }));
  assert.equal(estaDesbloqueado({ desbloqueio: null }, a), true);
  assert.equal(estaDesbloqueado({ desbloqueio: { cenario: 'um', estrelas: 2 } }, a), true);
  assert.equal(estaDesbloqueado({ desbloqueio: { cenario: 'um', estrelas: 3 } }, a), false);
  assert.equal(estaDesbloqueado({ desbloqueio: { cenario: 'dois', estrelas: 1 } }, a), false);
});

test('yawParaPonto segue a convencao do jogo', () => {
  assert.equal(yawParaPonto([0, 0], [5, 0]), 0);
  assert.ok(Math.abs(yawParaPonto([0, 0], [0, -5]) - Math.PI / 2) < 1e-9, 'esquerda = z menor = positivo');
  assert.ok(Math.abs(Math.abs(yawParaPonto([0, 0], [-5, 0])) - Math.PI) < 1e-9);
});

test('alvoCamara antecipa a bola, depois usa o ponto final, depois mantem', () => {
  const bola = [[0, 0, 0], [1, 10, 0], [2, 13, 0]];
  assert.deepEqual(alvoCamara(bola, 0, [10, 0]), [5, 0], 'bola daqui a meio segundo');
  assert.deepEqual(alvoCamara(bola, 0.9, [10, 0]), [13, 0], 'perto do arthur: ponto final');
  assert.equal(alvoCamara(bola, 1.9, [12.5, 0]), null, 'tudo em cima do arthur: mantem');
});

test('pitchParaBola baixa a cabeca para a bola e fica entre -0,6 e 0', () => {
  const longe = pitchParaBola(20, 1.4, 0.11);
  assert.ok(longe < 0 && longe > -0.1, `longe ${longe}`);
  assert.equal(pitchParaBola(0.7, 1.4, 0.11), -0.6);
  assert.equal(pitchParaBola(0.2, 1.4, 0.11), -0.2, 'bola nos pes: olha em frente');
  assert.ok(pitchParaBola(3, 1.4, 0.11) < longe);
});
