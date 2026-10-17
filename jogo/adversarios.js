// Defensores que reagem à decisão do Arthur: marcar, fechar um espaço, pressionar a bola.
import { ArriveBehavior, EntityManager, Vector3, Vehicle } from 'yuka';

export const VELOCIDADE_MAX = 6.5;

// Peso do Arrive: encurta o atraso de reação de ~1 s (a força é só o erro de velocidade).
const PESO_CHEGADA = 3;

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
    const chegada = new ArriveBehavior(alvo, p.desaceleracao, p.tolerancia);
    chegada.weight = PESO_CHEGADA;
    v.steering.add(chegada);
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
