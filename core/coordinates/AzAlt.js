import { acosdeg, asindeg } from "../mathUtils.js";
import { DEG_TO_RAD, RAD_TO_DEG } from '../../utils/constants.js';
import { CanvasRaDec, Cartesian, RaDec } from "./index.js";
export function toRad(azalt) {
    return { az: azalt.az * DEG_TO_RAD, alt: azalt.alt * DEG_TO_RAD };
}
export function toRadec(azalt, lstLat) {
    const { az, alt } = toRad(azalt);
    const lat = lstLat.lat * DEG_TO_RAD;
    const sinAlt = Math.sin(alt);
    const cosAlt = Math.cos(alt);
    const sinLat = Math.sin(lat);
    const cosLat = Math.cos(lat);
    const sinAz = Math.sin(az);
    const cosAz = Math.cos(az);
    const x = sinLat * cosAlt * cosAz - cosLat * sinAlt;
    const y = -cosAlt * sinAz;
    const z = cosLat * cosAlt * cosAz + sinLat * sinAlt;
    const ra = ((lstLat.lst + Math.atan2(-y, -x)) * RAD_TO_DEG + 360) % 360;
    const dec = asindeg(z);
    return { ra: ra, dec: dec };
}
export function toRadecFast(azalt, sinLat, cosLat, siderealTimeRad) {
    const { az, alt } = toRad(azalt);
    const sinAlt = Math.sin(alt);
    const cosAlt = Math.cos(alt);
    const sinAz = Math.sin(az);
    const cosAz = Math.cos(az);
    const x = sinLat * cosAlt * cosAz - cosLat * sinAlt;
    const y = -cosAlt * sinAz;
    const z = cosLat * cosAlt * cosAz + sinLat * sinAlt;
    const ra = ((siderealTimeRad + Math.atan2(-y, -x)) * RAD_TO_DEG + 360) % 360;
    const dec = asindeg(z);
    return { ra: ra, dec: dec };
}
export function toCanvasRadec(azalt, config) {
    if (config.mode === 'AEP') {
        return RaDec.toCanvasRadec(toRadec(azalt, config.location), config);
    }
    else if (config.mode == 'view') {
        return toCanvasRadec_View(azalt, config.center);
    }
    else if (['live', 'ar'].includes(config.mode)) {
        return toCanvasRadec_Live(azalt, config.orientationData);
    }
    else {
        return { ra: 0.0, dec: 0.0 };
    }
}
export function toCanvasRadecFast(azaltRad, mode, centerRaRad, sinCenterDec, cosCenterDec, centerAzRad, sinCenterAlt, cosCenterAlt, sinLat, cosLat, siderealTimeRad, orientationData) {
    if (mode === 'AEP') {
        return RaDec.toCanvasRadecFast_AEP(toRadecFast(azaltRad, sinLat, cosLat, siderealTimeRad), centerRaRad, sinCenterDec, cosCenterDec);
    }
    else if (mode == 'view') {
        return toCanvasRadecFast_View(azaltRad, centerAzRad, sinCenterAlt, cosCenterAlt);
    }
    else if (['live', 'ar'].includes(mode)) {
        return toCanvasRadecFast_Live(azaltRad, orientationData);
    }
    else {
        return { ra: 0.0, dec: 0.0 };
    }
}
export function toCanvasXYifin(azalt, fov, canvasSize, transformConfig, force = false) {
    const canvasRaDec = toCanvasRadec(azalt, transformConfig);
    if (Math.abs(canvasRaDec.ra) < fov.ra * 0.5 && Math.abs(canvasRaDec.dec) < fov.dec * 0.5) {
        const xy = CanvasRaDec.toCanvasXY(canvasRaDec, canvasSize, fov);
        return [true, xy];
    }
    else if (force) {
        const xy = CanvasRaDec.toCanvasXY(canvasRaDec, canvasSize, fov);
        return [false, xy];
    }
    else {
        return [false, { x: 0, y: 0 }];
    }
}
// 地平座標からある方向を中心とした正距方位図法への変換
function toCanvasRadec_View(azalt, center) {
    const { az, alt } = toRad(azalt);
    const centerAzRad = center.az * DEG_TO_RAD;
    const centerAltRad = center.alt * DEG_TO_RAD;
    const az_diff = -(az - centerAzRad);
    const sinAlt = Math.sin(alt);
    const cosAlt = Math.cos(alt);
    const sinAzDiff = Math.sin(az_diff);
    const cosAzDiff = Math.cos(az_diff);
    const sinCenterAlt = Math.sin(centerAltRad);
    const cosCenterAlt = Math.cos(centerAltRad);
    const a = sinCenterAlt * cosAlt * cosAzDiff - cosCenterAlt * sinAlt;
    const b = cosAlt * sinAzDiff;
    const c = cosCenterAlt * cosAlt * cosAzDiff + sinCenterAlt * sinAlt;
    // const {x: a, y: b, z: c} = this.rotateY({x: cosAlt * cosAzDiff, y: cosAlt * sinAzDiff, z: sinAlt}, -Math.PI / 2 + centerAltRad);
    const r = acosdeg(c); //中心からの角距離, deg
    const d = r / Math.sqrt(a * a + b * b);
    return { ra: d * b, dec: -d * a };
}
// 地平座標からある方向を中心とした正距方位図法への変換
export function toCanvasRadecFast_View(azalt, centerAzRad, sinCenterAlt, cosCenterAlt) {
    const sinAlt = Math.sin(azalt.alt);
    const cosAlt = Math.cos(azalt.alt);
    const az_diff = -(azalt.az - centerAzRad);
    const sinAzDiff = Math.sin(az_diff);
    const cosAzDiff = Math.cos(az_diff);
    const a = sinCenterAlt * cosAlt * cosAzDiff - cosCenterAlt * sinAlt;
    const b = cosAlt * sinAzDiff;
    const c = cosCenterAlt * cosAlt * cosAzDiff + sinCenterAlt * sinAlt;
    // const {x: a, y: b, z: c} = this.rotateY({x: cosAlt * cosAzDiff, y: cosAlt * sinAzDiff, z: sinAlt}, -Math.PI / 2 + centerAltRad);
    const r = acosdeg(c); //中心からの角距離, deg
    const d = r / Math.sqrt(a * a + b * b);
    return { ra: d * b, dec: -d * a };
}
export function toCanvasRadec_Live(azalt, orientationData) {
    const alpha = orientationData.alpha;
    const beta = orientationData.beta;
    const gamma = orientationData.gamma;
    const compassHeading = orientationData.webkitCompassHeading;
    const az = (azalt.az - compassHeading - 90) * DEG_TO_RAD;
    const alt = azalt.alt * DEG_TO_RAD;
    const x0 = Math.cos(alt) * Math.cos(az);
    const y0 = -Math.cos(alt) * Math.sin(az);
    const z0 = Math.sin(alt);
    const xyz = Cartesian.rotateZ(Cartesian.rotateX(Cartesian.rotateY({ x: x0, y: y0, z: z0 }, -gamma), -beta), -alpha);
    if (-xyz.z >= 1) {
        return { ra: 0.0, dec: 0.0 };
    }
    else {
        const b = acosdeg(-xyz.z);
        const d = b / Math.sqrt(xyz.x * xyz.x + xyz.y * xyz.y);
        return { ra: -d * xyz.x, dec: d * xyz.y };
    }
}
export function toCanvasRadecFast_Live(azaltRad, orientationData) {
    const alpha = orientationData.alpha;
    const beta = orientationData.beta;
    const gamma = orientationData.gamma;
    const compassHeading = orientationData.webkitCompassHeading;
    const az = azaltRad.az - (compassHeading + 90) * DEG_TO_RAD;
    const x0 = Math.cos(azaltRad.alt) * Math.cos(az);
    const y0 = -Math.cos(azaltRad.alt) * Math.sin(az);
    const z0 = Math.sin(azaltRad.alt);
    const xyz = Cartesian.rotateZ(Cartesian.rotateX(Cartesian.rotateY({ x: x0, y: y0, z: z0 }, -gamma), -beta), -alpha);
    if (-xyz.z >= 1) {
        return { ra: 0.0, dec: 0.0 };
    }
    else {
        const b = acosdeg(-xyz.z);
        const d = b / Math.sqrt(xyz.x * xyz.x + xyz.y * xyz.y);
        return { ra: -d * xyz.x, dec: d * xyz.y };
    }
}
//# sourceMappingURL=AzAlt.js.map