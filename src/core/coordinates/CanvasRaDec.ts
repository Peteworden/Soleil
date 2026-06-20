import { asindeg } from "../mathUtils.js";
import { CanvasRadecCoords, CanvasSize, CanvasXy, EquatorialCoordinates, Fov, HorizontalCoordinates, TransformModeConfig } from "../../types/index.js";
import { DEG_TO_RAD, RAD_TO_DEG } from '../../utils/constants.js';

import * as RaDec from "./RaDec.js"
import * as AzAlt from "./AzAlt.js"
import { Cartesian } from "./index.js";
import { Matrix3x3 } from "./Cartesian.js";
import { DeviceOrientationData } from "device/deviceOrientation.js";

export function isCenter(coord: CanvasRadecCoords): boolean {
    return coord.ra == 0 && coord.dec == 0;
}

export function toRad(canvasRadec: CanvasRadecCoords): CanvasRadecCoords {
    return { ra: canvasRadec.ra * DEG_TO_RAD, dec: canvasRadec.dec * DEG_TO_RAD };
}

export function toCanvasXY(canvasRadec: CanvasRadecCoords, canvasSize: CanvasSize, fov: Fov): CanvasXy {
    const x = canvasSize.width * (0.5 - canvasRadec.ra / fov.ra);
    const y = canvasSize.height * (0.5 - canvasRadec.dec / fov.dec);
    return { x, y };
}

/**
 * 
 * @param canvasRadec deg
 * @param config 
 * @returns deg
 */
export function toRaDec(
    canvasRadec: CanvasRadecCoords, config: TransformModeConfig
): EquatorialCoordinates {
    if (config.mode == 'AEP') {
        return toRadec_AEP(canvasRadec, config.center);
    } else if (config.mode == 'view') {
        return AzAlt.toRadec(toAzAlt_View(canvasRadec, config.center), config.location);
    } else if (['live', 'ar'].includes(config.mode)) {
        return AzAlt.toRadec(toAzAlt_Live(canvasRadec, config.orientationData), config.location);
    }
    return { ra: 0.0, dec: 0.0 };
}
// export function toRaDecFast(
//     canvasRadec: CanvasRadecCoords, rotation: Matrix3x3
// ): EquatorialCoordinates {
//     if (config.mode == 'AEP') {
//         return toRadecFast_AEP(canvasRadec, config.center);
//     } else if (config.mode == 'view') {
//         return AzAlt.toRadecFast(toAzAltFast_View(canvasRadec, rotation), config.location);
//     } else if (['live', 'ar'].includes(config.mode)) {
//         return AzAlt.toRadecFast(toAzAltFast_Live(canvasRadec, config.orientationData), config.location);
//     }
//     return {ra: 0.0, dec: 0.0};
// }

/**
 * 
 * @param canvasRadec deg
 * @param config 
 * @returns deg
 */
export function toAzAlt(
    canvasRadec: CanvasRadecCoords,
    config: TransformModeConfig
): HorizontalCoordinates {
    if (config.mode == 'AEP') {
        return RaDec.toAzalt(toRadec_AEP(canvasRadec, config.center), config.location);
    }
    else if (config.mode == 'view') {
        return toAzAlt_View(canvasRadec, config.center);
    }
    else if (['live', 'ar'].includes(config.mode)) {
        return toAzAlt_Live(canvasRadec, config.orientationData);
    }
    return { az: 0.0, alt: 0.0 };
}

function toRadec_AEP(canvasRadec: CanvasRadecCoords, center: EquatorialCoordinates): EquatorialCoordinates {
    if (isCenter(canvasRadec)) {
        return center;
    } else {
        const thetaSH = Math.atan2(canvasRadec.ra, -canvasRadec.dec);
        const r = Math.sqrt(canvasRadec.ra * canvasRadec.ra + canvasRadec.dec * canvasRadec.dec) * DEG_TO_RAD;
        const centerDec_rad = center.dec * DEG_TO_RAD;

        const sinDec = Math.sin(centerDec_rad);
        const cosDec = Math.cos(centerDec_rad);
        const sinR = Math.sin(r);
        const cosR = Math.cos(r);
        const sinThetaSH = Math.sin(thetaSH);
        const cosThetaSH = Math.cos(thetaSH);

        const a = sinDec * sinR * cosThetaSH + cosDec * cosR;
        const b = sinR * sinThetaSH;
        const c = -cosDec * sinR * cosThetaSH + sinDec * cosR;

        const dec = asindeg(c);
        const ra = ((Math.atan2(b, a) * RAD_TO_DEG + center.ra) % 360 + 360) % 360;
        return { ra: ra, dec: dec };
    }
}
function toRadecFast_AEP(
    canvasRadec: CanvasRadecCoords, centerRaRad: number, centerDecRad: number, sinCenterDec: number, cosCenterDec: number
): EquatorialCoordinates {
    if (isCenter(canvasRadec)) {
        return { ra: centerRaRad, dec: centerDecRad };
    } else {
        const thetaSH = Math.atan2(canvasRadec.ra, -canvasRadec.dec);
        const r = Math.sqrt(canvasRadec.ra * canvasRadec.ra + canvasRadec.dec * canvasRadec.dec) * DEG_TO_RAD;

        const sinR = Math.sin(r);
        const cosR = Math.cos(r);
        const sinThetaSH = Math.sin(thetaSH);
        const cosThetaSH = Math.cos(thetaSH);

        const a = sinCenterDec * sinR * cosThetaSH + cosCenterDec * cosR;
        const b = sinR * sinThetaSH;
        const c = -cosCenterDec * sinR * cosThetaSH + sinCenterDec * cosR;

        return { ra: Math.atan2(b, a) + centerRaRad, dec: asindeg(c) };
    }
}

// ViewモードでスクリーンRaDecから地平座標への変換
function toAzAlt_View(canvasRadec: CanvasRadecCoords, center: HorizontalCoordinates): HorizontalCoordinates {
    if (isCenter(canvasRadec)) {
        return center;
    }
    const { ra, dec } = toRad(canvasRadec);
    const thetaSH = Math.atan2(ra, -dec);
    const r = Math.sqrt(ra * ra + dec * dec);
    const centerRad = AzAlt.toRad(center);

    const sinR = Math.sin(r);
    const cosR = Math.cos(r);
    const sinThetaSH = Math.sin(thetaSH);
    const cosThetaSH = Math.cos(thetaSH);

    const xyz = { x: sinR * cosThetaSH, y: sinR * sinThetaSH, z: cosR };
    const abc = Cartesian.rotateY(xyz, Math.PI / 2 - centerRad.alt);
    const { x: a, y: b, z: c } = Cartesian.rotateZ(abc, -centerRad.az);

    const alt = asindeg(c);
    const az = ((Math.atan2(-b, a) * RAD_TO_DEG) % 360 + 360) % 360;
    return { az: az, alt: alt };
}
function toAzAltFast_View(
    canvasRadec: CanvasRadecCoords, rotation: Matrix3x3
): HorizontalCoordinates {
    const { ra, dec } = toRad(canvasRadec);
    const thetaSH = Math.atan2(ra, -dec);
    const r = Math.sqrt(ra * ra + dec * dec);

    const sinR = Math.sin(r);
    const cosR = Math.cos(r);
    const sinThetaSH = Math.sin(thetaSH);
    const cosThetaSH = Math.cos(thetaSH);

    const xyz = { x: sinR * cosThetaSH, y: sinR * sinThetaSH, z: cosR };
    const { x: a, y: b, z: c } = Cartesian.transform(xyz, rotation);

    return { az: Math.atan2(-b, a), alt: asindeg(c) };
}

// LiveモードでスクリーンRaDecから地平座標への変換
export function toAzAlt_Live(
    canvasRadec: CanvasRadecCoords,
    orientationData: DeviceOrientationData
): HorizontalCoordinates {
    const theta = Math.atan2(canvasRadec.dec, -canvasRadec.ra); //画面上で普通に極座標
    const r = Math.sqrt(canvasRadec.ra * canvasRadec.ra + canvasRadec.dec * canvasRadec.dec) * DEG_TO_RAD;
    const alpha = orientationData.alpha;
    const beta = orientationData.beta;
    const gamma = orientationData.gamma;
    const xyz = { x: Math.sin(r) * Math.cos(theta), y: Math.sin(r) * Math.sin(theta), z: -Math.cos(r) };
    const { x, y, z } = Cartesian.rotateZ(Cartesian.rotateX(Cartesian.rotateY(xyz, gamma), beta), alpha);
    const alt = asindeg(z);
    const az = ((Math.atan2(-y, x) * RAD_TO_DEG + (orientationData.webkitCompassHeading || 0) + 90) % 360 + 360) % 360;
    return { az: az, alt: alt };
}