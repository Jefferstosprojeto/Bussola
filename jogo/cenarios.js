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
