import {describe,it,expect} from 'vitest';
import {diveNodes,wreckWall,validDiveId} from '../../src/world/DiveLayout';
import {DiveWorld} from '../../src/world/DiveWorld';
import {predatorGeometry,DivePredators} from '../../src/ai/DivePredators';
import {EventBus} from '../../src/core/EventBus';
import {QuestEngine} from '../../src/quests/QuestEngine';
import * as THREE from 'three';
describe('CP10.3',()=>{
 it('baú raro tem ID persistente e casco mantém entrada livre',()=>{const nodes=diveNodes(7,0,0),w=nodes.find(n=>n.kind==='destroco')!,chest=nodes.find(n=>n.kind==='bau_raro')!;expect(validDiveId(chest.id)).toBe(true);expect(wreckWall(w.x+2.3,w.z,w.y+1,w)).toBe(true);expect(wreckWall(w.x,w.z+4,w.y+1,w)).toBe(false);const d=new DiveWorld(7,true);d.update(0,0,true,9);expect(d.collect(chest.id)).toBe(true);d.reset(7,false,d.serialize());d.update(0,0,true,9);expect(d.collect(chest.id)).toBe(false);d.dispose();});
 it('LOD reduz geometria e predadores são desligados fora da água',()=>{for(const kind of ['tubarao','moreia','agua_viva'] as const){const a=predatorGeometry(kind),b=predatorGeometry(kind,true);expect(b.getAttribute('position').count).toBeLessThan(a.getAttribute('position').count);a.dispose();b.dispose();}const ai=new DivePredators(),p=new THREE.Vector3(0,-3,0);ai.update(.05,p,true,7,true,()=>{});expect(ai.activeCount).toBe(3);ai.update(.05,p,false,7,true,()=>{});expect(ai.activeCount).toBe(0);ai.dispose();});
 it('contratos usam eventos e não duplicam recompensa',()=>{const b=new EventBus(),q=new QuestEngine(b);b.emit('itemCollected',{itemId:'reliquia_atlas',count:1,source:'dive'});expect(q.states.get('DIVE03')?.status).toBe('COMPLETED');const xp=q.xp;b.emit('itemCollected',{itemId:'reliquia_atlas',count:1,source:'dive'});expect(q.xp).toBe(xp);q.dispose();});
});