/* Maré Perdida — menu cinematográfico. Progressive enhancement: preserva os handlers do jogo. */
(() => {
  'use strict';
  const css = document.createElement('style');
  css.id = 'mare-menu-v2-style';
  css.textContent = `
.mare-menu-v2.modal-backdrop {display:block; overflow:auto; background:#071923; color:#edf5f7; z-index:30; font:16px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif; isolation:isolate;}
.mare-menu-v2 .mare-scene {position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:-2;object-fit:cover;}
.mare-menu-v2 .mare-shade {position:fixed;inset:0;z-index:-1;pointer-events:none;background:linear-gradient(90deg,rgba(3,14,22,.95),rgba(4,19,29,.62) 32%,rgba(4,19,29,.08) 66%),linear-gradient(0deg,rgba(3,12,20,.92),transparent 30%,rgba(3,12,20,.32));}
.mare-menu-v2 .mare-shell {min-height:100%;min-height:100dvh;max-width:1800px;margin:auto;padding:clamp(22px,4.2vw,72px);display:grid;grid-template-columns:minmax(250px, .78fr) minmax(0,1.45fr);grid-template-rows:auto 1fr auto;column-gap:clamp(28px,6vw,100px);row-gap:22px;align-items:center;}
.mare-menu-v2 .mare-top {grid-column:1/-1;display:flex;justify-content:space-between;align-items:center;gap:12px;letter-spacing:.18em;text-transform:uppercase;font-size:10px;font-weight:700;color:#9ec1cd;}
.mare-menu-v2 .mare-top span:first-child{display:flex;align-items:center;gap:9px}
.mare-menu-v2 .mare-top span:first-child:before{content:"";width:8px;height:8px;border:1px solid #75d9ed;transform:rotate(45deg)}
.mare-menu-v2 .mare-nav{grid-column:1;grid-row:2;align-self:center;min-width:0;display:flex;flex-direction:column;gap:9px;padding:20px 0;position:relative;}
.mare-menu-v2 .mare-nav-label{color:#89c6d5;letter-spacing:.22em;font-size:10px;font-weight:700;margin-bottom:8px;text-transform:uppercase}
.mare-menu-v2 .mare-action{font:600 clamp(14px,1.4vw,19px)/1.2 system-ui,sans-serif;color:#e9f2f6;display:flex;align-items:center;gap:14px;width:100%;min-height:54px;text-align:left;border:1px solid rgba(142,200,219,.20);border-left:2px solid #42778a;border-radius:2px 13px 2px 2px;padding:13px 15px;background:linear-gradient(100deg,rgba(12,39,53,.93),rgba(13,38,52,.65));cursor:pointer;transition:background .16s,border-color .16s;box-shadow:none;}
.mare-menu-v2 .mare-action svg{width:23px;height:23px;flex:none;color:#92d5e5}
.mare-menu-v2 .mare-action .mare-arrow{margin-left:auto;font-size:18px;color:#8abac8}
.mare-menu-v2 .mare-action:hover,.mare-menu-v2 .mare-action:focus-visible{background:#17495d;border-color:#8ad8e7;outline:2px solid #b3edfa;outline-offset:3px;}
.mare-menu-v2 .mare-action.mare-primary{background:linear-gradient(110deg,#136a88,#12485c);border-color:#76e1f4;border-left:4px solid #a3f1ff;box-shadow:0 0 22px rgba(44,186,218,.15);}
.mare-menu-v2 .mare-action:disabled{opacity:.48;cursor:not-allowed;outline:none}
.mare-menu-v2 .mare-difficulties{display:grid;gap:6px;padding:3px 0 7px 12px;border-left:1px solid #588797;margin-left:7px;}
.mare-menu-v2 .mare-difficulties .mare-action{min-height:48px;font-size:14px;padding:10px;}
.mare-menu-v2 .mare-action small{display:block;font-size:11px;font-weight:400;color:#b2c9d2;margin-top:4px;}
.mare-menu-v2 .mare-hero{grid-column:2;grid-row:2;align-self:center;max-width:760px;text-shadow:0 3px 22px #031019;}
.mare-menu-v2 .mare-emblem{width:clamp(58px,7vw,100px);height:auto;color:#cbe7ea;display:block;margin-bottom:18px;}
.mare-menu-v2 .mare-kicker{font-size:clamp(10px,1vw,13px);letter-spacing:.34em;color:#a3d5df;font-weight:700;text-transform:uppercase;}
.mare-menu-v2 h1{font-size:clamp(40px,6.1vw,105px);font-weight:900;letter-spacing:-.055em;line-height:.93;margin:12px 0 16px;color:#f0f3ed;text-transform:uppercase;text-wrap:balance;}
.mare-menu-v2 .mare-chapter{display:flex;align-items:center;gap:11px;font-size:clamp(13px,1.6vw,21px);color:#d3e5e9;font-weight:500;}
.mare-menu-v2 .mare-chapter:before{content:"";width:30px;height:2px;background:#80d9eb;flex:none}
.mare-menu-v2 .mare-intro{font-size:clamp(14px,1.45vw,19px);line-height:1.65;max-width:510px;color:#d0e0e3;margin:25px 0 0;border-left:2px solid #5fc5da;padding-left:17px;}
.mare-menu-v2 .mare-footer{grid-column:1/-1;border-top:1px solid rgba(178,220,232,.25);display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;padding-top:15px;font-size:12px;color:#b9d2da;}
.mare-menu-v2 .mare-keys{display:flex;gap:8px 13px;flex-wrap:wrap;align-items:center}
.mare-menu-v2 kbd{font:600 11px system-ui,sans-serif;padding:3px 6px;border:1px solid #577d8b;border-radius:3px;color:#e2f1f4;margin-right:4px}
.mare-menu-v2 .mare-footbrand{font-size:10px;letter-spacing:.16em;color:#8aafbd}
.mare-menu-v2 .mare-hidden,.mare-menu-v2 [hidden]{display:none!important}
.high-contrast .mare-menu-v2 .mare-shade{background:rgba(0,0,0,.88)}
.high-contrast .mare-menu-v2 .mare-action{background:#000;border-color:white;color:white}
#ui-root:has(.mare-menu-v2:not(.hidden)) .toast-stack {z-index:31;pointer-events:none;}
@media(max-width:760px){.mare-menu-v2 .mare-shell{display:flex;flex-direction:column;align-items:stretch;justify-content:center;gap:18px;padding:22px max(18px,env(safe-area-inset-left)) max(20px,env(safe-area-inset-bottom));}.mare-menu-v2 .mare-hero{order:1;align-self:stretch}.mare-menu-v2 .mare-top{order:0}.mare-menu-v2 .mare-nav{order:2;padding:0;align-self:stretch}.mare-menu-v2 .mare-footer{order:3}.mare-menu-v2 .mare-emblem{width:46px;margin-bottom:8px}.mare-menu-v2 h1{font-size:clamp(38px,10vw,64px);margin:8px 0}.mare-menu-v2 .mare-intro{margin:12px 0 0;font-size:14px;line-height:1.45}.mare-menu-v2 .mare-action{min-height:48px}.mare-menu-v2 .mare-shade{background:linear-gradient(0deg,#03131e 4%,rgba(4,20,30,.89) 54%,rgba(4,20,30,.48));}.mare-menu-v2 .mare-keys{display:none;}}
@media(max-height:520px) and (min-width:761px){.mare-menu-v2 .mare-shell{padding:15px 32px;gap:10px 35px;}.mare-menu-v2 .mare-nav{padding:0;gap:5px}.mare-menu-v2 .mare-action{min-height:39px;padding:7px 10px;font-size:14px}.mare-menu-v2 .mare-emblem{width:44px;margin:0}.mare-menu-v2 h1{font-size:52px;margin:7px 0}.mare-menu-v2 .mare-intro{margin-top:10px;font-size:13px}.mare-menu-v2 .mare-footer{padding-top:7px}}
@media(prefers-reduced-motion:reduce){.mare-menu-v2 .mare-action{transition:none}}
`;
  document.head.append(css);
  const icons = {
    play:'<path d="m8 5 12 7-12 7z"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    folder:'<path d="M3 7h7l2 3h9v10H3z"/>',
    peer:'<circle cx="6" cy="12" r="3"/><circle cx="18" cy="5" r="3"/><circle cx="18" cy="19" r="3"/><path d="m9 10 6-4m-6 8 6 4"/>',
    book:'<path d="M12 5v15M3 5c4-1 6 0 9 2 3-2 5-3 9-2v13c-4-1-6 0-9 2-3-2-5-3-9-2z"/>',
    compass:'<circle cx="12" cy="12" r="9"/><path d="m15 9-2 5-4 1 2-5z"/>',
    hard:'<path d="M12 3 2 20h20zM12 9v5m0 3v.5"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3v.5"/>'
  };
  function icon(name) {return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">'+icons[name]+'</svg>';}
  function styleButton(btn,name,label,desc) {
    btn.className='mare-action';
    btn.innerHTML=icon(name)+'<span>'+label+(desc?'<small>'+desc+'</small>':'')+'</span><span class="mare-arrow" aria-hidden="true">›</span>';
    return btn;
  }
  function button(name,label,desc) {const b=document.createElement('button');b.type='button';return styleButton(b,name,label,desc);}
  function scene() {return '<svg class="mare-scene" aria-hidden="true" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">'+
    '<defs><linearGradient id="mp-sky" x2=".15" y2="1"><stop stop-color="#071b2d"/><stop offset=".48" stop-color="#244457"/><stop offset=".73" stop-color="#9b7770"/><stop offset="1" stop-color="#ebad73"/></linearGradient><linearGradient id="mp-sea" x2=".1" y2="1"><stop stop-color="#315568"/><stop offset=".28" stop-color="#193c50"/><stop offset="1" stop-color="#061724"/></linearGradient><radialGradient id="mp-glow"><stop stop-color="#ffc493" stop-opacity=".75"/><stop offset="1" stop-color="#d58b66" stop-opacity="0"/></radialGradient><linearGradient id="mp-ship" x2="0" y2="1"><stop stop-color="#34424a"/><stop offset="1" stop-color="#10232b"/></linearGradient><linearGradient id="mp-sheen" x2="1" y2="0"><stop stop-color="#e9a675" stop-opacity="0"/><stop offset=".5" stop-color="#edbe9b" stop-opacity=".65"/><stop offset="1" stop-color="#e9a675" stop-opacity="0"/></linearGradient></defs>'+
    '<rect width="1600" height="530" fill="url(#mp-sky)"/><ellipse cx="1040" cy="470" rx="600" ry="225" fill="url(#mp-glow)"/><circle cx="1030" cy="466" r="40" fill="#f4bc85" opacity=".88"/>'+
    '<g fill="#0c2232" opacity=".65"><path d="M0 0H1600V70Q1480 48 1360 107T1050 92Q930 64 770 134T440 108Q260 63 0 160Z"/><path d="M0 218Q200 150 378 205T710 213Q884 150 1040 197T1600 175V238Q1400 227 1240 251T950 238Q750 282 570 248T0 280Z"/><path d="M0 345Q215 282 420 323T800 331L937 346Q680 376 400 362T0 391Z" opacity=".54"/></g>'+
    '<g fill="#334c58" opacity=".58"><path d="M0 509l85-36 52 9 62-70 43 34 45-22 91 72 82 13z"/><path d="m1200 509 68-22 55-46 27 20 45-33 71 64 134 17z"/></g>'+
    '<rect y="512" width="1600" height="388" fill="url(#mp-sea)"/><g transform="translate(1200 438) rotate(-8)" fill="url(#mp-ship)" stroke="#152b35" stroke-width="3"><path d="M-95 39h355l-42 65H-57z"/><path d="M-18 39V7h132v32M10 7v-20h66V7M158 39V-10h11v49M164-10v-69M150-62h61M-52 39v-27M-65 15h54" stroke-linejoin="round"/><path d="M-70 37 243 37M-5 18h14m15 0h14m15 0h14m15 0h14" fill="none" stroke="#65727a" stroke-width="3"/></g>'+
    '<g stroke="#b6b9ae" opacity=".11"><path d="M0 523h1600M0 539h1600M0 550h1600"/></g>'+
    '<g fill="none" stroke-linecap="round">';
  }
  function artwork(){
    let s=scene();
    // Ondas desenhadas em perspectiva, com semente fixa e sem filtros caros.
    let state=2089;
    function rand(){state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;}
    for(let i=0;i<115;i++){const t=rand(),y=520+380*t*t,x=rand()*1750-90,w=20+rand()*(35+200*t),h=1+8*t;const col=i%5===0?'#a0bfca':'#58869b';s+='<path d="M'+x.toFixed(1)+' '+y.toFixed(1)+'q'+(w*.45).toFixed(1)+' '+(-h).toFixed(1)+' '+w.toFixed(1)+' 0" stroke="'+col+'" stroke-width="'+(.5+1.8*t).toFixed(1)+'" opacity="'+(.10+rand()*.29).toFixed(2)+'"/>';}
    for(let i=0;i<18;i++){let y=523+i*i*.93,w=24+i*8;s+='<path d="M'+(1030-w)+' '+y+'h'+(w*2)+'" stroke="url(#mp-sheen)" stroke-width="'+(1+i*.22)+'" opacity=".68"/>';}
    return s+'</g><path d="M0 822Q220 760 430 811L535 900H0Z" fill="#111b20" stroke="#384342" stroke-width="4"/><path d="M0 855 461 845M0 882l500-10M86 805l44 95M198 787l60 113" fill="none" stroke="#58605a" stroke-width="5" opacity=".52"/><g transform="translate(95 765)"><ellipse cy="12" rx="75" ry="48" fill="#e59a51" opacity=".09"/><path d="M-20 22h40l-5-52h-30z" fill="#df9950" stroke="#111b20" stroke-width="6"/><path d="M-25-30h50l-9-9h-32zM-24 24h48v8h-48z" fill="#1c2829"/><path d="M-9-25v43m18-43v43M-14-41q14-25 28 0" stroke="#203234" stroke-width="4" fill="none"/></g></svg>';
  }
  const emblem='<svg class="mare-emblem" aria-hidden="true" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="50" cy="48" r="35" stroke-dasharray="156 18"/><path d="M50 10v60m0-60-7 13m7-13 7 13M33 28v23q0 10 17 10 17 0 17-10V28m-34 0-6 11m6-11 6 11m28-11-6 11m6-11 6 11M9 77q20-10 41 0t41 0M15 87q17-8 35 0t35 0" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function upgrade(backdrop){
    if(backdrop.classList.contains('mare-menu-v2')) return false;
    const normal=backdrop.querySelector('#mm-new-normal'),story=backdrop.querySelector('#mm-new-story'),hard=backdrop.querySelector('#mm-new-hard'),p2p=backdrop.querySelector('#mm-p2p'),input=backdrop.querySelector('#mm-import');
    if(!normal||!story||!hard||!p2p||!input)return false;
    const cont=backdrop.querySelector('#mm-continue');
    const shell=document.createElement('main');shell.className='mare-shell';shell.setAttribute('aria-label','Menu principal de Maré Perdida');
    shell.innerHTML='<header class="mare-top"><span>Maré Perdida / Sobrevivência</span><span>2089 · O Último Horizonte</span></header><nav class="mare-nav" aria-label="Menu principal"><div class="mare-nav-label">Sua jornada</div></nav><section class="mare-hero">'+emblem+'<div class="mare-kicker">O mundo que restou</div><h1>Maré<br>Perdida</h1><div class="mare-chapter">Capítulo 1 — Mar dos Destroços</div><p class="mare-intro">Ano 2089. Construa sua jangada, recupere recursos do oceano, purifique água e siga o sinal de Lia. Enfrente Mandíbula Branca e descubra os segredos do último horizonte.</p></section><footer class="mare-footer"><div class="mare-keys"><span><kbd>WASD</kbd>Andar</span><span><kbd>Espaço</kbd>Pular / nadar</span><span><kbd>F</kbd>Ferramenta</span><span><kbd>E</kbd>Interagir</span><span><kbd>B</kbd>Construir</span><span><kbd>I</kbd>Mochila</span><span><kbd>J</kbd>Diário</span><span><kbd>V</kbd>Câmera</span></div><span class="mare-footbrand">MARÉ PERDIDA · MENU PRINCIPAL</span></footer>';
    const nav=shell.querySelector('.mare-nav');
    if(cont){styleButton(cont,'play','Continuar','Retomar mundo salvo');cont.classList.add('mare-primary');nav.append(cont);}
    const fresh=button('plus','Novo jogo','Começar uma nova jornada');
    if(!cont)fresh.classList.add('mare-primary');
    const choices=document.createElement('div');choices.className='mare-difficulties';choices.id='mare-difficulties';choices.hidden=true;
    fresh.setAttribute('aria-expanded','false');fresh.setAttribute('aria-controls',choices.id);
    fresh.addEventListener('click',()=>{choices.hidden=!choices.hidden;fresh.setAttribute('aria-expanded',String(!choices.hidden));if(!choices.hidden)normal.focus();});
    styleButton(normal,'compass','Normal','Sobrevivência equilibrada');styleButton(story,'book','História','Priorize a narrativa');styleButton(hard,'hard','Difícil','Um desafio maior');
    choices.append(normal,story,hard);nav.append(fresh,choices);
    const load=button('folder','Carregar save','Importar arquivo .json');input.hidden=true;load.addEventListener('click',()=>{input.value='';input.click();});nav.append(load,input);
    styleButton(p2p,'peer','Multiplayer / P2P','Testar conexão entre jogadores');nav.append(p2p);
    const help=button('help','Como jogar','Controles e dicas');
    const tips=document.createElement('div');tips.id='mare-help';tips.className='mare-difficulties';tips.hidden=true;tips.textContent='WASD: andar · Espaço: pular/nadar · Clique/F: usar ferramenta · E: interagir · B: construir · I: mochila · J: diário · V: câmera. No celular, use os controles na tela.';
    help.setAttribute('aria-expanded','false');help.setAttribute('aria-controls',tips.id);help.addEventListener('click',()=>{tips.hidden=!tips.hidden;help.setAttribute('aria-expanded',String(!tips.hidden));});nav.append(help,tips);
    backdrop.classList.add('mare-menu-v2');backdrop.innerHTML=artwork()+'<div class="mare-shade" aria-hidden="true"></div>';backdrop.append(shell);
    // Reutiliza os elementos originais: seus listeners continuam vinculados.
    return true;
  }
  const root=document.getElementById('ui-root');if(!root)return;
  const observed=new Set();
  const observer=new MutationObserver(scan);
  function scan(){
    for(const node of root.querySelectorAll(':scope > .modal-backdrop')){
      if(upgrade(node)){observer.disconnect();return;}
      if(!observed.has(node)){observed.add(node);observer.observe(node,{childList:true});}
    }
  }
  observer.observe(root,{childList:true});scan();
  // O backdrop é reutilizado pelo jogo para pausa; remova o estilo exclusivo assim que trocar o conteúdo.
  const pauseObserver=new MutationObserver(()=>{for(const node of root.querySelectorAll('.mare-menu-v2')){if(!node.querySelector('.mare-shell'))node.classList.remove('mare-menu-v2');}});
  function watchPause(){for(const node of root.querySelectorAll(':scope > .modal-backdrop'))pauseObserver.observe(node,{childList:true});}
  watchPause();const rootObserver=new MutationObserver(watchPause);rootObserver.observe(root,{childList:true});
})();
