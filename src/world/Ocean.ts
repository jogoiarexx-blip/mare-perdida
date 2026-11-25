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

/**
 * Malha de oceano centrada na embarcação com deslocamento de vértices e cor turquesa/azul por altura.
 */
export class OceanRenderer {
  readonly mesh: THREE.Mesh;
  private readonly geometry: THREE.PlaneGeometry;
  private readonly material: THREE.MeshStandardMaterial;
  private readonly basePositions: Float32Array;
  private readonly colors: Float32Array;
  private readonly gridSnap = 2.0;

  constructor(lowQuality = false) {
    const size = 220;
    const segments = lowQuality ? 48 : 88;
    this.geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    this.geometry.rotateX(-Math.PI / 2);

    const posAttr = this.geometry.attributes.position as THREE.BufferAttribute;
    this.basePositions = new Float32Array(posAttr.array.length);
    this.basePositions.set(posAttr.array as Float32Array);

    this.colors = new Float32Array(posAttr.count * 3);
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.26,
      metalness: 0.14,
      flatShading: lowQuality,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.receiveShadow = true;
  }

  update(centerX: number, centerZ: number, timeSec: number, stormFactor: number): void {
    const snappedX = Math.round(centerX / this.gridSnap) * this.gridSnap;
    const snappedZ = Math.round(centerZ / this.gridSnap) * this.gridSnap;
    this.mesh.position.set(snappedX, 0, snappedZ);

    const posAttr = this.geometry.attributes.position as THREE.BufferAttribute;
    const colorAttr = this.geometry.attributes.color as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const count = posAttr.count;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const lx = this.basePositions[idx];
      const lz = this.basePositions[idx + 2];
      const wx = lx + snappedX;
      const wz = lz + snappedZ;
      const h = getWaveHeight(wx, wz, timeSec, stormFactor);
      arr[idx + 1] = h;

      // Interpola de azul profundo no vale para turquesa + espuma nas cristas
      const crest = THREE.MathUtils.clamp((h + 0.35) / 0.85, 0, 1);
      const foam = crest > 0.82 ? (crest - 0.82) * 3.8 : 0;
      const r = THREE.MathUtils.lerp(0.03, 0.14, crest) + foam * 0.45;
      const g = THREE.MathUtils.lerp(0.24, 0.58, crest) + foam * 0.35;
      const b = THREE.MathUtils.lerp(0.42, 0.68, crest) + foam * 0.25;

      this.colors[idx] = Math.min(1, r);
      this.colors[idx + 1] = Math.min(1, g);
      this.colors[idx + 2] = Math.min(1, b);
    }

    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
