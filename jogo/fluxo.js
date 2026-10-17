// Fluxo do jogo: menu, lance, pergunta de atenção, decisão, consequência e resultado.
import { CAMPO, CENARIOS } from './cenarios.js';
import { criarMotor } from './motor.js';
import { criarRepeticao } from './repeticao.js';
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
let repeticao = null;

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
  let scansMostrados = 0;
  $('numScans').textContent = '0';
  mostrar(null);
  mostrarDica();
  motor.jogar(cenario, varianteId, {
    aoOlhar: (t, yaw) => {
      atual.contador.registar(t, yaw);
      const total = atual.contador.total();
      if (total !== scansMostrados) {
        scansMostrados = total;
        $('numScans').textContent = String(total);
      }
    },
    aoCongelar: () => {
      if (jogada === atual) mostrarPergunta();
    },
  });
}

function preencherOpcoes(caixa, textos, aoEscolher) {
  let feito = false;
  // Um toque duplo não pode responder também ao ecrã seguinte.
  const pronto = performance.now() + 350;
  const escolher = (i) => {
    if (feito || performance.now() < pronto) return;
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
    g.addEventListener('click', () => aoTocar(i));
  });
  // Rótulo "Tu" numa pílula escura: por cima do ponto, ou por baixo se tapar alguma opção.
  const PILULA_L = 4;
  const PILULA_A = 2.6;
  const RAIO_PONTO = 1.8;
  const tapa = (cy) => pontos.some(([x, z]) => {
    const nx = Math.max(tu[0] - PILULA_L / 2, Math.min(x, tu[0] + PILULA_L / 2));
    const ny = Math.max(cy - PILULA_A / 2, Math.min(z, cy + PILULA_A / 2));
    return Math.hypot(x - nx, z - ny) < RAIO_PONTO + 0.1;
  });
  const cabe = (cy) => cy - PILULA_A / 2 >= 0 && cy + PILULA_A / 2 <= L;
  let cyRotulo = null;
  for (const d of [2.4, 3.2, 4, 4.8, 5.6, 6.4]) {
    cyRotulo = [tu[1] - d, tu[1] + d].find((cy) => cabe(cy) && !tapa(cy)) ?? null;
    if (cyRotulo !== null) break;
  }
  if (cyRotulo === null) cyRotulo = Math.max(PILULA_A / 2, tu[1] - 2.4);
  const RAIO_TU = 0.9;
  const rotulo = svg('g', { 'pointer-events': 'none' }, mapa);
  // Linha de chamada da borda da pílula até ao anel do "Tu".
  const lado = cyRotulo < tu[1] ? 1 : -1;
  svg('line', {
    x1: tu[0], y1: cyRotulo + lado * (PILULA_A / 2), x2: tu[0], y2: tu[1] - lado * RAIO_TU,
    stroke: '#E2932E', 'stroke-width': 0.2,
  }, rotulo);
  svg('rect', {
    x: tu[0] - PILULA_L / 2, y: cyRotulo - PILULA_A / 2, width: PILULA_L, height: PILULA_A,
    rx: PILULA_A / 2, fill: '#0C2A1E', 'fill-opacity': 0.85,
  }, rotulo);
  const texto = svg('text', { x: tu[0], y: cyRotulo + 0.7, 'text-anchor': 'middle', 'font-size': 2, 'font-weight': 700, fill: '#FFFFFF' }, rotulo);
  texto.textContent = 'Tu';
  // O "Tu" fica por cima dos círculos das opções: anel âmbar com ponto ao centro.
  svg('circle', { cx: tu[0], cy: tu[1], r: RAIO_TU, fill: 'none', stroke: '#E2932E', 'stroke-width': 0.45 }, rotulo);
  svg('circle', { cx: tu[0], cy: tu[1], r: 0.3, fill: '#E2932E' }, rotulo);
  // Os números das opções desenham-se por último, por cima de tudo; o toque passa para o círculo.
  const numeros = svg('g', { 'pointer-events': 'none' }, mapa);
  pontos.forEach(([x, z], i) => {
    const t = svg('text', { x, y: z + 0.75, 'text-anchor': 'middle', 'font-size': 2.2, 'font-weight': 700, fill: '#0C2A1E' }, numeros);
    t.textContent = String(i + 1);
  });
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
  window.__jogoArrancou = true;
  $('ecra-falha').hidden = true;
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
