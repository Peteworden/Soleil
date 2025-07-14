import { SolarSystemDataManager } from '../models/SolarSystemObjects.js';
import { CoordinateConverter } from '../utils/coordinates.js';
import { AstronomicalCalculator } from '../utils/calculations.js';
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
        }
        else {
            this.config = config;
        }
        this.coordinateConverter = new CoordinateConverter();
    }
    // 描画をクリア
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    // 天体を描画
    drawObject(object) {
        const coordsJ2000 = object.getCoordinates();
        const precessionAngle = this.coordinateConverter.precessionAngle('j2000', window.config.displayTime.jd);
        const coords = this.coordinateConverter.precessionEquatorial(coordsJ2000, precessionAngle);
        const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.canvas, window.config.siderealTime);
        if (!screenXY[0])
            return;
        const [x, y] = screenXY[1];
        const magnitude = object.getMagnitude();
        const type = object.getType();
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = 'orange';
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = 'orange';
        /*
        Gx       Galaxy 銀河
        OC       Open star cluster 散開星団
        Gb       Globular star cluster, usually in the Milky Way Galaxy 球状星団
        Nb       Bright emission or reflection nebula 散光星雲、超新星残骸
        Pl       Planetary nebula 惑星状星雲
        C+N      Cluster associated with nebulosity
        Ast      Asterism or group of a few stars
        Kt       Knot or nebulous region in an external galaxy
        TS       Triple star    (was *** in the CDS table version)
        DS       Double star    (was ** in the CDS version)
        SS       Single star    (was * in the CDS version)
        ?        Uncertain type or may not exist
        U        Unidentified at the place given, or type unknown (was blank in CDS v.)
        -        Object called nonexistent in the RNGC (Sulentic and Tifft 1973)
        PD       Photographic plate defect
        */
        this.ctx.beginPath();
        if (type === 'Gx') { // Galaxy, 楕円
            this.ctx.ellipse(x, y, 6, 3, 0, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.fillText(object.getName(), x + 5, y - 5);
        }
        else if (['OC', 'C+N', 'Ast'].includes(type || '')) { // Open Cluster, 上三角形
            this.ctx.moveTo(x, y - 6);
            this.ctx.lineTo(x + 4, y + 3);
            this.ctx.lineTo(x - 4, y + 3);
            this.ctx.lineTo(x, y - 6);
            this.ctx.stroke();
            this.ctx.fillText(object.getName(), x + 5, y - 5);
        }
        else if (type == 'Gb') { // Globular Cluster, 円
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.fillText(object.getName(), x + 5, y - 5);
        }
        else if (['Nb', 'Pl', 'Kt'].includes(type || '')) { // Nebula, 正方形
            this.ctx.moveTo(x, y - 6);
            this.ctx.lineTo(x + 6, y);
            this.ctx.lineTo(x, y + 6);
            this.ctx.lineTo(x - 6, y);
            this.ctx.lineTo(x, y - 6);
            this.ctx.stroke();
            this.ctx.fillText(object.getName(), x + 5, y - 5);
        }
        else if (['DS', 'TS', 'SS'].includes(type || '')) { // Star, 星
            const a = Math.PI / 5;
            const b = 6;
            const c = 3;
            this.ctx.moveTo(x, y - b);
            this.ctx.lineTo(x + c * Math.sin(a), y - c * Math.cos(a));
            this.ctx.lineTo(x + b * Math.sin(2 * a), y - b * Math.cos(2 * a));
            this.ctx.lineTo(x + c * Math.sin(3 * a), y - c * Math.cos(3 * a));
            this.ctx.lineTo(x + b * Math.sin(4 * a), y - b * Math.cos(4 * a));
            this.ctx.lineTo(x + c * Math.sin(5 * a), y - c * Math.cos(5 * a));
            this.ctx.lineTo(x + b * Math.sin(6 * a), y - b * Math.cos(6 * a));
            this.ctx.lineTo(x + c * Math.sin(7 * a), y - c * Math.cos(7 * a));
            this.ctx.lineTo(x + b * Math.sin(8 * a), y - b * Math.cos(8 * a));
            this.ctx.lineTo(x + c * Math.sin(9 * a), y - c * Math.cos(9 * a));
            this.ctx.lineTo(x, y - b);
            this.ctx.stroke();
            this.ctx.fillText(object.getName(), x + 5, y - 5);
        }
        else { // ×印
            this.ctx.moveTo(x - 4, y - 4);
            this.ctx.lineTo(x + 4, y + 4);
            this.ctx.moveTo(x + 4, y - 4);
            this.ctx.lineTo(x - 4, y + 4);
            this.ctx.stroke();
            this.ctx.fillText(object.getName(), x + 5, y - 5);
        }
    }
    drawJsonObject(objects) {
        for (const object of objects) {
            this.drawObject(object);
        }
    }
    drawMessier(messierObjects) {
        if (!this.config.displaySettings.showMessiers)
            return;
        this.drawJsonObject(messierObjects);
    }
    drawRec(recObjects) {
        if (!this.config.displaySettings.showRecs)
            return;
        this.drawJsonObject(recObjects);
    }
    drawNGC(ngcObjects) {
        if (!this.config.displaySettings.showNGC)
            return;
        this.drawJsonObject(ngcObjects);
    }
    drawSolarSystemObjects() {
        if (!this.config.displaySettings.showPlanets)
            return;
        const siderealTime = window.config.siderealTime;
        const limitingMagnitude = AstronomicalCalculator.limitingMagnitude(this.config);
        const zeroMagSize = this.starSize_0mag(this.config);
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = 'white';
        const objects = SolarSystemDataManager.getAllObjects();
        for (const object of objects) {
            if (object.getType() === 'sun') {
                this.drawSun(object);
            }
            else if (object.getType() === 'moon') {
                this.drawMoon(object, objects.find(obj => obj.getType() === 'sun'));
            }
            else if (object.getType() === 'planet') {
                this.drawPlanet(object, limitingMagnitude, zeroMagSize);
            }
            else if (object.getType() === 'asteroid') {
                this.drawMinorObject(object, limitingMagnitude, zeroMagSize);
            }
        }
    }
    drawSun(sun) {
        const siderealTime = window.config.siderealTime;
        const coords = sun.getRaDec();
        const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.canvas, siderealTime);
        if (!screenXY[0])
            return;
        const [x, y] = screenXY[1];
        const radius = Math.max(this.canvas.width * (0.267 / sun.getDistance()) / this.config.viewState.fieldOfViewRA, 13);
        this.ctx.font = '16px serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = 'yellow';
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillText(sun.getJapaneseName(), x + Math.max(0.8 * radius, 10), y - Math.max(0.8 * radius, 10));
    }
    drawPlanet(planet, limitingMagnitude, zeroMagSize) {
        const siderealTime = window.config.siderealTime;
        this.ctx.font = '16px serif';
        this.ctx.textAlign = 'left';
        const coords = planet.getRaDec();
        const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.canvas, siderealTime);
        if (!screenXY[0])
            return;
        const [x, y] = screenXY[1];
        const radius = Math.max(this.getStarSize(planet.getMagnitude(), limitingMagnitude, zeroMagSize), 1);
        this.ctx.beginPath();
        this.ctx.fillStyle = 'rgb(255, 219, 88)';
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        const dxy = Math.max(2, 0.8 * radius);
        this.ctx.fillText(planet.getJapaneseName(), x + dxy, y - dxy);
    }
    drawMoon(moon, sun) {
        if (this.config.observationSite.observerPlanet !== '地球')
            return;
        const { ra: sunRaDeg, dec: sunDecDeg } = sun.getRaDec();
        const { ra: moonRaDeg, dec: moonDecDeg } = moon.getRaDec();
        const sunRaRad = sunRaDeg * Math.PI / 180;
        const sunDecRad = sunDecDeg * Math.PI / 180;
        const moonRaRad = moonRaDeg * Math.PI / 180;
        const moonDecRad = moonDecDeg * Math.PI / 180;
        const moonDist = moon.getDistance();
        const radius = Math.max(this.canvas.width * (0.259 / (moonDist / 384400)) / this.config.viewState.fieldOfViewRA, 13);
        const lon_sun = moon.Ms + 0.017 * Math.sin(moon.Ms + 0.017 * Math.sin(moon.Ms)) + moon.ws;
        const k = (1 - Math.cos(lon_sun - moon.lon_moon) * Math.cos(moon.lat_moon)) * 0.5;
        let p, RA1, Dec1, A1, h1, scrRA1, scrDec1, x1, y1;
        const screenXY = this.coordinateConverter.equatorialToScreenXYifin({ ra: moonRaDeg, dec: moonDecDeg }, this.canvas, window.config.siderealTime);
        if (!screenXY[0])
            return;
        const [x, y] = screenXY[1];
        if (this.config.displaySettings.mode == 'AEP') {
            p = Math.atan2(Math.cos(sunDecRad) * Math.sin(moonRaRad - sunRaRad), -Math.sin(moonDecRad) * Math.cos(sunDecRad) * Math.cos(moonRaRad - sunRaRad) + Math.cos(moonDecRad) * Math.sin(sunDecRad));
            RA1 = (moonRaDeg - 0.2 * Math.cos(p) / Math.cos(moonDecRad));
            Dec1 = (moonDecDeg - 0.2 * Math.sin(p));
            const screenXY1 = this.coordinateConverter.equatorialToScreenXYifin({ ra: RA1, dec: Dec1 }, this.canvas, window.config.siderealTime, true);
            const [x1, y1] = screenXY1[1];
            p = Math.atan2(y1 - y, x1 - x);
            // console.log(p * 180/Math.PI);
        }
        else if (this.config.displaySettings.mode == 'EtP') {
            p = Math.atan2(Math.cos(sunDecRad) * Math.sin(moonRaRad - sunRaRad), -Math.sin(moonDecRad) * Math.cos(sunDecRad) * Math.cos(moonRaRad - sunRaRad) + Math.cos(moonDecRad) * Math.sin(sunDecRad));
        }
        else if (this.config.displaySettings.mode == 'view') {
            p = Math.atan2(Math.cos(sunDecRad) * Math.sin(moonRaRad - sunRaRad), -Math.sin(moonDecRad) * Math.cos(sunDecRad) * Math.cos(moonRaRad - sunRaRad) + Math.cos(moonDecRad) * Math.sin(sunDecRad));
            // console.log(p * 180/Math.PI);
            RA1 = (moonRaDeg - 0.2 * Math.cos(p) / Math.cos(moonDecRad));
            Dec1 = (moonDecDeg - 0.2 * Math.sin(p));
            const screenXY1 = this.coordinateConverter.equatorialToScreenXYifin({ ra: RA1, dec: Dec1 }, this.canvas, window.config.siderealTime, true);
            const [x1, y1] = screenXY1[1];
            p = Math.atan2(y1 - y, x1 - x);
        }
        else {
            return;
        }
        this.ctx.font = '16px serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        if (k < 0.5) {
            this.ctx.fillStyle = 'yellow';
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#333';
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, p, p + Math.PI);
            this.ctx.ellipse(x, y, radius, radius * (1 - 2 * k), p - Math.PI, 0, Math.PI);
            this.ctx.fill();
        }
        else {
            this.ctx.fillStyle = '#333';
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, p - Math.PI, p);
            this.ctx.fill();
            this.ctx.fillStyle = 'yellow';
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, p - Math.PI, p);
            this.ctx.ellipse(x, y, radius, radius * (2 * k - 1), p, 0, Math.PI);
            this.ctx.fill();
        }
        this.ctx.fillStyle = 'yellow';
        this.ctx.fillText(moon.getJapaneseName(), x + Math.max(0.8 * radius, 10), y - Math.max(0.8 * radius, 10));
    }
    drawMinorObject(minorObject, limitingMagnitude, zeroMagSize) {
        const siderealTime = window.config.siderealTime;
        this.ctx.font = '14px serif';
        this.ctx.textAlign = 'left';
        const coords = minorObject.getRaDec();
        const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.canvas, siderealTime);
        if (!screenXY[0])
            return;
        const [x, y] = screenXY[1];
        const magnitude = Math.min(minorObject.getMagnitude() ?? 11.5, limitingMagnitude);
        const radius = Math.max(this.getStarSize(magnitude, limitingMagnitude, zeroMagSize), 1);
        this.ctx.beginPath();
        this.ctx.fillStyle = 'rgb(255, 219, 88)';
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillText(minorObject.getJapaneseName(), x + 2, y - 2);
    }
    drawHipStars(hipStars) {
        if (!this.config.displaySettings.showStars)
            return;
        const limitingMagnitude = AstronomicalCalculator.limitingMagnitude(this.config);
        const siderealTime = window.config.siderealTime;
        const precessionAngle = this.coordinateConverter.precessionAngle('j2000', window.config.displayTime.jd);
        const zeroMagSize = this.starSize_0mag(this.config);
        for (const star of hipStars) {
            if (star.getMagnitude() > limitingMagnitude)
                continue;
            const coords = this.coordinateConverter.precessionEquatorial(star.getCoordinates(), precessionAngle);
            const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.canvas, siderealTime);
            if (!screenXY[0])
                continue;
            const [x, y] = screenXY[1];
            this.ctx.beginPath();
            this.ctx.fillStyle = this.getStarColor(star.getBv());
            this.ctx.arc(x, y, this.getStarSize(star.getMagnitude(), limitingMagnitude, zeroMagSize), 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    writeStarNames(starNames) {
        const showStarNames = this.config.displaySettings.showStarNames;
        if (this.config.displaySettings.showStarNames == 'off')
            return;
        const limitingMagnitude = AstronomicalCalculator.limitingMagnitude(this.config);
        const siderealTime = window.config.siderealTime;
        const precessionAngle = this.coordinateConverter.precessionAngle('j2000', window.config.displayTime.jd);
        const zeroMagSize = this.starSize_0mag(this.config);
        const tier_range = [180, 90, 60, 40, 30, 30];
        let tierLimit = 3;
        if (showStarNames == 'to1') {
            tierLimit = 1;
        }
        else if (showStarNames == 'to2') {
            tierLimit = 2;
        }
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        for (const starName of starNames) {
            if (tierLimit == 1 && starName.tier > 0)
                continue;
            if (tierLimit == 2 && starName.tier > 1)
                continue;
            if (Math.max(this.config.viewState.fieldOfViewRA, this.config.viewState.fieldOfViewDec) > tier_range[starName.tier - 1])
                continue;
            const coords = this.coordinateConverter.precessionEquatorial({ ra: starName.ra, dec: starName.dec }, precessionAngle);
            const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.canvas, siderealTime);
            if (!screenXY[0])
                continue;
            const [x, y] = screenXY[1];
            this.ctx.font = `${18 - 1 * starName.tier}px serif`;
            if (starName.jpnName) {
                this.ctx.fillText(starName.jpnName, x + 2, y - 2);
            }
            else {
                this.ctx.fillText(starName.name, x + 2, y - 2);
            }
        }
        this.ctx.fill();
    }
    drawGaiaStars(gaiaData, gaiaHelpData, brightestMagnitude) {
        if (!this.config.displaySettings.showStars)
            return;
        const limitingMagnitude = AstronomicalCalculator.limitingMagnitude(this.config);
        if (brightestMagnitude > limitingMagnitude)
            return;
        const siderealTime = window.config.siderealTime;
        const precessionAngle = this.coordinateConverter.precessionAngle('j2000', window.config.displayTime.jd);
        const zeroMagSize = this.starSize_0mag(this.config);
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
                const coordsJ2000 = { ra: data[0] * 0.001, dec: data[1] * 0.001 };
                const coords = this.coordinateConverter.precessionEquatorial(coordsJ2000, precessionAngle);
                const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.canvas, siderealTime);
                if (!screenXY[0])
                    continue;
                const [x, y] = screenXY[1];
                this.ctx.moveTo(x, y);
                this.ctx.arc(x, y, this.getStarSize(mag, limitingMagnitude, zeroMagSize), 0, Math.PI * 2);
            }
        }
        this.ctx.fill();
    }
    // グリッドを描画
    drawGrid() {
        if (!this.config.displaySettings.showGrid)
            return;
        let i, j;
        const fieldOfViewRA = this.config.viewState.fieldOfViewRA;
        const fieldOfViewDec = this.config.viewState.fieldOfViewDec;
        const centerRA = this.config.viewState.centerRA;
        const centerDec = this.config.viewState.centerDec;
        const centerAz = this.config.viewState.centerAz;
        const centerAlt = this.config.viewState.centerAlt;
        if (this.config.displaySettings.mode == 'view') {
            const minAlt = Math.max(-90, Math.min(this.coordinateConverter.screenRaDecToHorizontal_View({ ra: fieldOfViewRA / 2, dec: -fieldOfViewDec / 2 }).alt, centerAlt - fieldOfViewDec / 2));
            const maxAlt = Math.min(90, Math.max(this.coordinateConverter.screenRaDecToHorizontal_View({ ra: fieldOfViewRA / 2, dec: fieldOfViewDec / 2 }).alt, centerAlt + fieldOfViewDec / 2));
            const altGridCalcIv = Math.min(fieldOfViewRA, fieldOfViewDec) / 40;
            const azGridCalcIv = Math.min(altGridCalcIv / Math.max(Math.cos(centerAlt * Math.PI / 180), 0.1), 8); //天頂、天底付近で発散するため
            const gridIvChoices = [0.5, 1, 2, 5, 10, 30, 45];
            this.ctx.strokeStyle = 'gray';
            this.ctx.lineWidth = 1;
            let altGridIv = 45;
            for (i = 0; i < gridIvChoices.length; i++) {
                if (gridIvChoices[i] > Math.min(fieldOfViewDec, fieldOfViewRA) / 6) {
                    altGridIv = gridIvChoices[i];
                    break;
                }
            }
            let azGridIv = 45;
            for (i = 0; i < gridIvChoices.length; i++) {
                if (gridIvChoices[i] > altGridIv / Math.cos(centerAlt * Math.PI / 180)) {
                    azGridIv = gridIvChoices[i];
                    break;
                }
            }
            let az, alt, screenRA0, screenDec0;
            if (maxAlt == 90) { // 天頂を含むとき
                for (i = Math.floor(minAlt / altGridIv); i < Math.ceil(90 / altGridIv); i++) {
                    alt = i * altGridIv;
                    if (alt == 0)
                        this.ctx.lineWidth = 3;
                    else
                        this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    for (j = 0; j < 360 / azGridCalcIv + 1; j++) {
                        az = j * azGridCalcIv;
                        [screenRA0, screenDec0] = this.drawHorizontalLine(j, az, alt, screenRA0, screenDec0);
                    }
                    this.ctx.stroke();
                }
                this.ctx.lineWidth = 1;
                for (i = 0; i < Math.ceil(360 / azGridIv); i++) {
                    az = i * azGridIv;
                    for (j = 0; j < Math.ceil(90 / altGridCalcIv) - Math.floor(minAlt / altGridCalcIv) + 1; j++) {
                        alt = (Math.floor(minAlt / altGridCalcIv) + j) * altGridCalcIv;
                        [screenRA0, screenDec0] = this.drawHorizontalLine(j, az, alt, screenRA0, screenDec0);
                    }
                    this.ctx.stroke();
                }
            }
            else if (minAlt == -90) { // 天底を含むとき
                // 等高度線
                for (i = Math.floor(-90 / altGridIv); i < Math.ceil(maxAlt / altGridIv); i++) {
                    alt = i * altGridIv;
                    if (alt == 0)
                        this.ctx.lineWidth = 3;
                    else
                        this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    for (j = 0; j < 360 / azGridCalcIv + 1; j++) {
                        az = j * azGridCalcIv;
                        [screenRA0, screenDec0] = this.drawHorizontalLine(j, az, alt, screenRA0, screenDec0);
                    }
                    this.ctx.stroke();
                }
                this.ctx.lineWidth = 1;
                // 等方位線
                for (i = 0; i < Math.ceil(360 / azGridIv); i++) {
                    az = i * azGridIv;
                    for (j = 0; j < Math.ceil((maxAlt + 90) / altGridCalcIv) + 1; j++) {
                        alt = -90 + j * altGridCalcIv;
                        [screenRA0, screenDec0] = this.drawHorizontalLine(j, az, alt, screenRA0, screenDec0);
                    }
                    this.ctx.stroke();
                }
            }
            else {
                const azRange = Math.max((this.coordinateConverter.screenRaDecToHorizontal_View({ ra: -fieldOfViewRA / 2, dec: fieldOfViewDec / 2 }).az - centerAz + 360) % 360, (this.coordinateConverter.screenRaDecToHorizontal_View({ ra: -fieldOfViewRA / 2, dec: 0 }).az - centerAz + 360) % 360, (this.coordinateConverter.screenRaDecToHorizontal_View({ ra: -fieldOfViewRA / 2, dec: -fieldOfViewDec / 2 }).az - centerAz + 360) % 360);
                for (i = Math.floor(minAlt / altGridIv); i < Math.ceil(maxAlt / altGridIv); i++) {
                    alt = i * altGridIv;
                    if (alt == 0) {
                        this.ctx.lineWidth = 3;
                    }
                    else {
                        this.ctx.lineWidth = 1;
                    }
                    this.ctx.beginPath();
                    for (j = 0; j < 2 * azRange / azGridCalcIv + 1; j++) {
                        az = centerAz - azRange + j * azGridCalcIv;
                        [screenRA0, screenDec0] = this.drawHorizontalLine(j, az, alt, screenRA0, screenDec0);
                    }
                    this.ctx.stroke();
                }
                this.ctx.lineWidth = 1;
                if (centerAz - azRange < 0) {
                    for (i = 0; i < Math.ceil((centerAz + azRange) / azGridIv); i++) {
                        az = i * azGridIv;
                        for (j = 0; j < Math.ceil(maxAlt / altGridCalcIv) - Math.floor(minAlt / altGridCalcIv) + 1; j++) {
                            alt = (Math.floor(minAlt / altGridCalcIv) + j) * altGridCalcIv;
                            [screenRA0, screenDec0] = this.drawHorizontalLine(j, az, alt, screenRA0, screenDec0);
                        }
                        this.ctx.stroke();
                    }
                    for (i = Math.floor((centerAz - azRange + 360) / azGridIv); i < Math.ceil(360 / azGridIv); i++) {
                        az = i * azGridIv;
                        for (j = 0; j < Math.ceil(maxAlt / altGridCalcIv) - Math.floor(minAlt / altGridCalcIv) + 1; j++) {
                            alt = (Math.floor(minAlt / altGridCalcIv) + j) * altGridCalcIv;
                            [screenRA0, screenDec0] = this.drawHorizontalLine(j, az, alt, screenRA0, screenDec0);
                        }
                        this.ctx.stroke();
                    }
                }
                else if (centerAz + azRange > 360) {
                    for (i = 0; i < Math.ceil((centerAz + azRange) / azGridIv); i++) {
                        az = i * azGridIv;
                        for (j = 0; j < Math.ceil(maxAlt / altGridCalcIv) - Math.floor(minAlt / altGridCalcIv) + 1; j++) {
                            alt = (Math.floor(minAlt / altGridCalcIv) + j) * altGridCalcIv;
                            [screenRA0, screenDec0] = this.drawHorizontalLine(j, az, alt, screenRA0, screenDec0);
                        }
                        this.ctx.stroke();
                    }
                    for (i = Math.floor((centerAz - azRange + 360) / azGridIv); i < Math.ceil(360 / azGridIv); i++) {
                        az = i * azGridIv;
                        for (j = 0; j < Math.ceil(maxAlt / altGridCalcIv) - Math.floor(minAlt / altGridCalcIv) + 1; j++) {
                            alt = (Math.floor(minAlt / altGridCalcIv) + j) * altGridCalcIv;
                            [screenRA0, screenDec0] = this.drawHorizontalLine(j, az, alt, screenRA0, screenDec0);
                        }
                        this.ctx.stroke();
                    }
                }
                else {
                    for (i = Math.floor((centerAz - azRange) / azGridIv); i < Math.ceil((centerAz + azRange) / azGridIv); i++) {
                        az = i * azGridIv;
                        for (j = 0; j < Math.ceil(maxAlt / altGridCalcIv) - Math.floor(minAlt / altGridCalcIv) + 1; j++) {
                            alt = (Math.floor(minAlt / altGridCalcIv) + j) * altGridCalcIv;
                            [screenRA0, screenDec0] = this.drawHorizontalLine(j, az, alt, screenRA0, screenDec0);
                        }
                        this.ctx.stroke();
                    }
                }
            }
            this.ctx.stroke();
        }
    }
    drawHorizontalLine(j, az, alt, screenRA0, screenDec0) {
        const { ra: screenRA1, dec: screenDec1 } = this.coordinateConverter.horizontalToScreenRaDec({ az: az, alt: alt }, { az: this.config.viewState.centerAz, alt: this.config.viewState.centerAlt });
        const semiWidthRA = this.config.viewState.fieldOfViewRA / 2;
        const semiWidthDec = this.config.viewState.fieldOfViewDec / 2;
        if (j > 0) {
            if (screenRA0 === undefined || screenDec0 === undefined)
                return [screenRA1, screenDec1];
            if ((Math.abs(screenRA0) < semiWidthRA && Math.abs(screenDec0) < semiWidthDec) ||
                (Math.abs(screenRA1) < semiWidthRA && Math.abs(screenDec1) < semiWidthDec)) {
                const [x1, y1] = this.coordinateConverter.screenRaDecToScreenXY({ ra: screenRA0, dec: screenDec0 }, this.canvas);
                const [x2, y2] = this.coordinateConverter.screenRaDecToScreenXY({ ra: screenRA1, dec: screenDec1 }, this.canvas);
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
            }
        }
        return [screenRA1, screenDec1];
    }
    // 星座線
    drawConstellationLines(constellations) {
        if (!this.config.displaySettings.showConstellationLines)
            return;
        this.ctx.strokeStyle = 'rgba(68, 190, 206, 0.8)';
        this.ctx.lineWidth = 1;
        const xmax = this.canvas.width;
        const xmin = 0;
        const ymax = this.canvas.height;
        const ymin = 0;
        const fieldSize = Math.max(this.config.viewState.fieldOfViewRA, this.config.viewState.fieldOfViewDec);
        const maxLength = 30 * 2 * Math.max(xmax, ymax) / fieldSize;
        const siderealTime = window.config.siderealTime;
        const precessionAngle = this.coordinateConverter.precessionAngle('j2000', window.config.displayTime.jd);
        this.ctx.beginPath();
        for (const constellation of constellations) {
            for (const line of constellation.lines) {
                const coords1J2000 = { ra: line[0], dec: line[1] };
                const coords1 = this.coordinateConverter.precessionEquatorial(coords1J2000, precessionAngle);
                const coords2J2000 = { ra: line[2], dec: line[3] };
                const coords2 = this.coordinateConverter.precessionEquatorial(coords2J2000, precessionAngle);
                const [ifin1, [x1, y1]] = this.coordinateConverter.equatorialToScreenXYifin(coords1, this.canvas, siderealTime, true);
                const [ifin2, [x2, y2]] = this.coordinateConverter.equatorialToScreenXYifin(coords2, this.canvas, siderealTime, true);
                if (Math.min(x1, x2) > xmax || Math.max(x1, x2) < xmin || Math.min(y1, y2) > ymax || Math.max(y1, y2) < ymin)
                    continue;
                if ((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2) > maxLength * maxLength)
                    continue;
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
            }
        }
        this.ctx.stroke();
    }
    writeConstellationNames(constellations) {
        if (!this.config.displaySettings.showConstellationNames)
            return;
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        const siderealTime = window.config.siderealTime;
        const precessionAngle = this.coordinateConverter.precessionAngle('j2000', window.config.displayTime.jd);
        for (const constellation of constellations) {
            const coordsJ2000 = { ra: constellation.ra, dec: constellation.dec };
            const coords = this.coordinateConverter.precessionEquatorial(coordsJ2000, precessionAngle);
            const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.canvas, siderealTime);
            if (!screenXY[0])
                continue;
            const [x, y] = screenXY[1];
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(constellation.JPNname, x, y);
        }
    }
    drawReticle() {
        if (!this.config.displaySettings.showReticle)
            return;
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 1;
        const a = 20;
        const b = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, this.canvas.height / 2 - a);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height / 2 - b);
        this.ctx.moveTo(this.canvas.width / 2, this.canvas.height / 2 + a);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height / 2 + b);
        this.ctx.moveTo(this.canvas.width / 2 - a, this.canvas.height / 2);
        this.ctx.lineTo(this.canvas.width / 2 - b, this.canvas.height / 2);
        this.ctx.moveTo(this.canvas.width / 2 + a, this.canvas.height / 2);
        this.ctx.lineTo(this.canvas.width / 2 + b, this.canvas.height / 2);
        this.ctx.stroke();
    }
    drawCameraView() {
        if (!this.config.displaySettings.camera || this.config.displaySettings.camera == 'none')
            return;
        if (this.config.displaySettings.mode != 'AEP' && this.config.displaySettings.mode != 'view')
            return;
        const cameraSelect = document.getElementById('camera');
        if (!cameraSelect)
            return;
        const cameraTiltSlider = document.getElementById('cameraTiltSlider');
        if (!cameraTiltSlider || cameraTiltSlider.style.display == 'none')
            return;
        const cameraView = [
            { name: '85-cmos', w: 3.34, h: 2.27 },
            { name: 'fs128-cmos', w: 1.36, h: 0.91 },
            { name: 'r200ss-cmos', w: 1.44, h: 0.99 },
        ];
        const cameraName = cameraView.find(camera => camera.name == cameraSelect.value);
        if (!cameraName)
            return;
        const w = cameraName.w;
        const h = cameraName.h;
        const cameraTilt = +cameraTiltSlider.value * Math.PI / 180;
        const sinCameraTilt = Math.sin(cameraTilt);
        const cosCameraTilt = Math.cos(cameraTilt);
        const w1 = w * cosCameraTilt + h * sinCameraTilt;
        const w2 = w * cosCameraTilt - h * sinCameraTilt;
        const h1 = -w * sinCameraTilt + h * cosCameraTilt;
        const h2 = -w * sinCameraTilt - h * cosCameraTilt;
        const raWidth = this.config.viewState.fieldOfViewRA;
        const decWidth = this.config.viewState.fieldOfViewDec;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        this.ctx.strokeStyle = 'orange';
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX * (1 - w1 / raWidth), centerY * (1 - h1 / decWidth));
        this.ctx.lineTo(centerX * (1 + w2 / raWidth), centerY * (1 + h2 / decWidth));
        this.ctx.lineTo(centerX * (1 + w1 / raWidth), centerY * (1 + h1 / decWidth));
        this.ctx.lineTo(centerX * (1 - w2 / raWidth), centerY * (1 - h2 / decWidth));
        this.ctx.lineTo(centerX * (1 - w1 / raWidth), centerY * (1 - h1 / decWidth));
        this.ctx.fill();
        this.ctx.stroke();
    }
    starSize_0mag(config) {
        return Math.max(13 - 2.4 * Math.log(Math.min(config.viewState.fieldOfViewRA, config.viewState.fieldOfViewDec) + 3), 5);
    }
    getStarSize(magnitude, limitingMagnitude, starSize_0mag) {
        if (limitingMagnitude === undefined) {
            limitingMagnitude = AstronomicalCalculator.limitingMagnitude(this.config);
        }
        if (starSize_0mag === undefined) {
            starSize_0mag = this.starSize_0mag(this.config);
        }
        if (magnitude > limitingMagnitude)
            return 1;
        else
            return 1.0 + starSize_0mag * limitingMagnitude / (limitingMagnitude + 1) * Math.pow((limitingMagnitude - magnitude) / limitingMagnitude, 1.3);
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
                g = 1.0 - 0.6 * (bv - 0.4) / 1.6;
            if (bv < 0.4)
                b = 1.0;
            else
                b = 1.0 - 0.8 * (bv - 0.4) / 1.6;
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
    floodFillAreaCandidates(edgeRA, edgeDec, np, sp) {
        const candidates = [];
        const RA_min = Math.min(...edgeRA);
        const RA_max = Math.max(...edgeRA);
        const Dec_min = sp ? -90 : Math.min(...edgeDec);
        const Dec_max = np ? 89.9 : Math.max(...edgeDec);
        let ra0Dec = []; // 赤経0度線を横切るときの赤緯
        // 境界線をセグメントに分割
        const segments = [];
        for (let i = 0; i < edgeRA.length - 1; i++) {
            segments.push({
                ra1: edgeRA[i], dec1: edgeDec[i],
                ra2: edgeRA[i + 1], dec2: edgeDec[i + 1]
            });
            if (edgeRA[i] > 300 && edgeRA[i + 1] < 60) {
                ra0Dec.push(edgeDec[i] + (edgeDec[i + 1] - edgeDec[i]) / (edgeRA[i + 1] - edgeRA[i] + 360) * (360 - edgeRA[i]));
            }
            else if (edgeRA[i] < 60 && edgeRA[i + 1] > 300) {
                ra0Dec.push(edgeDec[i] + (edgeDec[i + 1] - edgeDec[i]) / (edgeRA[i] - edgeRA[i + 1] + 360) * edgeRA[i]);
            }
        }
        segments.push({
            ra1: edgeRA[edgeRA.length - 1], dec1: edgeDec[edgeDec.length - 1],
            ra2: edgeRA[0], dec2: edgeDec[0]
        });
        if (edgeRA[edgeRA.length - 1] > 300 && edgeRA[0] < 60) {
            ra0Dec.push(edgeDec[edgeRA.length - 1] + (edgeDec[0] - edgeDec[edgeRA.length - 1]) / (edgeRA[0] - edgeRA[edgeRA.length - 1] + 360) * (360 - edgeRA[edgeRA.length - 1]));
        }
        else if (edgeRA[edgeRA.length - 1] < 60 && edgeRA[0] > 300) {
            ra0Dec.push(edgeDec[edgeRA.length - 1] + (edgeDec[0] - edgeDec[edgeRA.length - 1]) / (edgeRA[edgeRA.length - 1] - edgeRA[0] + 360) * edgeRA[edgeRA.length - 1]);
        }
        if (np) {
            if (ra0Dec.length !== 1) {
                // console.log("np but ra0Dec.length !== 1", ra0Dec);
            }
            else {
                // console.log("np ra0Dec.length === 1", ra0Dec);
                segments.push({
                    ra1: 0, dec1: ra0Dec[0],
                    ra2: 0, dec2: 89.9
                });
                segments.push({
                    ra1: 359.99, dec1: ra0Dec[0],
                    ra2: 359.99, dec2: 89.9
                });
            }
        }
        else if (sp) {
            if (ra0Dec.length !== 1) {
                // console.log("sp but ra0Dec.length !== 1", ra0Dec);
            }
            else {
                segments.push({
                    ra1: 0, dec1: -90,
                    ra2: 0, dec2: ra0Dec[0]
                });
                segments.push({
                    ra1: 359.99, dec1: ra0Dec[0],
                    ra2: 359.99, dec2: -90
                });
            }
        }
        else if (ra0Dec.length === 2) {
            // console.log("ra0Dec.length === 2", ra0Dec);
            segments.push({
                ra1: 0, dec1: ra0Dec[0],
                ra2: 0, dec2: ra0Dec[1]
            });
            segments.push({
                ra1: 359.99, dec1: ra0Dec[0],
                ra2: 359.99, dec2: ra0Dec[1]
            });
        }
        else {
            // ra0Dec.length !== 0 && ra0Dec.length !== 2
            // console.log("ra0Dec.length === 0", ra0Dec);
        }
        // 赤緯の範囲を1度ずつ処理
        for (let dec = Math.floor(Dec_min); dec <= Math.floor(Dec_max); dec++) {
            const intersections = [];
            // 赤緯線と境界線の交点を計算
            for (const segment of segments) {
                if ((segment.dec1 - dec) * (segment.dec2 - dec) <= 0) {
                    // 線形補間で交点の赤経を計算
                    const t = (dec - segment.dec1) / (segment.dec2 - segment.dec1);
                    let intersectionRA = segment.ra1 + t * (segment.ra2 - segment.ra1);
                    if (segment.ra1 > 300 && segment.ra2 < 60) {
                        intersectionRA = (segment.ra1 + t * (segment.ra2 - segment.ra1 + 360) + 360) % 360;
                    }
                    else if (segment.ra1 < 60 && segment.ra2 > 300) {
                        intersectionRA = (segment.ra1 + t * (segment.ra2 - segment.ra1 - 360) + 360) % 360;
                    }
                    intersections.push(intersectionRA);
                }
            }
            // 交点をソート
            intersections.sort((a, b) => a - b);
            // 交点のペアで領域を決定
            const raRanges = [];
            if (intersections.length === 0) {
                // この場合はないはず
                // 交点がない場合は範囲全体を含める
                if (RA_max > 300 && RA_min < 60) {
                    raRanges.push([0, Math.min(RA_min, 359.9)]);
                    raRanges.push([Math.max(RA_max, 0), 359.9]);
                }
                else {
                    raRanges.push([Math.max(RA_min, 0), Math.min(RA_max, 359.9)]);
                }
            }
            else {
                for (let i = 0; i < intersections.length - 1; i += 2) {
                    const startRA = Math.max(intersections[i], 0);
                    const endRA = Math.min(intersections[i + 1], 359.9);
                    if (startRA < endRA) {
                        raRanges.push([startRA, endRA]);
                    }
                }
            }
            // 各範囲をマス番号に変換
            for (const [startRA, endRA] of raRanges) {
                const startArea = this.areaNumber(startRA, dec);
                const endArea = this.areaNumber(endRA, dec);
                candidates.push([startArea, endArea]);
            }
        }
        return candidates;
    }
    areaCandidates() {
        const edgeRA = [];
        const edgeDec = [];
        const raWidth = this.config.viewState.fieldOfViewRA * 0.5 + 1.0;
        const decWidth = this.config.viewState.fieldOfViewDec * 0.5 + 1.0;
        const siderealTime = window.config.siderealTime;
        const jd = window.config.jd;
        const currentNorthPoleJ2000 = this.coordinateConverter.precessionEquatorial({ ra: 0, dec: 90 }, undefined, jd, 'j2000');
        const currentSouthPoleJ2000 = this.coordinateConverter.precessionEquatorial({ ra: 0, dec: -90 }, undefined, jd, 'j2000');
        if (this.config.displaySettings.mode == 'AEP') {
            const centerRA = this.config.viewState.centerRA;
            const centerDec = this.config.viewState.centerDec;
            const northPoleScreenRaDec = this.coordinateConverter.equatorialToScreenRaDec(currentNorthPoleJ2000, { ra: centerRA, dec: centerDec });
            const southPoleScreenRaDec = this.coordinateConverter.equatorialToScreenRaDec(currentSouthPoleJ2000, { ra: centerRA, dec: centerDec });
            const npIsIn = Math.abs(northPoleScreenRaDec.ra) < raWidth && Math.abs(northPoleScreenRaDec.dec) < decWidth;
            const spIsIn = Math.abs(southPoleScreenRaDec.ra) < raWidth && Math.abs(southPoleScreenRaDec.dec) < decWidth;
            let screenRa = -raWidth;
            let screenDec = decWidth;
            let dscreenRa = 0.0;
            let dscreenDec = 0.0;
            // 右上から左上
            while (screenRa < raWidth) {
                this.addEdgeAEP(screenRa, decWidth, edgeRA, edgeDec, jd);
                dscreenRa = 0.3 * Math.cos(this.coordinateConverter.screenRaDecToEquatorial_AEP({ ra: screenRa, dec: screenDec }).dec * Math.PI / 180);
                screenRa += dscreenRa;
            }
            // 左上から左下
            screenRa = raWidth;
            screenDec = decWidth;
            while (screenDec > -decWidth) {
                this.addEdgeAEP(raWidth, screenDec, edgeRA, edgeDec, jd);
                dscreenDec = 0.3 * Math.cos(this.coordinateConverter.screenRaDecToEquatorial_AEP({ ra: screenRa, dec: screenDec }).dec * Math.PI / 180);
                screenDec -= dscreenDec;
            }
            // 左下から右下
            screenRa = raWidth;
            screenDec = -decWidth;
            while (screenRa > -raWidth) {
                this.addEdgeAEP(screenRa, -decWidth, edgeRA, edgeDec, jd);
                dscreenRa = 0.3 * Math.cos(this.coordinateConverter.screenRaDecToEquatorial_AEP({ ra: screenRa, dec: screenDec }).dec * Math.PI / 180);
                screenRa -= dscreenRa;
            }
            // 右下から右上
            screenRa = -raWidth;
            screenDec = -decWidth;
            while (screenDec < decWidth) {
                this.addEdgeAEP(screenRa, screenDec, edgeRA, edgeDec, jd);
                dscreenDec = 0.3 * Math.cos(this.coordinateConverter.screenRaDecToEquatorial_AEP({ ra: screenRa, dec: screenDec }).dec * Math.PI / 180);
                screenDec += dscreenDec;
            }
            const areaCandidates = this.floodFillAreaCandidates(edgeRA, edgeDec, npIsIn, spIsIn);
            return areaCandidates;
        }
        else if (this.config.displaySettings.mode == 'view') {
            const centerAz = this.config.viewState.centerAz;
            const centerAlt = this.config.viewState.centerAlt;
            const northPoleHorizontal = this.coordinateConverter.equatorialToHorizontal(currentNorthPoleJ2000, siderealTime);
            const southPoleHorizontal = this.coordinateConverter.equatorialToHorizontal(currentSouthPoleJ2000, siderealTime);
            const northPoleScreenRaDec = this.coordinateConverter.horizontalToScreenRaDec(northPoleHorizontal, { az: centerAz, alt: centerAlt });
            const southPoleScreenRaDec = this.coordinateConverter.horizontalToScreenRaDec(southPoleHorizontal, { az: centerAz, alt: centerAlt });
            const npIsIn = Math.abs(northPoleScreenRaDec.ra) < raWidth && Math.abs(northPoleScreenRaDec.dec) < decWidth;
            const spIsIn = Math.abs(southPoleScreenRaDec.ra) < raWidth && Math.abs(southPoleScreenRaDec.dec) < decWidth;
            let screenRa = -raWidth;
            let screenDec = decWidth;
            let dscreenRa = 0.0;
            let dscreenDec = 0.0;
            // 右上から左上
            while (screenRa < raWidth) {
                this.addEdgeView(screenRa, decWidth, edgeRA, edgeDec, siderealTime, jd);
                dscreenRa = 0.3 * Math.cos(this.coordinateConverter.screenRaDecToEquatorial_View({ ra: screenRa, dec: screenDec }, siderealTime).dec * Math.PI / 180);
                screenRa += dscreenRa;
            }
            // 左上から左下
            screenRa = raWidth;
            screenDec = decWidth;
            while (screenDec > -decWidth) {
                this.addEdgeView(raWidth, screenDec, edgeRA, edgeDec, siderealTime, jd);
                dscreenDec = 0.3 * Math.cos(this.coordinateConverter.screenRaDecToEquatorial_View({ ra: screenRa, dec: screenDec }, siderealTime).dec * Math.PI / 180);
                screenDec -= dscreenDec;
            }
            // 左下から右下
            screenRa = raWidth;
            screenDec = -decWidth;
            while (screenRa > -raWidth) {
                this.addEdgeView(screenRa, -decWidth, edgeRA, edgeDec, siderealTime, jd);
                dscreenRa = 0.3 * Math.cos(this.coordinateConverter.screenRaDecToEquatorial_View({ ra: screenRa, dec: screenDec }, siderealTime).dec * Math.PI / 180);
                screenRa -= dscreenRa;
            }
            // 右下から右上
            screenRa = -raWidth;
            screenDec = -decWidth;
            while (screenDec < decWidth) {
                this.addEdgeView(screenRa, screenDec, edgeRA, edgeDec, siderealTime, jd);
                dscreenDec = 0.3 * Math.cos(this.coordinateConverter.screenRaDecToEquatorial_View({ ra: screenRa, dec: screenDec }, siderealTime).dec * Math.PI / 180);
                screenDec += dscreenDec;
            }
            const areaCandidates = this.floodFillAreaCandidates(edgeRA, edgeDec, npIsIn, spIsIn);
            return areaCandidates;
        }
        return [];
    }
    addEdgeAEP(screenRA, screenDec, edgeRA, edgeDec, jd) {
        const equatorialApparent = this.coordinateConverter.screenRaDecToEquatorial_AEP({ ra: screenRA, dec: screenDec });
        const equatorial = this.coordinateConverter.precessionEquatorial(equatorialApparent, undefined, jd, 'j2000');
        edgeRA.push(equatorial.ra);
        edgeDec.push(equatorial.dec);
    }
    addEdgeView(screenRA, screenDec, edgeRA, edgeDec, siderealTime, jd) {
        const equatorialApparent = this.coordinateConverter.screenRaDecToEquatorial_View({ ra: screenRA, dec: screenDec }, siderealTime);
        const equatorial = this.coordinateConverter.precessionEquatorial(equatorialApparent, undefined, jd, 'j2000');
        edgeRA.push(equatorial.ra);
        edgeDec.push(equatorial.dec);
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