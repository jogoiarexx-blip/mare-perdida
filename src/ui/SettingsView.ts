import { DEFAULT_OPTIONS,type GameOptions } from '../save/Store';
import {gameIcon} from './Icons';
export function renderSettings(root:Element,initial:GameOptions,onChange:(options:GameOptions)=>void):void{
 let o={...initial};
 const range=(id:string,title:string,value:number,min:number,max:number,step:number,format:(n:number)=>string)=>`<label class="settings-field" for="opt-${id}"><span>${title}<output id="opt-${id}-value">${format(value)}</output></span><input id="opt-${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;
 const check=(id:string,title:string,on:boolean)=>`<label class="settings-check"><input id="opt-${id}" type="checkbox" ${on?'checked':''}> ${title}</label>`;
 const percent=(n:number)=>Math.round(n*100)+'%';
 const draw=()=>{
 root.innerHTML=`<div class="settings-grid">
 <section><h3>${gameIcon('opcoes')} Gráficos</h3>
 <label class="settings-field">Qualidade gráfica<select id="opt-quality"><option value="alto" ${o.quality==='alto'?'selected':''}>Alta — todos os detalhes</option><option value="baixo" ${o.quality==='baixo'?'selected':''}>Baixa — desempenho</option></select></label>
 ${check('shadows','Sombras dinâmicas',o.shadows)}
 ${range('fov','Campo de visão',o.fov,60,95,1,n=>n+'°')}
 <small>Resolução adaptativa automática em ambos os modos. A qualidade alta mantém os detalhes do cenário.</small></section>
 <section><h3>${gameIcon('radio')} Áudio</h3>
 ${range('vol','Volume geral',o.masterVolume,0,1,.05,percent)}
 ${range('effects','Efeitos sonoros',o.effectsVolume,0,1,.05,percent)}
 ${range('ambience','Ambiente marítimo',o.ambienceVolume,0,1,.05,percent)}
 <small>Controle independente de ondas, chuva e efeitos de ações.</small></section>
 <section><h3>${gameIcon('acao')} Controles</h3>
 ${range('sens','Sensibilidade do mouse / toque',o.mouseSensitivity,.25,2.5,.05,n=>n.toFixed(2)+'×')}
 <label class="settings-field">Controles na tela<select id="opt-touch"><option value="auto" ${o.touchControls==='auto'?'selected':''}>Automático</option><option value="on" ${o.touchControls==='on'?'selected':''}>Sempre ativo</option><option value="off" ${o.touchControls==='off'?'selected':''}>Desligado</option></select></label>
 ${check('autocollect','Auto-coleta próxima ao nadar',o.autoCollectNear)}
 <details><summary>Atalhos de teclado</summary><small>WASD / setas: andar · Espaço: pular/nadar · E: interagir · F / clique: usar · I: mochila · B: construir · J: diário · M: mapa · V: câmera · O: remo · H: âncora · T: vela · K: motor · G: farol · F3: desempenho · Esc: voltar.</small></details></section>
 <section><h3>${gameIcon('mochila')} Interface e acessibilidade</h3>
 ${range('scale','Tamanho da HUD',o.hudScale,.8,1.35,.05,n=>n.toFixed(2)+'×')}
 ${check('contrast','Alto contraste',o.highContrast)}
 ${check('bob','Balanço da câmera',o.cameraBob)}
 <small>As alterações são aplicadas e salvas automaticamente neste navegador.</small></section>
 </div><div class="settings-footer"><button type="button" class="btn" id="opt-defaults">Restaurar padrões</button><span>Configurações salvas automaticamente</span></div>`;
 const commit=()=>onChange({...o});
 const bindRange=(id:string,key:'fov'|'hudScale'|'masterVolume'|'effectsVolume'|'ambienceVolume'|'mouseSensitivity',format:(n:number)=>string)=>{
 root.querySelector<HTMLInputElement>('#opt-'+id)?.addEventListener('input',e=>{const n=Number((e.target as HTMLInputElement).value);o[key]=n;const out=root.querySelector('#opt-'+id+'-value');if(out)out.textContent=format(n);commit();});
 };
 bindRange('fov','fov',n=>n+'°');bindRange('scale','hudScale',n=>n.toFixed(2)+'×');bindRange('sens','mouseSensitivity',n=>n.toFixed(2)+'×');bindRange('vol','masterVolume',percent);bindRange('effects','effectsVolume',percent);bindRange('ambience','ambienceVolume',percent);
 for(const [id,key] of [['shadows','shadows'],['contrast','highContrast'],['bob','cameraBob'],['autocollect','autoCollectNear']] as const)root.querySelector<HTMLInputElement>('#opt-'+id)?.addEventListener('change',e=>{o[key]=(e.target as HTMLInputElement).checked;commit();});
 root.querySelector<HTMLSelectElement>('#opt-quality')?.addEventListener('change',e=>{o.quality=(e.target as HTMLSelectElement).value==='baixo'?'baixo':'alto';commit();});
 root.querySelector<HTMLSelectElement>('#opt-touch')?.addEventListener('change',e=>{o.touchControls=(e.target as HTMLSelectElement).value as GameOptions['touchControls'];commit();});
 root.querySelector('#opt-defaults')?.addEventListener('click',()=>{o={...DEFAULT_OPTIONS};commit();draw();});
 };
 draw();
}
