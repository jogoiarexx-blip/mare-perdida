import * as THREE from 'three';
import { combine } from './DetailGeometry';
const box = (w:number,h:number,d:number,x=0,y=0,z=0) => new THREE.BoxGeometry(w,h,d).translate(x,y,z);
export function hookGeometry() {
  return combine([
    new THREE.TorusGeometry(.13,.035,6,14,Math.PI*1.35).rotateZ(-Math.PI*.4),
    new THREE.CylinderGeometry(.035,.035,.22,8).translate(0,.13,0),
    new THREE.TorusGeometry(.052,.016,5,8).translate(0,.27,0)
  ]);
}
export function collectionNet() {
  const parts: THREE.BufferGeometry[] = [];
  for(let i=-3;i<=3;i++){
    parts.push(box(.014,.014,.82,i*.12,0,0),box(.82,.014,.014,0,0,i*.12));
  }
  for(const s of [-1,1]) parts.push(box(.93,.06,.045,0,.02,s*.45),box(.045,.06,.93,s*.45,.02,0));
  return combine(parts);
}
export function plantGeometry() {
  const parts: THREE.BufferGeometry[]=[];
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5;
    parts.push(new THREE.CylinderGeometry(.014,.025,.34,5).rotateZ(.27).rotateY(a).translate(Math.cos(a)*.06,.17,Math.sin(a)*.06));
    parts.push(new THREE.SphereGeometry(1,7,5).scale(.085,.026,.19).rotateX(.48).rotateY(a).translate(Math.sin(a)*.12,.26,Math.cos(a)*.12));
  }
  return combine(parts).translate(0,-.17,0);
}
export function grillGeometry() {
  const parts: THREE.BufferGeometry[]=[];
  for(let i=-3;i<=3;i++) parts.push(new THREE.CylinderGeometry(.012,.012,.55,5).rotateX(Math.PI/2).translate(i*.078,0,0));
  for(const z of [-.26,.26]) parts.push(box(.57,.025,.032,0,0,z));
  return combine(parts);
}
export function radioFace() {
  const parts: THREE.BufferGeometry[]=[box(.26,.12,.035,-.15,.07,.245)];
  for(let i=0;i<4;i++) parts.push(box(.19,.014,.035,.15,-.09+i*.046,.245));
  parts.push(new THREE.CylinderGeometry(.055,.055,.04,12).rotateX(Math.PI/2).translate(.14,.11,.25));
  return combine(parts);
}
export function roofGeometry() {
  const parts: THREE.BufferGeometry[]=[];
  for(let i=-2;i<=2;i++) parts.push(box(.20,.07,1.05,i*.205,0,0).rotateZ(i*-.028));
  for(const z of [-.38,.38]) parts.push(box(1.06,.065,.06,0,-.05,z));
  return combine(parts);
}
