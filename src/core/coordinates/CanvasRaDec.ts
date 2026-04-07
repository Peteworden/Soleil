import { asindeg } from "../mathUtils.js";
import { CanvasSize, LstLat, ViewState } from "../../types/index.js";
import { AzAlt } from "./AzAlt.js";
import { RaDec } from "./RaDec.js";
import { Cartesian } from "./Cartesian.js";
import { DEG_TO_RAD, RAD_TO_DEG } from '../../utils/constants.js';

export class CanvasRaDec {
    ra: number;
    dec: number;
    constructor(ra: number, dec: number) {
        this.ra = ra;
        this.dec = dec;
    }

    isCenter(): boolean {
        return this.ra == 0 && this.dec == 0;
    }

    toRad(): {ra: number, dec: number} {
        return {ra: this.ra * DEG_TO_RAD, dec: this.dec * DEG_TO_RAD};
    }

    toCanvasXY(canvasSize: CanvasSize, viewState: ViewState): {x: number, y: number} {
        const x = canvasSize.width * (0.5 - this.ra / viewState.fieldOfViewRA);
        const y = canvasSize.height * (0.5 - this.dec / viewState.fieldOfViewDec);
        return {x, y};
    }

    toRaDec(
        mode: string, viewState: ViewState, lstLat: LstLat,
        orientationData?: { alpha: number, beta: number, gamma: number, webkitCompassHeading: number }
    ): RaDec {
        if (mode == 'AEP') {
            const center = new RaDec(viewState.centerRA, viewState.centerDec);
            return this.toRaDec_AEP(center);
        } else if (mode == 'view') {
            const center = new AzAlt(viewState.centerAz, viewState.centerAlt);
            return this.toAzAlt_View(center).toRaDec(lstLat);
        } else if (['live', 'ar'].includes(mode) && orientationData) {
            return this.toAzAlt_Live(orientationData).toRaDec(lstLat);
        }
        return new RaDec(0, 0);
    }

    toAzAlt(
        mode: string, viewState: ViewState, lstLat: LstLat,
        orientationData?: { alpha: number, beta: number, gamma: number, webkitCompassHeading: number }
    ): AzAlt {
        if (mode == 'AEP') {
            const center = new RaDec(viewState.centerRA, viewState.centerDec);
            return this.toRaDec_AEP(center).toAzAlt(lstLat);
        }
        else if (mode == 'view') {
            const center = new AzAlt(viewState.centerAz, viewState.centerAlt);
            return this.toAzAlt_View(center);
        }
        else if (['live', 'ar'].includes(mode) && orientationData) {
            return this.toAzAlt_Live(orientationData);
        }
        return new AzAlt(0, 0);
    }

    private toRaDec_AEP(center: RaDec): RaDec {
        if (this.isCenter()) {
            return new RaDec(center.ra, center.dec);
        } else {
            const thetaSH = Math.atan2(this.ra, -this.dec);
            const r = Math.sqrt(this.ra * this.ra + this.dec * this.dec) * DEG_TO_RAD;
            const centerDec_rad = center.dec * DEG_TO_RAD;

            const sinDec = Math.sin(centerDec_rad);
            const cosDec = Math.cos(centerDec_rad);
            const sinR = Math.sin(r);
            const cosR = Math.cos(r);
            const sinThetaSH = Math.sin(thetaSH);
            const cosThetaSH = Math.cos(thetaSH);

            const a =  sinDec * sinR * cosThetaSH + cosDec * cosR;
            const b =           sinR * sinThetaSH;
            const c = -cosDec * sinR * cosThetaSH + sinDec * cosR;

            const dec = asindeg(c);
            const ra = ((Math.atan2(b, a) * RAD_TO_DEG + center.ra) % 360 + 360) % 360;
            return new RaDec(ra, dec);
        }
    }

    // ViewモードでスクリーンRaDecから地平座標への変換
    private toAzAlt_View(center: AzAlt): AzAlt {
        if (this.isCenter()) {
            return new AzAlt(center.az, center.alt);
        } else {
            const {ra, dec} = this.toRad();
            const thetaSH = Math.atan2(ra, -dec);
            const r = Math.sqrt(ra*ra + dec*dec);
            const centerRad = center.toRad();

            const sinR = Math.sin(r);
            const cosR = Math.cos(r);
            const sinThetaSH = Math.sin(thetaSH);
            const cosThetaSH = Math.cos(thetaSH);

            const xyz = new Cartesian(sinR * cosThetaSH, sinR * sinThetaSH, cosR)
            const abc = xyz.rotateY(Math.PI / 2 - centerRad.alt);
            const abc2 = abc.rotateZ(-centerRad.az);
            const {x: a, y: b, z: c} = abc2;

            const alt = asindeg(c);
            const az = ((Math.atan2(-b, a) * RAD_TO_DEG) % 360 + 360) % 360;
            return new AzAlt(az, alt);
        }
    }

    // LiveモードでスクリーンRaDecから地平座標への変換
    private toAzAlt_Live(
        orientationData: { alpha: number, beta: number, gamma: number, webkitCompassHeading: number}
    ): AzAlt {
        const theta = Math.atan2(this.dec, -this.ra); //画面上で普通に極座標
        const r = Math.sqrt(this.ra*this.ra + this.dec*this.dec) * DEG_TO_RAD;
        const alpha = orientationData.alpha;
        const beta = orientationData.beta;
        const gamma = orientationData.gamma;
        const xyz = new Cartesian(Math.sin(r)*Math.cos(theta), Math.sin(r)*Math.sin(theta), -Math.cos(r));
        const {x, y, z} = xyz.rotateY(gamma).rotateX(beta).rotateZ(alpha);
        const alt = asindeg(z);
        const az = ((Math.atan2(-y, x) * RAD_TO_DEG + (orientationData.webkitCompassHeading || 0) + 90) % 360 + 360) % 360;
        return new AzAlt(az, alt);
    }
}