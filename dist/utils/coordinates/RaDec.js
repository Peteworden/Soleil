import { AzAlt } from './AzAlt.js';
import { Cartesian } from './Cartesian.js';
import { CanvasRaDec } from './CanvasRaDec.js';
import { acosdeg, asindeg } from '../mathUtils.js';
import { COS_EPSL, DEG_TO_RAD, RAD_TO_DEG, SIN_EPSL } from '../constants.js';
export class RaDec {
    constructor(ra, dec) {
        this.ra = ra;
        this.dec = dec;
    }
    toRad() {
        return { ra: this.ra * DEG_TO_RAD, dec: this.dec * DEG_TO_RAD };
    }
    toHmDm() {
        let rah = Math.floor(this.ra / 15);
        let ram = Math.round((this.ra - 15 * rah) * 40);
        if (ram == 600) {
            ram = 0.0;
            if (rah == 23)
                rah = 0;
            else
                rah += 1;
        }
        else {
            ram = ram / 10;
        }
        const raStr = `${rah}h ${ram}m`;
        return { ra: raStr, dec: raStr };
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
    angDistanceFrom(coord) {
        const { ra, dec } = this.toRad();
        const { ra: ra2, dec: dec2 } = coord.toRad();
        return acosdeg(Math.cos(dec) * Math.cos(dec2) * Math.cos(ra - ra2) + Math.sin(dec) * Math.sin(dec2));
    }
    toCartesian(distance = 1) {
        const { ra, dec } = this.toRad();
        return new Cartesian(distance * Math.cos(dec) * Math.cos(ra), distance * Math.cos(dec) * Math.sin(ra), distance * Math.sin(dec));
    }
    toAzAlt(lstLat) {
        const { ra, dec } = this.toRad();
        const lat = lstLat.lat * DEG_TO_RAD;
        const hourAngle = lstLat.lst - ra;
        const sinDec = Math.sin(dec);
        const cosDec = Math.cos(dec);
        const sinLat = Math.sin(lat);
        const cosLat = Math.cos(lat);
        const sinHourAngle = Math.sin(hourAngle);
        const cosHourAngle = Math.cos(hourAngle);
        const x = cosLat * sinDec - sinLat * cosDec * cosHourAngle;
        const y = -cosDec * sinHourAngle;
        const z = sinLat * sinDec + cosLat * cosDec * cosHourAngle;
        const az = (Math.atan2(y, x) * RAD_TO_DEG + 360) % 360;
        const alt = asindeg(z);
        return new AzAlt(az, alt);
    }
    precess(precessionAngle, time1, time2) {
        if (precessionAngle == undefined) {
            if (time1 == undefined) {
                time1 = 2451545.0;
            }
            else if (typeof time1 == 'string' && time1 == 'j2000') {
                time1 = 2451545.0;
            }
            else if (typeof time1 != 'number') {
                console.warn('precessionEquatorial: time1 is invalid:', time1);
                return this;
            }
            if (time2 == undefined) {
                time2 = 2451545.0;
            }
            else if (typeof time2 == 'string' && time2 == 'j2000') {
                time2 = 2451545.0;
            }
            else if (typeof time2 != 'number') {
                console.warn('precessionEquatorial: time2 is invalid:', time2, typeof time2);
                return this;
            }
            precessionAngle = 5029.0 / 3600.0 * ((time2 - time1) / 36525.0) * DEG_TO_RAD;
        }
        if (precessionAngle == undefined) {
            return this;
        }
        const { x, y, z } = this.toCartesian(1);
        const sin = Math.sin(precessionAngle);
        const cos = Math.cos(precessionAngle);
        // const xyz2 = this.rotateX(xyz1, -epsilon);
        // const xyz3 = this.rotateZ(xyz2, precessionAngle);
        // const xyz4 = this.rotateX(xyz3, epsilon);
        const xyz2 = new Cartesian(x * cos - y * COS_EPSL * sin - z * SIN_EPSL * sin, COS_EPSL * (x * sin + cos * (y * COS_EPSL + z * SIN_EPSL)) - SIN_EPSL * (-y * SIN_EPSL + z * COS_EPSL), SIN_EPSL * (x * sin + cos * (y * COS_EPSL + z * SIN_EPSL)) + COS_EPSL * (-y * SIN_EPSL + z * COS_EPSL));
        return xyz2.toRaDec();
        // return this.cartesianToEquatorial(xyz2);
    }
    toCanvasRaDec(mode, viewState, lstLat, orientationData) {
        if (mode == 'AEP') {
            return this.toCanvasRaDec_AEP(new RaDec(viewState.centerRA, viewState.centerDec));
        }
        else {
            const center = new AzAlt(viewState.centerAz, viewState.centerAlt);
            return this.toAzAlt(lstLat).toCanvasRaDec(mode, center, orientationData);
        }
    }
    toCanvasXYifin(config, orientationData, force = false) {
        const mode = config.displaySettings.mode;
        const viewState = config.viewState;
        const lstLat = { lst: config.siderealTime, lat: config.observationSite.latitude };
        const canvasSize = config.canvasSize;
        const canvasRaDec = this.toCanvasRaDec(mode, viewState, lstLat, orientationData);
        if (Math.abs(canvasRaDec.ra) < viewState.fieldOfViewRA * 0.5 && Math.abs(canvasRaDec.dec) < viewState.fieldOfViewDec * 0.5) {
            const xy = canvasRaDec.toCanvasXY(canvasSize, viewState);
            return [true, xy];
        }
        else if (force) {
            // const [x, y] = this.screenRaDecToScreenXY(screenRaDec, canvas, viewState);
            const xy = canvasRaDec.toCanvasXY(canvasSize, viewState);
            return [false, xy];
        }
        else {
            return [false, { x: 0, y: 0 }];
        }
    }
    // 赤道座標からある方向を中心とした正距方位図法への変換
    toCanvasRaDec_AEP(center) {
        const { ra, dec } = this.toRad();
        const centerRARad = center.ra * DEG_TO_RAD;
        const centerDecRad = center.dec * DEG_TO_RAD;
        const ra_diff = ra - centerRARad;
        const sinDec = Math.sin(dec);
        const cosDec = Math.cos(dec);
        const sinCenterDec = Math.sin(centerDecRad);
        const cosCenterDec = Math.cos(centerDecRad);
        const a = sinCenterDec * cosDec * Math.cos(ra_diff) - cosCenterDec * sinDec;
        const b = cosDec * Math.sin(ra_diff);
        const c = cosCenterDec * cosDec * Math.cos(ra_diff) + sinCenterDec * sinDec;
        const r = acosdeg(c); //中心からの角距離, deg
        const thetaSH = Math.atan2(b, a); //南（下）向きから時計回り
        const scrRA = r * Math.sin(thetaSH);
        const scrDec = -r * Math.cos(thetaSH);
        return new CanvasRaDec(scrRA, scrDec);
    }
}
//# sourceMappingURL=RaDec.js.map