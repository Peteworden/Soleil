import { DataStore } from '../models/DataStore.js';
import { EquatorialCoordinates, ViewState, StarChartConfig, CanvasSize, DeviceOrientation, Fov } from '../types/index.js';
import { TransformModeConfig } from '../types/index.js';

export class CoordinateConverter {
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

    static chartConfigToTransformConfig(chartConfig: StarChartConfig, orientationData?: DeviceOrientation): TransformModeConfig {
        const mode = chartConfig.displaySettings.mode as 'AEP' | 'view' | 'live' | 'ar';
        const location = {lst: chartConfig.siderealTime, lat: chartConfig.observationSite.latitude};
        const v = chartConfig.viewState;
        switch (mode) {
            case 'AEP':
                return {mode: 'AEP', center:{ra:v.centerRA, dec:v.centerDec}, location: location};
            case 'view':
                return {mode: 'view', center:{az:v.centerAz, alt:v.centerAlt}, location: location};
            case 'live':
                if (orientationData == undefined) {
                    console.log('orientationData is undefined');
                    return {mode: 'view', center:{az:v.centerAz, alt:v.centerAlt}, location: location};
                }
                return {mode: 'live', location: location, orientationData: orientationData};
            default:
                if (orientationData == undefined) {
                    console.log('orientationData is undefined');
                    return {mode: 'view', center:{az:v.centerAz, alt:v.centerAlt}, location: location};
                }
                return {mode: 'ar', location: location, orientationData: orientationData}
        }
    }

    static determineConstellation(
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
}