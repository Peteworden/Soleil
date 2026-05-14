import { DataStore } from '../models/DataStore.js';
export class CoordinateConverter {
    rahmToDeg(rahmtext) {
        const rahm = rahmtext.split(' ').map(Number);
        if (rahm.length == 2) {
            return rahm[0] * 15 + rahm[1] * 0.25;
        }
        else {
            return rahm[0] * 15 + rahm[1] * 0.25 + rahm[2] / 240;
        }
    }
    decdmToDeg(decdmtext) {
        const decdm = decdmtext.split(' ').map(Number);
        const dec = (Math.abs(decdm[0]) + decdm[1] / 60) * (decdmtext[0] == '-' ? -1 : 1);
        return dec;
    }
    radeg2hm(ra_deg) {
        let h = Math.floor(ra_deg / 15);
        let m = Math.round((ra_deg - 15 * h) * 40);
        if (m == 600) {
            m = 0.0;
            if (h == 23)
                h = 0;
            else
                h += 1;
        }
        else {
            m = m / 10;
        }
        return [h, m];
    }
    radeg2hms(ra_deg) {
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
    decdeg2dm(dec_deg) {
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
    decdeg2dm2(dec_deg) {
        let d, m;
        const sign = dec_deg >= 0 ? '+' : '-';
        const decAbs = Math.abs(dec_deg);
        d = Math.floor(decAbs);
        m = Math.round((decAbs - d) * 600);
        if (m == 600) {
            m = 0;
            d += 1;
        }
        return [sign, d, m / 10.0];
    }
    static chartConfigToTransformConfig(chartConfig, orientationData) {
        const mode = chartConfig.displaySettings.mode;
        const location = { lst: chartConfig.siderealTime, lat: chartConfig.observationSite.latitude };
        const v = chartConfig.viewState;
        switch (mode) {
            case 'AEP':
                return { mode: 'AEP', center: { ra: v.centerRA, dec: v.centerDec }, location: location };
            case 'view':
                return { mode: 'view', center: { az: v.centerAz, alt: v.centerAlt }, location: location };
            case 'live':
                if (orientationData == undefined) {
                    console.log('orientationData is undefined');
                    return { mode: 'view', center: { az: v.centerAz, alt: v.centerAlt }, location: location };
                }
                return { mode: 'live', location: location, orientationData: orientationData };
            default:
                if (orientationData == undefined) {
                    console.log('orientationData is undefined');
                    return { mode: 'view', center: { az: v.centerAz, alt: v.centerAlt }, location: location };
                }
                return { mode: 'ar', location: location, orientationData: orientationData };
        }
    }
    static determineConstellation(center) {
        const constellations = DataStore.constellationData;
        const boundaries = DataStore.constellationBoundariesData;
        if (constellations.length == 0 || boundaries.length == 0) {
            return "";
        }
        const a = Array(89).fill(0);
        for (const boundary of boundaries) {
            const { num, ra1, dec1, ra2, dec2 } = boundary;
            if (Math.min(dec1, dec2) <= center.dec && center.dec < Math.max(dec1, dec2)) {
                if (center.ra >= (center.dec - dec1) * (ra2 - ra1) / (dec2 - dec1) + ra1) {
                    a[num - 1] = (a[num - 1] + 1) % 2;
                }
            }
        }
        let centerConstellation = "";
        for (let i = 0; i < 89; i++) {
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
    // ------------------------------スクリーンXYからの変換------------------------------
    // スクリーン座標からスクリーンRaDecへの変換
    screenXYToScreenRaDec(x, y, fov, canvas) {
        const ra = (0.5 - x / canvas.width) * fov.ra;
        const dec = (0.5 - y / canvas.height) * fov.dec;
        return { ra, dec };
    }
    getMaxLineLengthSquared(canvasSize, viewState) {
        const xmax = canvasSize.width;
        const ymax = canvasSize.height;
        return (30 * 2 * Math.max(xmax, ymax) / Math.max(viewState.fieldOfViewRA, viewState.fieldOfViewDec)) ** 2;
    }
    shouldDrawLine(x1, y1, x2, y2, canvasSize, maxLengthSquared) {
        if ((x1 < 0 && x2 < 0) || (x1 > canvasSize.width && x2 > canvasSize.width) ||
            (y1 < 0 && y2 < 0) || (y1 > canvasSize.height && y2 > canvasSize.height))
            return false;
        if ((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2) > maxLengthSquared)
            return false;
        return true;
    }
}
//# sourceMappingURL=coordinates.js.map