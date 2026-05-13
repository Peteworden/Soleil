import { DataStore } from '../models/DataStore.js';
import { HorizontalCoordinates, CartesianCoords, EquatorialCoordinates, ViewState, StarChartConfig, CanvasSize } from '../types/index.js';
import { DeviceOrientationManager } from '../device/deviceOrientation.js';
import { TransformModeConfig, LstLat } from '../types/index.js';
// import { loadWasm } from './wasmLoader.js';
import { asinrad, acosrad, asindeg, acosdeg } from './mathUtils.js';
import { DEG_TO_RAD, RAD_TO_DEG, COS_EPSL, SIN_EPSL } from '../utils/constants.js';
import { Cartesian, RaDec } from './coordinates/index.js';

export class CoordinateConverter {

    // async getWasm(): Promise<any> {
    //     if (!this.wasm) {
    //         this.wasm = await loadWasm();
    //     }
    //     return this.wasm;
    // }

    // rotateX(coords: CartesianCoordinates, angle: number): CartesianCoordinates {
    //     const sin = Math.sin(angle);
    //     const cos = Math.cos(angle);
    //     const ans = {
    //         x: coords.x,
    //         y: cos*coords.y-sin*coords.z,
    //         z: sin*coords.y+cos*coords.z
    //     };
    //     return ans;
    // }

    // rotateY(coords: CartesianCoordinates, angle: number): CartesianCoordinates {
    //     const sin = Math.sin(angle);
    //     const cos = Math.cos(angle);
    //     const ans = {
    //         x: cos*coords.x+sin*coords.z,
    //         y: coords.y,
    //         z: -sin*coords.x+cos*coords.z
    //     };
    //     return ans;
    // }

    // rotateZ(coords: CartesianCoordinates, angle: number): CartesianCoordinates {
    //     const sin = Math.sin(angle);
    //     const cos = Math.cos(angle);
    //     const ans = {
    //         x: cos*coords.x-sin*coords.y,
    //         y: sin*coords.x+cos*coords.y,
    //         z: coords.z
    //     };
    //     return ans;
    // }

    rahmToDeg(rahmtext: string): number {
        const rahm = rahmtext.split(' ').map(Number);
        if (rahm.length == 2) {
            return rahm[0] * 15 + rahm[1] * 0.25;
        } else {
            return rahm[0] * 15 + rahm[1] * 0.25 + rahm[2] / 240;
        }
    }

    decdmToDeg(decdmtext: string): number {
        const decdm = decdmtext.split(' ').map(Number);
        const dec = (Math.abs(decdm[0]) + decdm[1] / 60) * (decdmtext[0] == '-' ? -1 : 1);
        return dec;
    }

    radeg2hm(ra_deg: number): number[] {
        let h = Math.floor(ra_deg / 15);
        let m = Math.round((ra_deg - 15 * h) * 40);
        if (m == 600) {
            m = 0.0;
            if (h == 23) h = 0;
            else h += 1;
        } else {
            m = m / 10;
        }
        return [h, m];
    }

    radeg2hms(ra_deg: number): [number, number, number] {
        let h = Math.floor(ra_deg / 15);
        let m = Math.floor((ra_deg - 15 * h) * 4);
        let s = Math.round(((ra_deg - 15 * h) * 4 - m) * 60);
        if (s == 60) {
            s = 0;
            m += 1;
        }
        if (m == 60) {
            m = 0;
            h += 1;
        }
        if (h == 24) {
            h = 0;
        }
        return [h, m, s];
    }

    decdeg2dm(dec_deg: number): [string, number, number] {
        let d, m;
        const sign = dec_deg >= 0 ? '+' : '-';
        const decAbs = Math.abs(dec_deg);
        d = Math.floor(decAbs);
        m = Math.round((decAbs - d) * 60);
        if (m == 60) {
            m = 0;
            d += 1;
        }
        return [sign, d, m];
    }

    decdeg2dm2(dec_deg: number): [string, number, number] {
        let d, m;
        const sign = dec_deg >= 0 ? '+' : '-';
        const decAbs = Math.abs(dec_deg);
        d = Math.floor(decAbs);
        m = Math.round((decAbs - d) * 600);
        if (m == 600) {
            m = 0;
            d += 1;
        }
        return [sign, d, m/10.0];
    }

    chartConfigToTransformConfig(chartConfig: StarChartConfig): TransformModeConfig {
        const mode = chartConfig.displaySettings.mode as 'AEP' | 'view' | 'live' | 'ar';
        const location = {lst: chartConfig.siderealTime, lat: chartConfig.observationSite.latitude};
        const v = chartConfig.viewState;
        // const ori = chartConfig.
        const transformConfig: TransformModeConfig = mode === 'AEP'
            ? {mode: 'AEP', center:{ra:v.centerRA, dec:v.centerDec}, location: location}
            : {mode: 'view', center:{az:v.centerAz, alt:v.centerAlt}, location: location}
            // : {mode: 'live', orientationData: }
        return transformConfig
    }

    // 赤道座標から直交座標への変換
    // equatorialToCartesian(coords: EquatorialCoordinates, distance: number = 1): CartesianCoords {
    //     const ra = coords.ra * DEG_TO_RAD;
    //     const dec = coords.dec * DEG_TO_RAD;
    //     return {
    //         x: distance * Math.cos(dec) * Math.cos(ra),
    //         y: distance * Math.cos(dec) * Math.sin(ra),
    //         z: distance * Math.sin(dec)
    //     };
    // }

    // 直交座標から赤道座標への変換
    // cartesianToEquatorial(coords: CartesianCoords): EquatorialCoordinates {
    //     const distance = Math.sqrt(coords.x * coords.x + coords.y * coords.y + coords.z * coords.z);
    //     const dec = asindeg(coords.z / distance);
    //     const ra = Math.atan2(coords.y, coords.x) * RAD_TO_DEG;
    //     return {ra: (ra + 360) % 360, dec: dec};
    // }

    precessionAngle(time1: number | string, time2: number | string): number {
        if (typeof time1 == 'string') {
            if (time1 == 'j2000') {
                time1 = 2451545.0;
            } else {
                console.warn('precessionAngle: time1 is not a valid string');
                return 0;
            }
        }
        if (typeof time2 == 'string') {
            if (time2 == 'j2000') {
                time2 = 2451545.0;
            } else {
                console.warn('precessionAngle: time2 is not a valid string');
                return 0;
            }
        }
        const timeDiff = (time2 - time1) / 36525.0;
        return 5029.0 / 3600.0 * timeDiff * DEG_TO_RAD;
    }

    precessionEquatorial(coords: EquatorialCoordinates, precessionAngle?: number, time1?: number | string, time2?: number | string): EquatorialCoordinates {
        if (precessionAngle == undefined) {
            if (time1 == undefined) {
                time1 = 2451545.0;
            } else if (typeof time1 == 'string' && time1 == 'j2000') {
                time1 = 2451545.0;
            } else if (typeof time1 != 'number') {
                console.warn('precessionEquatorial: time1 is invalid:', time1);
                return coords;
            }
            if (time2 == undefined) {
                time2 = 2451545.0;
            } else if (typeof time2 == 'string' && time2 == 'j2000') {
                time2 = 2451545.0;
            } else if (typeof time2 != 'number') {
                console.warn('precessionEquatorial: time2 is invalid:', time2, typeof time2);
                return coords;
            }
            precessionAngle = this.precessionAngle(time1, time2);
        }
        const {x, y, z} = RaDec.toCartesian(coords);
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

    // ------------------------------赤道座標からの変換------------------------------
    // 赤道座標から地平座標への変換
    // equatorialToHorizontal(lstLat: LstLat, coords: EquatorialCoordinates): HorizontalCoordinates {
    //     const ra = coords.ra * DEG_TO_RAD;
    //     const dec = coords.dec * DEG_TO_RAD;
    //     const lat = lstLat.lat * DEG_TO_RAD;
    //     const hourAngle = lstLat.lst - ra;
    //     const sinDec = Math.sin(dec);
    //     const cosDec = Math.cos(dec);
    //     const sinLat = Math.sin(lat);
    //     const cosLat = Math.cos(lat);
    //     const sinHourAngle = Math.sin(hourAngle);
    //     const cosHourAngle = Math.cos(hourAngle);
    //     const x =  cosLat * sinDec - sinLat * cosDec * cosHourAngle;
    //     const y = -cosDec * sinHourAngle;
    //     const z =  sinLat * sinDec + cosLat * cosDec * cosHourAngle;
    //     const az = (Math.atan2(y, x) * RAD_TO_DEG + 360) % 360;
    //     const alt = asindeg(z);
    //     return {az, alt};
    //     // const radec = new RaDec(coords.ra, coords.dec);
    //     // return radec.toAzAlt(lstLat);
    // }

    // async equatorialToHorizontalWasm(lstLat: LstLat, raArray: Float64Array, decArray: Float64Array): Promise<Float64Array> {
    //     const wasm = await loadWasm();
    //     const memory = wasm.memory as WebAssembly.Memory;
    //     const n = raArray.length;
    //     const raPtr = wasm.allocF64Array(n);
    //     const decPtr = wasm.allocF64Array(n);
    //     const resultPtr = wasm.allocF64Array(n * 2);
    //     new Float64Array(memory.buffer, raPtr, n).set(raArray.map(c => c * DEG_TO_RAD));
    //     new Float64Array(memory.buffer, decPtr, n).set(decArray.map(c => c * DEG_TO_RAD));
    //     wasm.wasmEquatorialToHorizontal(lstLat.lst, lstLat.lat, raPtr, decPtr, n, resultPtr);
    //     const result = new Float64Array(memory.buffer, resultPtr, n * 2);
    //     return new Float64Array(result);
    // }

    // equatorialToScrenRaDec(
    //     raDec: EquatorialCoordinates,
    //     mode: string,
    //     lstLat: LstLat,
    //     viewState: ViewState,
    //     orientationData?: { alpha: number, beta: number, gamma: number, webkitCompassHeading: number }
    // ): EquatorialCoordinates {
    //     if (mode == 'AEP') {
    //         return this.equatorialToScreenRaDec_AEP(raDec, { ra: viewState.centerRA, dec: viewState.centerDec });
    //     } else if (mode == 'view') {
    //         const horizontal = this.equatorialToHorizontal(lstLat, raDec);
    //         return this.horizontalToScreenRaDec_View(horizontal, { az: viewState.centerAz, alt: viewState.centerAlt });
    //     } else if (['live', 'ar'].includes(mode) && orientationData) {
    //         const horizontal = this.equatorialToHorizontal(lstLat, raDec);
    //         return this.horizontalToScreenRaDec_Live(horizontal, orientationData);
    //     }
    //     return { ra: 0, dec: 0 };
    // }

    // 赤道座標からスクリーン座標への変換、判定
    // すべてのモードに対応
    // equatorialToScreenXYifin(
    //     raDec: EquatorialCoordinates, 
    //     config: StarChartConfig, 
    //     force: boolean = false,
    //     orientationData?: { alpha: number, beta: number, gamma: number, webkitCompassHeading: number }
    // ): [boolean, [number, number]] {
    //     const viewState = config.viewState;
    //     const mode = config.displaySettings.mode;
    //     const canvas = config.canvasSize;
    //     const lstLat = { lst: config.siderealTime, lat: config.observationSite.latitude };
    //     let screenRaDec: EquatorialCoordinates;

    //     if (mode == 'AEP') {
    //         screenRaDec = this.equatorialToScreenRaDec_AEP(raDec, { ra: viewState.centerRA, dec: viewState.centerDec });
    //     } else if (mode == 'view') {
    //         const horizontal = this.equatorialToHorizontal(lstLat, raDec);
    //         screenRaDec = this.horizontalToScreenRaDec_View(horizontal, { az: viewState.centerAz, alt: viewState.centerAlt });
    //     } else if (['live', 'ar'].includes(mode) && orientationData) {
    //         const horizontal = this.equatorialToHorizontal(lstLat, raDec);
    //         screenRaDec = this.horizontalToScreenRaDec_Live(horizontal, orientationData);
    //     } else {
    //         return [false, [0, 0]];
    //     }
        
    //     if (Math.abs(screenRaDec.ra) < viewState.fieldOfViewRA * 0.5 && Math.abs(screenRaDec.dec) < viewState.fieldOfViewDec * 0.5) {
    //         const [x, y] = this.screenRaDecToScreenXY(screenRaDec, canvas, viewState);
    //         return [true, [x, y]];
    //     } else if (force) {
    //         const [x, y] = this.screenRaDecToScreenXY(screenRaDec, canvas, viewState);
    //         return [false, [x, y]];
    //     } else {
    //         return [false, [0, 0]];
    //     }
    // }

    // 赤道座標からある方向を中心とした正距方位図法への変換
    // equatorialToScreenRaDec_AEP(
    //     coords: EquatorialCoordinates, 
    //     center: EquatorialCoordinates
    // ): EquatorialCoordinates {
    //     const ra = coords.ra * DEG_TO_RAD;
    //     const dec = coords.dec * DEG_TO_RAD;
    //     const centerRARad = center.ra * DEG_TO_RAD;
    //     const centerDecRad = center.dec * DEG_TO_RAD;
    //     const ra_diff = ra - centerRARad;

    //     const sinDec = Math.sin(dec);
    //     const cosDec = Math.cos(dec);
    //     const sinCenterDec = Math.sin(centerDecRad);
    //     const cosCenterDec = Math.cos(centerDecRad);

    //     const a = sinCenterDec * cosDec * Math.cos(ra_diff) - cosCenterDec * sinDec;
    //     const b =                cosDec * Math.sin(ra_diff);
    //     const c = cosCenterDec * cosDec * Math.cos(ra_diff) + sinCenterDec * sinDec;

    //     const r = acosdeg(c); //中心からの角距離, deg
    //     const thetaSH = Math.atan2(b, a); //南（下）向きから時計回り
    //     const scrRA = r * Math.sin(thetaSH);
    //     const scrDec = - r * Math.cos(thetaSH);
    //     return { ra: scrRA, dec: scrDec };
    // }

    determineConstellation(
        center: EquatorialCoordinates
    ): string {
        const constellations = DataStore.constellationData;
        const boundaries = DataStore.constellationBoundariesData;
        if (constellations.length == 0 || boundaries.length == 0) {
            return "";
        }
        const a = Array(89).fill(0);
        for (const boundary of boundaries) {
            const {num, ra1, dec1, ra2, dec2} = boundary;
            if (Math.min(dec1, dec2) <= center.dec && center.dec < Math.max(dec1, dec2)) {
                if (center.ra >= (center.dec-dec1) * (ra2-ra1) / (dec2-dec1) + ra1) {
                    a[num-1] = (a[num-1] + 1) % 2;
                }
            }
        }

        let centerConstellation = "";
        for (let i=0; i<89; i++) {
            if (a[i] == 1) {
                centerConstellation = constellations[i].JPNname + "座";
                break;
            }
        }
        if (centerConstellation == "") {
            centerConstellation = center.dec > 0 ? "こぐま座" : "はちぶんぎ座";
        }
        return centerConstellation;
    }

    // ------------------------------地平座標からの変換------------------------------
    // 地平座標から赤道座標への変換
    // horizontalToEquatorial(lstLat: LstLat, coords: HorizontalCoordinates): EquatorialCoordinates {
    //     const az = coords.az * DEG_TO_RAD;
    //     const alt = coords.alt * DEG_TO_RAD;
    //     const lat = lstLat.lat * DEG_TO_RAD;
    //     const sinAlt = Math.sin(alt);
    //     const cosAlt = Math.cos(alt);
    //     const sinLat = Math.sin(lat);
    //     const cosLat = Math.cos(lat);
    //     const sinAz = Math.sin(az);
    //     const cosAz = Math.cos(az);
    //     const x =  sinLat * cosAlt * cosAz - cosLat * sinAlt;
    //     const y = -cosAlt * sinAz;
    //     const z =  cosLat * cosAlt * cosAz + sinLat * sinAlt;
    //     const ra = ((lstLat.lst + Math.atan2(-y, -x)) * RAD_TO_DEG + 360) % 360;
    //     const dec = asindeg(z);
    //     return { ra, dec };
    // }

    // horizontalToScreenRaDec(
    //     coords: HorizontalCoordinates,
    //     mode: string,
    //     center: HorizontalCoordinates,
    //     orientationData?: { alpha: number, beta: number, gamma: number, webkitCompassHeading: number }
    // ): EquatorialCoordinates {
    //     if (mode == 'view') {
    //         return this.horizontalToScreenRaDec_View(coords, center);
    //     } else if (['live', 'ar'].includes(mode) && orientationData) {
    //         return this.horizontalToScreenRaDec_Live(coords, orientationData);
    //     } else {
    //         return { ra: 0, dec: 0 };
    //     }
    // }

     // 地平座標からある方向を中心とした正距方位図法への変換
    // horizontalToScreenRaDec_View(
    //     coords: HorizontalCoordinates,
    //     center: HorizontalCoordinates
    // ): EquatorialCoordinates {
    //     const az = coords.az * DEG_TO_RAD;
    //     const alt = coords.alt * DEG_TO_RAD;
    //     const centerAzRad = center.az * DEG_TO_RAD;
    //     const centerAltRad = center.alt * DEG_TO_RAD;
    //     const az_diff = -(az - centerAzRad);

    //     const sinAlt = Math.sin(alt);
    //     const cosAlt = Math.cos(alt);
    //     const sinAzDiff = Math.sin(az_diff);
    //     const cosAzDiff = Math.cos(az_diff);
    //     const sinCenterAlt = Math.sin(centerAltRad);
    //     const cosCenterAlt = Math.cos(centerAltRad);
    //     // rotateY(coords: CartesianCoordinates, angle: number): CartesianCoordinates {
    //     //         x: cos*coords.x+sin*coords.z,
    //     //         y: coords.y,
    //     //         z: -sin*coords.x+cos*coords.z
    //     const a = sinCenterAlt * cosAlt * cosAzDiff - cosCenterAlt * sinAlt;
    //     const b =                cosAlt * sinAzDiff;
    //     const c = cosCenterAlt * cosAlt * cosAzDiff + sinCenterAlt * sinAlt;
    //     // const {x: a, y: b, z: c} = this.rotateY({x: cosAlt * cosAzDiff, y: cosAlt * sinAzDiff, z: sinAlt}, -Math.PI / 2 + centerAltRad);

    //     const r = acosdeg(c); //中心からの角距離, deg
    //     const thetaSH = Math.atan2(b, a); //南（下）向きから時計回り
    //     const scrRa = r * Math.sin(thetaSH);
    //     const scrDec = - r * Math.cos(thetaSH);
    //     return { ra: scrRa, dec: scrDec };
    // }

    // horizontalToScreenRaDec_Live(
    //     horizontal: HorizontalCoordinates,
    //     orientationData: { alpha: number, beta: number, gamma: number, webkitCompassHeading: number }
    // ): EquatorialCoordinates {
    //     const alpha = orientationData.alpha;
    //     const beta = orientationData.beta;
    //     const gamma = orientationData.gamma;
    //     const compassHeading = orientationData.webkitCompassHeading;
    //     const az = (horizontal.az - compassHeading - 90) * DEG_TO_RAD;
    //     const alt = horizontal.alt * DEG_TO_RAD;
    //     const x0 = Math.cos(alt) * Math.cos(az);
    //     const y0 = -Math.cos(alt) * Math.sin(az);
    //     const z0 = Math.sin(alt);
    //     const {x, y, z} = this.rotateY(this.rotateX(this.rotateZ({x: x0, y: y0, z: z0}, -alpha), -beta), -gamma);
    //     if (-z >= 1) {
    //         return {ra: 0, dec: 0};
    //     } else {
    //         const b = acosdeg(-z);
    //         const scrRA = -b * x / Math.sqrt(x*x + y*y);
    //         const scrDec = b * y / Math.sqrt(x*x + y*y);
    //         return {ra: scrRA, dec: scrDec};
    //     }
    // }

    // 地平座標からスクリーン座標への変換、判定
    // horizontalToScreenXYifin(
    //     horizontal: HorizontalCoordinates, 
    //     config: StarChartConfig, 
    //     force: boolean = false,
    //     orientationData?: { alpha: number, beta: number, gamma: number, webkitCompassHeading: number }
    // ): [boolean, [number, number]] {
    //     const viewState = config.viewState;
    //     const mode = config.displaySettings.mode;
    //     const canvas = config.canvasSize;
    //     const lstLat = { lst: config.siderealTime, lat: config.observationSite.latitude };
    //     let screenRaDec: EquatorialCoordinates;

    //     if (mode == 'AEP') {
    //         const equatorial = this.horizontalToEquatorial(lstLat, horizontal);
    //         screenRaDec = this.equatorialToScreenRaDec_AEP(equatorial, { ra: viewState.centerRA, dec: viewState.centerDec });
    //     } else if (mode == 'view') {
    //         screenRaDec = this.horizontalToScreenRaDec_View(horizontal, { az: viewState.centerAz, alt: viewState.centerAlt });
    //     } else if (['live', 'ar'].includes(mode) && orientationData) {
    //         screenRaDec = this.horizontalToScreenRaDec_Live(horizontal, orientationData);
    //     } else {
    //         return [false, [0, 0]];
    //     }
        
    //     if (Math.abs(screenRaDec.ra) < viewState.fieldOfViewRA * 0.5 && Math.abs(screenRaDec.dec) < viewState.fieldOfViewDec * 0.5) {
    //         const [x, y] = this.screenRaDecToScreenXY(screenRaDec, canvas, viewState);
    //         return [true, [x, y]];
    //     } else if (force) {
    //         const [x, y] = this.screenRaDecToScreenXY(screenRaDec, canvas, viewState);
    //         return [false, [x, y]];
    //     } else {
    //         return [false, [0, 0]];
    //     }
    // }

    // ------------------------------スクリーンRaDecからの変換------------------------------
    // スクリーン座標からスクリーンRaDecへの変換
    // screenRaDecToScreenXY(raDec: EquatorialCoordinates, canvasSize: CanvasSize, viewState: ViewState):  {
    //     const x = canvasSize.width * (0.5 - raDec.ra / viewState.fieldOfViewRA);
    //     const y = canvasSize.height * (0.5 - raDec.dec / viewState.fieldOfViewDec);
    //     return [x, y];
    // }

    // AEPモードでスクリーンRaDecから赤道座標への変換
    // screenRaDecToEquatorial_AEP(screenRaDec: EquatorialCoordinates, center: EquatorialCoordinates): EquatorialCoordinates {
    //     if (screenRaDec.ra == 0 && screenRaDec.dec == 0) {
    //         return { ra: center.ra, dec: center.dec };
    //     } else {
    //         const thetaSH = Math.atan2(screenRaDec.ra, -screenRaDec.dec);
    //         const r = Math.sqrt(screenRaDec.ra * screenRaDec.ra + screenRaDec.dec * screenRaDec.dec) * DEG_TO_RAD;
    //         const centerDec_rad = center.dec * DEG_TO_RAD;

    //         const sinDec = Math.sin(centerDec_rad);
    //         const cosDec = Math.cos(centerDec_rad);
    //         const sinR = Math.sin(r);
    //         const cosR = Math.cos(r);
    //         const sinThetaSH = Math.sin(thetaSH);
    //         const cosThetaSH = Math.cos(thetaSH);

    //         const a =  sinDec * sinR * cosThetaSH + cosDec * cosR;
    //         const b =           sinR * sinThetaSH;
    //         const c = -cosDec * sinR * cosThetaSH + sinDec * cosR;

    //         const dec = asindeg(c);
    //         const ra = ((Math.atan2(b, a) * RAD_TO_DEG + center.ra) % 360 + 360) % 360;
    //         return { ra, dec };
    //     }
    // }

    // ViewモードでスクリーンRaDecから地平座標への変換
    // screenRaDecToHorizontal_View(screenRaDec: EquatorialCoordinates, center: HorizontalCoordinates): HorizontalCoordinates {
    //     if (screenRaDec.ra == 0 && screenRaDec.dec == 0) {
    //         return { az: center.az, alt: center.alt };
    //     } else {
    //         const Ra = screenRaDec.ra * DEG_TO_RAD;
    //         const Dec = screenRaDec.dec * DEG_TO_RAD;
    //         const thetaSH = Math.atan2(Ra, -Dec);
    //         const r = Math.sqrt(Ra*Ra + Dec*Dec);
    //         const centerAlt_rad = center.alt * DEG_TO_RAD;

    //         const sinR = Math.sin(r);
    //         const cosR = Math.cos(r);
    //         const sinThetaSH = Math.sin(thetaSH);
    //         const cosThetaSH = Math.cos(thetaSH);

    //         const abc1 = this.rotateY({x: sinR * cosThetaSH, y: sinR * sinThetaSH, z: cosR}, Math.PI / 2 - centerAlt_rad);
    //         const abc2 = this.rotateZ(abc1, -center.az * DEG_TO_RAD);
    //         const {x: a, y: b, z: c} = abc2;

    //         const alt = asindeg(c);
    //         const az = ((Math.atan2(-b, a) * RAD_TO_DEG) % 360 + 360) % 360;
    //         return { az, alt };
    //     }
    // }

    // LiveモードでスクリーンRaDecから地平座標への変換
    // screenRaDecToHorizontal_Live(screenRaDec: EquatorialCoordinates, orientationData: { alpha: number, beta: number, gamma: number, webkitCompassHeading: number}): HorizontalCoordinates {
    //     const theta = Math.atan2(screenRaDec.dec, -screenRaDec.ra); //画面上で普通に極座標
    //     const r = Math.sqrt(screenRaDec.ra*screenRaDec.ra + screenRaDec.dec*screenRaDec.dec) * DEG_TO_RAD;
    //     const alpha = orientationData.alpha;
    //     const beta = orientationData.beta;
    //     const gamma = orientationData.gamma;
    //     const x0 = Math.sin(r)*Math.cos(theta);
    //     const y0 = Math.sin(r)*Math.sin(theta);
    //     const z0 = -Math.cos(r);
    //     const {x, y, z} = this.rotateZ(this.rotateX(this.rotateY({x: x0, y: y0, z: z0}, gamma), beta), alpha);
    //     const alt = asindeg(z);
    //     const az = ((Math.atan2(-y, x) * RAD_TO_DEG + (orientationData.webkitCompassHeading || 0) + 90) % 360 + 360) % 360;
    //     return {az, alt};
    // }

    // screenRaDecToEquatorial(
    //     lstLat: LstLat, screenRaDec: EquatorialCoordinates, config: TransformModeConfig
    // ): EquatorialCoordinates {
    //     if (config.mode == 'AEP') {
    //         return this.screenRaDecToEquatorial_AEP(screenRaDec, config.center);
    //     } else if (config.mode == 'view') {
    //         const horizontal = this.screenRaDecToHorizontal_View(screenRaDec, config.center);
    //         return this.horizontalToEquatorial(lstLat, horizontal);
    //     } else if (config.mode === 'live' || config.mode === 'ar') {
    //         const horizontal = this.screenRaDecToHorizontal_Live(screenRaDec, config.orientationData);
    //         return this.horizontalToEquatorial(lstLat, horizontal);
    //     }
    //     return { ra: 0, dec: 0 };
    // }

    // screenRaDecToHorizontal(
    //     lstLat: LstLat,
    //     screenRaDec: EquatorialCoordinates,
    //     config: TransformModeConfig
    // ): HorizontalCoordinates {
    //     if (config.mode == 'AEP') {
    //         const equatorial = this.screenRaDecToEquatorial(lstLat, screenRaDec, config);
    //         return this.equatorialToHorizontal(lstLat, equatorial);
    //     }
    //     else if (config.mode == 'view') {
    //         return this.screenRaDecToHorizontal_View(screenRaDec, config.center);
    //     }
    //     else if (config.mode === 'live' || config.mode === 'ar') {
    //         return this.screenRaDecToHorizontal_Live(screenRaDec, config.orientationData);
    //     }
    //     return { az: 0, alt: 0 };
    // }

    // ------------------------------スクリーンXYからの変換------------------------------
    // スクリーン座標からスクリーンRaDecへの変換
    screenXYToScreenRaDec(x: number, y: number, fieldOfView: { ra: number, dec: number }, canvas: HTMLCanvasElement): EquatorialCoordinates {
        // const fieldOfView = this.getCurrentFieldOfView();
        const ra = (0.5 - x / canvas.width) * fieldOfView.ra;
        const dec = (0.5 - y / canvas.height) * fieldOfView.dec;
        return { ra, dec };
    }

    getMaxLineLengthSquared(canvasSize: CanvasSize, viewState: ViewState): number {
        const xmax = canvasSize.width;
        const ymax = canvasSize.height;
        return (30 * 2 * Math.max(xmax, ymax) / Math.max(viewState.fieldOfViewRA, viewState.fieldOfViewDec)) ** 2;
    }

    shouldDrawLine(x1: number, y1: number, x2: number, y2: number, canvasSize: CanvasSize, maxLengthSquared: number): boolean {
        if ((x1 < 0 && x2 < 0) || (x1 > canvasSize.width && x2 > canvasSize.width) ||
            (y1 < 0 && y2 < 0) || (y1 > canvasSize.height && y2 > canvasSize.height)
        ) return false;
        if ((x1-x2) * (x1-x2) + (y1-y2) * (y1-y2) > maxLengthSquared) return false;
        return true;
    }

    // screenRaDecToEquatorial_View(lstLat: LstLat, screenRaDec: EquatorialCoordinates, center: HorizontalCoordinates): EquatorialCoordinates {
    //     const horizontal = this.screenRaDecToHorizontal_View(screenRaDec, center);
    //     return this.horizontalToEquatorial(lstLat, horizontal);
    // }

    // デバイスオリエンテーションを使用した画面座標への変換
    // horizontalToScreenXY_Live(
    //     horizontal: HorizontalCoordinates,
    //     center: HorizontalCoordinates,
    //     canvasSize: CanvasSize, 
    //     deviceOrientationManager: DeviceOrientationManager
    // ): [number, number] {
    //     const deviceInfo = deviceOrientationManager.getDeviceInfo();
    //     const orientationData = deviceOrientationManager.getOrientationData();
        
    //     // デバイスオリエンテーションが利用可能で許可されている場合
    //     if (deviceInfo.os === 'iphone' && deviceOrientationManager.isOrientationPermitted()) {
    //         const compassHeading = deviceOrientationManager.getCompassHeading();
            
    //         // コンパス方位を考慮して方位角を調整
    //         if (compassHeading !== 0) {
    //             const adjustedAzimuth = (horizontal.az - compassHeading + 360) % 360;
    //             const adjustedHorizontal: HorizontalCoordinates = {
    //                 az: adjustedAzimuth,
    //                 alt: horizontal.alt
    //             };
                
    //             // 調整された座標を画面座標に変換
    //             const screenRaDec = this.horizontalToScreenRaDec_View(adjustedHorizontal, center);
    //             return this.screenRaDecToScreenXY(screenRaDec, canvasSize, (window as any).config.viewState);
    //         }
    //     }
        
    //     // デバイスオリエンテーションが利用できない場合は通常の変換
    //     const screenRaDec = this.horizontalToScreenRaDec_View(horizontal, center);
    //     return this.screenRaDecToScreenXY(screenRaDec, canvasSize, (window as any).config.viewState);
    // }

//     angularDistanceEquatorial(coords1: EquatorialCoordinates, coords2: EquatorialCoordinates): number {
//         const ra1 = coords1.ra * DEG_TO_RAD;
//         const dec1 = coords1.dec * DEG_TO_RAD;
//         const ra2 = coords2.ra * DEG_TO_RAD;
//         const dec2 = coords2.dec * DEG_TO_RAD;
//         return acosdeg(Math.cos(dec1) * Math.cos(dec2) * Math.cos(ra1 - ra2) + Math.sin(dec1) * Math.sin(dec2));
//     }
}