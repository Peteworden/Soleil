import { SolarSystemDataManager } from '../models/SolarSystemObjects.js';
import { CelestialObject, HipStar, MessierObject } from '../models/CelestialObject.js';
import { CoordinateConverter } from '../utils/coordinates.js';
import { AstronomicalCalculator } from '../utils/calculations.js';
import { DeviceOrientationManager } from '../utils/deviceOrientation.js';
import { SolarSystemPositionCalculator } from '../utils/SolarSystemPositionCalculator.js';
import { getColorManager } from '../utils/colorManager.js';
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
        this.orientationData = { alpha: 0, beta: 0, gamma: 0, webkitCompassHeading: 0 };
        this.gaiaSprites = new Map();
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
    drawNGC(ngcObjects) {
        if (!this.config.displaySettings.showNGC)
            return;
        this.drawJsonObject(ngcObjects, 'ngc', 'bottom-right');
    }
    drawTempTarget(tempTarget) {
        if (!tempTarget)
            return;
        const tempTargetJson = JSON.parse(tempTarget);
        const tempTargetObject = new CelestialObject(tempTargetJson.name, tempTargetJson.coordinates, tempTargetJson.magnitude, tempTargetJson.type);
        if (tempTargetObject) {
            this.drawJsonObject([tempTargetObject], 'ngc', 'bottom-right');
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
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = this.colorManager.getColor('moonShade');
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, p, p + Math.PI);
            this.ctx.ellipse(x, y, radius, radius * (1 - 2 * k), p - Math.PI, 0, Math.PI);
            this.ctx.fill();
        }
        else {
            this.ctx.fillStyle = this.colorManager.getColor('moonShade');
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, p - Math.PI, p);
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
        // console.time('drawHipStars');
        // if (['AEP', 'view'].includes(this.config.displaySettings.mode)) {
        //     const lstLat = { lst: this.config.siderealTime, lat: this.config.observationSite.latitude };
        //     // const stars = cachedStars.filter(s => s.getMagnitude()! <= limitingMagnitude)
        //     const stars = cachedStars;
        //     const numStars = stars.length;
        //     const starArray = new Array(numStars);
        //     const raArray = new Float64Array(numStars);
        //     const decArray = new Float64Array(numStars);
        //     let count = 0;
        //     for (let i = 0; i < numStars; i++) {
        //         const star = stars[i];
        //         if (star.magnitude! <= limitingMagnitude) {
        //             starArray[count] = star;
        //             const coords = star.coordinates;
        //             raArray[count] = coords.ra;
        //             decArray[count] = coords.dec;
        //             count++;
        //         }
        //     }
        //     const numStarsFiltered = count;
        //     const starArrayFiltered = starArray.slice(0, numStarsFiltered);
        //     const raFiltered = raArray.subarray(0, count);
        //     const decFiltered = decArray.subarray(0, count);
        //     console.time('wasm');
        //     const screenRaDecs = await this.coordinateConverter.equatorialToScreenRaDecWasm(
        //         lstLat, this.config.displaySettings.mode, this.config.viewState, this.config.canvasSize, 
        //         raFiltered, decFiltered
        //     );  
        //     // console.time('drawHipStars');
        //     for (let i = 0; i < numStarsFiltered; i++) {
        //         const scrRA = screenRaDecs[i * 2];
        //         const scrDec = screenRaDecs[i * 2 + 1];
        //         if (Math.abs(scrRA) > this.config.viewState.fieldOfViewRA * 0.5 || Math.abs(scrDec) > this.config.viewState.fieldOfViewDec * 0.5) continue;
        //         const [x, y] = this.coordinateConverter.screenRaDecToScreenXY({ ra: scrRA, dec: scrDec }, this.config.canvasSize, this.config.viewState);
        //         const star = starArrayFiltered[i];
        //         const starSize = getStarSize(star.getMagnitude()!, limitingMagnitude, zeroMagSize) + 0.4;
        //         this.ctx.beginPath();
        //         this.ctx.fillStyle = this.getStarColor(star.getBv()!);
        //         this.ctx.arc(x, y, starSize, 0, Math.PI * 2);  
        //         this.ctx.fill();
        //     }
        //     // console.timeEnd('drawHipStars');
        // }
        // console.time('drawHipStars2');
        const lstLat = { lst: this.config.siderealTime, lat: this.config.observationSite.latitude };
        for (const star of cachedStars) {
            if (star.getMagnitude() > limitingMagnitude)
                continue;
            const coords = star.getCoordinates();
            const screenXY = this.coordinateConverter.equatorialToScreenXYifin(coords, this.config, false, this.orientationData);
            if (!screenXY[0])
                continue;
            const [x, y] = screenXY[1];
            const starSize = getStarSize(star.getMagnitude(), limitingMagnitude, zeroMagSize) + 0.4;
            this.ctx.beginPath();
            this.ctx.fillStyle = this.getStarColor(star.getBv());
            this.ctx.arc(x, y, starSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
        // console.timeEnd('drawHipStars2');
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
        const tier_range = [180, 90, 60, 40, 30, 30];
        let tierLimit = 3;
        if (showStarNames == 'to1') {
            tierLimit = 1;
        }
        else if (showStarNames == 'to2') {
            tierLimit = 2;
        }
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
            this.ctx.font = `${15 - 1 * starName.tier}px serif`;
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
        this.ctx.beginPath();
        let count1 = 0;
        let count2 = 0;
        let count3 = 0;
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
                    const [x, y] = screenXY[1];
                    const starSize = getStarSize(mag, limitingMagnitude, zeroMagSize);
                    if (starSize < 2.0) {
                        this.ctx.fillRect(x - starSize * 0.7, y - starSize * 0.7, starSize * 1.4, starSize * 1.4);
                    }
                    else {
                        this.ctx.moveTo(x, y);
                        this.ctx.arc(x, y, starSize, 0, Math.PI * 2);
                    }
                    // spriteは遅くはならないがあんまり変わらない
                    // if (starSize < 2.0) {
                    //     this.ctx.fillRect(x - starSize*0.7, y - starSize*0.7, starSize*1.4, starSize*1.4);
                    // } else {
                    //     const sprite = this.getGaiaSprite(starSize);
                    //     if (sprite) {
                    //         this.ctx.drawImage(sprite, x - sprite.width / 2, y - sprite.height / 2);
                    //     } else {
                    //         // console.log("No sprite:", starSize);
                    //         this.ctx.moveTo(x, y);
                    //         this.ctx.arc(x, y, starSize, 0, Math.PI * 2);
                    //     }
                    // }
                }
            }
        }
        this.ctx.fill();
        // console.log(`${magBrightest}: inArea: ${count1} magOK: ${count2} drawn: ${count3}`);
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
        const minBetaLineIdx = Math.ceil(minBeta / betaInterval);
        const maxBetaLineIdx = Math.floor(maxBeta / betaInterval);
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
                this.ctx.beginPath();
                for (j = 0; j <= 360 / alphaCalcInterval; j++) {
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
                this.ctx.beginPath();
                for (j = 0; j <= 360 / alphaCalcInterval; j++) {
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
        // if (this.config.displaySettings.mode == 'view') {
        //     const minAlt = Math.max(
        //         -90,
        //         Math.min(
        //             this.coordinateConverter.screenRaDecToHorizontal_View({ ra: fieldOfViewRA / 2, dec: -fieldOfViewDec / 2 }).alt,
        //             centerAlt - fieldOfViewDec / 2
        //         )
        //     );
        //     const maxAlt = Math.min(
        //         90,
        //         Math.max(
        //             this.coordinateConverter.screenRaDecToHorizontal_View({ ra: fieldOfViewRA / 2, dec: fieldOfViewDec / 2 }).alt,
        //             centerAlt + fieldOfViewDec / 2
        //         )
        //     );
        //     const altGridCalcIv = Math.min(fieldOfViewRA, fieldOfViewDec) / 40;
        //     const azGridCalcIv = Math.min(altGridCalcIv / Math.max(Math.cos(centerAlt*Math.PI/180), 0.1), 8); //天頂、天底付近で発散するため
        //     const gridIvChoices = [0.5, 1, 2, 5, 10, 30, 45];
        //     this.ctx.lineWidth = 1;
        //     let altGridIv = 45;
        //     for (i = 0; i < gridIvChoices.length; i++) {
        //         if (gridIvChoices[i] > Math.min(fieldOfViewDec, fieldOfViewRA) / 6) {
        //             altGridIv = gridIvChoices[i];
        //             break;
        //         }
        //     }
        //     let azGridIv = 45;
        //     for (i=0; i<gridIvChoices.length; i++) {
        //         if (gridIvChoices[i] > altGridIv / Math.cos(centerAlt*Math.PI/180)) {
        //             azGridIv = gridIvChoices[i];
        //             break;
        //         }
        //     }
        //     let az, alt, screenRA0, screenDec0;
        //     if (maxAlt == 90) { // 天頂を含むとき
        //         for (i = Math.floor(minAlt/altGridIv); i < Math.ceil(90/altGridIv); i++) {
        //             alt = i * altGridIv;
        //             if (alt == 0) this.ctx.lineWidth = 3;
        //             else this.ctx.lineWidth = 1;
        //             this.ctx.beginPath();
        //             for (j = 0; j < 360 / azGridCalcIv + 1; j++) {
        //                 az = j * azGridCalcIv;
        //                 [screenRA0, screenDec0] = this.drawHorizontalLine(j, az, alt, screenRA0, screenDec0);
        //             }
        //             this.ctx.stroke();
        //         }
        //         this.ctx.lineWidth = 1;
        //         for (i = 0; i < Math.ceil(360 / azGridIv); i++) {
        //             az = i * azGridIv;
        //             for (j = 0; j < Math.ceil(90 / altGridCalcIv) - Math.floor(minAlt / altGridCalcIv) + 1; j++) {
        //                 alt = (Math.floor(minAlt / altGridCalcIv) + j) * altGridCalcIv;
        //                 [screenRA0, screenDec0] = this.drawHorizontalLine(j, az, alt, screenRA0, screenDec0);
        //             }
        //             this.ctx.stroke();
        //         }
        //     } else if (minAlt == -90) { // 天底を含むとき
        //         // 等高度線
        //         for (i = Math.floor(-90 / altGridIv); i < Math.ceil(maxAlt / altGridIv); i++) {
        //             alt = i * altGridIv;
        //             if (alt == 0) this.ctx.lineWidth = 3;
        //             else this.ctx.lineWidth = 1;
        //             this.ctx.beginPath();
        //             for (j = 0; j < 360 / azGridCalcIv + 1; j++) {
        //                 az = j * azGridCalcIv;
        //                 [screenRA0, screenDec0] = this.drawHorizontalLine(j, az, alt, screenRA0, screenDec0);
        //             }
        //             this.ctx.stroke();
        //         }
        //         this.ctx.lineWidth = 1;
        //         // 等方位線
        //         for (i = 0; i < Math.ceil(360 / azGridIv); i++) {
        //             az = i * azGridIv;
        //             for (j = 0; j < Math.ceil((maxAlt + 90) / altGridCalcIv) + 1; j++) {
        //                 alt = -90 + j * altGridCalcIv;
        //                 [screenRA0, screenDec0] = this.drawHorizontalLine(j, az, alt, screenRA0, screenDec0);
        //             }
        //             this.ctx.stroke();
        //         }
        //     } else {
        //         const azRange = Math.max(
        //             (this.coordinateConverter.screenRaDecToHorizontal_View({ ra: -fieldOfViewRA / 2, dec:  fieldOfViewDec / 2 }).az - centerAz + 360) % 360,
        //             (this.coordinateConverter.screenRaDecToHorizontal_View({ ra: -fieldOfViewRA / 2, dec: 0                   }).az - centerAz + 360) % 360,
        //             (this.coordinateConverter.screenRaDecToHorizontal_View({ ra: -fieldOfViewRA / 2, dec: -fieldOfViewDec / 2 }).az - centerAz + 360) % 360
        //         );
        //         for (i = Math.floor(minAlt / altGridIv); i < Math.ceil(maxAlt / altGridIv); i++) {
        //             alt = i * altGridIv;
        //             if (alt == 0) {
        //                 this.ctx.lineWidth = 3;
        //             } else {
        //                 this.ctx.lineWidth = 1;
        //             }
        //             this.ctx.beginPath();
        //             for (j = 0; j < 2 * azRange / azGridCalcIv + 1; j++) {
        //                 az = centerAz - azRange + j * azGridCalcIv;
        //                 [screenRA0, screenDec0] = this.drawHorizontalLine(j, az, alt, screenRA0, screenDec0);
        //             }
        //             this.ctx.stroke();
        //         }
        //         this.ctx.lineWidth = 1;
        //         if (centerAz - azRange < 0) {
        //             for (i = 0; i < Math.ceil((centerAz + azRange) / azGridIv); i++) {
        //                 az = i * azGridIv;
        //                 for (j = 0; j < Math.ceil(maxAlt / altGridCalcIv) - Math.floor(minAlt / altGridCalcIv) + 1; j++) {
        //                     alt = (Math.floor(minAlt / altGridCalcIv) + j) * altGridCalcIv;
        //                     [screenRA0, screenDec0] = this.drawHorizontalLine(j, az, alt, screenRA0, screenDec0);
        //                 }
        //                 this.ctx.stroke();
        //             }
        //             for (i = Math.floor((centerAz - azRange + 360) / azGridIv); i < Math.ceil(360 / azGridIv); i++) {
        //                 az = i * azGridIv;
        //                 for (j = 0; j < Math.ceil(maxAlt / altGridCalcIv) - Math.floor(minAlt / altGridCalcIv) + 1; j++) {
        //                     alt = (Math.floor(minAlt / altGridCalcIv) + j) * altGridCalcIv;
        //                     [screenRA0, screenDec0] = this.drawHorizontalLine(j, az, alt, screenRA0, screenDec0);
        //                 }
        //                 this.ctx.stroke();
        //             }
        //         } else if (centerAz + azRange > 360) {
        //             for (i = 0; i < Math.ceil((centerAz + azRange) / azGridIv); i++) {
        //                 az = i * azGridIv;
        //                 for (j = 0; j < Math.ceil(maxAlt / altGridCalcIv) - Math.floor(minAlt / altGridCalcIv) + 1; j++) {
        //                     alt = (Math.floor(minAlt / altGridCalcIv) + j) * altGridCalcIv;
        //                     [screenRA0, screenDec0] = this.drawHorizontalLine(j, az, alt, screenRA0, screenDec0);
        //                 }
        //                 this.ctx.stroke();
        //             }
        //             for (i = Math.floor((centerAz - azRange + 360) / azGridIv); i < Math.ceil(360 / azGridIv); i++) {
        //                 az = i * azGridIv;
        //                 for (j = 0; j < Math.ceil(maxAlt / altGridCalcIv) - Math.floor(minAlt / altGridCalcIv) + 1; j++) {
        //                     alt = (Math.floor(minAlt / altGridCalcIv) + j) * altGridCalcIv;
        //                     [screenRA0, screenDec0] = this.drawHorizontalLine(j, az, alt, screenRA0, screenDec0);
        //                 }
        //                 this.ctx.stroke();
        //             }
        //         } else {
        //             for (i = Math.floor((centerAz - azRange) / azGridIv); i < Math.ceil((centerAz + azRange) / azGridIv); i++) {
        //                 az = i * azGridIv;
        //                 for (j = 0; j < Math.ceil(maxAlt / altGridCalcIv) - Math.floor(minAlt / altGridCalcIv) + 1; j++) {
        //                     alt = (Math.floor(minAlt / altGridCalcIv) + j) * altGridCalcIv;
        //                     [screenRA0, screenDec0] = this.drawHorizontalLine(j, az, alt, screenRA0, screenDec0);
        //                 }
        //                 this.ctx.stroke();
        //             }
        //         }
        //     }
        //     this.ctx.stroke();
        if (mode == 'view') {
            const directions = ["北", "北東", "東", "南東", "南", "南西", "西", "北西"];
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            this.ctx.font = '18px monospace';
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
    drawHorizontalLine(j, az, alt, screenRA0, screenDec0) {
        const mode = this.config.displaySettings.mode;
        const centerHorizontal = { az: this.config.viewState.centerAz, alt: this.config.viewState.centerAlt };
        const { ra: screenRA1, dec: screenDec1 } = this.coordinateConverter.horizontalToScreenRaDec({ az: az, alt: alt }, mode, centerHorizontal, this.orientationData);
        const semiWidthRA = this.config.viewState.fieldOfViewRA / 2;
        const semiWidthDec = this.config.viewState.fieldOfViewDec / 2;
        if (j > 0) {
            if (screenRA0 === undefined || screenDec0 === undefined)
                return [screenRA1, screenDec1];
            if ((Math.abs(screenRA0) < semiWidthRA && Math.abs(screenDec0) < semiWidthDec) ||
                (Math.abs(screenRA1) < semiWidthRA && Math.abs(screenDec1) < semiWidthDec)) {
                const [x1, y1] = this.coordinateConverter.screenRaDecToScreenXY({ ra: screenRA0, dec: screenDec0 }, this.config.canvasSize, this.config.viewState);
                const [x2, y2] = this.coordinateConverter.screenRaDecToScreenXY({ ra: screenRA1, dec: screenDec1 }, this.config.canvasSize, this.config.viewState);
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
            }
        }
        return [screenRA1, screenDec1];
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
        this.ctx.font = '14px Arial';
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
    // private floodFillAreaCandidates(edgeRA: number[], edgeDec: number[], np: boolean, sp: boolean): number[][] {
    //     // npのときは+85°以北を、spのときは-85°より南をすべて含める
    //     const RA_min = Math.min(...edgeRA);
    //     const RA_max = Math.max(...edgeRA);
    //     const Dec_min = sp ? -90 : Math.min(...edgeDec);
    //     const Dec_max = np ? 89.9 : Math.max(...edgeDec);
    //     let ra0Dec: number[] = []; // 赤経0度線を横切るときの赤緯
    //     // console.log(Dec_min.toFixed(2), Dec_max.toFixed(2));
    //     // 赤経0°の線を描く
    //     const ra0degLine = false;
    //     if (ra0degLine) {
    //         this.ctx.strokeStyle = this.colorManager.getColor('orange');
    //         this.ctx.fillStyle = 'transparent';
    //         this.ctx.lineWidth = 2;
    //         this.ctx.beginPath();
    //         this.ctx.moveTo(...this.coordinateConverter.equatorialToScreenXYifin({ra: 0, dec: -90}, this.config, true, this.orientationData)[1]);
    //         for (let dec = -89; dec <= 90; dec++) {
    //             this.ctx.lineTo(...this.coordinateConverter.equatorialToScreenXYifin({ra: 0, dec: dec}, this.config, true, this.orientationData)[1]);
    //         }
    //         this.ctx.stroke();
    //     }
    //     const debubMap = false;
    //     const mapWidth = this.config.canvasSize.width * 0.6;
    //     const mapHeight = mapWidth * 0.5;
    //     const toAreaMapXY = (ra: number, dec: number): [number, number] => {
    //         const x = this.config.canvasSize.width * 0.5 - mapWidth * (ra - 180) / 360;
    //         const y = this.config.canvasSize.height * 0.5 - mapHeight * dec / 180;
    //         return [x, y];
    //     }
    //     if (debubMap) {
    //         this.ctx.fillStyle = this.colorManager.getColorWithAlpha('orange', 0.2);
    //         this.ctx.strokeStyle = this.colorManager.getColor('orange');
    //         this.ctx.beginPath();
    //         this.ctx.moveTo(...toAreaMapXY(0, -90));
    //         this.ctx.lineTo(...toAreaMapXY(0, 90));
    //         this.ctx.lineTo(...toAreaMapXY(360, 90));
    //         this.ctx.lineTo(...toAreaMapXY(360, -90));
    //         this.ctx.lineTo(...toAreaMapXY(0, -90));
    //         this.ctx.fill();
    //         this.ctx.stroke();
    //         this.ctx.fillStyle = 'transparent';
    //         this.ctx.strokeStyle = 'blue';
    //         for (let i = 0; i < edgeRA.length - 1; i++) {
    //             this.ctx.beginPath();
    //             this.ctx.arc(...toAreaMapXY(edgeRA[i], edgeDec[i]), 1, 0, Math.PI * 2);
    //             this.ctx.stroke();
    //         }
    //     }
    //     // 境界線をセグメントに分割
    //     const segments: Array<{ra1: number, dec1: number, ra2: number, dec2: number, crossDecs: number[]}> = [];
    //     for (let i = 0; i < edgeRA.length - 1; i++) {
    //         segments.push({
    //             ra1: edgeRA[i], dec1: edgeDec[i],
    //             ra2: edgeRA[i + 1], dec2: edgeDec[i + 1],
    //             crossDecs: rangeInt(edgeDec[i], edgeDec[i+1])
    //         });
    //         if (edgeRA[i] > 300 && edgeRA[i+1] < 60) {
    //             ra0Dec.push(edgeDec[i] + (edgeDec[i+1] - edgeDec[i]) / (edgeRA[i+1] - edgeRA[i] + 360) * (360 - edgeRA[i]));
    //         } else if (edgeRA[i] < 60 && edgeRA[i+1] > 300) {
    //             ra0Dec.push(edgeDec[i] + (edgeDec[i+1] - edgeDec[i]) / (edgeRA[i] - edgeRA[i+1] + 360) * edgeRA[i]);
    //         }
    //     }
    //     segments.push({
    //         ra1: edgeRA[edgeRA.length - 1], dec1: edgeDec[edgeDec.length - 1],
    //         ra2: edgeRA[0], dec2: edgeDec[0],
    //         crossDecs: rangeInt(edgeDec[edgeRA.length-1], edgeDec[0])
    //     });
    //     if (edgeRA[edgeRA.length - 1] > 300 && edgeRA[0] < 60) {
    //         ra0Dec.push(edgeDec[edgeRA.length-1] + (edgeDec[0] - edgeDec[edgeRA.length-1]) / (edgeRA[0] - edgeRA[edgeRA.length-1] + 360) * (360 - edgeRA[edgeRA.length-1]));
    //     } else if (edgeRA[edgeRA.length-1] < 60 && edgeRA[0] > 300) {
    //         ra0Dec.push(edgeDec[edgeRA.length-1] + (edgeDec[0] - edgeDec[edgeRA.length-1]) / (edgeRA[edgeRA.length-1] - edgeRA[0] + 360) * edgeRA[edgeRA.length-1]);
    //     }
    //     if (np) {
    //         ra0Dec.push(85);
    //         ra0Dec.filter(dec => dec <= 85);
    //     }
    //     if (sp) {
    //         ra0Dec.push(-85);
    //         ra0Dec.filter(dec => dec >= -85);
    //     }
    //     ra0Dec.sort((a, b) => a - b);
    //     for (let i = 0; i < ra0Dec.length; i += 2) {
    //         segments.push({
    //             ra1: 0, dec1: ra0Dec[i],
    //             ra2: 0, dec2: ra0Dec[i+1],
    //             crossDecs: rangeInt(ra0Dec[i], ra0Dec[i+1])
    //         });
    //         segments.push({
    //             ra1: 359.999, dec1: ra0Dec[i],
    //             ra2: 359.999, dec2: ra0Dec[i+1],
    //             crossDecs: rangeInt(ra0Dec[i], ra0Dec[i+1])
    //         });
    //     }
    //     // i番目:赤緯i-90の線と境界線が交わる点の赤経
    //     const allIntersections: { intersections: number[] }[] = Array.from({length: 180}, () => ({ intersections: [] }));
    //     for (const segment of segments) {
    //         for (const dec of segment.crossDecs) {
    //             const t = (dec - segment.dec1) / (segment.dec2 - segment.dec1);
    //             let intersectionRA;
    //             if (segment.ra1 > 300 && segment.ra2 < 60) {
    //                 intersectionRA = (segment.ra1 + t * (segment.ra2 - segment.ra1 + 360) + 360) % 360;
    //             } else if (segment.ra1 < 60 && segment.ra2 > 300) {
    //                 intersectionRA = (segment.ra1 + t * (segment.ra2 - segment.ra1 - 360) + 360) % 360;
    //             } else {
    //                 intersectionRA = segment.ra1 + t * (segment.ra2 - segment.ra1);
    //             }
    //             allIntersections[dec + 90].intersections.push(intersectionRA);
    //         }
    //     }
    //     const candidateAreas: number[][] = [];
    //     const raRanges: number[][] = [];
    //     if (Dec_max > 84) {
    //         candidateAreas.push([areaNumber(0, 85.5), areaNumber(359.9, 89.9)]);
    //         for (let dec = 85.5; dec <= 89.9; dec++) {
    //             raRanges.push([0, 359.9, dec]);
    //         }
    //     }
    //     if (Dec_min < -84) {
    //         candidateAreas.push([areaNumber(0, -89.9), areaNumber(359.9, -85.5)]);
    //         for (let dec = -89.9; dec <= -85.5; dec++) {
    //             raRanges.push([0, 359.9, dec]);
    //         }
    //     }
    //     // 赤緯1度ごとに
    //     for (let dec = (sp ? -85 : Math.floor(Dec_min)); dec <= (np ? 84 : Math.floor(Dec_max)); dec++) {
    //         const intersections: number[] = allIntersections[dec + 90].intersections;
    //         intersections.sort((a, b) => a - b);
    //         let count = 0;
    //         // 交点のペアで領域を決定
    //         if (intersections.length === 0) {
    //             // この場合はないはず
    //             // 交点がない場合は範囲全体を含める
    //             if (RA_max > 300 && RA_min < 60) {
    //                 raRanges.push([0, Math.min(RA_min, 359.9), dec]);
    //                 raRanges.push([Math.max(RA_max, 0), 359.9, dec]);
    //                 candidateAreas.push(areaNumberRange(0, Math.min(RA_min, 359.9), dec));
    //                 candidateAreas.push(areaNumberRange(Math.max(RA_max, 0), 359.9, dec));
    //             } else {
    //                 raRanges.push([Math.max(RA_min, 0), Math.min(RA_max, 359.9), dec]);
    //                 candidateAreas.push(areaNumberRange(Math.max(RA_min, 0), Math.min(RA_max, 359.9), dec));
    //             }
    //         } else {
    //             for (let i = 0; i < intersections.length - 1; i += 2) {
    //                 const startRA = Math.max(intersections[i], 0);
    //                 const endRA = Math.min(intersections[i + 1], 359.9);
    //                 if (startRA < endRA) {
    //                     raRanges.push([startRA, endRA, dec]);
    //                     // console.log(dec, startRA.toFixed(2), endRA.toFixed(2));
    //                     candidateAreas.push(areaNumberRange(startRA, endRA, dec));
    //                     count++;
    //                 }
    //             }
    //         }
    //     }
    //         if (debubMap) {
    //             this.ctx.strokeStyle = 'green';
    //             this.ctx.fillStyle = 'transparent';
    //             this.ctx.lineWidth = 1;
    //             for (const [startRA, endRA, dec] of raRanges) {
    //                 // const startArea = this.areaNumber(startRA, dec);
    //                 // const endArea = this.areaNumber(endRA, dec);
    //                 // candidateAreas.push([startArea, endArea]);
    //                 const startXY = toAreaMapXY(startRA, dec);
    //                 const endXY = toAreaMapXY(endRA, dec);
    //                 this.ctx.beginPath();
    //                 this.ctx.moveTo(...startXY);
    //                 this.ctx.lineTo(...endXY);
    //                 this.ctx.stroke();
    //             }
    //         }
    //     return candidateAreas;
    // }
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
        for (let size = 2.0; size <= 5.0; size += 0.5) {
            const index = Math.round(size * 2);
            const off = document.createElement("canvas");
            off.width = size * 2;
            off.height = size * 2;
            const ctx = off.getContext("2d");
            const g = ctx.createRadialGradient(size, size, 0, size, size, size);
            g.addColorStop(0.0, this.colorManager.getColor('star'));
            g.addColorStop(1.0, "transparent");
            ctx.fillStyle = g;
            // ctx.fillStyle = this.colorManager.getColor('star');
            ctx.beginPath();
            ctx.arc(size, size, size, 0, Math.PI * 2);
            ctx.fill();
            gaiaSprites.set(index, off);
        }
        this.gaiaSprites = gaiaSprites;
        return;
    }
    getGaiaSprite(size) {
        return this.gaiaSprites.get(Math.round(size * 2)) || null;
    }
    // 描画オプションを更新
    // timeSliderが動いたときに呼び出される
    // this.configはコンストラクタの宣言により自動で更新されるので、この関数はなくせるかも
    updateOptions(options) {
        ;
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
    /**
     * 画面内に表示されている天体のリストを取得
     */
    getVisibleObjects() {
        return this.objectInfomation;
    }
}
//# sourceMappingURL=CanvasRenderer.js.map