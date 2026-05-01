import { HipData, StarChartConfig, StarInformation } from "../types/index.js";
import { getStarSize, starSize_0mag } from "./canvasHelpers.js";
import { CoordinateConverter } from "../core/coordinates.js";
import { ColorManager } from "./colorManager.js";
import { AstronomicalCalculator } from "../core/calculations.js";

export class HipStarRenderer {
    private precessionCache: { angle: number, jd: number } | null = null;
    private hipStarsCache: { stars: HipData, jd: number } | null = null;
    private hipStarsColors: string[] = [];
    private hipStarSprites: Map<string, HTMLCanvasElement> = new Map();

    constructor(
        private ctx: CanvasRenderingContext2D,
        private config: StarChartConfig,
        private coordinateConverter: CoordinateConverter,
        private colorManager: ColorManager,
        private orientationData: { alpha: number, beta: number, gamma: number, webkitCompassHeading: number }
    ) {
        this.initialize();
    }

    private initialize(){
        this.hipStarsColors = [];
        this.createHipStarSprites();
    }
    
    async drawHipStars(hipStars: HipData, starInformation: Array<StarInformation>): Promise<void> {
        if (hipStars.count == 0) return;
        if (this.config.displaySettings.usedStar == 'noStar') return;
        const limitingMagnitude = AstronomicalCalculator.limitingMagnitude(this.config);
        const currentJd = this.config.displayTime.jd;

        // 歳差運動補正をキャッシュ
        let precessionAngle: number;
        if (this.precessionCache && Math.abs(this.precessionCache.jd - currentJd) < 10.0) {
            precessionAngle = this.precessionCache.angle;
        } else {
            precessionAngle = this.coordinateConverter.precessionAngle('j2000', currentJd);
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

        const limitMagnitudeForWhiten = Math.max(limitingMagnitude, 7.0);
        const blurRadii = [0.2, 0.6, 0.9, 1.2]
        const colorRatios = [0.4, 0.8, 1.0, 1.0]
        const opacities = ['ff', 'ff', 'bf', '40']
        if (this.config.displaySettings.showStarInfo) {
            for (let i = 0; i < cachedStars.count; i++) {
                const mag = cachedStars.magArray[i];
                if (mag > limitingMagnitude) continue;
                const coords = { ra : cachedStars.raArray[i], dec: cachedStars.decArray[i] };
                const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.config, false, this.orientationData);
                if (!screenXY[0]) continue;
                const color = this.hipStarsColors[i];
                starInformation.push({
                    type: 'hipStar',
                    x: screenXY[1][0],
                    y: screenXY[1][1],
                    // x: screenXY[1].x,
                    // y: screenXY[1].y,
                    data: {
                        ra: coords.ra,
                        dec: coords.dec,
                        mag: mag,
                        bv: cachedStars.bvArray[i]
                    }
                });
                this.drawHipStar(mag, hipStars.bvArray[i], screenXY[1], limitingMagnitude, zeroMagSize, limitMagnitudeForWhiten, blurRadii, colorRatios, opacities, color, starColorRGB);
            }
        } else {
            for (let i = 0; i < cachedStars.count; i++) {
                if (cachedStars.magArray[i] > limitingMagnitude) continue;
                const coords = { ra: cachedStars.raArray[i], dec: cachedStars.decArray[i] };
                const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.config, false, this.orientationData);
                if (!screenXY[0]) continue;
                const color = this.hipStarsColors[i];
                this.drawHipStar(cachedStars.magArray[i], cachedStars.bvArray[i], screenXY[1], limitingMagnitude, zeroMagSize, limitMagnitudeForWhiten, blurRadii, colorRatios, opacities, color, starColorRGB);
            }
        }
    }

    drawHipStar(
        mag: number, bv: number, [x, y]: [number, number],
        limitingMagnitude: number, zeroMagSize: number, limitMagnitudeForWhiten: number,
        blurRadii: number[], colorRatios: number[], opacities: string[], starColor: string, starColorRGB: [number, number, number]
    ): void {
        const starSize = getStarSize(mag, limitingMagnitude, zeroMagSize) + 0.4;

        // === スプライト描画（高速化版、将来的に有効化する場合はコメント解除） ===
        if (starSize > 2) {
            // return;
            let bv10Str = "null";
            if (!Number.isNaN(bv)) {
                bv10Str = Math.round(Math.max(-0.4, Math.min(2.0, bv)) * 10).toString();
            }
            const sprite = this.getHipStarSprite(starSize, bv10Str);
            if (sprite) {
                this.ctx.drawImage(sprite, x - sprite.width / 2, y - sprite.height / 2);
                return;
            } else {
                console.log(mag, starSize.toFixed(1), bv10Str);
                const off = this.createHipStarSprite(starSize, bv, this.colorManager.getColor('star'), 2.5);
                this.ctx.drawImage(off, x - off.width / 2, y - off.height / 2);
                return;
            }
        } else {
            // this.ctx.fillStyle = starColor;
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
        // === スプライト描画ここまで ===

        /*
        if (starSize > 10) {
            // 中心が白、外側が星の色のグラデーション
            const originalFilter = this.ctx.filter;
            this.ctx.filter = `blur(${starSize * 0.2}px)`;
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, starSize);
            gradient.addColorStop(0.2, this.colorManager.getColor('star'));
            gradient.addColorStop(1, starColor);
            this.ctx.beginPath();
            this.ctx.fillStyle = gradient;
            this.ctx.arc(x, y, starSize, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.filter = originalFilter;
        } else if (star.getMagnitude()! < 2 || starSize > 5) {
            // 半透明の円を重ねる
            for (let i = blurRadii.length - 1; i >= 0; i--) {
                const color = this.colorManager.blendColors(
                    starColorRGB,
                    starColor,
                    colorRatios[i]
                );
                this.ctx.beginPath();
                this.ctx.fillStyle = `${color}${opacities[i]}`;
                this.ctx.arc(x, y, starSize * blurRadii[i], 0, Math.PI * 2);
                this.ctx.fill();
            }
            // 円だと勝手にピクセルレベルでの透明度の調整などが入るためか、正方形に置き換えるより大きく見える
        // } else {
        //     // 小さい星：シンプルな円で描画
        //     if (star.getMagnitude()! > limitMagnitudeForWhiten - 2.0) {
        //         this.ctx.fillStyle = this.colorManager.blendColors(
        //             starColorRGB,
        //             starColor,
        //             (limitMagnitudeForWhiten - star.getMagnitude()!) / 6.0
        //         );
        //     } else {
        //         this.ctx.fillStyle = starColor;
        //     }
        //     this.ctx.beginPath();
        //     this.ctx.arc(x, y, starSize, 0, Math.PI * 2);
        //     this.ctx.fill();
        // }
        // } else if (starSize < 2) {
        //     this.ctx.beginPath();
        //     this.ctx.fillStyle = this.colorManager.getColor('star');
        //     this.ctx.fillRect(x - starSize * 0.7, y - starSize * 0.7, starSize * 1.4, starSize * 1.4);
        //     this.ctx.fill();
        // } else {
        //     this.ctx.beginPath();
        //     this.ctx.fillStyle = starColor;
        //     this.ctx.arc(x, y, starSize, 0, Math.PI * 2);
        //     this.ctx.fill();
        }
        */
    }

    // HIP星データ全体を歳差運動補正してキャッシュ
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

        // console.log("HIP cache check:", this.hipStarsCache?.jd, jd);
        if (this.hipStarsCache && Math.abs(this.hipStarsCache.jd - jd) < 10.0) {
            return this.hipStarsCache.stars;
        }

        if (!this.hipStarsCache || this.hipStarsCache.stars.count !== hipStars.count) {
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
        const precessionAngle = this.coordinateConverter.precessionAngle('j2000', jd);

        // 新しいHIP星データを作成（歳差運動補正済み）
        let originalCoords = { ra: hipStars.raArray[0], dec: hipStars.decArray[0] };
        for (let i = 0; i < hipStars.count; i++) {
            originalCoords = { ra: hipStars.raArray[i], dec: hipStars.decArray[i] };
            const correctedCoords = this.coordinateConverter.precessionEquatorial(originalCoords, precessionAngle);
            this.hipStarsCache.stars.raArray[i] = correctedCoords.ra;
            this.hipStarsCache.stars.decArray[i] = correctedCoords.dec;
        }
        return this.hipStarsCache.stars;
    }

    /**
     * HIP星用のスプライトを事前生成する
     * サイズ別にハロー付きの星を描画し、キャッシュしておく
     */
    createHipStarSprites(): void {
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
        // console.log(`${roundedSize}-${Math.round(bv * 10)}`);
        return this.hipStarSprites.get(`${roundedSize}-${bv10}`) || null;
    }

    getHipStarsColors(bvs: Float32Array): string[] {
        const colors = Array.from(bvs).map((bv: number) => this.colorManager.getStarColor(bv));
        console.log("colors", colors);
        return colors;
    }

    clearHipStarsCache(): void {
        this.hipStarsCache = null;
    }
}