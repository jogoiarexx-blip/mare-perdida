import * as THREE from 'three';

export type WeatherKind = 'limpo' | 'neblina' | 'chuva';

/**
 * Iluminação solar/lunar, neblina atmosférica e clima leve do Mar dos Destroços.
 */
export class WeatherSystem {
  readonly sunLight: THREE.DirectionalLight;
  readonly hemiLight: THREE.HemisphereLight;
  weather: WeatherKind = 'limpo';
  stormFactor = 0;

  private readonly daySky = new THREE.Color(0x7cc7e8);
  private readonly duskSky = new THREE.Color(0xe68b55);
  private readonly nightSky = new THREE.Color(0x0b1c33);
  private readonly rainSky = new THREE.Color(0x4e6478);
  private readonly currentSky = new THREE.Color(0x7cc7e8);

  constructor(private readonly scene: THREE.Scene, highQuality = true) {
    this.hemiLight = new THREE.HemisphereLight(0xbbe9ff, 0x16425b, 0.75);
    scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff5dc, 1.5);
    this.sunLight.position.set(28, 42, 18);
    this.sunLight.castShadow = true;
    const shadowSize = highQuality ? 1024 : 512;
    this.sunLight.shadow.mapSize.set(shadowSize, shadowSize);
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 120;
    const d = 28;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    scene.add(this.sunLight);
    scene.add(this.sunLight.target);

    scene.background = this.currentSky;
    scene.fog = new THREE.FogExp2(this.currentSky.getHex(), 0.008);
  }

  setWeather(kind: WeatherKind): void {
    this.weather = kind;
  }

  update(timeOfDay: number, anchorX: number, anchorZ: number, dt: number): void {
    const targetStorm = this.weather === 'chuva' ? 0.55 : 0;
    this.stormFactor = THREE.MathUtils.lerp(this.stormFactor, targetStorm, Math.min(1, dt * 0.8));

    // Ângulo solar ao longo do ciclo 0..1
    const angle = (timeOfDay - 0.25) * Math.PI * 2;
    const sunElev = Math.sin(angle);
    const sunX = Math.cos(angle) * 45;
    const sunY = Math.max(8, sunElev * 52);

    this.sunLight.position.set(anchorX + sunX, sunY, anchorZ + 20);
    this.sunLight.target.position.set(anchorX, 0, anchorZ);

    const dayAmount = THREE.MathUtils.clamp((sunElev + 0.15) / 0.55, 0, 1);
    const duskAmount = THREE.MathUtils.clamp(1 - Math.abs(sunElev) * 4.2, 0, 1);

    this.currentSky.copy(this.nightSky).lerp(this.daySky, dayAmount);
    this.currentSky.lerp(this.duskSky, duskAmount * 0.55);
    if (this.stormFactor > 0.05) {
      this.currentSky.lerp(this.rainSky, this.stormFactor * 0.7);
    }

    this.scene.background = this.currentSky;
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(this.currentSky);
      this.scene.fog.density = this.weather === 'neblina' ? 0.018 : 0.007 + this.stormFactor * 0.006;
    }

    this.sunLight.intensity = THREE.MathUtils.lerp(0.28, 1.55, dayAmount) * (1 - this.stormFactor * 0.35);
    this.hemiLight.intensity = THREE.MathUtils.lerp(0.38, 0.82, dayAmount);
  }
}
