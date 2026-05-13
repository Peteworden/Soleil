import { CanvasRadecCoords, CanvasSize, CanvasXy, EquatorialCoordinates, Fov, HorizontalCoordinates, LstLat, StarChartConfig, TransformModeConfig, ViewState } from "../../types/index.js";
import { acosdeg, asindeg } from "../mathUtils.js";
// import { Cartesian } from "./Cartesian.js";
import { DEG_TO_RAD, RAD_TO_DEG } from '../../utils/constants.js';
import { CanvasRaDec, Cartesian, RaDec } from "./index.js";

export function toRad(azalt: HorizontalCoordinates): HorizontalCoordinates {
    return {az: azalt.az * DEG_TO_RAD, alt: azalt.alt * DEG_TO_RAD};
}

export function toRadec(azalt: HorizontalCoordinates, lstLat: LstLat): EquatorialCoordinates {
    const {az, alt} = toRad(azalt)
    const lat = lstLat.lat * DEG_TO_RAD;
    const sinAlt = Math.sin(alt);
    const cosAlt = Math.cos(alt);
    const sinLat = Math.sin(lat);
    const cosLat = Math.cos(lat);
    const sinAz = Math.sin(az);
    const cosAz = Math.cos(az);
    const x =  sinLat * cosAlt * cosAz - cosLat * sinAlt;
    const y = -cosAlt * sinAz;
    const z =  cosLat * cosAlt * cosAz + sinLat * sinAlt;
    const ra = ((lstLat.lst + Math.atan2(-y, -x)) * RAD_TO_DEG + 360) % 360;
    const dec = asindeg(z);
    return {ra: ra, dec: dec};
}

export function toCanvasRadec(
    azalt: HorizontalCoordinates,
    config: TransformModeConfig
): CanvasRadecCoords {
    if (config.mode === 'AEP') {
        return RaDec.toCanvasRadec(toRadec(azalt, config.location), config)
    } else if (config.mode == 'view') {
        return toCanvasRadec_View(azalt, config.center);
    } else if (['live', 'ar'].includes(config.mode)) {
        return toCanvasRadec_Live(azalt, config.orientationData);
    } else {
        return {ra: 0.0, dec: 0.0};
    }
}

export function toCanvasXYifin(
    azalt: HorizontalCoordinates,
    fov: Fov, canvasSize: CanvasSize, transformConfig: TransformModeConfig, force: boolean = false
): [boolean, CanvasXy] {
    const canvasRaDec = toCanvasRadec(azalt, transformConfig);
    if (Math.abs(canvasRaDec.ra) < fov.ra * 0.5 && Math.abs(canvasRaDec.dec) < fov.dec * 0.5) {
        const xy = CanvasRaDec.toCanvasXY(canvasRaDec, canvasSize, fov);
        return [true, xy];
    } else if (force) {
        const xy = CanvasRaDec.toCanvasXY(canvasRaDec, canvasSize, fov);
        return [false, xy];
    } else {
        return [false, {x: 0, y: 0}];
    }
}

// 地平座標からある方向を中心とした正距方位図法への変換
function toCanvasRadec_View(
    azalt: HorizontalCoordinates,
    center: HorizontalCoordinates
): CanvasRadecCoords {
    const {az, alt} = toRad(azalt);
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
    const b =                cosAlt * sinAzDiff;
    const c = cosCenterAlt * cosAlt * cosAzDiff + sinCenterAlt * sinAlt;
    // const {x: a, y: b, z: c} = this.rotateY({x: cosAlt * cosAzDiff, y: cosAlt * sinAzDiff, z: sinAlt}, -Math.PI / 2 + centerAltRad);

    const r = acosdeg(c); //中心からの角距離, deg
    const thetaSH = Math.atan2(b, a); //南（下）向きから時計回り
    const scrRa = r * Math.sin(thetaSH);
    const scrDec = - r * Math.cos(thetaSH);
    return {ra: scrRa, dec: scrDec};
}

export function toCanvasRadec_Live(
    azalt: HorizontalCoordinates,
    orientationData: { alpha: number, beta: number, gamma: number, webkitCompassHeading: number }
): CanvasRadecCoords {
    const alpha = orientationData.alpha;
    const beta = orientationData.beta;
    const gamma = orientationData.gamma;
    const compassHeading = orientationData.webkitCompassHeading;
    const az = (azalt.az - compassHeading - 90) * DEG_TO_RAD;
    const alt = azalt.alt * DEG_TO_RAD;
    const x0 = Math.cos(alt) * Math.cos(az);
    const y0 = -Math.cos(alt) * Math.sin(az);
    const z0 = Math.sin(alt);
    // const xyz = new Cartesian(x0, y0, z0).rotateX(-alpha).rotateY(-beta).rotateZ(-gamma);
    const xyz = Cartesian.rotateZ(Cartesian.rotateX(Cartesian.rotateY({x: x0, y: y0, z: z0}, -gamma), -beta), -alpha);
    if (-xyz.z >= 1) {
        return {ra: 0.0, dec: 0.0};
    } else {
        const b = acosdeg(-xyz.z);
        const scrRA = -b * xyz.x / Math.sqrt(xyz.x*xyz.x + xyz.y*xyz.y);
        const scrDec = b * xyz.y / Math.sqrt(xyz.x*xyz.x + xyz.y*xyz.y);
        return {ra: scrRA, dec: scrDec};
    }
}