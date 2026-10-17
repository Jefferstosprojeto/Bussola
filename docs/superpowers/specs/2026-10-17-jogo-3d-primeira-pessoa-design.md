# Jogo 3D na primeira pessoa: Avançado no futebol de 7

Data: 2026-10-17
Estado: rascunho para aprovação

## 1. Objetivo

Um jogo 3D, no browser do telemóvel, em que o Arthur vê o lance pelos olhos de um Avançado Esquerdo do 3-1-2 do Vitória de Setúbal (Sub-11, futebol de 7). O jogo treina três hábitos:

1. Olhar à volta (scan) antes de receber a bola.
2. Perceber se tem pressão nas costas ou espaço para rodar.
3. Decidir bem: onde atacar o espaço, como receber, o que fazer com a bola.

Inspiração: as funcionalidades descritas publicamente pela Be Your Best (cenários na 1ª pessoa, medição de scans, testes de atenção, decisão ao receber, repetição, estatísticas). Nenhum código, gráfico ou recurso da Be Your Best é copiado; tudo é feito de raiz.

Sucesso: o Arthur quer repetir os cenários, e as estrelas de "scan" e "decisão" sobem com o tempo.

## 2. Decisões tomadas

| Tema | Decisão |
|---|---|
| Plataforma | Three.js no browser, sem instalar nada, publicado no mesmo GitHub Pages do Bússola; funciona no telemóvel e no computador |
| Controlo | Lance guiado: o percurso da corrida do Arthur é definido pelo cenário; ele olha à volta (dedo no telemóvel, rato ou setas no computador) |
| Movimento | Todos os 14 jogadores correm com animação; a câmara do Arthur corre com ele, com ligeiro balanço de cabeça |
| Decisão | O jogo congela em câmara lenta e mostra 3 opções |
| Scan | Conta os scans antes da receção e faz uma pergunta de atenção |
| Adversários | 7 contra 7 completo; guião antes da decisão, reação real depois |
| Pressão vs espaço | Cada cenário tem variantes sorteadas; a resposta certa depende da variante |

## 3. Como se joga

### 3.1 Ciclo de um cenário (30 a 40 s)

1. **Lance (6 a 10 s):** a jogada desenrola-se sozinha, com todos os jogadores a correr e a bola a circular em passes. A câmara está à altura dos olhos do Arthur (cerca de 1,4 m), corre com ele pelo percurso guiado e tem um ligeiro balanço de cabeça proporcional à velocidade. Arrastar na horizontal roda a cabeça (até 180° para cada lado); na vertical inclina um pouco (limitado a ±25°).
   - **Telemóvel:** arrastar o dedo.
   - **Computador:** arrastar com o rato, ou setas ← → (rodar) e ↑ ↓ (inclinar). Opções de pergunta e decisão também com as teclas 1, 2 e 3.
2. **Congelamento:** quando a bola vai chegar, o tempo abranda até quase parar.
3. **Pergunta de atenção:** por exemplo "Onde estava o central adversário?". Aparece um mini-mapa 2D com 3 pontos; o Arthur toca num.
4. **Decisão:** 3 botões com textos curtos (ex.: "Rodo e ataco a baliza", "Protejo e tabelo", "Toco de primeira").
5. **Consequência:** o lance continua em 3D com a escolha dele; os adversários reagem.
6. **Resultado:** até 3 estrelas, uma frase do treinador e a repetição 2D vista de cima, com a zona de pressão ou o espaço livre realçados.

### 3.2 Scan

- Cada cenário define a direção para onde o Arthur está virado no início (`direcaoBase`): 0° quando está virado para a baliza adversária, 180° quando recebe de costas, virado para a nossa equipa.
- Conta um scan quando a cabeça roda mais de 70° em relação a essa direção base.
- O scan seguinte só conta depois de a cabeça voltar a menos de 30° (evita contar o mesmo olhar várias vezes).
- Um contador com um ícone de olho, no canto, mostra os scans em tempo real.

### 3.3 Estrelas

- ⭐ **Scan:** pelo menos 2 scans nos 4 s antes do congelamento.
- ⭐ **Atenção:** resposta certa à pergunta de atenção.
- ⭐ **Decisão:** opção certa para a variante sorteada.

### 3.4 Variantes "com pressão" e "com espaço"

As duas variantes de um cenário começam iguais. A diferença (por exemplo, o central colado nas costas ou a 5 a 6 m) só se vê olhando para trás antes de a bola chegar. A decisão certa muda conforme a variante. A variante é sorteada em cada jogada.

### 3.5 Cenários da v1

| # | Nome | Situação | Com pressão | Com espaço |
|---|---|---|---|---|
| 1 | Nas costas do lateral | O central sai a jogar; o lateral adversário subiu | Lateral recua e central cobre: vir curto e apoiar | Espaço nas costas: atacar a profundidade |
| 2 | Receber de costas | O médio passa para o Arthur; há um central atrás | Central colado: proteger e tabelar | Central longe: receber orientado e rodar |
| 3 | Rematar ou assistir | A bola chega à área; o outro avançado aparece; o guarda-redes sai | Defesa em cima do Arthur: passar ao colega livre | Linha livre para a baliza: rematar de primeira |

Os textos finais (perguntas, opções e frases do treinador) são definidos no plano de implementação, em português de Portugal, sem travessões, no tom curto e imperativo dos cartões atuais.

### 3.6 Progressão

- O cenário 1 está aberto; os seguintes desbloqueiam-se com estrelas (cenário 2 com 2 estrelas no 1, cenário 3 com 2 estrelas no 2).
- O melhor resultado de cada cenário fica guardado no telemóvel.

### 3.7 Fora da v1

Modo carreira completo, desafios rápidos, outras posições, formação 2-3-1, repetição 3D por outros ângulos, jogo livre com IA.

## 4. Arquitetura

### 4.1 Onde fica

- Página nova `jogo.html` no mesmo site.
- No `index.html` atual entra apenas um botão "Jogar 3D" com ligação para `jogo.html`. Nada mais no `index.html` é alterado.

### 4.2 Ficheiros

| Ficheiro | Responsabilidade | Depende de |
|---|---|---|
| `jogo.html` | Estrutura, ecrãs (menu de cenários, pergunta, decisão, resultado), estilos | todos os módulos |
| `jogo/fluxo.js` | Controla os ecrãs: menu, lance, pergunta, decisão, resultado, repetição; teclas 1, 2 e 3 | todos os módulos |
| `jogo/motor.js` | Cena Three.js: bonecos, bola, câmara 1ª pessoa, relógio e câmara lenta, gravação para a repetição | Three.js, `campo.js`, `boneco.js`, `olhar.js`, `regras.js`, `adversarios.js` |
| `jogo/campo.js` | Constrói o campo de 7 em 3D: relva, linhas, áreas, balizas | Three.js |
| `jogo/boneco.js` | Cria um jogador 3D com animação de corrida | Three.js |
| `jogo/olhar.js` | Olhar à volta: dedo, rato e setas | nada |
| `jogo/cenarios.js` | Só dados: trajetórias por tempo de cada jogador e da bola, variantes, perguntas, opções, consequências, frases | nada |
| `jogo/adversarios.js` | Comportamentos dos defensores depois da decisão: marcar um jogador, fechar um espaço, pressionar o portador | Yuka |
| `jogo/regras.js` | Funções puras: contar scans, calcular estrelas, sortear variante, guardar e ler recordes | nada |
| `jogo/repeticao.js` | Mapa 2D de cima (canvas ou SVG) que repete o lance e realça pressão ou espaço | dados gravados pelo motor |
| `jogo/modelos/` | Bonecos 3D animados (glTF) | nada |

### 4.3 Fluxo de dados

1. O menu escolhe um cenário; `regras.js` sorteia a variante.
2. O `motor.js` anima as trajetórias da variante pelo relógio e grava a posição de todos os jogadores a cada frame (para a repetição).
3. O controlo de toque atualiza a direção da cabeça; `regras.js` recebe essa direção e conta os scans.
4. No tempo de congelamento, o motor abranda e o ecrã mostra a pergunta e depois a decisão.
5. A opção escolhida indica qual consequência animar. Os jogadores da nossa equipa e a bola seguem o guião da consequência; os defensores passam a ser controlados por `adversarios.js`.
6. No fim, `regras.js` calcula as estrelas e guarda o recorde; `repeticao.js` mostra o lance de cima.

### 4.4 Formato dos dados de um cenário (esboço)

```js
{
  id: 'costas-lateral',
  nome: 'Nas costas do lateral',
  direcaoBase: 0,                  // graus; 180 = virado para a nossa baliza
  desbloqueio: null,               // ou { cenario: 'x', estrelas: 2 }
  congelaEm: 7.5,                  // segundos
  variantes: {
    pressao: { trajetorias: {...}, decisaoCerta: 'curto' },
    espaco:  { trajetorias: {...}, decisaoCerta: 'profundidade' }
  },
  perguntaAtencao: { texto: '...', opcoes: [...], certa: 0 },
  opcoes: [{ id: 'profundidade', texto: '...' }, ...],
  consequencias: { profundidade: {...}, curto: {...}, ... },
  frases: { pressao: '...', espaco: '...' }
}
```

Coordenadas em metros: `x` ao longo do campo (0 na nossa linha de fundo, 55 na adversária), `z` na largura (0 a 35). Trajetórias são listas de `[tempo, x, z]` interpoladas.

### 4.5 Bibliotecas e recursos externos

- **Three.js**, versão fixa, carregada por CDN através de import map.
- **Yuka** 0.7.8 (MIT), versão fixa, por CDN, para os comportamentos dos adversários.
- **Bonecos animados** de um pacote CC0 (Quaternius ou 100 Avatars), convertidos para glTF se necessário. A licença é confirmada antes de usar. Se não houver um modelo adequado, usam-se bonecos procedimentais simples (corpo e cabeça) com animação de balanço.
- Não se adapta nenhum jogo de futebol existente.

### 4.6 Aspeto

- Campo de 7 (cerca de 55 × 35 m, configurável) com relva às riscas, linhas e balizas.
- Nossa equipa: verde e branco (Vitória). Adversário: cor contrastante. Guarda-redes: cor própria por equipa.
- Céu simples e iluminação sem sombras pesadas.

### 4.7 Desempenho no telemóvel

- Resolução limitada a 2x.
- Sem sombras dinâmicas.
- Alvo de 60 fps em telemóveis de gama média.
- Recomenda-se o telemóvel deitado; ao alto também funciona.

## 5. Erros e casos limite

- **Sem WebGL:** mensagem em português e botão para voltar ao Bússola.
- **Armazenamento indisponível** (modo privado, bloqueado): todas as leituras e escritas em try/catch; o jogo funciona sem guardar recordes.
- **Modelos 3D não carregam:** usa os bonecos procedimentais.
- **App em segundo plano ou separador escondido:** o relógio pausa e retoma.
- **Erro em dados de cenário:** detetado pelos testes antes de publicar.

## 6. Testes

- Testes automáticos (Node) a `regras.js`: contagem de scans com histerese, cálculo de estrelas, sorteio de variante, desbloqueios.
- Validação dos dados de `cenarios.js`: todos os jogadores dentro do campo, cada opção com consequência, cada variante com decisão certa válida, tempos crescentes.
- Teste no browser com servidor local que envia `Content-Type: text/html; charset=utf-8` (para os acentos), em vista de 390 px, ao alto e deitado, tema claro e escuro, com os 3 cenários e ambas as variantes jogados até ao fim.
- Teste em vista de computador (1366 px ou mais) com rato e teclado: rodar com o rato e com as setas, escolher opções com 1, 2 e 3.
- Verificar que o `index.html` só ganhou o botão "Jogar 3D".
