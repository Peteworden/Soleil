import { Planet, Moon } from '../models/CelestialObject.js';
import { CoordinateConverter } from '../utils/coordinates.js';
export class CanvasRenderer {
    constructor(canvas, options, latitude, longitude) {
        this.canvas = canvas;
        const context = canvas.getContext('2d');
        if (!context)
            throw new Error('Failed to get canvas context');
        this.ctx = context;
        // グローバルconfigのrenderOptionsと同じ参照にする
        const globalConfig = window.config;
        if (globalConfig && globalConfig.renderOptions) {
            this.options = globalConfig.renderOptions;
            console.log('🎨 CanvasRenderer constructor: Using global config.renderOptions reference');
        }
        else {
            this.options = options;
            console.log('🎨 CanvasRenderer constructor: Using passed options (global config not available)');
        }
        this.coordinateConverter = new CoordinateConverter(latitude, longitude);
    }
    // 描画をクリア
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    // 天体を描画
    drawObject(object) {
        if (object instanceof Planet && !this.options.showPlanets)
            return;
        if (object instanceof Moon && !this.options.showPlanets)
            return;
        const coords = object.getCoordinates();
        const screenRaDec = this.coordinateConverter.equatorialToAepScreen(coords, { ra: this.options.centerRA, dec: this.options.centerDec });
        if (!this.isInScreenRaDec(screenRaDec))
            return;
        const [x, y] = this.screenRaDecToScreenXY(screenRaDec);
        const magnitude = object.getMagnitude();
        const type = object.getType();
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        if (type === 'hipStar' && magnitude !== undefined) {
            this.ctx.arc(x, y, this.getStarSize(magnitude), 0, Math.PI * 2);
            this.ctx.fillStyle = 'white';
            this.ctx.fill();
        }
        else if (object instanceof Planet) {
            this.ctx.arc(x, y, 3, 0, Math.PI * 2);
            this.ctx.fillStyle = 'red';
            this.ctx.fill();
            this.ctx.fillStyle = 'yellow';
            this.ctx.fillText(object.getJapaneseName(), x, y);
        }
        else if (object instanceof Moon) {
            this.ctx.arc(x, y, 30, 0, Math.PI * 2);
            this.ctx.fillStyle = 'yellow';
            this.ctx.fill();
        }
        else {
            this.ctx.arc(x, y, 3, 0, Math.PI * 2);
            this.ctx.fillStyle = 'blue';
            this.ctx.fill();
        }
    }
    drawHipStars(hipStars) {
        if (!this.options.showStars)
            return;
        console.log(this.options.centerRA, this.options.centerDec);
        const limitingMagnitude = this.limitingMagnitude(this.options);
        for (const star of hipStars) {
            const coords = star.getCoordinates();
            if (star.getMagnitude() > limitingMagnitude)
                continue;
            const screenRaDec = this.coordinateConverter.equatorialToAepScreen(coords, { ra: this.options.centerRA, dec: this.options.centerDec });
            if (!this.isInScreenRaDec(screenRaDec))
                continue;
            const [x, y] = this.screenRaDecToScreenXY(screenRaDec);
            const color = this.getStarColor(star.getBv());
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.getStarSize(star.getMagnitude(), limitingMagnitude), 0, Math.PI * 2);
            this.ctx.fillStyle = color;
            this.ctx.fill();
        }
    }
    drawGaiaStars(gaiaData, gaiaHelpData, brightestMagnitude) {
        if (!this.options.showStars)
            return;
        const limitingMagnitude = this.limitingMagnitude(this.options);
        if (brightestMagnitude > limitingMagnitude)
            return;
        for (const area of this.areaCandidates()) {
            let st = gaiaHelpData[area[0]];
            let fi = gaiaHelpData[area[1] + 1];
            for (let i = st; i < fi; i++) {
                const data = gaiaData[i];
                const mag = data[2] * 0.1;
                if (mag >= limitingMagnitude)
                    continue;
                // [ra, dec] = J2000toApparent(ra, dec, JD);
                let coord = { ra: data[0] * 0.001, dec: data[1] * 0.001 };
                const screenRaDec = this.coordinateConverter.equatorialToAepScreen(coord, { ra: this.options.centerRA, dec: this.options.centerDec });
                if (!this.isInScreenRaDec(screenRaDec))
                    continue;
                const [x, y] = this.screenRaDecToScreenXY(screenRaDec);
                this.ctx.beginPath();
                this.ctx.arc(x, y, this.getStarSize(mag, limitingMagnitude), 0, Math.PI * 2);
                this.ctx.fillStyle = 'white';
                this.ctx.fill();
            }
        }
    }
    // グリッドを描画
    drawGrid() {
        if (!this.options.showGrid)
            return;
        const step = 15; // 15度ごとにグリッド線を描画
        const vertexStep = 2; // 2度ごとに頂点を描画
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 1;
        let lastX = null;
        let lastY = null;
        let isInScreen = false;
        // 赤経のグリッド線
        for (let ra = 0; ra < 360; ra += step) {
            this.ctx.beginPath();
            for (let dec = -90; dec <= 90; dec += vertexStep) {
                const coords = { ra, dec };
                const screenRaDec = this.coordinateConverter.equatorialToAepScreen(coords, { ra: this.options.centerRA, dec: this.options.centerDec });
                if (!this.isInScreenRaDec(screenRaDec))
                    continue;
                const [x, y] = this.screenRaDecToScreenXY(screenRaDec);
                if (dec === -90) {
                    this.ctx.moveTo(x, y);
                }
                else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.stroke();
        }
        // 赤緯のグリッド線
        for (let dec = -90; dec <= 90; dec += step) {
            this.ctx.beginPath();
            for (let ra = 0; ra <= 360; ra += vertexStep) {
                const coords = { ra, dec };
                const screenRaDec = this.coordinateConverter.equatorialToAepScreen(coords, { ra: this.options.centerRA, dec: this.options.centerDec });
                if (!this.isInScreenRaDec(screenRaDec))
                    continue;
                const [x, y] = this.screenRaDecToScreenXY(screenRaDec);
                if (ra === 0) {
                    this.ctx.moveTo(x, y);
                }
                else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.stroke();
        }
    }
    // 星座線を描画
    drawConstellationLines(constellations) {
        if (!this.options.showConstellationLines)
            return;
        this.ctx.strokeStyle = 'rgba(68, 190, 206, 0.8)';
        this.ctx.lineWidth = 1;
        for (const constellation of constellations) {
            for (const line of constellation.lines) {
                const coords1 = { ra: line[0], dec: line[1] };
                const coords2 = { ra: line[2], dec: line[3] };
                const screenRaDec1 = this.coordinateConverter.equatorialToAepScreen(coords1, { ra: this.options.centerRA, dec: this.options.centerDec });
                const screenRaDec2 = this.coordinateConverter.equatorialToAepScreen(coords2, { ra: this.options.centerRA, dec: this.options.centerDec });
                if (!this.isInScreenRaDec(screenRaDec1) && !this.isInScreenRaDec(screenRaDec2))
                    continue;
                const [x1, y1] = this.screenRaDecToScreenXY(screenRaDec1);
                const [x2, y2] = this.screenRaDecToScreenXY(screenRaDec2);
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.stroke();
            }
        }
    }
    writeConstellationNames(constellations) {
        if (!this.options.showConstellationNames)
            return;
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        for (const constellation of constellations) {
            const coords = { ra: constellation.ra, dec: constellation.dec };
            const screenRaDec = this.coordinateConverter.equatorialToAepScreen(coords, { ra: this.options.centerRA, dec: this.options.centerDec });
            if (!this.isInScreenRaDec(screenRaDec))
                continue;
            const [x, y] = this.screenRaDecToScreenXY(screenRaDec);
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(constellation.JPNname, x, y);
        }
    }
    //x, yが画面内かどうかをチェック
    isInScreenXY(x, y) {
        return x >= 0 && x <= this.canvas.width && y >= 0 && y <= this.canvas.height;
    }
    //screenRaDecが画面内かどうかをチェック
    isInScreenRaDec(screenRaDec) {
        return 2 * Math.abs(screenRaDec.ra) <= this.options.fieldOfViewRA && 2 * Math.abs(screenRaDec.dec) <= this.options.fieldOfViewDec;
    }
    // 赤道座標を画面座標に変換
    celestialToScreen(coords) {
        const centerRA = this.options.centerRA;
        const centerDec = this.options.centerDec;
        const fovRA = this.options.fieldOfViewRA;
        const fovDec = this.options.fieldOfViewDec;
        // 中心からの相対位置を計算
        let raDiff = coords.ra - centerRA;
        if (raDiff > 180)
            raDiff -= 360;
        if (raDiff < -180)
            raDiff += 360;
        const decDiff = coords.dec - centerDec;
        // 画面座標に変換
        const x = this.canvas.width * (0.5 - raDiff / fovRA);
        const y = this.canvas.height * (0.5 - decDiff / fovDec);
        // 画面内かチェック
        if (x >= 0 && x <= this.canvas.width && y >= 0 && y <= this.canvas.height) {
            return [true, [x, y]];
        }
        else {
            return [false, [x, y]];
        }
    }
    screenRaDecToScreenXY(raDec) {
        const x = this.canvas.width * (0.5 - raDec.ra / this.options.fieldOfViewRA);
        const y = this.canvas.height * (0.5 - raDec.dec / this.options.fieldOfViewDec);
        return [x, y];
    }
    limitingMagnitude(renderOptions) {
        const lm = Math.min(Math.max(renderOptions.starSizeKey1 - renderOptions.starSizeKey2 * Math.log(Math.min(renderOptions.fieldOfViewRA, renderOptions.fieldOfViewDec) / 2), 5), renderOptions.starSizeKey1);
        return lm;
    }
    starSize_0mag(renderOptions) {
        const lm = this.limitingMagnitude(renderOptions);
        return 13 - 2.4 * Math.log(Math.min(renderOptions.fieldOfViewRA, renderOptions.fieldOfViewDec) + 3);
    }
    getStarSize(magnitude, limitingMagnitude, starSize_0mag) {
        if (limitingMagnitude === undefined) {
            limitingMagnitude = this.limitingMagnitude(this.options);
        }
        if (starSize_0mag === undefined) {
            starSize_0mag = this.starSize_0mag(this.options);
        }
        return Math.max(1, 1 + starSize_0mag * limitingMagnitude / (limitingMagnitude + 1) * Math.pow((limitingMagnitude - magnitude) / limitingMagnitude, 1.3));
    }
    getStarColor(bv) {
        let c;
        let starColor = 'white';
        // if (darker) {
        if (bv === undefined || bv === 100) {
            c = starColor;
        }
        else {
            bv = Math.max(-0.4, Math.min(2.0, bv));
            let r = 0, g = 0, b = 0;
            if (bv < 0.4)
                r = 0.5 + 0.5 * (bv + 0.4) / 0.8;
            else
                r = 1.0;
            if (bv < 0)
                g = 1.0 + bv;
            else if (bv < 0.4)
                g = 1.0;
            else
                g = 1.0 - 0.75 * (bv - 0.4) / 1.6;
            if (bv < 0.4)
                b = 1.0;
            else
                b = 1.0 - (bv - 0.4) / 1.6;
            r = Math.round(r * 255);
            g = Math.round(g * 255);
            b = Math.round(b * 255);
            c = `rgba(${r}, ${g}, ${b}, 1)`;
        }
        return c;
    }
    areaNumber(ra, dec) {
        return Math.floor(360 * Math.floor(dec + 90) + Math.floor(ra));
    }
    areaCandidates() {
        const areaCandidates = [];
        const minDec = Math.max(-90, Math.min(this.options.centerDec - this.options.fieldOfViewDec, 90));
        const maxDec = Math.min(90, Math.max(this.options.centerDec + this.options.fieldOfViewDec, -90));
        if (minDec === -90) {
            areaCandidates.push([this.areaNumber(0, -90), this.areaNumber(359, maxDec)]);
        }
        else if (maxDec === 90) {
            areaCandidates.push([this.areaNumber(0, minDec), this.areaNumber(359, 89.5)]);
        }
        else {
            areaCandidates.push([this.areaNumber(0, minDec), this.areaNumber(359, minDec)]);
            for (let i = minDec + 1; i < maxDec + 1; i++) {
                areaCandidates.push([this.areaNumber(0, i), this.areaNumber(359, i)]);
            }
        }
        return areaCandidates;
    }
    // 描画オプションを更新
    updateOptions(options) {
        console.log('🎨 CanvasRenderer updateOptions called with:', options);
        console.log('🎨 this.options === config.renderOptions:', this.options === window.config?.renderOptions);
        // グローバルconfigとの参照を確認
        const globalConfig = window.config;
        if (globalConfig) {
            // 参照が異なる場合は、globalConfig.renderOptionsの参照に更新
            if (this.options !== globalConfig.renderOptions) {
                console.log('🎨 Updating this.options reference to match globalConfig.renderOptions');
                this.options = globalConfig.renderOptions;
            }
        }
        Object.assign(this.options, options);
        console.log('🎨 this.options after update:', this.options);
        console.log('🎨 this.options === config.renderOptions after update:', this.options === window.config?.renderOptions);
    }
}
//# sourceMappingURL=CanvasRenderer.js.map