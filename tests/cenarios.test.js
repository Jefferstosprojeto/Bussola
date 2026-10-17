import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CAMPO, CENARIOS } from '../jogo/cenarios.js';
import { posicaoEm, trajetoriasDaVariante } from '../jogo/regras.js';

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function dentroDoCampo(pontos, onde) {
  for (const [, x, z] of pontos) {
    assert.ok(x >= 0 && x <= CAMPO.comprimento && z >= 0 && z <= CAMPO.largura, `${onde}: (${x}, ${z}) fora do campo`);
  }
}

function temposCrescentes(pontos, onde) {
  assert.ok(pontos.length >= 1, `${onde}: sem pontos`);
  for (let i = 1; i < pontos.length; i++) assert.ok(pontos[i][0] > pontos[i - 1][0], `${onde}: tempos nao crescem`);
}

function semTravessoes(valor, onde) {
  if (typeof valor === 'string') assert.ok(!/[–—]/.test(valor), `${onde}: tem travessao: ${valor}`);
  else if (valor && typeof valor === 'object') for (const [k, v] of Object.entries(valor)) semTravessoes(v, `${onde}.${k}`);
}

test('ids unicos e desbloqueios apontam para cenarios anteriores', () => {
  const vistos = [];
  for (const c of CENARIOS) {
    assert.ok(!vistos.includes(c.id), `id repetido ${c.id}`);
    if (c.desbloqueio) assert.ok(vistos.includes(c.desbloqueio.cenario), `${c.id}: desbloqueio invalido`);
    vistos.push(c.id);
  }
  assert.equal(CENARIOS[0].desbloqueio, null);
});

for (const c of CENARIOS) {
  test(`cenario ${c.id}`, () => {
    semTravessoes(c, c.id);
    assert.ok([0, 180].includes(c.direcaoBase), 'direcaoBase 0 ou 180');

    const ids = Object.keys(c.jogadores);
    const nos = ids.filter((id) => c.jogadores[id].equipa === 'nos');
    const eles = ids.filter((id) => c.jogadores[id].equipa === 'eles');
    assert.equal(nos.length, 7, '7 jogadores nossos');
    assert.equal(eles.length, 7, '7 adversarios');
    assert.ok(nos.includes('arthur'));
    assert.equal(nos.filter((id) => c.jogadores[id].guardaRedes).length, 1);
    assert.equal(eles.filter((id) => c.jogadores[id].guardaRedes).length, 1);

    const verificarBase = (pontos, onde) => {
      temposCrescentes(pontos, onde);
      dentroDoCampo(pontos, onde);
      assert.equal(pontos[0][0], 0, `${onde}: comeca em 0`);
      assert.equal(pontos[pontos.length - 1][0], c.congelaEm, `${onde}: acaba em congelaEm`);
    };
    for (const id of ids) verificarBase(c.jogadores[id].pontos, `${c.id}.${id}`);
    verificarBase(c.bola, `${c.id}.bola`);

    assert.equal(c.opcoes.length, 3);
    const opcaoIds = c.opcoes.map((o) => o.id);
    assert.equal(c.perguntaAtencao.pontos.length, 3);
    assert.ok(ids.includes(c.perguntaAtencao.jogador));
    const bolaNoCongelamento = posicaoEm(c.bola, c.congelaEm);

    assert.deepEqual(Object.keys(c.variantes).sort(), ['espaco', 'pressao']);
    for (const [vid, v] of Object.entries(c.variantes)) {
      const onde = `${c.id}.${vid}`;
      for (const [id, pontos] of Object.entries(v.alteracoes)) {
        assert.ok(ids.includes(id), `${onde}: alteracao de ${id} desconhecido`);
        verificarBase(pontos, `${onde}.alteracoes.${id}`);
      }
      assert.ok(Number.isInteger(v.atencaoCerta) && v.atencaoCerta >= 0 && v.atencaoCerta <= 2);
      assert.ok(opcaoIds.includes(v.decisaoCerta));
      assert.ok(['pressao', 'espaco'].includes(v.destaque.tipo));
      assert.ok(typeof v.frase === 'string' && v.frase.length > 0);

      const traj = trajetoriasDaVariante(c, vid);
      const noCongelamento = {};
      for (const id of ids) noCongelamento[id] = posicaoEm(traj[id], c.congelaEm);

      const certo = c.perguntaAtencao.pontos[v.atencaoCerta];
      assert.ok(dist(certo, noCongelamento[c.perguntaAtencao.jogador]) <= 1, `${onde}: ponto certo da pergunta nao bate com o jogador`);

      assert.deepEqual(Object.keys(v.consequencias).sort(), [...opcaoIds].sort(), `${onde}: uma consequencia por opcao`);
      for (const [oid, k] of Object.entries(v.consequencias)) {
        const o = `${onde}.${oid}`;
        assert.equal(k.resultado, oid === v.decisaoCerta ? 'bom' : 'mau', `${o}: resultado`);
        assert.ok(typeof k.texto === 'string' && k.texto.length > 0);
        assert.ok(k.nos.arthur, `${o}: falta a trajetoria do arthur`);
        const verificarConsequencia = (pontos, ondeP, inicio) => {
          temposCrescentes(pontos, ondeP);
          dentroDoCampo(pontos, ondeP);
          assert.equal(pontos[0][0], 0, `${ondeP}: comeca em 0`);
          assert.ok(pontos[pontos.length - 1][0] <= k.duracao, `${ondeP}: passa da duracao`);
          assert.ok(dist([pontos[0][1], pontos[0][2]], inicio) <= 0.5, `${ondeP}: nao continua da posicao no congelamento`);
        };
        for (const [id, pontos] of Object.entries(k.nos)) {
          assert.equal(c.jogadores[id]?.equipa, 'nos', `${o}: ${id} nao e nosso`);
          verificarConsequencia(pontos, `${o}.${id}`, noCongelamento[id]);
        }
        verificarConsequencia(k.bola, `${o}.bola`, bolaNoCongelamento);
        for (const [id, comp] of Object.entries(k.adversarios || {})) {
          assert.equal(c.jogadores[id]?.equipa, 'eles', `${o}: ${id} nao e adversario`);
          assert.ok(['perseguir', 'fechar', 'pressionar'].includes(comp.tipo), `${o}: tipo ${comp.tipo}`);
          if (comp.tipo === 'perseguir') assert.equal(comp.alvo, 'arthur');
          if (comp.tipo === 'fechar') dentroDoCampo([[0, ...comp.ponto]], `${o}.${id}.ponto`);
        }
      }
    }
  });
}
