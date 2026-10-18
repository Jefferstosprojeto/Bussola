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
