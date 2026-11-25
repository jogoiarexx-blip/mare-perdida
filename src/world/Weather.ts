import * as THREE from 'three';

export type WeatherKind = 'limpo' | 'neblina' | 'chuva';

/** Ciclos determinísticos de 4 minutos, sem dependência de estado salvo novo. */
export function weatherAt(seed:number,seconds:number):WeatherKind {
  const period=Math.max(0,Math.floor(seconds/240));
  if(period===0)return 'limpo';
  const n=((Math.imul((seed|0)^period,1597334677)>>>0)/4294967296);
  return n<.23?'chuva':n<.40?'neblina':'limpo';
}

/**
 * Iluminação solar/lunar, neblina atmosférica e clima leve do Mar dos Destroços.
 */
export class WeatherSystem {
  readonly sunLight: THREE.DirectionalLight;
  readonly hemiLight: THREE.HemisphereLight;
  weather: WeatherKind = 'limpo';
  stormFactor = 0;

  private readonly daySky = new THREE.Color(0x91c9e5);
  private readonly duskSky = new THREE.Color(0xf2a76c);
  private readonly nightSky = new THREE.Color(0x102139);
  private readonly rainSky = new THREE.Color(0x617483);
  private readonly warmSun = new THREE.Color(0xffb176);
  private readonly daySun = new THREE.Color(0xfff3db);
  private readonly moonSun = new THREE.Color(0x91b9eb);
  private weatherElapsed=0;
  private readonly currentSky = new THREE.Color(0x91c9e5);

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
    this.weatherElapsed+=dt;
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
      this.scene.fog.density = this.weather === 'neblina' ? 0.018 : 0.010 + this.stormFactor * 0.007;
    }

    this.sunLight.color.copy(this.moonSun).lerp(this.daySun, dayAmount).lerp(this.warmSun, duskAmount * 0.68);
    this.sunLight.intensity = THREE.MathUtils.lerp(0.28, 1.55, dayAmount) * (1 - this.stormFactor * 0.35);
    // Clarão distante e suave, sem luz extra, sombras extras ou efeito estroboscópico.
    const lightning=this.weather==='chuva'&&this.stormFactor>.35?Math.max(0,1-Math.abs((this.weatherElapsed%23)-17)*2):0;
    this.hemiLight.intensity = THREE.MathUtils.lerp(0.38, 0.82, dayAmount)+lightning*.22;
  }
}
