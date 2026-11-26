(() => {
'use strict';
// Interface de bordo: aprimora o DOM original, sem substituir eventos ou regras do jogo.
const css=document.createElement('style');
css.id='mare-panels-v3-style';
css.textContent=`
#ui-root .modal-backdrop:has(#panel-body),#ui-root .modal-backdrop:has(#pm-resume){background:#03111de0;padding:clamp(8px,2vw,25px);}
#ui-root .modal-card:has(#panel-body){width:min(1140px,100%);height:min(780px,92dvh);max-height:92dvh;gap:0;padding:0;border:1px solid #528392;border-top:3px solid #83d5e5;border-radius:5px 19px 5px 5px;background:#091e2b;color:#e3f1f4;overflow:hidden;box-shadow:0 16px 45px #020c14aa;}
#ui-root .mare-panel-header{padding:16px 22px 12px;background:linear-gradient(110deg,#14394a,#0c2635);border-bottom:1px solid #80b5c133;display:flex;justify-content:space-between;gap:10px;align-items:center;}
.mare-panel-header strong{display:block;font-size:clamp(18px,2.4vw,29px);line-height:1.15;font-weight:800;letter-spacing:-.03em;}
.mare-panel-header small{display:block;font-size:10px;letter-spacing:.18em;color:#9acbd5;margin-bottom:6px;}
.mare-panel-header span{font-size:11px;color:#a8c9d2;text-align:right;}
#ui-root .modal-card:has(#panel-body) .modal-tabs{padding:9px 14px;gap:6px;flex-wrap:wrap;background:#0a202d;border-bottom:1px solid #6ea1ae40;}
#ui-root .modal-card:has(#panel-body) .tab-btn,#ui-root #panel-close{display:flex;align-items:center;justify-content:center;gap:5px;min-height:42px;padding:8px 13px;border-radius:3px 10px 3px 3px;background:#142f3e;border:1px solid #658e9b55;color:#cfe5e9;font-weight:650;font-size:.89em;}
#ui-root .modal-card:has(#panel-body) .tab-btn.active{background:#24586b;border-color:#8ad4e4;border-bottom:3px solid #9be9f3;color:#fff;}
#ui-root #panel-body{padding:16px 20px 22px;min-height:0;scrollbar-width:thin;scrollbar-color:#477d8b #0a2431;}
#ui-root #panel-body .grid-2{grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);gap:16px;align-items:start;}
#ui-root #panel-body .grid-2 > div{min-width:0;background:#0e2938;border:1px solid #6e9eaa30;border-radius:4px 12px 4px 4px;padding:14px;}
#ui-root #panel-body h3{margin:0 0 13px!important;font-size:1.12em;letter-spacing:.03em;color:#b6e8ef;border-bottom:1px solid #81b6c333;padding-bottom:10px;}
#ui-root #panel-body .inv-grid{grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;}
#ui-root #panel-body [data-slot]{height:clamp(54px,6.1vw,80px)!important;min-width:0;background:linear-gradient(145deg,#1e4150,#102d3b);border:1px solid #739fac60;border-radius:3px 10px 3px 3px;font-size:1.5em;position:relative;cursor:pointer;}
#ui-root #panel-body [data-slot][title="Vazio"]{background:#0b2532;border-style:dashed;opacity:.75;}
#ui-root #panel-body [data-slot]:nth-child(-n+8){border-bottom:3px solid #4d9eb5;}
#ui-root #panel-body .slot-key{top:4px;left:5px;font-size:9px;color:#b1d2da;}
#ui-root #panel-body .slot-count{font-size:11px;bottom:4px;right:4px;background:#081c28;padding:2px 4px;border-radius:3px;}
#ui-root #panel-body .game-icon.icon-item{width:36px;height:36px;max-width:100%;}
#ui-root #panel-body .recipe-row{background:#12303e;border:1px solid #709ba741;border-left:3px solid #527d8d;border-radius:3px 10px 3px 3px;padding:12px;gap:10px;margin:0 0 8px;align-items:center;min-width:0;overflow-wrap:anywhere;}
#ui-root #panel-body .recipe-row > div{min-width:0;line-height:1.5;}
#ui-root #panel-body .recipe-row strong{color:#e2f4f6;font-size:1.02em;}
#ui-root #panel-body .recipe-row:has(button:enabled){border-left-color:#75d8b1;}
#ui-root #panel-body .recipe-row:has(button:disabled){border-left-color:#657581;}
#ui-root #panel-body .btn,#ui-root .modal-card:has(#pm-resume) .btn{border:1px solid #6c9daa80;border-radius:3px 9px 3px 3px;background:#163847;color:#e0f1f4;font-weight:650;min-height:40px;padding:9px 13px;cursor:pointer;}
#ui-root #panel-body .btn.primary,#ui-root .modal-card:has(#pm-resume) .btn.primary{background:#1b6476;border-color:#8bdaea;color:white;}
#ui-root #panel-body .btn:disabled{background:#142a35;color:#9db3bc;opacity:.66;cursor:not-allowed;}
#ui-root .modal-card:has(#panel-body) :is(button,input,select,[data-slot]):focus-visible{outline:2px solid #9ce7ef;outline-offset:2px;}
#ui-root #panel-body .mare-filter{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 13px;align-items:center;}
#ui-root #panel-body .mare-filter input{flex:1 1 160px;min-width:0;height:40px;border:1px solid #659bab80;background:#071e2b;border-radius:4px;color:#e8f4f6;padding:7px 10px;font:inherit;user-select:text;}
#ui-root #panel-body .mare-filter input::placeholder{color:#9dbbc5;}
#ui-root #panel-body .mare-filter button{min-height:40px;padding:7px 10px;font:600 .86em system-ui;color:#c5e0e5;border:1px solid #6697a35e;background:#102c3b;border-radius:3px 7px 3px 3px;cursor:pointer;}
#ui-root #panel-body .mare-filter button[aria-pressed="true"]{background:#23596a;border-color:#91dce8;color:white;}
#ui-root #panel-body .mare-count{font-size:.78em;color:#a6c6d0;margin:0 0 9px;}
#ui-root #panel-body .mare-empty{color:#abc8d0;background:#0b2432;padding:18px;border:1px dashed #567b89;border-radius:5px;text-align:center;}
#ui-root #panel-body .mare-filtered{display:none!important;}
#ui-root #panel-body .mare-ready-label{display:inline-block;font-size:10px;letter-spacing:.06em;color:#93debc;margin-top:5px;}
#ui-root #panel-body .mare-ready-label.is-blocked{color:#d1b994;}
#ui-root #panel-body .mare-occupied{font-size:.8em;color:#a8d4dc;margin:10px 0 7px;}
#ui-root #panel-body .mare-occupancy{height:5px;background:#47606c55;border-radius:2px;overflow:hidden;margin-bottom:12px;}
#ui-root #panel-body .mare-occupancy i{display:block;background:#78c9db;height:100%;}
#ui-root #panel-body .mare-quest-stats{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px!important;}
#ui-root #panel-body .mare-quest-stats span{padding:11px;background:#173b49;border:1px solid #709ba741;border-radius:4px;overflow-wrap:anywhere;}
#ui-root #panel-body .mare-status{font-size:11px!important;padding:5px 8px;border-radius:3px;border:1px solid #6a8e9d88;background:#0b2431;color:#c0d4db;flex:none;}
#ui-root #panel-body .mare-status[data-state="ativa"]{border-color:#e3bc6c;color:#f8dc9c;}
#ui-root #panel-body .mare-status[data-state="concluida"]{border-color:#6dd6a0;color:#b1f1ce;}
#ui-root #panel-body .mare-status[data-state="bloqueada"]{color:#a8b9c0;}
#ui-root #panel-body label:has(input[type="range"]),#ui-root #panel-body label:has(select){padding:10px 0;border-bottom:1px solid #89b9c12a;color:#d7e9ed;}
#ui-root #panel-body input[type="range"]{accent-color:#7ed2e4;height:24px;cursor:pointer;}
#ui-root #panel-body input[type="checkbox"]{accent-color:#7ed2e4;width:18px;height:18px;vertical-align:middle;}
#ui-root #panel-body select{max-width:100%;}
#ui-root .modal-card:has(#pm-resume){padding:22px;background:#0a2533;border-top:3px solid #7ed2e4;border-radius:4px 15px 4px 4px;gap:10px;}
#ui-root .modal-card:has(#pm-resume) h2{font-size:25px;color:#d3f0f5;padding-bottom:9px;}
.high-contrast #ui-root .modal-card:has(#panel-body){background:#000;border-color:white;}
.high-contrast #ui-root #panel-body :is(.recipe-row,.grid-2>div,[data-slot],.btn){background:#000;border-color:white;color:white;}
@media(max-width:740px){
#ui-root .modal-card:has(#panel-body){height:94dvh;max-height:94dvh;}
#ui-root .mare-panel-header{padding:10px 12px;}
#ui-root .mare-panel-header span{display:none;}
#ui-root .modal-card:has(#panel-body) .modal-tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:6px 8px;}
#ui-root .modal-card:has(#panel-body) .tab-btn,#ui-root #panel-close{min-height:38px;font-size:.79em;padding:6px;margin:0!important;}
#ui-root #panel-close{grid-column:1/-1;min-height:32px;}
#ui-root #panel-body{padding:10px;}
#ui-root #panel-body .grid-2{grid-template-columns:1fr;gap:10px;}
#ui-root #panel-body .grid-2>div{padding:10px;}
#ui-root #panel-body .recipe-row{padding:9px;}
#ui-root #panel-body .mare-quest-stats{grid-template-columns:1fr 1fr;}
#ui-root #panel-body [data-slot]{height:55px!important;}
}
@media(max-height:480px) and (orientation:landscape){
#ui-root .mare-panel-header{padding:6px 12px;}
#ui-root .mare-panel-header small{display:none;}
#ui-root .mare-panel-header strong{font-size:18px;}
#ui-root .modal-card:has(#panel-body) .modal-tabs{display:flex;padding:5px;}
#ui-root .modal-card:has(#panel-body) .tab-btn,#ui-root #panel-close{min-height:32px;padding:5px 8px;}
#ui-root #panel-body{padding:8px;}
}

/* Inventário: organização por seleção, arrastar e soltar e toque. */
#ui-root #panel-body .inv-grid{grid-template-columns:repeat(4,minmax(0,1fr));}
#ui-root #panel-body [data-slot]{touch-action:manipulation;user-select:none;}
#ui-root #panel-body [data-slot].mare-slot-picked{opacity:1;border:2px solid #a5f4ff;background:#245d70;box-shadow:inset 0 0 0 2px #0b2936;}
#ui-root #panel-body [data-slot].mare-slot-target{border:2px dashed #9cebc3;background:#25584d;}
#ui-root #panel-body .mare-inventory-actions{margin-top:12px;padding:10px;border:1px solid #6e9eaa55;background:#091f2d;border-radius:4px 10px 4px 4px;}
#ui-root #panel-body .mare-inventory-hint{font-size:.82em;line-height:1.45;color:#d0e8ed;margin-bottom:9px;}
#ui-root #panel-body .mare-inventory-buttons{display:flex;flex-wrap:wrap;gap:6px;}
#ui-root #panel-body .mare-inventory-buttons .btn{flex:1 1 auto;min-height:40px;padding:8px;font-size:.82em;}

/* Mochila V2: barra rápida separada, nomes, filtros e durabilidade. */
#ui-root #panel-body .mare-inv-filter{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0;}
#ui-root #panel-body .mare-inv-filter input,#ui-root #panel-body .mare-inv-filter select{min-width:0;flex:1;padding:8px;background:#0b2433;color:#e3f1f4;border:1px solid #507c8a;border-radius:5px;font-size:12px;}
#ui-root #panel-body .inv-grid.mare-inv-layout{display:block;}
#ui-root #panel-body .mare-inv-layout h4{font-size:11px;letter-spacing:.08em;text-transform:uppercase;margin:12px 0 6px;color:#a5d9e4;}
#ui-root #panel-body .mare-slot-section{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;}
#ui-root #panel-body .mare-inv-tile{width:100%;height:84px!important;min-width:0;position:relative;padding:5px 3px 13px;display:flex;align-items:center;justify-content:center;flex-direction:column;}
#ui-root #panel-body .mare-inv-tile .slot-art{margin:0 0 8px;}
#ui-root #panel-body .mare-item-name{position:absolute;bottom:4px;left:3px;right:3px;text-align:center;font-size:10px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#dbedf2;}
#ui-root #panel-body .mare-item-condition{position:absolute;bottom:17px;left:10%;right:10%;height:3px;background:#101d24;border-radius:4px;overflow:hidden;}
#ui-root #panel-body .mare-item-condition i{display:block;height:100%;background:#8be0ad;}
#ui-root #panel-body .mare-equipped{outline:2px solid #d6b56e;outline-offset:-3px;}
#ui-root #panel-body .mare-slot-muted:not(.mare-slot-picked){opacity:.34;}
#ui-root #panel-body .mare-item-detail{color:#b2d5dc;font-size:12px;line-height:1.45;margin-bottom:10px;}
@media(max-width:420px){#ui-root #panel-body .mare-inv-tile{height:72px!important;}#ui-root #panel-body .mare-item-name{font-size:9px;}#ui-root #panel-body .mare-slot-section{gap:4px;}}
`;
document.head.append(css);
const state={mochila:{q:'',filter:'all'},construcao:{q:'',filter:'all'},diario:{q:'',filter:'all'}};
const titles={mochila:['Mochila & Fabricação','Recursos, ferramentas e suprimentos'],construcao:['Construção naval','Expanda e proteja sua jangada'],diario:['Diário de bordo','Missões, progresso e reputação'],opcoes:['Configurações','Acessibilidade, controles e salvamento']};
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function enhance(body){
 if(body.dataset.mareEnhanced)return;
 const card=body.closest('.modal-card'),tab=card?.querySelector('[data-t].active')?.getAttribute('data-t');
 if(!tab||!titles[tab]||!body.children.length)return;
 body.dataset.mareEnhanced='1';
 const header=document.createElement('div');header.className='mare-panel-header';
 header.innerHTML='<div><small>MARÉ PERDIDA / SISTEMA DE BORDO</small><strong>'+titles[tab][0]+'</strong></div><span>'+titles[tab][1]+'</span>';
 card.prepend(header);
 if(tab==='opcoes')return;
 const grid=body.querySelector('.inv-grid');
 if(grid){const slots=[...grid.querySelectorAll('[data-slot]')],used=slots.filter(s=>s.title!=='Vazio').length;
 const txt=document.createElement('div');txt.className='mare-occupied';txt.textContent=used+' / '+slots.length+' espaços ocupados · azul: barra rápida';
 const bar=document.createElement('div');bar.className='mare-occupancy';const fill=document.createElement('i');fill.style.width=(slots.length?used/slots.length*100:0)+'%';bar.append(fill);grid.before(txt,bar);}
 const rows=[...body.querySelectorAll('.recipe-row')];
 if(!rows.length)return;
 const target=tab==='mochila'?rows[0].parentElement:body;
 if(tab==='diario'){const stats=body.firstElementChild;if(stats&&!stats.classList.contains('recipe-row'))stats.classList.add('mare-quest-stats');}
 const f=document.createElement('div');f.className='mare-filter';
 const search=document.createElement('input');search.type='search';search.placeholder=tab==='diario'?'Buscar missão...':'Buscar receita ou material...';search.setAttribute('aria-label',search.placeholder);search.value=state[tab].q;f.append(search);
 const opts=tab==='diario'?[['all','Todas'],['ativa','Ativas'],['concluida','Concluídas'],['bloqueada','Bloqueadas']]:[['all','Todas'],['ready','Disponíveis'],['blocked','Indisponíveis']];
 const controls=[];
 for(const [key,label] of opts){const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-pressed',String(state[tab].filter===key));b.addEventListener('click',()=>{state[tab].filter=key;apply();});controls.push([key,b]);f.append(b);}
 const count=document.createElement('div');count.className='mare-count';count.setAttribute('aria-live','polite');
 const empty=document.createElement('div');empty.className='mare-empty';empty.textContent='Nenhum resultado encontrado.';empty.hidden=true;
 const entries=rows.map(row=>{
   let kind='all';
   if(tab==='diario'){const status=row.lastElementChild;if(status&&status.tagName==='SPAN'){const t=normalize(status.textContent||'');kind=t.includes('concluida')?'concluida':t.includes('bloqueada')?'bloqueada':'ativa';status.classList.add('mare-status');status.dataset.state=kind;}}
   else{const btn=row.querySelector('button');if(btn){kind=btn.disabled?'blocked':'ready';const tag=document.createElement('span');tag.className='mare-ready-label'+(btn.disabled?' is-blocked':'');tag.textContent=btn.disabled?'REQUISITOS PENDENTES':'PRONTO PARA '+(tab==='mochila'?'FABRICAR':'CONSTRUIR');row.firstElementChild?.append(tag);}}
   return {row,kind,text:normalize(row.textContent||'')};
 });
 rows[0].before(f,count);target.append(empty);
 function apply(){const q=normalize(state[tab].q),filter=state[tab].filter;let n=0;for(const e of entries){const show=(!q||e.text.includes(q))&&(filter==='all'||e.kind===filter);e.row.classList.toggle('mare-filtered',!show);if(show)n++;}
 for(const [k,b] of controls)b.setAttribute('aria-pressed',String(k===filter));
 count.textContent=n+' de '+entries.length+(tab==='diario'?' missões':' receitas');empty.hidden=n!==0;}
 search.addEventListener('input',()=>{state[tab].q=search.value;apply();});apply();
}
const root=document.getElementById('ui-root');if(!root)return;
// Observa somente a troca de conteúdo dos modais, não os updates constantes da HUD.
const observed=new WeakSet();
const observer=new MutationObserver(()=>{for(const b of root.querySelectorAll('.modal-backdrop #panel-body'))enhance(b);});
function connect(){for(const modal of root.querySelectorAll(':scope > .modal-backdrop')){if(observed.has(modal))continue;observed.add(modal);observer.observe(modal,{childList:true});}for(const b of root.querySelectorAll('.modal-backdrop #panel-body'))enhance(b);}
new MutationObserver(connect).observe(root,{childList:true});connect();
})();