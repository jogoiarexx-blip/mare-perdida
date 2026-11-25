import {describe,it,expect} from 'vitest';
import {motorStep,radarIsland,FUEL_SECONDS,MOTOR_CAPACITY} from '../../src/world/Navigation';
import {RaftGrid} from '../../src/raft/Grid';
import {RECIPES} from '../../src/data/recipes';
import {evaluateBuild} from '../../src/raft/BuildTarget';
describe('CP10.4 navegação avançada',()=>{
 it('motor consome apenas ao acelerar ou virar e respeita âncora',()=>{expect(motorStep(0,0,1,false,1,1,60)).toEqual({heading:0,dx:-0,dz:-4.2,used:1});expect(motorStep(0,0,0,false,1,1,60).used).toBe(0);expect(motorStep(0,1,1,true,1,1,60).used).toBe(0);expect(motorStep(0,0,1,false,1,1,.25).used).toBe(.25);expect(motorStep(0,0,1,false,1,1,0).dz).toBe(0);});
 it('combustível persiste no save e tanque tem três cargas',()=>{const g=new RaftGrid();const m=g.placeModule('motor',1,0,0,65).module!;m.fuel=FUEL_SECONDS;const restored=new RaftGrid();restored.restore(g.serialize());expect(restored.getModuleAt(1,0)?.fuel).toBe(60);expect(MOTOR_CAPACITY).toBe(3*FUEL_SECONDS);});
 it('radar detecta ilha inicial e equipamentos têm receita',()=>{expect(radarIsland(7,0,0)).not.toBeNull();for(const k of ['motor','escada','bandeira','farol_nav','radar'])expect(RECIPES.some(r=>r.placesStructure===k)).toBe(true);const g=new RaftGrid();expect(evaluateBuild(g,'escada',1,0,true).valid).toBe(true);});
});