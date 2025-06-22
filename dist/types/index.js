// 座標系の型ガード関数
export function isEquatorialCoordinates(obj) {
    return obj && typeof obj.ra === 'number' && typeof obj.dec === 'number';
}
export function isHorizontalCoordinates(obj) {
    return obj && typeof obj.az === 'number' && typeof obj.alt === 'number';
}
export function isCartesianCoordinates(obj) {
    return obj && typeof obj.x === 'number' && typeof obj.y === 'number' && typeof obj.z === 'number';
}
// 座標系の変換ユーティリティ関数
export function toCelestialCoordinates(coords) {
    if (isEquatorialCoordinates(coords)) {
        return { primary: coords.ra, secondary: coords.dec };
    }
    else if (isHorizontalCoordinates(coords)) {
        return { primary: coords.az, secondary: coords.alt };
    }
    else {
        throw new Error('Invalid coordinates type');
    }
}
export function fromCelestialCoordinates(celestial, system) {
    if (system === 'equatorial') {
        return { ra: celestial.primary, dec: celestial.secondary };
    }
    else {
        return { az: celestial.primary, alt: celestial.secondary };
    }
}
// 座標系の判定関数
export function getCoordinateSystem(coords) {
    if (isEquatorialCoordinates(coords)) {
        return 'equatorial';
    }
    else if (isHorizontalCoordinates(coords)) {
        return 'horizontal';
    }
    else {
        throw new Error('Unknown coordinate system');
    }
}
//# sourceMappingURL=index.js.map