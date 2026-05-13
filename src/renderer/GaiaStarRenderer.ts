import { CanvasXy, GaiaData, StarChartConfig, StarInformation } from "../types/index.js";
import { getStarSize, starSize_0mag } from "./canvasHelpers.js";
import { AstronomicalCalculator } from "../core/calculations.js";
import { CoordinateConverter } from "../core/coordinates.js";
import { ColorManager } from "./colorManager.js";
import { RaDec } from "../core/coordinates/index.js";

export class GaiaStarRenderer {
    private precessionCache: { angle: number, jd: number } | null = null;
    private gaiaStarSprites: Map<string, HTMLCanvasElement> = new Map();
    constructor(
        private ctx: CanvasRenderingContext2D,
        private config: StarChartConfig,
        private coordinateConverter: CoordinateConverter,
        private colorManager: ColorManager,
        private areaCandidates: () => number[][],
        private orientationData: { alpha: number, beta: number, gamma: number, webkitCompassHeading: number }
    ) {
        console.log("GaiaStarRenderer constructor");
    }

    private initialize(){
        this.createGaiaStarSprites();
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
        
        const fov = {ra: this.config.viewState.fieldOfViewRA, dec: this.config.viewState.fieldOfViewDec};
        const transformConfig = this.coordinateConverter.chartConfigToTransformConfig(this.config);

        if (this.config.displaySettings.usedStar == 'to6') {
            if (magBrightest > 6.5) return;
        } else if (this.config.displaySettings.usedStar == 'to10') {
            if (magBrightest > 10.0) return;
        }

        const currentJd = (window as any).config.displayTime.jd;
        // 歳差運動補正をキャッシュ
        let precessionAngle: number;
        let recalculate = false;
        if (this.precessionCache && Math.abs(this.precessionCache.jd - currentJd) < 10.0) {
            precessionAngle = this.precessionCache.angle;
        } else {
            precessionAngle = this.coordinateConverter.precessionAngle('j2000', currentJd);
            this.precessionCache = { angle: precessionAngle, jd: currentJd };
            recalculate = true;
        }

        const zeroMagSize = starSize_0mag(this.config.viewState.fieldOfViewRA, this.config.viewState.fieldOfViewDec);

        // キャッシュされた領域候補を使用（毎回計算しない）
        const areas = this.areaCandidates();

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
                        const coords = this.coordinateConverter.precessionEquatorial({ ra, dec }, precessionAngle);
                        // const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.config);
                        const [ifin, {x, y}] = RaDec.toCanvasXYifin(coords, fov, this.config.canvasSize, transformConfig);
                        if (!ifin) continue;

                        starInformation.push({
                            type: 'gaiaStar',
                            x: x,
                            y: y,
                            data: {
                                raJ2000: ra,
                                decJ2000: dec,
                                raApparent: coords.ra,
                                decApparent: coords.dec,
                                mag: mag
                            }
                        });
                        this.drawGaiaStar(
                            {x, y}, 
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
                        const coords = this.coordinateConverter.precessionEquatorial({ ra, dec }, precessionAngle);
                        const [ifin, xy] = RaDec.toCanvasXYifin(coords, fov, this.config.canvasSize, transformConfig);
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
        // if (mag > unclipedLimitingMagnitude - 3.0) {
        //     const opacity = Math.round(255 - (mag - unclipedLimitingMagnitude + 3.0) * 30);
        //     this.ctx.fillStyle = `${faintFillStyle}${opacity.toString(16)}`;
        // } else {
        //     this.ctx.fillStyle = brightFillStyle;
        // }

        // if (starSize < 2.0) {
        //     this.ctx.fillRect(x - starSize * 0.7, y - starSize * 0.7, starSize * 1.4, starSize * 1.4);
        // } else {
        //     this.ctx.moveTo(x, y);
        //     this.ctx.arc(x, y, starSize, 0, Math.PI * 2);
        // }
        if (starSize > 2) {
            const sprite = this.getGaiaStarSprite(starSize);
            if (sprite) {
                this.ctx.drawImage(sprite, xy.x - sprite.width / 2, xy.y - sprite.height / 2);
                return;
            } else {
                console.log(starSize);
                const off = this.createGaiaStarSprite(starSize, brightFillStyle, 2.5);
                this.ctx.drawImage(off, xy.x - off.width / 2, xy.y - off.height / 2);
                return;
            }
        } else {
            if (mag > unclipedLimitingMagnitude - 3.0) {
                const opacity = Math.round(255 - (mag - unclipedLimitingMagnitude + 3.0) * 30);
                this.ctx.fillStyle = `${faintFillStyle}${opacity.toString(16)}`;
            } else {
                this.ctx.fillStyle = brightFillStyle;
            }

            if (starSize < 2.0) {
                this.ctx.fillRect(xy.x - starSize * 0.7, xy.y - starSize * 0.7, starSize * 1.4, starSize * 1.4);
            } else {
                this.ctx.moveTo(xy.x, xy.y);
                this.ctx.arc(xy.x, xy.y, starSize, 0, Math.PI * 2);
            }
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
        // console.log(`${roundedSize}-${Math.round(bv * 10)}`);
        return this.gaiaStarSprites.get(`${roundedSize}`) || null;
    }
}   