import { SolarSystemDataManager } from '../models/SolarSystemObjects.js';
import { HipStar, MessierObject, NGCObject, SharplessObject } from '../models/CelestialObject.js';
import { CoordinateConverter } from '../utils/coordinates.js';
import { AstronomicalCalculator } from '../utils/calculations.js';
import { DeviceOrientationManager } from '../utils/deviceOrientation.js';
import { SolarSystemPositionCalculator } from '../utils/SolarSystemPositionCalculator.js';
// import { formatTextForCanvas, formatBayerDesignation } from '../utils/textFormatter.js';
import { getColorManager } from '../utils/colorManager.js';
// import { StarsProgram } from './webgl/programs/starsProgram.js';
import { starSize_0mag, getStarSize, getAreaCandidates, getGridIntervals, getBetaRange, getGridLineWidth, getAlphaRange } from '../utils/canvasHelpers.js';
export class CanvasRenderer {
    constructor(canvas, config) {
        this.imageCache = {};
        this.areaCandidatesCache = null;
        this.precessionCache = null;
        this.hipStarsCache = null;
        this.gaiaDataCache1 = null;
        this.gaiaDataCache2 = null;
        this.gaiaDataCache3 = null;
        this.objectInfomation = [];
        this.starInfoInfomation = [];
        this.orientationData = { alpha: 0, beta: 0, gamma: 0, webkitCompassHeading: 0 };
        this.gaiaSprites = new Map();
        // HIP星用のスプライトキャッシュ（サイズ別、ハロー付き）
        this.hipStarSprites = new Map();
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
        this.objectInfomation = [];
        console.log("CanvasRenderer constructor");
        this.coordinateConverter = new CoordinateConverter();
        this.deviceOrientationManager = new DeviceOrientationManager();
        this.deviceOrientationManager.setOrientationCallback((data) => {
            this.orientationData = {
                alpha: data.alpha,
                beta: data.beta,
                gamma: data.gamma,
                webkitCompassHeading: data.webkitCompassHeading
            };
        });
        // 色管理システムを初期化
        this.colorManager = getColorManager(this.config.displaySettings.darkMode);
        this.createGaiaSprites();
        this.createHipStarSprites();
    }
    // imageCacheを設定
    setImageCache(imageCache) {
        this.imageCache = imageCache;
    }
    // 描画をクリア
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    // 天体を描画
    drawObject(object, category, nameCorner) {
        if (!object.getName() || object.getName() == '')
            return;
        const coordsJ2000 = object.getCoordinates();
        const precessionAngle = this.coordinateConverter.precessionAngle('j2000', this.config.displayTime.jd);
        const coords = this.coordinateConverter.precessionEquatorial(coordsJ2000, precessionAngle);
        const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.config, false, this.orientationData);
        if (!screenXY[0])
            return;
        const [x, y] = screenXY[1];
        const type = object.getType();
        this.objectInfomation.push({
            name: object.getName(),
            type: category,
            x: x,
            y: y,
            data: object
        });
        let markFlag = true;
        if (object instanceof MessierObject && object.getOverlay() !== null && this.config.viewState.fieldOfViewRA < 2 && object.getOverlay().width < 2.0 * 30.0 / this.canvas.width) {
            markFlag = false;
        }
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = this.colorManager.getColor('dso');
        this.ctx.strokeStyle = this.colorManager.getColor('dso');
        this.ctx.lineWidth = 1;
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
        if (nameCorner == 'bottom-right') {
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(object.getName(), x, y);
        }
        else {
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'bottom';
            this.ctx.fillText(object.getName(), x, y);
        }
        if (type === 'Gx') { // Galaxy, 楕円
            this.ctx.ellipse(x, y, 6, 3, 0, 0, Math.PI * 2);
            this.ctx.stroke();
            // this.ctx.fillText(object.getName(), x+5, y-5);
        }
        else if (['OC', 'C+N', 'Ast'].includes(type || '')) { // Open Cluster, 上三角形
            this.ctx.moveTo(x, y - 6);
            this.ctx.lineTo(x + 4, y + 3);
            this.ctx.lineTo(x - 4, y + 3);
            this.ctx.lineTo(x, y - 6);
            this.ctx.stroke();
            // this.ctx.fillText(object.getName(), x+5, y-5);
        }
        else if (type == 'Gb') { // Globular Cluster, 円
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.stroke();
            // this.ctx.fillText(object.getName(), x+5, y-5);
        }
        else if (['Nb', 'Pl', 'Kt'].includes(type || '')) { // Nebula, 正方形
            if (markFlag) {
                this.ctx.moveTo(x, y - 6);
                this.ctx.lineTo(x + 6, y);
                this.ctx.lineTo(x, y + 6);
                this.ctx.lineTo(x - 6, y);
                this.ctx.lineTo(x, y - 6);
                this.ctx.stroke();
            }
            // this.ctx.fillText(object.getName(), x+5, y-5);
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
            // this.ctx.fillText(object.getName(), x+5, y-5);
        }
        else { // ×印
            this.ctx.moveTo(x - 4, y - 4);
            this.ctx.lineTo(x + 4, y + 4);
            this.ctx.moveTo(x + 4, y - 4);
            this.ctx.lineTo(x - 4, y + 4);
            this.ctx.stroke();
            // this.ctx.fillText(object.getName(), x+5, y-5);
        }
        if (object instanceof MessierObject &&
            ['AEP', 'view'].includes(this.config.displaySettings.mode) &&
            object.getName() in this.imageCache &&
            object.getOverlay() !== null &&
            window.config.viewState.fieldOfViewRA < 20) {
            const img = this.imageCache[object.getName()];
            // 画像が正常に読み込まれているかチェック
            if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                this.drawOverlay(object.getName(), coords, object.getOverlay(), x, y, this.config.displaySettings.mode);
            }
            else if (!img.complete) {
                // 画像がまだ読み込み中の場合
                img.onload = () => {
                    // 読み込み完了後も再度チェック
                    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                        this.drawOverlay(object.getName(), coords, object.getOverlay(), x, y, this.config.displaySettings.mode);
                    }
                };
                img.onerror = () => {
                    console.warn(`Failed to load image for ${object.getName()}`);
                };
            }
        }
    }
    drawOverlay(name, coords, overlay, x, y, mode) {
        this.ctx.save();
        const overlaySize = overlay.width * this.canvas.width / this.config.viewState.fieldOfViewRA;
        this.ctx.globalAlpha = overlay.opacity;
        if (mode == 'AEP') {
            this.ctx.drawImage(this.imageCache[name], x - overlaySize / 2, y - overlaySize / 2, overlaySize, overlaySize);
        }
        else if (mode == 'view') {
            this.ctx.translate(x, y);
            const oneDegNorthXY = this.coordinateConverter.equatorialToScreenXYifin({ ra: coords.ra, dec: Math.min(coords.dec + 1, 89.999999) }, this.config, true, this.orientationData);
            const rotation = Math.atan2(oneDegNorthXY[1][0] - x, -oneDegNorthXY[1][1] + y);
            this.ctx.rotate(rotation);
            this.ctx.drawImage(this.imageCache[name], -overlaySize / 2, -overlaySize / 2, overlaySize, overlaySize);
        }
        this.ctx.restore();
    }
    drawJsonObject(objects, category, nameCorner) {
        if (objects.length == 0)
            return;
        for (const object of objects) {
            this.drawObject(object, category, nameCorner);
        }
    }
    drawMessier(messierObjects) {
        if (!this.config.displaySettings.showMessiers)
            return;
        this.drawJsonObject(messierObjects, 'messier');
    }
    drawRec(recObjects) {
        if (!this.config.displaySettings.showRecs)
            return;
        this.drawJsonObject(recObjects, 'rec');
    }
    drawNGC(ngcObjects, icObjects) {
        if (!this.config.displaySettings.showNGC)
            return;
        this.drawJsonObject(ngcObjects, 'ngc', 'bottom-right');
        this.drawJsonObject(icObjects, 'ngc', 'bottom-left');
    }
    drawSharpless(sharplessObjects) {
        if (!this.config.displaySettings.showSharpless)
            return;
        this.drawJsonObject(sharplessObjects, 'sharpless');
    }
    drawTempTarget(tempTarget) {
        if (!tempTarget)
            return;
        const tempTargetObject = JSON.parse(tempTarget);
        if (tempTargetObject.name.startsWith('NGC')) {
            const tempNGC = NGCObject.fromJson(tempTargetObject);
            this.drawJsonObject([tempNGC], 'ngc', 'bottom-right');
        }
        else if (tempTargetObject.name.startsWith('IC')) {
            const tempIC = NGCObject.fromJson(tempTargetObject);
            this.drawJsonObject([tempIC], 'ngc', 'bottom-left');
        }
        else if (tempTargetObject.name.startsWith('Sh2')) {
            const tempSh2 = SharplessObject.fromJson(tempTargetObject);
            this.drawJsonObject([tempSh2], 'sh2');
        }
    }
    drawSolarSystemObjects() {
        if (!this.config.displaySettings.showPlanets)
            return;
        const objects = SolarSystemDataManager.getAllObjects();
        if (objects.length == 0)
            return;
        const limitingMagnitude = AstronomicalCalculator.limitingMagnitude(this.config);
        const zeroMagSize = starSize_0mag(this.config.viewState.fieldOfViewRA, this.config.viewState.fieldOfViewDec);
        this.ctx.fillStyle = 'white';
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
            else if (object.getType() === 'comet') {
                this.drawMinorObject(object, limitingMagnitude, zeroMagSize);
            }
        }
        this.drawPlanetMotion();
    }
    drawPlanetMotion() {
        if (this.config.planetMotion.planet.length == 0)
            return;
        const duration = this.config.planetMotion.duration;
        const interval = this.config.planetMotion.interval;
        const timeDisplayStep = this.config.planetMotion.timeDisplayStep;
        const timeDisplayContent = this.config.planetMotion.timeDisplayContent;
        const halfCount = Math.floor(duration / interval);
        const minJd = this.config.displayTime.jd - halfCount * interval;
        const maxJd = this.config.displayTime.jd + halfCount * interval;
        const objectsBaseData = SolarSystemDataManager.getAllObjects();
        for (const planet of this.config.planetMotion.planet) {
            if (planet == this.config.observationSite.observerPlanet)
                continue;
            const jds = [];
            const timeLabels = [];
            const ras = [];
            const decs = [];
            const xys = [];
            const distances = [];
            for (let jd = minJd; jd <= maxJd; jd += interval) {
                if (jd == this.config.displayTime.jd)
                    continue;
                const objectData = SolarSystemPositionCalculator.oneObjectData(objectsBaseData, planet, jd, this.config.observationSite);
                if (objectData) {
                    jds.push(jd);
                    const ymdhms = AstronomicalCalculator.calculateYmdhmsJstFromJdTT(jd);
                    timeLabels.push(formatTime(ymdhms, timeDisplayContent));
                    const coords = objectData.getRaDec();
                    ras.push(coords.ra);
                    decs.push(coords.dec);
                    const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.config, true, this.orientationData);
                    xys.push(screenXY[1]);
                    distances.push(objectData.getDistance());
                }
            }
            this.ctx.font = '14px serif';
            this.ctx.strokeStyle = this.colorManager.getColor('solarSystemMotion');
            this.ctx.fillStyle = this.colorManager.getColor('orange');
            this.ctx.textAlign = 'left';
            this.ctx.beginPath();
            for (let i = 0; i < jds.length; i++) {
                this.ctx.moveTo(xys[i][0] - 3, xys[i][1] - 3);
                this.ctx.lineTo(xys[i][0] + 3, xys[i][1] + 3);
                this.ctx.moveTo(xys[i][0] - 3, xys[i][1] + 3);
                this.ctx.lineTo(xys[i][0] + 3, xys[i][1] - 3);
            }
            this.ctx.stroke();
            for (let i = timeDisplayStep; i < halfCount; i += timeDisplayStep) {
                let idx = halfCount - i - 1;
                if ((xys[idx + 1][1] - xys[idx][1]) * (xys[idx + 1][0] - xys[idx][0]) < 0) { // 軌跡が左上-右下
                    this.ctx.textBaseline = 'top';
                }
                else { // 軌跡が左下-右上
                    this.ctx.textBaseline = 'bottom';
                }
                this.ctx.fillText(timeLabels[idx], xys[idx][0], xys[idx][1]);
                idx = halfCount + i;
                if (idx + 1 < jds.length) {
                    if ((xys[idx + 1][1] - xys[idx][1]) * (xys[idx + 1][0] - xys[idx][0]) < 0) { // 軌跡が左上-右下
                        this.ctx.textBaseline = 'top';
                    }
                    else { // 軌跡が左下-右上
                        this.ctx.textBaseline = 'bottom';
                    }
                }
                this.ctx.fillText(timeLabels[idx], xys[idx][0], xys[idx][1]);
            }
        }
        function formatTime(ymdhms, format) {
            const y = ymdhms.year;
            const m = ymdhms.month;
            const d = ymdhms.day;
            const h = ymdhms.hour;
            const mi = ymdhms.minute;
            const s = ymdhms.second;
            if (format == 'ym') {
                return `${y}/${m}/${d}`;
            }
            else if (format == 'md') {
                return `${m}/${d}`;
            }
            else if (format == 'mdh') {
                return `${m}/${d} ${h}時`;
            }
            else if (format == 'hm') {
                return `${h}:${mi}`;
            }
            return `${y}/${m}/${d} ${h}:${mi}:${s}`;
        }
    }
    drawSun(sun) {
        const siderealTime = this.config.siderealTime;
        const coords = sun.getRaDec();
        const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.config, false, this.orientationData);
        if (!screenXY[0])
            return;
        const [x, y] = screenXY[1];
        this.objectInfomation.push({
            name: sun.getJapaneseName(),
            type: 'sun',
            x: x,
            y: y,
            data: sun
        });
        const radius = Math.max(this.canvas.width * (0.267 / sun.getDistance()) / this.config.viewState.fieldOfViewRA, 13);
        this.ctx.font = '15px serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillStyle = this.colorManager.getColor('yellow');
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillText(sun.getJapaneseName(), x + Math.max(0.8 * radius, 10), y - Math.max(0.8 * radius, 10));
    }
    drawPlanet(planet, limitingMagnitude, zeroMagSize) {
        this.ctx.font = '15px serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'bottom';
        const coords = planet.getRaDec();
        const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.config, false, this.orientationData);
        if (!screenXY[0])
            return;
        const [x, y] = screenXY[1];
        this.objectInfomation.push({
            name: planet.getJapaneseName(),
            type: 'planet',
            x: x,
            y: y,
            data: planet
        });
        const radius = Math.max(getStarSize(planet.getMagnitude(), limitingMagnitude, zeroMagSize), 1);
        this.ctx.beginPath();
        this.ctx.fillStyle = this.colorManager.getColor('solarSystem');
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        const dxy = Math.max(2, 0.8 * radius);
        this.ctx.fillText(planet.getJapaneseName(), x + dxy, y - dxy);
    }
    drawMoon(moon, sun) {
        if (this.config.observationSite.observerPlanet !== '地球')
            return;
        // console.log(this.config.viewState.fieldOfViewRA == (window as any).config.viewState.fieldOfViewRA);
        const { ra: sunRaDeg, dec: sunDecDeg } = sun.getRaDec();
        const { ra: moonRaDeg, dec: moonDecDeg } = moon.getRaDec();
        const sunRaRad = sunRaDeg * Math.PI / 180;
        const sunDecRad = sunDecDeg * Math.PI / 180;
        const moonRaRad = moonRaDeg * Math.PI / 180;
        const moonDecRad = moonDecDeg * Math.PI / 180;
        const moonDist = moon.getDistance();
        const angRadius = 0.259 / (moonDist / 384400);
        const pxRadius0 = this.canvas.width * angRadius / this.config.viewState.fieldOfViewRA;
        const radius = Math.max(pxRadius0, 13);
        const scale = radius / pxRadius0; // 実際の視半径より何倍に見せているか
        const lon_sun = moon.Ms + 0.017 * Math.sin(moon.Ms + 0.017 * Math.sin(moon.Ms)) + moon.ws;
        const k = (1 - Math.cos(lon_sun - moon.lon_moon) * Math.cos(moon.lat_moon)) * 0.5;
        let p, RA1, Dec1;
        const screenXY = this.coordinateConverter.equatorialToScreenXYifin({ ra: moonRaDeg, dec: moonDecDeg }, this.config, false, this.orientationData);
        if (!screenXY[0])
            return;
        const [x, y] = screenXY[1];
        this.objectInfomation.push({
            name: moon.getJapaneseName(),
            type: 'moon',
            x: x,
            y: y,
            data: moon
        });
        if (this.config.displaySettings.mode == 'EtP') {
            p = Math.atan2(Math.cos(sunDecRad) * Math.sin(moonRaRad - sunRaRad), -Math.sin(moonDecRad) * Math.cos(sunDecRad) * Math.cos(moonRaRad - sunRaRad) + Math.cos(moonDecRad) * Math.sin(sunDecRad));
        }
        else if (['AEP', 'view', 'live'].includes(this.config.displaySettings.mode)) {
            p = Math.atan2(Math.cos(sunDecRad) * Math.sin(moonRaRad - sunRaRad), -Math.sin(moonDecRad) * Math.cos(sunDecRad) * Math.cos(moonRaRad - sunRaRad) + Math.cos(moonDecRad) * Math.sin(sunDecRad));
            // console.log(p * 180/Math.PI);
            RA1 = (moonRaDeg - 0.2 * Math.cos(p) / Math.cos(moonDecRad));
            Dec1 = (moonDecDeg - 0.2 * Math.sin(p));
            const screenXY1 = this.coordinateConverter.equatorialToScreenXYifin({ ra: RA1, dec: Dec1 }, this.config, true, this.orientationData);
            const [x1, y1] = screenXY1[1];
            p = Math.atan2(y1 - y, x1 - x);
        }
        else {
            return;
        }
        this.ctx.font = '15px serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        if (k < 0.5) {
            this.ctx.fillStyle = this.colorManager.getColor('yellow');
            this.ctx.arc(x, y, radius, p - Math.PI, p);
            this.ctx.fill();
            this.ctx.fillStyle = this.colorManager.getColor('moonShade');
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, p, p + Math.PI);
            this.ctx.ellipse(x, y, radius, radius * (1 - 2 * k), p - Math.PI, 0, Math.PI);
            this.ctx.fill();
        }
        else {
            this.ctx.fillStyle = this.colorManager.getColor('moonShade');
            this.ctx.arc(x, y, radius, p, p + Math.PI);
            this.ctx.fill();
            this.ctx.fillStyle = this.colorManager.getColor('yellow');
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, p - Math.PI, p);
            this.ctx.ellipse(x, y, radius, radius * (2 * k - 1), p, 0, Math.PI);
            this.ctx.fill();
        }
        // 簡易月食表現（本影・半影の重なりを描画）
        // 利用可能な月の黄経・黄緯（moon.lon_moon, moon.lat_moon）と太陽の黄経（lon_sun）を使う
        try {
            const penumbraRadiusDeg = 1.25 * 384400 / moonDist; // 半影半径（度）
            const umbraRadiusDeg = 0.75 * 384400 / moonDist; // 
            const penumbraPx = (penumbraRadiusDeg / angRadius) * radius;
            const umbraPx = (umbraRadiusDeg / angRadius) * radius;
            // 影の向き（画面上で太陽反対方向）
            const shadowCenterFromEarthCenter = this.coordinateConverter.equatorialToCartesian({ ra: (sunRaDeg + 180) % 360, dec: -sunDecDeg }, moonDist);
            const obsLat = this.config.observationSite.latitude * Math.PI / 180;
            const siderealTime = this.config.siderealTime;
            const shadowCenterXYZFromObserver = {
                x: shadowCenterFromEarthCenter.x - Math.cos(obsLat) * Math.cos(siderealTime) * 6378.14,
                y: shadowCenterFromEarthCenter.y - Math.cos(obsLat) * Math.sin(siderealTime) * 6378.14,
                z: shadowCenterFromEarthCenter.z - Math.sin(obsLat) * 6378.14
            };
            const shadowCenterRaDecFromObserver = this.coordinateConverter.cartesianToEquatorial(shadowCenterXYZFromObserver);
            const shadowCenterXY = this.coordinateConverter.equatorialToScreenXYifin(shadowCenterRaDecFromObserver, this.config, true, this.orientationData);
            const [sx0, sy0] = shadowCenterXY[1];
            const sx = x + (sx0 - x) * scale;
            const sy = y + (sy0 - y) * scale;
            const angDistanceDeg = this.coordinateConverter.angularDistanceEquatorial(shadowCenterRaDecFromObserver, { ra: moonRaDeg, dec: moonDecDeg });
            const drawEarthShadow = (red, green, blue, alpha, shadowRadius) => {
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.arc(x, y, radius, 0, Math.PI * 2);
                this.ctx.clip();
                this.ctx.beginPath();
                this.ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha.toFixed(3)})`;
                this.ctx.arc(sx, sy, shadowRadius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            };
            // 半影（淡い影）
            if (angDistanceDeg < penumbraRadiusDeg + angRadius) {
                const penAlpha = Math.min(0.5, Math.max(0.20, (penumbraRadiusDeg - angDistanceDeg) / penumbraRadiusDeg * 0.5));
                drawEarthShadow(0, 0, 0, penAlpha, penumbraPx);
                // 本影（濃い影、赤銅色）
                if (angDistanceDeg < umbraRadiusDeg + angRadius) {
                    const umbAlpha = Math.min(0.9, Math.max(0.7, (umbraRadiusDeg - angDistanceDeg) / umbraRadiusDeg * 0.9));
                    drawEarthShadow(120, 20, 20, umbAlpha, umbraPx);
                }
            }
        }
        catch (e) {
            // 影データが取得できない等の場合は何もしない
        }
        this.ctx.fillStyle = 'yellow';
        this.ctx.fillText(moon.getJapaneseName(), x + Math.max(0.8 * radius, 10), y - Math.max(0.8 * radius, 10));
    }
    drawMinorObject(minorObject, limitingMagnitude, zeroMagSize) {
        this.ctx.font = '12px serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'bottom';
        const coords = minorObject.getRaDec();
        const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.config, false, this.orientationData);
        if (!screenXY[0])
            return;
        const [x, y] = screenXY[1];
        this.objectInfomation.push({
            name: minorObject.getJapaneseName(),
            type: 'asteroidComet',
            x: x,
            y: y,
            data: minorObject
        });
        const magnitude = Math.min(minorObject.getMagnitude() ?? 11.5, limitingMagnitude) - 1;
        const radius = Math.max(getStarSize(magnitude, limitingMagnitude, zeroMagSize), 1);
        this.ctx.beginPath();
        this.ctx.fillStyle = this.colorManager.getColor('solarSystem');
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillText(minorObject.getJapaneseName(), x + 2, y - 2);
    }
    async drawHipStars(hipStars) {
        if (hipStars.length == 0)
            return;
        if (this.config.displaySettings.usedStar == 'noStar')
            return;
        const limitingMagnitude = AstronomicalCalculator.limitingMagnitude(this.config);
        const currentJd = this.config.displayTime.jd;
        // 歳差運動補正をキャッシュ
        let precessionAngle;
        if (this.precessionCache && Math.abs(this.precessionCache.jd - currentJd) < 10.0) {
            precessionAngle = this.precessionCache.angle;
        }
        else {
            precessionAngle = this.coordinateConverter.precessionAngle('j2000', currentJd);
            this.precessionCache = { angle: precessionAngle, jd: currentJd };
        }
        // キャッシュされたHIP星データを使用
        const cachedStars = this.getCachedHipStars(hipStars, currentJd);
        if (cachedStars.length == 0)
            return;
        const zeroMagSize = starSize_0mag(this.config.viewState.fieldOfViewRA, this.config.viewState.fieldOfViewDec);
        const starColorRGB = this.colorManager.parseRgbToList(this.colorManager.getColor('star'));
        const lstLat = { lst: this.config.siderealTime, lat: this.config.observationSite.latitude };
        const limitMagnitudeForWhiten = Math.max(limitingMagnitude, 7.0);
        const blurRadii = [0.2, 0.6, 0.9, 1.2];
        const colorRatios = [0.4, 0.8, 1.0, 1.0];
        const opacities = ['ff', 'ff', 'bf', '40'];
        if (this.config.displaySettings.showStarInfo) {
            for (const star of cachedStars) {
                if (star.getMagnitude() > limitingMagnitude)
                    continue;
                const coords = star.getCoordinates();
                const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.config, false, this.orientationData);
                if (!screenXY[0])
                    continue;
                this.starInfoInfomation.push({
                    type: 'hipStar',
                    x: screenXY[1][0],
                    y: screenXY[1][1],
                    data: star
                });
                this.drawHipStar(star, screenXY[1], limitingMagnitude, zeroMagSize, limitMagnitudeForWhiten, blurRadii, colorRatios, opacities, starColorRGB);
            }
        }
        else {
            for (const star of cachedStars) {
                if (star.getMagnitude() > limitingMagnitude)
                    continue;
                const coords = star.getCoordinates();
                const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.config, false, this.orientationData);
                if (!screenXY[0])
                    continue;
                this.drawHipStar(star, screenXY[1], limitingMagnitude, zeroMagSize, limitMagnitudeForWhiten, blurRadii, colorRatios, opacities, starColorRGB);
            }
        }
    }
    drawHipStar(star, [x, y], limitingMagnitude, zeroMagSize, limitMagnitudeForWhiten, blurRadii, colorRatios, opacities, starColorRGB) {
        const starSize = getStarSize(star.getMagnitude(), limitingMagnitude, zeroMagSize) + 0.4;
        const starColor = this.getStarColor(star.getBv());
        // === スプライト描画（高速化版、将来的に有効化する場合はコメント解除） ===
        if (starSize > 3) {
            let bv = star.getBv();
            let bv10Str = "null";
            if (bv != null) {
                bv10Str = Math.round(Math.max(-0.4, Math.min(2.0, bv)) * 10).toString();
            }
            const sprite = this.getHipStarSprite(starSize, bv10Str);
            if (sprite) {
                this.ctx.drawImage(sprite, x - sprite.width / 2, y - sprite.height / 2);
                return;
            }
            else {
                console.log(starSize.toFixed(1), bv10Str);
                const off = this.createHipStarSprite(starSize, star.getBv(), this.colorManager.getColor('star'), 2.5);
                this.ctx.drawImage(off, x - off.width / 2, y - off.height / 2);
                return;
            }
        }
        // === スプライト描画ここまで ===
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
        }
        else if (star.getMagnitude() < 2 || starSize > 5) {
            // 半透明の円を重ねる
            for (let i = blurRadii.length - 1; i >= 0; i--) {
                const color = this.colorManager.blendColors(starColorRGB, starColor, colorRatios[i]);
                this.ctx.beginPath();
                this.ctx.fillStyle = `${color}${opacities[i]}`;
                this.ctx.arc(x, y, starSize * blurRadii[i], 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        else {
            // 小さい星：シンプルな円で描画
            if (star.getMagnitude() > limitMagnitudeForWhiten - 2.0) {
                this.ctx.fillStyle = this.colorManager.blendColors(starColorRGB, starColor, (limitMagnitudeForWhiten - star.getMagnitude()) / 6.0);
            }
            else {
                this.ctx.fillStyle = starColor;
            }
            this.ctx.beginPath();
            this.ctx.arc(x, y, starSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    writeStarNames(starNames) {
        if (starNames.length == 0)
            return;
        const showStarNames = this.config.displaySettings.showStarNames;
        if (this.config.displaySettings.showStarNames == 'off')
            return;
        if (starNames.length == 0)
            return;
        const currentJd = window.config.displayTime.jd;
        // 歳差運動補正をキャッシュ
        let precessionAngle;
        if (this.precessionCache && Math.abs(this.precessionCache.jd - currentJd) < 10.0) {
            precessionAngle = this.precessionCache.angle;
        }
        else {
            precessionAngle = this.coordinateConverter.precessionAngle('j2000', currentJd);
            this.precessionCache = { angle: precessionAngle, jd: currentJd };
        }
        // tierは0から5
        const tier_range = [180, 90, 60, 40, 30, 30];
        let tierLimit = 3;
        if (showStarNames == 'to1') {
            tierLimit = 1;
        }
        else if (showStarNames == 'to2') {
            tierLimit = 2;
        }
        this.ctx.font = `14px serif`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillStyle = this.colorManager.getColor('text');
        this.ctx.beginPath();
        for (const starName of starNames) {
            if (tierLimit == 1 && starName.tier > 0)
                continue;
            if (tierLimit == 2 && starName.tier > 1)
                continue;
            if (Math.max(this.config.viewState.fieldOfViewRA, this.config.viewState.fieldOfViewDec) > tier_range[starName.tier - 1])
                continue;
            const coords = this.coordinateConverter.precessionEquatorial({ ra: starName.ra, dec: starName.dec }, precessionAngle);
            const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.config, false, this.orientationData);
            if (!screenXY[0])
                continue;
            const [x, y] = screenXY[1];
            if (starName.jpnName) {
                this.ctx.fillText(starName.jpnName, x + 2, y - 2);
            }
            else {
                this.ctx.fillText(starName.name, x + 2, y - 2);
            }
        }
        this.ctx.fill();
    }
    /**
     * バイエル符号、フラムスティード番号
     */
    drawBayerDesignations(bayerData, limitingMagnitude) {
        if (!bayerData || bayerData.length === 0)
            return;
        if (!this.config.displaySettings.showBayerFS)
            return;
        if (this.config.viewState.fieldOfViewRA * this.config.viewState.fieldOfViewDec > 400)
            return;
        this.ctx.save();
        this.ctx.fillStyle = this.colorManager.getColor('text');
        this.ctx.font = '14px serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        // 歳差運動補正
        const currentJd = this.config.displayTime.jd;
        const precessionAngle = this.coordinateConverter.precessionAngle('j2000', currentJd);
        for (const bayerStar of bayerData) {
            if (!bayerStar.coordinates)
                continue;
            const coords = this.coordinateConverter.precessionEquatorial(bayerStar.coordinates, precessionAngle);
            const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.config, false, this.orientationData);
            if (!screenXY[0])
                continue;
            const [x, y] = screenXY[1];
            // ベイヤー記号を表示（既にフォーマット済み）
            if (bayerStar.bayer && bayerStar.flam) {
                this.ctx.fillText(`${bayerStar.bayer} (${bayerStar.flam})`, x + 5, y + 5);
            }
            else if (bayerStar.bayer) {
                this.ctx.fillText(bayerStar.bayer, x + 5, y + 5);
            }
            else if (bayerStar.flam) {
                this.ctx.fillText(`${bayerStar.flam}`, x + 2, y + 2);
            }
        }
        this.ctx.restore();
    }
    drawGaiaStars(gaiaData, gaiaHelpData, magBrightest) {
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
        let count1 = 0;
        let count2 = 0;
        let count3 = 0;
        if (this.config.displaySettings.showStarInfo) {
            for (const area of areas) {
                for (let unit = area[0]; unit < area[1] + 1; unit++) {
                    const raInt = unit % 360;
                    const decInt = Math.floor(unit / 360) - 90;
                    const st = gaiaHelpData[unit];
                    const fi = gaiaHelpData[unit + 1];
                    // バッチ処理で座標変換を最適化
                    for (let i = st; i < fi; i++) {
                        count1++;
                        const data = gaiaData[i];
                        const mag = data[2];
                        if (mag >= limitingMagnitude)
                            continue;
                        count2++;
                        const ra = raInt + data[0];
                        const dec = decInt + data[1];
                        const coords = this.coordinateConverter.precessionEquatorial({ ra, dec }, precessionAngle);
                        const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.config);
                        if (!screenXY[0])
                            continue;
                        count3++;
                        this.starInfoInfomation.push({
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
                        this.drawGaiaStar(screenXY[1], mag, limitingMagnitude, zeroMagSize, faintFillStyle, brightFillStyle);
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
                        count1++;
                        const data = gaiaData[i];
                        const mag = data[2];
                        if (mag >= limitingMagnitude)
                            continue;
                        count2++;
                        const ra = raInt + data[0];
                        const dec = decInt + data[1];
                        const coords = this.coordinateConverter.precessionEquatorial({ ra, dec }, precessionAngle);
                        const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.config);
                        if (!screenXY[0])
                            continue;
                        count3++;
                        this.drawGaiaStar(screenXY[1], mag, limitingMagnitude, zeroMagSize, faintFillStyle, brightFillStyle);
                    }
                }
            }
        }
        this.ctx.fill();
        // console.log(`${magBrightest}: inArea: ${count1} magOK: ${count2} drawn: ${count3}`);
    }
    drawGaiaStar([x, y], mag, limitingMagnitude, zeroMagSize, faintFillStyle, brightFillStyle) {
        const starSize = getStarSize(mag, limitingMagnitude, zeroMagSize);
        if (mag > limitingMagnitude - 3.0) {
            this.ctx.fillStyle = `${faintFillStyle}${Math.round(255 - (mag - limitingMagnitude + 3.0) * 30).toString(16)}`;
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
        // === スプライト描画（高速化版、将来的に有効化する場合はコメント解除） ===
        // if (starSize < 2.0) {
        //     this.ctx.fillRect(x - starSize*0.7, y - starSize*0.7, starSize*1.4, starSize*1.4);
        // } else {
        //     const sprite = this.getGaiaSprite(starSize);
        //     if (sprite) {
        //         this.ctx.drawImage(sprite, x - sprite.width / 2, y - sprite.height / 2);
        //     } else {
        //         this.ctx.moveTo(x, y);
        //         this.ctx.arc(x, y, starSize, 0, Math.PI * 2);
        //     }
        // }
        // === スプライト描画ここまで ===
    }
    // グリッドを描画
    drawGrid() {
        if (!this.config.displaySettings.showGrid)
            return;
        if (!["AEP", "view"].includes(this.config.displaySettings.mode))
            return;
        let i, j;
        const fieldOfViewRA = this.config.viewState.fieldOfViewRA;
        const fieldOfViewDec = this.config.viewState.fieldOfViewDec;
        const centerRA = this.config.viewState.centerRA;
        const centerDec = this.config.viewState.centerDec;
        const centerAz = this.config.viewState.centerAz;
        const centerAlt = this.config.viewState.centerAlt;
        const siderealTime = this.config.siderealTime;
        const latitude = this.config.observationSite.latitude;
        const lstLat = { lst: siderealTime, lat: latitude };
        const mode = this.config.displaySettings.mode;
        const alpha = mode == 'AEP' ? centerRA : centerAz;
        const beta = mode == 'AEP' ? centerDec : centerAlt;
        const [alphaInterval, betaInterval, alphaCalcInterval, betaCalcInterval] = getGridIntervals(fieldOfViewRA, fieldOfViewDec, alpha, beta);
        const [minBeta, maxBeta] = getBetaRange(lstLat, fieldOfViewRA, fieldOfViewDec, centerRA, centerDec, centerAz, centerAlt, mode, this.coordinateConverter, this.orientationData);
        const minBetaLineIdx = Math.floor(minBeta / betaInterval);
        const maxBetaLineIdx = Math.ceil(maxBeta / betaInterval);
        const minBetaCalcIdx = Math.floor(minBeta / betaCalcInterval);
        const maxBetaCalcIdx = Math.ceil(maxBeta / betaCalcInterval);
        this.ctx.strokeStyle = this.colorManager.getColor('grid');
        const canvasSize = this.config.canvasSize;
        const maxLengthSquared = this.coordinateConverter.getMaxLineLengthSquared(canvasSize, this.config.viewState);
        let a = 0.0, b = 0.0;
        let preXY = { ifin: false, x: 0.0, y: 0.0 };
        let ifin = false, x = 0.0, y = 0.0;
        let newLine = true;
        if (maxBeta == 90.0) {
            // 横の線
            for (i = minBetaLineIdx; i <= maxBetaLineIdx; i++) {
                newLine = true;
                b = i * betaInterval;
                this.ctx.lineWidth = getGridLineWidth(b);
                if (mode == 'AEP' && b == 0.0) {
                    this.ctx.strokeStyle = this.colorManager.getColor('gridEquatorialLine');
                }
                this.ctx.beginPath();
                for (j = 0; j <= 360 / alphaCalcInterval + 1; j++) {
                    a = j * alphaCalcInterval;
                    if (mode == 'AEP') {
                        [ifin, [x, y]] = this.coordinateConverter.equatorialToScreenXYifin({ ra: a, dec: b }, this.config, true);
                    }
                    else if (mode == 'view') {
                        [ifin, [x, y]] = this.coordinateConverter.horizontalToScreenXYifin({ az: a, alt: b }, this.config, true);
                    }
                    if (!newLine && this.coordinateConverter.shouldDrawLine(preXY.x, preXY.y, x, y, canvasSize, maxLengthSquared)) {
                        this.ctx.moveTo(preXY.x, preXY.y);
                        this.ctx.lineTo(x, y);
                    }
                    preXY = { ifin: ifin, x: x, y: y };
                    newLine = false;
                }
                this.ctx.stroke();
                if (mode == 'AEP' && b == 0.0) {
                    this.ctx.strokeStyle = this.colorManager.getColor('grid');
                }
            }
            // 縦の線
            this.ctx.lineWidth = 1;
            for (i = 0; i <= Math.ceil(360 / alphaInterval); i++) {
                newLine = true;
                a = i * alphaInterval;
                for (j = minBetaCalcIdx; j <= maxBetaCalcIdx; j++) {
                    b = j * betaCalcInterval;
                    if (mode == 'AEP') {
                        [ifin, [x, y]] = this.coordinateConverter.equatorialToScreenXYifin({ ra: a, dec: b }, this.config, true);
                    }
                    else if (mode == 'view') {
                        [ifin, [x, y]] = this.coordinateConverter.horizontalToScreenXYifin({ az: a, alt: b }, this.config, true);
                    }
                    if (!newLine && this.coordinateConverter.shouldDrawLine(preXY.x, preXY.y, x, y, canvasSize, maxLengthSquared)) {
                        this.ctx.moveTo(preXY.x, preXY.y);
                        this.ctx.lineTo(x, y);
                    }
                    preXY = { ifin: ifin, x: x, y: y };
                    newLine = false;
                }
                this.ctx.stroke();
            }
        }
        else if (minBeta == -90.0) {
            // 横の線
            for (i = maxBetaLineIdx; i >= minBetaLineIdx; i--) {
                newLine = true;
                b = i * betaInterval;
                this.ctx.lineWidth = getGridLineWidth(b);
                if (mode == 'AEP' && b == 0.0) {
                    this.ctx.strokeStyle = this.colorManager.getColor('gridEquatorialLine');
                }
                this.ctx.beginPath();
                for (j = 0; j <= 360 / alphaCalcInterval + 1; j++) {
                    a = j * alphaCalcInterval;
                    if (mode == 'AEP') {
                        [ifin, [x, y]] = this.coordinateConverter.equatorialToScreenXYifin({ ra: a, dec: b }, this.config, true);
                    }
                    else if (mode == 'view') {
                        [ifin, [x, y]] = this.coordinateConverter.horizontalToScreenXYifin({ az: a, alt: b }, this.config, true);
                    }
                    if (!newLine && this.coordinateConverter.shouldDrawLine(preXY.x, preXY.y, x, y, canvasSize, maxLengthSquared)) {
                        this.ctx.moveTo(preXY.x, preXY.y);
                        this.ctx.lineTo(x, y);
                    }
                    preXY = { ifin: ifin, x: x, y: y };
                    newLine = false;
                }
                this.ctx.stroke();
                if (mode == 'AEP' && b == 0.0) {
                    this.ctx.strokeStyle = this.colorManager.getColor('grid');
                }
            }
            // 縦の線
            this.ctx.lineWidth = 1;
            for (i = 0; i <= Math.ceil(360 / alphaInterval); i++) {
                newLine = true;
                a = i * alphaInterval;
                for (j = minBetaCalcIdx; j <= maxBetaCalcIdx; j++) {
                    b = j * betaCalcInterval;
                    if (mode == 'AEP') {
                        [ifin, [x, y]] = this.coordinateConverter.equatorialToScreenXYifin({ ra: a, dec: b }, this.config, true);
                    }
                    else if (mode == 'view') {
                        [ifin, [x, y]] = this.coordinateConverter.horizontalToScreenXYifin({ az: a, alt: b }, this.config, true);
                    }
                    if (!newLine && this.coordinateConverter.shouldDrawLine(preXY.x, preXY.y, x, y, canvasSize, maxLengthSquared)) {
                        this.ctx.moveTo(preXY.x, preXY.y);
                        this.ctx.lineTo(x, y);
                    }
                    preXY = { ifin: ifin, x: x, y: y };
                    newLine = false;
                }
                this.ctx.stroke();
            }
        }
        else {
            const alphaRange = getAlphaRange(lstLat, fieldOfViewRA, fieldOfViewDec, alpha, mode, this.coordinateConverter, this.orientationData);
            const minAlphaLineIdx = Math.ceil((alpha - alphaRange) / alphaInterval);
            const maxAlphaLineIdx = Math.floor((alpha + alphaRange) / alphaInterval);
            const maxAlphaCalcIdx = Math.ceil(alphaRange / alphaCalcInterval);
            // 横の線
            for (i = minBetaLineIdx; i <= maxBetaLineIdx; i++) {
                newLine = true;
                b = i * betaInterval;
                this.ctx.lineWidth = getGridLineWidth(b);
                if (mode == 'AEP' && b == 0.0) {
                    this.ctx.strokeStyle = this.colorManager.getColor('gridEquatorialLine');
                }
                this.ctx.beginPath();
                for (j = -maxAlphaCalcIdx; j <= maxAlphaCalcIdx; j++) {
                    a = alpha + j * alphaCalcInterval;
                    if (mode == 'AEP') {
                        [ifin, [x, y]] = this.coordinateConverter.equatorialToScreenXYifin({ ra: a, dec: b }, this.config, true);
                    }
                    else if (mode == 'view') {
                        [ifin, [x, y]] = this.coordinateConverter.horizontalToScreenXYifin({ az: a, alt: b }, this.config, true);
                    }
                    if (!newLine && this.coordinateConverter.shouldDrawLine(preXY.x, preXY.y, x, y, canvasSize, maxLengthSquared)) {
                        this.ctx.moveTo(preXY.x, preXY.y);
                        this.ctx.lineTo(x, y);
                    }
                    preXY = { ifin: ifin, x: x, y: y };
                    newLine = false;
                }
                this.ctx.stroke();
                if (mode == 'AEP' && b == 0.0) {
                    this.ctx.strokeStyle = this.colorManager.getColor('grid');
                }
            }
            // 縦の線
            this.ctx.lineWidth = 1;
            for (i = minAlphaLineIdx; i <= maxAlphaLineIdx; i++) {
                newLine = true;
                a = i * alphaInterval;
                for (j = minBetaCalcIdx; j <= maxBetaCalcIdx; j++) {
                    b = j * betaCalcInterval;
                    if (mode == 'AEP') {
                        [ifin, [x, y]] = this.coordinateConverter.equatorialToScreenXYifin({ ra: a, dec: b }, this.config, true);
                    }
                    else if (mode == 'view') {
                        [ifin, [x, y]] = this.coordinateConverter.horizontalToScreenXYifin({ az: a, alt: b }, this.config, true);
                    }
                    if (!newLine && this.coordinateConverter.shouldDrawLine(preXY.x, preXY.y, x, y, canvasSize, maxLengthSquared)) {
                        this.ctx.moveTo(preXY.x, preXY.y);
                        this.ctx.lineTo(x, y);
                    }
                    preXY = { ifin: ifin, x: x, y: y };
                    newLine = false;
                }
                this.ctx.stroke();
            }
        }
        if (mode == 'view') {
            const directions = ["北", "北東", "東", "南東", "南", "南西", "西", "北西"];
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            this.ctx.font = '15px monospace';
            this.ctx.fillStyle = this.colorManager.getColor('text');
            for (i = 0; i < 360; i += 45) {
                const direction = directions[i / 45];
                const directionEquatorial = this.coordinateConverter.horizontalToEquatorial(lstLat, { az: i, alt: 0 });
                const [ifin, [x, y]] = this.coordinateConverter.equatorialToScreenXYifin(directionEquatorial, this.config, false, this.orientationData);
                if (ifin) {
                    const directionEquatorial2 = this.coordinateConverter.horizontalToEquatorial(lstLat, { az: i + 1, alt: 0 });
                    const [ifin2, [x2, y2]] = this.coordinateConverter.equatorialToScreenXYifin(directionEquatorial2, this.config, false, this.orientationData);
                    this.ctx.save();
                    this.ctx.translate(x, y);
                    this.ctx.rotate(Math.atan2(y2 - y, x2 - x));
                    this.ctx.fillText(direction, 0, 0);
                    this.ctx.restore();
                }
            }
        }
    }
    drawEquatorialLine() {
    }
    drawPoleMark() {
        const minFov = Math.min(this.config.viewState.fieldOfViewRA, this.config.viewState.fieldOfViewDec);
        if (minFov > 20)
            return;
        const npScreenXY = this.coordinateConverter.equatorialToScreenXYifin({ ra: 0, dec: 90 }, this.config, true, this.orientationData);
        if (npScreenXY[0]) {
            if (minFov > 8) {
                this.poleMark(npScreenXY[1], '天の北極', false);
            }
            else {
                this.poleMark(npScreenXY[1], '天の北極', true);
            }
        }
        const spScreenXY = this.coordinateConverter.equatorialToScreenXYifin({ ra: 0, dec: -90 }, this.config, true, this.orientationData);
        if (spScreenXY[0]) {
            this.poleMark(spScreenXY[1], '天の南極', false);
        }
    }
    poleMark(screenXY, text, ring = false) {
        if (this.config.displaySettings.mode === 'AEP')
            return;
        const [x, y] = screenXY;
        const a = 0.626; // 2025年始の天の北極とポラリスの離角
        const a_canvas = a * this.config.canvasSize.height / this.config.viewState.fieldOfViewDec;
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillStyle = this.colorManager.getColor('orange');
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = this.colorManager.getColor('orange');
        this.ctx.beginPath();
        this.ctx.moveTo(x - 4, y - 4);
        this.ctx.lineTo(x + 4, y + 4);
        this.ctx.moveTo(x + 4, y - 4);
        this.ctx.lineTo(x - 4, y + 4);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.fillText(text, x, y);
        if (ring) {
            this.ctx.arc(x, y, a_canvas, 0, 2 * Math.PI);
            for (let i = 0; i < 360; i += 15) {
                const ang = i * Math.PI / 180;
                const cos = Math.cos(ang);
                const sin = Math.sin(ang);
                this.ctx.moveTo(x + 0.96 * a_canvas * cos, y + 0.96 * a_canvas * sin);
                this.ctx.lineTo(x + a_canvas * cos, y + a_canvas * sin);
            }
            this.ctx.stroke();
            this.ctx.fillText('2025', x, y - a_canvas - 2);
        }
    }
    // 星座線
    drawConstellationLines(constellations) {
        if (constellations.length == 0)
            return;
        if (!this.config.displaySettings.showConstellationLines)
            return;
        this.ctx.strokeStyle = this.colorManager.getColor('constellationLine');
        this.ctx.lineWidth = 1;
        const precessionAngle = this.coordinateConverter.precessionAngle('j2000', this.config.displayTime.jd);
        const maxLengthSquared = this.coordinateConverter.getMaxLineLengthSquared(this.config.canvasSize, this.config.viewState);
        this.ctx.beginPath();
        for (const constellation of constellations) {
            for (const line of constellation.lines) {
                const coords1J2000 = { ra: line[0], dec: line[1] };
                const coords1 = this.coordinateConverter.precessionEquatorial(coords1J2000, precessionAngle);
                const coords2J2000 = { ra: line[2], dec: line[3] };
                const coords2 = this.coordinateConverter.precessionEquatorial(coords2J2000, precessionAngle);
                const [ifin1, [x1, y1]] = this.coordinateConverter.equatorialToScreenXYifin(coords1, this.config, true, this.orientationData);
                const [ifin2, [x2, y2]] = this.coordinateConverter.equatorialToScreenXYifin(coords2, this.config, true, this.orientationData);
                if (this.coordinateConverter.shouldDrawLine(x1, y1, x2, y2, this.config.canvasSize, maxLengthSquared)) {
                    this.ctx.moveTo(x1, y1);
                    this.ctx.lineTo(x2, y2);
                }
            }
        }
        this.ctx.stroke();
    }
    writeConstellationNames(constellations) {
        if (constellations.length == 0)
            return;
        if (!this.config.displaySettings.showConstellationNames)
            return;
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = this.colorManager.getColor('constellationName');
        const siderealTime = window.config.siderealTime;
        const precessionAngle = this.coordinateConverter.precessionAngle('j2000', window.config.displayTime.jd);
        for (const constellation of constellations) {
            const coordsJ2000 = { ra: constellation.ra, dec: constellation.dec };
            const coords = this.coordinateConverter.precessionEquatorial(coordsJ2000, precessionAngle);
            const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.config, false, this.orientationData);
            if (!screenXY[0])
                continue;
            const [x, y] = screenXY[1];
            this.objectInfomation.push({
                name: constellation.JPNname + '座',
                type: 'constellation',
                x: x,
                y: y,
                data: constellation
            });
            this.ctx.fillText(constellation.JPNname, x, y);
        }
    }
    drawReticle() {
        if (!this.config.displaySettings.showReticle)
            return;
        this.ctx.strokeStyle = this.colorManager.getColor('reticle');
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
        this.ctx.strokeStyle = this.colorManager.getColor('orange');
        this.ctx.fillStyle = this.colorManager.getColorWithAlpha('orange', 0.1);
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
    drawMilkyWay(milkyWay) {
        if (milkyWay.length == 0)
            return;
        if (Math.max(this.config.viewState.fieldOfViewRA, this.config.viewState.fieldOfViewDec) < 30)
            return;
        const ifins = [];
        const screenXYs = [];
        for (let i = 0; i < milkyWay.length; i++) {
            const [ifin, [x, y]] = this.coordinateConverter.equatorialToScreenXYifin({ ra: milkyWay[i][0], dec: milkyWay[i][1] }, this.config, true, this.orientationData);
            ifins.push(ifin);
            screenXYs.push([x, y]);
        }
        const maxLengthSquared = this.coordinateConverter.getMaxLineLengthSquared(this.config.canvasSize, this.config.viewState);
        // (ra=0, dec=55)と同じ側を塗る
        // const [ifin, [x, y]] = this.coordinateConverter.equatorialToScreenXYifin({ra: 0, dec: 55}, this.config, true, this.orientationData);
        this.ctx.strokeStyle = 'rgba(106, 171, 241, 0.5)';
        this.ctx.fillStyle = 'rgba(8, 46, 87, 0.5)';
        // this.ctx.fillStyle = this.colorManager.getColorWithAlpha('orange', 0.1);
        this.ctx.setLineDash([3, 3]);
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(screenXYs[0][0], screenXYs[0][1]);
        for (let i = 1; i < screenXYs.length; i++) {
            if (this.coordinateConverter.shouldDrawLine(screenXYs[i - 1][0], screenXYs[i - 1][1], screenXYs[i][0], screenXYs[i][1], this.config.canvasSize, maxLengthSquared)) {
                this.ctx.moveTo(screenXYs[i - 1][0], screenXYs[i - 1][1]);
                this.ctx.lineTo(screenXYs[i][0], screenXYs[i][1]);
            }
        }
        this.ctx.stroke();
        // this.ctx.fill();
        this.ctx.setLineDash([]);
    }
    getStarColor(bv) {
        return this.colorManager.getStarColor(bv);
    }
    areaCandidates() {
        // キャッシュをチェック（設定が変更されていない場合）
        const currentTime = Date.now();
        if (this.areaCandidatesCache &&
            currentTime - this.areaCandidatesCache.timestamp < 10) { // 10ms以内ならキャッシュを使用
            return this.areaCandidatesCache.areas;
        }
        const areaCandidates = getAreaCandidates({ lst: this.config.siderealTime, lat: this.config.observationSite.latitude }, this.config.viewState, this.config.displayTime.jd, this.config.displaySettings.mode, this.coordinateConverter);
        // キャッシュを更新
        this.areaCandidatesCache = {
            areas: areaCandidates,
            timestamp: currentTime
        };
        return areaCandidates;
    }
    // HIP星データ全体を歳差運動補正してキャッシュ
    getCachedHipStars(hipStars, jd) {
        if (!hipStars || hipStars.length === 0) {
            return [];
        }
        // console.log("HIP cache check:", this.hipStarsCache?.jd, jd);
        if (this.hipStarsCache && Math.abs(this.hipStarsCache.jd - jd) < 10.0) {
            return this.hipStarsCache.stars;
        }
        // 新しいHIP星データを作成（歳差運動補正済み）
        const precessionAngle = this.coordinateConverter.precessionAngle('j2000', jd);
        const correctedStars = hipStars.map(star => {
            const originalCoords = star.getCoordinates();
            const correctedCoords = this.coordinateConverter.precessionEquatorial(originalCoords, precessionAngle);
            return new HipStar(correctedCoords, star.getMagnitude(), star.getBv());
        });
        this.hipStarsCache = { stars: correctedStars, jd };
        return correctedStars;
    }
    // Gaiaデータ全体を歳差運動補正してキャッシュ
    getCachedGaiaData(gaianum, gaiaData, jd) {
        if (!gaiaData || gaiaData.length === 0) {
            return [];
        }
        if (gaianum == 1) {
            // console.log(this.gaiaDataCache1?.jd, jd);
            if (this.gaiaDataCache1 && Math.abs(this.gaiaDataCache1.jd - jd) < 10.0) {
                return this.gaiaDataCache1.data;
            }
        }
        else if (gaianum == 2) {
            // console.log(this.gaiaDataCache1?.jd, jd);
            if (this.gaiaDataCache2 && Math.abs(this.gaiaDataCache2.jd - jd) < 10.0) {
                return this.gaiaDataCache2.data;
            }
        }
        else if (gaianum == 3) {
            // console.log(this.gaiaDataCache1?.jd, jd);
            if (this.gaiaDataCache3 && Math.abs(this.gaiaDataCache3.jd - jd) < 10.0) {
                return this.gaiaDataCache3.data;
            }
        }
        else {
            console.error("gaianum looks strange: ", gaianum);
            return [];
        }
        // 新しいGaiaデータを作成（歳差運動補正済み）
        const precessionAngle = this.coordinateConverter.precessionAngle('j2000', jd);
        console.log("Gaia", gaianum, "precession angle:", precessionAngle);
        const correctedData = gaiaData.map(star => {
            const [ra, dec, mag] = star;
            const correctedCoords = this.coordinateConverter.precessionEquatorial({ ra, dec }, precessionAngle);
            return [correctedCoords.ra, correctedCoords.dec, mag];
        });
        if (gaianum == 1) {
            this.gaiaDataCache1 = { data: correctedData, jd };
        }
        else if (gaianum == 2) {
            this.gaiaDataCache2 = { data: correctedData, jd };
        }
        else if (gaianum == 3) {
            this.gaiaDataCache3 = { data: correctedData, jd };
        }
        console.log("Gaia", gaianum, "cache created with", correctedData.length, "stars");
        return correctedData;
    }
    createGaiaSprites() {
        const gaiaSprites = new Map();
        const baseColor = this.colorManager.getColor('star');
        // サイズ範囲: 2.0〜8.0px (0.5px刻み)、ハロー付き
        for (let size = 2.0; size <= 8.0; size += 0.5) {
            const index = Math.round(size * 2);
            const haloMultiplier = 1.8; // ハローの広がり倍率
            const canvasSize = Math.ceil(size * haloMultiplier * 2) + 2;
            const center = canvasSize / 2;
            const off = document.createElement("canvas");
            off.width = canvasSize;
            off.height = canvasSize;
            const ctx = off.getContext("2d");
            const g = ctx.createRadialGradient(center, center, 0, center, center, size * haloMultiplier);
            g.addColorStop(0.0, baseColor);
            g.addColorStop(0.3, baseColor);
            g.addColorStop(0.6, `${baseColor}88`);
            g.addColorStop(1.0, "transparent");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(center, center, size * haloMultiplier, 0, Math.PI * 2);
            ctx.fill();
            gaiaSprites.set(index, off);
        }
        this.gaiaSprites = gaiaSprites;
        console.log(`Gaia star sprites created: ${this.gaiaSprites.size} sprites`);
    }
    getGaiaSprite(size) {
        return this.gaiaSprites.get(Math.round(size * 2)) || null;
    }
    /**
     * HIP星用のスプライトを事前生成する
     * サイズ別にハロー付きの星を描画し、キャッシュしておく
     */
    createHipStarSprites() {
        this.hipStarSprites.clear();
        const baseColor = this.colorManager.getColor('star');
        // サイズ範囲: 3〜20px (0.5px刻み)
        const haloMultiplier = 2.5; // ハローの広がり倍率
        for (let size = 3; size <= 20; size += 1) {
            for (let bv = -0.4; bv <= 2.0; bv += 0.1) {
                const off = this.createHipStarSprite(size, bv, baseColor, haloMultiplier);
                const key = `${size}-${Math.round(bv * 10)}`;
                this.hipStarSprites.set(key, off);
            }
            // bv = null
            const off = this.createHipStarSprite(size, null, baseColor, haloMultiplier);
            const key = `${size}-null`;
            this.hipStarSprites.set(key, off);
        }
        console.log(`HIP star sprites created: ${this.hipStarSprites.size} sprites`);
    }
    createHipStarSprite(size, bv, baseColor, haloMultiplier) {
        const color = this.getStarColor(bv);
        const canvasSize = Math.ceil(size * haloMultiplier * 2) + 2;
        const center = canvasSize / 2;
        const off = document.createElement('canvas');
        off.width = canvasSize;
        off.height = canvasSize;
        const ctx = off.getContext('2d');
        // グラデーションでハロー付きの星を描画
        const gradient = ctx.createRadialGradient(center, center, 0, center, center, size * haloMultiplier);
        gradient.addColorStop(0, baseColor);
        gradient.addColorStop(0.15, baseColor);
        gradient.addColorStop(0.4, `${color}aa`);
        gradient.addColorStop(0.7, `${color}44`);
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
    getHipStarSprite(size, bv10) {
        // サイズを整数に丸める
        const roundedSize = Math.round(size);
        // console.log(`${roundedSize}-${Math.round(bv * 10)}`);
        return this.hipStarSprites.get(`${roundedSize}-${bv10}`) || null;
    }
    // 描画オプションを更新
    // timeSliderが動いたときに呼び出される
    // this.configはコンストラクタの宣言により自動で更新されるので、この関数はなくせるかも
    updateOptions(options) {
        const globalConfig = window.config;
        if (globalConfig) {
            if (this.config !== globalConfig) {
                this.config = globalConfig;
            }
        }
        Object.assign(this.config, options);
        this.canvas.width = this.config.canvasSize.width;
        this.canvas.height = this.config.canvasSize.height;
        // グローバルconfigも確実に更新
        if (globalConfig) {
            Object.assign(globalConfig, options);
        }
        // 設定が変更されたらキャッシュをクリア
        if (options.viewState || options.displaySettings) {
            this.areaCandidatesCache = null;
            this.objectInfomation = [];
        }
        // 時刻が変更されたらキャッシュをクリア
        if (options.displayTime) {
            this.areaCandidatesCache = null;
            this.precessionCache = null;
            this.hipStarsCache = null;
            this.gaiaDataCache1 = null;
            this.gaiaDataCache2 = null;
            this.gaiaDataCache3 = null;
            this.objectInfomation = [];
        }
    }
    updateColorManager() {
        this.colorManager = getColorManager(this.config.displaySettings.darkMode);
    }
    setOrientationData(orientationData) {
        this.orientationData = orientationData;
    }
    clearObjectInfomation() {
        this.objectInfomation = [];
    }
    clearStarInfoInfomation() {
        this.starInfoInfomation = [];
    }
    /**
     * 画面内に表示されている天体のリストを取得
     */
    getVisibleObjects() {
        return this.objectInfomation;
    }
    getStarInfoInfomation() {
        return this.starInfoInfomation;
    }
}
//# sourceMappingURL=CanvasRenderer.js.map