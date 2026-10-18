# Visual do jogo 3D: Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pôr o jogo do Arthur com ar de jogo a sério: jogadores da Mixamo animados, estádio cheio de fim de tarde, torcida que reage, sons de estádio, momentos de golo e perda de bola, e olhar à volta com o giroscópio do telemóvel, sem mudar cenários, perguntas, decisões, estrelas e repetição.

**Architecture:** Funções puras novas (momentos, animação, qualidade, bancadas, giroscópio, som, preferências) testadas em Node; módulos Three.js novos (jogador3d, carregador, bola, estádio, torcida) ligados ao motor existente. Os cenários ganham `eventos` e alturas de bola; o motor dispara gestos, torcida, som e momentos quando o relógio passa cada evento. Se o modelo não carregar, o motor usa os bonecos atuais.

**Tech Stack:** Three.js 0.169.0 (`three` e `three/addons/` por CDN via import map), Yuka 0.7.8, módulos ES nativos, Web Audio, `DeviceOrientationEvent`, `node --test` (Node 24).

**Spec:** `docs/superpowers/specs/2026-10-17-visual-jogo-3d-design.md` (base: `docs/superpowers/specs/2026-10-17-jogo-3d-primeira-pessoa-design.md`)

## Global Constraints

- Todo o texto visível em português de Portugal, sem travessões (nem `—` nem `–`), tom curto de treinador.
- `index.html` não muda.
- Import map: `three` = `https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js`; `three/addons/` = `https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/`; `yuka` = `https://cdn.jsdelivr.net/npm/yuka@0.7.8/build/yuka.module.js`. Nenhuma outra biblioteca no browser.
- Coordenadas do jogo: `x` 0 a 55 (nossa linha de fundo à adversária), `z` 0 a 35. Three.js: `X = x - 27,5`, `Z = z - 17,5`, `Y` para cima. `yaw` 0 = para a baliza adversária, positivo = esquerda. Câmara: `rotation.order = 'YXZ'`, `rotation.y = yaw - π/2`. Frente de um jogador = `-z` local; `grupo.rotation.y = rumo - π/2`.
- Cores: nós camisola às riscas `#1B5C3E`/`#FFFFFF`, calções `#FFFFFF`, meias `#1B5C3E`; adversário `#C2493B`, calções `#3A1410`, meias `#C2493B`; guarda-redes nosso `#E2932E`; guarda-redes adversário `#6A4FB5`; calções dos guarda-redes `#1A1A1A`.
- Placas de publicidade só com "Bússola do Avançado" e "Vamos Vitória!". Nenhuma marca real.
- Modelo `jogo/modelos/jogador.glb` já existe (commit 5e1020d, 1,55 MB): personagem Shannon da Mixamo com malhas `Ch38_Shirt`, `Ch38_Shorts`, `Ch38_Socks`, `Ch38_Shoes`, `Ch38_Body`, `Ch38_Eyelashes`, `Ch38_Hair`; ossos `mixamorig5:*`; altura 1,78 m em metros; olha para `+z`; animações `parado`, `correr`, `sprint`, `passe`, `remate`, `cabeca`, `gr-parado`, `gr-defesa`, `desarme`, `festejo`, `desanimo`, `aplauso`. Os FBX originais nunca entram no repositório.
- Sons em `jogo/sons/` (≤ 1,5 MB no total) com `jogo/sons/LICENCAS.txt`. Sem som, o jogo funciona.
- Som ligado por defeito (`localStorage` `bussola-jogo-som`); giroscópio ligado por defeito em aparelhos de toque (`bussola-jogo-giroscopio`). Tudo em try/catch.
- Desempenho: píxeis ≤ 2x, sombra só do sol (mapa 1024) e só jogadores a projetar; se a média ficar abaixo de 45 fps durante 2 s em jogo, torcida a metade e sombras desligadas.
- Os 24 testes atuais continuam verdes. Testes: `npm test`.
- Verificação no browser só com o servidor `servidor.py` da scratchpad (UTF-8, `.glb` e `.mp3` com tipo certo), porta 8765, a partir da pasta do repositório.
- Git: ramo `visual-3d`, commits locais por tarefa, mensagem a terminar em `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. **Nunca** push nem merge sem ok explícito do utilizador.

## Review Focus

1. **Modelo não carrega ou demora (sem rede, 404, 4G lento):** ao fim de 20 s no máximo o menu aparece e o jogo usa os bonecos atuais (Tarefa 1, testes `comLimite`; Tarefa 13, passo 3).
2. **iPhone bloqueia o áudio ou faltam ficheiros de som:** o jogo corre em silêncio, sem erros na consola (Tarefa 5, testes `som sem AudioContext` e `som com ficheiro em falta`).
3. **Giroscópio recusado ou inexistente:** fica só o dedo, o interruptor desliga-se e aparece a nota (Tarefa 4, testes `pedirAutorizacao recusada` e `sem sensor`; Tarefa 10, passo 4).
4. **Telemóvel ao alto (beta = 90°) ou a cruzar o norte (alpha 359° → 1°):** a cabeça não salta (Tarefa 4, testes `beta 90` e `cruzar o norte`).
5. **"Jogar outra vez" logo a seguir a um golo ou a uma perda:** sem "GOLO!" nem festejos pendurados, eventos disparam uma só vez por jogada (Tarefa 2, teste `dispararAte`; Tarefa 9, passo 4; Tarefa 13, passo 2).

---

## Estrutura de ficheiros

| Ficheiro | Responsabilidade |
|---|---|
| `jogo/regras.js` | + `alturaEm`, `criarPreferencias`, `comLimite`, chaves de preferências |
| `jogo/cenarios.js` | + `eventos` no lance e nas 18 consequências, alturas de bola, durações das perdas |
| `jogo/momentos.js` (novo) | Puro: agendar gestos, disparar eventos, reações a eventos e ao fim, intensidade da torcida, ponto de fuga |
| `jogo/animacao.js` (novo) | Puro: escolha da animação, gestos, momentos de contacto, peças do equipamento |
| `jogo/jogador3d.js` (novo) | Jogador a partir do modelo: clone com esqueleto, cores por peça, riscas, número, misturador |
| `jogo/carregador.js` (novo) | Carrega `jogador.glb` com progresso e limite de tempo |
| `jogo/boneco.js` | + `gesto()` vazio (mesma interface que o jogador3d) |
| `jogo/giroscopio.js` (novo) | Matemática pura da orientação + leitura do aparelho e autorização |
| `jogo/olhar.js` | Soma giroscópio e dedo (`combinarOlhar`) |
| `jogo/som.js` (novo) | Web Audio: ciclos, efeitos, ligar/desligar, desbloqueio |
| `jogo/campo.js` | Relva com textura, redes com textura, rede que abana |
| `jogo/bola.js` (novo) | Bola com gomos, rotação, arco e sombra |
| `jogo/bancadas.js` (novo) | Puro: geometria das bancadas e lugares dos adeptos |
| `jogo/estadio.js` (novo) | Céu, luz de fim de tarde, sombras, bancadas, cobertura, publicidade, torres |
| `jogo/torcida.js` (novo) | Adeptos em instâncias com animação no shader, bandeiras, reações |
| `jogo/qualidade.js` (novo) | Puro: medidor de fps |
| `jogo/adversarios.js` | + `redirecionar()` (quem rouba foge com a bola) |
| `jogo/motor.js` | Liga tudo: estádio, torcida, bola, jogadores, eventos, golo, perda, qualidade |
| `jogo/fluxo.js`, `jogo.html` | Carregamento, definições (som, giroscópio, "Ativar movimento"), botão de som, "GOLO!" |
| `jogo/sons/*.mp3`, `jogo/sons/LICENCAS.txt` | Sons do estádio e licenças |
| `tests/*.test.js` | Testes novos e validador alargado |

---

### Task 1: Regras novas e eventos nos cenários

**Files:**
- Modify: `jogo/regras.js` (acrescentar no fim)
- Modify: `jogo/cenarios.js`
- Test: `tests/regras.test.js`, `tests/cenarios.test.js`

**Interfaces:**
- Produces: `alturaEm(pontos, t) → number` (metros acima da relva); `criarPreferencias(storage) → { lerBool(chave, defeito), guardarBool(chave, valor) }`; `comLimite(promessa, ms) → Promise<valor | null>`; `CHAVE_SOM = 'bussola-jogo-som'`; `CHAVE_GIROSCOPIO = 'bussola-jogo-giroscopio'`. Dados: `cenario.eventos` e `consequencia.eventos`, listas de `{ t, tipo: 'passe'|'remate'|'golo'|'perda'|'defesa', jogador? }` ordenadas por `t`. Ponto de trajetória pode ter 4.º valor `h`: altura máxima do arco do troço que chega a esse ponto.

- [ ] **Step 1: Testes das regras novas**

Acrescentar a `tests/regras.test.js` (e juntar `alturaEm, criarPreferencias, comLimite` ao import de `../jogo/regras.js`):

```js
test('alturaEm: arco com pico a meio do troco e chao fora dele', () => {
  const p = [[0, 0, 0], [2, 10, 0, 3], [3, 12, 0]];
  assert.equal(alturaEm(p, -1), 0);
  assert.equal(alturaEm(p, 0), 0);
  assert.ok(Math.abs(alturaEm(p, 1) - 3) < 1e-9);
  assert.ok(Math.abs(alturaEm(p, 0.5) - 2.25) < 1e-9);
  assert.equal(alturaEm(p, 2), 0);
  assert.equal(alturaEm(p, 2.5), 0);
  assert.equal(alturaEm(p, 9), 0);
});

test('posicaoEm ignora o 4.o valor (altura)', () => {
  assert.deepEqual(posicaoEm([[0, 0, 0], [2, 10, 0, 3]], 1), [5, 0]);
});

test('preferencias: sem storage, storage que falha e ida e volta', () => {
  assert.equal(criarPreferencias(null).lerBool('k', true), true);
  const falha = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  const pf = criarPreferencias(falha);
  assert.equal(pf.lerBool('k', false), false);
  assert.doesNotThrow(() => pf.guardarBool('k', true));
  const mapa = new Map();
  const pm = criarPreferencias({ getItem: (k) => mapa.get(k) ?? null, setItem: (k, v) => mapa.set(k, v) });
  pm.guardarBool('k', false);
  assert.equal(pm.lerBool('k', true), false);
  pm.guardarBool('k', true);
  assert.equal(pm.lerBool('k', false), true);
});

test('comLimite: valor, rejeicao e tempo esgotado', async () => {
  assert.equal(await comLimite(Promise.resolve(7), 50), 7);
  assert.equal(await comLimite(Promise.reject(new Error('x')), 50), null);
  assert.equal(await comLimite(new Promise(() => {}), 10), null);
});
```

- [ ] **Step 2: Correr e ver falhar**

Run: `npm test`
Expected: FAIL, `alturaEm` (e as outras) não exportadas.

- [ ] **Step 3: Implementar em `jogo/regras.js`**

Acrescentar no fim do ficheiro:

```js
// Altura da bola: o 4.º valor de um ponto [t, x, z, h] é a altura máxima do arco do troço que chega a esse ponto.
export function alturaEm(pontos, t) {
  for (let i = 1; i < pontos.length; i++) {
    const t0 = pontos[i - 1][0];
    const [t1, , , h = 0] = pontos[i];
    if (t >= t0 && t <= t1) {
      if (!h || t1 === t0) return 0;
      const f = (t - t0) / (t1 - t0);
      return 4 * h * f * (1 - f);
    }
  }
  return 0;
}

export const CHAVE_SOM = 'bussola-jogo-som';
export const CHAVE_GIROSCOPIO = 'bussola-jogo-giroscopio';

export function criarPreferencias(storage) {
  return {
    lerBool(chave, defeito) {
      try {
        const v = storage ? storage.getItem(chave) : null;
        if (v === '1') return true;
        if (v === '0') return false;
        return defeito;
      } catch {
        return defeito;
      }
    },
    guardarBool(chave, valor) {
      try {
        if (storage) storage.setItem(chave, valor ? '1' : '0');
      } catch {
        // Sem armazenamento: a escolha vale só nesta sessão.
      }
    },
  };
}

// Espera pela promessa no máximo `ms`; se falhar ou demorar, resolve com null.
export function comLimite(promessa, ms) {
  return new Promise((resolver) => {
    const temporizador = setTimeout(() => resolver(null), ms);
    Promise.resolve(promessa).then(
      (v) => { clearTimeout(temporizador); resolver(v); },
      () => { clearTimeout(temporizador); resolver(null); },
    );
  });
}
```

- [ ] **Step 4: Correr e ver passar**

Run: `npm test`
Expected: PASS (28 testes).

- [ ] **Step 5: Validador dos eventos em `tests/cenarios.test.js`**

5a. Depois de `semTravessoes`, acrescentar:

```js
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
```

5b. Dentro do teste de cada cenário, logo a seguir a `verificarBase(c.bola, \`${c.id}.bola\`);`:

```js
    eventosOrdenados(c.eventos, c.congelaEm, `${c.id}.eventos`);
    for (const e of c.eventos) {
      assert.ok(['passe', 'remate'].includes(e.tipo), `${c.id}: no lance so ha passes e remates`);
      assert.equal(c.jogadores[e.jogador]?.equipa, 'nos', `${c.id}: ${e.jogador} nao e nosso`);
    }
```

5c. Dentro do ciclo das variantes, a seguir a `const certo = ...; assert.ok(dist(certo, ...))`, acrescentar a verificação dos passes do lance nesta variante:

```js
      for (const e of c.eventos) {
        const d = dist(posicaoEm(c.bola, e.t), posicaoEm(traj[e.jogador], e.t));
        assert.ok(d <= 1.5, `${onde}: ${e.jogador} esta a ${d.toFixed(2)} m da bola no ${e.tipo} do lance`);
      }
```

5d. Substituir a linha `verificarConsequencia(k.bola, \`${o}.bola\`, bolaNoCongelamento);` por:

```js
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
```

Na verificação "A bola não atravessa adversários parados", `bolaFim` e `tFim` continuam a usar `k.bola` completo (já usam).

- [ ] **Step 6: Correr e ver falhar**

Run: `npm test`
Expected: FAIL nos 3 cenários com "falta a lista de eventos".

- [ ] **Step 7: Acrescentar os dados em `jogo/cenarios.js`**

Alterações exatas (o resto fica igual):

`costasLateral` (a seguir à linha `bola: [[0, 13, 17.5], ...]`): `eventos: [{ t: 0.8, tipo: 'passe', jogador: 'n-dc' }],`

- `espaco.profundidade`: `bola: [[0, 21, 5.5], [1.6, 46, 5.8, 2.5], [3, 50, 7.2]],` e `eventos: [{ t: 0, tipo: 'passe', jogador: 'n-de' }],`
- `espaco.curto`: `eventos: [{ t: 0, tipo: 'passe', jogador: 'n-de' }],`
- `espaco.fico`: `duracao: 3.8`, `eventos: [{ t: 0, tipo: 'passe', jogador: 'n-de' }, { t: 1.8, tipo: 'perda', jogador: 'e-cen' }],`
- `pressao.profundidade`: `duracao: 3.8`, `bola: [[0, 21, 5.5], [1.8, 47, 8.5, 2.2]],`, `eventos: [{ t: 0, tipo: 'passe', jogador: 'n-de' }, { t: 1.8, tipo: 'perda', jogador: 'e-cen' }],`
- `pressao.curto`: `eventos: [{ t: 0, tipo: 'passe', jogador: 'n-de' }, { t: 1.4, tipo: 'passe', jogador: 'arthur' }],`
- `pressao.fico`: `duracao: 3.8`, `eventos: [{ t: 0, tipo: 'passe', jogador: 'n-de' }, { t: 1.8, tipo: 'perda', jogador: 'e-lat' }],`

`receberCostas`: `eventos: [{ t: 1, tipo: 'passe', jogador: 'n-dc' }],`

- `pressao.rodar`: `duracao: 4`, `eventos: [{ t: 0, tipo: 'passe', jogador: 'n-mc' }, { t: 2.2, tipo: 'perda', jogador: 'e-cen' }],`
- `pressao.tabelar`: `eventos: [{ t: 0, tipo: 'passe', jogador: 'n-mc' }, { t: 1.2, tipo: 'passe', jogador: 'arthur' }, { t: 2, tipo: 'passe', jogador: 'n-mc' }],`
- `pressao.recuar`: `eventos: [{ t: 0, tipo: 'passe', jogador: 'n-mc' }],`
- `espaco.rodar`: `bola: [[0, 28, 14.3], [1.2, 35, 12.6], [3, 42.5, 12.2], [4, 46.4, 13.1], [4.75, 55.8, 16.2, 0.9]],`, `eventos: [{ t: 0, tipo: 'passe', jogador: 'n-mc' }, { t: 4, tipo: 'remate', jogador: 'arthur' }, { t: 4.4, tipo: 'defesa', jogador: 'e-gr' }, { t: 4.7, tipo: 'golo' }],`
- `espaco.tabelar`: `eventos: [{ t: 0, tipo: 'passe', jogador: 'n-mc' }, { t: 1.2, tipo: 'passe', jogador: 'arthur' }],`
- `espaco.recuar`: `eventos: [{ t: 0, tipo: 'passe', jogador: 'n-mc' }],`

`rematarAssistir`: `eventos: [{ t: 1, tipo: 'passe', jogador: 'n-dc' }],`

- `pressao.rematar`: `duracao: 3.8`, `eventos: [{ t: 0, tipo: 'passe', jogador: 'n-mc' }, { t: 1.2, tipo: 'remate', jogador: 'arthur' }, { t: 1.8, tipo: 'perda', jogador: 'e-cen' }],`
- `pressao.passar`: `bola: [[0, 36, 15.2], [1.2, 46, 12.2], [2, 48, 20], [2.9, 55.8, 18.3, 0.7]],`, `eventos: [{ t: 0, tipo: 'passe', jogador: 'n-mc' }, { t: 1.2, tipo: 'passe', jogador: 'arthur' }, { t: 2, tipo: 'remate', jogador: 'n-ad' }, { t: 2.5, tipo: 'defesa', jogador: 'e-gr' }, { t: 2.85, tipo: 'golo' }],`
- `pressao.driblar`: `duracao: 4`, `eventos: [{ t: 0, tipo: 'passe', jogador: 'n-mc' }, { t: 2.2, tipo: 'perda', jogador: 'e-cen' }],`
- `espaco.rematar`: `bola: [[0, 36, 15.2], [1.2, 46, 12.2], [2.1, 55.8, 16.3, 0.9]],`, `eventos: [{ t: 0, tipo: 'passe', jogador: 'n-mc' }, { t: 1.2, tipo: 'remate', jogador: 'arthur' }, { t: 1.75, tipo: 'defesa', jogador: 'e-gr' }, { t: 2.05, tipo: 'golo' }],`
- `espaco.passar`: `duracao: 3.8`, `eventos: [{ t: 0, tipo: 'passe', jogador: 'n-mc' }, { t: 1.2, tipo: 'passe', jogador: 'arthur' }, { t: 2, tipo: 'perda', jogador: 'e-cen' }],`
- `espaco.driblar`: `eventos: [{ t: 0, tipo: 'passe', jogador: 'n-mc' }, { t: 2.6, tipo: 'defesa', jogador: 'e-gr' }],`

Atualizar o comentário do topo de `cenarios.js`: acrescentar a frase "Bola: [tempo, x, z, h], com h opcional (altura máxima do arco que chega a esse ponto). Eventos: { t, tipo, jogador? } marcam passes, remates, golos, perdas e defesas."

- [ ] **Step 8: Correr e ver passar**

Run: `npm test`
Expected: PASS (28 testes). Se uma distância de evento falhar, corrigir o `t` do evento (não as trajetórias).

- [ ] **Step 9: Commit**

```bash
git add jogo/regras.js jogo/cenarios.js tests/regras.test.js tests/cenarios.test.js
git commit -m "Add events, ball arcs and goals into the net to the scenarios

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Momentos do jogo (funções puras)

**Files:**
- Create: `jogo/momentos.js`
- Test: `tests/momentos.test.js`

**Interfaces:**
- Consumes: formato de eventos da Tarefa 1.
- Produces:
  - `GESTO_DO_EVENTO = { passe: 'passe', remate: 'remate', defesa: 'gr-defesa', perda: 'desarme' }`
  - `agendarGestos(eventos, contacto) → [{ t, desvio, jogador, nome }]` ordenado por `t` (sem `arthur`)
  - `dispararAte(lista, indice, t) → { disparados, indice }` (dispara itens com `item.t <= t` a partir de `indice`)
  - `reacoesDoEvento(evento, eventos, jogadores) → [acao]`, onde `acao` é `{ acao: 'golo' }`, `{ acao: 'torcida', tipo }`, `{ acao: 'som', nome }`, `{ acao: 'gesto', jogador, nome, desvio }` ou `{ acao: 'roubar', jogador }`
  - `reacoesDoFim(consequencia) → [acao]`
  - `intensidadeReacao(tipo, tDesde) → 0..1`, `REACOES_TORCIDA`
  - `pontoDeFuga([x, z]) → [x, z]`

- [ ] **Step 1: Testes**

Criar `tests/momentos.test.js`:

```js
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
```

- [ ] **Step 2: Correr e ver falhar**

Run: `npm test`
Expected: FAIL, `Cannot find module '../jogo/momentos.js'`.

- [ ] **Step 3: Implementar `jogo/momentos.js`**

```js
// Momentos do jogo: o que acontece quando o relógio passa um evento do cenário. Funções puras.

export const GESTO_DO_EVENTO = { passe: 'passe', remate: 'remate', defesa: 'gr-defesa', perda: 'desarme' };

// O gesto começa antes do evento para o pé (ou as mãos) chegar à bola no instante certo.
// Se não houver tempo para isso, começa já e salta o início da animação (desvio).
export function agendarGestos(eventos, contacto) {
  const agenda = [];
  for (const ev of eventos || []) {
    const nome = GESTO_DO_EVENTO[ev.tipo];
    if (!nome || !ev.jogador || ev.jogador === 'arthur') continue;
    const antes = contacto[nome] || 0;
    agenda.push({ t: Math.max(0, ev.t - antes), desvio: Math.max(0, antes - ev.t), jogador: ev.jogador, nome });
  }
  return agenda.sort((a, b) => a.t - b.t);
}

export function dispararAte(lista, indice, t) {
  const disparados = [];
  let i = indice;
  while (i < lista.length && lista[i].t <= t) disparados.push(lista[i++]);
  return { disparados, indice: i };
}

export function reacoesDoEvento(evento, eventos, jogadores) {
  if (evento.tipo === 'golo') {
    const out = [{ acao: 'golo' }, { acao: 'torcida', tipo: 'golo' }, { acao: 'som', nome: 'golo' }];
    for (const [id, j] of Object.entries(jogadores)) {
      if (id === 'arthur' || j.guardaRedes) continue;
      out.push({ acao: 'gesto', jogador: id, nome: j.equipa === 'nos' ? 'festejo' : 'desanimo', desvio: 0 });
    }
    return out;
  }
  if (evento.tipo === 'perda') {
    return [{ acao: 'roubar', jogador: evento.jogador }, { acao: 'torcida', tipo: 'falhanco' }, { acao: 'som', nome: 'uuuh' }];
  }
  if (evento.tipo === 'defesa') {
    const goloDepois = eventos.some((e) => e.tipo === 'golo' && e.t >= evento.t);
    return goloDepois ? [] : [{ acao: 'torcida', tipo: 'falhanco' }, { acao: 'som', nome: 'uuuh' }];
  }
  return [];
}

export function reacoesDoFim(consequencia) {
  const golo = (consequencia.eventos || []).some((e) => e.tipo === 'golo');
  if (consequencia.resultado !== 'bom' || golo) return [];
  return [{ acao: 'torcida', tipo: 'aplauso' }, { acao: 'som', nome: 'aplauso' }];
}

export const REACOES_TORCIDA = { golo: { duracao: 4.5 }, falhanco: { duracao: 2.5 }, aplauso: { duracao: 2.5 } };
const SUBIDA = 0.2;
const DESCIDA = 0.6;

export function intensidadeReacao(tipo, tDesde) {
  const r = REACOES_TORCIDA[tipo];
  if (!r || tDesde < 0 || tDesde > r.duracao) return 0;
  return Math.min(1, tDesde / SUBIDA, (r.duracao - tDesde) / DESCIDA);
}

// Quem rouba a bola foge 14 m para a nossa baliza, sem sair do campo.
export function pontoDeFuga([x, z]) {
  return [Math.max(3, x - 14), Math.min(32, Math.max(3, z))];
}
```

- [ ] **Step 4: Correr e ver passar**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add jogo/momentos.js tests/momentos.test.js
git commit -m "Add pure game moments: gesture schedule, event reactions, crowd intensity

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Jogador 3D a partir do modelo da Mixamo

**Files:**
- Create: `jogo/animacao.js`, `jogo/jogador3d.js`, `jogo/carregador.js`
- Modify: `jogo/boneco.js` (acrescentar `gesto`), `jogo.html` (import map)
- Test: `tests/animacao.test.js`

**Interfaces:**
- Consumes: `comLimite` (Tarefa 1); modelo `jogo/modelos/jogador.glb` (ver Global Constraints).
- Produces:
  - `animacao.js`: `GESTOS`, `CONTACTO`, `escolherAnimacao({ vel, guardaRedes, gesto }) → { nome, ritmo }`, `clipeDisponivel(nome, clipes: Map) → nome | null`, `pecaDaMalha(nomeMalha) → 'camisola'|'calcoes'|'meias'|null`
  - `jogador3d.js`: `prepararModelo(gltf) → modelo`, `criarJogador3d(modelo, { cores, guardaRedes, numero }) → { grupo, animar(vel, dt), gesto(nome, desvio = 0), libertar() }`, `ALTURA_JOGADOR = 1.5`
  - `carregador.js`: `carregarModelo(aoProgresso, url?) → Promise<modelo | null>`
  - `boneco.js`: objeto devolvido ganha `gesto() {}`

- [ ] **Step 1: Testes de `animacao.js`**

Criar `tests/animacao.test.js`:

```js
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
```

- [ ] **Step 2: Correr e ver falhar**

Run: `npm test`
Expected: FAIL, módulo em falta.

- [ ] **Step 3: Implementar `jogo/animacao.js`**

```js
// Escolha da animação de cada jogador e peças do equipamento. Funções puras, sem 3D.

export const VEL_PARADO = 0.4;
export const VEL_SPRINT = 5;
export const VEL_LARGA_GESTO = 1.5;
const VEL_CLIPE_CORRIDA = 3.5;
const VEL_CLIPE_SPRINT = 6.5;

export const GESTOS = {
  passe: { repetir: false },
  remate: { repetir: false },
  cabeca: { repetir: false },
  'gr-defesa': { repetir: false },
  desarme: { repetir: false },
  festejo: { repetir: true },
  desanimo: { repetir: true },
  aplauso: { repetir: true },
};

// Segundos desde o início do clipe até o pé (ou as mãos) tocarem na bola. Afinados na Tarefa 13.
export const CONTACTO = { passe: 0.45, remate: 0.9, 'gr-defesa': 0.5, desarme: 0.6 };

const RESERVA = { 'gr-parado': 'parado', sprint: 'correr' };

const limitar = (v, a, b) => Math.max(a, Math.min(b, v));

export function escolherAnimacao({ vel, guardaRedes, gesto }) {
  if (gesto && !gesto.terminado && (!gesto.repetir || vel < VEL_LARGA_GESTO)) return { nome: gesto.nome, ritmo: 1 };
  if (vel < VEL_PARADO) return { nome: guardaRedes ? 'gr-parado' : 'parado', ritmo: 1 };
  if (vel < VEL_SPRINT) return { nome: 'correr', ritmo: limitar(vel / VEL_CLIPE_CORRIDA, 0.6, 1.5) };
  return { nome: 'sprint', ritmo: limitar(vel / VEL_CLIPE_SPRINT, 0.8, 1.3) };
}

export function clipeDisponivel(nome, clipes) {
  if (clipes.has(nome)) return nome;
  const reserva = RESERVA[nome];
  return reserva && clipes.has(reserva) ? reserva : null;
}

const PECAS = [[/_Shirt$/i, 'camisola'], [/_Shorts$/i, 'calcoes'], [/_Socks$/i, 'meias']];

export function pecaDaMalha(nome) {
  for (const [re, peca] of PECAS) if (re.test(nome || '')) return peca;
  return null;
}
```

Nota: `escolherAnimacao({ vel: 0.41 })` dá `ritmo` 0,6 (limite inferior), como o teste espera.

- [ ] **Step 4: Correr e ver passar**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Import map em `jogo.html`**

No `<script type="importmap">`, acrescentar a linha `"three/addons/": "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/",` entre `three` e `yuka`.

- [ ] **Step 6: `gesto` no boneco**

Em `jogo/boneco.js`, no objeto devolvido, a seguir a `animar(...) {...},` acrescentar:

```js
    // Os bonecos simples não têm gestos; existe para terem a mesma interface do jogador3d.
    gesto() {},
```

- [ ] **Step 7: Implementar `jogo/jogador3d.js`**

```js
// Jogador 3D a partir do modelo da Mixamo: clone com esqueleto, equipamento pintado por peça,
// riscas, número nas costas e animações misturadas. Mesma interface do boneco.js, mais gesto().
import * as THREE from 'three';
import { clone as clonarComEsqueleto } from 'three/addons/utils/SkeletonUtils.js';
import { GESTOS, clipeDisponivel, escolherAnimacao, pecaDaMalha } from './animacao.js';

export const ALTURA_JOGADOR = 1.5;
const MISTURA = 0.25;
const LARGURA_RISCA = 0.07; // metros no modelo original
const ALTURA_NUMERO = 0.72; // fração da altura onde fica o centro do número
const TAMANHO_NUMERO = 0.13; // fração da altura

function encontrarOsso(raiz, re) {
  let achado = null;
  raiz.traverse((o) => { if (!achado && o.isBone && re.test(o.name)) achado = o; });
  return achado ? achado.name : null;
}

export function prepararModelo(gltf) {
  const base = gltf.scene;
  base.updateMatrixWorld(true);
  const caixa = new THREE.Box3().setFromObject(base);
  const altura = caixa.max.y - caixa.min.y;
  const centroX = (caixa.max.x + caixa.min.x) / 2;
  // Costas da camisola: o vértice mais atrás (menor z, o modelo olha para +z) à altura do número.
  let zCostas = Infinity;
  const v = new THREE.Vector3();
  base.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.frustumCulled = false;
    if (pecaDaMalha(o.name) !== 'camisola') return;
    const pos = o.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      const y = (v.y - caixa.min.y) / altura;
      if (Math.abs(v.x - centroX) < 0.05 * altura && Math.abs(y - ALTURA_NUMERO) < 0.05) zCostas = Math.min(zCostas, v.z);
    }
  });
  return {
    base,
    escala: ALTURA_JOGADOR / altura,
    chao: caixa.min.y,
    clipes: new Map(gltf.animations.map((c) => [c.name, c])),
    materiais: new Map(),
    osso: encontrarOsso(base, /Spine2$/),
    costas: Number.isFinite(zCostas)
      ? { x: centroX, y: caixa.min.y + ALTURA_NUMERO * altura, z: zCostas - 0.004 * altura, lado: TAMANHO_NUMERO * altura }
      : null,
  };
}

// Material de uma peça para umas cores: a cor multiplica a textura branca do equipamento (mantém pregas e sombras).
function materialPeca(modelo, original, peca, cores) {
  const cor = peca === 'camisola' ? cores.camisola[0] : peca === 'calcoes' ? cores.calcoes : cores.meias || cores.camisola[0];
  const riscas = peca === 'camisola' && cores.camisola.length > 1 ? cores.camisola[1] : null;
  const chave = `${original.uuid}|${cor}|${riscas}`;
  if (modelo.materiais.has(chave)) return modelo.materiais.get(chave);
  const m = original.clone();
  m.color = new THREE.Color(cor);
  if (riscas) {
    const segunda = new THREE.Color(riscas);
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uRisca = { value: segunda };
      shader.uniforms.uLargura = { value: LARGURA_RISCA };
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vRiscaX;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRiscaX = position.x;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vRiscaX;\nuniform vec3 uRisca;\nuniform float uLargura;')
        .replace('#include <map_fragment>', '#include <map_fragment>\nif (mod(floor(vRiscaX / uLargura), 2.0) > 0.5) diffuseColor.rgb *= uRisca / max(diffuse, vec3(0.001));');
    };
    m.customProgramCacheKey = () => 'jogador3d-riscas';
  }
  modelo.materiais.set(chave, m);
  return m;
}

function texturaNumero(numero) {
  const tela = document.createElement('canvas');
  tela.width = 128;
  tela.height = 128;
  const ctx = tela.getContext('2d');
  ctx.font = '700 104px Oswald, "Arial Narrow", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#0C2A1E';
  ctx.strokeText(String(numero), 64, 68);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(String(numero), 64, 68);
  const t = new THREE.CanvasTexture(tela);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Cola o número nas costas, preso ao osso do peito para acompanhar a animação.
function colarNumero(corpo, modelo, numero) {
  const osso = modelo.osso && corpo.getObjectByName(modelo.osso);
  if (!osso || !modelo.costas || numero == null) return null;
  const c = modelo.costas;
  const placa = new THREE.Mesh(
    new THREE.PlaneGeometry(c.lado, c.lado),
    new THREE.MeshBasicMaterial({ map: texturaNumero(numero), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }),
  );
  placa.position.set(c.x, c.y, c.z);
  placa.rotation.y = Math.PI; // virada para trás (-z)
  corpo.add(placa);
  corpo.updateMatrixWorld(true);
  osso.attach(placa);
  return placa;
}

export function criarJogador3d(modelo, { cores, guardaRedes = false, numero = null }) {
  const corpo = clonarComEsqueleto(modelo.base);
  corpo.traverse((o) => {
    if (!o.isMesh) return;
    const peca = pecaDaMalha(o.name);
    if (peca) o.material = materialPeca(modelo, o.material, peca, cores);
    o.castShadow = true;
    o.frustumCulled = false;
  });
  const placa = colarNumero(corpo, modelo, numero);
  corpo.scale.setScalar(modelo.escala);
  corpo.position.y = -modelo.chao * modelo.escala;
  corpo.rotation.y = Math.PI; // o modelo olha para +z; no jogo a frente é -z
  const grupo = new THREE.Group();
  grupo.add(corpo);

  const misturador = new THREE.AnimationMixer(corpo);
  const acoes = new Map();
  const acao = (nome) => {
    if (!acoes.has(nome)) acoes.set(nome, misturador.clipAction(modelo.clipes.get(nome)));
    return acoes.get(nome);
  };
  let atual = null;
  let gesto = null;
  misturador.addEventListener('finished', (ev) => {
    if (gesto && ev.action === acoes.get(gesto.nome)) gesto.terminado = true;
  });

  function mudarPara(nome, ritmo) {
    const real = clipeDisponivel(nome, modelo.clipes);
    if (!real) return;
    const a = acao(real);
    a.timeScale = ritmo;
    if (atual === real) return;
    const g = GESTOS[real];
    a.reset();
    a.setLoop(g && !g.repetir ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    a.clampWhenFinished = true;
    a.setEffectiveWeight(1).fadeIn(MISTURA).play();
    if (atual) acao(atual).fadeOut(MISTURA);
    atual = real;
  }

  return {
    grupo,
    animar(vel, dt) {
      const e = escolherAnimacao({ vel, guardaRedes, gesto });
      mudarPara(e.nome, e.ritmo);
      misturador.update(dt);
    },
    gesto(nome, desvio = 0) {
      const g = GESTOS[nome];
      if (!g || !modelo.clipes.has(nome)) return;
      gesto = { nome, repetir: g.repetir, terminado: false };
      if (atual === nome) atual = null; // o mesmo gesto outra vez recomeça
      mudarPara(nome, 1);
      acao(nome).time = desvio;
    },
    libertar() {
      misturador.stopAllAction();
      misturador.uncacheRoot(corpo);
      // Geometria e materiais são partilhados entre jogadores: só se liberta o que é deste jogador.
      if (placa) {
        placa.material.map.dispose();
        placa.material.dispose();
        placa.geometry.dispose();
      }
    },
  };
}
```

Nota sobre as riscas: `diffuseColor.rgb` já vem multiplicado pela cor da camisola (`diffuse`); dividir por `diffuse` e multiplicar pela segunda cor troca a cor mantendo a textura.

- [ ] **Step 8: Implementar `jogo/carregador.js`**

```js
// Carrega o modelo dos jogadores. Se falhar ou demorar, devolve null e o jogo usa os bonecos simples.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { comLimite } from './regras.js';
import { prepararModelo } from './jogador3d.js';

export const URL_MODELO = 'jogo/modelos/jogador.glb';
export const LIMITE_MODELO_MS = 20000;

export async function carregarModelo(aoProgresso = () => {}, url = URL_MODELO) {
  const promessa = new Promise((resolver, rejeitar) => {
    new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load(
      url,
      (gltf) => {
        try {
          resolver(prepararModelo(gltf));
        } catch (e) {
          rejeitar(e);
        }
      },
      (ev) => { if (ev.total) aoProgresso(Math.min(0.99, ev.loaded / ev.total)); },
      rejeitar,
    );
  });
  const modelo = await comLimite(promessa, LIMITE_MODELO_MS);
  aoProgresso(1);
  return modelo;
}
```

- [ ] **Step 9: Verificação visual isolada**

Criar na raiz do repositório um ficheiro temporário `ver-jogador.html` (não fazer commit) com o import map de `jogo.html`, uma cena com `HemisphereLight` e `DirectionalLight`, e este módulo:

```js
import * as THREE from 'three';
import { carregarModelo } from './jogo/carregador.js';
import { criarJogador3d } from './jogo/jogador3d.js';
// ... renderer, cena, câmara em (0, 1.2, 6) a olhar para (0, 0.8, 0)
const modelo = await carregarModelo((f) => console.log('progresso', f));
const cores = [
  { camisola: ['#1B5C3E', '#FFFFFF'], calcoes: '#FFFFFF', meias: '#1B5C3E' },
  { camisola: ['#C2493B'], calcoes: '#3A1410', meias: '#C2493B' },
  { camisola: ['#E2932E'], calcoes: '#1A1A1A', meias: '#E2932E' },
];
const js = cores.map((c, i) => { const j = criarJogador3d(modelo, { cores: c, numero: 9 + i }); j.grupo.position.x = (i - 1) * 1.2; cena.add(j.grupo); return j; });
// No ciclo: js[0].animar(0, dt); js[1].animar(3.5, dt); js[2].animar(6.5, dt);
// Teclas: P → js[0].gesto('passe'); R → js[1].gesto('remate'); F → js[2].gesto('festejo').
```

Com o servidor (`python <scratchpad>/servidor.py 8765`), abrir `http://127.0.0.1:8765/ver-jogador.html`. Expected:
- três jogadores com 1,5 m: riscas verticais verde e branco; vermelho; laranja;
- calções e meias com as cores certas; cara e cabelo originais;
- números 9, 10 e 11 visíveis nas costas (rodar a câmara ou o grupo 180°);
- parado, corrida e sprint suaves; P, R e F fazem o gesto e voltam à locomoção (F fica em festejo);
- consola sem erros.

Apagar `ver-jogador.html` no fim.

- [ ] **Step 10: Commit**

```bash
git add jogo/animacao.js jogo/jogador3d.js jogo/carregador.js jogo/boneco.js jogo.html tests/animacao.test.js
git commit -m "Add Mixamo-based 3D player with team kits, numbers and blended animations

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Giroscópio e olhar combinado

**Files:**
- Create: `jogo/giroscopio.js`
- Modify: `jogo/olhar.js`
- Test: `tests/giroscopio.test.js`, `tests/olhar.test.js`

**Interfaces:**
- Produces:
  - `orientacaoParaAngulos({ alpha, beta, gamma } em graus, anguloEcra em graus) → { yaw, pitch }` (radianos; yaw positivo = esquerda, pitch positivo = cima)
  - `relativo(angulos, origem) → { yaw, pitch }`
  - `criarGiroscopio(janela = globalThis) → { disponivel, precisaAutorizacao, autorizado, ligado, pedirAutorizacao(): Promise<bool>, ligar(): bool, desligar(), recalibrar(), ler(): {yaw, pitch} | null }`
  - `olhar.js`: `combinarOlhar(dedo, giro | null) → { yaw, pitch }`; `criarOlhar(elemento, giroscopio = null)`; `reiniciar()` passa a chamar `giroscopio.recalibrar()`.

- [ ] **Step 1: Testes do giroscópio**

Criar `tests/giroscopio.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { orientacaoParaAngulos, relativo, criarGiroscopio } from '../jogo/giroscopio.js';

const G = Math.PI / 180;
const perto = (a, b, tol = 1, msg) => assert.ok(Math.abs(a - b) <= tol * G, `${msg}: ${(a / G).toFixed(2)} vs ${(b / G).toFixed(2)}`);

function rodar(ori0, ori1, ecra) {
  return relativo(orientacaoParaAngulos(ori1, ecra), orientacaoParaAngulos(ori0, ecra));
}

test('ao alto: rodar 30 graus para a esquerda da yaw +30', () => {
  const r = rodar({ alpha: 0, beta: 85, gamma: 0 }, { alpha: 30, beta: 85, gamma: 0 }, 0);
  perto(r.yaw, 30 * G, 1, 'yaw');
  perto(r.pitch, 0, 1, 'pitch');
});

test('ao alto: inclinar o topo para tras olha para cima', () => {
  perto(rodar({ alpha: 0, beta: 85, gamma: 0 }, { alpha: 0, beta: 95, gamma: 0 }, 0).pitch, 10 * G, 1, 'pitch');
});

test('beta 90 (telemovel direito) nao salta', () => {
  const a = orientacaoParaAngulos({ alpha: 0, beta: 90, gamma: 0 }, 0);
  const b = orientacaoParaAngulos({ alpha: 20, beta: 90, gamma: 0 }, 0);
  perto(relativo(b, a).yaw, 20 * G, 1, 'yaw');
  perto(a.pitch, 0, 1, 'pitch');
});

test('deitado (ecra a 90 e a 270): rodar 30 graus da yaw +30', () => {
  perto(rodar({ alpha: 0, beta: 0, gamma: -85 }, { alpha: 30, beta: 0, gamma: -85 }, 90).yaw, 30 * G, 1, 'yaw 90');
  perto(rodar({ alpha: 0, beta: 0, gamma: 85 }, { alpha: 30, beta: 0, gamma: 85 }, 270).yaw, 30 * G, 1, 'yaw 270');
});

test('cruzar o norte (alpha 359 para 1) da +2 graus, nao -358', () => {
  perto(rodar({ alpha: 359, beta: 85, gamma: 0 }, { alpha: 1, beta: 85, gamma: 0 }, 0).yaw, 2 * G, 0.5, 'yaw');
});

function janelaFalsa({ pedir } = {}) {
  const ouvintes = {};
  const DeviceOrientationEvent = function () {};
  if (pedir) DeviceOrientationEvent.requestPermission = pedir;
  return {
    DeviceOrientationEvent,
    matchMedia: () => ({ matches: true }),
    screen: { orientation: { angle: 0 } },
    addEventListener: (n, f) => { ouvintes[n] = f; },
    removeEventListener: (n) => { delete ouvintes[n]; },
    emitir: (ev) => ouvintes.deviceorientation && ouvintes.deviceorientation(ev),
    ouvintes,
  };
}

test('sem sensor: indisponivel, ligar falha, ler da null', () => {
  const g = criarGiroscopio({ matchMedia: () => ({ matches: true }) });
  assert.equal(g.disponivel, false);
  assert.equal(g.ligar(), false);
  assert.equal(g.ler(), null);
});

test('android (sem pedido): liga, le relativo ao primeiro valor e recalibra', () => {
  const j = janelaFalsa();
  const g = criarGiroscopio(j);
  assert.equal(g.precisaAutorizacao, false);
  assert.equal(g.ligar(), true);
  assert.equal(g.ler(), null);
  j.emitir({ alpha: 10, beta: 85, gamma: 0 });
  perto(g.ler().yaw, 0, 0.1, 'primeira leitura');
  j.emitir({ alpha: 40, beta: 85, gamma: 0 });
  perto(g.ler().yaw, 30 * G, 1, 'depois de rodar');
  g.recalibrar();
  perto(g.ler().yaw, 0, 0.1, 'recalibrado');
  g.desligar();
  assert.equal(g.ligado, false);
  assert.equal(j.ouvintes.deviceorientation, undefined);
});

test('iphone: pedirAutorizacao concedida e recusada', async () => {
  const sim = criarGiroscopio(janelaFalsa({ pedir: async () => 'granted' }));
  assert.equal(sim.precisaAutorizacao, true);
  assert.equal(sim.ligar(), false);
  assert.equal(await sim.pedirAutorizacao(), true);
  assert.equal(sim.ligar(), true);
  const nao = criarGiroscopio(janelaFalsa({ pedir: async () => 'denied' }));
  assert.equal(await nao.pedirAutorizacao(), false);
  assert.equal(nao.ligar(), false);
  const erro = criarGiroscopio(janelaFalsa({ pedir: async () => { throw new Error('x'); } }));
  assert.equal(await erro.pedirAutorizacao(), false);
});
```

- [ ] **Step 2: Testes do olhar**

Criar `tests/olhar.test.js`:

```js
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
```

- [ ] **Step 3: Correr e ver falhar**

Run: `npm test`
Expected: FAIL (módulo e exportações em falta).

- [ ] **Step 4: Implementar `jogo/giroscopio.js`**

```js
// Giroscópio: rodar o telemóvel roda a cabeça no jogo. Matemática pura em cima; leitura do aparelho em baixo.
// A orientação segue o método do DeviceOrientationControls do Three.js (euler YXZ, -90° em X, ângulo do ecrã em Z).

const GRAUS = Math.PI / 180;
const normalizar = (a) => Math.atan2(Math.sin(a), Math.cos(a));

function quaternioYXZ(x, y, z) {
  const c1 = Math.cos(x / 2), c2 = Math.cos(y / 2), c3 = Math.cos(z / 2);
  const s1 = Math.sin(x / 2), s2 = Math.sin(y / 2), s3 = Math.sin(z / 2);
  return [s1 * c2 * c3 + c1 * s2 * s3, c1 * s2 * c3 - s1 * c2 * s3, c1 * c2 * s3 - s1 * s2 * c3, c1 * c2 * c3 + s1 * s2 * s3];
}

function multiplicar([ax, ay, az, aw], [bx, by, bz, bw]) {
  return [
    ax * bw + aw * bx + ay * bz - az * by,
    ay * bw + aw * by + az * bx - ax * bz,
    az * bw + aw * bz + ax * by - ay * bx,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

const MENOS_90_EM_X = [-Math.SQRT1_2, 0, 0, Math.SQRT1_2];

export function orientacaoParaAngulos({ alpha = 0, beta = 0, gamma = 0 }, anguloEcra = 0) {
  let q = quaternioYXZ(beta * GRAUS, alpha * GRAUS, -gamma * GRAUS);
  q = multiplicar(q, MENOS_90_EM_X);
  const meio = (-anguloEcra * GRAUS) / 2;
  q = multiplicar(q, [0, 0, Math.sin(meio), Math.cos(meio)]);
  const [x, y, z, w] = q;
  const m13 = 2 * (x * z + y * w);
  const m23 = 2 * (y * z - x * w);
  const m33 = 1 - 2 * (x * x + y * y);
  const m31 = 2 * (x * z - y * w);
  const m11 = 1 - 2 * (y * y + z * z);
  const pitch = Math.asin(-Math.max(-1, Math.min(1, m23)));
  const yaw = Math.abs(m23) < 0.9999999 ? Math.atan2(m13, m33) : Math.atan2(-m31, m11);
  return { yaw, pitch };
}

export function relativo(angulos, origem) {
  return { yaw: normalizar(angulos.yaw - origem.yaw), pitch: angulos.pitch - origem.pitch };
}

export function criarGiroscopio(janela = globalThis) {
  const Evento = janela.DeviceOrientationEvent;
  const temEvento = typeof Evento !== 'undefined';
  const toque = !!janela.matchMedia?.('(pointer: coarse)').matches;
  const precisaAutorizacao = temEvento && typeof Evento.requestPermission === 'function';
  let autorizado = temEvento && !precisaAutorizacao;
  let ligado = false;
  let ultimo = null;
  let origem = null;

  const anguloEcra = () => Number(janela.screen?.orientation?.angle ?? janela.orientation ?? 0) || 0;
  const aoMudar = (ev) => {
    if (ev.alpha == null && ev.beta == null && ev.gamma == null) return;
    ultimo = orientacaoParaAngulos(ev, anguloEcra());
  };

  return {
    disponivel: temEvento && toque,
    precisaAutorizacao,
    get autorizado() { return autorizado; },
    get ligado() { return ligado; },
    async pedirAutorizacao() {
      if (!temEvento) return false;
      if (!precisaAutorizacao) return autorizado;
      try {
        autorizado = (await Evento.requestPermission()) === 'granted';
      } catch {
        autorizado = false;
      }
      return autorizado;
    },
    ligar() {
      if (ligado) return true;
      if (!temEvento || !autorizado) return false;
      janela.addEventListener('deviceorientation', aoMudar);
      ligado = true;
      ultimo = null;
      origem = null;
      return true;
    },
    desligar() {
      if (!ligado) return;
      janela.removeEventListener('deviceorientation', aoMudar);
      ligado = false;
      ultimo = null;
      origem = null;
    },
    recalibrar() {
      origem = ultimo;
    },
    ler() {
      if (!ligado || !ultimo) return null;
      if (!origem) origem = ultimo;
      return relativo(ultimo, origem);
    },
  };
}
```

- [ ] **Step 5: Alterar `jogo/olhar.js`**

Substituir o ficheiro por:

```js
// Olhar à volta: dedo, rato (arrastar), setas e giroscópio. Ângulos em radianos; yawRel positivo = esquerda.
const SENS_TOQUE = 0.006;
const SENS_RATO = 0.005;
const VEL_SETAS = 2.6;
const VEL_SETAS_VERTICAL = 1.2;
export const PITCH_MAX = (25 * Math.PI) / 180;

const limitar = (v, a, b) => Math.max(a, Math.min(b, v));

// O giroscópio soma-se ao dedo; a yaw total dá a volta em ±π, o pitch fica limitado.
export function combinarOlhar(dedo, giro) {
  if (!giro) return { yaw: dedo.yaw, pitch: dedo.pitch };
  const y = dedo.yaw + giro.yaw;
  return { yaw: Math.atan2(Math.sin(y), Math.cos(y)), pitch: limitar(dedo.pitch + giro.pitch, -PITCH_MAX, PITCH_MAX) };
}

export function criarOlhar(elemento, giroscopio = null) {
  const teclas = new Set();
  const dedo = { yaw: 0, pitch: 0 };
  let arrasto = null;

  function limitarDedo() {
    dedo.yaw = limitar(dedo.yaw, -Math.PI, Math.PI);
    dedo.pitch = limitar(dedo.pitch, -PITCH_MAX, PITCH_MAX);
  }

  const s = {
    yawRel: 0,
    pitch: 0,
    ativo: false,
    atualizar(dt) {
      if (!s.ativo) return;
      if (teclas.has('ArrowLeft')) dedo.yaw += VEL_SETAS * dt;
      if (teclas.has('ArrowRight')) dedo.yaw -= VEL_SETAS * dt;
      if (teclas.has('ArrowUp')) dedo.pitch += VEL_SETAS_VERTICAL * dt;
      if (teclas.has('ArrowDown')) dedo.pitch -= VEL_SETAS_VERTICAL * dt;
      limitarDedo();
      const c = combinarOlhar(dedo, giroscopio ? giroscopio.ler() : null);
      s.yawRel = c.yaw;
      s.pitch = c.pitch;
    },
    reiniciar() {
      dedo.yaw = 0;
      dedo.pitch = 0;
      s.yawRel = 0;
      s.pitch = 0;
      arrasto = null;
      teclas.clear();
      // A direção atual do telemóvel passa a ser "em frente".
      if (giroscopio) giroscopio.recalibrar();
    },
  };

  elemento.addEventListener('pointerdown', (ev) => {
    if (!s.ativo) return;
    arrasto = { x: ev.clientX, y: ev.clientY, id: ev.pointerId };
    try {
      if (elemento.setPointerCapture) elemento.setPointerCapture(ev.pointerId);
    } catch {
      // Sem captura o arrasto continua a funcionar dentro do elemento.
    }
  });
  elemento.addEventListener('pointermove', (ev) => {
    if (!s.ativo || !arrasto || ev.pointerId !== arrasto.id) return;
    const k = ev.pointerType === 'mouse' ? SENS_RATO : SENS_TOQUE;
    dedo.yaw -= (ev.clientX - arrasto.x) * k;
    dedo.pitch -= (ev.clientY - arrasto.y) * k;
    arrasto.x = ev.clientX;
    arrasto.y = ev.clientY;
    limitarDedo();
  });
  const largar = () => { arrasto = null; };
  elemento.addEventListener('pointerup', largar);
  elemento.addEventListener('pointercancel', largar);

  window.addEventListener('keydown', (ev) => {
    if (!ev.key?.startsWith('Arrow')) return;
    if (s.ativo) ev.preventDefault();
    teclas.add(ev.key);
  });
  window.addEventListener('keyup', (ev) => teclas.delete(ev.key));
  window.addEventListener('blur', () => teclas.clear());

  return s;
}
```

- [ ] **Step 6: Correr e ver passar**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add jogo/giroscopio.js jogo/olhar.js tests/giroscopio.test.js tests/olhar.test.js
git commit -m "Add gyroscope look-around that adds to finger and keys

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Som do estádio

**Files:**
- Create: `jogo/som.js`
- Test: `tests/som.test.js`

**Interfaces:**
- Produces: `SONS`, `VOLUMES`, `CICLOS`; `criarSom({ ligado = true, janela = globalThis, buscar } = {}) → { carregar(aoProgresso): Promise<void>, desbloquear(), tocar(nome), iniciarAmbiente(), pararAmbiente(), definirLigado(v), ligado }`. Nomes: `estadio`, `canticos` (ciclos), `apito`, `golo`, `uuuh`, `aplauso`.

- [ ] **Step 1: Testes**

Criar `tests/som.test.js`:

```js
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
```

- [ ] **Step 2: Correr e ver falhar**

Run: `npm test`
Expected: FAIL, módulo em falta.

- [ ] **Step 3: Implementar `jogo/som.js`**

```js
// Som do estádio com Web Audio: ciclos de ambiente e efeitos. Sem som (bloqueado ou ficheiros em falta), o jogo segue.

export const SONS = {
  estadio: 'jogo/sons/estadio.mp3',
  canticos: 'jogo/sons/canticos.mp3',
  apito: 'jogo/sons/apito.mp3',
  golo: 'jogo/sons/golo.mp3',
  uuuh: 'jogo/sons/uuuh.mp3',
  aplauso: 'jogo/sons/aplauso.mp3',
};
export const VOLUMES = { estadio: 0.45, canticos: 0.22, apito: 0.7, golo: 1, uuuh: 0.85, aplauso: 0.75 };
export const CICLOS = ['estadio', 'canticos'];

export function criarSom({ ligado = true, janela = globalThis, buscar = (url) => janela.fetch(url) } = {}) {
  const Contexto = janela.AudioContext || janela.webkitAudioContext;
  const buffers = new Map();
  const ciclos = [];
  let ctx = null;
  let mestre = null;
  let estaLigado = ligado;
  let ambiente = false;

  function contexto() {
    if (ctx || !Contexto) return ctx;
    try {
      ctx = new Contexto();
      mestre = ctx.createGain();
      mestre.gain.value = estaLigado ? 1 : 0;
      mestre.connect(ctx.destination);
    } catch {
      ctx = null;
    }
    return ctx;
  }

  async function carregarUm(nome) {
    const c = contexto();
    if (!c) return;
    try {
      const r = await buscar(SONS[nome]);
      if (!r.ok) return;
      const dados = await r.arrayBuffer();
      // Forma com funções de retorno: funciona também no Safari antigo.
      buffers.set(nome, await new Promise((ok, falha) => c.decodeAudioData(dados, ok, falha)));
    } catch {
      // Fica sem este som.
    }
  }

  function fonte(nome, repetir) {
    const b = buffers.get(nome);
    if (!ctx || !b) return null;
    const f = ctx.createBufferSource();
    f.buffer = b;
    f.loop = repetir;
    const g = ctx.createGain();
    g.gain.value = VOLUMES[nome] ?? 1;
    f.connect(g).connect(mestre);
    f.start();
    return f;
  }

  return {
    async carregar(aoProgresso = () => {}) {
      const nomes = Object.keys(SONS);
      let feitos = 0;
      await Promise.all(nomes.map((n) => carregarUm(n).then(() => aoProgresso(++feitos / nomes.length))));
    },
    // Chamar num toque ou tecla: o iPhone só deixa tocar depois de um gesto do utilizador.
    desbloquear() {
      const c = contexto();
      if (c && c.state === 'suspended') c.resume().catch(() => {});
    },
    tocar(nome) {
      try {
        fonte(nome, false);
      } catch {
        // Sem som não há erro.
      }
    },
    iniciarAmbiente() {
      if (ambiente) return;
      ambiente = true;
      for (const n of CICLOS) {
        try {
          const f = fonte(n, true);
          if (f) ciclos.push(f);
        } catch {
          // Sem este ciclo.
        }
      }
    },
    pararAmbiente() {
      ambiente = false;
      for (const f of ciclos.splice(0)) {
        try {
          f.stop();
        } catch {
          // Já parado.
        }
      }
    },
    definirLigado(v) {
      estaLigado = !!v;
      if (mestre) mestre.gain.value = estaLigado ? 1 : 0;
    },
    get ligado() {
      return estaLigado;
    },
  };
}
```

- [ ] **Step 4: Correr e ver passar**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add jogo/som.js tests/som.test.js
git commit -m "Add stadium sound module with silent fallback

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Relva, redes e bola

**Files:**
- Modify: `jogo/campo.js`
- Create: `jogo/bola.js`

**Interfaces:**
- Produces:
  - `construirCampo(campo) → { grupo, abanarRede(), atualizar(dt) }` (**muda**: antes devolvia o grupo; o motor passa a usar `.grupo` na Tarefa 9). A relva recebe sombras.
  - `bola.js`: `RAIO_BOLA = 0.11`; `criarBola(cena) → { malha, colocar(wx, wz, altura, dt), reiniciar() }`

- [ ] **Step 1: `jogo/campo.js`**

Alterações:

1a. Substituir `texturaRiscas(n)` por uma textura de relva 1024 × 1024 com riscas e grão:

```js
function texturaRelva(n) {
  const tela = document.createElement('canvas');
  tela.width = 1024;
  tela.height = 1024;
  const ctx = tela.getContext('2d');
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 ? '#3A8A45' : '#45994F';
    ctx.fillRect((i * tela.width) / n, 0, tela.width / n + 1, tela.height);
  }
  // Grão da relva: pontos claros e escuros aleatórios.
  for (let k = 0; k < 60000; k++) {
    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
    ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
  }
  const t = new THREE.CanvasTexture(tela);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function texturaRede() {
  const tela = document.createElement('canvas');
  tela.width = 64;
  tela.height = 64;
  const ctx = tela.getContext('2d');
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(tela);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
}
```

1b. Relva: `new THREE.MeshLambertMaterial({ map: texturaRelva(11) })` e `relva.receiveShadow = true;`. A área de fora (`fora`) também `receiveShadow = true` e cor `#357A40`.

1c. Redes: substituir a caixa em wireframe por três planos (fundo e dois lados) e um teto, com a textura da rede (repetição de 1 quadrado por 0,15 m), `MeshBasicMaterial({ map, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, depthWrite: false })`. Para cada baliza, agrupar os planos num `THREE.Group` `rede`. Guardar o grupo da baliza adversária (x = C) em `redeDeles`.

```js
  const redes = [];
  for (const [x, lado] of [[0, -1], [C, 1]]) {
    // ... postes e trave como antes ...
    const rede = new THREE.Group();
    const fundo = 1.2;
    const plano = (l, a, rx, ry, px, py, pz) => {
      const tex = texturaRede();
      tex.repeat.set(l / 0.15, a / 0.15);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(l, a), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, depthWrite: false }));
      m.rotation.set(rx, ry, 0);
      m.position.set(px, py, pz);
      rede.add(m);
      return m;
    };
    const tras = plano(BALIZA_LARGURA, BALIZA_ALTURA, 0, Math.PI / 2, lado * fundo, BALIZA_ALTURA / 2, 0);
    plano(fundo, BALIZA_ALTURA, 0, 0, lado * fundo / 2, BALIZA_ALTURA / 2, -BALIZA_LARGURA / 2);
    plano(fundo, BALIZA_ALTURA, 0, 0, lado * fundo / 2, BALIZA_ALTURA / 2, BALIZA_LARGURA / 2);
    plano(fundo, BALIZA_LARGURA, -Math.PI / 2, 0, lado * fundo / 2, BALIZA_ALTURA, 0).rotation.z = Math.PI / 2;
    rede.position.x = bx;
    g.add(rede);
    redes.push({ rede, tras, lado });
  }
```

1d. No fim, devolver o objeto com a rede que abana (só a dos adversários, onde há golos):

```js
  const redeDeles = redes.find((r) => r.lado === 1);
  let tAbanar = -1;
  return {
    grupo: g,
    abanarRede() { tAbanar = 0; },
    atualizar(dt) {
      if (tAbanar < 0) return;
      tAbanar += dt;
      const a = Math.exp(-3.5 * tAbanar) * 0.35;
      redeDeles.tras.position.x = redeDeles.lado * (1.2 + a * Math.abs(Math.sin(tAbanar * 22)));
      redeDeles.rede.scale.y = 1 + a * 0.15 * Math.sin(tAbanar * 18);
      if (a < 0.002) {
        tAbanar = -1;
        redeDeles.tras.position.x = redeDeles.lado * 1.2;
        redeDeles.rede.scale.y = 1;
      }
    },
  };
```

Atualizar o comentário do topo: "Campo de futebol de 7 em 3D: relva com riscas e grão, linhas, áreas e balizas com rede que abana no golo."

- [ ] **Step 2: Criar `jogo/bola.js`**

```js
// Bola com gomos, a rodar conforme anda, com arco (altura) e sombra no chão.
import * as THREE from 'three';

export const RAIO_BOLA = 0.11;

function texturaGomos() {
  const tela = document.createElement('canvas');
  tela.width = 256;
  tela.height = 128;
  const ctx = tela.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = '#111111';
  for (let fila = 0; fila < 3; fila++) {
    for (let col = 0; col < 6; col++) {
      const x = col * 43 + (fila % 2) * 21 + 10;
      const y = 22 + fila * 42;
      ctx.beginPath();
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
        ctx.lineTo(x + Math.cos(a) * 11, y + Math.sin(a) * 11);
      }
      ctx.fill();
    }
  }
  const t = new THREE.CanvasTexture(tela);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function criarBola(cena) {
  const malha = new THREE.Mesh(
    new THREE.SphereGeometry(RAIO_BOLA, 24, 16),
    new THREE.MeshStandardMaterial({ map: texturaGomos(), roughness: 0.45 }),
  );
  const sombra = new THREE.Mesh(
    new THREE.CircleGeometry(RAIO_BOLA * 1.3, 20),
    new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.35, depthWrite: false }),
  );
  sombra.rotation.x = -Math.PI / 2;
  cena.add(malha, sombra);

  const anterior = new THREE.Vector3();
  const eixo = new THREE.Vector3();
  const giro = new THREE.Quaternion();
  let primeiro = true;

  return {
    malha,
    colocar(wx, wz, altura = 0) {
      if (!primeiro) {
        const dx = wx - anterior.x;
        const dz = wz - anterior.z;
        const d = Math.hypot(dx, dz);
        // Rolar: roda à volta do eixo horizontal perpendicular ao movimento (cima × direção).
        if (d > 1e-5) {
          eixo.set(dz / d, 0, -dx / d);
          giro.setFromAxisAngle(eixo, d / RAIO_BOLA);
          malha.quaternion.premultiply(giro);
        }
      }
      primeiro = false;
      anterior.set(wx, 0, wz);
      malha.position.set(wx, RAIO_BOLA + altura, wz);
      sombra.position.set(wx, 0.012, wz);
      const s = 1 / (1 + altura * 0.6);
      sombra.scale.setScalar(s);
      sombra.material.opacity = 0.35 * s;
    },
    reiniciar() {
      primeiro = true;
    },
  };
}
```

- [ ] **Step 3: Verificação rápida**

`npm test` continua verde (estes módulos não têm testes Node; `campo.js` só é importado pelo motor). O motor ainda usa `construirCampo(CAMPO)` como grupo: **não** abrir o jogo até à Tarefa 9 (o campo partido é esperado entre a Tarefa 6 e a 9). Verificar só sintaxe:

Run: `node --check jogo/campo.js && node --check jogo/bola.js`
Expected: sem saída.

- [ ] **Step 4: Commit**

```bash
git add jogo/campo.js jogo/bola.js
git commit -m "Add grass texture, textured nets that shake, and a rolling ball with arc and shadow

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Bancadas e estádio

**Files:**
- Create: `jogo/bancadas.js`, `jogo/estadio.js`
- Test: `tests/bancadas.test.js`

**Interfaces:**
- Produces:
  - `bancadas.js`: `AFASTAMENTO`, `PROFUNDIDADE_FILA`, `SUBIDA_FILA`, `ALTURA_BASE`, `EXTENSAO`, `ESPACO_LUGAR`, `BANCADAS`, `geometriaBancada(bancada, campo) → { inicio, fim, base }`, `gerarLugares(campo, { fracao = 0.92, aleatorio = Math.random } = {}) → [{ x, y, z, rotY, cor: 0|1, fase }]` em coordenadas do jogo (x, z) com `y` em metros.
  - `estadio.js`: `construirEstadio(cena, campo) → { sol, definirSombras(ligadas) }`

- [ ] **Step 1: Testes**

Criar `tests/bancadas.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gerarLugares, AFASTAMENTO, ALTURA_BASE, BANCADAS } from '../jogo/bancadas.js';
import { CAMPO } from '../jogo/cenarios.js';

function lcg(semente) {
  let s = semente;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

test('milhares de lugares com tudo cheio', () => {
  const n = gerarLugares(CAMPO, { fracao: 1, aleatorio: () => 0.5 }).length;
  assert.ok(n > 3500 && n < 4600, `lugares: ${n}`);
});

test('fracao 0,5 deixa cerca de metade', () => {
  const todos = gerarLugares(CAMPO, { fracao: 1, aleatorio: lcg(1) }).length;
  const metade = gerarLugares(CAMPO, { fracao: 0.5, aleatorio: lcg(1) }).length;
  assert.ok(metade > todos * 0.4 && metade < todos * 0.6, `${metade} de ${todos}`);
});

test('ninguem dentro do campo nem antes do afastamento, todos acima do muro', () => {
  for (const l of gerarLugares(CAMPO, { fracao: 1, aleatorio: lcg(2) })) {
    const dentroX = l.x > -AFASTAMENTO + 0.01 && l.x < CAMPO.comprimento + AFASTAMENTO - 0.01;
    const dentroZ = l.z > -AFASTAMENTO + 0.01 && l.z < CAMPO.largura + AFASTAMENTO - 0.01;
    assert.ok(!(dentroX && dentroZ), `lugar em (${l.x.toFixed(1)}, ${l.z.toFixed(1)})`);
    assert.ok(l.y > ALTURA_BASE);
    assert.ok(l.cor === 0 || l.cor === 1);
    assert.ok(l.fase >= 0 && l.fase < 1);
  }
});

test('todos olham para o campo', () => {
  const cx = CAMPO.comprimento / 2;
  const cz = CAMPO.largura / 2;
  for (const l of gerarLugares(CAMPO, { fracao: 1, aleatorio: lcg(3) })) {
    const frente = [Math.sin(l.rotY), Math.cos(l.rotY)];
    assert.ok(frente[0] * (cx - l.x) + frente[1] * (cz - l.z) > 0, `lugar em (${l.x.toFixed(1)}, ${l.z.toFixed(1)}) de costas`);
  }
});

test('ha uma bancada principal com cobertura', () => {
  assert.equal(BANCADAS.filter((b) => b.cobertura).length, 1);
});
```

- [ ] **Step 2: Correr e ver falhar**

Run: `npm test`
Expected: FAIL, módulo em falta.

- [ ] **Step 3: Implementar `jogo/bancadas.js`**

```js
// Bancadas à volta do campo: geometria e lugares dos adeptos. Puro, em coordenadas do jogo (x, z) e metros.

export const AFASTAMENTO = 6;
export const PROFUNDIDADE_FILA = 0.8;
export const SUBIDA_FILA = 0.45;
export const ALTURA_BASE = 1.2;
export const EXTENSAO = 6;
export const ESPACO_LUGAR = 0.6;

// eixo: ao longo de que coordenada corre a bancada; lado: -1 antes do campo, +1 depois.
export const BANCADAS = [
  { id: 'esquerda', eixo: 'x', lado: -1, filas: 12 },
  { id: 'principal', eixo: 'x', lado: 1, filas: 16, cobertura: true },
  { id: 'fundo-nosso', eixo: 'z', lado: -1, filas: 9 },
  { id: 'fundo-deles', eixo: 'z', lado: 1, filas: 9 },
];

export function geometriaBancada(b, campo) {
  const comprimento = b.eixo === 'x' ? campo.comprimento : campo.largura;
  const outro = b.eixo === 'x' ? campo.largura : campo.comprimento;
  const ext = b.eixo === 'x' ? EXTENSAO : 0;
  return {
    inicio: -ext,
    fim: comprimento + ext,
    base: b.lado < 0 ? -AFASTAMENTO : outro + AFASTAMENTO,
  };
}

// Rumo (rotação em y) para olhar para o campo; a frente de um adepto é +z local.
function rumo(b) {
  if (b.eixo === 'x') return b.lado < 0 ? 0 : Math.PI;
  return b.lado < 0 ? Math.PI / 2 : -Math.PI / 2;
}

export function gerarLugares(campo, { fracao = 0.92, aleatorio = Math.random } = {}) {
  const lugares = [];
  for (const b of BANCADAS) {
    const g = geometriaBancada(b, campo);
    const rotY = rumo(b);
    for (let fila = 0; fila < b.filas; fila++) {
      const fixo = g.base + b.lado * (fila + 0.5) * PROFUNDIDADE_FILA;
      const y = ALTURA_BASE + (fila + 1) * SUBIDA_FILA;
      const n = Math.floor((g.fim - g.inicio) / ESPACO_LUGAR);
      for (let k = 0; k < n; k++) {
        if (aleatorio() > fracao) continue;
        const s = g.inicio + (k + 0.5) * ESPACO_LUGAR + (aleatorio() - 0.5) * 0.15;
        lugares.push({
          x: b.eixo === 'x' ? s : fixo,
          z: b.eixo === 'x' ? fixo : s,
          y,
          rotY,
          cor: aleatorio() < 0.6 ? 0 : 1,
          fase: Math.min(0.999999, aleatorio()),
        });
      }
    }
  }
  return lugares;
}
```

- [ ] **Step 4: Correr e ver passar**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Implementar `jogo/estadio.js`**

```js
// Estádio de fim de tarde: céu, luz baixa com sombras, bancadas em degraus, cobertura, publicidade e torres.
import * as THREE from 'three';
import { BANCADAS, PROFUNDIDADE_FILA, SUBIDA_FILA, ALTURA_BASE, geometriaBancada } from './bancadas.js';

const TEXTOS_PUBLICIDADE = ['BÚSSOLA DO AVANÇADO', 'VAMOS VITÓRIA!'];

function ceu(cena) {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      cimo: { value: new THREE.Color('#3E6FB8') },
      horizonte: { value: new THREE.Color('#F4B57C') },
      baixo: { value: new THREE.Color('#C98A5E') },
    },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 cimo; uniform vec3 horizonte; uniform vec3 baixo; varying vec3 vP;
      void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(horizonte, cimo, pow(h, 0.55)) : mix(horizonte, baixo, min(1.0, -h * 4.0));
      gl_FragColor = vec4(c, 1.0); }`,
  });
  cena.add(new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), material));

  // Nuvens: manchas suaves desenhadas em canvas.
  const tela = document.createElement('canvas');
  tela.width = 256;
  tela.height = 128;
  const ctx = tela.getContext('2d');
  for (let i = 0; i < 14; i++) {
    const x = 40 + Math.random() * 176;
    const y = 50 + Math.random() * 40;
    const r = 18 + Math.random() * 26;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,240,225,0.85)');
    g.addColorStop(1, 'rgba(255,240,225,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 128);
  }
  const tex = new THREE.CanvasTexture(tela);
  tex.colorSpace = THREE.SRGBColorSpace;
  for (let i = 0; i < 9; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
    const a = (i / 9) * Math.PI * 2 + Math.random() * 0.4;
    s.position.set(Math.cos(a) * 220, 55 + Math.random() * 45, Math.sin(a) * 220);
    s.scale.set(90, 40, 1);
    cena.add(s);
  }
}

function texturaPublicidade() {
  const tela = document.createElement('canvas');
  tela.width = 2048;
  tela.height = 64;
  const ctx = tela.getContext('2d');
  const n = 6;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 ? '#E2932E' : '#1B5C3E';
    ctx.fillRect((i * 2048) / n, 0, 2048 / n + 1, 64);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 38px Oswald, "Arial Narrow", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(TEXTOS_PUBLICIDADE[i % 2], ((i + 0.5) * 2048) / n, 34);
  }
  const t = new THREE.CanvasTexture(tela);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

export function construirEstadio(cena, campo) {
  const C = campo.comprimento;
  const L = campo.largura;
  const mundo = (x, z) => [x - C / 2, z - L / 2];

  cena.background = new THREE.Color('#F4B57C');
  cena.fog = new THREE.Fog('#E9B48A', 110, 280);
  ceu(cena);

  cena.add(new THREE.HemisphereLight('#CFE3FF', '#4A6B3A', 0.9));
  const sol = new THREE.DirectionalLight('#FFD2A0', 2.4);
  sol.position.set(-60, 30, -35);
  sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024);
  Object.assign(sol.shadow.camera, { left: -40, right: 40, top: 30, bottom: -30, near: 1, far: 160 });
  sol.shadow.bias = -0.0004;
  sol.shadow.normalBias = 0.02;
  cena.add(sol, sol.target);

  // Chão do estádio à volta do relvado.
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(220, 200), new THREE.MeshLambertMaterial({ color: '#3B4A3A' }));
  chao.rotation.x = -Math.PI / 2;
  chao.position.y = -0.05;
  cena.add(chao);

  // Bancadas em degraus: cada fila é um bloco do chão até ao seu degrau.
  const betao = new THREE.MeshLambertMaterial({ color: '#8C969A' });
  const cadeirasVerdes = new THREE.MeshLambertMaterial({ color: '#1B5C3E' });
  const cadeirasBrancas = new THREE.MeshLambertMaterial({ color: '#E8ECEA' });
  for (const b of BANCADAS) {
    const g = geometriaBancada(b, campo);
    const comprimento = g.fim - g.inicio;
    const meio = (g.inicio + g.fim) / 2;
    for (let fila = 0; fila < b.filas; fila++) {
      const altura = ALTURA_BASE + (fila + 1) * SUBIDA_FILA;
      const fixo = g.base + b.lado * (fila + 0.5) * PROFUNDIDADE_FILA;
      const material = fila === 0 ? betao : fila % 2 ? cadeirasVerdes : cadeirasBrancas;
      const caixa = b.eixo === 'x'
        ? new THREE.BoxGeometry(comprimento, altura, PROFUNDIDADE_FILA)
        : new THREE.BoxGeometry(PROFUNDIDADE_FILA, altura, comprimento);
      const m = new THREE.Mesh(caixa, material);
      const [wx, wz] = b.eixo === 'x' ? mundo(meio, fixo) : mundo(fixo, meio);
      m.position.set(wx, altura / 2, wz);
      cena.add(m);
    }
    if (b.cobertura) {
      const topo = ALTURA_BASE + (b.filas + 1) * SUBIDA_FILA;
      const fundo = b.filas * PROFUNDIDADE_FILA + 3;
      const telhado = new THREE.Mesh(
        new THREE.BoxGeometry(comprimento + 2, 0.3, fundo),
        new THREE.MeshLambertMaterial({ color: '#D9DDE0' }),
      );
      const [wx, wz] = mundo(meio, g.base + b.lado * (fundo / 2 - 1.5));
      telhado.position.set(wx, topo + 4.5, wz);
      telhado.rotation.x = b.lado * 0.08;
      cena.add(telhado);
      const pilar = new THREE.MeshLambertMaterial({ color: '#6E777B' });
      for (let k = 0; k <= 6; k++) {
        const [px, pz] = mundo(g.inicio + (k / 6) * comprimento, g.base + b.lado * (b.filas * PROFUNDIDADE_FILA + 0.5));
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, topo + 4.5, 8), pilar);
        p.position.set(px, (topo + 4.5) / 2, pz);
        cena.add(p);
      }
    }
  }

  // Placas de publicidade a 3 m das linhas, viradas para o campo.
  const tex = texturaPublicidade();
  const placa = (comprimento, x, z, rotY) => {
    const t = tex.clone();
    t.needsUpdate = true;
    t.repeat.set(comprimento / 40, 1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(comprimento, 0.9), new THREE.MeshBasicMaterial({ map: t }));
    const [wx, wz] = mundo(x, z);
    m.position.set(wx, 0.45, wz);
    m.rotation.y = rotY;
    cena.add(m);
  };
  placa(C + 6, C / 2, -3, 0);
  placa(C + 6, C / 2, L + 3, Math.PI);
  placa(L + 6, -3, L / 2, Math.PI / 2);
  placa(L + 6, C + 3, L / 2, -Math.PI / 2);

  // Torres de iluminação nos cantos, com o painel virado para o centro.
  const metal = new THREE.MeshLambertMaterial({ color: '#7A8287' });
  const luz = new THREE.MeshBasicMaterial({ color: '#FFF6D8' });
  for (const [x, z] of [[-16, -16], [C + 16, -16], [-16, L + 16], [C + 16, L + 16]]) {
    const [wx, wz] = mundo(x, z);
    const torre = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 28, 8), metal);
    torre.position.set(wx, 14, wz);
    const painel = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 0.4), luz);
    painel.position.set(wx, 28.5, wz);
    painel.lookAt(0, 0, 0);
    cena.add(torre, painel);
  }

  return {
    sol,
    definirSombras(ligadas) {
      sol.castShadow = ligadas;
    },
  };
}
```

- [ ] **Step 6: Commit**

```bash
git add jogo/bancadas.js jogo/estadio.js tests/bancadas.test.js
git commit -m "Add sunset stadium: sky, low sun with shadows, stands, roof, boards, light towers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Torcida e medidor de fps

**Files:**
- Create: `jogo/torcida.js`, `jogo/qualidade.js`
- Test: `tests/qualidade.test.js`

**Interfaces:**
- Consumes: `gerarLugares` (Tarefa 7), `intensidadeReacao` (Tarefa 2).
- Produces:
  - `qualidade.js`: `FPS_MINIMO = 45`, `SEGUNDOS_ABAIXO = 2`, `criarMedidorFps({ minimo, segundos } = {}) → { registar(dt): bool (true uma só vez, quando deve baixar a qualidade), disparado }`
  - `torcida.js`: `criarTorcida(cena, lugares, campo) → { reagir(tipo), atualizar(dt), definirQualidade('alta'|'baixa') }`

- [ ] **Step 1: Testes do medidor**

Criar `tests/qualidade.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarMedidorFps } from '../jogo/qualidade.js';

function correr(m, dts, segundos) {
  let disparos = 0;
  let t = 0;
  let i = 0;
  let quando = null;
  while (t < segundos) {
    const dt = dts[i++ % dts.length];
    t += dt;
    if (m.registar(dt)) { disparos++; quando = t; }
  }
  return { disparos, quando };
}

test('60 fps nunca baixa a qualidade', () => {
  assert.equal(correr(criarMedidorFps(), [1 / 60], 10).disparos, 0);
});

test('30 fps baixa uma vez ao fim de cerca de 2 s', () => {
  const r = correr(criarMedidorFps(), [1 / 30], 10);
  assert.equal(r.disparos, 1);
  assert.ok(r.quando >= 1.9 && r.quando <= 2.3, `disparou em ${r.quando}`);
});

test('um solavanco por segundo nao baixa', () => {
  const dts = [...Array(59).fill(1 / 60), 0.05];
  assert.equal(correr(criarMedidorFps(), dts, 10).disparos, 0);
});

test('ignora dt zero (pausa)', () => {
  const m = criarMedidorFps();
  assert.equal(m.registar(0), false);
  assert.equal(m.disparado, false);
});
```

- [ ] **Step 2: Correr e ver falhar**

Run: `npm test`
Expected: FAIL, módulo em falta.

- [ ] **Step 3: Implementar `jogo/qualidade.js`**

```js
// Medidor de fps: avisa uma vez se a média ficar abaixo do mínimo durante uns segundos seguidos.

export const FPS_MINIMO = 45;
export const SEGUNDOS_ABAIXO = 2;
const SUAVIZAR = 0.1;

export function criarMedidorFps({ minimo = FPS_MINIMO, segundos = SEGUNDOS_ABAIXO } = {}) {
  let media = null;
  let abaixo = 0;
  let disparado = false;
  return {
    registar(dt) {
      if (disparado || !(dt > 0)) return false;
      media = media === null ? dt : media + (dt - media) * SUAVIZAR;
      abaixo = 1 / media < minimo ? abaixo + dt : 0;
      if (abaixo >= segundos - 1e-9) {
        disparado = true;
        return true;
      }
      return false;
    },
    get disparado() {
      return disparado;
    },
  };
}
```

- [ ] **Step 4: Correr e ver passar**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Implementar `jogo/torcida.js`**

```js
// Torcida: milhares de adeptos verde e brancos numa só malha em instâncias, animados na placa gráfica.
// Balançam sempre; saltam no golo; mãos na cabeça no falhanço; aplaudem nas boas decisões.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { intensidadeReacao } from './momentos.js';

const VERDE = '#1B5C3E';
const BRANCO = '#F2F2F2';
const PELE = '#E2B596';
const N_BANDEIRAS = 14;

function comParte(geo, parte) {
  geo.setAttribute('parte', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count).fill(parte), 1));
  return geo;
}

function geometriaAdepto() {
  return mergeGeometries([
    comParte(new THREE.BoxGeometry(0.44, 0.62, 0.28).translate(0, 0.45, 0), 0),
    comParte(new THREE.SphereGeometry(0.12, 8, 6).translate(0, 0.9, 0), 1),
    comParte(new THREE.BoxGeometry(0.1, 0.46, 0.1).translate(-0.27, 0.52, 0), 2),
    comParte(new THREE.BoxGeometry(0.1, 0.46, 0.1).translate(0.27, 0.52, 0), 2),
    comParte(new THREE.BoxGeometry(0.46, 0.08, 0.3).translate(0, 0.74, 0), 3),
  ]);
}

function baralhar(lista) {
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return lista;
}

export function criarTorcida(cena, lugaresOriginais, campo) {
  // Baralhados: na qualidade baixa desenha-se só a primeira metade, espalhada por todas as bancadas.
  const lugares = baralhar([...lugaresOriginais]);
  const n = lugares.length;
  const geo = geometriaAdepto();
  const cor = new Float32Array(n * 3);
  const fase = new Float32Array(n);
  const cachecol = new Float32Array(n);
  const verde = new THREE.Color(VERDE);
  const branco = new THREE.Color(BRANCO);
  lugares.forEach((l, i) => {
    (l.cor === 0 ? verde : branco).toArray(cor, i * 3);
    fase[i] = l.fase;
    cachecol[i] = l.cor === 0 ? 1 : 0;
  });
  geo.setAttribute('aCor', new THREE.InstancedBufferAttribute(cor, 3));
  geo.setAttribute('aFase', new THREE.InstancedBufferAttribute(fase, 1));
  geo.setAttribute('aCachecol', new THREE.InstancedBufferAttribute(cachecol, 1));

  const u = {
    uTempo: { value: 0 }, uSalto: { value: 0 }, uMaos: { value: 0 }, uAplauso: { value: 0 },
    uPele: { value: new THREE.Color(PELE) }, uVerde: { value: verde }, uBranco: { value: branco },
  };
  const material = new THREE.MeshLambertMaterial({ color: '#FFFFFF' });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float parte; attribute vec3 aCor; attribute float aFase; attribute float aCachecol;
        uniform float uTempo, uSalto, uMaos, uAplauso; uniform vec3 uPele, uVerde, uBranco;
        varying vec3 vCor;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float fase = aFase * 6.2832;
        float balanco = sin(uTempo * 2.0 + fase) * 0.03;
        float pulo = abs(sin(uTempo * 8.0 + fase));
        float salto = uSalto * pulo * 0.4;
        if (parte > 1.5 && parte < 2.5) {
          float lado = sign(position.x);
          float ang = max(uMaos * 2.7, uSalto * (1.6 + 1.2 * pulo));
          ang = max(ang, uAplauso * (1.3 + 0.25 * sin(uTempo * 14.0 + fase)));
          vec2 ombro = vec2(lado * 0.27, 0.75);
          vec2 p = transformed.xy - ombro;
          float a = ang * lado;
          transformed.xy = vec2(p.x * cos(a) - p.y * sin(a), p.x * sin(a) + p.y * cos(a)) + ombro;
        }
        transformed.y += balanco + salto;
        vCor = parte < 0.5 ? aCor : parte < 1.5 ? uPele : parte < 2.5 ? aCor : (aCachecol > 0.5 ? uBranco : uVerde);`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vCor;')
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( diffuse * vCor, opacity );');
  };

  const malha = new THREE.InstancedMesh(geo, material, n);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const eixoY = new THREE.Vector3(0, 1, 0);
  const um = new THREE.Vector3(1, 1, 1);
  const pos = new THREE.Vector3();
  lugares.forEach((l, i) => {
    pos.set(l.x - campo.comprimento / 2, l.y, l.z - campo.largura / 2);
    q.setFromAxisAngle(eixoY, l.rotY);
    malha.setMatrixAt(i, m.compose(pos, q, um));
  });
  malha.frustumCulled = false;
  cena.add(malha);

  // Bandeiras às riscas verde e brancas, a ondular, em alguns lugares das primeiras filas.
  const telaBandeira = document.createElement('canvas');
  telaBandeira.width = 64;
  telaBandeira.height = 32;
  const cb = telaBandeira.getContext('2d');
  for (let i = 0; i < 4; i++) {
    cb.fillStyle = i % 2 ? BRANCO : VERDE;
    cb.fillRect(i * 16, 0, 16, 32);
  }
  const texBandeira = new THREE.CanvasTexture(telaBandeira);
  texBandeira.colorSpace = THREE.SRGBColorSpace;
  const matBandeira = new THREE.MeshLambertMaterial({ map: texBandeira, side: THREE.DoubleSide });
  matBandeira.onBeforeCompile = (shader) => {
    shader.uniforms.uTempo = u.uTempo;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTempo;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.z += sin(position.x * 4.0 + uTempo * 6.0) * 0.08 * (position.x + 0.7);');
  };
  const geoBandeira = new THREE.PlaneGeometry(1.4, 0.9, 10, 1).translate(0.7, 0, 0);
  const baixos = lugares.filter((l) => l.y < 2.6);
  for (let i = 0; i < N_BANDEIRAS && baixos.length; i++) {
    const l = baixos[Math.floor(Math.random() * baixos.length)];
    const b = new THREE.Mesh(geoBandeira, matBandeira);
    b.position.set(l.x - campo.comprimento / 2, l.y + 1.6, l.z - campo.largura / 2);
    b.rotation.y = l.rotY + Math.PI / 2;
    cena.add(b);
  }

  let tempo = 0;
  let reacao = null;
  return {
    reagir(tipo) {
      reacao = { tipo, inicio: tempo };
    },
    atualizar(dt) {
      tempo += dt;
      u.uTempo.value = tempo;
      const k = reacao ? intensidadeReacao(reacao.tipo, tempo - reacao.inicio) : 0;
      u.uSalto.value = reacao?.tipo === 'golo' ? k : 0;
      u.uMaos.value = reacao?.tipo === 'falhanco' ? k : 0;
      u.uAplauso.value = reacao?.tipo === 'aplauso' ? k : 0;
    },
    definirQualidade(nivel) {
      malha.count = nivel === 'baixa' ? Math.floor(n / 2) : n;
    },
  };
}
```

- [ ] **Step 6: Commit**

```bash
git add jogo/torcida.js jogo/qualidade.js tests/qualidade.test.js
git commit -m "Add instanced crowd with GPU animation and reactions, and an fps meter

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Motor com estádio, jogadores, momentos e qualidade

**Files:**
- Modify: `jogo/adversarios.js` (acrescentar `redirecionar`)
- Modify: `jogo/motor.js` (reescrita das partes indicadas)
- Test: `tests/adversarios.test.js`

**Interfaces:**
- Consumes: tudo das Tarefas 1 a 8.
- Produces:
  - `criarReacao(...)` ganha `redirecionar(id, ponto, inicio)`: põe o agente `id` a ir para `ponto`; se ainda não reagia, cria-o em `inicio`.
  - `criarMotor(canvas, { modelo = null, som = null, giroscopio = null } = {})`; `continuar(opcaoId, { aoTerminar, aoGolo })`. `jogar` e `parar` como antes.

- [ ] **Step 1: Testes de `redirecionar`**

Acrescentar a `tests/adversarios.test.js`:

```js
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
```

- [ ] **Step 2: Correr e ver falhar**

Run: `npm test`
Expected: FAIL, `r.redirecionar is not a function`.

- [ ] **Step 3: Implementar em `jogo/adversarios.js`**

Extrair a criação do agente para uma função e acrescentar `redirecionar`:

```js
export function criarReacao(comportamentos, posicoesIniciais) {
  const gestor = new EntityManager();
  const agentes = new Map();

  function novoAgente(id, inicio, tipo) {
    const p = PARAMETROS[tipo];
    const v = new Vehicle();
    v.maxSpeed = VELOCIDADE_MAX;
    v.maxForce = 40;
    v.position.set(inicio[0], 0, inicio[1]);
    const alvo = new Vector3();
    const chegada = new ArriveBehavior(alvo, p.desaceleracao, p.tolerancia);
    chegada.weight = PESO_CHEGADA;
    v.steering.add(chegada);
    gestor.add(v);
    const a = { v, alvo, tipo, chegada };
    agentes.set(id, a);
    return a;
  }

  for (const [id, c] of Object.entries(comportamentos)) {
    const inicio = posicoesIniciais[id];
    if (!inicio || !PARAMETROS[c.tipo]) continue;
    const a = novoAgente(id, inicio, c.tipo);
    if (c.tipo === 'fechar') a.alvo.set(c.ponto[0], 0, c.ponto[1]);
  }
  return {
    ids: () => [...agentes.keys()],
    atualizar(dt, { arthur, bola }) { /* igual ao atual */ },
    posicao(id) { /* igual ao atual */ },
    // Quem rouba a bola foge com ela: passa a "fechar" para o ponto de fuga.
    redirecionar(id, ponto, inicio) {
      let a = agentes.get(id);
      if (!a) {
        if (!inicio) return;
        a = novoAgente(id, inicio, 'fechar');
      }
      // Passa a chegar como quem fecha (trava no ponto), não como quem persegue (para a 0,8 m).
      a.tipo = 'fechar';
      a.chegada.deceleration = PARAMETROS.fechar.desaceleracao;
      a.chegada.tolerance = PARAMETROS.fechar.tolerancia;
      a.alvo.set(ponto[0], 0, ponto[1]);
    },
  };
}
```

(`atualizar` e `posicao` ficam exatamente como estão; `atualizar` usa `agentes.values()` e continua a funcionar com o campo extra `chegada`.)

- [ ] **Step 4: Reescrever `jogo/motor.js`**

Substituir o ficheiro pelo código abaixo. As partes `ajustarTamanho`, `moverArthur`, `gravar`, `afastarDeArthur` e a câmara lenta do lance mantêm a lógica atual.

```js
// Motor 3D do jogo: estádio, torcida, jogadores, bola, câmara na 1ª pessoa, relógio, câmara lenta,
// momentos (gestos, golo, perda), qualidade automática e gravação para a repetição.
import * as THREE from 'three';
import { CAMPO } from './cenarios.js';
import { construirCampo } from './campo.js';
import { construirEstadio } from './estadio.js';
import { gerarLugares } from './bancadas.js';
import { criarTorcida } from './torcida.js';
import { criarBola, RAIO_BOLA } from './bola.js';
import { criarBoneco } from './boneco.js';
import { criarJogador3d } from './jogador3d.js';
import { CONTACTO } from './animacao.js';
import { criarOlhar } from './olhar.js';
import { agendarGestos, dispararAte, pontoDeFuga, reacoesDoEvento, reacoesDoFim } from './momentos.js';
import { criarMedidorFps } from './qualidade.js';
import { alturaEm, alvoCamara, pitchParaBola, posicaoEm, trajetoriasDaVariante, yawParaPonto } from './regras.js';
import { criarReacao } from './adversarios.js';

const ALTURA_OLHOS = 1.4;
const ABRANDAR = 0.6;
const ESCALA_MIN = 0.08;
const PASSO_GRAVACAO = 0.1;
const BALANCO = 0.04;
const DT_MAX = 0.05;
const DIST_MIN_ARTHUR = 1.3;
const TEMPO_FESTEJO = 2.2;
const ALVO_FESTEJO = [64, 17.5]; // a bancada atrás da baliza adversária
const PITCH_FESTEJO = 0.12;
const DIST_BOLA_LADRAO = 0.7;
const VEL_TREMOR = 5;
const TREMOR = 0.012;

const CORES = {
  nos: { camisola: ['#1B5C3E', '#FFFFFF'], calcoes: '#FFFFFF', meias: '#1B5C3E' },
  eles: { camisola: ['#C2493B'], calcoes: '#3A1410', meias: '#C2493B' },
  grNos: { camisola: ['#E2932E'], calcoes: '#1A1A1A', meias: '#E2932E' },
  grEles: { camisola: ['#6A4FB5'], calcoes: '#1A1A1A', meias: '#6A4FB5' },
};
const NUMEROS = {
  'n-gr': 1, 'n-de': 2, 'n-dc': 4, 'n-dd': 3, 'n-mc': 8, 'n-ad': 9,
  'e-gr': 1, 'e-lat': 2, 'e-cen': 4, 'e-lat2': 3, 'e-med': 6, 'e-av1': 9, 'e-av2': 11,
};

const paraMundo = (x, z) => [x - CAMPO.comprimento / 2, z - CAMPO.largura / 2];
const normalizar = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const ordenar = (eventos) => [...(eventos || [])].sort((a, b) => a.t - b.t);

export function criarMotor(canvas, { modelo = null, som = null, giroscopio = null } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch {
    throw new Error('sem-webgl');
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const cena = new THREE.Scene();
  const estadio = construirEstadio(cena, CAMPO);
  const campo = construirCampo(CAMPO);
  cena.add(campo.grupo);
  const torcida = criarTorcida(cena, gerarLugares(CAMPO), CAMPO);
  const bola = criarBola(cena);

  const camara = new THREE.PerspectiveCamera(65, 1, 0.05, 400);
  camara.position.set(0, 30, 32);
  camara.lookAt(0, 0, 0);
  camara.rotation.order = 'YXZ';

  const olhar = criarOlhar(canvas, giroscopio);
  const medidor = criarMedidorFps();
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

  function ajustarTamanho() { /* igual ao atual */ }

  function fabricarJogador(id, j) {
    const cores = j.guardaRedes ? (j.equipa === 'nos' ? CORES.grNos : CORES.grEles) : CORES[j.equipa];
    if (modelo) {
      try {
        return criarJogador3d(modelo, { cores, guardaRedes: !!j.guardaRedes, numero: NUMEROS[id] ?? null });
      } catch {
        // Se o modelo falhar a meio, este jogador fica com o boneco simples.
      }
    }
    return criarBoneco(cores);
  }

  function limparBonecos() { /* igual ao atual */ }

  function colocarBola(p, alturaBola) {
    const [wx, wz] = paraMundo(p[0], p[1]);
    bola.colocar(wx, wz, alturaBola);
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
    b.rumo = vel > 0.3 ? Math.atan2(-dz, dx) : yawParaPonto(p, estado.bola);
    b.boneco.grupo.rotation.y = b.rumo - Math.PI / 2;
    b.boneco.animar(vel, dt);
    b.ultima = p;
  }

  function moverArthur(p, dt) { /* igual ao atual */ }
  function gravar(t, fase) { /* igual ao atual */ }

  function aplicar(a) {
    const e = estado;
    if (a.acao === 'gesto') bonecos.get(a.jogador)?.boneco.gesto(a.nome, a.desvio || 0);
    else if (a.acao === 'torcida') torcida.reagir(a.tipo);
    else if (a.acao === 'som') som?.tocar(a.nome);
    else if (a.acao === 'golo') {
      e.golo = true;
      campo.abanarRede();
      e.callbacks.aoGolo?.();
    } else if (a.acao === 'roubar') {
      const p = e.reacao?.posicao(a.jogador) || bonecos.get(a.jogador)?.ultima;
      if (p && e.reacao) {
        e.ladrao = a.jogador;
        e.reacao.redirecionar(a.jogador, pontoDeFuga(p), p);
      }
    }
  }

  // Dispara os gestos agendados e os eventos que o relógio já passou (cada um uma só vez).
  function disparar(t) {
    const e = estado;
    const g = dispararAte(e.agenda, e.iAgenda, t);
    e.iAgenda = g.indice;
    for (const x of g.disparados) aplicar({ acao: 'gesto', jogador: x.jogador, nome: x.nome, desvio: x.desvio });
    const v = dispararAte(e.eventos, e.iEventos, t);
    e.iEventos = v.indice;
    for (const ev of v.disparados) for (const a of reacoesDoEvento(ev, e.eventos, e.cenario.jogadores)) aplicar(a);
  }

  function passoLance(dtReal) {
    const e = estado;
    const c = e.cenario;
    const falta = c.congelaEm - e.t;
    const escala = falta < ABRANDAR ? Math.max(ESCALA_MIN, falta / ABRANDAR) : 1;
    const dt = dtReal * escala;
    e.t = Math.min(c.congelaEm, e.t + dt);
    colocarBola(posicaoEm(c.bola, e.t), alturaEm(c.bola, e.t));
    moverArthur(posicaoEm(e.traj.arthur, e.t), dt);
    for (const id of bonecos.keys()) colocarJogador(id, posicaoEm(e.traj[id], e.t), dt);
    disparar(e.t);
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

  function afastarDeArthur(p) { /* igual ao atual */ }

  function passoConsequencia(dt) {
    const e = estado;
    const k = e.cons;
    const fim = k.duracao + (e.golo ? TEMPO_FESTEJO : 0);
    e.tc = Math.min(fim, e.tc + dt);
    const t = Math.min(e.tc, k.duracao);
    if (!e.ladrao) colocarBola(posicaoEm(k.bola, t), alturaEm(k.bola, t));
    moverArthur(posicaoEm(k.nos.arthur, t), dt);
    e.reacao.atualizar(dt, { arthur: e.arthur, bola: e.bola });
    for (const id of bonecos.keys()) {
      const p = k.nos[id] ? posicaoEm(k.nos[id], t) : e.reacao.posicao(id) || e.congelado[id];
      colocarJogador(id, afastarDeArthur(p), dt);
    }
    // Quem roubou leva a bola à frente dos pés.
    if (e.ladrao) {
      const b = bonecos.get(e.ladrao);
      if (b) colocarBola([b.ultima[0] + Math.cos(b.rumo) * DIST_BOLA_LADRAO, b.ultima[1] - Math.sin(b.rumo) * DIST_BOLA_LADRAO], 0);
    }
    disparar(t);
    if (t >= k.duracao && !e.fimDisparado) {
      e.fimDisparado = true;
      for (const a of reacoesDoFim(k)) aplicar(a);
    }

    // Câmara: no golo vira para a bancada; numa perda segue a bola; senão segue o lance.
    let alvo;
    if (e.golo) alvo = ALVO_FESTEJO;
    else if (e.ladrao) alvo = e.bola;
    else alvo = alvoCamara(k.bola, t, e.arthur);
    if (alvo && Math.hypot(alvo[0] - e.arthur[0], alvo[1] - e.arthur[1]) > 0.5) e.alvoYaw = yawParaPonto(e.arthur, alvo);
    const suave = Math.min(1, dt * (e.golo ? 2.5 : 4));
    e.yawCam += normalizar(e.alvoYaw - e.yawCam) * suave;
    const distBola = Math.hypot(e.bola[0] - e.arthur[0], e.bola[1] - e.arthur[1]);
    const alvoPitch = e.golo ? PITCH_FESTEJO : pitchParaBola(distBola, ALTURA_OLHOS, RAIO_BOLA);
    e.pitch += (alvoPitch - e.pitch) * suave;
    gravar(e.cenario.congelaEm + e.tc, 'consequencia');
    if (e.tc >= fim) {
      e.fase = 'fim';
      if (e.callbacks.aoTerminar) e.callbacks.aoTerminar(e.frames);
    }
  }

  function atualizarCamara() {
    const e = estado;
    const [wx, wz] = paraMundo(e.arthur[0], e.arthur[1]);
    const balanco = Math.sin(e.passo) * BALANCO * Math.min(e.velArthur / 6, 1);
    // Leve tremor no sprint.
    const tremor = e.velArthur > VEL_TREMOR ? TREMOR : 0;
    camara.position.set(wx + (Math.random() - 0.5) * tremor, ALTURA_OLHOS + balanco + (Math.random() - 0.5) * tremor, wz);
    camara.rotation.y = e.yawCam - Math.PI / 2;
    camara.rotation.x = e.pitch;
  }

  function quadro() {
    requestAnimationFrame(quadro);
    ajustarTamanho();
    const dtReal = pausado ? 0 : Math.min(relogio.getDelta(), DT_MAX);
    olhar.atualizar(dtReal);
    torcida.atualizar(dtReal);
    campo.atualizar(dtReal);
    if (estado) {
      const emJogo = estado.fase === 'lance' || estado.fase === 'consequencia';
      if (estado.fase === 'lance') passoLance(dtReal);
      else if (estado.fase === 'consequencia') passoConsequencia(dtReal);
      if (estado) atualizarCamara();
      if (emJogo && medidor.registar(dtReal)) {
        torcida.definirQualidade('baixa');
        estadio.definirSombras(false);
      }
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
        const boneco = fabricarJogador(id, j);
        cena.add(boneco.grupo);
        bonecos.set(id, { boneco, ultima: posicaoEm(traj[id], 0), rumo: 0 });
      }
      const base = (cenario.direcaoBase * Math.PI) / 180;
      olhar.reiniciar();
      olhar.ativo = true;
      bola.reiniciar();
      const eventos = ordenar(cenario.eventos);
      estado = {
        fase: 'lance', cenario, variante: cenario.variantes[varianteId], traj, callbacks,
        t: 0, tc: 0, base, yawCam: base, pitch: 0,
        arthur: posicaoEm(traj.arthur, 0), velArthur: 0, passo: 0,
        bola: posicaoEm(cenario.bola, 0), frames: [], proximaGravacao: 0,
        cons: null, reacao: null, congelado: null, alvoYaw: base,
        eventos, iEventos: 0, agenda: agendarGestos(eventos, CONTACTO), iAgenda: 0,
        golo: false, ladrao: null, fimDisparado: false,
      };
      som?.iniciarAmbiente();
      som?.tocar('apito');
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
      e.alvoYaw = e.yawCam;
      e.eventos = ordenar(e.cons.eventos);
      e.iEventos = 0;
      e.agenda = agendarGestos(e.eventos, CONTACTO);
      e.iAgenda = 0;
      e.golo = false;
      e.ladrao = null;
      e.fimDisparado = false;
      e.fase = 'consequencia';
      relogio.getDelta();
    },
    parar() {
      estado = null;
      olhar.ativo = false;
      som?.pararAmbiente();
      limparBonecos();
    },
  };
}
```

Onde está `/* igual ao atual */`, copiar o corpo da função tal como está hoje em `jogo/motor.js` (ver o ficheiro antes de o substituir). **Não** deixar esses comentários no código final.

- [ ] **Step 5: Correr os testes**

Run: `npm test`
Expected: PASS (todos).

- [ ] **Step 6: Verificação no browser**

Com o servidor a correr, abrir `http://127.0.0.1:8765/jogo.html?cenario=receber-costas&variante=espaco`. O `fluxo.js` ainda chama `criarMotor(canvas)` sem modelo: deve aparecer o estádio, a torcida e os **bonecos simples**, e o lance corre. Escolher "Rodo e ataco a baliza". Expected:
- a bola sobe no remate e entra até ao fundo da rede, que abana;
- a câmara vira para a bancada atrás da baliza e a torcida salta;
- cerca de 2 s depois aparece o resultado;
- consola sem erros.

Depois `?cenario=costas-lateral&variante=pressao`, opção "Fico parado na linha". Expected: o lateral fica com a bola e foge com ela para a nossa baliza; a câmara segue a bola; a torcida põe as mãos na cabeça.

Por fim, "Jogar outra vez" logo a seguir a um golo: o lance recomeça limpo, sem festejos pendurados.

- [ ] **Step 7: Commit**

```bash
git add jogo/adversarios.js jogo/motor.js tests/adversarios.test.js
git commit -m "Wire stadium, crowd, ball, players and game moments into the engine

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Carregamento, definições, botão de som e "GOLO!"

**Files:**
- Modify: `jogo.html`, `jogo/fluxo.js`

**Interfaces:**
- Consumes: `carregarModelo` (Tarefa 3), `criarGiroscopio` (Tarefa 4), `criarSom` (Tarefa 5), `criarPreferencias`, `CHAVE_SOM`, `CHAVE_GIROSCOPIO` (Tarefa 1), `criarMotor(canvas, { modelo, som, giroscopio })` e `continuar(..., { aoGolo })` (Tarefa 9).

- [ ] **Step 1: HTML**

1a. Menu: substituir `<li class="carregar">A carregar o jogo...</li>` por:

```html
      <li class="carregar" id="carregar">
        <span id="carregarTexto">A preparar o estádio... 0%</span>
        <span class="barra" role="progressbar" aria-label="A carregar o jogo" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="barraCarregar"><span id="barraEnchimento"></span></span>
      </li>
```

1b. Logo a seguir a `</ul>` do menu:

```html
    <div class="definicoes" id="definicoes" hidden>
      <label class="interruptor"><input type="checkbox" id="optSom"><span>Som do estádio</span></label>
      <label class="interruptor" id="linhaGiro" hidden><input type="checkbox" id="optGiro"><span>Olhar com o telemóvel</span></label>
      <button type="button" class="btn-fantasma" id="btnAtivarMovimento" hidden>Ativar movimento</button>
      <p class="nota" id="notaGiro" hidden></p>
      <a class="creditos" href="jogo/sons/LICENCAS.txt" target="_blank" rel="noopener">Créditos dos sons</a>
    </div>
```

1c. No `#hud`, a seguir ao botão Sair:

```html
  <button type="button" class="hud-som" id="btnSomHud" aria-pressed="true" aria-label="Desligar o som">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/><path class="risco" stroke="currentColor" stroke-width="2" d="M3 3l18 18"/></svg>
  </button>
```

1d. Antes de `<section class="ecra ecra-cheio" id="ecra-menu">`: `<div class="golo" id="golo" hidden aria-live="assertive">GOLO!</div>`

1e. CSS (no fim do bloco `<style>`, antes da `@media`):

```css
  .barra{display:block;height:8px;margin-top:8px;border-radius:999px;background:var(--linha);overflow:hidden}
  #barraEnchimento{display:block;height:100%;width:0;background:var(--verde);transition:width .2s}
  .definicoes{display:grid;gap:10px;margin-top:16px;padding-top:14px;border-top:1px solid var(--linha)}
  .definicoes[hidden]{display:none}
  .interruptor{display:flex;align-items:center;gap:10px;font-size:15px;cursor:pointer}
  .interruptor[hidden]{display:none}
  .interruptor input{width:20px;height:20px;accent-color:var(--verde)}
  .nota{margin:0;font-size:13px;color:var(--tinta-suave)}
  .creditos{font-size:12px;color:var(--tinta-suave)}
  .hud-som{pointer-events:auto;position:absolute;top:max(12px,env(safe-area-inset-top));left:calc(max(12px,env(safe-area-inset-left)) + 84px);width:38px;height:34px;display:grid;place-items:center;background:rgba(10,35,24,.72);color:#fff;border:none;border-radius:999px;cursor:pointer}
  .hud-som svg{width:20px;height:20px}
  .hud-som .risco{display:none}
  .hud-som.desligado .risco{display:inline}
  .golo{position:fixed;inset:0;display:grid;place-items:center;pointer-events:none;font:700 clamp(64px,18vw,160px) 'Oswald',sans-serif;color:#fff;text-shadow:0 4px 0 var(--verde-escuro),0 10px 30px rgba(0,0,0,.45);letter-spacing:.04em}
  .golo[hidden]{display:none}
  .golo.mostra{animation:golo 1.8s ease-out both}
  @keyframes golo{0%{transform:scale(.3);opacity:0}15%{transform:scale(1.12);opacity:1}30%{transform:scale(1)}80%{opacity:1}100%{opacity:0;transform:scale(1.05)}}
  @media (prefers-reduced-motion: reduce){.golo.mostra{animation:none}}
```

- [ ] **Step 2: `jogo/fluxo.js`**

2a. Imports novos:

```js
import { carregarModelo } from './carregador.js';
import { criarGiroscopio } from './giroscopio.js';
import { criarSom } from './som.js';
```

e acrescentar `criarPreferencias, CHAVE_SOM, CHAVE_GIROSCOPIO` ao import de `./regras.js`.

2b. Estado novo, a seguir a `const armazem = ...`:

```js
const preferencias = criarPreferencias(armazenamentoSeguro());
let som = null;
let giroscopio = null;
let temporizadorGolo = 0;
```

2c. Funções novas:

```js
function mostrarProgresso(f) {
  const pct = Math.round(Math.max(0, Math.min(1, f)) * 100);
  $('carregarTexto').textContent = `A preparar o estádio... ${pct}%`;
  $('barraEnchimento').style.width = pct + '%';
  $('barraCarregar').setAttribute('aria-valuenow', String(pct));
}

function aplicarSom(ligado) {
  som.definirLigado(ligado);
  preferencias.guardarBool(CHAVE_SOM, ligado);
  $('optSom').checked = ligado;
  const b = $('btnSomHud');
  b.setAttribute('aria-pressed', String(ligado));
  b.setAttribute('aria-label', ligado ? 'Desligar o som' : 'Ligar o som');
  b.classList.toggle('desligado', !ligado);
}

function mostrarNotaGiro(texto) {
  $('notaGiro').textContent = texto;
  $('notaGiro').hidden = !texto;
}

function atualizarGiro() {
  const quer = $('optGiro').checked;
  const falta = quer && giroscopio.precisaAutorizacao && !giroscopio.autorizado;
  $('btnAtivarMovimento').hidden = !falta;
  if (quer && !falta) giroscopio.ligar();
  else giroscopio.desligar();
}

// No iPhone, a autorização só pode ser pedida num toque do utilizador.
async function ativarMovimento() {
  const ok = await giroscopio.pedirAutorizacao();
  if (!ok) {
    $('optGiro').checked = false;
    preferencias.guardarBool(CHAVE_GIROSCOPIO, false);
    mostrarNotaGiro('Sem autorização. Usa o dedo para olhar à volta.');
  } else {
    mostrarNotaGiro('');
  }
  atualizarGiro();
}

function prepararDefinicoes() {
  $('optSom').addEventListener('change', (ev) => aplicarSom(ev.target.checked));
  $('btnSomHud').addEventListener('click', () => aplicarSom(!som.ligado));
  aplicarSom(som.ligado);
  if (giroscopio.disponivel) {
    $('linhaGiro').hidden = false;
    $('optGiro').checked = preferencias.lerBool(CHAVE_GIROSCOPIO, true);
    $('optGiro').addEventListener('change', (ev) => {
      preferencias.guardarBool(CHAVE_GIROSCOPIO, ev.target.checked);
      mostrarNotaGiro('');
      if (ev.target.checked && giroscopio.precisaAutorizacao && !giroscopio.autorizado) ativarMovimento();
      else atualizarGiro();
    });
    $('btnAtivarMovimento').addEventListener('click', ativarMovimento);
    atualizarGiro();
  }
  // O iPhone só deixa tocar som depois de um gesto do utilizador.
  const desbloquear = () => som.desbloquear();
  document.addEventListener('pointerdown', desbloquear, { capture: true, passive: true });
  document.addEventListener('keydown', desbloquear, { capture: true });
}

function mostrarGolo() {
  const g = $('golo');
  clearTimeout(temporizadorGolo);
  g.hidden = false;
  g.classList.remove('mostra');
  void g.offsetWidth; // recomeça a animação
  g.classList.add('mostra');
  temporizadorGolo = setTimeout(esconderGolo, 1800);
}

function esconderGolo() {
  clearTimeout(temporizadorGolo);
  $('golo').hidden = true;
  $('golo').classList.remove('mostra');
}
```

2d. `desenharMenu()`: no fim, antes de `mostrar('menu')`, acrescentar `$('definicoes').hidden = false;` e `esconderGolo();`.

2e. `mostrarDica()`: a mensagem para toque passa a ser `giroscopio?.ligado ? 'Roda o telemóvel ou arrasta o dedo para olhar à volta' : 'Arrasta o dedo para olhar à volta'`.

2f. `iniciar()`: logo no início, `esconderGolo();`.

2g. `mostrarDecisao()`: no objeto passado a `motor.continuar`, acrescentar `aoGolo: () => { if (jogada === atual) mostrarGolo(); },`.

2h. `ligarBotoes()`: nos cliques de `btnSair` e `btnMenu`, `esconderGolo()` antes de `motor.parar()`.

2i. Substituir `arrancar()` por:

```js
async function arrancar() {
  window.__jogoArrancou = true;
  $('ecra-falha').hidden = true;
  mostrar('menu');
  som = criarSom({ ligado: preferencias.lerBool(CHAVE_SOM, true) });
  giroscopio = criarGiroscopio();
  let pModelo = 0;
  let pSom = 0;
  const progresso = () => mostrarProgresso(pModelo * 0.8 + pSom * 0.2);
  const [modelo] = await Promise.all([
    carregarModelo((f) => { pModelo = f; progresso(); }),
    som.carregar((f) => { pSom = f; progresso(); }),
  ]);
  try {
    motor = criarMotor($('cena'), { modelo, som, giroscopio });
  } catch {
    mostrar('erro');
    return;
  }
  ligarBotoes();
  prepararDefinicoes();
  desenharMenu();
  const direto = CENARIOS.find((c) => c.id === params.get('cenario'));
  if (direto) iniciar(direto);
}
```

- [ ] **Step 3: Testes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Verificação no browser**

Abrir `http://127.0.0.1:8765/jogo.html`. Expected:
- a barra de carregamento avança até 100% e aparece o menu com as definições ("Som do estádio" ligado; "Créditos dos sons");
- no computador, a linha "Olhar com o telemóvel" não aparece;
- ao jogar aparecem os **jogadores da Mixamo** com equipamentos e números; o botão de som no HUD liga e desliga;
- num golo, "GOLO!" grande durante cerca de 1,8 s; "Sair" a meio esconde-o.

Simulação de iPhone na consola, antes de carregar a página (usar `?cenario=` para recarregar):
- `DeviceOrientationEvent.requestPermission = async () => 'denied'` com o modo de dispositivo do DevTools (toque). Ligar "Olhar com o telemóvel": aparece a nota "Sem autorização. Usa o dedo para olhar à volta." e o interruptor desliga-se.
- Com `'granted'`: o botão "Ativar movimento" aparece quando a preferência está ligada; ao tocar, desaparece. Os sensores do DevTools (Sensors → Orientation) rodam a cabeça no jogo.

- [ ] **Step 5: Commit**

```bash
git add jogo.html jogo/fluxo.js
git commit -m "Add loading bar, sound and gyroscope settings, HUD sound button and GOLO overlay

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Sons e licenças (controlador)

Esta tarefa é feita pelo controlador, não por um subagente: precisa de pesquisa web e de **pedir ao utilizador autorização** antes de descarregar cada ficheiro (nome, origem e tamanho).

**Files:**
- Create: `jogo/sons/estadio.mp3`, `canticos.mp3`, `apito.mp3`, `golo.mp3`, `uuuh.mp3`, `aplauso.mp3`, `jogo/sons/LICENCAS.txt`

- [ ] **Step 1:** Procurar gravações reais com licença que permita uso no site sem atribuição obrigatória (CC0 ou equivalente). Fontes por ordem: BigSoundBank, Wikimedia Commons (CC0), Pixabay (licença Pixabay). Confirmar a licença na página de cada som e guardar o endereço.
- [ ] **Step 2:** Pedir ao utilizador autorização para descarregar, com a lista (nome, origem, tamanho).
- [ ] **Step 3:** Descarregar para uma pasta nova na scratchpad e converter com ffmpeg para mono 64 kbps, com cortes e fades:
  - ciclos (estádio e cânticos), 20 s: `ffmpeg -i entrada -ac 1 -ar 44100 -b:a 64k -t 20 -af "afade=t=in:d=0.5,afade=t=out:st=19.5:d=0.5" jogo/sons/estadio.mp3`
  - efeitos (apito ≤ 2 s, golo ≤ 6 s, uuuh ≤ 3 s, aplauso ≤ 4 s): `ffmpeg -i entrada -ac 1 -ar 44100 -b:a 64k -t <s> -af "afade=t=out:st=<s-0.5>:d=0.5" jogo/sons/<nome>.mp3`
  - Total ≤ 1,5 MB (`du -ch jogo/sons/*.mp3`).
- [ ] **Step 4:** `jogo/sons/LICENCAS.txt` em português: para cada ficheiro, nome, título original, autor, endereço e licença.
- [ ] **Step 5:** Abrir o jogo e ouvir cada som no seu momento (apito no início, ambiente em ciclo, golo, uuuh, aplauso).
- [ ] **Step 6: Commit**

```bash
git add jogo/sons
git commit -m "Add stadium sounds with licences

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Afinar o modelo (controlador)

O modelo já está convertido (`ferramentas/converter-mixamo.mjs`, commit 5e1020d). Esta tarefa afina os valores visuais depois de ver o jogo completo.

- [ ] **Step 1:** Momentos de contacto: abrir `?cenario=receber-costas&variante=pressao`, opção "Protejo e tabelo com o médio". Ver se o pé do médio toca na bola quando ela sai (passe em t = 0 e t = 2). Ajustar `CONTACTO.passe` em `jogo/animacao.js` até coincidir. Repetir para o remate (`rematar-assistir`, `pressao`, "Passo ao colega livre": remate do n-ad em t = 2), a defesa do guarda-redes e o desarme.
- [ ] **Step 2:** Riscas e número: confirmar as riscas verticais (`LARGURA_RISCA`) e o número centrado nas costas (`ALTURA_NUMERO`, `TAMANHO_NUMERO` em `jogo/jogador3d.js`).
- [ ] **Step 3:** Se uma animação parecer errada para o jogo, trocar o ficheiro em `ANIMACOES` de `ferramentas/converter-mixamo.mjs` (há 54 no pack em `Bussola-mixamo/soccer-pack-shannon`), voltar a correr `node ferramentas/converter-mixamo.mjs "C:/Users/jssantos/Documents/CLAUDE CODE/Bussola-mixamo"` e confirmar que o ficheiro fica ≤ 3 MB.
- [ ] **Step 4: Commit**

```bash
git add jogo/animacao.js jogo/jogador3d.js jogo/modelos/jogador.glb ferramentas/converter-mixamo.mjs
git commit -m "Tune gesture contact timing and kit details

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Verificação final completa (controlador)

- [ ] **Step 1:** `npm test`: tudo verde.
- [ ] **Step 2:** Vista de iPhone deitado (844 × 390) e ao alto (390 × 844), e computador (1366 × 768): jogar as **18 consequências** (3 cenários × 2 variantes × 3 opções com `?cenario=…&variante=…`). Em cada uma confirmar:
  - gestos no momento certo;
  - golos com rede, "GOLO!", câmara na bancada e festejos;
  - perdas com fuga e "uuuh";
  - aplauso nas boas decisões sem golo;
  - estrelas e repetição como antes;
  - "Jogar outra vez" limpo.
- [ ] **Step 3:** Modelo em falta: renomear temporariamente `jogo/modelos/jogador.glb` e recarregar. Expected: a barra chega ao fim, o jogo usa os bonecos simples, sem erros. Repor o nome.
- [ ] **Step 4:** Sons em falta: renomear temporariamente `jogo/sons`. Expected: jogo em silêncio e sem erros. Repor.
- [ ] **Step 5:** Rede "Fast 4G" e CPU 4× mais lento no DevTools: carregamento < 5 s até ao menu; durante o lance, se o fps cair, a torcida passa a metade e as sombras desligam-se (confirmar com `performance` e a vista).
- [ ] **Step 6:** Texto: procurar travessões nos ficheiros alterados (`grep -n "[–—]" jogo.html jogo/*.js`): nenhum. Confirmar que `index.html` não mudou (`git diff main -- index.html` vazio).
- [ ] **Step 7:** Atualizar a memória do projeto (`bussola_jogo_3d.md`) com os módulos novos, o pipeline da Mixamo e onde ficam os FBX.
- [ ] **Step 8:** Usar superpowers:finishing-a-development-branch. **Não** fazer push nem merge sem o ok do utilizador.
