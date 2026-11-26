import { PeerLink, type PeerHealth } from '../net/PeerLink';

export function openPeerDiagnostic(onBack: () => void): void {
  const dialog = document.createElement('dialog');
  dialog.className = 'modal-card p2p-dialog';
  dialog.setAttribute('aria-labelledby', 'p2p-title');
  dialog.innerHTML = `
    <h2 id="p2p-title">Sala P2P — Maré Perdida</h2>
    <p>Gere um convite e envie a alguém de confiança. No outro navegador, cole o convite e gere uma resposta. Cole a resposta no primeiro navegador para conectar.</p>
    <p>Conexão direta para dois jogadores. Compartilhe os códigos somente com pessoas de confiança. Nesta versão, chat e diagnóstico funcionam na sala; o mundo ainda não é compartilhado.</p>
    <label for="p2p-input">Código recebido</label>
    <textarea id="p2p-input" rows="2" maxlength="16384" spellcheck="false"></textarea>
    <div class="p2p-actions">
      <button class="btn" id="p2p-offer">Gerar convite</button>
      <button class="btn" id="p2p-answer">Gerar resposta</button>
      <button class="btn" id="p2p-accept">Aplicar resposta</button>
    </div>
    <label for="p2p-output">Código para enviar</label>
    <textarea id="p2p-output" rows="2" readonly></textarea>
    <div class="p2p-actions">
      <button class="btn" id="p2p-copy">Copiar código</button><button class="btn" id="p2p-paste">Colar código</button><button class="btn" id="p2p-ping" disabled>Medir latência</button>
      <button class="btn" id="p2p-disconnect">Desconectar</button>
      <button class="btn" id="p2p-back">Voltar ao menu</button>
    </div>
    <p id="p2p-status" role="status">Aguardando convite.</p>
    <div id="p2p-health" style="padding:10px;border:1px solid #427383;border-radius:6px;font-size:.85em;line-height:1.6" aria-live="polite">Desconectado</div>
    <h3>Chat da sala</h3>
    <div id="p2p-chat-log" role="log" style="height:100px;overflow:auto;background:#102733;padding:8px;border-radius:4px"></div>
    <div style="display:flex;gap:6px"><input id="p2p-chat" maxlength="240" placeholder="Mensagem..." aria-label="Mensagem" style="min-width:0;flex:1" disabled><button class="btn primary" id="p2p-send" disabled>Enviar</button></div>
  `;
  document.body.appendChild(dialog);
  const input = dialog.querySelector<HTMLTextAreaElement>('#p2p-input')!;
  const output = dialog.querySelector<HTMLTextAreaElement>('#p2p-output')!;
  const status = dialog.querySelector<HTMLElement>('#p2p-status')!;
  const button = (id: string) => dialog.querySelector<HTMLButtonElement>(`#p2p-${id}`)!;
  const actions = ['offer', 'answer', 'accept'].map(button);
  const chat=dialog.querySelector<HTMLInputElement>('#p2p-chat')!;
  const log=dialog.querySelector<HTMLElement>('#p2p-chat-log')!;
  const health=dialog.querySelector<HTMLElement>('#p2p-health')!;
  const append=(who:string,message:string)=>{
    const row=document.createElement('div');row.textContent=who+': '+message;log.append(row);
    while(log.children.length>40)log.firstElementChild?.remove();
    log.scrollTop=log.scrollHeight;
  };
  const metrics=(h:PeerHealth)=>{
    const names={waiting:'Aguardando',connected:'Conectado',interrupted:'Reconectando',closed:'Desconectado',failed:'Falhou'};
    health.textContent=names[h.state]+' · RTT: '+(h.rtt===null?'—':h.rtt+' ms')+' · Variação: '+(h.jitter===null?'—':h.jitter+' ms')+' · Testes respondidos: '+h.received+'/'+h.sent+' · Sem resposta: '+h.timeouts;
    chat.disabled=button('send').disabled=button('ping').disabled=h.state!=='connected';
  };
  const report = (message: string) => { status.textContent = message; };
  let link: PeerLink | undefined;
  let operation = 0;
  let generation=0;

  function disconnect(): void {
    operation += 1;
    generation+=1;
    metrics({state:'closed',rtt:null,jitter:null,sent:0,received:0,timeouts:0});
    link?.close();
    link = undefined;
    input.value = '';
    output.value = '';
    actions.forEach((action) => { action.disabled = false; });
    report('Conexão encerrada. Gere um novo convite para reconectar.');
  }

  async function negotiate(kind: 'offer' | 'answer' | 'accept'): Promise<void> {
    const current = ++operation;
    actions.forEach((action) => { action.disabled = true; });
    report('Preparando conexão…');
    try {
      if (kind === 'accept') {
        if (!link) throw new Error('Gere um convite antes de aplicar a resposta.');
        await link.accept(input.value);
        if (current === operation && status.textContent === 'Preparando conexão…') {
          report('Aguardando conexão com o outro navegador.');
        }
      } else {
        const token=++generation;
        link?.close();
        metrics({state:'waiting',rtt:null,jitter:null,sent:0,received:0,timeouts:0});
        output.value = '';
        log.replaceChildren();
        link = new PeerLink(message=>{if(token===generation)report(message);},h=>{if(token===generation)metrics(h);},message=>{if(token===generation)append('Parceiro',message);});
        const code = kind === 'offer' ? await link.offer() : await link.answer(input.value);
        if (current !== operation) return;
        output.value = code;
        report(kind === 'offer' ? 'Envie o convite e aguarde a resposta.' : 'Envie a resposta ao navegador que criou o convite.');
      }
    } catch (error) {
      if (current !== operation) return;
      if (kind !== 'accept') {
        link?.close();
        link = undefined;
      }
      report(error instanceof Error ? error.message : 'Falha ao preparar a conexão.');
    } finally {
      if (current === operation) actions.forEach((action) => { action.disabled = false; });
    }
  }

  button('copy').onclick=async()=>{
    if(!output.value){report('Gere um código primeiro.');return;}
    try{await navigator.clipboard.writeText(output.value);report('Código copiado.');}
    catch{output.focus();output.select();report('Seleção pronta. Copie manualmente.');}
  };
  button('paste').onclick=async()=>{try{input.value=await navigator.clipboard.readText();report('Código colado.');}catch{input.focus();report('Cole o código manualmente.');}};
  const send=()=>{if(link?.sendChat(chat.value)){append('Você',chat.value.trim());chat.value='';}else if(chat.value.trim())report('Mensagem não enviada. Verifique a conexão.');};
  button('send').onclick=send;
  chat.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();send();}});
  button('offer').onclick = () => void negotiate('offer');
  button('answer').onclick = () => void negotiate('answer');
  button('accept').onclick = () => void negotiate('accept');
  button('ping').onclick = () => link ? link.ping() : report('Conecte os dois navegadores antes de medir.');
  button('disconnect').onclick = disconnect;
  button('back').onclick = () => dialog.close();
  dialog.addEventListener('close', () => {
    disconnect();
    dialog.remove();
    onBack();
  });
  dialog.showModal();
}
