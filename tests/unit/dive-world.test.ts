import {describe,it,expect} from 'vitest';
import {DiveWorld,seabedGeometry} from '../../src/world/DiveWorld';
import {diveNodes,seabedHeight,oxygenCapacity} from '../../src/world/DiveLayout';
import {SurvivalSystem} from '../../src/player/Survival';
describe('CP10.2 exploração submarina',()=>{
 it('fundo contínuo nas bordas dos tiles',()=>{const a=seabedGeometry(7,0,0,12),b=seabedGeometry(7,1,0,12),pa=a.getAttribute('position'),pb=b.getAttribute('position');for(let i=0;i<=12;i++)expect(pa.getY(i*13+12)).toBeCloseTo(pb.getY(i*13),5);expect(seabedHeight(0,0,7)).toBeLessThan(-5);a.dispose();b.dispose();});
 it('limita tiles e preserva coleta',()=>{const d=new DiveWorld(7,true);d.update(0,0,true,9);expect(d.loadedCount).toBe(9);const nodes=diveNodes(7,0,0);expect(nodes).toEqual(diveNodes(7,0,0));const n=nodes[0];expect(d.collect(n.id)).toBe(true);expect(d.collect(n.id)).toBe(false);d.update(640,640,true,9);expect(d.loadedCount).toBe(9);d.update(0,0,true,9);expect(d.collect(n.id)).toBe(false);d.reset(7,false,d.serialize());d.update(0,0,true,9);expect(d.collect(n.id)).toBe(false);d.dispose();});
 it('tanque não recupera oxigênio instantaneamente',()=>{const s=new SurvivalSystem();s.oxygen=10;s.setOxygenCapacity(oxygenCapacity(true));expect(s.maxOxygen).toBe(90);expect(s.oxygen).toBe(10);s.update(1,{sprinting:false,underwater:false,sheltered:false});expect(s.oxygen).toBe(25);});
});