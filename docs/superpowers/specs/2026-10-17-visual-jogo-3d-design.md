# Visual do jogo 3D: bonecos, estádio, torcida, som e giroscópio

Data: 2026-10-17
Estado: rascunho para aprovação
Base: jogo publicado em `jogo.html` (spec `2026-10-17-jogo-3d-primeira-pessoa-design.md`)

## 1. Objetivo

Fazer o jogo do Arthur parecer um jogo a sério, em estilo "FIFA Street" (proporções reais, sem detalhe fotográfico, cores vivas), sem mudar o que já funciona: cenários, perguntas, decisões, estrelas, repetição.

Sucesso:
- O Arthur sente que está num estádio cheio, com jogadores que se mexem como jogadores.
- No iPhone recente corre a 60 fps e carrega em menos de 5 s em 4G.
- Os 24 testes atuais continuam a passar e as 18 consequências continuam corretas.

## 2. Decisões tomadas

| Tema | Decisão |
|---|---|
| Âmbito | Tudo junto, entregue por fases: bonecos, estádio, torcida e som, giroscópio |
| Estilo | Estilizado "FIFA Street" |
| Bonecos | Personagem e animações da Mixamo (Adobe), descarregadas pelo utilizador |
| Som | Gravações reais gratuitas, com licença confirmada antes de usar |
| Estádio | Estádio cheio, bancadas à volta, adeptos verde e brancos |
| Aparelho alvo | iPhone recente (12 ou mais novo); computador continua suportado |
| Olhar | Giroscópio do telemóvel soma-se ao dedo; interruptor no menu |

## 3. O que se vê e ouve

### 3.1 Bonecos
- Jogadores com proporções reais, cara, cabelo, chuteiras, número nas costas.
- Equipamentos: Vitória com camisola às riscas verde `#1B5C3E` e branco, calções brancos; adversário vermelho `#C2493B`; guarda-redes nosso `#E2932E`, guarda-redes adversário `#6A4FB5`.
- Animações: parado, corrida, sprint, passe, remate, cabeceamento (reserva para cenários futuros), guarda-redes parado, defesa do guarda-redes, festejo, desânimo, aplauso.
- O gesto de passe ou remate coincide com o momento em que a bola sai.

### 3.2 Estádio e imagem
- Bancadas à volta do campo (principal com cobertura), placas com "Bússola do Avançado" e "Vamos Vitória!" (sem marcas comerciais reais), quatro torres de iluminação.
- Fim de tarde: céu em gradiente com nuvens, sol baixo, sombras suaves só dos jogadores e da bola.
- Relva com textura gerada e riscas de corte.
- Bola a rodar, com sombra; passes longos em arco (altura máxima configurável por trajetória).
- Golos: a bola entra até ao fundo da rede e a rede abana.
- Câmara na 1ª pessoa com leve tremor no sprint.

### 3.3 Torcida
- Milhares de adeptos em verde e branco, com cachecóis e algumas bandeiras.
- Movimento contínuo leve; saltam no golo; mãos na cabeça num falhanço.

### 3.4 Som
- Murmúrio de estádio em ciclo, apito inicial, rugido no golo, "uuuh" no falhanço, aplauso nas decisões certas, cânticos ao fundo.
- Botão de som (ligado por defeito), escolha guardada.
- Todos os sons com licença que permita uso no site sem atribuição obrigatória, ou com a atribuição feita em `jogo/sons/LICENCAS.txt` e na página.

### 3.5 Momentos de jogo
- Golo: colegas festejam, câmara vira para a bancada, "GOLO!" grande antes do ecrã de resultado.
- Perda de bola: o defensor sai a correr com a bola, ouve-se o "uuuh".

### 3.6 Olhar com o telemóvel (giroscópio)
- Rodar o telemóvel para a esquerda ou direita roda a cabeça no jogo; inclinar muda o olhar vertical.
- O dedo continua a funcionar e soma-se ao giroscópio.
- No início de cada lance a direção atual do telemóvel passa a ser "em frente".
- iPhone: botão "Ativar movimento" pede autorização (`DeviceOrientationEvent.requestPermission`) num toque do utilizador. Se for recusada, o jogo usa só o dedo.
- Interruptor no menu "Olhar com o telemóvel", guardado. No computador não aparece.
- O contador de scans usa o ângulo final (giroscópio + dedo).

### 3.7 Fora desta versão
Caras de jogadores reais, emblemas e marcas oficiais, vários estádios, modo noite, multijogador.

## 4. Arquitetura

### 4.1 Recursos

| Pasta | Conteúdo | Origem |
|---|---|---|
| `jogo/modelos/jogador.glb` | 1 personagem + todas as animações num só ficheiro, comprimido (alvo ≤ 3 MB) | Mixamo, convertido de FBX |
| `jogo/sons/*.mp3` + `LICENCAS.txt` | cerca de 6 sons | bibliotecas gratuitas, licença verificada |
| texturas | geradas em canvas no arranque (relva, publicidade, céu) | código |

Os ficheiros FBX originais da Mixamo ficam fora do repositório, numa pasta local do utilizador, porque a licença Mixamo permite usar em jogos mas não distribuir os ficheiros soltos. Só o `.glb` final, embutido no jogo, é publicado.

Conversão: `FBX2glTF` (ferramenta de linha de comandos) para cada FBX e `@gltf-transform/cli` para juntar as animações num ficheiro, simplificar e comprimir (meshopt). Ferramentas só de desenvolvimento, não publicadas.

### 4.2 Módulos novos e alterados

| Ficheiro | Responsabilidade |
|---|---|
| `jogo/carregador.js` (novo) | Carrega `jogador.glb` e sons com progresso; devolve reserva se falhar |
| `jogo/jogador3d.js` (novo) | Cria um jogador a partir do modelo (clone com esqueleto), pinta equipamento e número, mistura animações conforme estado; mesma interface do `boneco.js` (`grupo`, `animar`, `libertar`) mais `gesto(nome)` |
| `jogo/estadio.js` (novo) | Bancadas, cobertura, publicidade, torres, céu, luz de fim de tarde, sombras |
| `jogo/torcida.js` (novo) | Adeptos em instâncias com animação na placa gráfica; `reagir('golo' | 'falhanco' | 'aplauso')` |
| `jogo/som.js` (novo) | Áudio (Web Audio): ciclo do estádio, efeitos, volume, ligar/desligar, desbloqueio no primeiro toque |
| `jogo/giroscopio.js` (novo) | Lê a orientação do telemóvel, pede autorização no iPhone, recalibra, devolve `yaw` e `pitch` relativos |
| `jogo/olhar.js` | Passa a somar o giroscópio ao dedo |
| `jogo/campo.js` | Relva com textura; rede animável |
| `jogo/motor.js` | Usa `jogador3d` (ou `boneco` como reserva), bola com rotação, arco e sombra, eventos de momento (gesto, golo, falhanço) |
| `jogo/cenarios.js` | Consequências ganham `eventos: [{ t, tipo: 'passe' | 'remate' | 'golo' | 'perda' | 'defesa', jogador? }]` e bolas com altura opcional (`[t, x, z, y]`) |
| `jogo/fluxo.js` + `jogo.html` | Barra de carregamento, botão de som, interruptor do giroscópio, botão "Ativar movimento", "GOLO!" |
| `tests/` | Testes dos eventos nos cenários, do misturador de animações (funções puras) e da matemática do giroscópio |

### 4.3 Fluxo de dados novo
1. `fluxo` mostra a barra de carregamento; `carregador` traz o modelo e os sons.
2. O motor cria jogadores com `jogador3d`; se o modelo falhou, usa `boneco`.
3. Durante a consequência, quando o relógio passa um `evento`, o motor chama `gesto()` no jogador indicado, e no golo ou falhanço avisa `torcida.reagir()` e `som.tocar()`, e no golo mostra "GOLO!" e vira a câmara para a bancada.
4. `olhar` lê `giroscopio` a cada frame e soma ao dedo.

### 4.4 Desempenho
- Píxeis limitados a 2x, sombras só de jogadores e bola (mapa 1024), torcida em instâncias.
- Medidor de fps: se ficar abaixo de 45 durante 2 s, reduz a torcida para metade e desliga sombras.
- Carregamento: modelo ≤ 3 MB, sons ≤ 1,5 MB no total, barra de progresso.

## 5. Erros e casos limite
- Modelo não carrega: bonecos atuais.
- Sons não carregam ou o iPhone bloqueia o áudio: jogo sem som, sem erro.
- Giroscópio recusado ou ausente: só dedo; o interruptor fica desligado.
- Telemóvel lento: redução automática de qualidade.
- Todos os textos novos em português de Portugal, sem travessões.

## 6. Testes
- Os 24 testes atuais continuam verdes.
- Novos testes: eventos dos cenários (tempos dentro da duração, jogador existe, golo só quando a bola acaba dentro da baliza), escolha de animação por velocidade e estado, recalibração e soma do giroscópio.
- Browser: vista de iPhone (844 × 390 e 390 × 844) e computador; as 18 consequências com animações, sons e momentos; giroscópio simulado; carregamento com rede 4G simulada (< 5 s); fps com CPU abrandado.

## 7. Guia para o utilizador: descarregar da Mixamo
Ver `docs/superpowers/specs/2026-10-17-guia-mixamo.md`.
