// Ícones originais vetoriais, sem fontes ou bibliotecas externas.
const GLYPHS: Record<string, readonly [string,string]> = {
  "machado": ["#c6b49a", "<path d=\"m4 21 10-14 3 2-10 14ZM11 5q4-4 10-2l1 6-5 5-5-5Z\"/>"],
  "leme": ["#b8d4de","<circle cx=\"12\" cy=\"12\" r=\"8\"/><circle cx=\"12\" cy=\"12\" r=\"2\"/><path d=\"M12 1v9m0 4v9M1 12h9m4 0h9M4 4l6 6m4 4 6 6M4 20l6-6m4-4 6-6\"/>"],
  "carne_crua":["#c87478","<path d=\"M4 17Q0 8 10 4q8-4 12 5 3 8-6 12Q8 24 4 17Z\"/><path d=\"M8 15q-3-4 2-7t7 3-4 6Z\"/>"],
  "carne_assada":["#c39861","<path d=\"M3 16Q1 6 10 4t10 7q1 7-7 9t-10-4Z\"/><path d=\"m7 8 8 8m-4-10 7 7m-12-1 6 6\"/>"],
  "alga_marinha":["#69b798","<path d=\"M12 22V4m0 10Q2 14 3 3q9 2 9 11m0 3q10 0 9-11-9 2-9 11\"/>"],
  "minerio_marinho":["#8faabb","<path d=\"m2 14 5-10 10-1 5 9-6 9H7Zm5-10 5 10 5-11M2 14h10l4 7m-4-7 10-2\"/>"],
  "tanque_mergulho":["#81b5c5","<rect x=\"6\" y=\"5\" width=\"12\" height=\"17\" rx=\"5\"/><path d=\"M10 5V2h4v3m4 5h3v7m-15-4h12\"/>"],
  "remo":["#c99d67","<path d=\"M4 21l2-5 9-9 3 3-9 9ZM15 7l3-5 4 4-4 4\"/>"],
  "lanterna_mergulho":["#ffe09b","<path d=\"M3 9h9l7-5v16l-7-5H3Z M21 5l2-2m-2 9h2m-2 7 2 2\"/>"],
  "nadadeiras":["#5dbac8","<path d=\"M3 3h6v7l3 10H1l2-10Zm12 0h6v7l2 10H12l3-10Z\"/>"],
  "reliquia_atlas":["#e0bd70","<path d=\"m12 2 9 7-9 13L3 9Zm-9 7h18M8 9l4 13 4-13\"/>"],
  "motor":["#aabdc8","<rect x=\"4\" y=\"5\" width=\"15\" height=\"12\" rx=\"2\"/><path d=\"M8 5V2h7v3M7 17v4m9-4v4M1 8v6h3m15-6h3v6h-3\"/>"],
  "combustivel":["#e19a54","<rect x=\"4\" y=\"5\" width=\"15\" height=\"16\" rx=\"2\"/><path d=\"M8 5V2h7v3m-7 5 7 7m0-7-7 7\"/>"],
  "escada":["#c99d67","<path d=\"M5 2v20M19 2v20M5 5h14M5 10h14M5 15h14M5 20h14\"/>"],
  "bandeira":["#e76b42","<path d=\"M5 22V2l16 3-5 5 5 5-16-3\"/>"],
  "farol_nav":["#ffe19b","<path d=\"M3 22h12M9 22V10M4 10V3h10v7ZM17 4l5-2m-5 5h5m-5 3 5 2\"/>"],
  "radar":["#83c9a8","<circle cx=\"12\" cy=\"12\" r=\"10\"/><circle cx=\"12\" cy=\"12\" r=\"5\"/><path d=\"M12 12 19 5M12 2v20M2 12h20\"/>"],
  "binoculo":["#abc5d6","<path d=\"M3 4h6l2 6v9H1v-9Zm12 0h6l2 6v9H13v-9ZM11 12h2\"/>"],
  "parede":["#c99b63","<rect x=\"2\" y=\"2\" width=\"20\" height=\"20\"/><path d=\"M2 7h20M2 12h20M2 17h20\"/>"],
  "porta":["#bd935f","<rect x=\"5\" y=\"2\" width=\"14\" height=\"20\"/><path d=\"M8 5h8v14H8Zm6 7h1\"/>"],
  "janela":["#a8cbd8","<rect x=\"2\" y=\"2\" width=\"20\" height=\"20\"/><rect x=\"6\" y=\"6\" width=\"12\" height=\"12\"/><path d=\"M12 6v12M6 12h12\"/>"],
  "corrimao":["#c99b63","<path d=\"M3 22V5m18 17V5M3 6h18M3 13h18M3 20h18\"/>"],
  "piso_superior":["#c99b63","<path d=\"M2 5 12 1l10 4-10 4Zm0 0v4l10 4 10-4V5M4 10v12m16-12v12\"/>"],
  "escada_interna":["#c99b63","<path d=\"M5 2v20M19 2v20M5 5h14M5 10h14M5 15h14M5 20h14\"/>"],
  "telhado":["#c99b63","<path d=\"m2 12 10-10 10 10M5 10v12m14-12v12M2 12h20\"/>"],
  "madeira": [
    "#ce935c",
    "<path d=\"M3 8 16 3l5 5v10L8 22l-5-5Z\"/><path d=\"m3 8 5 5 13-5M8 13v9m3-10 7-3m-7 7 7-3\"/>"
  ],
  "plastico": [
    "#6fd1e8",
    "<path d=\"M9 3h6v4l3 3v10l-2 2H8l-2-2V10l3-3Z\"/><path d=\"M9 3V1h6v2M6 12h12M6 17h12\"/>"
  ],
  "folha": [
    "#83cb85",
    "<path d=\"M3 20C1 8 12 3 21 2c1 11-5 20-15 18Z\"/><path d=\"M3 22 18 6M8 16l-1-5m5 1 5 1\"/>"
  ],
  "fibra": [
    "#d9bb73",
    "<path d=\"M5 21 11 3M9 21l8-18M13 21l8-12M3 7l5 6M10 5l3 6M17 4l2 4M3 16l15-5\"/>"
  ],
  "corda": [
    "#d7b180",
    "<ellipse cx=\"11\" cy=\"13\" rx=\"8\" ry=\"6\"/><ellipse cx=\"11\" cy=\"13\" rx=\"4\" ry=\"3\"/><path d=\"M3 13v4c0 4 17 5 17 0v-4m-2 5 4 3M4 10l3 2m8-3 3 2\"/>"
  ],
  "sucata": [
    "#b3c2ce",
    "<path d=\"m3 5 10-2 3 5-3 4 2 3-6 6-6-2Z\"/><path d=\"m14 5 6-2 2 6-5 6m-9-6 2 3-3 3\"/><circle cx=\"18\" cy=\"19\" r=\"3\"/>"
  ],
  "pedra": [
    "#aab7c4",
    "<path d=\"m2 15 5-10 9-2 6 10-3 8H5Z\"/><path d=\"m7 5 4 8 11 0m-11 0-6 8\"/>"
  ],
  "tecido": [
    "#e1d5b6",
    "<path d=\"M4 4h13l4 4v12H7L3 16V7Z\"/><path d=\"M7 4v12h14M3 16h4m3-7h7m-7 3h7\"/>"
  ],
  "peixe_cru": [
    "#79c8dc",
    "<path d=\"M3 12c5-7 11-7 15-1l4-4v10l-4-4c-4 6-10 6-15-1Z\"/><circle cx=\"8\" cy=\"11\" r=\".8\"/><path d=\"m12 9 2 3-2 3\"/>"
  ],
  "peixe_assado": [
    "#f3aa59",
    "<path d=\"M3 12c5-7 11-7 15-1l4-4v10l-4-4c-4 6-10 6-15-1Z\"/><path d=\"m9 9 2 6m2-7 2 6M6 4l2-2m5 2 2-2\"/><circle cx=\"7\" cy=\"11\" r=\".5\"/>"
  ],
  "fruta_colhida": [
    "#b3d776",
    "<ellipse cx=\"12\" cy=\"14\" rx=\"8\" ry=\"8\"/><path d=\"M12 6V3q5-4 8 0-4 4-8 3M7 11l1 5m3-7 1 10\"/>"
  ],
  "agua_salgada": [
    "#7f99d9",
    "<path d=\"M12 2C9 7 4 11 4 16a8 8 0 0 0 16 0c0-5-5-9-8-14Z\"/><path d=\"M7 14q3-3 5 0t5 0M7 17q3-3 5 0t5 0\"/>"
  ],
  "agua_pura": [
    "#63d6ff",
    "<path d=\"M12 2C9 7 4 11 4 16a8 8 0 0 0 16 0c0-5-5-9-8-14Z\"/><path d=\"M8 15q-1 4 3 4m4-10 2 3\"/>"
  ],
  "isca": [
    "#e59483",
    "<path d=\"M5 6q5-5 11-2l4 5-3 8-7 4-6-3-2-7Z\"/><path d=\"m7 8 4 2 4-2m-6 8 3-3 4 1\"/>"
  ],
  "semente_salina": [
    "#a5d68a",
    "<ellipse cx=\"12\" cy=\"17\" rx=\"5\" ry=\"4\"/><path d=\"M12 15V6m0 5C4 11 4 4 4 4q8 0 8 7Zm0-3q0-7 8-6 0 7-8 6Z\"/>"
  ],
  "gancho": [
    "#c1d3e2",
    "<path d=\"M13 2v12q0 7-5 7t-5-5l4 2-4-6M13 2h5v4h-5\"/><path d=\"m14 5 4 3 2 5\"/>"
  ],
  "lanca": [
    "#d5b187",
    "<path d=\"m4 21 14-14m-4 2 2-6 6-1-1 6-5 3m-7 4 3 3\"/>"
  ],
  "martelo_reparo": [
    "#d7b180",
    "<path d=\"m4 22 8-12 3 2-8 12Zm5-14 3-5 8 4-3 5Z\"/><path d=\"m14 4 2-2 6 4-2 2\"/>"
  ],
  "vara_pesca": [
    "#d8bb83",
    "<path d=\"M3 21 18 3q3 3 3 9v5q0 4-3 4t-3-3l2 1M6 17l3 3\"/><circle cx=\"10\" cy=\"15\" r=\"2\"/>"
  ],
  "bateria": [
    "#87d5b0",
    "<rect x=\"6\" y=\"5\" width=\"12\" height=\"16\" rx=\"2\"/><path d=\"M9 5V2h6v3m-3 3-3 6h4l-1 4 4-7h-4Z\"/>"
  ],
  "antena": [
    "#94c5e8",
    "<path d=\"M12 13v8m-5 0h10M3 3q-1 9 8 9l9-9q-9-2-17 0ZM12 12l5-5m1 9q4-2 4-6\"/>"
  ],
  "pagina_diario": [
    "#e5d3a5",
    "<path d=\"M5 2h10l4 4v16H5Z\"/><path d=\"M15 2v5h4M8 10h8M8 13h8M8 16h6\"/>"
  ],
  "carta_verde": [
    "#91d29b",
    "<path d=\"m2 5 7-3 6 3 7-3v17l-7 3-6-3-7 3Z\"/><path d=\"M9 2v17m6-14v17M5 9l3 4 7-3 4 4\"/>"
  ],
  "mochila": [
    "#9bd0e3",
    "<rect x=\"5\" y=\"5\" width=\"14\" height=\"17\" rx=\"3\"/><path d=\"M9 5V3h6v2M5 11h14M8 15h8v4H8Z\"/>"
  ],
  "construcao": [
    "#d8b57b",
    "<path d=\"m3 21 9-12 3 2-9 12Zm7-15 3-4 9 5-3 4Z\"/>"
  ],
  "diario": [
    "#c5d8ed",
    "<path d=\"M3 4q6-2 9 2 3-4 9-2v16q-6-2-9 1-3-3-9-1Z\"/><path d=\"M12 6v15M6 9h3m6 0h3\"/>"
  ],
  "opcoes": [
    "#b0cbd7",
    "<path d=\"m9 2 1 3h4l1-3 4 2-1 3 2 3 3 1v3l-3 1-2 3 1 3-4 1-1-3h-4l-1 3-4-2 1-3-2-3-3-1v-3l3-1 2-3-1-3Z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>"
  ],
  "saude": [
    "#f38e8c",
    "<path d=\"M12 21 3 12C-3 4 7 0 12 7 17 0 27 4 21 12Z\"/><path d=\"M5 12h4l2-3 2 6 2-3h4\"/>"
  ],
  "fome": [
    "#f7be72",
    "<path d=\"M4 2v7q0 4 4 4v9m4-20v7q0 4-4 4M8 2v7M19 2q-5 5-5 12h5v8Z\"/>"
  ],
  "energia": [
    "#7be0a6",
    "<path d=\"m13 2-9 12h7l-1 8 10-13h-7Z\"/>"
  ],
  "oxigenio": [
    "#c2b3fc",
    "<circle cx=\"9\" cy=\"14\" r=\"5\"/><circle cx=\"17\" cy=\"6\" r=\"3\"/><circle cx=\"19\" cy=\"17\" r=\"2\"/>"
  ],
  "bussola": [
    "#93d9ee",
    "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m16 7-2 8-7 2 2-8Z\"/>"
  ],
  "peso": [
    "#d8c19a",
    "<path d=\"M12 2v20M3 22h18M3 6h18M5 6l-4 9h8Zm14 0-4 9h8Z\"/>"
  ],
  "alerta": [
    "#f9ad75",
    "<path d=\"M12 2 23 21H1Z\"/><path d=\"M12 8v6m0 3v1\"/>"
  ],
  "tubarao": [
    "#9fb7d4",
    "<path d=\"M2 15q8-2 12-12l2 9 6 5-8-1-8 3Z\"/><path d=\"M3 21q5-3 9 0t9 0\"/>"
  ],
  "acao": [
    "#c3e9f5",
    "<circle cx=\"12\" cy=\"12\" r=\"8\"/><path d=\"M12 2v5m0 10v5M2 12h5m10 0h5\"/>"
  ],
  "pular": [
    "#c3e9f5",
    "<path d=\"M12 3 4 11h5v10h6V11h5Z\"/>"
  ],
  "fundacao": [
    "#d4a16b",
    "<path d=\"m2 8 10-5 10 5v9l-10 5-10-5Zm0 0 10 5 10-5M12 13v9m-5-12 10-5m-5 8 5-3\"/>"
  ],
  "borda_reforcada": [
    "#b2c7d4",
    "<path d=\"m2 8 10-5 10 5v9l-10 5-10-5Zm0 0 10 5 10-5M12 13v9m-7-8 4 2m6 0 4-2\"/>"
  ],
  "purificador": [
    "#69cfe6",
    "<path d=\"M5 9h12v12H5Z M3 9l8-7 8 7M17 15h4v4m-10-7-3 5h6Z\"/>"
  ],
  "churrasqueira": [
    "#f2a267",
    "<path d=\"M3 8h18l-4 8H7Zm5 8-2 6m10-6 2 6M6 6h12M9 2l1 3m5-3-1 3\"/>"
  ],
  "cama": [
    "#b7c8df",
    "<path d=\"M3 4v17m18-8v8M3 15h18V9H8v6M3 18h18M5 8h3v4H5Z\"/>"
  ],
  "rede_coleta": [
    "#d6bd8e",
    "<path d=\"m3 3 18 0v18H3ZM9 3v18m6-18v18M3 9h18M3 15h18\"/>"
  ],
  "vela": [
    "#e5d8b7",
    "<path d=\"M12 2v20M2 20h20M12 3 3 16h9m2-13 7 13h-7Z\"/>"
  ],
  "ancora": [
    "#b3c7d7",
    "<circle cx=\"12\" cy=\"5\" r=\"3\"/><path d=\"M12 8v14M6 11h12M2 15q0 7 10 7t10-7m-20 0 3 3m17-3-3 3\"/>"
  ],
  "radio": [
    "#9dd1e3",
    "<rect x=\"3\" y=\"8\" width=\"18\" height=\"13\" rx=\"2\"/><path d=\"m15 8 5-6M6 11h8v4H6m11-3h1m-1 3h1M6 18h12\"/>"
  ],
  "cobertura": [
    "#95c58a",
    "<path d=\"m2 10 10-7 10 7H2Zm3 0v12m14-12v12M8 10l4-7 4 7\"/>"
  ],
  "horta": [
    "#88cf8b",
    "<path d=\"M3 14h18l-3 8H6Zm9 0V5m0 5Q4 10 4 3q8 0 8 7Zm0 1q0-8 8-8 0 8-8 8Z\"/>"
  ],
  "bau": [
    "#d6a16e",
    "<path d=\"M3 10V7q0-4 4-4h10q4 0 4 4v14H3ZM3 10h18M10 10v5h4v-5\"/>"
  ],
  "check": [
    "#8ce1ad",
    "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"m7 12 3 3 7-7\"/>"
  ],
  "lock": [
    "#aab9ce",
    "<rect x=\"5\" y=\"10\" width=\"14\" height=\"11\" rx=\"2\"/><path d=\"M8 10V6a4 4 0 0 1 8 0v4m-4 4v3\"/>"
  ],
  "xp": [
    "#f1d28a",
    "<path d=\"m12 2 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z\"/>"
  ],
  "creditos": [
    "#efd391",
    "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M15 8h-4q-3 0-3 2t3 2h2q3 0 3 2t-3 2H9m3-10v2m0 8v2\"/>"
  ],
  "farol": [
    "#c6dbe8",
    "<path d=\"M8 22 10 9h4l2 13ZM8 9V4h8v5M6 4h12l-6-3ZM2 7h3m14 0h3M5 2 2 1m17 1 3-1\"/>"
  ],
  "save": [
    "#9dcde3",
    "<path d=\"M3 3h16l2 2v16H3Zm4 0v7h10V3M7 21v-7h10v7\"/>"
  ],
  "close": [
    "#c8d9e4",
    "<path d=\"m5 5 14 14M19 5 5 19\"/>"
  ],
  "use": [
    "#a9d9e8",
    "<path d=\"m5 11 4-4 4 3 5-5 3 3-7 7-2 6H7l-4-5Z\"/>"
  ],
  "empty": [
    "#728a9c",
    "<path d=\"M5 5h14v14H5Z\"/><path d=\"m9 12 6 0\"/>"
  ]
};
export function hasIcon(id:string): boolean { return Object.prototype.hasOwnProperty.call(GLYPHS,id); }
const cache = new Map<string,string>();
export function gameIcon(id:string, size:'item'|'inline'|'action'='inline'):string {
  const safe=hasIcon(id)?id:'empty'; const key=safe+':'+size;
  const cached=cache.get(key); if(cached) return cached;
  const [color,body]=GLYPHS[safe];
  const svg='<svg class="game-icon icon-'+size+'" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="color:'+color+'" fill="currentColor" fill-opacity=".17" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">'+body+'</svg>';
  cache.set(key,svg); return svg;
}
