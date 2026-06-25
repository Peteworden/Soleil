import { CanvasXy, DeviceOrientationData, GaiaData, StarChartConfig, StarInformation } from "../types/index.js";
import { getStarSize, starSize_0mag } from "./canvasHelpers.js";
import { AstronomicalCalculator } from "../core/calculations.js";
import { ColorManager } from "./colorManager.js";
import { RaDec } from "../core/coordinates/index.js";
import { DEG_TO_RAD } from "../utils/constants.js";
import { areaCandidatesCacheInterface } from "./CanvasRenderer.js";

export class GaiaStarRenderer {
    private precessionCache: { angle: number, jd: number } | null = null;
    private gaiaStarSprites: Map<string, HTMLCanvasElement> = new Map();

    private orientationData: DeviceOrientationData = { alpha: 0, beta: 0, gamma: 0, webkitCompassHeading: 0 };

    constructor(
        private ctx: CanvasRenderingContext2D,
        private config: StarChartConfig,
        private colorManager: ColorManager,
        private areaCandidates: () => areaCandidatesCacheInterface | null,
    ) {
    }

    updateOrientationData(data: DeviceOrientationData) {
        this.orientationData = data;
    }

    drawGaiaStars(
        gaiaData: GaiaData, gaiaHelpData: number[], magBrightest: number,
        starInformation: Array<StarInformation>
    ): void {
        if (this.config.displaySettings.usedStar == 'noStar') return;
        if (!["AEP", "view"].includes(this.config.displaySettings.mode)) return;
        if (!gaiaData || gaiaData.count == 0) return;
        if (!gaiaHelpData || gaiaHelpData.length == 0) return;
        const limitingMagnitude = AstronomicalCalculator.limitingMagnitude(this.config);
        if (magBrightest > limitingMagnitude) return;
        const unclipedLimitingMagnitude = AstronomicalCalculator.unclipedLimitingMagnitude(this.config.viewState);

        const centerRaRad = this.config.viewState.centerRadec.ra * DEG_TO_RAD;
        const sinCenterDec = Math.sin(this.config.viewState.centerRadec.dec * DEG_TO_RAD);
        const cosCenterDec = Math.cos(this.config.viewState.centerRadec.dec * DEG_TO_RAD);
        const centerAzRad = this.config.viewState.centerAzalt.az * DEG_TO_RAD;
        const sinCenterAlt = Math.sin(this.config.viewState.centerAzalt.alt * DEG_TO_RAD);
        const cosCenterAlt = Math.cos(this.config.viewState.centerAzalt.alt * DEG_TO_RAD);
        const sinLat = Math.sin(this.config.observationSite.latitude * DEG_TO_RAD);
        const cosLat = Math.cos(this.config.observationSite.latitude * DEG_TO_RAD);
        const siderealTime = this.config.siderealTime;


        if (this.config.displaySettings.usedStar == 'to6') {
            if (magBrightest > 6.5) return;
        } else if (this.config.displaySettings.usedStar == 'to10') {
            if (magBrightest > 10.0) return;
        }

        const currentJd = this.config.displayTime.jd;
        // 歳差運動補正をキャッシュ
        let precessionAngle: number;
        if (this.precessionCache && Math.abs(this.precessionCache.jd - currentJd) < 10.0) {
            precessionAngle = this.precessionCache.angle;
        } else {
            precessionAngle = AstronomicalCalculator.precessionAngle('j2000', currentJd);
            this.precessionCache = { angle: precessionAngle, jd: currentJd };
        }
        const sinPrec = Math.sin(precessionAngle);
        const cosPrec = Math.cos(precessionAngle);

        const zeroMagSize = starSize_0mag(this.config.viewState.fov);

        // キャッシュされた領域候補を使用（毎回計算しない）
        const areasInfo = this.areaCandidates();
        if (areasInfo === null) return;
        const areas = areasInfo.areas;

        this.ctx.fillStyle = this.colorManager.getColor('star');
        const brightFillStyle = this.colorManager.getColor('star');
        const faintFillStyle = `#${this.colorManager.getColor('star').slice(1, 7)}`;
        this.ctx.beginPath();

        if (this.config.displaySettings.showStarInfo) {
            for (const area of areas) {
                for (let unit = area[0]; unit < area[1] + 1; unit++) {
                    const raInt = unit % 360;
                    const decInt = Math.floor(unit / 360) - 90;
                    const st = gaiaHelpData[unit];
                    const fi = gaiaHelpData[unit + 1];

                    // バッチ処理で座標変換を最適化
                    for (let i = st; i < fi; i++) {
                        const mag = gaiaData.magArray[i];
                        if (mag >= limitingMagnitude) continue;
                        const ra = raInt + gaiaData.raArray[i];
                        const dec = decInt + gaiaData.decArray[i];
                        const coords = RaDec.precessionFast({ ra: ra * DEG_TO_RAD, dec: dec * DEG_TO_RAD }, sinPrec, cosPrec);
                        const [ifin, xy] = RaDec.toCanvasXYifinFast(
                            coords, this.config.displaySettings.mode,
                            centerRaRad, sinCenterDec, cosCenterDec, centerAzRad, sinCenterAlt, cosCenterAlt, sinLat, cosLat, siderealTime, this.orientationData,
                            this.config.viewState.fov, this.config.canvasSize
                        )
                        if (!ifin) continue;

                        starInformation.push({
                            type: 'gaiaStar',
                            x: xy.x,
                            y: xy.y,
                            data: {
                                radecJ2000: { ra, dec },
                                radecApparent: coords,
                                mag: mag
                            }
                        });
                        this.drawGaiaStar(
                            xy,
                            mag, limitingMagnitude, unclipedLimitingMagnitude, zeroMagSize,
                            faintFillStyle, brightFillStyle
                        );
                    }
                }
            }
        } else {
            for (const area of areas) {
                for (let unit = area[0]; unit < area[1] + 1; unit++) {
                    const raInt = unit % 360;
                    const decInt = Math.floor(unit / 360) - 90;
                    const st = gaiaHelpData[unit];
                    const fi = gaiaHelpData[unit + 1];

                    // バッチ処理で座標変換を最適化
                    for (let i = st; i < fi; i++) {
                        const mag = gaiaData.magArray[i];
                        if (mag >= limitingMagnitude) continue;
                        const ra = raInt + gaiaData.raArray[i];
                        const dec = decInt + gaiaData.decArray[i];
                        const coords = RaDec.precessionFast({ ra: ra * DEG_TO_RAD, dec: dec * DEG_TO_RAD }, sinPrec, cosPrec);
                        const [ifin, xy] = RaDec.toCanvasXYifinFast(
                            coords, this.config.displaySettings.mode,
                            centerRaRad, sinCenterDec, cosCenterDec, centerAzRad, sinCenterAlt, cosCenterAlt, sinLat, cosLat, siderealTime, this.orientationData,
                            this.config.viewState.fov, this.config.canvasSize
                        )
                        if (!ifin) continue;

                        this.drawGaiaStar(
                            xy,
                            mag, limitingMagnitude, unclipedLimitingMagnitude, zeroMagSize,
                            faintFillStyle, brightFillStyle
                        );
                    }
                }
            }
        }
        this.ctx.fill();
    }

    drawGaiaStar(
        xy: CanvasXy, mag: number,
        limitingMagnitude: number, unclipedLimitingMagnitude: number, zeroMagSize: number,
        faintFillStyle: string, brightFillStyle: string
    ): void {
        const starSize = getStarSize(mag, limitingMagnitude, zeroMagSize);
        if (starSize > 2) {
            const sprite = this.getGaiaStarSprite(starSize);
            if (sprite) {
                this.ctx.drawImage(sprite, xy.x - sprite.width / 2, xy.y - sprite.height / 2);
            } else {
                console.log(`no gaia splite for size ${starSize}`);
                const off = this.createGaiaStarSprite(starSize, brightFillStyle, 2.5);
                this.ctx.drawImage(off, xy.x - off.width / 2, xy.y - off.height / 2);
            }
        } else {
            if (mag > unclipedLimitingMagnitude - 3.0) {
                const opacity = Math.round(255 - (mag - unclipedLimitingMagnitude + 3.0) * 30);
                this.ctx.fillStyle = `${faintFillStyle}${opacity.toString(16)}`;
            } else {
                this.ctx.fillStyle = brightFillStyle;
            }

            // if (starSize < 2.0) {
            //     this.ctx.fillRect(xy.x - starSize * 0.7, xy.y - starSize * 0.7, starSize * 1.4, starSize * 1.4);
            // } else {
            this.ctx.moveTo(xy.x, xy.y);
            this.ctx.arc(xy.x, xy.y, starSize, 0, Math.PI * 2);
            // }
        }
    }

    /**
     * Gaia星用のスプライトを事前生成する
     * サイズ別にハロー付きの星を描画し、キャッシュしておく
     */
    createGaiaStarSprites(): void {
        this.gaiaStarSprites.clear();
        const baseColor = this.colorManager.getColor('star');

        // サイズ範囲: 3〜20px (0.5px刻み)
        const haloMultiplier = 2.0; // ハローの広がり倍率
        for (let size = 2; size <= 20; size += 1) {
            const off = this.createGaiaStarSprite(size, baseColor, haloMultiplier);
            const key = `${size}`;
            this.gaiaStarSprites.set(key, off);
        }
        // console.log(`Gaia star sprites created: ${this.gaiaStarSprites.size} sprites`);
    }

    createGaiaStarSprite(size: number, color: string, haloMultiplier: number): HTMLCanvasElement {
        const canvasSize = Math.ceil(size * haloMultiplier * 2) + 2;
        const center = canvasSize / 2;

        const off = document.createElement('canvas');
        off.width = canvasSize;
        off.height = canvasSize;
        const ctx = off.getContext('2d')!;

        // グラデーションでハロー付きの星を描画
        const gradient = ctx.createRadialGradient(center, center, 0, center, center, size * haloMultiplier);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.15, color);
        gradient.addColorStop(0.35, `${color}aa`);
        gradient.addColorStop(0.6, `${color}44`);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(center, center, size * haloMultiplier, 0, Math.PI * 2);
        ctx.fill();
        return off;
    }

    /**
     * Gaia星用のスプライトを取得
     */
    private getGaiaStarSprite(size: number): HTMLCanvasElement | null {
        // サイズを整数に丸める
        const roundedSize = Math.round(size);
        return this.gaiaStarSprites.get(`${roundedSize}`) || null;
    }
}   