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

export const CENARIOS = [costasLateral, receberCostas, rematarAssistir];
