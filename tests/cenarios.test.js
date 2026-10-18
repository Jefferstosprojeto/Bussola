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

const TIPOS_EVENTO = ['passe', 'remate', 'golo', 'perda', 'defesa'];
const BALIZA = { zMin: (CAMPO.largura - 6) / 2 + 0.11, zMax: (CAMPO.largura + 6) / 2 - 0.11, fundo: 1.2 };
const dentroDaBaliza = ([x, z]) => x > CAMPO.comprimento && x <= CAMPO.comprimento + BALIZA.fundo && z > BALIZA.zMin && z < BALIZA.zMax;

function alturasValidas(pontos, onde) {
  for (const p of pontos) if (p.length > 3) assert.ok(p[3] >= 0 && p[3] <= 3, `${onde}: altura ${p[3]} fora de 0 a 3`);
}

function eventosOrdenados(eventos, duracao, onde) {
  assert.ok(Array.isArray(eventos), `${onde}: falta a lista de eventos`);
  for (let i = 0; i < eventos.length; i++) {
    const e = eventos[i];
    assert.ok(TIPOS_EVENTO.includes(e.tipo), `${onde}: tipo ${e.tipo}`);
    assert.ok(e.t >= 0 && e.t <= duracao, `${onde}: evento ${e.tipo} em t=${e.t} fora de 0 a ${duracao}`);
    if (i > 0) assert.ok(e.t >= eventos[i - 1].t, `${onde}: eventos fora de ordem`);
  }
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
    eventosOrdenados(c.eventos, c.congelaEm, `${c.id}.eventos`);
    for (const e of c.eventos) {
      assert.ok(['passe', 'remate'].includes(e.tipo), `${c.id}: no lance so ha passes e remates`);
      assert.equal(c.jogadores[e.jogador]?.equipa, 'nos', `${c.id}: ${e.jogador} nao e nosso`);
    }

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
      for (const e of c.eventos) {
        const d = dist(posicaoEm(c.bola, e.t), posicaoEm(traj[e.jogador], e.t));
        assert.ok(d <= 1.5, `${onde}: ${e.jogador} esta a ${d.toFixed(2)} m da bola no ${e.tipo} do lance`);
      }

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
        const temGolo = (k.eventos || []).some((e) => e.tipo === 'golo');
        const ultimoBola = k.bola[k.bola.length - 1];
        if (temGolo) {
          verificarConsequencia(k.bola.slice(0, -1), `${o}.bola`, bolaNoCongelamento);
          assert.ok(ultimoBola[0] <= k.duracao, `${o}.bola: passa da duracao`);
          assert.ok(dentroDaBaliza([ultimoBola[1], ultimoBola[2]]), `${o}: golo sem a bola acabar dentro da baliza`);
        } else {
          verificarConsequencia(k.bola, `${o}.bola`, bolaNoCongelamento);
        }
        alturasValidas(k.bola, `${o}.bola`);

        eventosOrdenados(k.eventos, k.duracao, `${o}.eventos`);
        const golos = k.eventos.filter((e) => e.tipo === 'golo');
        assert.ok(golos.length <= 1, `${o}: mais do que um golo`);
        if (golos.length) {
          assert.equal(k.resultado, 'bom', `${o}: golo numa decisao errada`);
          assert.ok(posicaoEm(k.bola, golos[0].t)[0] >= CAMPO.comprimento, `${o}: golo antes de a bola passar a linha`);
        }
        const posNoTempo = (id, t) => (k.nos[id] ? posicaoEm(k.nos[id], t) : noCongelamento[id]);
        for (const e of k.eventos) {
          if (e.tipo === 'golo') {
            assert.equal(e.jogador, undefined, `${o}: golo nao tem jogador`);
            continue;
          }
          const j = c.jogadores[e.jogador];
          assert.ok(j, `${o}: ${e.tipo} de jogador desconhecido ${e.jogador}`);
          if (e.tipo === 'passe' || e.tipo === 'remate') {
            assert.equal(j.equipa, 'nos', `${o}: ${e.tipo} de ${e.jogador}`);
            const d = dist(posicaoEm(k.bola, e.t), posNoTempo(e.jogador, e.t));
            assert.ok(d <= 1.5, `${o}: ${e.jogador} esta a ${d.toFixed(2)} m da bola no ${e.tipo}`);
          }
          if (e.tipo === 'perda') assert.equal(j.equipa, 'eles', `${o}: perda para ${e.jogador}`);
          if (e.tipo === 'defesa') assert.ok(j.equipa === 'eles' && j.guardaRedes, `${o}: defesa de ${e.jogador}`);
        }
        const arthurFim = posicaoEm(k.nos.arthur, k.duracao);
        for (const [id, comp] of Object.entries(k.adversarios || {})) {
          assert.equal(c.jogadores[id]?.equipa, 'eles', `${o}: ${id} nao e adversario`);
          assert.ok(['perseguir', 'fechar', 'pressionar'].includes(comp.tipo), `${o}: tipo ${comp.tipo}`);
          if (comp.tipo === 'perseguir') assert.equal(comp.alvo, 'arthur');
          if (comp.tipo === 'fechar') {
            dentroDoCampo([[0, ...comp.ponto]], `${o}.${id}.ponto`);
            assert.ok(dist(comp.ponto, arthurFim) >= 1.3, `${o}.${id}: ponto de fechar a ${dist(comp.ponto, arthurFim).toFixed(2)} m do arthur`);
          }
        }

        // A bola não atravessa adversários parados (os que não reagem ficam onde congelaram).
        const bolaFim = posicaoEm(k.bola, k.duracao);
        const tFim = k.bola[k.bola.length - 1][0];
        for (const id of eles) {
          if ((k.adversarios || {})[id]) continue;
          for (let t = 0; t <= tFim + 1e-9; t += 0.05) {
            const b = posicaoEm(k.bola, t);
            if (dist(b, bolaFim) < 1) continue;
            const dd = dist(b, noCongelamento[id]);
            assert.ok(dd >= 1, `${o}: a bola passa a ${dd.toFixed(2)} m de ${id} (t=${t.toFixed(2)})`);
          }
        }
      }
    }
  });
}
