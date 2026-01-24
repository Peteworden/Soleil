import { getStarSize, starSize_0mag } from "../utils/canvasHelpers.js";
import { AstronomicalCalculator } from "../utils/calculations.js";
export class GaiaStarRenderer {
    constructor(ctx, config, coordinateConverter, colorManager, areaCandidates, orientationData) {
        this.ctx = ctx;
        this.config = config;
        this.coordinateConverter = coordinateConverter;
        this.colorManager = colorManager;
        this.areaCandidates = areaCandidates;
        this.orientationData = orientationData;
        this.precessionCache = null;
        this.gaiaStarSprites = new Map();
        console.log("GaiaStarRenderer constructor");
        this.createGaiaStarSprites();
    }
    drawGaiaStars(gaiaData, gaiaHelpData, magBrightest, starInformation) {
        if (this.config.displaySettings.usedStar == 'noStar')
            return;
        if (!["AEP", "view"].includes(this.config.displaySettings.mode))
            return;
        if (!gaiaData || gaiaData.length == 0)
            return;
        if (!gaiaHelpData || gaiaHelpData.length == 0)
            return;
        const limitingMagnitude = AstronomicalCalculator.limitingMagnitude(this.config);
        if (magBrightest > limitingMagnitude)
            return;
        const unclipedLimitingMagnitude = AstronomicalCalculator.unclipedLimitingMagnitude(this.config.viewState);
        if (this.config.displaySettings.usedStar == 'to6') {
            if (magBrightest > 6.5)
                return;
        }
        else if (this.config.displaySettings.usedStar == 'to10') {
            if (magBrightest > 10.0)
                return;
        }
        const currentJd = window.config.displayTime.jd;
        // 歳差運動補正をキャッシュ
        let precessionAngle;
        let recalculate = false;
        if (this.precessionCache && Math.abs(this.precessionCache.jd - currentJd) < 10.0) {
            precessionAngle = this.precessionCache.angle;
        }
        else {
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
                        const data = gaiaData[i];
                        const mag = data[2];
                        if (mag >= limitingMagnitude)
                            continue;
                        const ra = raInt + data[0];
                        const dec = decInt + data[1];
                        const coords = this.coordinateConverter.precessionEquatorial({ ra, dec }, precessionAngle);
                        const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.config);
                        if (!screenXY[0])
                            continue;
                        starInformation.push({
                            type: 'gaiaStar',
                            x: screenXY[1][0],
                            y: screenXY[1][1],
                            data: {
                                raJ2000: ra,
                                decJ2000: dec,
                                raApparent: coords.ra,
                                decApparent: coords.dec,
                                mag: mag
                            }
                        });
                        this.drawGaiaStar(screenXY[1], mag, limitingMagnitude, unclipedLimitingMagnitude, zeroMagSize, faintFillStyle, brightFillStyle);
                    }
                }
            }
        }
        else {
            for (const area of areas) {
                for (let unit = area[0]; unit < area[1] + 1; unit++) {
                    const raInt = unit % 360;
                    const decInt = Math.floor(unit / 360) - 90;
                    const st = gaiaHelpData[unit];
                    const fi = gaiaHelpData[unit + 1];
                    // バッチ処理で座標変換を最適化
                    for (let i = st; i < fi; i++) {
                        const data = gaiaData[i];
                        const mag = data[2];
                        if (mag >= limitingMagnitude)
                            continue;
                        const ra = raInt + data[0];
                        const dec = decInt + data[1];
                        const coords = this.coordinateConverter.precessionEquatorial({ ra, dec }, precessionAngle);
                        const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.config);
                        if (!screenXY[0])
                            continue;
                        this.drawGaiaStar(screenXY[1], mag, limitingMagnitude, unclipedLimitingMagnitude, zeroMagSize, faintFillStyle, brightFillStyle);
                    }
                }
            }
        }
        this.ctx.fill();
    }
    drawGaiaStar([x, y], mag, limitingMagnitude, unclipedLimitingMagnitude, zeroMagSize, faintFillStyle, brightFillStyle) {
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
                this.ctx.drawImage(sprite, x - sprite.width / 2, y - sprite.height / 2);
                return;
            }
            else {
                console.log(starSize);
                const off = this.createGaiaStarSprite(starSize, brightFillStyle, 2.5);
                this.ctx.drawImage(off, x - off.width / 2, y - off.height / 2);
                return;
            }
        }
        else {
            if (mag > unclipedLimitingMagnitude - 3.0) {
                const opacity = Math.round(255 - (mag - unclipedLimitingMagnitude + 3.0) * 30);
                this.ctx.fillStyle = `${faintFillStyle}${opacity.toString(16)}`;
            }
            else {
                this.ctx.fillStyle = brightFillStyle;
            }
            if (starSize < 2.0) {
                this.ctx.fillRect(x - starSize * 0.7, y - starSize * 0.7, starSize * 1.4, starSize * 1.4);
            }
            else {
                this.ctx.moveTo(x, y);
                this.ctx.arc(x, y, starSize, 0, Math.PI * 2);
            }
        }
    }
    /**
     * Gaia星用のスプライトを事前生成する
     * サイズ別にハロー付きの星を描画し、キャッシュしておく
     */
    createGaiaStarSprites() {
        this.gaiaStarSprites.clear();
        const baseColor = this.colorManager.getColor('star');
        // サイズ範囲: 3〜20px (0.5px刻み)
        const haloMultiplier = 2.0; // ハローの広がり倍率
        for (let size = 2; size <= 20; size += 1) {
            const off = this.createGaiaStarSprite(size, baseColor, haloMultiplier);
            const key = `${size}`;
            this.gaiaStarSprites.set(key, off);
        }
        console.log(`Gaia star sprites created: ${this.gaiaStarSprites.size} sprites`);
    }
    createGaiaStarSprite(size, color, haloMultiplier) {
        const canvasSize = Math.ceil(size * haloMultiplier * 2) + 2;
        const center = canvasSize / 2;
        const off = document.createElement('canvas');
        off.width = canvasSize;
        off.height = canvasSize;
        const ctx = off.getContext('2d');
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
    getGaiaStarSprite(size) {
        // サイズを整数に丸める
        const roundedSize = Math.round(size);
        // console.log(`${roundedSize}-${Math.round(bv * 10)}`);
        return this.gaiaStarSprites.get(`${roundedSize}`) || null;
    }
}
//# sourceMappingURL=GaiaStarRenderer.js.map