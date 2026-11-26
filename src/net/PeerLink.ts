import {readPose,sessionSeed,type PlayerPose} from './PresenceProtocol';
const LABEL = 'mare-perdida/cp06-v1';
const PRESENCE_LABEL='mare-perdida/presence-v1';
const MAX_SIGNAL_LENGTH = 16_384;
const MAX_CHAT_LENGTH=240;
export interface PeerHealth {state:'waiting'|'connected'|'interrupted'|'closed'|'failed';rtt:number|null;jitter:number|null;sent:number;received:number;timeouts:number;}
export function readSignal(raw: string, type: 'offer' | 'answer'): RTCSessionDescriptionInit {
  if (raw.length > MAX_SIGNAL_LENGTH) throw new Error('Código grande demais.');
  try {
    const signal = JSON.parse(raw.trim());
    if (signal.version === 1 && signal.type === type && typeof signal.sdp === 'string' && signal.sdp.startsWith('v=0')) {
      return { type, sdp: signal.sdp };
    }
  } catch {}
  throw new Error(type === 'offer' ? 'Convite inválido.' : 'Resposta inválida.');
}
export function readChat(raw:string):string|null {
  if(!raw.startsWith('chat:')||raw.length>MAX_CHAT_LENGTH+5)return null;
  const message=raw.slice(5).trim();
  return message||null;
}

export class PeerLink {
  private readonly peer: RTCPeerConnection;
  private channel?: RTCDataChannel;
  private presence?:RTCDataChannel;
  private poseHandler?:(pose:PlayerPose)=>void;
  private lastSequence=-1;
  private seedValue:number|null=null;
  private roleValue:'host'|'guest'='host';
  get role(){return this.roleValue;}
  get sharedSeed(){return this.seedValue;}
  get presenceReady(){return !this.closed&&this.seedValue!==null&&this.health.state==='connected'&&this.presence?.readyState==='open';}
  get connectionState(){return this.health.state;}
  get latency(){return this.health.rtt;}
  onPose(handler:(pose:PlayerPose)=>void){this.poseHandler=handler;}
  sendPose(pose:PlayerPose):boolean{
    if(!this.presenceReady||!this.presence||this.presence.bufferedAmount>2048)return false;
    const raw=JSON.stringify(pose);if(raw.length>256)return false;
    try{this.presence.send(raw);return true;}catch{return false;}
  }
  private pingTimer?: ReturnType<typeof setTimeout>;
  private heartbeat?: ReturnType<typeof setInterval>;
  private recovery?: ReturnType<typeof setTimeout>;
  private gatherCancel?:()=>void;
  private pingSentAt = 0;
  private sequence = 0;
  private closed = false;
  private health:PeerHealth={state:'waiting',rtt:null,jitter:null,sent:0,received:0,timeouts:0};
  constructor(private readonly report: (message: string) => void,
      private readonly onHealth:(health:PeerHealth)=>void=()=>{},
      private readonly onChat:(message:string)=>void=()=>{}) {
    this.peer = new RTCPeerConnection({ iceServers: [{ urls: ['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302'] }] });
    this.peer.ondatachannel = ({ channel }) => channel.label===PRESENCE_LABEL?this.bindPresence(channel):this.bindChannel(channel);
    this.peer.onconnectionstatechange = () => {
      if(this.closed)return;
      if (this.peer.connectionState === 'failed') {
        this.close('failed');
        this.report('Conexão falhou. Redes restritivas podem exigir um servidor TURN. Gere outro convite.');
      } else if (this.peer.connectionState === 'disconnected') {
        this.setState('interrupted');
        this.report('Conexão interrompida. Tentando recuperar por até 20 segundos.');
        clearTimeout(this.recovery);
        this.recovery=setTimeout(()=>{if(this.closed||this.peer.connectionState==='connected')return;this.close('failed');this.report('Não foi possível recuperar. Gere um novo convite.');},20000);
      } else if (this.peer.connectionState === 'connected' && this.channel?.readyState === 'open') {
        this.connected();
      }
    };
  }
  private notify(){this.onHealth({...this.health});}
  private setState(state:PeerHealth['state']){this.health.state=state;this.notify();}
  private connected(){
    clearTimeout(this.recovery);this.recovery=undefined;
    this.setState('connected');this.report('Canal conectado. Chat e monitor de latência disponíveis.');
    if(!this.heartbeat)this.heartbeat=setInterval(()=>this.ping(false),3000);
    this.ping(false);
  }
  async offer(): Promise<string> {
    this.roleValue='host';
    this.bindChannel(this.peer.createDataChannel(LABEL));
    this.bindPresence(this.peer.createDataChannel(PRESENCE_LABEL,{ordered:false,maxRetransmits:0}));
    const code=await this.localSignal(await this.peer.createOffer());
    this.seedValue=sessionSeed(readSignal(code,'offer').sdp!);this.notify();return code;
  }
  async answer(raw: string): Promise<string> {
    this.roleValue='guest';const offer=readSignal(raw,'offer');
    this.seedValue=sessionSeed(offer.sdp!);
    await this.peer.setRemoteDescription(offer);
    return this.localSignal(await this.peer.createAnswer());
  }
  async accept(raw: string): Promise<void> {
    await this.peer.setRemoteDescription(readSignal(raw, 'answer'));
  }
  private send(data:string):boolean{
    if(this.closed||this.channel?.readyState!=='open'||this.channel.bufferedAmount>8192)return false;
    try{this.channel.send(data);return true;}catch{return false;}
  }
  sendChat(raw:string):boolean{
    const message=raw.trim();return message.length>0&&message.length<=MAX_CHAT_LENGTH&&this.send('chat:'+message);
  }
  ping(manual=true): void {
    if(this.pingTimer)return;
    const id=++this.sequence;
    if(!this.send('ping:'+id)){if(manual)this.report('Canal indisponível. Aguarde a conexão.');return;}
    this.pingSentAt=performance.now();this.health.sent++;this.notify();
    this.pingTimer=setTimeout(()=>{
      this.pingTimer=undefined;this.health.timeouts++;this.notify();
      if(manual)this.report('O outro navegador não respondeu. Tente novamente.');
    },5000);
  }
  close(state:PeerHealth['state']='closed'): void {
    if(this.closed)return;
    this.closed=true;
    clearTimeout(this.pingTimer);clearInterval(this.heartbeat);clearTimeout(this.recovery);
    this.pingTimer=undefined;this.heartbeat=undefined;this.recovery=undefined;
    this.gatherCancel?.();this.poseHandler=undefined;this.presence?.close();this.channel?.close();this.peer.close();this.setState(state);
  }
  private async localSignal(description: RTCSessionDescriptionInit): Promise<string> {
    await this.peer.setLocalDescription(description);
    if (this.peer.iceGatheringState !== 'complete') {
      await new Promise<void>((resolve,reject)=>{
        const finish=()=>{clearTimeout(timeout);this.peer.removeEventListener('icegatheringstatechange',onGather);this.gatherCancel=undefined;};
        const onGather=()=>{if(this.peer.iceGatheringState==='complete'){finish();resolve();}};
        const timeout=setTimeout(()=>{finish();reject(new Error('A preparação da rede demorou demais. Tente novamente.'));},15000);
        this.gatherCancel=()=>{finish();reject(new Error('A conexão foi encerrada.'));};
        this.peer.addEventListener('icegatheringstatechange',onGather);onGather();
      });
    }
    const signal = this.peer.localDescription?.toJSON();
    if (!signal?.sdp || this.closed) throw new Error('A conexão foi encerrada.');
    const code=JSON.stringify({...signal,version:1});
    if(code.length>MAX_SIGNAL_LENGTH)throw new Error('Convite grande demais. Tente outra rede.');
    return code;
  }
  private bindPresence(channel:RTCDataChannel):void{
    if(this.closed||this.presence||channel.label!==PRESENCE_LABEL){channel.close();return;}
    this.presence=channel;
    channel.onopen=()=>this.notify();channel.onclose=()=>this.notify();
    channel.onmessage=({data})=>{
      if(this.closed)return;
      const pose=readPose(data);if(!pose||pose.seq<=this.lastSequence)return;
      this.lastSequence=pose.seq;this.poseHandler?.(pose);
    };
    if(channel.readyState==='open')this.notify();
  }
  private bindChannel(channel: RTCDataChannel): void {
    if (channel.label !== LABEL || this.channel || this.closed) {channel.close();return;}
    this.channel=channel;
    channel.onopen=()=>this.connected();
    channel.onclose=()=>{if(this.closed)return;this.close();this.report('Conexão encerrada. Gere um novo convite.');};
    channel.onmessage=({data})=>{
      if(this.closed||typeof data!=='string'||data.length>MAX_CHAT_LENGTH+5)return;
      const ping=/^ping:(\d{1,10})$/.exec(data);
      if(ping){this.send('pong:'+ping[1]);return;}
      if(data==='pong:'+this.sequence&&this.pingTimer){
        clearTimeout(this.pingTimer);this.pingTimer=undefined;
        const rtt=Math.round(performance.now()-this.pingSentAt);
        if(this.health.rtt!==null){const delta=Math.abs(rtt-this.health.rtt);this.health.jitter=Math.round((this.health.jitter??delta)*.75+delta*.25);}
        this.health.rtt=rtt;this.health.received++;this.notify();return;
      }
      const message=readChat(data);if(message)this.onChat(message);
    };
    if(channel.readyState==='open')this.connected();
  }
}
