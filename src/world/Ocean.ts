import * as THREE from 'three';

/**
 * Altura analítica determinística das ondas em metros, compartilhada entre simulação e render.
 */
export function getWaveHeight(x: number, z: number, timeSec: number, stormFactor = 0): number {
  const amp = 0.22 + stormFactor * 0.35;
  const w1 = Math.sin(x * 0.24 + timeSec * 1.15) * amp;
  const w2 = Math.cos(z * 0.19 - timeSec * 0.92) * (amp * 0.72);
  const w3 = Math.sin((x + z) * 0.42 + timeSec * 1.75) * (amp * 0.35);
  return w1 + w2 + w3;
}

export function getWaveNormal(x: number, z: number, timeSec: number, stormFactor = 0): THREE.Vector3 {
  const eps = 0.35;
  const hL = getWaveHeight(x - eps, z, timeSec, stormFactor);
  const hR = getWaveHeight(x + eps, z, timeSec, stormFactor);
  const hD = getWaveHeight(x, z - eps, timeSec, stormFactor);
  const hU = getWaveHeight(x, z + eps, timeSec, stormFactor);
  return new THREE.Vector3(hL - hR, 2 * eps, hD - hU).normalize();
}

/** Fases calculadas em double e reduzidas antes do envio à GPU.
 * Evita coordenadas enormes em Float32 e mantém continuidade entre centros.
 */
export function oceanPhases(x:number,z:number,t:number):[number,number,number,number,number]{
  const mod=(v:number)=>v%(Math.PI*2);
  return [mod(x*.24+t*1.15),mod(z*.19-t*.92),mod((x+z)*.42+t*1.75),mod(x*2.2+z*1.8-t*1.7),mod(x*.9-z*2.4+t*1.1)];
}
/** Mesma função de onda usada na física, avaliada na GPU para a superfície. */
export const SEA_WAVE_GLSL = `
uniform vec3 uSeaPhase;
uniform float uSeaStorm;
varying vec3 vSeaPosition;
vec3 seaWave(vec2 p) {
  float a = 0.22 + uSeaStorm * 0.35;
  float x = p.x * 0.24 + uSeaPhase.x;
  float z = p.y * 0.19 + uSeaPhase.y;
  float d = (p.x + p.y) * 0.42 + uSeaPhase.z;
  float shared = cos(d) * 0.42 * a * 0.35;
  return vec3(sin(x)*a + cos(z)*a*0.72 + sin(d)*a*0.35,
    cos(x)*0.24*a + shared, -sin(z)*0.19*a*0.72 + shared);
}
`;

export function oceanSegments(lowQuality: boolean): number {
  return lowQuality ? 64 : 112;
}

/** Superfície marítima: malha estática, movimento e normais analíticas no vertex shader.
 * A simulação continua independente da renderização; não há textura ou render target adicional.
 */
export class OceanRenderer {
  readonly mesh: THREE.Mesh;
  private readonly geometry: THREE.PlaneGeometry;
  private readonly material: THREE.MeshStandardMaterial;
  private readonly storm = { value: 0 };
  private readonly phase = {value:new THREE.Vector3()};
  private readonly ripplePhase = {value:new THREE.Vector2()};
  private readonly gridSnap = 2;

  constructor(lowQuality = false) {
    const segments = oceanSegments(lowQuality);
    this.geometry = new THREE.PlaneGeometry(220, 220, segments, segments);
    this.geometry.rotateX(-Math.PI / 2);
    this.material = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.29, metalness: 0.02,
    });
    this.material.onBeforeCompile = shader => {
      shader.uniforms.uSeaPhase = this.phase;
      shader.uniforms.uRipplePhase=this.ripplePhase;
      shader.uniforms.uSeaStorm = this.storm;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\n' + SEA_WAVE_GLSL)
        .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
          vec3 seaData = seaWave(position.xz);
          objectNormal = normalize(vec3(-seaData.y, 1.0, -seaData.z));`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          transformed.y += seaData.x;
          vSeaPosition = vec3(position.x, seaData.x, position.z);`);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>
          uniform vec2 uRipplePhase;
          uniform float uSeaStorm;
          varying vec3 vSeaPosition;`)
        .replace('#include <color_fragment>', `#include <color_fragment>
          float amp = 0.22 + uSeaStorm * 0.35;
          float crest = clamp(vSeaPosition.y / (amp * 2.07) * 0.5 + 0.5, 0.0, 1.0);
          float dist = length(vViewPosition);
          float detailFade = 1.0 - smoothstep(12.0, 68.0, dist);
          float ripple = sin(vSeaPosition.x*2.2+vSeaPosition.z*1.8+uRipplePhase.x);
          float crossRipple = sin(vSeaPosition.x*0.9-vSeaPosition.z*2.4+uRipplePhase.y);
          float weave = ripple*0.58+crossRipple*0.42;
          float fleck = smoothstep(0.25,0.87,weave);
          vec3 seaColor = mix(vec3(0.012,0.075,0.14), vec3(0.035,0.36,0.37), smoothstep(0.1,0.9,crest));
          seaColor += vec3(0.009,0.035,0.042)*weave*detailFade;
          float foam = smoothstep(0.77-uSeaStorm*0.07,0.97,crest)*fleck*detailFade;
          float rim = smoothstep(18.0,100.0,dist);
          seaColor = mix(seaColor,vec3(0.065,0.25,0.31),rim*0.48);
          diffuseColor.rgb *= mix(seaColor,vec3(0.79,0.89,0.87),foam*0.85);`);
    };
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.receiveShadow = true;
    // A superfície se desloca na GPU; sua AABB em CPU permanece plana.
    this.geometry.computeBoundingSphere();
    if (this.geometry.boundingSphere) this.geometry.boundingSphere.radius += 2;
  }

  update(centerX: number, centerZ: number, timeSec: number, stormFactor: number): void {
    const x = Math.round(centerX / this.gridSnap) * this.gridSnap;
    const z = Math.round(centerZ / this.gridSnap) * this.gridSnap;
    this.mesh.position.set(x, 0, z);
    const [a,b,c,d,e]=oceanPhases(x,z,timeSec);
    this.phase.value.set(a,b,c);this.ripplePhase.value.set(d,e);
    this.storm.value = stormFactor;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
