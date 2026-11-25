import { PeerLink } from '../net/PeerLink';

export function openPeerDiagnostic(onBack: () => void): void {
  const dialog = document.createElement('dialog');
  dialog.className = 'modal-card p2p-dialog';
  dialog.setAttribute('aria-labelledby', 'p2p-title');
  dialog.innerHTML = `
    <h2 id="p2p-title">Teste de conexão P2P</h2>
    <p>Gere um convite e envie a alguém de confiança. No outro navegador, cole o convite e gere uma resposta. Cole a resposta no primeiro navegador para conectar.</p>
    <p>O teste usa STUN para descobrir endereços de rede. Os códigos podem conter esses endereços. O teste mede a conexão entre os navegadores, sem compartilhar o mundo.</p>
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
      <button class="btn" id="p2p-ping">Medir latência</button>
      <button class="btn" id="p2p-disconnect">Desconectar</button>
      <button class="btn" id="p2p-back">Voltar ao menu</button>
    </div>
    <p id="p2p-status" role="status">Aguardando convite.</p>
  `;
  document.body.appendChild(dialog);
  const input = dialog.querySelector<HTMLTextAreaElement>('#p2p-input')!;
  const output = dialog.querySelector<HTMLTextAreaElement>('#p2p-output')!;
  const status = dialog.querySelector<HTMLElement>('#p2p-status')!;
  const button = (id: string) => dialog.querySelector<HTMLButtonElement>(`#p2p-${id}`)!;
  const actions = ['offer', 'answer', 'accept'].map(button);
  const report = (message: string) => { status.textContent = message; };
  let link: PeerLink | undefined;
  let operation = 0;

  function disconnect(): void {
    operation += 1;
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
        link?.close();
        output.value = '';
        link = new PeerLink(report);
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
