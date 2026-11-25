import {prepareChunk,payloadTransfers,type ChunkRequest,type ChunkResponse} from './ChunkPayload';
const scope=self as unknown as {onmessage:((event:MessageEvent<ChunkRequest>)=>void)|null;postMessage:(msg:ChunkResponse,transfer?:ArrayBuffer[])=>void};
scope.onmessage=({data})=>{
  try{const payload=prepareChunk(data.spec,data.low);scope.postMessage({id:data.id,payload},payloadTransfers(payload));}
  catch{scope.postMessage({id:data.id,payload:null});}
};
