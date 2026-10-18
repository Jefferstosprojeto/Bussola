import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(process.argv[2]);
const r = doc.getRoot();
console.log('meshes', r.listMeshes().map(m => m.getName() + ':' + m.listPrimitives().map(p => p.getAttribute('POSITION').getCount()).join('+')));
console.log('materials', r.listMaterials().map(m => m.getName() + (m.getBaseColorTexture() ? '[tex]' : '') + ' a=' + m.getAlphaMode()));
console.log('textures', r.listTextures().map(t => t.getName() + ' ' + t.getMimeType() + ' ' + JSON.stringify(t.getSize()) + ' ' + Math.round(t.getImage().byteLength / 1024) + 'KB'));
console.log('skins', r.listSkins().length, 'joints', r.listSkins()[0]?.listJoints().length);
console.log('nodes sample', r.listNodes().slice(0, 8).map(n => n.getName() + ' s=' + n.getScale().map(v=>+v.toFixed(3))));
console.log('anims', r.listAnimations().map(a => a.getName() + ':' + a.listChannels().length));
let ymin = Infinity, ymax = -Infinity;
for (const m of r.listMeshes()) for (const p of m.listPrimitives()) { const a = p.getAttribute('POSITION'); const e = [], f=[]; a.getMinNormalized?.(e); ymin = Math.min(ymin, a.getMin([])[1]); ymax = Math.max(ymax, a.getMax([])[1]); }
console.log('y range (local)', ymin, ymax);
