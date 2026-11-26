import {describe,it,expect} from 'vitest';
import {readSignal,readChat} from '../src/net/PeerLink';
describe('Protocolo P2P V2',()=>{
  it('aceita convite e resposta com SDP e valida o tipo',()=>{
    const offer=JSON.stringify({type:'offer',version:1,sdp:'v=0\r\n'});
    expect(readSignal(' '+offer+' ','offer').type).toBe('offer');
    expect(()=>readSignal(offer,'answer')).toThrow();
    expect(()=>readSignal(JSON.stringify({type:'offer',version:2,sdp:'v=0'}),'offer')).toThrow();
    expect(()=>readSignal('x'.repeat(16385),'offer')).toThrow();
    expect(()=>readSignal(JSON.stringify({type:'offer',version:1,sdp:'invalid'}),'offer')).toThrow();
  });
  it('limita chat e não confunde mensagens do protocolo',()=>{
    expect(readChat('chat: Olá! ')).toBe('Olá!');
    expect(readChat('ping:1')).toBeNull();
    expect(readChat('chat:   ')).toBeNull();
    expect(readChat('chat:'+'a'.repeat(240))).toHaveLength(240);
    expect(readChat('chat:'+'a'.repeat(241))).toBeNull();
  });
});
