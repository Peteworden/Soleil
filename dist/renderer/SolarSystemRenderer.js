import { Cartesian, RaDec } from "../utils/coordinates/index.js";
import { SolarSystemDataManager } from "../models/SolarSystemObjects.js";
import { AstronomicalCalculator } from "../utils/calculations.js";
import { getStarSize, starSize_0mag } from "../utils/canvasHelpers.js";
import { SolarSystemPositionCalculator } from "../utils/SolarSystemPositionCalculator.js";
export class SolarSystemRenderer {
    constructor(canvas, ctx, config, colorManager, orientationData) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.config = config;
        this.colorManager = colorManager;
        this.orientationData = orientationData;
    }
    drawSolarSystemObjects(objectInformation) {
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
                this.drawSun(object, objectInformation);
            }
            else if (object.getType() === 'moon') {
                const sun = objects.find(obj => obj.getType() === 'sun');
                this.drawMoon(object, sun, objectInformation);
            }
            else if (object.getType() === 'planet') {
                this.drawPlanet(object, limitingMagnitude, zeroMagSize, objectInformation);
            }
            else if (object.getType() === 'asteroid') {
                this.drawMinorObject(object, limitingMagnitude, zeroMagSize, objectInformation);
            }
            else if (object.getType() === 'comet') {
                this.drawMinorObject(object, limitingMagnitude, zeroMagSize, objectInformation);
            }
        }
        this.drawPlanetMotion();
    }
    drawSun(sun, objectInformation) {
        const coords = sun.getRaDec();
        const screenXY = coords.toCanvasXYifin(this.config, this.orientationData, false);
        if (!screenXY[0])
            return;
        const { x, y } = screenXY[1];
        objectInformation.push({
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
    drawMoon(moon, sun, objectInformation) {
        if (this.config.observationSite.observerPlanet !== '地球')
            return;
        const sunDeg = sun.getRaDec();
        const moonDeg = moon.getRaDec();
        const sunRad = sunDeg.toRad();
        const moonRad = moonDeg.toRad();
        const moonDist = moon.getDistance();
        const angRadius = 0.259 / (moonDist / 384400);
        const pxRadius0 = this.canvas.width * angRadius / this.config.viewState.fieldOfViewRA;
        const radius = Math.max(pxRadius0, 13);
        const scale = radius / pxRadius0; // 実際の視半径より何倍に見せているか
        const lon_sun = moon.Ms + 0.017 * Math.sin(moon.Ms + 0.017 * Math.sin(moon.Ms)) + moon.ws;
        const k = (1 - Math.cos(lon_sun - moon.lon_moon) * Math.cos(moon.lat_moon)) * 0.5;
        const screenXY = moonDeg.toCanvasXYifin(this.config, this.orientationData, false);
        if (!screenXY[0])
            return;
        const { x, y } = screenXY[1];
        objectInformation.push({
            name: moon.getJapaneseName(),
            type: 'moon',
            x: x,
            y: y,
            data: moon
        });
        let p, RA1, Dec1;
        if (this.config.displaySettings.mode == 'EtP') {
            p = Math.atan2(Math.cos(sunRad.dec) * Math.sin(moonRad.ra - sunRad.ra), -Math.sin(moonRad.dec) * Math.cos(sunRad.ra) * Math.cos(moonRad.ra - sunRad.ra) + Math.cos(moonRad.dec) * Math.sin(sunRad.dec));
        }
        else if (['AEP', 'view', 'live'].includes(this.config.displaySettings.mode)) {
            p = Math.atan2(Math.cos(sunRad.dec) * Math.sin(moonRad.ra - sunRad.ra), -Math.sin(moonRad.dec) * Math.cos(sunRad.dec) * Math.cos(moonRad.ra - sunRad.ra) + Math.cos(moonRad.dec) * Math.sin(sunRad.dec));
            RA1 = (moonDeg.ra - 0.2 * Math.cos(p) / Math.cos(moonRad.dec));
            Dec1 = (moonDeg.dec - 0.2 * Math.sin(p));
            const screenXY1 = moonDeg.toCanvasXYifin(this.config, this.orientationData, true);
            const { x: x1, y: y1 } = screenXY1[1];
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
            const shadowCenterFromEarthCenter = new RaDec((sunDeg.ra + 180) % 360, -sunDeg.dec).toCartesian(moonDist);
            const obsLat = this.config.observationSite.latitude * Math.PI / 180;
            const siderealTime = this.config.siderealTime;
            // 以下、観測者から見て
            const shadowCenterXYZ = new Cartesian(shadowCenterFromEarthCenter.x - Math.cos(obsLat) * Math.cos(siderealTime) * 6378.14, shadowCenterFromEarthCenter.y - Math.cos(obsLat) * Math.sin(siderealTime) * 6378.14, shadowCenterFromEarthCenter.z - Math.sin(obsLat) * 6378.14);
            const shadowCenterRaDec = shadowCenterXYZ.toRaDec();
            const shadowCenterXY = shadowCenterRaDec.toCanvasXYifin(this.config, this.orientationData, true);
            const { x: sx0, y: sy0 } = shadowCenterXY[1];
            const sx = x + (sx0 - x) * scale;
            const sy = y + (sy0 - y) * scale;
            const angDistanceDeg = moonDeg.angDistanceFrom(shadowCenterRaDec);
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
    drawPlanet(planet, limitingMagnitude, zeroMagSize, objectInformation) {
        this.ctx.font = '15px serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'bottom';
        const coords = planet.getRaDec();
        const screenXY = coords.toCanvasXYifin(this.config, this.orientationData, false);
        if (!screenXY[0])
            return;
        const { x, y } = screenXY[1];
        objectInformation.push({
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
    drawMinorObject(minorObject, limitingMagnitude, zeroMagSize, objectInformation) {
        this.ctx.font = '12px serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'bottom';
        const coords = minorObject.getRaDec();
        const screenXY = coords.toCanvasXYifin(this.config, this.orientationData, false);
        if (!screenXY[0])
            return;
        const { x, y } = screenXY[1];
        objectInformation.push({
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
            // for (let jd = minJd; jd <= maxJd; jd += interval) {
            for (let count = -halfCount; count <= halfCount; count++) {
                const jd = this.config.displayTime.jd + count * interval;
                if (count == 0) {
                    jds.push(jd);
                    timeLabels.push("");
                    ras.push(0);
                    decs.push(0);
                    xys.push({ x: 0, y: 0 });
                    distances.push(0);
                    continue;
                }
                else {
                    const objectData = SolarSystemPositionCalculator.oneObjectData(objectsBaseData, planet, jd, this.config.observationSite);
                    if (objectData) {
                        const ymdhms = AstronomicalCalculator.calculateYmdhmsJstFromJdTT(jd);
                        const coords = objectData.getRaDec();
                        const screenXY = coords.toCanvasXYifin(this.config, this.orientationData, true);
                        jds.push(jd);
                        timeLabels.push(formatTime(ymdhms, timeDisplayContent));
                        ras.push(coords.ra);
                        decs.push(coords.dec);
                        xys.push(screenXY[1]);
                        distances.push(objectData.getDistance());
                    }
                }
            }
            this.ctx.font = '14px serif';
            this.ctx.strokeStyle = this.colorManager.getColor('solarSystemMotion');
            this.ctx.fillStyle = this.colorManager.getColor('orange');
            this.ctx.textAlign = 'left';
            this.ctx.beginPath();
            for (let i = 0; i < jds.length; i++) {
                if (i == halfCount)
                    continue;
                this.ctx.moveTo(xys[i].x - 3, xys[i].y - 3);
                this.ctx.lineTo(xys[i].x + 3, xys[i].y + 3);
                this.ctx.moveTo(xys[i].x - 3, xys[i].y + 3);
                this.ctx.lineTo(xys[i].x + 3, xys[i].y - 3);
            }
            this.ctx.stroke();
            // インデックスhalfCountは現在
            // 配列の長さはhalfCount*2+1
            // 最後のインデックスはhalfCount*2
            for (let i = halfCount - timeDisplayStep; i >= 0; i -= timeDisplayStep) {
                if ((xys[i + 1].y - xys[i].y) * (xys[i + 1].x - xys[i].x) < 0) { // 軌跡が左上-右下
                    this.ctx.textBaseline = 'top';
                }
                else { // 軌跡が左下-右上
                    this.ctx.textBaseline = 'bottom';
                }
                this.ctx.fillText(timeLabels[i], xys[i].x, xys[i].y);
            }
            for (let i = halfCount + timeDisplayStep; i < 2 * halfCount + 1; i += timeDisplayStep) {
                if ((xys[i - 1].y - xys[i].y) * (xys[i - 1].x - xys[i].x) < 0) { // 軌跡が左上-右下
                    this.ctx.textBaseline = 'top';
                }
                else { // 軌跡が左下-右上
                    this.ctx.textBaseline = 'bottom';
                }
                this.ctx.fillText(timeLabels[i], xys[i].x, xys[i].y);
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
}
//# sourceMappingURL=SolarSystemRenderer.js.map