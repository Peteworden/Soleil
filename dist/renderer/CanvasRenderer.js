import { Planet, Moon } from '../models/CelestialObject.js';
import { CoordinateConverter } from '../utils/coordinates.js';
export class CanvasRenderer {
    constructor(canvas, config) {
        this.canvas = canvas;
        const context = canvas.getContext('2d');
        if (!context)
            throw new Error('Failed to get canvas context');
        this.ctx = context;
        // グローバルconfigのrenderOptionsと同じ参照にする
        const globalConfig = window.config;
        if (globalConfig && config.displaySettings && config.viewState) {
            this.config = globalConfig;
            console.log('🎨 CanvasRenderer constructor: Using global config.displaySettings reference');
            console.log('🎨 this.config === globalConfig.displaySettings:', this.config === globalConfig);
        }
        else {
            this.config = config;
            console.log('🎨 CanvasRenderer constructor: Using passed options (global config not available)');
        }
        this.coordinateConverter = new CoordinateConverter();
    }
    // 描画をクリア
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    // 天体を描画
    drawObject(object) {
        if (object instanceof Planet && !this.config.displaySettings.showPlanets)
            return;
        if (object instanceof Moon && !this.config.displaySettings.showPlanets)
            return;
        const coords = object.getCoordinates();
        const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.canvas, window.config.siderealTime);
        if (!screenXY[0])
            return;
        const [x, y] = screenXY[1];
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
        if (!this.config.displaySettings.showStars)
            return;
        const limitingMagnitude = this.limitingMagnitude(this.config);
        for (const star of hipStars) {
            const coords = star.getCoordinates();
            if (star.getMagnitude() > limitingMagnitude)
                continue;
            const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.canvas, window.config.siderealTime);
            if (!screenXY[0])
                continue;
            const [x, y] = screenXY[1];
            this.ctx.beginPath();
            this.ctx.fillStyle = this.getStarColor(star.getBv());
            this.ctx.arc(x, y, this.getStarSize(star.getMagnitude(), limitingMagnitude), 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    drawGaiaStars(gaiaData, gaiaHelpData, brightestMagnitude) {
        if (!this.config.displaySettings.showStars)
            return;
        const limitingMagnitude = this.limitingMagnitude(this.config);
        if (brightestMagnitude > limitingMagnitude)
            return;
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        for (const area of this.areaCandidates()) {
            let st = gaiaHelpData[area[0]];
            let fi = gaiaHelpData[area[1] + 1];
            for (let i = st; i < fi; i++) {
                const data = gaiaData[i];
                const mag = data[2] * 0.1;
                if (mag >= limitingMagnitude)
                    continue;
                // [ra, dec] = J2000toApparent(ra, dec, JD);
                const coords = { ra: data[0] * 0.001, dec: data[1] * 0.001 };
                const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.canvas, window.config.siderealTime);
                if (!screenXY[0])
                    continue;
                const [x, y] = screenXY[1];
                this.ctx.moveTo(x, y);
                this.ctx.arc(x, y, this.getStarSize(mag, limitingMagnitude), 0, Math.PI * 2);
            }
        }
        this.ctx.fill();
    }
    // グリッドを描画
    drawGrid() {
        if (!this.config.displaySettings.showGrid)
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
                const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.canvas, window.config.siderealTime);
                if (!screenXY[0])
                    continue;
                const [x, y] = screenXY[1];
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
                const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.canvas, window.config.siderealTime);
                if (!screenXY[0])
                    continue;
                const [x, y] = screenXY[1];
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
        if (!this.config.displaySettings.showConstellationLines)
            return;
        this.ctx.strokeStyle = 'rgba(68, 190, 206, 0.8)';
        this.ctx.lineWidth = 1;
        for (const constellation of constellations) {
            for (const line of constellation.lines) {
                const coords1 = { ra: line[0], dec: line[1] };
                const coords2 = { ra: line[2], dec: line[3] };
                const [ifin1, [x1, y1]] = this.coordinateConverter.equatorialToScreenXYifin(coords1, this.canvas, window.config.siderealTime, true);
                const [ifin2, [x2, y2]] = this.coordinateConverter.equatorialToScreenXYifin(coords2, this.canvas, window.config.siderealTime, true);
                if (!ifin1 && !ifin2)
                    continue;
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.stroke();
            }
        }
    }
    writeConstellationNames(constellations) {
        if (!this.config.displaySettings.showConstellationNames)
            return;
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        for (const constellation of constellations) {
            const coords = { ra: constellation.ra, dec: constellation.dec };
            const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.canvas, window.config.siderealTime);
            if (!screenXY[0])
                continue;
            const [x, y] = screenXY[1];
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(constellation.JPNname, x, y);
        }
    }
    limitingMagnitude(config) {
        const key1 = config.viewState.starSizeKey1;
        const key2 = config.viewState.starSizeKey2;
        const lm = Math.min(key1, Math.max(5, key1 - key2 * Math.log(Math.min(config.viewState.fieldOfViewRA, config.viewState.fieldOfViewDec) / 2)));
        return lm;
    }
    starSize_0mag(config) {
        const lm = this.limitingMagnitude(config);
        return Math.max(13 - 2.4 * Math.log(Math.min(config.viewState.fieldOfViewRA, config.viewState.fieldOfViewDec) + 3), 5);
    }
    getStarSize(magnitude, limitingMagnitude, starSize_0mag) {
        if (limitingMagnitude === undefined) {
            limitingMagnitude = this.limitingMagnitude(this.config);
        }
        if (starSize_0mag === undefined) {
            starSize_0mag = this.starSize_0mag(this.config);
        }
        return Math.max(0.7, 0.7 + starSize_0mag * limitingMagnitude / (limitingMagnitude + 1) * Math.pow((limitingMagnitude - magnitude) / limitingMagnitude, 1.3));
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
        if (this.config.displaySettings.mode == 'AEP') {
            const minDec = Math.max(-90, Math.min(this.config.viewState.centerDec - this.config.viewState.fieldOfViewDec, 90));
            const maxDec = Math.min(90, Math.max(this.config.viewState.centerDec + this.config.viewState.fieldOfViewDec, -90));
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
        }
        else if (this.config.displaySettings.mode == 'view') {
            const centerRA = this.config.viewState.centerRA;
            const centerDec = this.config.viewState.centerDec;
            const siderealTime = window.config.siderealTime;
            const np = this.coordinateConverter.equatorialToScreenXYifin({ ra: 0, dec: 90 }, this.canvas, window.config.siderealTime);
            const sp = this.coordinateConverter.equatorialToScreenXYifin({ ra: 0, dec: -90 }, this.canvas, window.config.siderealTime);
            if (np[0]) {
                const corner1Horizontal = this.coordinateConverter.screenRaDecToHorizontal_View({ ra: centerRA * 0.5, dec: centerDec * 0.5 });
                const corner2Horizontal = this.coordinateConverter.screenRaDecToHorizontal_View({ ra: centerRA * 0.5, dec: -centerDec * 0.5 });
                const corner1Equatorial = this.coordinateConverter.horizontalToEquatorial(corner1Horizontal, siderealTime);
                const corner2Equatorial = this.coordinateConverter.horizontalToEquatorial(corner2Horizontal, siderealTime);
                const minDec = Math.min(corner1Equatorial.dec, corner2Equatorial.dec);
                areaCandidates.push([this.areaNumber(0, minDec), this.areaNumber(359, 89.5)]);
            }
            else if (sp[0]) {
                const corner1Horizontal = this.coordinateConverter.screenRaDecToHorizontal_View({ ra: centerRA * 0.5, dec: centerDec * 0.5 });
                const corner2Horizontal = this.coordinateConverter.screenRaDecToHorizontal_View({ ra: centerRA * 0.5, dec: -centerDec * 0.5 });
                const corner1Equatorial = this.coordinateConverter.horizontalToEquatorial(corner1Horizontal, siderealTime);
                const corner2Equatorial = this.coordinateConverter.horizontalToEquatorial(corner2Horizontal, siderealTime);
                const maxDec = Math.max(corner1Equatorial.dec, corner2Equatorial.dec);
                areaCandidates.push([this.areaNumber(0, -90), this.areaNumber(359, maxDec)]);
            }
            else {
                let RA_max = 0, RA_min = 360, Dec_max = -90, Dec_min = 90;
                const edgeRA = [];
                const edgeDec = [];
                const screenRA = this.config.viewState.fieldOfViewRA / 2 + 1.0;
                const screenDec = this.config.viewState.fieldOfViewDec / 2 + 1.0;
                const supi = Math.ceil(3.0 * (this.config.viewState.fieldOfViewRA / 2 + 1.0));
                const supj = Math.ceil(3.0 * (this.config.viewState.fieldOfViewDec / 2 + 1.0));
                for (let j = 0; j <= supj; j++) {
                    let horizontal = this.coordinateConverter.screenRaDecToHorizontal_View({ ra: screenRA, dec: screenDec * j / supj });
                    let equatorial = this.coordinateConverter.horizontalToEquatorial(horizontal, siderealTime);
                    edgeRA.push(equatorial.ra);
                    edgeDec.push(equatorial.dec);
                    horizontal = this.coordinateConverter.screenRaDecToHorizontal_View({ ra: -screenRA, dec: screenDec * j / supj });
                    equatorial = this.coordinateConverter.horizontalToEquatorial(horizontal, siderealTime);
                    edgeRA.push(equatorial.ra);
                    edgeDec.push(equatorial.dec);
                    if (j == 0)
                        continue;
                    horizontal = this.coordinateConverter.screenRaDecToHorizontal_View({ ra: screenRA, dec: -screenDec * j / supj });
                    equatorial = this.coordinateConverter.horizontalToEquatorial(horizontal, siderealTime);
                    edgeRA.push(equatorial.ra);
                    edgeDec.push(equatorial.dec);
                    horizontal = this.coordinateConverter.screenRaDecToHorizontal_View({ ra: -screenRA, dec: -screenDec * j / supj });
                    equatorial = this.coordinateConverter.horizontalToEquatorial(horizontal, siderealTime);
                    edgeRA.push(equatorial.ra);
                    edgeDec.push(equatorial.dec);
                }
                for (let i = 0; i <= supi; i++) {
                    let horizontal = this.coordinateConverter.screenRaDecToHorizontal_View({ ra: screenRA * i / supi, dec: screenDec });
                    let equatorial = this.coordinateConverter.horizontalToEquatorial(horizontal, siderealTime);
                    edgeRA.push(equatorial.ra);
                    edgeDec.push(equatorial.dec);
                    horizontal = this.coordinateConverter.screenRaDecToHorizontal_View({ ra: screenRA * i / supi, dec: -screenDec });
                    equatorial = this.coordinateConverter.horizontalToEquatorial(horizontal, siderealTime);
                    edgeRA.push(equatorial.ra);
                    edgeDec.push(equatorial.dec);
                    if (i == 0)
                        continue;
                    horizontal = this.coordinateConverter.screenRaDecToHorizontal_View({ ra: -screenRA * i / supi, dec: screenDec });
                    equatorial = this.coordinateConverter.horizontalToEquatorial(horizontal, siderealTime);
                    edgeRA.push(equatorial.ra);
                    edgeDec.push(equatorial.dec);
                    horizontal = this.coordinateConverter.screenRaDecToHorizontal_View({ ra: -screenRA * i / supi, dec: -screenDec });
                    equatorial = this.coordinateConverter.horizontalToEquatorial(horizontal, siderealTime);
                    edgeRA.push(equatorial.ra);
                    edgeDec.push(equatorial.dec);
                }
                Dec_max = Math.max(...edgeDec);
                Dec_min = Math.min(...edgeDec);
                RA_max = Math.max(...edgeRA);
                RA_min = Math.min(...edgeRA);
                if (RA_max > 330 && RA_min < 30) {
                    RA_max = Math.max(...edgeRA.filter(function (value) { return value < (centerRA + 180) % 360; }));
                    RA_min = Math.min(...edgeRA.filter(function (value) { return value > (centerRA + 180) % 360; }));
                    areaCandidates.push([this.areaNumber(0, Dec_min), this.areaNumber(RA_max, Dec_min)]);
                    areaCandidates.push([this.areaNumber(RA_min, Dec_min), this.areaNumber(359.9, Dec_min)]);
                    for (let i = 1; i <= Math.floor(Dec_max) - Math.floor(Dec_min); i++) {
                        areaCandidates.push([areaCandidates[0][0] + 360 * i, areaCandidates[0][1] + 360 * i]);
                        areaCandidates.push([areaCandidates[1][0] + 360 * i, areaCandidates[1][1] + 360 * i]);
                    }
                }
                else {
                    areaCandidates.push([this.areaNumber(RA_min, Dec_min), this.areaNumber(RA_max, Dec_min)]);
                    for (let i = 1; i <= Math.floor(Dec_max) - Math.floor(Dec_min); i++) {
                        areaCandidates.push([areaCandidates[0][0] + 360 * i, areaCandidates[0][1] + 360 * i]);
                    }
                }
            }
        }
        return areaCandidates;
    }
    // 描画オプションを更新
    updateOptions(options) {
        const globalConfig = window.config;
        if (globalConfig) {
            if (this.config !== globalConfig) {
                this.config = globalConfig;
            }
        }
        Object.assign(this.config, options);
        // グローバルconfigも確実に更新
        if (globalConfig) {
            Object.assign(globalConfig, options);
        }
    }
}
//# sourceMappingURL=CanvasRenderer.js.map