// Converte a personagem e as animações da Mixamo (FBX, fora do repositório) num só jogo/modelos/jogador.glb.
// Uso: node ferramentas/converter-mixamo.mjs "<pasta Bussola-mixamo>"
// Ferramenta só de desenvolvimento: os FBX originais não se publicam (licença Mixamo).
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, resample, weld, meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';

const ORIGEM = resolve(process.argv[2] || '../Bussola-mixamo');
const DESTINO = resolve('jogo/modelos/jogador.glb');
const FBX2GLTF = resolve('node_modules/fbx2gltf/bin/Windows_NT/FBX2glTF.exe');
const TEMP = join(tmpdir(), 'bussola-mixamo');

const PERSONAGEM = 'soccer-pack-shannon/Ch38_nonPBR.fbx';
// Nome da animação no jogo → ficheiro FBX.
const ANIMACOES = {
  parado: 'soccer-pack-shannon/offensive idle.fbx',
  correr: 'soccer-pack-shannon/jog forward.fbx',
  sprint: 'extra/Fast Run.fbx',
  passe: 'soccer-pack-shannon/strike foward jog.fbx',
  remate: 'soccer-pack-shannon/soccer penalty kick.fbx',
  cabeca: 'soccer-pack-shannon/header soccerball.fbx',
  'gr-parado': 'soccer-pack-shannon/goalkeeper idle.fbx',
  'gr-defesa': 'soccer-pack-shannon/goalkeeper diving save.fbx',
  desarme: 'soccer-pack-shannon/soccer tackle.fbx',
  festejo: 'extra/Cheering.fbx',
  desanimo: 'extra/Disappointed.fbx',
  aplauso: 'extra/Clapping.fbx',
};

// Texturas que não servem ao estilo do jogo (relevo e brilho): saem para poupar peso.
const TEXTURAS_FORA = /Normal|Glossiness/i;

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });

function converter(relativo, nome) {
  const saida = join(TEMP, nome);
  execFileSync(FBX2GLTF, ['--binary', '--input', join(ORIGEM, relativo), '--output', saida], { stdio: 'pipe' });
  return saida + '.glb';
}

// O prefixo dos ossos muda entre exportações (mixamorig:, mixamorig5:...): compara-se só o nome do osso.
const nomeOsso = (n) => (n || '').replace(/^mixamorig\d*:/, '');

function copiarAnimacao(destino, origem, nome) {
  const raiz = destino.getRoot();
  const porNome = new Map(raiz.listNodes().map((n) => [nomeOsso(n.getName()), n]));
  const buffer = raiz.listBuffers()[0];
  const anim = origem.getRoot().listAnimations().find((a) => a.listChannels().length > 0);
  if (!anim) throw new Error(`${nome}: sem animação`);
  const nova = destino.createAnimation(nome);
  let canais = 0;
  for (const canal of anim.listChannels()) {
    const ossoOrigem = nomeOsso(canal.getTargetNode()?.getName());
    const alvo = porNome.get(ossoOrigem);
    if (!alvo) continue;
    const s = canal.getSampler();
    const valores = s.getOutput().getArray().slice();
    // Sem deslocação horizontal da anca: o jogo move o jogador; a animação fica no sítio.
    if (ossoOrigem === 'Hips' && canal.getTargetPath() === 'translation') {
      const [x0, , z0] = valores;
      for (let i = 0; i < valores.length; i += 3) {
        valores[i] = x0;
        valores[i + 2] = z0;
      }
    }
    const entrada = destino.createAccessor().setType('SCALAR').setArray(s.getInput().getArray().slice()).setBuffer(buffer);
    const saida = destino.createAccessor().setType(s.getOutput().getType()).setArray(valores).setBuffer(buffer);
    const amostra = destino.createAnimationSampler().setInput(entrada).setOutput(saida).setInterpolation(s.getInterpolation());
    nova.addSampler(amostra).addChannel(
      destino.createAnimationChannel().setTargetNode(alvo).setTargetPath(canal.getTargetPath()).setSampler(amostra),
    );
    canais++;
  }
  const duracao = Math.max(...nova.listSamplers().map((s) => s.getInput().getMax([])[0]));
  console.log(`  ${nome}: ${canais} canais, ${duracao.toFixed(2)} s`);
}

mkdirSync(TEMP, { recursive: true });
mkdirSync(resolve('jogo/modelos'), { recursive: true });

console.log('Personagem...');
const doc = await io.read(converter(PERSONAGEM, 'personagem'));
for (const a of doc.getRoot().listAnimations()) a.dispose();
for (const t of doc.getRoot().listTextures()) if (TEXTURAS_FORA.test(t.getName())) t.dispose();
for (const m of doc.getRoot().listMaterials()) m.setMetallicFactor(0).setRoughnessFactor(0.85);

console.log('Animações...');
for (const [nome, ficheiro] of Object.entries(ANIMACOES)) {
  copiarAnimacao(doc, await io.read(converter(ficheiro, nome)), nome);
}

// Texturas a 1024 em JPEG; as de materiais com transparência (cabelo) a 512 em PNG.
const comTransparencia = new Set(doc.getRoot().listMaterials().filter((m) => m.getAlphaMode() !== 'OPAQUE').map((m) => m.getBaseColorTexture()));
for (const t of doc.getRoot().listTextures()) {
  const comAlfa = comTransparencia.has(t);
  const lado = comAlfa ? 512 : 1024;
  const entrada = join(TEMP, 'tex-in');
  const saida = join(TEMP, comAlfa ? 'tex-out.png' : 'tex-out.jpg');
  writeFileSync(entrada, t.getImage());
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', entrada, '-vf', `scale=${lado}:${lado}`, ...(comAlfa ? [] : ['-q:v', '4']), saida]);
  const dados = readFileSync(saida);
  t.setImage(new Uint8Array(dados)).setMimeType(comAlfa ? 'image/png' : 'image/jpeg');
  console.log(`  textura ${t.getName()}: ${Math.round(dados.length / 1024)} KB`);
}

await doc.transform(
  dedup(),
  prune(),
  resample(),
  weld(),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
);
await io.write(DESTINO, doc);
console.log(`Escrito ${DESTINO}: ${(statSync(DESTINO).size / 1024 / 1024).toFixed(2)} MB`);
