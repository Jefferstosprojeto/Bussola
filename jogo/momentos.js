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
