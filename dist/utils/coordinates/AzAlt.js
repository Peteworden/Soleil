import { acosdeg, asindeg } from "../mathUtils.js";
import { CanvasRaDec } from "./CanvasRaDec.js";
import { Cartesian } from "./Cartesian.js";
import { RaDec } from "./RaDec.js";
import { DEG_TO_RAD, RAD_TO_DEG } from '../constants.js';
export class AzAlt {
    constructor(az, alt) {
        this.az = az;
        this.alt = alt;
    }
    toRad() {
        return { az: this.az * DEG_TO_RAD, alt: this.alt * DEG_TO_RAD };
    }
    toRaDec(lstLat) {
        const { az, alt } = this.toRad();
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
        return new RaDec(ra, dec);
    }
    toCanvasRaDec(mode, center, orientationData) {
        if (mode == 'view') {
            return this.toCanvasRaDec_View(center);
        }
        else if (['live', 'ar'].includes(mode) && orientationData) {
            return this.toCanvasRaDec_Live(orientationData);
        }
        else {
            return new CanvasRaDec(0, 0);
        }
    }
    toCanvasXYifin(config, orientationData, force = false) {
        const mode = config.displaySettings.mode;
        const viewState = config.viewState;
        const center = new AzAlt(viewState.centerAz, viewState.centerAlt);
        const canvasSize = config.canvasSize;
        const canvasRaDec = this.toCanvasRaDec(mode, center, orientationData);
        if (Math.abs(canvasRaDec.ra) < viewState.fieldOfViewRA * 0.5 && Math.abs(canvasRaDec.dec) < viewState.fieldOfViewDec * 0.5) {
            const xy = canvasRaDec.toCanvasXY(canvasSize, viewState);
            return [true, xy];
        }
        else if (force) {
            const xy = canvasRaDec.toCanvasXY(canvasSize, viewState);
            return [false, xy];
        }
        else {
            return [false, { x: 0, y: 0 }];
        }
    }
    // 地平座標からある方向を中心とした正距方位図法への変換
    toCanvasRaDec_View(center) {
        const { az, alt } = this.toRad();
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
        const thetaSH = Math.atan2(b, a); //南（下）向きから時計回り
        const scrRa = r * Math.sin(thetaSH);
        const scrDec = -r * Math.cos(thetaSH);
        return new CanvasRaDec(scrRa, scrDec);
    }
    toCanvasRaDec_Live(orientationData) {
        const alpha = orientationData.alpha;
        const beta = orientationData.beta;
        const gamma = orientationData.gamma;
        const compassHeading = orientationData.webkitCompassHeading;
        const az = (this.az - compassHeading - 90) * DEG_TO_RAD;
        const alt = this.alt * DEG_TO_RAD;
        const x0 = Math.cos(alt) * Math.cos(az);
        const y0 = -Math.cos(alt) * Math.sin(az);
        const z0 = Math.sin(alt);
        const xyz = new Cartesian(x0, y0, z0).rotateX(-alpha).rotateY(-beta).rotateZ(-gamma);
        if (-xyz.z >= 1) {
            return new CanvasRaDec(0, 0);
        }
        else {
            const b = acosdeg(-xyz.z);
            const scrRA = -b * xyz.x / Math.sqrt(xyz.x * xyz.x + xyz.y * xyz.y);
            const scrDec = b * xyz.y / Math.sqrt(xyz.x * xyz.x + xyz.y * xyz.y);
            return new CanvasRaDec(scrRA, scrDec);
        }
    }
}
//# sourceMappingURL=AzAlt.js.map