"use strict";
// // 太陽系天体の種類
// export type SolarObjectType = 'sun' | 'planet' | 'moon' | 'asteroid' | 'comet';
// interface OrbitalElementsCore {
//     t0: number;        // 元期（ユリウス日）
//     e: number;         // 離心率
//     incl: number;      // 軌道傾斜角（度）
//     node: number;      // 昇交点黄経（度）
// }
// export interface PlanetOrbitalElements extends OrbitalElementsCore {
//     a: number;         // 軌道長半径（AU）
//     meanLong: number;  // 平均黄経（度）
//     longPeri: number;  // 近日点黄経（度）
//     da: number;        // 軌道長半径の変化率
//     de: number;        // 離心率の変化率
//     dIncl: number;     // 軌道傾斜角の変化率
//     dMeanLong: number; // 平均黄経の変化率
//     dLongPeri: number; // 近日点黄経の変化率
//     dNode: number;     // 昇交点黄経の変化率
//     // 木星・土星・天王星・海王星用の追加項
//     sup1?: number;
//     sup2?: number;
//     sup3?: number;
//     sup4?: number;
// }
// // 小惑星の軌道要素インターフェース
// export interface EllipticOrbitalElements extends OrbitalElementsCore {
//     a: number;         // 軌道長半径（AU）
//     peri: number;      // 近日点引数（度）
//     m0: number;        // 元期の平均近点角（度）
//     H?: number;         // 絶対等級
//     G?: number;        // 位相係数
// }
// export interface ParabolicOrHyperbolicOrbitalElements extends OrbitalElementsCore {
//     q: number;         // 近日点距離（AU）
//     peri: number;      // 近日点引数（度）
//     H?: number;         // 絶対等級
//     G?: number;        // 位相係数
// }
// export function isPlanet(obj: any): boolean {
//     return obj.type === 'planet';
// }
// export function isAsteroid(obj: any): boolean {
//     return obj.type === 'asteroid';
// }
// export function isComet(obj: any): boolean {
//     return obj.type === 'comet';
// }
// export function isSun(obj: any): boolean {
//     return obj.type === 'sun';
// }
// export function isMoon(obj: any): boolean {
//     return obj.type === 'moon';
// } 
//# sourceMappingURL=solarObjects.js.map