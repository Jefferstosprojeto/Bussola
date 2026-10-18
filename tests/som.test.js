import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarSom, SONS } from '../jogo/som.js';

function contextoFalso() {
  const registo = { iniciados: [], parados: 0, retomado: 0 };
  class Ctx {
    constructor() { this.state = 'suspended'; this.destination = {}; }
    createGain() { return { gain: { value: 1 }, connect(n) { return n; } }; }
    createBufferSource() {
      return {
        buffer: null, loop: false,
        connect(n) { return n; },
        start() { registo.iniciados.push(this); },
        stop() { registo.parados++; },
      };
    }
    decodeAudioData(dados, ok) { ok({ duracao: 1, dados }); }
    resume() { registo.retomado++; this.state = 'running'; return Promise.resolve(); }
  }
  return { Ctx, registo };
}

const resposta = (ok = true) => ({ ok, arrayBuffer: async () => new ArrayBuffer(8) });

test('som sem AudioContext: carrega, toca e muda sem erros', async () => {
  const progresso = [];
  const s = criarSom({ janela: {}, buscar: async () => resposta() });
  await s.carregar((f) => progresso.push(f));
  assert.equal(progresso.at(-1), 1);
  assert.doesNotThrow(() => { s.desbloquear(); s.tocar('golo'); s.iniciarAmbiente(); s.pararAmbiente(); });
  s.definirLigado(false);
  assert.equal(s.ligado, false);
});

test('som com ficheiro em falta: os outros tocam', async () => {
  const { Ctx, registo } = contextoFalso();
  const s = criarSom({ janela: { AudioContext: Ctx }, buscar: async (url) => (url === SONS.golo ? resposta(false) : resposta()) });
  await s.carregar();
  s.tocar('golo');
  assert.equal(registo.iniciados.length, 0);
  s.tocar('uuuh');
  assert.equal(registo.iniciados.length, 1);
  assert.equal(registo.iniciados[0].loop, false);
});

test('som: fetch que rejeita nao parte o carregamento', async () => {
  const { Ctx } = contextoFalso();
  const s = criarSom({ janela: { AudioContext: Ctx }, buscar: async () => { throw new Error('rede'); } });
  await assert.doesNotReject(s.carregar());
});

test('ambiente em ciclo, so uma vez, e para', async () => {
  const { Ctx, registo } = contextoFalso();
  const s = criarSom({ janela: { AudioContext: Ctx }, buscar: async () => resposta() });
  await s.carregar();
  s.iniciarAmbiente();
  s.iniciarAmbiente();
  assert.equal(registo.iniciados.length, 2);
  assert.ok(registo.iniciados.every((f) => f.loop));
  s.pararAmbiente();
  assert.equal(registo.parados, 2);
  s.desbloquear();
  assert.equal(registo.retomado, 1);
});
