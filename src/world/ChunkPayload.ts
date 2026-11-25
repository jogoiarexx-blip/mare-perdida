import * as THREE from 'three';
import type { IslandSpec } from './ChunkLayout';
import { islandTerrain } from './IslandGeometry';
import { resourcesForIsland,type IslandResource } from './IslandResources';

export interface TerrainPayload {positions:Float32Array;colors:Float32Array;normals:Float32Array;indices:Uint16Array|Uint32Array;}
export interface ChunkPayload {near:TerrainPayload;far:TerrainPayload;resources:IslandResource[];}
export interface ChunkRequest {id:number;spec:IslandSpec;low:boolean;}
export interface ChunkResponse {id:number;payload:ChunkPayload|null;}
function pack(spec:IslandSpec,segments:number):TerrainPayload{
  const g=islandTerrain(spec,segments);
  const result={positions:g.getAttribute('position').array as Float32Array,colors:g.getAttribute('color').array as Float32Array,normals:g.getAttribute('normal').array as Float32Array,indices:g.index!.array as Uint16Array|Uint32Array};
  g.dispose();return result;
}
export function prepareChunk(spec:IslandSpec,low:boolean):ChunkPayload{
  return {near:pack(spec,low?24:40),far:pack(spec,12),resources:resourcesForIsland(spec)};
}
export function terrainFromPayload(p:TerrainPayload):THREE.BufferGeometry{
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(p.positions,3));
  g.setAttribute('normal',new THREE.BufferAttribute(p.normals,3));
  g.setAttribute('color',new THREE.BufferAttribute(p.colors,3));g.setIndex(new THREE.BufferAttribute(p.indices,1));g.computeBoundingSphere();return g;
}
export function payloadTransfers(p:ChunkPayload):ArrayBuffer[]{
  return [p.near,p.far].flatMap(t=>[t.positions.buffer,t.colors.buffer,t.normals.buffer,t.indices.buffer]) as ArrayBuffer[];
}
