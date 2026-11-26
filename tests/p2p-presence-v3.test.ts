import {describe,it,expect} from 'vitest';
import {readPose,sessionSeed,shortestAngle,POSE_INTERVAL,POSE_TIMEOUT_MS,type PlayerPose} from '../src/net/PresenceProtocol';

const valid:PlayerPose={v:1,seq:5,x:.25,y:.4,z:1.2,yaw:3.13,speed:4.5,wet:false,grounded:true};
describe('P2P V3: presença',()=>{
  it('aceita somente posições válidas com sequência, versão e estados explícitos',()=>{
    expect(readPose(JSON.stringify(valid))).toEqual(valid);
    for(const p of [{...valid,v:2},{...valid,seq:-1},{...valid,seq:1.5},{...valid,x:1000001},{...valid,speed:50},{...valid,yaw:20},{...valid,wet:1},{...valid,y:null}]){
      expect(readPose(JSON.stringify(p))).toBeNull();
    }
    expect(readPose(null)).toBeNull();
    expect(readPose('null')).toBeNull();
    expect(readPose('x'.repeat(257))).toBeNull();
  });
  it('deriva semente reproduzível do convite e respeita intervalo de transmissão',()=>{
    const s='v=0\r\na=ice-ufrag:example\r\n';
    expect(sessionSeed(s)).toBe(sessionSeed(s));
    expect(sessionSeed(s)).toBeGreaterThanOrEqual(100000);
    expect(sessionSeed(s)).toBeLessThan(1000000);
    expect(1/POSE_INTERVAL).toBe(10);
    expect(POSE_TIMEOUT_MS).toBe(2200);
  });
  it('interpola pelo arco mais curto ao cruzar a fronteira angular',()=>{
    expect(shortestAngle(Math.PI-.05,-Math.PI+.05)).toBeCloseTo(.1);
    expect(shortestAngle(-Math.PI+.05,Math.PI-.05)).toBeCloseTo(-.1);
  });
});
