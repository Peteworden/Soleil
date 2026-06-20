import { CanvasXy, HipData, StarChartConfig, StarInformation } from "../types/index.js";
import { getStarSize, starSize_0mag } from "./canvasHelpers.js";
import { ColorManager } from "./colorManager.js";
import { AstronomicalCalculator } from "../core/calculations.js";
import { RaDec } from "../core/coordinates/index.js";
import { DEG_TO_RAD } from "../utils/constants.js";
import { DeviceOrientationData } from "device/deviceOrientation.js";
import { areaCandidatesCacheInterface } from "./CanvasRenderer.js";

export class HipStarRenderer {
    private precessionCache: { angle: number, jd: number } | null = null;
    private hipStarsCache: { stars: HipData, jd: number } | null = null;
    private hipStarsColors: string[] = [];
    private hipStarSprites: Map<string, HTMLCanvasElement> = new Map();

    private orientationData: DeviceOrientationData = { alpha: 0, beta: 0, gamma: 0, webkitCompassHeading: 0 };

    constructor(
        private ctx: CanvasRenderingContext2D,
        private config: StarChartConfig,
        private colorManager: ColorManager,
        private areaCandidates: () => areaCandidatesCacheInterface | null,
    ) {
        this.initialize();
    }

    private initialize() {
        this.hipStarsColors = [];
        this.createHipStarSprites();
    }

    updateOrientationData(data: DeviceOrientationData) {
        this.orientationData = data;
    }

    async drawHipStars(hipStars: HipData, starInformation: Array<StarInformation>): Promise<void> {
        if (hipStars.count == 0) return;
        if (this.config.displaySettings.usedStar == 'noStar') return;
        const limitingMagnitude = AstronomicalCalculator.limitingMagnitude(this.config);
        const currentJd = this.config.displayTime.jd;

        const fov = { ra: this.config.viewState.fieldOfViewRA, dec: this.config.viewState.fieldOfViewDec };

        const centerRaRad = this.config.viewState.centerRA * DEG_TO_RAD;
        const sinCenterDec = Math.sin(this.config.viewState.centerDec * DEG_TO_RAD);
        const cosCenterDec = Math.cos(this.config.viewState.centerDec * DEG_TO_RAD);
        const centerAzRad = this.config.viewState.centerAz * DEG_TO_RAD;
        const sinCenterAlt = Math.sin(this.config.viewState.centerAlt * DEG_TO_RAD);
        const cosCenterAlt = Math.cos(this.config.viewState.centerAlt * DEG_TO_RAD);
        const sinLat = Math.sin(this.config.observationSite.latitude * DEG_TO_RAD);
        const cosLat = Math.cos(this.config.observationSite.latitude * DEG_TO_RAD);
        const siderealTime = this.config.siderealTime;

        // 歳差運動補正をキャッシュ
        let precessionAngle: number;
        if (this.precessionCache && Math.abs(this.precessionCache.jd - currentJd) < 10.0) {
            precessionAngle = this.precessionCache.angle;
        } else {
            precessionAngle = AstronomicalCalculator.precessionAngle('j2000', currentJd);
            this.precessionCache = { angle: precessionAngle, jd: currentJd };
        }

        // キャッシュされたHIP星データを使用
        const cachedStars = this.getCachedHipStars(hipStars, currentJd);
        if (cachedStars.count == 0) return;
        const zeroMagSize = starSize_0mag(this.config.viewState.fieldOfViewRA, this.config.viewState.fieldOfViewDec);

        const starColorRGB = this.colorManager.parseRgbToList(this.colorManager.getColor('star'));

        if (this.hipStarsColors.length == 0) {
            this.hipStarsColors = this.getHipStarsColors(hipStars.bvArray);
        }

        const areaInfo = this.areaCandidates();
        const minDec = (areaInfo?.minDec ?? 0) * DEG_TO_RAD;
        const maxDec = (areaInfo?.maxDec ?? 0) * DEG_TO_RAD;
        const minRa = (areaInfo?.minRa ?? 0) * DEG_TO_RAD;
        const maxRa = (areaInfo?.maxRa ?? 0) * DEG_TO_RAD;
        const areaInfoExist = areaInfo !== null;

        const limitMagnitudeForWhiten = Math.max(limitingMagnitude, 7.0);
        const blurRadii = [0.2, 0.6, 0.9, 1.2]
        const colorRatios = [0.4, 0.8, 1.0, 1.0]
        const opacities = ['ff', 'ff', 'bf', '40']
        if (this.config.displaySettings.showStarInfo) {
            for (let i = 0; i < cachedStars.count; i++) {
                const mag = cachedStars.magArray[i];
                if (mag > limitingMagnitude) continue;
                if (areaInfoExist) {
                    if (hipStars.decArray[i] < minDec || hipStars.decArray[i] > maxDec || hipStars.raArray[i] < minRa || hipStars.raArray[i] > maxRa) continue;
                }
                const coords = { ra: cachedStars.raArray[i], dec: cachedStars.decArray[i] };
                const [ifin, xy] = RaDec.toCanvasXYifinFast(
                    coords, this.config.displaySettings.mode,
                    centerRaRad, sinCenterDec, cosCenterDec, centerAzRad, sinCenterAlt, cosCenterAlt, sinLat, cosLat, siderealTime, this.orientationData,
                    fov, this.config.canvasSize
                )
                if (!ifin) continue;
                const color = this.hipStarsColors[i];
                starInformation.push({
                    type: 'hipStar',
                    x: xy.x,
                    y: xy.y,
                    data: {
                        radec: coords,
                        mag: mag,
                        bv: cachedStars.bvArray[i]
                    }
                });
                this.drawHipStar(mag, hipStars.bvArray[i], xy, limitingMagnitude, zeroMagSize, limitMagnitudeForWhiten, blurRadii, colorRatios, opacities, color, starColorRGB);
            }
        } else {
            for (let i = 0; i < cachedStars.count; i++) {
                if (cachedStars.magArray[i] > limitingMagnitude) continue;
                if (hipStars.decArray[i] < minDec || hipStars.decArray[i] > maxDec) continue;
                const coords = { ra: cachedStars.raArray[i], dec: cachedStars.decArray[i] };
                const [ifin, xy] = RaDec.toCanvasXYifinFast(
                    coords, this.config.displaySettings.mode,
                    centerRaRad, sinCenterDec, cosCenterDec, centerAzRad, sinCenterAlt, cosCenterAlt, sinLat, cosLat, siderealTime, this.orientationData,
                    fov, this.config.canvasSize
                )
                if (!ifin) continue;
                const color = this.hipStarsColors[i];
                this.drawHipStar(cachedStars.magArray[i], cachedStars.bvArray[i], xy, limitingMagnitude, zeroMagSize, limitMagnitudeForWhiten, blurRadii, colorRatios, opacities, color, starColorRGB);
            }
        }
    }

    drawHipStar(
        mag: number, bv: number, { x, y }: CanvasXy,
        limitingMagnitude: number, zeroMagSize: number, limitMagnitudeForWhiten: number,
        blurRadii: number[], colorRatios: number[], opacities: string[], starColor: string, starColorRGB: [number, number, number]
    ): void {
        const starSize = getStarSize(mag, limitingMagnitude, zeroMagSize) + 0.4;

        // === スプライト描画（高速化版、将来的に有効化する場合はコメント解除） ===
        if (starSize > 2) {
            let bv10Str = "null";
            if (!Number.isNaN(bv)) {
                bv10Str = Math.round(Math.max(-0.4, Math.min(2.0, bv)) * 10).toString();
            }
            const sprite = this.getHipStarSprite(starSize, bv10Str);
            if (sprite) {
                this.ctx.drawImage(sprite, x - sprite.width / 2, y - sprite.height / 2);
                return;
            } else {
                const off = this.createHipStarSprite(starSize, bv, this.colorManager.getColor('star'), 2.5);
                this.ctx.drawImage(off, x - off.width / 2, y - off.height / 2);
                return;
            }
        } else {
            if (mag > limitMagnitudeForWhiten - 2.0) {
                this.ctx.fillStyle = this.colorManager.blendColors(
                    starColorRGB,
                    starColor,
                    (limitMagnitudeForWhiten - mag) / 6.0
                );
            } else {
                this.ctx.fillStyle = starColor;
            }
            if (starSize < 2) {
                this.ctx.beginPath();
                // this.ctx.fillStyle = starColor;
                this.ctx.fillRect(x - starSize * 0.7, y - starSize * 0.7, starSize * 1.4, starSize * 1.4);
                this.ctx.fill();
            } else {
                this.ctx.beginPath();
                // this.ctx.fillStyle = starColor;
                this.ctx.arc(x, y, starSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }

    /**
     * HIP星データ全体を歳差運動補正してキャッシュ
     * @param hipStars 
     * @param jd 
     * @returns {stars: {raArray in rad, decArray in rad, magArray, bvArray, count}, jd}
     */
    private getCachedHipStars(hipStars: HipData, jd: number): HipData {
        if (!hipStars || hipStars.count === 0) {
            const emptyCache = {
                stars: {
                    raArray: new Float32Array(0),
                    decArray: new Float32Array(0),
                    magArray: new Float32Array(0),
                    bvArray: new Float32Array(0),
                    count: 0
                },
                jd: jd
            };
            this.hipStarsCache = emptyCache;
            return emptyCache.stars;
        }

        if (this.hipStarsCache !== null && Math.abs(this.hipStarsCache.jd - jd) < 10.0) {
            return this.hipStarsCache.stars;
        }

        if (this.hipStarsCache === null || this.hipStarsCache.stars.count !== hipStars.count) {
            this.hipStarsCache = {
                stars: {
                    raArray: new Float32Array(hipStars.count),
                    decArray: new Float32Array(hipStars.count),
                    magArray: hipStars.magArray,
                    bvArray: hipStars.bvArray,
                    count: hipStars.count
                },
                jd
            };
        } else {
            this.hipStarsCache.jd = jd;
        }
        const precessionAngle = AstronomicalCalculator.precessionAngle('j2000', jd);
        const sin = Math.sin(precessionAngle);
        const cos = Math.cos(precessionAngle);

        // 新しいHIP星データを作成（歳差運動補正済み）
        let radec = { ra: 0.0, dec: 0.0 };
        for (let i = 0; i < hipStars.count; i++) {
            radec = RaDec.precessionFast({ ra: hipStars.raArray[i], dec: hipStars.decArray[i] }, sin, cos);
            this.hipStarsCache.stars.raArray[i] = radec.ra;
            this.hipStarsCache.stars.decArray[i] = radec.dec;
        }
        return this.hipStarsCache.stars;
    }

    /**
     * HIP星用のスプライトを事前生成する
     * サイズ別にハロー付きの星を描画し、キャッシュしておく
     */
    createHipStarSprites(): void {
        console.log('create hip star sprites');
        this.hipStarSprites.clear();
        const baseColor = this.colorManager.getColor('star');

        // サイズ範囲: 3〜20px (0.5px刻み)
        const haloMultiplier = 2.0; // ハローの広がり倍率
        for (let size = 2; size <= 20; size += 1) {
            for (let bv = -4; bv <= 20; bv += 1) {
                const off = this.createHipStarSprite(size, bv * 0.1, baseColor, haloMultiplier);
                const key = `${size}-${Math.round(bv)}`;
                this.hipStarSprites.set(key, off);
            }
            // bv = null
            const off = this.createHipStarSprite(size, NaN, baseColor, haloMultiplier);
            const key = `${size}-null`;
            this.hipStarSprites.set(key, off);
        }
        // console.log(`HIP star sprites created: ${this.hipStarSprites.size} sprites`);
    }

    createHipStarSprite(size: number, bv: number, baseColor: string, haloMultiplier: number): HTMLCanvasElement {
        const color = this.colorManager.getStarColor(bv);
        const canvasSize = Math.ceil(size * haloMultiplier * 2) + 2;
        const center = canvasSize / 2;

        const off = document.createElement('canvas');
        off.width = canvasSize;
        off.height = canvasSize;
        const ctx = off.getContext('2d')!;

        // グラデーションでハロー付きの星を描画
        const gradient = ctx.createRadialGradient(center, center, 0, center, center, size * haloMultiplier);
        gradient.addColorStop(0, baseColor);
        gradient.addColorStop(0.15, baseColor);
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
     * HIP星用のスプライトを取得
     */
    private getHipStarSprite(size: number, bv10: string): HTMLCanvasElement | null {
        // サイズを整数に丸める
        const roundedSize = Math.round(size);
        return this.hipStarSprites.get(`${roundedSize}-${bv10}`) || null;
    }

    getHipStarsColors(bvs: Float32Array): string[] {
        const colors = Array.from(bvs).map((bv: number) => this.colorManager.getStarColor(bv));
        return colors;
    }

    clearHipStarsCache(jd: number, threshold: number = 10): void {
        if (this.hipStarsCache !== null && Math.abs(jd - this.hipStarsCache.jd) > threshold) {
            this.hipStarsCache = null;
        }
    }
}