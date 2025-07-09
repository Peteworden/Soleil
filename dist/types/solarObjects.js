// 太陽のインターフェース
// export interface SunObject {
//     type: 'sun';
// }
// // 月のインターフェース
// export interface MoonObject {
//     type: 'moon';
//     Ms: number;
//     Mm: number;
//     D: number;
//     F: number;
// }
// export interface PlanetObject {
//     type: 'planet';
//     orbit: PlanetOrbitalElements;
// }
// export interface AsteroidObject {
//     type: 'asteroid';
//     orbit: EllipticOrbitalElements;
// }
// export interface CometObject {
//     type: 'comet';
//     orbit: EllipticOrbitalElements | ParabolicOrHyperbolicOrbitalElements;
// }
// export type MinorObject = AsteroidObject | CometObject;
// 太陽系天体の統合型
// export type SolarSystemObject = 
//     | SunObject 
//     | MoonObject 
//     | PlanetObject 
//     | AsteroidObject 
//     | CometObject 
// 軌道要素を持つ天体の統合型
// export type OrbitalSolarObject = 
//     | PlanetObject 
//     | AsteroidObject 
//     | CometObject;
// 型ガード関数
export function isOrbitalObject(obj) {
    return 'orbit' in obj;
}
export function isPlanet(obj) {
    return obj.type === 'planet';
}
export function isAsteroid(obj) {
    return obj.type === 'asteroid';
}
export function isComet(obj) {
    return obj.type === 'comet';
}
export function isSun(obj) {
    return obj.type === 'sun';
}
export function isMoon(obj) {
    return obj.type === 'moon';
}
//# sourceMappingURL=solarObjects.js.map