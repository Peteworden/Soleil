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