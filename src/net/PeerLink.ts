const LABEL = 'mare-perdida/cp06-v1';
const MAX_SIGNAL_LENGTH = 16_384;

function readSignal(raw: string, type: 'offer' | 'answer'): RTCSessionDescriptionInit {
  if (raw.length > MAX_SIGNAL_LENGTH) throw new Error('Código grande demais.');
  try {
    const signal = JSON.parse(raw);
    if (signal.version === 1 && signal.type === type && typeof signal.sdp === 'string') {
      return { type, sdp: signal.sdp };
    }
  } catch {
    // A mensagem abaixo também cobre JSON malformado.
  }
  throw new Error(type === 'offer' ? 'Convite inválido.' : 'Resposta inválida.');
}

export class PeerLink {
  private readonly peer: RTCPeerConnection;
  private channel?: RTCDataChannel;
  private pingTimer?: ReturnType<typeof setTimeout>;
  private pingSentAt = 0;
  private sequence = 0;
  private closed = false;

  constructor(private readonly report: (message: string) => void) {
    this.peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    this.peer.ondatachannel = ({ channel }) => this.bindChannel(channel);
    this.peer.onconnectionstatechange = () => {
      if (this.peer.connectionState === 'failed') {
        this.close();
        this.report('A conexão falhou. Gere um novo convite para tentar novamente.');
      } else if (this.peer.connectionState === 'disconnected') {
        this.report('Conexão interrompida. Aguarde ou gere um novo convite.');
      } else if (this.peer.connectionState === 'connected' && this.channel?.readyState === 'open') {
        this.report('Canal conectado. Você pode medir a latência.');
      }
    };
  }

  async offer(): Promise<string> {
    this.bindChannel(this.peer.createDataChannel(LABEL));
    return this.localSignal(await this.peer.createOffer());
  }

  async answer(raw: string): Promise<string> {
    await this.peer.setRemoteDescription(readSignal(raw, 'offer'));
    return this.localSignal(await this.peer.createAnswer());
  }

  async accept(raw: string): Promise<void> {
    await this.peer.setRemoteDescription(readSignal(raw, 'answer'));
  }

  ping(): void {
    if (this.channel?.readyState !== 'open') {
      this.report('Conecte os dois navegadores antes de medir.');
      return;
    }
    if (this.pingTimer) return;
    this.pingSentAt = performance.now();
    this.sequence += 1;
    this.channel.send(`ping:${this.sequence}`);
    this.pingTimer = setTimeout(() => {
      this.pingTimer = undefined;
      this.report('O outro navegador não respondeu. Tente novamente.');
    }, 5000);
  }

  close(): void {
    this.closed = true;
    clearTimeout(this.pingTimer);
    this.pingTimer = undefined;
    this.channel?.close();
    this.peer.close();
  }

  private async localSignal(description: RTCSessionDescriptionInit): Promise<string> {
    await this.peer.setLocalDescription(description);
    if (this.peer.iceGatheringState !== 'complete') {
      await new Promise<void>((resolve, reject) => {
        const finish = () => {
          clearTimeout(timeout);
          this.peer.removeEventListener('icegatheringstatechange', onGather);
        };
        const onGather = () => {
          if (this.peer.iceGatheringState !== 'complete') return;
          finish();
          resolve();
        };
        const timeout = setTimeout(() => {
          finish();
          reject(new Error('A preparação da rede demorou demais. Tente novamente.'));
        }, 12000);
        this.peer.addEventListener('icegatheringstatechange', onGather);
      });
    }
    const signal = this.peer.localDescription?.toJSON();
    if (!signal?.sdp || this.closed) throw new Error('A conexão foi encerrada.');
    return JSON.stringify({ ...signal, version: 1 });
  }

  private bindChannel(channel: RTCDataChannel): void {
    if (channel.label !== LABEL || this.channel || this.closed) {
      channel.close();
      return;
    }
    this.channel = channel;
    channel.onopen = () => this.report('Canal conectado. Você pode medir a latência.');
    channel.onclose = () => {
      if (this.closed) return;
      this.close();
      this.report('Conexão encerrada. Gere um novo convite para reconectar.');
    };
    channel.onmessage = ({ data }) => {
      if (this.closed || typeof data !== 'string' || data.length > 24) return;
      const ping = /^ping:(\d+)$/.exec(data);
      if (ping && channel.readyState === 'open' && channel.bufferedAmount < 4096) {
        channel.send(`pong:${ping[1]}`);
      } else if (data === `pong:${this.sequence}` && this.pingTimer) {
        clearTimeout(this.pingTimer);
        this.pingTimer = undefined;
        this.report(`Latência de ida e volta: ${Math.round(performance.now() - this.pingSentAt)} ms.`);
      }
    };
  }
}
