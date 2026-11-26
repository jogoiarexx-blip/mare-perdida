// Ilustrações de inventário em 24x24, materiais e silhuetas independentes de fontes.
const wood='#b67b43',light='#e3b77b',dark='#65452f',steel='#9eb5c0',shine='#e1eef1',edge='#263c48',rope='#c4a16a',blue='#5dc6e4',green='#78bd63';
const p=(d:string,c:string,s=edge,w=.65)=>`<path d="${d}" fill="${c}" stroke="${s}" stroke-width="${w}"/>`;
const l=(d:string,c=dark,w=.8)=>p(d,'none',c,w);
const r=(x:number,y:number,w:number,h:number,c:string,rx=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${c}" stroke="${edge}" stroke-width=".65"/>`;
const e=(x:number,y:number,rx:number,ry:number,c:string)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" stroke="${edge}" stroke-width=".65"/>`;
const plank=(c=wood)=>p('M2 8 13 2 22 7 11 13Z',c)+p('M2 8v9l9 5v-9Z',dark)+p('M11 13 22 7v9l-11 6Z',wood)+l('m5 8 10-5m-7 7 10-5m-4 11 6-3',light)+l('M5 10v6m3-4v6');
const bottle=(c:string)=>p('M9 2h6v4l3 3 1 10q0 3-3 3H8q-3 0-3-3l1-10 3-3Z','#a5d9e4')+p('M7 12q5-2 10 0l1 7-2 2H8l-2-2Z',c)+r(9,1,6,3,'#536e83',1)+l('M8 9 7 17',shine,1.3)+l('M8 15h8',shine);
const fish=(c:string,c2:string)=>p('M2 12Q8 3 17 10l5-5-1 14-4-5Q8 21 2 12Z',c)+p('M6 15q5 5 11-1l-6-1Z',c2)+p('m9 8 3-4 3 5Z',c2)+e(6,11,1,1,'#17232b')+l('M8 9q3 3 0 6',c2,1);
const handle=()=>p('m3 21 13-17 3 2L6 23Z',wood)+l('m5 20 11-14',light,1.1);
const rock=(c=steel)=>p('m2 15 5-10 8-3 7 9-3 9-12 2Z',c)+p('m7 5 5 8 10-2-3 9-7-7-5 9-5-7Z','#607581')+p('m7 5 8-3 7 9-10 2Z','#c6d3d7');
const coil=()=>e(11,12,9,7,rope)+e(11,12,5,3,'#4a3c30')+l('M2 12q0 11 17 7l3 3M4 8l2 2m1-4 2 3m4-4 1 3m4-1-2 3m3 4-3-1m-8 5 2-3m-6 1 3-2',light,1.3);
const wall=(window=false,door=false)=>p('M3 3 20 5v17L3 19Z',wood)+p('M3 3 6 2 22 4v17l-2 1V5Z',dark)+l('M4 7 19 9M4 11l15 2M4 15l15 2',light)+ (window?p('M7 6 17 7v9l-10-1Z','#284c61')+p('m8 7 8 1v6l-8-1Z',blue)+l('M12 8v6m-4-3 8 1',shine):door?p('M8 6 17 7v14l-9-1Z','#835b38')+e(15,14,.8,.8,'#e6c477'):'');
const ladder=(c=wood)=>p('M4 2h3v20H4ZM17 2h3v20h-3Z',c)+[5,10,15,20].map(y=>r(6,y,12,2,light)).join('');
const roof=(c=wood)=>p('M1 12 10 2l13 9-8 11Z',c)+p('M10 2 23 11l-2 3-11-8L3 14 1 12Z',dark)+l('m5 12 8 6m-5-9 8 6m-5-9 8 6',light)+p('m3 14 8 6v2l-8-4Z',dark);
export const ITEM_ART:Readonly<Record<string,string>>={
 madeira:plank(),
 plastico:bottle('#5fa2b6')+l('M8 13h8m-8 3h8',shine),
 folha:p('M3 21Q-1 4 22 2q1 18-15 18Z',green)+p('M3 21 22 2Q8 6 7 20Z','#46844d')+l('M3 22 19 5M9 15 8 9m5 2 5 1', '#c5e19a',1),
 fibra:p('M4 21 8 3l3 5 3-6 1 7 5-5-1 16Z',rope)+l('m7 19 2-12m2 13 3-15m1 15 3-10M3 13l18 2','#795a35',1.3),
 corda:coil(),sucata:p('m3 5 9-3 5 6-4 5 4 5-8 4-6-5Z',steel)+p('m13 5 7-2 2 8-6 3Z','#798e9a')+e(17,18,4,4,'#798e9a')+e(17,18,1.5,1.5,'#243946')+l('M5 6l6-2m-6 11 5 4',shine),
 pedra:rock(),minerio_marinho:rock('#6d899e')+p('m8 8 4-3 2 6-4 4Z','#54c5ce')+p('m15 14 4-2-1 6-4 1Z','#7ddce0'),
 tecido:p('M3 4 17 2l5 6-2 13-14 1-4-6Z','#e8d5ac')+p('m3 4 5 6 14-2-5-6Z','#fff0d4')+l('M8 10 6 22m4-9 9-1m-10 5 9-1','#a68f6d'),
 peixe_cru:fish('#77b7cf','#c9e9ed'),peixe_assado:fish('#db9b4c','#a65c33')+l('m9 9 3 6m1-7 3 6','#593923',1.2),
 carne_crua:p('M3 17Q-1 7 9 3q11-5 13 7 2 8-8 12-8 2-11-5Z','#ad4952')+p('M6 16Q3 9 11 6q6-3 8 4 1 6-6 8Z','#e7857b')+e(12,12,2.3,2,'#f6dbbc'),
 carne_assada:p('M3 17Q0 8 10 4q10-3 11 6 1 8-9 10Z','#ad6739')+p('M4 17 2 21 5 23l4-4Z','#f3ddbc')+l('m8 8 7 7m-4-9 7 7m-12 0 5 5','#4a3027',1.3),
 fruta_colhida:e(12,14,8,8,'#9cbe50')+p('M12 6Q11 0 20 3q-2 5-8 3Z',green)+l('M12 7 11 3M7 10q-3 4 0 8','#e8eeb3',1.3),
 agua_salgada:bottle('#446eb2'),agua_pura:bottle('#67d8fa'),
 isca:p('M3 9 10 4l10 3 2 9-7 5-11-4Z','#ba6757')+l('m5 10 6 3 7-4m-9 9 4-4 6 2','#f4b09a',1.2),
 semente_salina:e(11,17,5,4,rope)+e(17,19,3,2,dark)+p('M12 16V9Q3 12 3 3q8 0 9 6Q14 1 21 3q0 8-9 8Z',green)+l('M12 17V7','#d2e69e'),
 gancho:p('M15 2h5v5h-3v7q0 8-8 8-7 0-7-7l5 2-2-5 6 4q0 3 2 1l1-3Z',steel)+l('M16 4v10q0 6-6 6',shine,1.4)+r(15,1,5,4,rope,1),
 lanca:handle()+p('M13 8 16 2 23 1l-2 7-6 3Z',steel)+l('m16 8 5-5',shine,1.2),
 machado:handle()+p('M10 6 16 2 22 4l1 6-8 5-5-4Z',steel)+p('m20 4 3 6-8 5-2-3Z',shine)+l('m12 7 4 4m-5-2 4 4',rope,1.4),
 martelo_reparo:handle()+p('m8 6 4-5 9 6-3 5Z',steel)+p('m18 5 2-2 3 3-2 3Z',shine)+l('m12 3 6 4',shine,1.1),
 vara_pesca:p('m3 22 2-7L20 2l2 1-16 17Z',wood)+l('M21 3q2 8 0 14t-4 2',shine)+e(9,15,2.5,2.5,steel)+e(9,15,1,1,dark)+l('m4 20 4-5',rope,2),
 bateria:r(5,5,14,17,'#536d61',2)+r(8,2,3,3,steel)+r(14,2,3,3,steel)+r(7,8,10,8,'#76bd83',1)+p('m13 8-4 5h3l-1 5 5-7h-3Z','#e1eaa8'),
 antena:p('M2 3q0 13 12 11L22 4Q10 1 2 3Z',steel)+l('M4 5 14 13M7 3l4 9m4 0 5-5',shine)+p('m12 13 2 1-1 6h6v2H5v-2h6Z',dark),
 pagina_diario:p('M4 2h12l5 5v15H4Z','#e6d2a3')+p('M16 2v5h5Z','#fff0ce')+l('M7 9h11M7 12h11M7 15h8M7 18h10','#8a7154'),
 carta_verde:p('m2 5 7-3 6 3 7-3v17l-7 3-6-3-7 3Z','#a8c6a4')+p('m2 5 7-3v17l-7 3Z','#e4d6a2')+l('M9 2v17m6-14v17','#7b9678')+p('m3 10 4-3 4 6 5-4 5 5-5 3-6-2-4 2Z','#65916d')+e(16,9,1.5,1.5,'#c84f45'),
 alga_marinha:p('M11 22V4l2 5Q16 0 20 3q2 8-7 12 4-2 8 0-3 6-8 5l-2 2Q3 18 3 10q5 1 8 5Q1 6 5 2q6 2 6 10Z','#519d70')+l('M12 21 12 9m0 5 6-8m-6 12-6-6','#a5db9c'),
 tanque_mergulho:r(5,5,14,17,steel,5)+r(8,2,8,4,'#536e83',1)+r(5,10,14,4,'#385667',1)+l('M9 7v12',shine,2)+r(15,1,5,2,'#d8b15c',1),
 remo:p('M2 21 15 8l1 2L4 23Z',dark)+p('m14 8 2-5 4-2 3 4-1 4-6 2Z',wood)+l('m17 7 4-4',light,1.3),
 lanterna_mergulho:p('m3 9 10-2 5-5 4 5v10l-5 5-5-5-9-2Z','#607c8a')+p('m17 4 5 3v10l-5 3Z','#b5dce7')+p('m18 6 3 2v8l-3 2Z','#ffe6a0')+l('M6 10v5m3-5v5',shine),
 nadadeiras:p('M3 2h6v7l3 13H1L3 9ZM15 2h6v7l2 13H12l3-13Z','#419eb5')+r(4,3,4,6,'#354e5c',1)+r(16,3,4,6,'#354e5c',1)+l('m5 11-1 9m4-9 1 9m8-9-1 9m4-9 1 9','#85d4db'),
 reliquia_atlas:p('m12 1 10 7-10 15L2 8Z','#d4a44d')+p('m12 1 4 7-4 15L8 8Z','#f8e4a0')+l('M2 8h20m-10 1v10','#8b6334')+e(12,8,2,2,'#6ce3d6'),
 combustivel:r(4,6,16,16,'#c68948',2)+p('M8 6V2h8v4H14V4h-4v2Z','#53616b')+p('m5 10 4-3 10 3v8l-5 3-9-3Z','#daab5b')+l('m8 11 8 7m0-7-8 7','#805138',1.4),
 binoculo:p('M3 3h6l2 7v10H1V10Zm12 0h6l2 7v10H13V10Z','#536e71')+r(10,8,4,6,steel,1)+e(6,18,4,3,'#233b4d')+e(18,18,4,3,'#233b4d')+e(6,18,2.4,1.7,blue)+e(18,18,2.4,1.7,blue)+l('M4 6h4m8 0h4',shine),
 fundacao:plank(),piso_claro:plank(light),piso_escuro:plank('#79523a'),
 borda_reforcada:plank()+p('M2 8 13 2 22 7 11 13Z','none',steel,2.5)+l('M2 10v7l9 5 11-6v-7',steel,2),
 fundacao_metal:p('M2 8 13 2 22 7 11 13Z',steel)+p('M2 8v9l9 5v-9Z','#566b79')+p('M11 13 22 7v9l-11 6Z','#8199a6')+l('m5 8 10-5m-7 7 10-5M5 12v3m9 0 5-3',shine,1.1),
 parede:wall(),porta:wall(false,true),janela:wall(true),
 corrimao:p('M3 3h3v18H3Zm15 2h3v17h-3Z',wood)+p('M5 5 19 7v3L5 8Zm0 8 14 2v3L5 16Z',light),
 piso_superior:p('M4 10h2v12H4Zm14 1h2v11h-2Z',dark)+p('M1 6 13 1 23 5 11 11Z',light)+p('M1 6v3l10 5 12-6V5l-12 6Z',wood)+l('m5 6 10-4m-6 6 10-4'),
 escada:ladder(),escada_interna:p('M3 22 17 3h4L7 22Z',dark)+[0,1,2,3,4].map(i=>p(`M${3+i*3} ${19-i*4}h7v3h-7Z`,light)).join(''),
 telhado:roof(),cobertura:roof('#8da568'),
 purificador:p('M4 9 16 7v14H4Z',wood)+p('M2 9 10 2l12 5-7 7Z','#7cbac5')+l('m5 8 10-3m-7 5 10-3',shine)+p('M16 14h5v7h-5Z',blue)+l('M16 12h4v3',steel,1.6),
 churrasqueira:p('M3 9h18l-4 8H7Z','#5b666a')+e(12,9,9,3,'#a7b1ad')+l('M6 8h12M7 10h10',edge)+l('M8 17 5 22m11-5 3 5',steel,1.8)+p('m9 7 2-5 2 3 2-2 1 4Z','#f2a052'),
 cama:p('M2 9 11 4l11 5v10l-11 4-9-5Z',dark)+p('M2 9 11 4l11 5-11 5Z','#e3ded0')+p('M2 11 9 8l12 5-10 5Z','#5f96a2')+p('m5 8 5-2 4 2-5 3Z','#f4edd8')+l('M2 19v3m19-5v4',wood,2),
 rede_coleta:p('M2 6 12 2l10 4v13l-10 4-10-4Z','#354d4b')+l('m2 6 10 4 10-4M2 12l10 4 10-4M2 18l10 4 10-4M7 4v16m5-10v13m5-19v16',rope,1.15)+p('M2 6 12 2l10 4v13l-10 4-10-4Z','none',wood,2),
 vela:p('M11 1h2v22h-2Z',dark)+p('M11 2 2 19h9Z','#f0e2c6')+p('M13 4 22 19h-9Z','#c5cfbf')+l('M3 20h18',wood,2),
 ancora:e(12,4,3,3,steel)+e(12,4,1.5,1.5,'#263c48')+p('M10 7h4v12q5-1 6-5l-3 1 4-6 2 7-2-1q-2 7-9 8-7-1-9-8l-2 1 2-7 4 6-3-1q1 4 6 5Z',steel)+r(6,9,12,2,shine,1),
 leme:e(12,12,9,9,dark)+e(12,12,6.8,6.8,'#30454b')+l('M12 1v22M1 12h22M4 4l16 16M4 20 20 4',light,2)+e(12,12,2.8,2.8,steel),
 radio:r(2,7,20,14,'#5a6b65',2)+r(4,9,10,5,'#a5d8b4',1)+e(18,11,2,2,steel)+l('M6 17h12m-12 2h12M15 7l5-6',shine),
 horta:p('M2 14 13 10l9 4-3 7-13 1Z',wood)+p('M2 14 13 10l9 4-11 4Z','#574031')+p('M11 17V5Q2 12 3 3q7 0 8 6 2-8 9-7 0 8-9 9Z',green)+l('M11 16V7','#d4e9a1'),
 bau:p('M2 10V6l10-4 10 4v13l-10 4-10-4Z',wood)+p('M2 10 12 14l10-4V6L12 2 2 6Z',light)+l('M2 10l10 4 10-4M12 14v9',dark,1.5)+p('M10 13h4v5h-4Z','#d8c17d'),
 motor:p('M3 8 15 4l7 5v10l-11 4-8-5Z','#788b94')+p('M3 8 15 4l7 5-11 4Z',steel)+r(7,2,9,4,'#445965',1)+l('M5 11v6m3-5v6m7-3 5-2m-5 5 5-2',shine)+e(18,11,2,2,'#c99a58'),
 bandeira:p('M4 1h2v22H4Z',wood)+p('M6 3 22 5l-5 5 5 5-16-2Z','#d86145')+l('M7 4l12 2M7 12l12 2','#f4aa7d'),
 farol_nav:p('M7 11h4v11H7Z',steel)+p('M2 6 14 3v12L2 11Z','#687f8c')+e(15,9,3,6,'#f5d991')+l('m19 5 4-2m-4 6h4m-4 4 4 2','#ffe8a3',1.4)+r(4,21,10,2,steel),
 radar:p('M3 22h18l-3-6H6Z','#647f87')+e(12,9,10,8,'#264b43')+e(12,9,6,4,'#315f4f')+l('M12 1v16M2 9h20M12 9l8-5','#7ccea1')+e(16,6,1.3,1.3,'#c5f3a0'),
};
