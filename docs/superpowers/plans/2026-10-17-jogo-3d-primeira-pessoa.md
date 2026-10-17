# Jogo 3D na primeira pessoa: Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Um jogo 3D no browser (telemóvel e computador) em que o Arthur vê, pelos olhos de um Avançado Esquerdo do 3-1-2, três cenários de futebol de 7 com variantes "com pressão" e "com espaço", olha à volta, responde a uma pergunta de atenção, decide, vê a consequência e recebe estrelas.

**Architecture:** Página nova `jogo.html` com módulos ES em `jogo/`. Os dados dos cenários e as regras (scans, estrelas, recordes) são JavaScript puro testado em Node; o motor Three.js anima as trajetórias pelo relógio e, depois da decisão, os defensores passam a ser movidos pela biblioteca Yuka. Uma repetição 2D em canvas fecha cada jogada.

**Tech Stack:** Three.js 0.169.0 e Yuka 0.7.8 (por CDN via import map), módulos ES nativos, `node --test` (Node 24) para testes, Python 3 para o servidor local de verificação.

**Spec:** `docs/superpowers/specs/2026-10-17-jogo-3d-primeira-pessoa-design.md`

## Global Constraints

- Todo o texto visível em português de Portugal, sem travessões (nem `—` nem `–`), no tom curto e imperativo de treinador.
- `index.html` só pode ganhar o botão "Jogar 3D" e a regra CSS `.btn-jogo` (Tarefa 7). Nada mais nesse ficheiro muda.
- Three.js fixo em `https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js`; Yuka fixo em `https://cdn.jsdelivr.net/npm/yuka@0.7.8/build/yuka.module.js`. Nenhuma outra biblioteca externa. Fontes só do Google Fonts (Oswald, Work Sans, como no `index.html`).
- Campo: 55 m × 35 m. Coordenadas do jogo: `x` de 0 (nossa linha de fundo) a 55 (linha de fundo adversária); `z` de 0 (linha lateral esquerda, vista de quem ataca) a 35. No Three.js: `X = x - 27,5`, `Z = z - 17,5`, `Y` para cima.
- Ângulo de cabeça (`yaw`): 0 = virado para a baliza adversária (+x); positivo = rodar para a esquerda (para z menor). Rotação da câmara Three.js: `rotation.order = 'YXZ'`, `rotation.y = yaw - π/2`.
- Scan: conta quando `|yawRel| > 70°`; rearma quando `|yawRel| < 30°`. `yawRel` é relativo a `direcaoBase` do cenário. Estrela de scan: pelo menos 2 scans nos 4 s antes de `congelaEm`.
- Cores: nossa equipa camisola às riscas `#1B5C3E`/`#FFFFFF`, calções `#FFFFFF`; adversário `#C2493B`, calções `#3A1410`; guarda-redes nosso `#E2932E`, guarda-redes adversário `#6A4FB5`.
- Velocidade máxima dos defensores reativos: 6,5 m/s.
- Recordes em `localStorage`, chave `bussola-jogo-recordes`, sempre dentro de try/catch; o jogo funciona sem armazenamento.
- Verificação no browser sempre através do servidor local da Tarefa 5 (envia `charset=utf-8`), nunca `python -m http.server` simples.
- Git: trabalhar no ramo `jogo-3d`. Commits locais por tarefa. **Nunca** fazer push nem merge para `main` sem ok explícito do utilizador.
- Mensagens de commit terminam com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Rodar o telemóvel ou redimensionar a janela a meio do lance:** a imagem 3D ajusta-se sem ficar esticada e o lance continua (Tarefa 5, Passo 9).
2. **Mudar de app ou de separador a meio do lance:** ao voltar, o lance retoma onde estava; não salta para o congelamento (Tarefa 5, Passo 9).
3. **Tocar duas vezes numa opção ou tocar e carregar numa tecla ao mesmo tempo:** só a primeira escolha conta e o jogo não avança dois ecrãs (Tarefa 5, Passo 10).
4. **Armazenamento bloqueado (modo privado):** o jogo arranca, joga e mostra o resultado sem erros; os recordes simplesmente não ficam (Tarefa 1, teste `armazem com storage que falha`; Tarefa 5, Passo 10).
5. **"Sair" ou "Jogar outra vez" durante a consequência:** nenhum resultado da jogada anterior aparece depois (Tarefa 5, Passo 10).

---

## Estrutura de ficheiros

| Ficheiro | Responsabilidade |
|---|---|
| `package.json` | Só para testes: `type: module`, script `test`, devDependency `yuka@0.7.8` |
| `.gitignore` | Ignora `node_modules/` |
| `jogo.html` | Estrutura, ecrãs, estilos, import map |
| `jogo/fluxo.js` | Controla ecrãs, teclas, liga motor, regras e repetição |
| `jogo/motor.js` | Cena, jogadores, bola, câmara, relógio, câmara lenta, gravação |
| `jogo/campo.js` | Relva, linhas, áreas, balizas |
| `jogo/boneco.js` | Jogador 3D procedimental com animação de corrida |
| `jogo/olhar.js` | Olhar à volta: dedo, rato, setas |
| `jogo/cenarios.js` | Só dados: campo e os 3 cenários |
| `jogo/regras.js` | Funções puras: interpolação, variantes, scans, estrelas, recordes, desbloqueio |
| `jogo/adversarios.js` | Comportamentos Yuka dos defensores depois da decisão |
| `jogo/repeticao.js` | Repetição 2D em canvas |
| `tests/regras.test.js` | Testes de `regras.js` |
| `tests/cenarios.test.js` | Validação dos dados |
| `tests/adversarios.test.js` | Testes de `adversarios.js` |
| `tests/repeticao.test.js` | Teste de `quadroEm` |

---

### Task 1: Base de testes e regras do jogo

**Files:**
- Create: `package.json`, `.gitignore`, `jogo/regras.js`, `tests/regras.test.js`

**Interfaces:**
- Consumes: nada.
- Produces (em `jogo/regras.js`):
  - Constantes `LIMIAR_SCAN` (rad), `LIMIAR_REARME` (rad), `JANELA_SCAN = 4`, `MIN_SCANS = 2`, `CHAVE_RECORDES = 'bussola-jogo-recordes'`.
  - `posicaoEm(pontos: [t,x,z][], t: number): [x, z]`
  - `trajetoriasDaVariante(cenario, varianteId: string): { [id]: [t,x,z][] }`
  - `sortearVariante(cenario, rng = Math.random): string`
  - `criarContadorScans(): { registar(t, yawRel), total(): number, entre(t0, t1): number }`
  - `calcularEstrelas({ scansJanela, atencaoCerta, decisaoCerta }): { scan, atencao, decisao: boolean, total: number }`
  - `criarArmazem(storage | null): { melhor(id): number, guardar(id, estrelas): boolean }`
  - `estaDesbloqueado(cenario, armazem): boolean`
  - `yawParaPonto(de: [x,z], para: [x,z]): number`

- [ ] **Step 1: Criar o ramo e a base de testes**

```bash
git checkout -b jogo-3d
```

`package.json`:

```json
{
  "name": "bussola-jogo",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/"
  },
  "devDependencies": {
    "yuka": "0.7.8"
  }
}
```

`.gitignore`:

```
node_modules/
```

Run: `npm install`
Expected: cria `node_modules/yuka` sem erros.

- [ ] **Step 2: Escrever os testes que falham**

`tests/regras.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  posicaoEm, trajetoriasDaVariante, sortearVariante, criarContadorScans,
  calcularEstrelas, criarArmazem, estaDesbloqueado, yawParaPonto,
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
```

- [ ] **Step 3: Correr e ver falhar**

Run: `npm test`
Expected: FAIL com `Cannot find module '.../jogo/regras.js'`.

- [ ] **Step 4: Implementar `jogo/regras.js`**

```js
// Regras do jogo: funções puras, sem 3D nem DOM.

export const LIMIAR_SCAN = (70 * Math.PI) / 180;
export const LIMIAR_REARME = (30 * Math.PI) / 180;
export const JANELA_SCAN = 4;
export const MIN_SCANS = 2;
export const CHAVE_RECORDES = 'bussola-jogo-recordes';

export function posicaoEm(pontos, t) {
  if (t <= pontos[0][0]) return [pontos[0][1], pontos[0][2]];
  for (let i = 1; i < pontos.length; i++) {
    const [t1, x1, z1] = pontos[i];
    if (t <= t1) {
      const [t0, x0, z0] = pontos[i - 1];
      const f = t1 === t0 ? 1 : (t - t0) / (t1 - t0);
      return [x0 + (x1 - x0) * f, z0 + (z1 - z0) * f];
    }
  }
  const u = pontos[pontos.length - 1];
  return [u[1], u[2]];
}

export function trajetoriasDaVariante(cenario, varianteId) {
  const alteracoes = cenario.variantes[varianteId].alteracoes || {};
  const out = {};
  for (const [id, j] of Object.entries(cenario.jogadores)) out[id] = alteracoes[id] || j.pontos;
  return out;
}

export function sortearVariante(cenario, rng = Math.random) {
  const ids = Object.keys(cenario.variantes);
  return ids[Math.min(ids.length - 1, Math.floor(rng() * ids.length))];
}

export function criarContadorScans() {
  const tempos = [];
  let armado = true;
  return {
    registar(t, yawRel) {
      const a = Math.abs(yawRel);
      if (armado && a > LIMIAR_SCAN) {
        tempos.push(t);
        armado = false;
      } else if (!armado && a < LIMIAR_REARME) {
        armado = true;
      }
    },
    total: () => tempos.length,
    entre: (t0, t1) => tempos.filter((t) => t >= t0 && t <= t1).length,
  };
}

export function calcularEstrelas({ scansJanela, atencaoCerta, decisaoCerta }) {
  const scan = scansJanela >= MIN_SCANS;
  const atencao = !!atencaoCerta;
  const decisao = !!decisaoCerta;
  return { scan, atencao, decisao, total: Number(scan) + Number(atencao) + Number(decisao) };
}

export function criarArmazem(storage) {
  let dados = {};
  try {
    const bruto = storage ? storage.getItem(CHAVE_RECORDES) : null;
    const lido = bruto ? JSON.parse(bruto) : null;
    if (lido && typeof lido === 'object') dados = lido;
  } catch {
    dados = {};
  }
  const melhor = (id) => (typeof dados[id] === 'number' ? dados[id] : 0);
  return {
    melhor,
    guardar(id, estrelas) {
      if (estrelas <= melhor(id)) return false;
      dados[id] = estrelas;
      try {
        if (storage) storage.setItem(CHAVE_RECORDES, JSON.stringify(dados));
      } catch {
        // Sem armazenamento: o recorde fica só nesta sessão.
      }
      return true;
    },
  };
}

export function estaDesbloqueado(cenario, armazem) {
  const d = cenario.desbloqueio;
  return !d || armazem.melhor(d.cenario) >= d.estrelas;
}

export function yawParaPonto(de, para) {
  return Math.atan2(-(para[1] - de[1]), para[0] - de[0]);
}
```

- [ ] **Step 5: Correr e ver passar**

Run: `npm test`
Expected: PASS em todos os testes de `tests/regras.test.js`.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .gitignore jogo/regras.js tests/regras.test.js
git commit -m "Add game rules module with scan counter, stars and records"
```

---

### Task 2: Dados do cenário 1 e validador

**Files:**
- Create: `jogo/cenarios.js`, `tests/cenarios.test.js`

**Interfaces:**
- Consumes: `posicaoEm`, `trajetoriasDaVariante` de `jogo/regras.js`.
- Produces: `export const CAMPO = { comprimento: 55, largura: 35 }` e `export const CENARIOS = [ ... ]`. Formato de cada cenário:
  - `id, nome, descricao, direcaoBase (graus), congelaEm (s), desbloqueio (null | { cenario, estrelas })`
  - `jogadores: { [id]: { equipa: 'nos' | 'eles', guardaRedes?: true, pontos: [t,x,z][] } }`; o id `'arthur'` é a câmara.
  - `bola: [t,x,z][]`
  - `perguntaAtencao: { texto, jogador: id, pontos: [[x,z],[x,z],[x,z]] }`
  - `opcoes: [{ id, texto } x3]`
  - `variantes: { pressao, espaco }`, cada uma com `alteracoes`, `atencaoCerta` (0 a 2), `decisaoCerta` (id de opção), `frase`, `destaque: { tipo: 'pressao' | 'espaco', centro: [x,z], raio, legenda }`, `consequencias: { [opcaoId]: { duracao, resultado: 'bom' | 'mau', texto, nos: { [id]: [t,x,z][] }, bola: [t,x,z][], adversarios?: { [id]: { tipo: 'perseguir', alvo: 'arthur' } | { tipo: 'fechar', ponto: [x,z] } | { tipo: 'pressionar' } } } }`.
  - Nas consequências, `t` conta a partir do congelamento.

- [ ] **Step 1: Escrever o validador (falha porque o ficheiro de dados não existe)**

`tests/cenarios.test.js`:

```js
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
```

Run: `npm test`
Expected: FAIL com `Cannot find module '.../jogo/cenarios.js'`.

- [ ] **Step 2: Escrever `jogo/cenarios.js` com o cenário 1**

```js
// Dados dos cenários. Coordenadas em metros: x ao longo do campo (0 na nossa linha de fundo,
// 55 na adversária), z na largura (0 na lateral esquerda de quem ataca). Trajetórias: [tempo, x, z].
// Nas consequências, o tempo conta a partir do congelamento.

export const CAMPO = { comprimento: 55, largura: 35 };

const costasLateral = {
  id: 'costas-lateral',
  nome: 'Nas costas do lateral',
  descricao: 'O central sai a jogar e o lateral adversário subiu.',
  direcaoBase: 0,
  congelaEm: 7.5,
  desbloqueio: null,
  jogadores: {
    'n-gr': { equipa: 'nos', guardaRedes: true, pontos: [[0, 3, 17.5], [7.5, 5, 17]] },
    'n-de': { equipa: 'nos', pontos: [[0, 12, 7], [2, 13, 6], [5, 20, 5], [7.5, 21, 5]] },
    'n-dc': { equipa: 'nos', pontos: [[0, 13, 17.5], [2, 14, 17], [7.5, 18, 16]] },
    'n-dd': { equipa: 'nos', pontos: [[0, 12, 28], [7.5, 17, 27]] },
    'n-mc': { equipa: 'nos', pontos: [[0, 22, 16], [4, 26, 14], [7.5, 28, 12]] },
    arthur: { equipa: 'nos', pontos: [[0, 40, 6], [3, 41, 5.5], [7.5, 41, 5]] },
    'n-ad': { equipa: 'nos', pontos: [[0, 40, 27], [7.5, 44, 24]] },
    'e-gr': { equipa: 'eles', guardaRedes: true, pontos: [[0, 53, 17.5], [7.5, 52, 17]] },
    'e-lat': { equipa: 'eles', pontos: [[0, 39, 8], [7.5, 38, 8]] },
    'e-cen': { equipa: 'eles', pontos: [[0, 46, 15], [7.5, 46, 14]] },
    'e-lat2': { equipa: 'eles', pontos: [[0, 45, 27], [7.5, 44, 25]] },
    'e-med': { equipa: 'eles', pontos: [[0, 33, 17], [7.5, 30, 14]] },
    'e-av1': { equipa: 'eles', pontos: [[0, 24, 12], [7.5, 24, 9]] },
    'e-av2': { equipa: 'eles', pontos: [[0, 25, 23], [7.5, 23, 19]] },
  },
  bola: [[0, 13, 17.5], [0.8, 13, 17.5], [2, 13, 6.5], [5, 20, 5.5], [7.5, 21, 5.5]],
  perguntaAtencao: {
    texto: 'Onde estava o lateral adversário quando a bola saiu?',
    jogador: 'e-lat',
    pontos: [[27, 6], [40.4, 5.6], [45, 25]],
  },
  opcoes: [
    { id: 'profundidade', texto: 'Ataco o espaço nas costas' },
    { id: 'curto', texto: 'Venho curto e apoio' },
    { id: 'fico', texto: 'Fico parado na linha' },
  ],
  variantes: {
    espaco: {
      alteracoes: {
        'e-lat': [[0, 39, 8], [3, 38, 8], [5.5, 31, 6.5], [7.5, 27, 6]],
        'e-cen': [[0, 46, 15], [3, 46, 14], [7.5, 45, 15]],
      },
      atencaoCerta: 0,
      decisaoCerta: 'profundidade',
      frase: 'O lateral saiu a pressionar. Havia espaço nas costas dele: ataca a profundidade.',
      destaque: { tipo: 'espaco', centro: [47, 6], raio: 4, legenda: 'A verde: o espaço nas costas do lateral.' },
      consequencias: {
        profundidade: {
          duracao: 4, resultado: 'bom', texto: 'Ficaste isolado frente ao guarda-redes!',
          nos: { arthur: [[0, 41, 5], [1.5, 46, 5.5], [3, 50, 7]] },
          bola: [[0, 21, 5.5], [1.6, 46, 5.8], [3, 50, 7.2]],
          adversarios: {
            'e-lat': { tipo: 'perseguir', alvo: 'arthur' },
            'e-cen': { tipo: 'fechar', ponto: [49, 10] },
            'e-gr': { tipo: 'fechar', ponto: [51, 12] },
          },
        },
        curto: {
          duracao: 2.5, resultado: 'mau', texto: 'Recebeste, mas desperdiçaste o espaço nas costas.',
          nos: { arthur: [[0, 41, 5], [1.5, 37, 6]] },
          bola: [[0, 21, 5.5], [1.5, 36.8, 6]],
          adversarios: {
            'e-med': { tipo: 'fechar', ponto: [36, 8] },
            'e-lat': { tipo: 'perseguir', alvo: 'arthur' },
          },
        },
        fico: {
          duracao: 2.8, resultado: 'mau', texto: 'Ficaste parado e o central chegou primeiro.',
          nos: { arthur: [[0, 41, 5], [1.8, 41, 5]] },
          bola: [[0, 21, 5.5], [1.8, 40, 5.2]],
          adversarios: { 'e-cen': { tipo: 'fechar', ponto: [41, 6] } },
        },
      },
    },
    pressao: {
      alteracoes: {
        'e-lat': [[0, 39, 8], [3, 38, 8], [5, 40.3, 6], [7.5, 40.4, 5.6]],
        'e-cen': [[0, 46, 15], [3, 46, 14], [7.5, 47, 9]],
      },
      atencaoCerta: 1,
      decisaoCerta: 'curto',
      frase: 'O lateral estava colado nas tuas costas. Vem curto, apoia e joga simples.',
      destaque: { tipo: 'pressao', centro: [40.4, 5.6], raio: 2.5, legenda: 'A vermelho: o lateral colado nas tuas costas.' },
      consequencias: {
        profundidade: {
          duracao: 2.8, resultado: 'mau', texto: 'O central fechou o espaço e ganhou a bola.',
          nos: { arthur: [[0, 41, 5], [1.5, 46, 6], [2.8, 47, 7]] },
          bola: [[0, 21, 5.5], [1.8, 47, 8.5]],
          adversarios: {
            'e-cen': { tipo: 'fechar', ponto: [47, 8.5] },
            'e-lat': { tipo: 'perseguir', alvo: 'arthur' },
          },
        },
        curto: {
          duracao: 3.6, resultado: 'bom', texto: 'Apoiaste e tocaste de primeira para o médio. Bola segura.',
          nos: {
            arthur: [[0, 41, 5], [1.4, 36, 6.5], [2.6, 35.5, 7]],
            'n-mc': [[0, 28, 12], [2.6, 31, 11]],
          },
          bola: [[0, 21, 5.5], [1.4, 35.8, 6.5], [2.6, 31, 11]],
          adversarios: { 'e-lat': { tipo: 'perseguir', alvo: 'arthur' } },
        },
        fico: {
          duracao: 2.8, resultado: 'mau', texto: 'O lateral estava colado a ti e roubou a bola.',
          nos: { arthur: [[0, 41, 5], [1.8, 41, 5]] },
          bola: [[0, 21, 5.5], [1.8, 40.2, 5.6]],
          adversarios: { 'e-lat': { tipo: 'fechar', ponto: [40.2, 5.6] } },
        },
      },
    },
  },
};

export const CENARIOS = [costasLateral];
```

- [ ] **Step 3: Correr e ver passar**

Run: `npm test`
Expected: PASS, incluindo `cenario costas-lateral`.

- [ ] **Step 4: Commit**

```bash
git add jogo/cenarios.js tests/cenarios.test.js
git commit -m "Add scenario data format, first scenario and data validator"
```

---

### Task 3: Cenários 2 e 3

**Files:**
- Modify: `jogo/cenarios.js` (acrescentar dois objetos e atualizar `CENARIOS`)

**Interfaces:**
- Consumes: formato da Tarefa 2.
- Produces: `CENARIOS = [costasLateral, receberCostas, rematarAssistir]` com ids `'costas-lateral'`, `'receber-costas'`, `'rematar-assistir'`.

- [ ] **Step 1: Acrescentar os cenários antes de `export const CENARIOS`**

```js
const receberCostas = {
  id: 'receber-costas',
  nome: 'Receber de costas',
  descricao: 'O médio vai passar-te a bola e tens um central atrás.',
  direcaoBase: 180,
  congelaEm: 7.5,
  desbloqueio: { cenario: 'costas-lateral', estrelas: 2 },
  jogadores: {
    'n-gr': { equipa: 'nos', guardaRedes: true, pontos: [[0, 3, 17.5], [7.5, 4, 17.5]] },
    'n-de': { equipa: 'nos', pontos: [[0, 13, 7], [7.5, 17, 6]] },
    'n-dc': { equipa: 'nos', pontos: [[0, 14, 17], [1, 15, 17], [7.5, 18, 17]] },
    'n-dd': { equipa: 'nos', pontos: [[0, 13, 28], [7.5, 17, 28]] },
    'n-mc': { equipa: 'nos', pontos: [[0, 22, 16], [4, 26, 15], [7.5, 28, 14]] },
    arthur: { equipa: 'nos', pontos: [[0, 40, 11], [4, 37, 12], [7.5, 35, 12.5]] },
    'n-ad': { equipa: 'nos', pontos: [[0, 40, 26], [7.5, 43, 23]] },
    'e-gr': { equipa: 'eles', guardaRedes: true, pontos: [[0, 53, 17.5], [7.5, 52, 16]] },
    'e-lat': { equipa: 'eles', pontos: [[0, 44, 7], [7.5, 42, 8]] },
    'e-cen': { equipa: 'eles', pontos: [[0, 43, 13], [7.5, 41, 13]] },
    'e-lat2': { equipa: 'eles', pontos: [[0, 44, 27], [7.5, 43, 25]] },
    'e-med': { equipa: 'eles', pontos: [[0, 32, 18], [7.5, 31, 17]] },
    'e-av1': { equipa: 'eles', pontos: [[0, 25, 10], [7.5, 23, 12]] },
    'e-av2': { equipa: 'eles', pontos: [[0, 26, 24], [7.5, 24, 21]] },
  },
  bola: [[0, 14, 17], [1, 15, 17], [2.5, 24.5, 15.6], [4, 26, 15.2], [7.5, 28, 14.3]],
  perguntaAtencao: {
    texto: 'Onde estava o central adversário quando a bola saiu?',
    jogador: 'e-cen',
    pontos: [[36.2, 12.6], [41.5, 14], [46, 24]],
  },
  opcoes: [
    { id: 'rodar', texto: 'Rodo e ataco a baliza' },
    { id: 'tabelar', texto: 'Protejo e tabelo com o médio' },
    { id: 'recuar', texto: 'Recuo com a bola' },
  ],
  variantes: {
    pressao: {
      alteracoes: { 'e-cen': [[0, 43, 13], [3, 41, 13], [5.5, 38, 12.8], [7.5, 36.2, 12.6]] },
      atencaoCerta: 0,
      decisaoCerta: 'tabelar',
      frase: 'O central estava colado nas tuas costas. Protege a bola e tabela.',
      destaque: { tipo: 'pressao', centro: [36.2, 12.6], raio: 2.5, legenda: 'A vermelho: o central colado nas tuas costas.' },
      consequencias: {
        rodar: {
          duracao: 3.2, resultado: 'mau', texto: 'Rodaste com o central colado e perdeste a bola.',
          nos: { arthur: [[0, 35, 12.5], [1.2, 35.5, 12.5], [2.2, 36, 13]] },
          bola: [[0, 28, 14.3], [1.2, 35.3, 12.6], [2.2, 36.4, 12.8]],
          adversarios: { 'e-cen': { tipo: 'pressionar' } },
        },
        tabelar: {
          duracao: 4.5, resultado: 'bom', texto: 'Protegeste, tabelaste e ganhaste as costas do central.',
          nos: {
            arthur: [[0, 35, 12.5], [1.2, 35.2, 12.5], [2, 36, 10], [3.5, 42, 9]],
            'n-mc': [[0, 28, 14], [2, 31, 13]],
          },
          bola: [[0, 28, 14.3], [1.2, 35, 12.6], [2, 31, 13], [3.5, 42, 9.2]],
          adversarios: { 'e-cen': { tipo: 'perseguir', alvo: 'arthur' } },
        },
        recuar: {
          duracao: 4, resultado: 'mau', texto: 'Recuaste e a equipa perdeu terreno. O central ficou confortável.',
          nos: { arthur: [[0, 35, 12.5], [1.2, 35, 12.5], [3, 31, 13]] },
          bola: [[0, 28, 14.3], [1.2, 35, 12.6], [3, 31.3, 13]],
          adversarios: { 'e-cen': { tipo: 'perseguir', alvo: 'arthur' } },
        },
      },
    },
    espaco: {
      alteracoes: { 'e-cen': [[0, 43, 13], [3, 41, 13], [5, 42, 14], [7.5, 41.5, 14]] },
      atencaoCerta: 1,
      decisaoCerta: 'rodar',
      frase: 'O central estava longe. Recebe orientado, roda e ataca a baliza.',
      destaque: { tipo: 'espaco', centro: [39, 13.5], raio: 3, legenda: 'A verde: o espaço para rodar.' },
      consequencias: {
        rodar: {
          duracao: 5, resultado: 'bom', texto: 'Tinhas espaço, rodaste e marcaste golo!',
          nos: { arthur: [[0, 35, 12.5], [1.2, 35.3, 12.5], [3, 42, 12], [4, 46, 13]] },
          bola: [[0, 28, 14.3], [1.2, 35, 12.6], [3, 42.5, 12.2], [4, 46.4, 13.1], [4.6, 55, 16]],
          adversarios: {
            'e-cen': { tipo: 'perseguir', alvo: 'arthur' },
            'e-gr': { tipo: 'fechar', ponto: [52, 18.5] },
          },
        },
        tabelar: {
          duracao: 3.4, resultado: 'mau', texto: 'Jogaste seguro, mas tinhas espaço para rodar e atacar.',
          nos: {
            arthur: [[0, 35, 12.5], [1.2, 35.2, 12.5], [2.4, 36, 12.5]],
            'n-mc': [[0, 28, 14], [2.4, 29.5, 14]],
          },
          bola: [[0, 28, 14.3], [1.2, 35, 12.6], [2.4, 29.8, 14]],
        },
        recuar: {
          duracao: 4, resultado: 'mau', texto: 'Recuaste sem pressão. Podias ter rodado e atacado.',
          nos: { arthur: [[0, 35, 12.5], [1.2, 35, 12.5], [3, 31, 13]] },
          bola: [[0, 28, 14.3], [1.2, 35, 12.6], [3, 31.3, 13]],
        },
      },
    },
  },
};

const rematarAssistir = {
  id: 'rematar-assistir',
  nome: 'Rematar ou assistir',
  descricao: 'A bola chega à área e o teu colega aparece do outro lado.',
  direcaoBase: 0,
  congelaEm: 7.5,
  desbloqueio: { cenario: 'receber-costas', estrelas: 2 },
  jogadores: {
    'n-gr': { equipa: 'nos', guardaRedes: true, pontos: [[0, 3, 17.5], [7.5, 8, 17.5]] },
    'n-de': { equipa: 'nos', pontos: [[0, 18, 6], [7.5, 24, 6]] },
    'n-dc': { equipa: 'nos', pontos: [[0, 16, 17], [1, 18, 17], [7.5, 22, 17]] },
    'n-dd': { equipa: 'nos', pontos: [[0, 18, 29], [7.5, 24, 28]] },
    'n-mc': { equipa: 'nos', pontos: [[0, 26, 17], [4, 32, 16], [7.5, 36, 15]] },
    arthur: { equipa: 'nos', pontos: [[0, 40, 9], [4, 44, 11], [7.5, 46, 12]] },
    'n-ad': { equipa: 'nos', pontos: [[0, 40, 27], [4, 44, 24], [7.5, 47, 21]] },
    'e-gr': { equipa: 'eles', guardaRedes: true, pontos: [[0, 53, 17.5], [7.5, 51, 15]] },
    'e-lat': { equipa: 'eles', pontos: [[0, 47, 7], [7.5, 48, 9]] },
    'e-cen': { equipa: 'eles', pontos: [[0, 46, 15], [7.5, 46, 14.5]] },
    'e-lat2': { equipa: 'eles', pontos: [[0, 45, 27], [7.5, 46, 27]] },
    'e-med': { equipa: 'eles', pontos: [[0, 34, 18], [7.5, 38, 17]] },
    'e-av1': { equipa: 'eles', pontos: [[0, 30, 10], [7.5, 30, 12]] },
    'e-av2': { equipa: 'eles', pontos: [[0, 30, 24], [7.5, 30, 22]] },
  },
  bola: [[0, 16, 17], [1, 18, 17], [2.5, 29.7, 16.4], [4, 32, 16.2], [7.5, 36, 15.2]],
  perguntaAtencao: {
    texto: 'Onde estava o central adversário quando a bola saiu?',
    jogador: 'e-cen',
    pontos: [[47, 12.6], [47.5, 20], [40, 25]],
  },
  opcoes: [
    { id: 'rematar', texto: 'Remato de primeira' },
    { id: 'passar', texto: 'Passo ao colega livre' },
    { id: 'driblar', texto: 'Tento driblar o defesa' },
  ],
  variantes: {
    pressao: {
      alteracoes: { 'e-cen': [[0, 46, 15], [3, 45.5, 14.5], [7.5, 47, 12.6]] },
      atencaoCerta: 0,
      decisaoCerta: 'passar',
      frase: 'O central estava à tua frente e o colega estava livre. Passa.',
      destaque: { tipo: 'pressao', centro: [47, 12.6], raio: 2.5, legenda: 'A vermelho: o central à tua frente.' },
      consequencias: {
        rematar: {
          duracao: 2.8, resultado: 'mau', texto: 'O central estava na frente e bloqueou o remate.',
          nos: { arthur: [[0, 46, 12], [1.2, 46.2, 12.2]] },
          bola: [[0, 36, 15.2], [1.2, 46, 12.2], [1.8, 47.2, 12.6]],
          adversarios: { 'e-cen': { tipo: 'fechar', ponto: [47.2, 12.6] } },
        },
        passar: {
          duracao: 3.8, resultado: 'bom', texto: 'Passaste ao colega livre e ele marcou. Golo!',
          nos: {
            arthur: [[0, 46, 12], [1.2, 46.2, 12.2]],
            'n-ad': [[0, 47, 21], [2, 48, 20]],
          },
          bola: [[0, 36, 15.2], [1.2, 46, 12.2], [2, 48, 20], [2.8, 55, 18.5]],
          adversarios: { 'e-gr': { tipo: 'fechar', ponto: [51, 17] } },
        },
        driblar: {
          duracao: 3.2, resultado: 'mau', texto: 'Com o central colado, o drible não passou.',
          nos: { arthur: [[0, 46, 12], [1.2, 46.2, 12.2], [2.2, 47, 12.4]] },
          bola: [[0, 36, 15.2], [1.2, 46, 12.2], [2.2, 47.2, 12.5]],
          adversarios: { 'e-cen': { tipo: 'pressionar' } },
        },
      },
    },
    espaco: {
      alteracoes: { 'e-cen': [[0, 46, 15], [3, 45.5, 14.5], [7.5, 47.5, 20]] },
      atencaoCerta: 1,
      decisaoCerta: 'rematar',
      frase: 'O central foi marcar o teu colega. Tinhas a linha livre: remata.',
      destaque: { tipo: 'espaco', centro: [50, 14], raio: 3, legenda: 'A verde: a linha livre para a baliza.' },
      consequencias: {
        rematar: {
          duracao: 3, resultado: 'bom', texto: 'Tinhas a linha livre e remataste de primeira. Golo!',
          nos: { arthur: [[0, 46, 12], [1.2, 46.2, 12.2]] },
          bola: [[0, 36, 15.2], [1.2, 46, 12.2], [2, 55, 16]],
          adversarios: { 'e-gr': { tipo: 'fechar', ponto: [52, 18] } },
        },
        passar: {
          duracao: 2.8, resultado: 'mau', texto: 'O central estava a marcar o teu colega e cortou o passe.',
          nos: { arthur: [[0, 46, 12], [1.2, 46.2, 12.2]] },
          bola: [[0, 36, 15.2], [1.2, 46, 12.2], [2, 47.4, 19.8]],
          adversarios: { 'e-cen': { tipo: 'fechar', ponto: [47.4, 19.8] } },
        },
        driblar: {
          duracao: 3.6, resultado: 'mau', texto: 'Tinhas linha de remate e perdeste tempo. O guarda-redes chegou.',
          nos: { arthur: [[0, 46, 12], [1.2, 46.2, 12.2], [2.6, 49, 13]] },
          bola: [[0, 36, 15.2], [1.2, 46, 12.2], [2.6, 49.3, 13.2]],
          adversarios: { 'e-gr': { tipo: 'fechar', ponto: [49.3, 13.2] } },
        },
      },
    },
  },
};
```

Substituir a última linha por:

```js
export const CENARIOS = [costasLateral, receberCostas, rematarAssistir];
```

- [ ] **Step 2: Correr o validador**

Run: `npm test`
Expected: PASS em `cenario costas-lateral`, `cenario receber-costas`, `cenario rematar-assistir`.

- [ ] **Step 3: Commit**

```bash
git add jogo/cenarios.js
git commit -m "Add Receber de costas and Rematar ou assistir scenarios"
```

---

### Task 4: Adversários reativos com Yuka

**Files:**
- Create: `jogo/adversarios.js`, `tests/adversarios.test.js`

**Interfaces:**
- Consumes: pacote `yuka` (Node: `node_modules`; browser: import map da Tarefa 5).
- Produces:
  - `VELOCIDADE_MAX = 6.5`
  - `criarReacao(comportamentos: { [id]: {tipo, alvo?, ponto?} }, posicoesIniciais: { [id]: [x,z] }): { ids(): string[], atualizar(dt, { arthur: [x,z], bola: [x,z] }), posicao(id): [x,z] | null }`

- [ ] **Step 1: Escrever os testes que falham**

`tests/adversarios.test.js`:

```js
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
```

Run: `npm test`
Expected: FAIL com `Cannot find module '.../jogo/adversarios.js'`.

- [ ] **Step 2: Implementar `jogo/adversarios.js`**

```js
// Defensores que reagem à decisão do Arthur: marcar, fechar um espaço, pressionar a bola.
import { ArriveBehavior, EntityManager, Vector3, Vehicle } from 'yuka';

export const VELOCIDADE_MAX = 6.5;

const PARAMETROS = {
  fechar: { desaceleracao: 0.8, tolerancia: 0.2 },
  perseguir: { desaceleracao: 0.4, tolerancia: 0.8 },
  pressionar: { desaceleracao: 0.4, tolerancia: 0.6 },
};

export function criarReacao(comportamentos, posicoesIniciais) {
  const gestor = new EntityManager();
  const agentes = new Map();
  for (const [id, c] of Object.entries(comportamentos)) {
    const inicio = posicoesIniciais[id];
    const p = PARAMETROS[c.tipo];
    if (!inicio || !p) continue;
    const v = new Vehicle();
    v.maxSpeed = VELOCIDADE_MAX;
    v.maxForce = 40;
    v.position.set(inicio[0], 0, inicio[1]);
    const alvo = new Vector3();
    if (c.tipo === 'fechar') alvo.set(c.ponto[0], 0, c.ponto[1]);
    v.steering.add(new ArriveBehavior(alvo, p.desaceleracao, p.tolerancia));
    gestor.add(v);
    agentes.set(id, { v, alvo, tipo: c.tipo });
  }
  return {
    ids: () => [...agentes.keys()],
    atualizar(dt, { arthur, bola }) {
      for (const { alvo, tipo } of agentes.values()) {
        if (tipo === 'perseguir') alvo.set(arthur[0], 0, arthur[1]);
        else if (tipo === 'pressionar') alvo.set(bola[0], 0, bola[1]);
      }
      gestor.update(dt);
    },
    posicao(id) {
      const a = agentes.get(id);
      return a ? [a.v.position.x, a.v.position.z] : null;
    },
  };
}
```

- [ ] **Step 3: Correr e ver passar**

Run: `npm test`
Expected: PASS em todos os testes de `tests/adversarios.test.js` (e os anteriores continuam a passar).

- [ ] **Step 4: Commit**

```bash
git add jogo/adversarios.js tests/adversarios.test.js
git commit -m "Add Yuka-driven defender reactions"
```

---

### Task 5: Cena 3D e jogo jogável (motor, página e fluxo)

**Files:**
- Create: `jogo/campo.js`, `jogo/boneco.js`, `jogo/olhar.js`, `jogo/motor.js`, `jogo/fluxo.js`, `jogo.html`
- Create (fora do repositório, na scratchpad do agente): `servidor.py`

**Interfaces:**
- Consumes: tudo de `regras.js`, `CAMPO` e `CENARIOS` de `cenarios.js`, `criarReacao` de `adversarios.js`.
- Produces:
  - `construirCampo({ comprimento, largura }): THREE.Group`
  - `criarBoneco({ camisola: string[], calcoes: string }): { grupo: THREE.Group, animar(velocidade, dt), libertar() }`
  - `criarOlhar(elemento): { yawRel, pitch, ativo, atualizar(dt), reiniciar() }`
  - `criarMotor(canvas)` (lança `Error('sem-webgl')` se não houver WebGL) devolve `{ jogar(cenario, varianteId, { aoOlhar(t, yawRel), aoCongelar() }), continuar(opcaoId, { aoTerminar(frames) }), parar() }`
  - Formato de `frames`: `[{ t, fase: 'lance' | 'consequencia', pos: { [id]: [x,z] } (inclui 'arthur'), bola: [x,z] }]`, com `t` em tempo de jogo (a consequência continua a partir de `congelaEm`). A Tarefa 6 usa este formato.
  - Em `jogo.html`: botão `#btnRepeticao` existe com `hidden`; o ecrã `#ecra-repeticao` existe. A Tarefa 6 liga-os.

- [ ] **Step 1: `jogo/campo.js`**

```js
// Campo de futebol de 7 em 3D: relva às riscas, linhas, áreas e balizas.
import * as THREE from 'three';

const LARGURA_LINHA = 0.12;
const AREA_FUNDO = 9;
const AREA_LARGURA = 20;
const BALIZA_LARGURA = 6;
const BALIZA_ALTURA = 2;

function texturaRiscas(n) {
  const tela = document.createElement('canvas');
  tela.width = 512;
  tela.height = 8;
  const ctx = tela.getContext('2d');
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 ? '#367F42' : '#3E8E4A';
    ctx.fillRect((i * tela.width) / n, 0, tela.width / n + 1, tela.height);
  }
  const t = new THREE.CanvasTexture(tela);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function construirCampo({ comprimento: C, largura: L }) {
  const g = new THREE.Group();
  const p = (x, z) => [x - C / 2, z - L / 2];
  const branco = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });

  const fora = new THREE.Mesh(new THREE.PlaneGeometry(C + 24, L + 20), new THREE.MeshLambertMaterial({ color: '#2F6B3A' }));
  fora.rotation.x = -Math.PI / 2;
  fora.position.y = -0.02;
  g.add(fora);

  const relva = new THREE.Mesh(new THREE.PlaneGeometry(C, L), new THREE.MeshLambertMaterial({ map: texturaRiscas(11) }));
  relva.rotation.x = -Math.PI / 2;
  g.add(relva);

  const faixa = (xa, za, xb, zb) => {
    const [ax, az] = p(xa, za);
    const [bx, bz] = p(xb, zb);
    const comp = Math.hypot(bx - ax, bz - az);
    const m = new THREE.Mesh(new THREE.BoxGeometry(comp + LARGURA_LINHA, 0.01, LARGURA_LINHA), branco);
    m.position.set((ax + bx) / 2, 0.005, (az + bz) / 2);
    m.rotation.y = Math.atan2(-(bz - az), bx - ax);
    g.add(m);
  };
  const retangulo = (x0, z0, x1, z1) => {
    faixa(x0, z0, x1, z0);
    faixa(x1, z0, x1, z1);
    faixa(x1, z1, x0, z1);
    faixa(x0, z1, x0, z0);
  };

  retangulo(0, 0, C, L);
  faixa(C / 2, 0, C / 2, L);
  const zArea = (L - AREA_LARGURA) / 2;
  retangulo(0, zArea, AREA_FUNDO, zArea + AREA_LARGURA);
  retangulo(C - AREA_FUNDO, zArea, C, zArea + AREA_LARGURA);

  const circulo = new THREE.Mesh(new THREE.RingGeometry(6 - LARGURA_LINHA / 2, 6 + LARGURA_LINHA / 2, 64), branco);
  circulo.rotation.x = -Math.PI / 2;
  circulo.position.y = 0.006;
  g.add(circulo);
  const marca = new THREE.Mesh(new THREE.CircleGeometry(0.15, 16), branco);
  marca.rotation.x = -Math.PI / 2;
  marca.position.y = 0.006;
  g.add(marca);

  const poste = new THREE.MeshLambertMaterial({ color: '#FFFFFF' });
  const rede = new THREE.MeshBasicMaterial({ color: '#FFFFFF', wireframe: true, transparent: true, opacity: 0.35 });
  for (const [x, lado] of [[0, -1], [C, 1]]) {
    const [bx] = p(x, 0);
    for (const z of [L / 2 - BALIZA_LARGURA / 2, L / 2 + BALIZA_LARGURA / 2]) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, BALIZA_ALTURA, 10), poste);
      m.position.set(bx, BALIZA_ALTURA / 2, p(0, z)[1]);
      g.add(m);
    }
    const trave = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, BALIZA_LARGURA, 10), poste);
    trave.rotation.x = Math.PI / 2;
    trave.position.set(bx, BALIZA_ALTURA, 0);
    g.add(trave);
    const r = new THREE.Mesh(new THREE.BoxGeometry(1.2, BALIZA_ALTURA, BALIZA_LARGURA, 4, 4, 8), rede);
    r.position.set(bx + lado * 0.6, BALIZA_ALTURA / 2, 0);
    g.add(r);
  }
  return g;
}
```

- [ ] **Step 2: `jogo/boneco.js`**

```js
// Jogador 3D simples, com balanço de pernas e braços ao correr. A frente é o -z local.
import * as THREE from 'three';

const PELE = '#E8B89A';

function texturaRiscas(cores) {
  const tela = document.createElement('canvas');
  tela.width = 64;
  tela.height = 8;
  const ctx = tela.getContext('2d');
  const n = 6;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = cores[i % cores.length];
    ctx.fillRect((i * tela.width) / n, 0, tela.width / n + 1, tela.height);
  }
  const t = new THREE.CanvasTexture(tela);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function caixa(l, a, p, cor, mapa) {
  const material = new THREE.MeshLambertMaterial(mapa ? { map: mapa } : { color: cor });
  return new THREE.Mesh(new THREE.BoxGeometry(l, a, p), material);
}

export function criarBoneco({ camisola, calcoes }) {
  const grupo = new THREE.Group();

  const tronco = caixa(0.42, 0.5, 0.24, camisola[0], camisola.length > 1 ? texturaRiscas(camisola) : null);
  tronco.position.y = 1.05;
  grupo.add(tronco);

  const calc = caixa(0.42, 0.18, 0.25, calcoes);
  calc.position.y = 0.73;
  grupo.add(calc);

  const cabeca = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), new THREE.MeshLambertMaterial({ color: PELE }));
  cabeca.position.y = 1.48;
  grupo.add(cabeca);

  const membro = (largura, comprimento, cor, x, y) => {
    const pivo = new THREE.Group();
    pivo.position.set(x, y, 0);
    const m = caixa(largura, comprimento, largura, cor);
    m.position.y = -comprimento / 2;
    pivo.add(m);
    grupo.add(pivo);
    return pivo;
  };
  const pernaE = membro(0.13, 0.66, camisola[0], -0.11, 0.66);
  const pernaD = membro(0.13, 0.66, camisola[0], 0.11, 0.66);
  const bracoE = membro(0.1, 0.48, PELE, -0.27, 1.27);
  const bracoD = membro(0.1, 0.48, PELE, 0.27, 1.27);

  const sombra = new THREE.Mesh(
    new THREE.CircleGeometry(0.35, 20),
    new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.22, depthWrite: false }),
  );
  sombra.rotation.x = -Math.PI / 2;
  sombra.position.y = 0.01;
  grupo.add(sombra);

  let fase = 0;
  return {
    grupo,
    animar(velocidade, dt) {
      fase += velocidade * dt * 3.2;
      const amp = Math.min(velocidade / 6, 1) * 0.8;
      const s = Math.sin(fase) * amp;
      pernaE.rotation.x = s;
      pernaD.rotation.x = -s;
      bracoE.rotation.x = -s * 0.8;
      bracoD.rotation.x = s * 0.8;
    },
    libertar() {
      grupo.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (o.material.map) o.material.map.dispose();
          o.material.dispose();
        }
      });
    },
  };
}
```

- [ ] **Step 3: `jogo/olhar.js`**

```js
// Olhar à volta: dedo, rato (arrastar) e setas. Ângulos em radianos; yawRel positivo = esquerda.
const SENS_TOQUE = 0.006;
const SENS_RATO = 0.005;
const VEL_SETAS = 2.6;
const VEL_SETAS_VERTICAL = 1.2;
const PITCH_MAX = (25 * Math.PI) / 180;

export function criarOlhar(elemento) {
  const teclas = new Set();
  let arrasto = null;

  const s = {
    yawRel: 0,
    pitch: 0,
    ativo: false,
    atualizar(dt) {
      if (!s.ativo) return;
      if (teclas.has('ArrowLeft')) s.yawRel += VEL_SETAS * dt;
      if (teclas.has('ArrowRight')) s.yawRel -= VEL_SETAS * dt;
      if (teclas.has('ArrowUp')) s.pitch += VEL_SETAS_VERTICAL * dt;
      if (teclas.has('ArrowDown')) s.pitch -= VEL_SETAS_VERTICAL * dt;
      limitar();
    },
    reiniciar() {
      s.yawRel = 0;
      s.pitch = 0;
      arrasto = null;
      teclas.clear();
    },
  };

  function limitar() {
    s.yawRel = Math.max(-Math.PI, Math.min(Math.PI, s.yawRel));
    s.pitch = Math.max(-PITCH_MAX, Math.min(PITCH_MAX, s.pitch));
  }

  elemento.addEventListener('pointerdown', (ev) => {
    if (!s.ativo) return;
    arrasto = { x: ev.clientX, y: ev.clientY, id: ev.pointerId };
    if (elemento.setPointerCapture) elemento.setPointerCapture(ev.pointerId);
  });
  elemento.addEventListener('pointermove', (ev) => {
    if (!s.ativo || !arrasto || ev.pointerId !== arrasto.id) return;
    const k = ev.pointerType === 'mouse' ? SENS_RATO : SENS_TOQUE;
    s.yawRel -= (ev.clientX - arrasto.x) * k;
    s.pitch -= (ev.clientY - arrasto.y) * k;
    arrasto.x = ev.clientX;
    arrasto.y = ev.clientY;
    limitar();
  });
  const largar = () => { arrasto = null; };
  elemento.addEventListener('pointerup', largar);
  elemento.addEventListener('pointercancel', largar);

  window.addEventListener('keydown', (ev) => {
    if (!ev.key.startsWith('Arrow')) return;
    if (s.ativo) ev.preventDefault();
    teclas.add(ev.key);
  });
  window.addEventListener('keyup', (ev) => teclas.delete(ev.key));
  window.addEventListener('blur', () => teclas.clear());

  return s;
}
```

- [ ] **Step 4: `jogo/motor.js`**

```js
// Motor 3D do jogo: cena, jogadores, bola, câmara na 1ª pessoa, relógio, câmara lenta e gravação.
import * as THREE from 'three';
import { CAMPO } from './cenarios.js';
import { construirCampo } from './campo.js';
import { criarBoneco } from './boneco.js';
import { criarOlhar } from './olhar.js';
import { posicaoEm, trajetoriasDaVariante, yawParaPonto } from './regras.js';
import { criarReacao } from './adversarios.js';

const ALTURA_OLHOS = 1.4;
const RAIO_BOLA = 0.11;
const ABRANDAR = 0.6;
const ESCALA_MIN = 0.08;
const PASSO_GRAVACAO = 0.1;
const BALANCO = 0.04;
const DT_MAX = 0.05;

const CORES = {
  nos: { camisola: ['#1B5C3E', '#FFFFFF'], calcoes: '#FFFFFF' },
  eles: { camisola: ['#C2493B'], calcoes: '#3A1410' },
  grNos: { camisola: ['#E2932E'], calcoes: '#1A1A1A' },
  grEles: { camisola: ['#6A4FB5'], calcoes: '#1A1A1A' },
};

const paraMundo = (x, z) => [x - CAMPO.comprimento / 2, z - CAMPO.largura / 2];
const normalizar = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export function criarMotor(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch {
    throw new Error('sem-webgl');
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const cena = new THREE.Scene();
  cena.background = new THREE.Color('#9FD3F5');
  cena.fog = new THREE.Fog('#9FD3F5', 60, 140);
  cena.add(new THREE.HemisphereLight('#FFFFFF', '#2A5A2A', 1.1));
  const sol = new THREE.DirectionalLight('#FFFFFF', 1.4);
  sol.position.set(-20, 40, 10);
  cena.add(sol);
  cena.add(construirCampo(CAMPO));

  const bola = new THREE.Mesh(
    new THREE.SphereGeometry(RAIO_BOLA, 20, 14),
    new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.5 }),
  );
  cena.add(bola);

  const camara = new THREE.PerspectiveCamera(65, 1, 0.05, 200);
  camara.position.set(0, 30, 32);
  camara.lookAt(0, 0, 0);
  camara.rotation.order = 'YXZ';

  const olhar = criarOlhar(canvas);
  const bonecos = new Map();
  const relogio = new THREE.Clock();
  let estado = null;
  let pausado = false;
  let largura = 0;
  let altura = 0;

  document.addEventListener('visibilitychange', () => {
    pausado = document.hidden;
    relogio.getDelta();
  });

  function ajustarTamanho() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === largura && h === altura) return;
    largura = w;
    altura = h;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.fov = camara.aspect < 1 ? 85 : 65;
    camara.updateProjectionMatrix();
  }

  function limparBonecos() {
    for (const { boneco } of bonecos.values()) {
      cena.remove(boneco.grupo);
      boneco.libertar();
    }
    bonecos.clear();
  }

  function colocarBola(p) {
    const [wx, wz] = paraMundo(p[0], p[1]);
    bola.position.set(wx, RAIO_BOLA, wz);
    estado.bola = p;
  }

  function colocarJogador(id, p, dt) {
    const b = bonecos.get(id);
    if (!b) return;
    const dx = p[0] - b.ultima[0];
    const dz = p[1] - b.ultima[1];
    const vel = dt > 0 ? Math.hypot(dx, dz) / dt : 0;
    const [wx, wz] = paraMundo(p[0], p[1]);
    b.boneco.grupo.position.set(wx, 0, wz);
    const rumo = vel > 0.3 ? Math.atan2(-dz, dx) : yawParaPonto(p, estado.bola);
    b.boneco.grupo.rotation.y = rumo - Math.PI / 2;
    b.boneco.animar(vel, dt);
    b.ultima = p;
  }

  function moverArthur(p, dt) {
    const e = estado;
    const vel = dt > 0 ? Math.hypot(p[0] - e.arthur[0], p[1] - e.arthur[1]) / dt : 0;
    e.passo += vel * dt * 2.2;
    e.velArthur = vel;
    e.arthur = p;
  }

  function gravar(t, fase) {
    const e = estado;
    if (t < e.proximaGravacao) return;
    e.proximaGravacao = t + PASSO_GRAVACAO;
    const pos = { arthur: e.arthur };
    for (const [id, b] of bonecos) pos[id] = b.ultima;
    e.frames.push({ t, fase, pos, bola: e.bola });
  }

  function passoLance(dtReal) {
    const e = estado;
    const c = e.cenario;
    const falta = c.congelaEm - e.t;
    const escala = falta < ABRANDAR ? Math.max(ESCALA_MIN, falta / ABRANDAR) : 1;
    const dt = dtReal * escala;
    e.t = Math.min(c.congelaEm, e.t + dt);
    colocarBola(posicaoEm(c.bola, e.t));
    moverArthur(posicaoEm(e.traj.arthur, e.t), dt);
    for (const id of bonecos.keys()) colocarJogador(id, posicaoEm(e.traj[id], e.t), dt);
    e.yawCam = e.base + olhar.yawRel;
    e.pitch = olhar.pitch;
    if (e.callbacks.aoOlhar) e.callbacks.aoOlhar(e.t, olhar.yawRel);
    gravar(e.t, 'lance');
    if (e.t >= c.congelaEm) {
      e.fase = 'congelado';
      olhar.ativo = false;
      if (e.callbacks.aoCongelar) e.callbacks.aoCongelar();
    }
  }

  function passoConsequencia(dt) {
    const e = estado;
    const k = e.cons;
    e.tc = Math.min(k.duracao, e.tc + dt);
    const pBola = posicaoEm(k.bola, e.tc);
    colocarBola(pBola);
    moverArthur(posicaoEm(k.nos.arthur, e.tc), dt);
    e.reacao.atualizar(dt, { arthur: e.arthur, bola: pBola });
    for (const id of bonecos.keys()) {
      const p = k.nos[id] ? posicaoEm(k.nos[id], e.tc) : e.reacao.posicao(id) || e.congelado[id];
      colocarJogador(id, p, dt);
    }
    if (Math.hypot(pBola[0] - e.arthur[0], pBola[1] - e.arthur[1]) > 1.5) {
      const alvo = yawParaPonto(e.arthur, pBola);
      e.yawCam += normalizar(alvo - e.yawCam) * Math.min(1, dt * 4);
    }
    e.pitch += (-0.08 - e.pitch) * Math.min(1, dt * 4);
    gravar(e.cenario.congelaEm + e.tc, 'consequencia');
    if (e.tc >= k.duracao) {
      e.fase = 'fim';
      if (e.callbacks.aoTerminar) e.callbacks.aoTerminar(e.frames);
    }
  }

  function atualizarCamara() {
    const e = estado;
    const [wx, wz] = paraMundo(e.arthur[0], e.arthur[1]);
    const balanco = Math.sin(e.passo) * BALANCO * Math.min(e.velArthur / 6, 1);
    camara.position.set(wx, ALTURA_OLHOS + balanco, wz);
    camara.rotation.y = e.yawCam - Math.PI / 2;
    camara.rotation.x = e.pitch;
  }

  function quadro() {
    requestAnimationFrame(quadro);
    ajustarTamanho();
    const dtReal = pausado ? 0 : Math.min(relogio.getDelta(), DT_MAX);
    olhar.atualizar(dtReal);
    if (estado) {
      if (estado.fase === 'lance') passoLance(dtReal);
      else if (estado.fase === 'consequencia') passoConsequencia(dtReal);
      if (estado) atualizarCamara();
    }
    renderer.render(cena, camara);
  }
  requestAnimationFrame(quadro);

  return {
    jogar(cenario, varianteId, callbacks = {}) {
      limparBonecos();
      const traj = trajetoriasDaVariante(cenario, varianteId);
      for (const [id, j] of Object.entries(cenario.jogadores)) {
        if (id === 'arthur') continue;
        const cores = j.guardaRedes ? (j.equipa === 'nos' ? CORES.grNos : CORES.grEles) : CORES[j.equipa];
        const boneco = criarBoneco(cores);
        cena.add(boneco.grupo);
        bonecos.set(id, { boneco, ultima: posicaoEm(traj[id], 0) });
      }
      const base = (cenario.direcaoBase * Math.PI) / 180;
      olhar.reiniciar();
      olhar.ativo = true;
      estado = {
        fase: 'lance', cenario, variante: cenario.variantes[varianteId], traj, callbacks,
        t: 0, tc: 0, base, yawCam: base, pitch: 0,
        arthur: posicaoEm(traj.arthur, 0), velArthur: 0, passo: 0,
        bola: posicaoEm(cenario.bola, 0), frames: [], proximaGravacao: 0,
        cons: null, reacao: null, congelado: null,
      };
      relogio.getDelta();
    },
    continuar(opcaoId, callbacks = {}) {
      const e = estado;
      if (!e || e.fase !== 'congelado') return;
      e.cons = e.variante.consequencias[opcaoId];
      e.congelado = {};
      for (const id of Object.keys(e.traj)) e.congelado[id] = posicaoEm(e.traj[id], e.cenario.congelaEm);
      e.reacao = criarReacao(e.cons.adversarios || {}, e.congelado);
      e.callbacks = callbacks;
      e.tc = 0;
      e.fase = 'consequencia';
      relogio.getDelta();
    },
    parar() {
      estado = null;
      olhar.ativo = false;
      limparBonecos();
    },
  };
}
```

- [ ] **Step 5: `jogo.html`**

```html
<!doctype html>
<html lang="pt-PT">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Jogo do Avançado</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Work+Sans:wght@400;500;600&display=swap">
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js",
    "yuka": "https://cdn.jsdelivr.net/npm/yuka@0.7.8/build/yuka.module.js"
  }
}
</script>
<style>
  :root{
    --fundo:#F3FAF5; --superficie:#FFFFFF; --tinta:#0C2A1E; --tinta-suave:#54695D;
    --verde:#1B5C3E; --verde-escuro:#123D29; --ambar:#E2932E; --linha:#CFE1D5;
    --bom:#2C8C5B; --perigo:#C2493B; --vidro:rgba(255,255,255,.94);
    --sombra:0 1px 2px rgba(10,35,24,.06), 0 10px 24px rgba(10,35,24,.12);
    color-scheme:light;
  }
  @media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]){
      --fundo:#0A1B13; --superficie:#11251B; --tinta:#E7F3EB; --tinta-suave:#93AC9E;
      --verde:#3AA06B; --verde-escuro:#1E6146; --ambar:#EFA23D; --linha:#22402E;
      --bom:#4FBE85; --perigo:#E1685A; --vidro:rgba(17,37,27,.95);
      color-scheme:dark;
    }
  }
  :root[data-theme="dark"]{
    --fundo:#0A1B13; --superficie:#11251B; --tinta:#E7F3EB; --tinta-suave:#93AC9E;
    --verde:#3AA06B; --verde-escuro:#1E6146; --ambar:#EFA23D; --linha:#22402E;
    --bom:#4FBE85; --perigo:#E1685A; --vidro:rgba(17,37,27,.95);
    color-scheme:dark;
  }
  *{box-sizing:border-box}
  html,body{margin:0;height:100%;overflow:hidden;background:var(--fundo);color:var(--tinta);font-family:'Work Sans',system-ui,-apple-system,sans-serif}
  h1,h2,h3{font-family:'Oswald','Arial Narrow',sans-serif;margin:0}
  button{font-family:inherit}
  #cena{position:fixed;inset:0;width:100%;height:100%;display:block;touch-action:none;background:#9FD3F5}
  .ecra{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;overflow-y:auto;
    padding:max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left))}
  .ecra[hidden]{display:none}
  .ecra-cheio{background:var(--fundo)}
  .ecra-painel{background:rgba(6,20,13,.35)}
  .cartao{width:100%;max-width:520px;margin:auto;background:var(--vidro);border:1px solid var(--linha);border-radius:18px;padding:20px;box-shadow:var(--sombra)}
  .cartao-largo{max-width:760px}
  .voltar{color:var(--verde);font-weight:600;text-decoration:none;font-size:14px}
  .eyebrow,.kicker{font:600 12px 'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.08em;color:var(--ambar);margin:12px 0 4px}
  h1{font-size:30px;text-transform:uppercase}
  h2{font-size:22px;line-height:1.2;margin-bottom:12px}
  .sub{color:var(--tinta-suave);margin:6px 0 16px;line-height:1.45}
  .aviso-deitar{background:color-mix(in srgb,var(--ambar) 18%,transparent);border-radius:10px;padding:8px 12px;font-size:14px;margin:0 0 12px}
  .lista-cenarios{list-style:none;margin:0;padding:0;display:grid;gap:10px}
  .cenario{display:flex;gap:12px;align-items:center;justify-content:space-between;border:1px solid var(--linha);border-radius:14px;padding:12px 14px;background:var(--superficie)}
  .cenario h3{font-size:17px;text-transform:uppercase}
  .cenario .desc{margin:4px 0;color:var(--tinta-suave);font-size:14px;line-height:1.4}
  .cenario .melhor{margin:0;color:var(--ambar);letter-spacing:.12em}
  .cenario.fechado{opacity:.6}
  .btn-primario,.btn-fantasma{display:inline-block;flex-shrink:0;text-align:center;text-decoration:none;cursor:pointer;border-radius:999px;padding:11px 20px;font:600 13px 'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.04em}
  .btn-primario{background:var(--verde-escuro);color:#fff;border:none}
  .btn-primario:disabled{background:var(--linha);color:var(--tinta-suave);cursor:not-allowed}
  .btn-fantasma{background:transparent;color:var(--tinta);border:1px solid var(--linha)}
  .opcoes{display:grid;gap:8px}
  .opcao{display:flex;align-items:center;gap:12px;width:100%;min-height:48px;text-align:left;padding:12px 14px;border-radius:12px;border:1px solid var(--linha);background:var(--superficie);color:var(--tinta);font-size:16px;font-weight:600;cursor:pointer}
  .opcao:hover,.opcao:focus-visible{border-color:var(--verde)}
  .tecla{display:inline-grid;place-items:center;flex-shrink:0;width:26px;height:26px;border-radius:7px;background:var(--verde-escuro);color:#fff;font:600 13px 'Oswald',sans-serif}
  #miniMapa{width:100%;max-height:48vh;display:block;margin:0 0 12px;border-radius:10px}
  #miniMapa .ponto{cursor:pointer}
  #hud{position:fixed;inset:0;pointer-events:none}
  #hud[hidden]{display:none}
  .hud-sair{pointer-events:auto;position:absolute;top:max(12px,env(safe-area-inset-top));left:max(12px,env(safe-area-inset-left));background:rgba(10,35,24,.72);color:#fff;border:none;border-radius:999px;padding:8px 16px;font:600 13px 'Oswald',sans-serif;text-transform:uppercase;cursor:pointer}
  .hud-scans{position:absolute;top:max(12px,env(safe-area-inset-top));right:max(12px,env(safe-area-inset-right));display:flex;align-items:center;gap:6px;background:rgba(10,35,24,.72);color:#fff;border-radius:999px;padding:6px 14px;font:700 18px 'Oswald',sans-serif}
  .hud-scans svg{width:22px;height:22px}
  .hud-dica{position:absolute;left:50%;bottom:max(20px,env(safe-area-inset-bottom));transform:translateX(-50%);margin:0;max-width:calc(100% - 32px);background:rgba(10,35,24,.72);color:#fff;padding:8px 16px;border-radius:999px;font-size:14px;text-align:center;transition:opacity .6s}
  .hud-dica.some{opacity:0}
  .estrelas{list-style:none;padding:0;margin:8px 0;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  .estrelas li{text-align:center;border:1px solid var(--linha);border-radius:12px;padding:10px 6px;font-size:13px;color:var(--tinta-suave);background:var(--superficie)}
  .estrelas .icone{display:block;font-size:28px;line-height:1;color:var(--linha)}
  .estrelas .ganha .icone{color:var(--ambar)}
  .recorde{color:var(--bom);font-weight:700;margin:0 0 6px}
  .resultado-bom{color:var(--bom)}
  .resultado-mau{color:var(--perigo)}
  .scans-linha{font-size:14px;color:var(--tinta-suave)}
  .treinador{border-left:4px solid var(--ambar);padding:4px 0 4px 12px;margin:12px 0}
  .treinador .kicker{margin-top:0}
  .treinador p:last-child{margin:0;line-height:1.45}
  .botoes{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
  #telaRepeticao{width:100%;display:block;border-radius:10px;background:#3E8E4A}
  .legenda{font-size:14px;color:var(--tinta-suave)}
  @media (max-height:500px) and (orientation:landscape){
    .cartao{padding:14px}
    .ecra-painel{align-items:flex-start}
    h2{font-size:18px}
    .cartao-duas{display:grid;grid-template-columns:1.2fr 1fr;gap:14px;max-width:760px;align-items:start}
    .cartao-duas .kicker,.cartao-duas h2{grid-column:1 / -1}
  }
</style>
</head>
<body>
<canvas id="cena" aria-label="Campo de futebol em 3D"></canvas>

<div id="hud" hidden>
  <button type="button" class="hud-sair" id="btnSair">Sair</button>
  <div class="hud-scans" role="status" aria-label="Vezes que olhaste à volta">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 5C6.5 5 2.4 9.2 1 12c1.4 2.8 5.5 7 11 7s9.6-4.2 11-7c-1.4-2.8-5.5-7-11-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/></svg>
    <span id="numScans">0</span>
  </div>
  <p class="hud-dica" id="dica"></p>
</div>

<section class="ecra ecra-cheio" id="ecra-menu">
  <div class="cartao">
    <a class="voltar" href="index.html">← Bússola</a>
    <p class="eyebrow">Vitória de Setúbal · Sub-11 · 3-1-2</p>
    <h1>Jogo do Avançado</h1>
    <p class="sub">Vê o lance pelos teus olhos. Olha à volta antes de receber.</p>
    <p class="aviso-deitar" id="avisoDeitar" hidden>Dica: deita o telemóvel para veres melhor.</p>
    <ul class="lista-cenarios" id="listaCenarios"></ul>
  </div>
</section>

<section class="ecra ecra-painel" id="ecra-pergunta" hidden>
  <div class="cartao cartao-duas">
    <p class="kicker">Atenção!</p>
    <h2 id="perguntaTexto"></h2>
    <svg id="miniMapa" viewBox="-1 -1 57 37" role="img" aria-label="Mini-mapa do campo"></svg>
    <div class="opcoes" id="opcoesAtencao"></div>
  </div>
</section>

<section class="ecra ecra-painel" id="ecra-decisao" hidden>
  <div class="cartao">
    <p class="kicker">Decide</p>
    <h2>O que fazes?</h2>
    <div class="opcoes" id="opcoesDecisao"></div>
  </div>
</section>

<section class="ecra ecra-painel" id="ecra-resultado" hidden>
  <div class="cartao">
    <p class="kicker" id="resultadoKicker"></p>
    <h2 id="resultadoTexto"></h2>
    <p class="recorde" id="novoRecorde" hidden>Novo recorde!</p>
    <ul class="estrelas" id="estrelas"></ul>
    <p class="scans-linha" id="scansLinha"></p>
    <div class="treinador">
      <p class="kicker">O treinador diz</p>
      <p id="fraseTreinador"></p>
    </div>
    <div class="botoes">
      <button type="button" class="btn-primario" id="btnRepeticao" hidden>Ver repetição</button>
      <button type="button" class="btn-fantasma" id="btnOutraVez">Jogar outra vez</button>
      <button type="button" class="btn-fantasma" id="btnMenu">Escolher cenário</button>
    </div>
  </div>
</section>

<section class="ecra ecra-painel" id="ecra-repeticao" hidden>
  <div class="cartao cartao-largo">
    <p class="kicker">Repetição</p>
    <canvas id="telaRepeticao" aria-label="Repetição do lance vista de cima"></canvas>
    <p class="legenda" id="legendaRepeticao"></p>
    <button type="button" class="btn-primario" id="btnFecharRepeticao">Fechar</button>
  </div>
</section>

<section class="ecra ecra-cheio" id="ecra-erro" hidden>
  <div class="cartao">
    <h2>Este aparelho não consegue mostrar o jogo em 3D.</h2>
    <a class="btn-primario" href="index.html">Voltar ao Bússola</a>
  </div>
</section>

<script type="module" src="jogo/fluxo.js"></script>
</body>
</html>
```

- [ ] **Step 6: `jogo/fluxo.js`**

```js
// Fluxo do jogo: menu, lance, pergunta de atenção, decisão, consequência e resultado.
import { CAMPO, CENARIOS } from './cenarios.js';
import { criarMotor } from './motor.js';
import {
  calcularEstrelas, criarArmazem, criarContadorScans, estaDesbloqueado,
  posicaoEm, sortearVariante, trajetoriasDaVariante, JANELA_SCAN,
} from './regras.js';

const $ = (id) => document.getElementById(id);
const ECRAS = ['menu', 'pergunta', 'decisao', 'resultado', 'repeticao', 'erro'];
const NS = 'http://www.w3.org/2000/svg';
const params = new URLSearchParams(location.search);

function armazenamentoSeguro() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const armazem = criarArmazem(armazenamentoSeguro());
let motor = null;
let jogada = null;
let teclasAtivas = null;
let temporizadorDica = 0;

function mostrar(nome) {
  for (const e of ECRAS) $('ecra-' + e).hidden = e !== nome;
  $('hud').hidden = nome !== null;
}

function estrelasTexto(n) {
  return '★'.repeat(n) + '☆'.repeat(3 - n);
}

function textoBloqueado(cenario) {
  const d = cenario.desbloqueio;
  const outro = CENARIOS.find((c) => c.id === d.cenario);
  return `Faz ${d.estrelas} estrelas em «${outro.nome}» para abrir.`;
}

function desenharMenu() {
  teclasAtivas = null;
  jogada = null;
  $('avisoDeitar').hidden = !matchMedia('(orientation: portrait) and (pointer: coarse)').matches;
  const lista = $('listaCenarios');
  lista.textContent = '';
  for (const c of CENARIOS) {
    const aberto = estaDesbloqueado(c, armazem);
    const melhor = armazem.melhor(c.id);
    const li = document.createElement('li');
    li.className = aberto ? 'cenario' : 'cenario fechado';
    const info = document.createElement('div');
    const h3 = document.createElement('h3');
    h3.textContent = c.nome;
    const desc = document.createElement('p');
    desc.className = 'desc';
    desc.textContent = aberto ? c.descricao : textoBloqueado(c);
    const est = document.createElement('p');
    est.className = 'melhor';
    est.textContent = estrelasTexto(melhor);
    est.setAttribute('aria-label', `Melhor resultado: ${melhor} de 3 estrelas`);
    info.append(h3, desc, est);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn-primario';
    b.textContent = aberto ? 'Jogar' : 'Fechado';
    b.disabled = !aberto;
    b.addEventListener('click', () => iniciar(c));
    li.append(info, b);
    lista.appendChild(li);
  }
  mostrar('menu');
}

function mostrarDica() {
  const d = $('dica');
  d.textContent = matchMedia('(pointer: fine)').matches
    ? 'Usa o rato ou as setas para olhar à volta'
    : 'Arrasta o dedo para olhar à volta';
  d.classList.remove('some');
  clearTimeout(temporizadorDica);
  temporizadorDica = setTimeout(() => d.classList.add('some'), 3500);
}

function iniciar(cenario) {
  const forcada = params.get('variante');
  const varianteId = forcada && cenario.variantes[forcada] ? forcada : sortearVariante(cenario);
  const atual = {
    cenario, varianteId, variante: cenario.variantes[varianteId],
    contador: criarContadorScans(), atencaoCerta: false, opcaoId: null, frames: [],
  };
  jogada = atual;
  teclasAtivas = null;
  $('numScans').textContent = '0';
  mostrar(null);
  mostrarDica();
  motor.jogar(cenario, varianteId, {
    aoOlhar: (t, yaw) => {
      atual.contador.registar(t, yaw);
      $('numScans').textContent = String(atual.contador.total());
    },
    aoCongelar: () => {
      if (jogada === atual) mostrarPergunta();
    },
  });
}

function preencherOpcoes(caixa, textos, aoEscolher) {
  let feito = false;
  const escolher = (i) => {
    if (feito) return;
    feito = true;
    teclasAtivas = null;
    aoEscolher(i);
  };
  caixa.textContent = '';
  textos.forEach((texto, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'opcao';
    const k = document.createElement('span');
    k.className = 'tecla';
    k.textContent = String(i + 1);
    b.append(k, document.createTextNode(texto));
    b.addEventListener('click', () => escolher(i));
    caixa.appendChild(b);
  });
  teclasAtivas = (n) => {
    if (n >= 1 && n <= textos.length) escolher(n - 1);
  };
  return escolher;
}

function svg(nome, atributos, pai) {
  const n = document.createElementNS(NS, nome);
  for (const [k, v] of Object.entries(atributos)) n.setAttribute(k, String(v));
  pai.appendChild(n);
  return n;
}

function desenharMiniMapa(mapa, tu, pontos, aoTocar) {
  const { comprimento: C, largura: L } = CAMPO;
  mapa.textContent = '';
  svg('rect', { x: 0, y: 0, width: C, height: L, fill: '#3E8E4A' }, mapa);
  const linha = { fill: 'none', stroke: '#FFFFFF', 'stroke-width': 0.25 };
  svg('rect', { x: 0, y: 0, width: C, height: L, ...linha }, mapa);
  svg('line', { x1: C / 2, y1: 0, x2: C / 2, y2: L, ...linha }, mapa);
  svg('circle', { cx: C / 2, cy: L / 2, r: 6, ...linha }, mapa);
  svg('rect', { x: 0, y: (L - 20) / 2, width: 9, height: 20, ...linha }, mapa);
  svg('rect', { x: C - 9, y: (L - 20) / 2, width: 9, height: 20, ...linha }, mapa);
  pontos.forEach(([x, z], i) => {
    const g = svg('g', { class: 'ponto' }, mapa);
    svg('circle', { cx: x, cy: z, r: 1.8, fill: '#FFFFFF', stroke: '#0C2A1E', 'stroke-width': 0.3 }, g);
    const t = svg('text', { x, y: z + 0.75, 'text-anchor': 'middle', 'font-size': 2.2, 'font-weight': 700, fill: '#0C2A1E' }, g);
    t.textContent = String(i + 1);
    g.addEventListener('click', () => aoTocar(i));
  });
  svg('circle', { cx: tu[0], cy: tu[1], r: 1, fill: '#E2932E', stroke: '#0C2A1E', 'stroke-width': 0.25, 'pointer-events': 'none' }, mapa);
  const rotulo = svg('text', { x: tu[0], y: tu[1] - 2.4, 'text-anchor': 'middle', 'font-size': 2, 'font-weight': 700, fill: '#FFFFFF', 'pointer-events': 'none' }, mapa);
  rotulo.textContent = 'Tu';
}

function mostrarPergunta() {
  const { cenario, varianteId, variante } = jogada;
  const p = cenario.perguntaAtencao;
  $('perguntaTexto').textContent = p.texto;
  const escolher = preencherOpcoes($('opcoesAtencao'), p.pontos.map((_, i) => `Ponto ${i + 1}`), (i) => {
    jogada.atencaoCerta = i === variante.atencaoCerta;
    mostrarDecisao();
  });
  const tu = posicaoEm(trajetoriasDaVariante(cenario, varianteId).arthur, cenario.congelaEm);
  desenharMiniMapa($('miniMapa'), tu, p.pontos, escolher);
  mostrar('pergunta');
}

function mostrarDecisao() {
  const atual = jogada;
  const opcoes = atual.cenario.opcoes;
  preencherOpcoes($('opcoesDecisao'), opcoes.map((o) => o.texto), (i) => {
    atual.opcaoId = opcoes[i].id;
    mostrar(null);
    $('dica').classList.add('some');
    motor.continuar(atual.opcaoId, {
      aoTerminar: (frames) => {
        if (jogada !== atual) return;
        atual.frames = frames;
        mostrarResultado();
      },
    });
  });
  mostrar('decisao');
}

function mostrarResultado() {
  const { cenario, variante, contador, opcaoId, atencaoCerta } = jogada;
  const cons = variante.consequencias[opcaoId];
  const scansJanela = contador.entre(cenario.congelaEm - JANELA_SCAN, cenario.congelaEm);
  const est = calcularEstrelas({ scansJanela, atencaoCerta, decisaoCerta: opcaoId === variante.decisaoCerta });
  const novo = armazem.guardar(cenario.id, est.total);

  const kicker = $('resultadoKicker');
  kicker.textContent = cons.resultado === 'bom' ? 'Boa decisão!' : 'Podes fazer melhor';
  kicker.className = 'kicker ' + (cons.resultado === 'bom' ? 'resultado-bom' : 'resultado-mau');
  $('resultadoTexto').textContent = cons.texto;
  $('novoRecorde').hidden = !novo;

  const lista = $('estrelas');
  lista.textContent = '';
  for (const [rotulo, ganha] of [['Olhar à volta', est.scan], ['Atenção', est.atencao], ['Decisão', est.decisao]]) {
    const li = document.createElement('li');
    li.className = ganha ? 'ganha' : 'perdida';
    const icone = document.createElement('span');
    icone.className = 'icone';
    icone.textContent = '★';
    icone.setAttribute('aria-hidden', 'true');
    li.append(icone, document.createTextNode(rotulo));
    li.setAttribute('aria-label', `${rotulo}: ${ganha ? 'ganhaste' : 'falhaste'} a estrela`);
    lista.appendChild(li);
  }
  $('scansLinha').textContent = `Olhaste à volta ${scansJanela} ${scansJanela === 1 ? 'vez' : 'vezes'} nos ${JANELA_SCAN} segundos antes da bola chegar.`;
  $('fraseTreinador').textContent = variante.frase;
  teclasAtivas = null;
  mostrar('resultado');
}

function ligarBotoes() {
  $('btnSair').addEventListener('click', () => {
    motor.parar();
    desenharMenu();
  });
  $('btnOutraVez').addEventListener('click', () => iniciar(jogada.cenario));
  $('btnMenu').addEventListener('click', () => {
    motor.parar();
    desenharMenu();
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.repeat || !teclasAtivas) return;
    const n = Number(ev.key);
    if (Number.isInteger(n) && n >= 1 && n <= 9) {
      ev.preventDefault();
      teclasAtivas(n);
    }
  });
}

function arrancar() {
  try {
    motor = criarMotor($('cena'));
  } catch {
    mostrar('erro');
    return;
  }
  ligarBotoes();
  desenharMenu();
  const direto = CENARIOS.find((c) => c.id === params.get('cenario'));
  if (direto) iniciar(direto);
}

arrancar();
```

Nota: `?cenario=<id>&variante=pressao|espaco` serve só para testes; abre o cenário diretamente, mesmo que esteja fechado.

- [ ] **Step 7: Servidor local de verificação**

Guardar na scratchpad do agente (não no repositório) como `servidor.py`:

```python
import http.server
import sys

class Manipulador(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
    }

porta = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
http.server.ThreadingHTTPServer(('127.0.0.1', porta), Manipulador).serve_forever()
```

Run (em segundo plano, com a pasta do repositório como diretório atual): `python <scratchpad>/servidor.py 8765`
Expected: `curl -sI http://127.0.0.1:8765/jogo.html` mostra `Content-Type: text/html; charset=utf-8`.

- [ ] **Step 8: Verificar o lance no browser (telemóvel, 390 × 844 e 844 × 390)**

Usar as ferramentas de browser disponíveis (chrome-devtools MCP ou claude-in-chrome), com emulação de toque.

1. Abrir `http://127.0.0.1:8765/jogo.html`. Expected: menu com 3 cenários, o primeiro com "Jogar" e os outros "Fechado" com o texto «Faz 2 estrelas em …». Acentos corretos. Consola sem erros.
2. Abrir `?cenario=costas-lateral&variante=pressao`. Expected: vista na 1ª pessoa, jogadores a correr com braços e pernas a mexer, bola a circular do central para o defesa esquerdo, contador de olho a 0, dica "Arrasta o dedo para olhar à volta" que desaparece ao fim de 3,5 s.
3. Arrastar o dedo para a direita até olhar para trás. Expected: a vista roda; o lateral adversário (vermelho) aparece colado atrás; o contador sobe para 1. Voltar à frente e olhar para o outro lado: contador 2.
4. Esperar: o lance abranda nos últimos instantes e aparece "Atenção!" com o mini-mapa (Tu e pontos 1, 2, 3).
5. Repetir com `variante=espaco`: o lateral sai a correr na direção do nosso defesa esquerdo.
6. Abrir `?cenario=receber-costas`: a vista começa virada para a nossa baliza (o médio com a bola à frente).

- [ ] **Step 9: Review Focus 1 e 2 (rodar e mudar de separador)**

1. A meio do lance, mudar a vista de 390 × 844 para 844 × 390. Expected: a imagem ajusta-se sem ficar esticada e o lance continua.
2. A meio do lance (aos 3 s, por exemplo), mudar para outro separador durante 10 s e voltar. Expected: o lance continua de onde estava; não aparece logo o ecrã "Atenção!".

- [ ] **Step 10: Verificar a jogada completa e Review Focus 3, 4 e 5**

1. Em `?cenario=costas-lateral&variante=pressao`, responder Ponto 2 e escolher "Venho curto e apoio". Expected: a câmara segue a bola, o lateral persegue, a bola vai ao médio; ecrã de resultado com "Boa decisão!", "Apoiaste e tocaste de primeira para o médio. Bola segura.", estrela de Atenção e Decisão acesas, frase do treinador.
2. Fazer o mesmo com "Fico parado na linha". Expected: "Podes fazer melhor" a vermelho, estrela de Decisão apagada.
3. Review Focus 3: no ecrã de decisão, tocar duas vezes rapidamente na mesma opção (ou clicar e carregar em `1` ao mesmo tempo). Expected: só uma consequência corre; o resultado aparece uma vez.
4. Review Focus 5: durante a consequência, carregar em "Sair". Expected: volta ao menu e não aparece nenhum ecrã de resultado depois. Repetir carregando em "Jogar outra vez" no resultado e logo a seguir em "Sair": nada da jogada anterior aparece.
5. Review Focus 4: no DevTools, correr `Object.defineProperty(window, 'localStorage', { get() { throw new Error('bloqueado'); } })` antes de carregar o módulo (usar "Snippet" com recarregamento, ou abrir numa janela privada com cookies bloqueados). Expected: o jogo arranca, joga e mostra o resultado; consola sem erros por causa do armazenamento.
6. Com 2 ou mais estrelas no cenário 1, voltar ao menu (sem parâmetros na URL). Expected: "Receber de costas" fica aberto e mostra as estrelas do recorde.
7. Tema escuro (emular `prefers-color-scheme: dark`): menus e painéis legíveis.

- [ ] **Step 11: Verificar no computador (1366 × 768, rato e teclado)**

1. `?cenario=costas-lateral`: dica "Usa o rato ou as setas para olhar à volta". Arrastar com o rato roda a vista; setas ← → rodam e ↑ ↓ inclinam; o contador conta.
2. Responder com as teclas `1`, `2`, `3` na pergunta e na decisão.

- [ ] **Step 12: Testes automáticos continuam verdes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 13: Commit**

```bash
git add jogo.html jogo/campo.js jogo/boneco.js jogo/olhar.js jogo/motor.js jogo/fluxo.js
git commit -m "Add first-person 3D game page with scenarios, decisions and stars"
```

---

### Task 6: Repetição 2D vista de cima

**Files:**
- Create: `jogo/repeticao.js`, `tests/repeticao.test.js`
- Modify: `jogo/fluxo.js` (import, ligação dos botões, mostrar o botão), `jogo.html` (tirar `hidden` do `#btnRepeticao`)

**Interfaces:**
- Consumes: `frames` do motor (Tarefa 5), `variante.destaque`, `cenario.jogadores`, `CAMPO`.
- Produces: `quadroEm(frames, t)`; `criarRepeticao(tela, { frames, jogadores, destaque, congelaEm, campo }): { tocar(), parar() }`.

- [ ] **Step 1: Teste que falha**

`tests/repeticao.test.js`:

```js
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
```

Run: `npm test`
Expected: FAIL com `Cannot find module '.../jogo/repeticao.js'`.

- [ ] **Step 2: Implementar `jogo/repeticao.js`**

```js
// Repetição 2D do lance, vista de cima, com a zona de pressão ou o espaço livre realçados.

const PAUSA_FINAL = 1.2;
const MOSTRAR_DESTAQUE_ANTES = 1.5;

export function quadroEm(frames, t) {
  if (!frames.length) return null;
  if (t <= frames[0].t) return frames[0];
  let lo = 0;
  let hi = frames.length - 1;
  while (lo < hi) {
    const meio = (lo + hi + 1) >> 1;
    if (frames[meio].t <= t) lo = meio;
    else hi = meio - 1;
  }
  return frames[lo];
}

export function criarRepeticao(tela, { frames, jogadores, destaque, congelaEm, campo }) {
  const ctx = tela.getContext('2d');
  const C = campo.comprimento;
  const L = campo.largura;
  const fim = frames.length ? frames[frames.length - 1].t : 0;
  let escala = 1;
  let raf = 0;
  let inicio = 0;

  const px = (m) => m * escala;

  function dimensionar() {
    const r = Math.min(window.devicePixelRatio || 1, 2);
    const w = tela.clientWidth || 300;
    tela.width = Math.round(w * r);
    tela.height = Math.round(((w * L) / C) * r);
    escala = tela.width / C;
  }

  function circulo(x, z, raio, preenchimento, contorno, espessura) {
    ctx.beginPath();
    ctx.arc(px(x), px(z), px(raio), 0, Math.PI * 2);
    if (preenchimento) {
      ctx.fillStyle = preenchimento;
      ctx.fill();
    }
    if (contorno) {
      ctx.strokeStyle = contorno;
      ctx.lineWidth = px(espessura);
      ctx.stroke();
    }
  }

  function desenharCampo() {
    ctx.fillStyle = '#3E8E4A';
    ctx.fillRect(0, 0, tela.width, tela.height);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = px(0.25);
    ctx.strokeRect(px(0.15), px(0.15), px(C - 0.3), px(L - 0.3));
    ctx.beginPath();
    ctx.moveTo(px(C / 2), 0);
    ctx.lineTo(px(C / 2), px(L));
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px(C / 2), px(L / 2), px(6), 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeRect(0, px((L - 20) / 2), px(9), px(20));
    ctx.strokeRect(px(C - 9), px((L - 20) / 2), px(9), px(20));
  }

  function corDe(j) {
    if (j.guardaRedes) return j.equipa === 'nos' ? '#E2932E' : '#6A4FB5';
    return j.equipa === 'nos' ? '#FFFFFF' : '#C2493B';
  }

  function desenhar(t) {
    const q = quadroEm(frames, t);
    if (!q) return;
    desenharCampo();
    if (t >= congelaEm - MOSTRAR_DESTAQUE_ANTES) {
      const cor = destaque.tipo === 'pressao' ? 'rgba(194,73,59,.45)' : 'rgba(127,211,154,.55)';
      circulo(destaque.centro[0], destaque.centro[1], destaque.raio, cor, '#FFFFFF', 0.15);
    }
    for (const [id, p] of Object.entries(q.pos)) {
      if (id === 'arthur') continue;
      const j = jogadores[id];
      circulo(p[0], p[1], 0.9, corDe(j), j.equipa === 'nos' ? '#1B5C3E' : '#FFFFFF', 0.25);
    }
    const a = q.pos.arthur;
    circulo(a[0], a[1], 1.15, '#FFFFFF', '#E2932E', 0.5);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `700 ${px(2)}px Oswald, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Tu', px(a[0]), px(Math.max(2, a[1] - 1.8)));
    circulo(q.bola[0], q.bola[1], 0.55, '#FFFFFF', '#111111', 0.18);
  }

  function ciclo(agora) {
    const t = ((agora - inicio) / 1000) % (fim + PAUSA_FINAL);
    desenhar(Math.min(t, fim));
    raf = requestAnimationFrame(ciclo);
  }

  return {
    tocar() {
      dimensionar();
      cancelAnimationFrame(raf);
      inicio = performance.now();
      raf = requestAnimationFrame(ciclo);
    },
    parar() {
      cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}
```

- [ ] **Step 3: Correr e ver passar**

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Ligar ao fluxo**

Em `jogo.html`, trocar:

```html
      <button type="button" class="btn-primario" id="btnRepeticao" hidden>Ver repetição</button>
```

por:

```html
      <button type="button" class="btn-primario" id="btnRepeticao">Ver repetição</button>
```

Em `jogo/fluxo.js`, depois de `import { criarMotor } from './motor.js';` acrescentar:

```js
import { criarRepeticao } from './repeticao.js';
```

Depois de `let temporizadorDica = 0;` acrescentar:

```js
let repeticao = null;
```

Dentro de `ligarBotoes()`, antes de `document.addEventListener('keydown', ...)`, acrescentar:

```js
  $('btnRepeticao').addEventListener('click', () => {
    const { cenario, variante, frames } = jogada;
    $('legendaRepeticao').textContent = variante.destaque.legenda;
    mostrar('repeticao');
    repeticao = criarRepeticao($('telaRepeticao'), {
      frames, jogadores: cenario.jogadores, destaque: variante.destaque, congelaEm: cenario.congelaEm, campo: CAMPO,
    });
    repeticao.tocar();
  });
  $('btnFecharRepeticao').addEventListener('click', () => {
    if (repeticao) repeticao.parar();
    repeticao = null;
    mostrar('resultado');
  });
```

- [ ] **Step 5: Verificar no browser**

Com o servidor da Tarefa 5 a correr:
1. `?cenario=costas-lateral&variante=pressao`, jogar até ao fim, "Ver repetição". Expected: campo visto de cima; "Tu" com anel âmbar; adversários a vermelho, os nossos a branco; bola a circular; perto do congelamento aparece o círculo vermelho à volta do lateral; legenda "A vermelho: o lateral colado nas tuas costas."; a repetição repete em ciclo. "Fechar" volta ao resultado.
2. Com `variante=espaco`: círculo verde e legenda "A verde: o espaço nas costas do lateral."
3. 390 × 844 e 844 × 390: o canvas cabe na largura sem scroll horizontal.

- [ ] **Step 6: Commit**

```bash
git add jogo/repeticao.js tests/repeticao.test.js jogo/fluxo.js jogo.html
git commit -m "Add top-down 2D replay with pressure and space highlight"
```

---

### Task 7: Botão "Jogar 3D" no Bússola

**Files:**
- Modify: `index.html` (só o cabeçalho e uma regra CSS)

**Interfaces:**
- Consumes: classe `.btn-primary` existente no `index.html`.
- Produces: ligação `index.html` → `jogo.html`.

- [ ] **Step 1: Acrescentar o botão**

Em `index.html`, trocar:

```html
    <p class="sub">O campo, a tua posição e as decisões que já sabes tomar.</p>
  </header>
```

por:

```html
    <p class="sub">O campo, a tua posição e as decisões que já sabes tomar.</p>
    <a class="btn-primary btn-jogo" href="jogo.html">Jogar 3D</a>
  </header>
```

E trocar:

```css
  .btn-primary:hover{background:var(--green-deep);}
```

por:

```css
  .btn-primary:hover{background:var(--green-deep);}
  .btn-jogo{display:inline-block;margin-top:14px;text-decoration:none;}
```

- [ ] **Step 2: Confirmar que nada mais mudou**

Run: `git diff --stat index.html`
Expected: `1 file changed, 2 insertions(+)`.

- [ ] **Step 3: Verificar no browser**

Abrir `http://127.0.0.1:8765/index.html` a 390 px, em tema claro e escuro. Expected: botão "Jogar 3D" no cabeçalho, igual em estilo aos outros botões verdes; abre `jogo.html`; separadores, quadro, simuladores e quiz funcionam como antes.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Link the 3D game from the Bússola header"
```

---

### Task 8: Verificação final completa

**Files:** nenhum novo (só correções, se forem precisas).

- [ ] **Step 1: Testes**

Run: `npm test`
Expected: PASS em todos.

- [ ] **Step 2: Jogar tudo**

Para cada cenário (`costas-lateral`, `receber-costas`, `rematar-assistir`) e cada variante (`pressao`, `espaco`), jogar até ao fim pelo menos com a decisão certa e uma errada, a 390 × 844 deitado (844 × 390) e a 1366 × 768. Expected: consequência coerente com o texto (golo entra na baliza, passe cortado chega ao defensor, etc.), sem jogadores a atravessarem-se de forma estranha, consola sem erros nem avisos.

- [ ] **Step 3: Progressão sem parâmetros**

Limpar `localStorage` (`localStorage.removeItem('bussola-jogo-recordes')`), abrir `jogo.html` sem parâmetros e desbloquear os cenários 2 e 3 a jogar. Expected: desbloqueio com 2 estrelas; recordes mostrados no menu; "Novo recorde!" só quando sobe.

- [ ] **Step 4: Texto**

Run: `grep -n -P '[\x{2013}\x{2014}]' jogo.html jogo/*.js`
Expected: sem resultados.

- [ ] **Step 5: Desempenho**

No DevTools (Performance, CPU 4x mais lenta, 390 × 844): o lance mantém-se fluido (acima de 30 fps nessa simulação).

- [ ] **Step 6: Relatório ao utilizador**

Resumir o que foi feito, o que foi verificado e qualquer problema encontrado. Não fazer push nem merge: perguntar ao utilizador se quer publicar.

---

### Task 9 (opcional): Bonecos animados de um pacote CC0

Só avançar se o utilizador pedir depois de ver a versão com bonecos procedimentais.

**Files:**
- Create: `jogo/modelos/` (ficheiros `.glb` e `LICENCA.txt`)
- Modify: `jogo/boneco.js` (mesma interface `criarBoneco({ camisola, calcoes }) → { grupo, animar, libertar }`)

- [ ] **Step 1: Escolher e confirmar a licença**

Critérios obrigatórios: licença CC0 escrita na página oficial do autor; formato glTF/GLB (ou FBX convertível com Blender, se o Blender estiver instalado); animações de "correr" e "parado"; menos de 2 MB por modelo. Copiar o texto da licença e o URL de origem para `jogo/modelos/LICENCA.txt`. Se nenhum pacote cumprir tudo, parar e reportar ao utilizador; os bonecos procedimentais ficam.

- [ ] **Step 2: Implementar o carregamento**

Carregar o `.glb` com `GLTFLoader` de `https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/loaders/GLTFLoader.js` (acrescentar `"three/addons/": "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/"` ao import map), clonar com `SkeletonUtils.clone`, pintar a camisola com as cores recebidas, usar `AnimationMixer` com mistura entre "parado" e "correr" conforme a velocidade em `animar(velocidade, dt)`. Se o carregamento falhar, usar os bonecos procedimentais atuais.

- [ ] **Step 3: Verificar e fazer commit**

Repetir os passos 8 e 11 da Tarefa 5 e confirmar que o tempo de carregamento no telemóvel (rede "Fast 4G" no DevTools) fica abaixo de 5 s.

```bash
git add jogo/modelos jogo/boneco.js jogo.html
git commit -m "Use CC0 animated character models with procedural fallback"
```
