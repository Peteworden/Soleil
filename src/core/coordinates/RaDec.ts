import { acosdeg, asindeg, asinrad } from "../../core/mathUtils.js";
import { CanvasRadecCoords, CanvasSize, CanvasXy, CartesianCoords, EquatorialCoordinates, Fov, HorizontalCoordinates, LstLat, TransformModeConfig, ViewState } from "../../types";
import { COS_EPSL, DEG_TO_RAD, EPSILON, RAD_TO_DEG, SIN_EPSL } from "../../utils/constants.js";
import { AzAlt, CanvasRaDec, Cartesian } from "./index.js";
import { AstronomicalCalculator } from "../../core/calculations.js";
import { DeviceOrientationData } from "device/deviceOrientation.js";

export function toRad(radec: EquatorialCoordinates): EquatorialCoordinates {
    return {ra: radec.ra * DEG_TO_RAD, dec: radec.dec * DEG_TO_RAD};
}

export function distance(radec1: EquatorialCoordinates, radec2: EquatorialCoordinates) : number {
    const {ra: ra1, dec: dec1} = toRad(radec1);
    const {ra: ra2, dec: dec2} = toRad(radec2);
    return acosdeg(Math.cos(dec1) * Math.cos(dec2) * Math.cos(ra1 - ra2) + Math.sin(dec1) * Math.sin(dec2));
}

export function precession(
    radec: EquatorialCoordinates,
    precessionAngle?: number,
    time1?: number | string, time2?: number | string
): EquatorialCoordinates {
    if (precessionAngle == undefined) {
        if ((typeof time1 == 'string' && time1 != 'j2000') || (typeof time2 == 'string' && time2 != 'j2000')) {
            console.warn('precession: invalid time1 of time2');
            return radec;
        }
        if (time1 == undefined || typeof time1 == 'string') time1 = 2451545.0;
        if (time2 == undefined || typeof time1 == 'string') time2 = 2451545.0;
        precessionAngle = AstronomicalCalculator.precessionAngle(time1, time2);
    }
    const {x, y, z} = toCartesian(radec, 1);
    const sin = Math.sin(precessionAngle);
    const cos = Math.cos(precessionAngle);
    // const xyz2 = this.rotateX(xyz1, -epsilon);
    // const xyz3 = this.rotateZ(xyz2, precessionAngle);
    // const xyz4 = this.rotateX(xyz3, epsilon);
    const a = y*COS_EPSL+z*SIN_EPSL;
    const b = -y*SIN_EPSL+z*COS_EPSL;
    const xyz2 = {
        x: x*cos - y*COS_EPSL*sin - z*SIN_EPSL*sin,
        y: COS_EPSL * (x*sin + cos*a) - SIN_EPSL * b,
        z: SIN_EPSL * (x*sin + cos*a) + COS_EPSL * b
    }
    return Cartesian.toRaDec(xyz2);
}

/* radで返ることに注意*/
export function precessionFast(
    radecRad: EquatorialCoordinates, sin: number, cos: number
): EquatorialCoordinates {
    const x = Math.cos(radecRad.ra) * Math.cos(radecRad.dec);
    const y = Math.sin(radecRad.ra) * Math.cos(radecRad.dec);
    const z = Math.sin(radecRad.dec);
    const a = y*COS_EPSL+z*SIN_EPSL;
    const b = -y*SIN_EPSL+z*COS_EPSL;
    const c = x*sin + cos*a;
    const x2 = x * cos - a * sin;
    const y2 = COS_EPSL * c - SIN_EPSL * b;
    const z2 = SIN_EPSL * c + COS_EPSL * b;
    return {ra: Math.atan2(y2, x2), dec: asinrad(z2) }
}

export function toAzalt (coords: EquatorialCoordinates, lstLat: LstLat): HorizontalCoordinates {
    const ra = coords.ra * DEG_TO_RAD;
    const dec = coords.dec * DEG_TO_RAD;
    const lat = lstLat.lat * DEG_TO_RAD;
    const hourAngle = lstLat.lst - ra;
    const sinDec = Math.sin(dec);
    const cosDec = Math.cos(dec);
    const sinLat = Math.sin(lat);
    const cosLat = Math.cos(lat);
    const sinHourAngle = Math.sin(hourAngle);
    const cosHourAngle = Math.cos(hourAngle);
    const x =  cosLat * sinDec - sinLat * cosDec * cosHourAngle;
    const y = -cosDec * sinHourAngle;
    const z =  sinLat * sinDec + cosLat * cosDec * cosHourAngle;
    const az = (Math.atan2(y, x) * RAD_TO_DEG + 360) % 360;
    const alt = asindeg(z);
    return {az, alt};
}
export function toAzaltFast (
    coordsRad: EquatorialCoordinates,
    sinLat: number, cosLat: number, siderealTime: number
): HorizontalCoordinates {
    const sinDec = Math.sin(coordsRad.dec);
    const cosDec = Math.cos(coordsRad.dec);
    const hourAngle = siderealTime - coordsRad.ra;
    const sinHourAngle = Math.sin(hourAngle);
    const cosHourAngle = Math.cos(hourAngle);
    const x =  cosLat * sinDec - sinLat * cosDec * cosHourAngle;
    const y = -cosDec * sinHourAngle;
    const z =  sinLat * sinDec + cosLat * cosDec * cosHourAngle;
    const az = Math.atan2(y, x);
    const alt = asinrad(z);
    return {az, alt};
}

export function toEcliptic(radec: EquatorialCoordinates): {lon: number, lat: number} {
    const {x, y, z} = Cartesian.rotateX(toCartesian(radec), -EPSILON);
    const lon = Math.atan2(y, x) * RAD_TO_DEG;
    const lat = asindeg(z);
    return {lon: (lon + 360) % 360, lat: lat};
}

export function toCartesian(radec: EquatorialCoordinates, distance: number = 1): CartesianCoords {
    const {ra, dec} = toRad(radec);
    return {
        x: distance * Math.cos(dec) * Math.cos(ra),
        y: distance * Math.cos(dec) * Math.sin(ra),
        z: distance * Math.sin(dec)
    };
}

export function toCanvasRadec(
    radec: EquatorialCoordinates,
    config: TransformModeConfig
): CanvasRadecCoords {
    if (config.mode == 'AEP') {
        return toCanvasRadec_AEP(radec, config.center);
    } else if (config.mode == 'view') {
        return AzAlt.toCanvasRadec(toAzalt(radec, config.location), config);
    } else if (['live', 'ar'].includes(config.mode)) {
        return AzAlt.toCanvasRadec_Live(toAzalt(radec, config.location), config.orientationData);
    }
    return { ra: 0, dec: 0 };
}
export function toCanvasRadecFast(
    radec: EquatorialCoordinates,
    mode: string,
    centerRaRad: number, sinCenterDec: number, cosCenterDec: number,
    centerAzRad: number, sinCenterAlt: number, cosCenterAlt: number,
    sinLat: number, cosLat: number, siderealTime: number, orientationData: DeviceOrientationData
): CanvasRadecCoords {
    if (mode == 'AEP') {
        return toCanvasRadecFast_AEP(radec, centerRaRad, sinCenterDec, cosCenterDec);
    } else if (mode == 'view') {
        return AzAlt.toCanvasRadecFast_View(toAzaltFast(radec, sinLat, cosLat, siderealTime), centerAzRad, sinCenterAlt, cosCenterAlt);
    } else if (['live', 'ar'].includes(mode)) {
        return AzAlt.toCanvasRadecFast_Live(toAzaltFast(radec, sinLat, cosLat, siderealTime), orientationData);
    }
    return { ra: 0, dec: 0 };
}

export function toCanvasXYifin(
    radec: EquatorialCoordinates,
    fov: Fov, canvasSize: CanvasSize, transformConfig: TransformModeConfig, force: boolean = false
): [boolean, CanvasXy] {
    const canvasRaDec = toCanvasRadec(radec, transformConfig);
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

export function toCanvasXYifinFast(
    radec: EquatorialCoordinates, mode: string,
    centerRaRad: number, sinCenterDec: number, cosCenterDec: number,
    centerAzRad: number, sinCenterAlt: number, cosCenterAlt: number,
    sinLat: number, cosLat: number, siderealTime: number, orientationData: DeviceOrientationData,
    fov: Fov, canvasSize: CanvasSize, force: boolean = false
): [boolean, CanvasXy] {
    const canvasRaDec = toCanvasRadecFast(
        radec, mode, centerRaRad, sinCenterDec, cosCenterDec, centerAzRad, sinCenterAlt, cosCenterAlt, sinLat, cosLat, siderealTime, orientationData
    );
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

// 赤道座標からある方向を中心とした正距方位図法への変換
export function toCanvasRadec_AEP(
    coords: EquatorialCoordinates, 
    center: EquatorialCoordinates
): CanvasRadecCoords {
    const ra = coords.ra * DEG_TO_RAD;
    const dec = coords.dec * DEG_TO_RAD;
    const centerRARad = center.ra * DEG_TO_RAD;
    const centerDecRad = center.dec * DEG_TO_RAD;
    const ra_diff = ra - centerRARad;

    const sinDec = Math.sin(dec);
    const cosDec = Math.cos(dec);
    const sinCenterDec = Math.sin(centerDecRad);
    const cosCenterDec = Math.cos(centerDecRad);

    const a = sinCenterDec * cosDec * Math.cos(ra_diff) - cosCenterDec * sinDec; // 下向き
    const b =                cosDec * Math.sin(ra_diff); // 左向き
    const c = cosCenterDec * cosDec * Math.cos(ra_diff) + sinCenterDec * sinDec;

    const r = acosdeg(c); //中心からの角距離, deg
    const d = 1.0 / Math.sqrt(a * a + b * b);
    return {ra: r * d * b, dec : - r * d * a};
}
export function toCanvasRadecFast_AEP(
    coordsRad: EquatorialCoordinates, 
    centerRaRad: number,
    sinCenterDec: number,
    cosCenterDec: number,
): CanvasRadecCoords {
    const ra_diff = coordsRad.ra - centerRaRad;
    const sinDec = Math.sin(coordsRad.dec);
    const cosDec = Math.cos(coordsRad.dec);
    const cosRaDiff = Math.cos(ra_diff);

    const a = sinCenterDec * cosDec * cosRaDiff - cosCenterDec * sinDec;
    const b =                cosDec * Math.sin(ra_diff);
    const c = cosCenterDec * cosDec * cosRaDiff + sinCenterDec * sinDec;

    const r = acosdeg(c); //中心からの角距離, deg
    const d = r / Math.sqrt(a * a + b * b);
    return {ra: d * b, dec : -d * a};
}