import { SolarSystemDataManager } from '../models/SolarSystemObjects.js';
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
        const coords = object.getCoordinates();
        const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.canvas, window.config.siderealTime);
        if (!screenXY[0])
            return;
        const [x, y] = screenXY[1];
        const magnitude = object.getMagnitude();
        const type = object.getType();
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = 'darkorange';
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = 'darkorange';
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
            this.ctx.ellipse(x, y, 6, 2, 0, 0, Math.PI * 2);
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
            const c = 4;
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
        const siderealTime = window.config.siderealTime;
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
                this.drawPlanet(object);
            }
            else if (object.getType() === 'asteroid') {
                // this.drawMinorObject(object as MinorObject);
            }
        }
    }
    drawSun(sun) {
        if (!this.config.displaySettings.showPlanets)
            return;
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
    drawPlanet(planet) {
        if (!this.config.displaySettings.showPlanets)
            return;
        const siderealTime = window.config.siderealTime;
        this.ctx.font = '16px serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = 'white';
        const coords = planet.getRaDec();
        const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.canvas, siderealTime);
        if (!screenXY[0])
            return;
        const [x, y] = screenXY[1];
        const radius = Math.max(this.getStarSize(planet.getMagnitude(), this.limitingMagnitude(this.config), this.starSize_0mag(this.config)), 1);
        this.ctx.beginPath();
        this.ctx.fillStyle = 'red';
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = 'yellow';
        this.ctx.fillText(planet.getJapaneseName(), x + Math.max(0.8 * radius, 10), y - Math.max(0.8 * radius, 10));
    }
    drawMoon(moon, sun) {
        if (this.config.observationSite.observerPlanet !== '地球')
            return;
        const { ra: sunRa, dec: sunDec } = sun.getRaDec();
        const { ra: moonRa, dec: moonDec } = moon.getRaDec();
        const moonDist = moon.getDistance();
        const radius = Math.max(this.canvas.width * (0.259 / (moonDist / 384400)) / this.config.viewState.fieldOfViewRA, 13);
        const lon_sun = moon.Ms + 0.017 * Math.sin(moon.Ms + 0.017 * Math.sin(moon.Ms)) + moon.ws;
        const k = (1 - Math.cos(lon_sun - moon.lon_moon) * Math.cos(moon.lat_moon)) * 0.5;
        let p, RA1, Dec1, A1, h1, scrRA1, scrDec1, x1, y1;
        const screenXY = this.coordinateConverter.equatorialToScreenXYifin({ ra: moonRa, dec: moonDec }, this.canvas, window.config.siderealTime);
        if (!screenXY[0])
            return;
        const [x, y] = screenXY[1];
        if (this.config.displaySettings.mode == 'AEP') {
            p = Math.atan2(Math.cos(sunDec) * Math.sin(moonRa - sunRa), -Math.sin(moonDec) * Math.cos(sunDec) * Math.cos(moonRa - sunRa) + Math.cos(moonDec) * Math.sin(sunDec));
            RA1 = (moonRa - 0.2 * Math.cos(p) / Math.cos(moonDec)) * Math.PI / 180;
            Dec1 = (moonDec - 0.2 * Math.sin(p)) * Math.PI / 180;
            const screenXY1 = this.coordinateConverter.equatorialToScreenXYifin({ ra: RA1, dec: Dec1 }, this.canvas, window.config.siderealTime, true);
            const [x1, y1] = screenXY1[1];
            p = Math.atan2(y1 - y, x1 - x);
        }
        else if (this.config.displaySettings.mode == 'EtP') {
            p = Math.atan2(Math.cos(sunDec) * Math.sin(moonRa - sunRa), -Math.sin(moonDec) * Math.cos(sunDec) * Math.cos(moonRa - sunRa) + Math.cos(moonDec) * Math.sin(sunDec));
        }
        else if (this.config.displaySettings.mode == 'view') {
            p = Math.atan2(Math.cos(sunDec) * Math.sin(moonRa - sunRa), -Math.sin(moonDec) * Math.cos(sunDec) * Math.cos(moonRa - sunRa) + Math.cos(moonDec) * Math.sin(sunDec));
            RA1 = (moonRa - 0.2 * Math.cos(p) / Math.cos(moonDec)) * 180 / Math.PI;
            Dec1 = (moonDec - 0.2 * Math.sin(p)) * 180 / Math.PI;
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
    drawHipStars(hipStars) {
        if (!this.config.displaySettings.showStars)
            return;
        const limitingMagnitude = this.limitingMagnitude(this.config);
        const siderealTime = window.config.siderealTime;
        const zeroMagSize = this.starSize_0mag(this.config);
        for (const star of hipStars) {
            const coords = star.getCoordinates();
            if (star.getMagnitude() > limitingMagnitude)
                continue;
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
    drawGaiaStars(gaiaData, gaiaHelpData, brightestMagnitude) {
        if (!this.config.displaySettings.showStars)
            return;
        const limitingMagnitude = this.limitingMagnitude(this.config);
        if (brightestMagnitude > limitingMagnitude)
            return;
        const siderealTime = window.config.siderealTime;
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
                // [ra, dec] = J2000toApparent(ra, dec, JD);
                const coords = { ra: data[0] * 0.001, dec: data[1] * 0.001 };
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
        this.ctx.beginPath();
        for (const constellation of constellations) {
            for (const line of constellation.lines) {
                const coords1 = { ra: line[0], dec: line[1] };
                const coords2 = { ra: line[2], dec: line[3] };
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
        for (const constellation of constellations) {
            const coords = { ra: constellation.ra, dec: constellation.dec };
            const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.canvas, siderealTime);
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
        return Math.max(13 - 2.4 * Math.log(Math.min(config.viewState.fieldOfViewRA, config.viewState.fieldOfViewDec) + 3), 5);
    }
    getStarSize(magnitude, limitingMagnitude, starSize_0mag) {
        if (limitingMagnitude === undefined) {
            limitingMagnitude = this.limitingMagnitude(this.config);
        }
        if (starSize_0mag === undefined) {
            starSize_0mag = this.starSize_0mag(this.config);
        }
        return Math.max(1.0, 1.0 + starSize_0mag * limitingMagnitude / (limitingMagnitude + 1) * Math.pow((limitingMagnitude - magnitude) / limitingMagnitude, 1.3));
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