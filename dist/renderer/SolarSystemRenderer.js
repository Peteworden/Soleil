import { Cartesian, RaDec } from "../utils/coordinates/index.js";
import { SolarSystemDataManager } from "../models/SolarSystemObjects.js";
import { AstronomicalCalculator } from "../utils/calculations.js";
import { getStarSize, starSize_0mag } from "../utils/canvasHelpers.js";
import { SolarSystemPositionCalculator } from "../utils/SolarSystemPositionCalculator.js";
import { DEG_TO_RAD, EPSILON } from "../utils/constants.js";
export class SolarSystemRenderer {
    constructor(canvas, ctx, config, colorManager, orientationData) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.config = config;
        this.colorManager = colorManager;
        this.orientationData = orientationData;
        const chartImageDir = '../../chartImage/'; // SolarSystemRenderer.jsはrenderer直下にある
        this.fullMoonImage_256px = new Image();
        this.fullMoonImage_256px.src = chartImageDir + 'fullMoon_v2_256px.png';
        this.fullMoonImage_256px.onload = () => {
            console.log('fullMoonImage_256px loaded');
        };
        this.fullMoonImage_256px.onerror = (e) => {
            window.setDebugInfo('256 fail');
            console.log('fullMoonImage_256px not loaded', e);
        };
        this.fullMoonImage_128px = new Image();
        this.fullMoonImage_128px.src = chartImageDir + 'fullMoon_v2_128px.png';
        this.fullMoonImage_64px = new Image();
        this.fullMoonImage_64px.src = chartImageDir + 'fullMoon_v2_64px.png';
        this.fullMoonImage_16px = new Image();
        this.fullMoonImage_16px.src = chartImageDir + 'fullMoon_v2_16px.png';
    }
    drawSolarSystemObjects(objectInformation) {
        const objects = SolarSystemDataManager.getAllObjects();
        if (objects.length == 0)
            return;
        const limitingMagnitude = AstronomicalCalculator.limitingMagnitude(this.config);
        const zeroMagSize = starSize_0mag(this.config.viewState.fieldOfViewRA, this.config.viewState.fieldOfViewDec);
        this.ctx.fillStyle = 'white';
        const sun = objects.find(obj => obj.getType() === 'sun');
        for (const object of objects) {
            if (object.getType() === 'sun') {
                this.drawSun(sun, objectInformation);
            }
            else if (object.getType() === 'moon') {
                this.drawMoon(object, sun, objectInformation);
            }
            else if (object.getType() === 'planet') {
                this.drawPlanet(object, sun, limitingMagnitude, zeroMagSize, objectInformation);
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
        const moonRad = moonDeg.toRad();
        const moonDist = moon.getDistance();
        const angRadius = 0.259 / (moonDist / 384400);
        const pxRadius0 = this.canvas.width * angRadius / this.config.viewState.fieldOfViewRA;
        const radius = Math.max(pxRadius0, 13);
        const scale = radius / pxRadius0; // 実際の視半径より何倍に見せているか
        // 地球-月-太陽
        const angleEMS = moonDeg.angDistanceFrom(moon.getXYZ().toRaDec());
        // k=0:新月 k=0.5:半月 k=1:満月
        const k = (1. - Math.cos(Math.PI - angleEMS * DEG_TO_RAD)) * 0.5;
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
        const SunInMoonNorthCoord = new RaDec(sunDeg.ra - moonDeg.ra, sunDeg.dec).toCartesian().rotateY(-Math.PI / 2 + moonRad.dec);
        // 南から、天球の外から見て反時計回りに測った、月から見た太陽の方向
        const angleSMS = Math.atan2(SunInMoonNorthCoord.y, SunInMoonNorthCoord.x);
        const littleSunDirection = new RaDec(moonDeg.ra + 0.5 * Math.sin(angleSMS) / Math.cos(moonRad.dec), moonDeg.dec - 0.5 * Math.cos(angleSMS));
        const littleCloserToSunXY = littleSunDirection.toCanvasXYifin(this.config, this.orientationData, true)[1];
        // 地球から月の外縁を時計回りに見たとき、明から暗に転じるところの、右（西）から時計回りに測った角度
        const p = Math.atan2(littleCloserToSunXY.y - y, littleCloserToSunXY.x - x) + Math.PI * 0.5;
        const moonEcliptic = moonDeg.toEcliptic();
        // console.log(moonEcliptic.lon * RAD_TO_DEG, moonEcliptic.lat * RAD_TO_DEG);
        const littleEclipNorthRaDec = new RaDec(moonEcliptic.lon, moonEcliptic.lat + 0.5).toCartesian().rotateX(EPSILON).toRaDec();
        const littleNorthXY = littleEclipNorthRaDec.toCanvasXYifin(this.config, this.orientationData, true)[1];
        // console.log(x.toFixed(1), y.toFixed(1), littleNorthXY.x.toFixed(1), littleNorthXY.y.toFixed(1));
        const littleNorthAngle = Math.atan2(littleNorthXY.x - x, -littleNorthXY.y + y);
        // console.log(littleNorthAngle * RAD_TO_DEG);
        this.ctx.font = '15px serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillStyle = 'white';
        // this.drawMichikake(x, y, radius, k, p, this.colorManager.getColor('yellow'), this.colorManager.getColor('moonShade'));
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.clip();
        this.ctx.translate(x, y);
        this.ctx.rotate(littleNorthAngle);
        let img = null;
        if (radius > 128) {
            img = this.fullMoonImage_256px;
        }
        else if (radius > 64) {
            img = this.fullMoonImage_128px;
        }
        else if (radius > 32) {
            img = this.fullMoonImage_64px;
        }
        else if (radius > 8) {
            // if (radius < 8) {
            img = this.fullMoonImage_16px;
        }
        console.log({
            radius: radius,
            imgIsNull: img === null,
            complete: img?.complete,
            naturalWidth: img?.naturalWidth,
            src: img?.src
        });
        if (img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
            // console.log('img loaded');
            try {
                this.ctx.drawImage(img, -radius, -radius, radius * 2, radius * 2);
            }
            catch (e) {
                this.ctx.beginPath();
                this.ctx.fillStyle = '#cfcfcf';
                this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        else {
            // console.log('img not loaded');
            this.ctx.beginPath();
            this.ctx.fillStyle = '#cfcfcf';
            this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        const dayOpacity = k > 0.3 ? 0.2 : 0.2 + 0.8 * ((0.3 - k) / 0.3) ** 4;
        const shadeOpacity = k > 0.3 ? 0.8 : 0.8 - 0.3 * ((0.3 - k) / 0.3) ** 2;
        this.ctx.rotate(-littleNorthAngle);
        this.ctx.beginPath();
        if (k < 0.5) {
            this.ctx.fillStyle = this.colorManager.getColorWithAlpha('yellow', dayOpacity);
            this.ctx.arc(0, 0, radius, p - Math.PI, p);
            this.ctx.ellipse(0, 0, radius, radius * (1 - 2 * k), p - Math.PI, Math.PI, 0, true);
            this.ctx.fill();
            this.ctx.fillStyle = this.colorManager.getColorWithAlpha('moonShade', shadeOpacity);
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius, p - Math.PI, p, true);
            this.ctx.ellipse(0, 0, radius, radius * (1 - 2 * k), p - Math.PI, Math.PI, 0, true);
            this.ctx.fill();
        }
        else {
            this.ctx.fillStyle = this.colorManager.getColorWithAlpha('moonShade', shadeOpacity);
            this.ctx.arc(0, 0, radius, p - Math.PI, p, true);
            this.ctx.ellipse(0, 0, radius, radius * (2 * k - 1), p, 0, Math.PI);
            this.ctx.fill();
            this.ctx.fillStyle = this.colorManager.getColorWithAlpha('yellow', dayOpacity);
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius, p - Math.PI, p);
            this.ctx.ellipse(0, 0, radius, radius * (2 * k - 1), p, 0, Math.PI);
            this.ctx.fill();
        }
        this.ctx.restore();
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
                const penAlpha = Math.min(0.4, Math.max(0.10, (penumbraRadiusDeg - angDistanceDeg) / penumbraRadiusDeg * 0.4));
                drawEarthShadow(0, 0, 0, penAlpha, penumbraPx);
                // 本影（濃い影、赤銅色）
                if (angDistanceDeg < umbraRadiusDeg + angRadius) {
                    const umbAlpha = Math.min(0.7, Math.max(0.5, (umbraRadiusDeg - angDistanceDeg) / umbraRadiusDeg * 0.7));
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
    drawPlanet(planet, sun, limitingMagnitude, zeroMagSize, objectInformation) {
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
        if (planet.jpnName == "水星") {
            this.drawMercury(planet, limitingMagnitude, zeroMagSize, x, y);
        }
        else if (planet.jpnName == "金星") {
            this.drawVenus(planet, sun, limitingMagnitude, zeroMagSize, x, y);
        }
        else if (planet.jpnName == "火星") {
            this.drawMars(planet, limitingMagnitude, zeroMagSize, x, y);
        }
        else if (planet.jpnName == "木星") {
            this.drawJupiter(planet, limitingMagnitude, zeroMagSize, x, y);
        }
        else if (planet.jpnName == "土星") {
            this.drawSaturn(planet, limitingMagnitude, zeroMagSize, x, y);
        }
        else {
            const radius = Math.max(getStarSize(planet.getMagnitude(), limitingMagnitude, zeroMagSize), 1);
            this.ctx.beginPath();
            this.ctx.fillStyle = this.colorManager.getColor('solarSystem');
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            const dxy = Math.max(2, 0.8 * radius);
            this.ctx.fillText(planet.getJapaneseName(), x + dxy, y - dxy);
        }
    }
    drawMercury(mercury, limitingMagnitude, zeroMagSize, x, y) {
        const fov = Math.min(this.config.viewState.fieldOfViewRA, this.config.viewState.fieldOfViewDec);
        let radius = Math.max(this.canvas.width * (0.00093 / mercury.getDistance()) / this.config.viewState.fieldOfViewRA, 1);
        if (fov > 2) {
            radius = Math.max(getStarSize(mercury.getMagnitude(), limitingMagnitude, zeroMagSize), 1);
        }
        this.ctx.beginPath();
        this.ctx.fillStyle = this.colorManager.getColor('solarSystem');
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        const dxy = Math.max(2, 0.8 * radius);
        this.ctx.fillText(mercury.getJapaneseName(), x + dxy, y - dxy);
    }
    drawVenus(venus, sun, limitingMagnitude, zeroMagSize, x, y) {
        const fov = Math.min(this.config.viewState.fieldOfViewRA, this.config.viewState.fieldOfViewDec);
        if (fov > 2) {
            const radius = Math.max(getStarSize(venus.getMagnitude(), limitingMagnitude, zeroMagSize), 1);
            this.ctx.beginPath();
            this.ctx.fillStyle = this.colorManager.getColor('solarSystem');
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            const dxy = Math.max(2, 0.8 * radius);
            this.ctx.fillText(venus.getJapaneseName(), x + dxy, y - dxy);
        }
        else {
            const sunDeg = sun.getRaDec();
            const venusDeg = venus.getRaDec();
            const venusRad = venusDeg.toRad();
            const radius = this.canvas.width * (0.00232 / venus.getDistance()) / this.config.viewState.fieldOfViewRA;
            // 地球-金星-太陽
            const angleEVS = venusDeg.angDistanceFrom(venus.getXYZ().toRaDec());
            // k=0:新月 k=0.5:半月 k=1:満月
            const k = (1. - Math.cos(Math.PI - angleEVS * DEG_TO_RAD)) * 0.5;
            const SunInVenusNorthCoord = new RaDec(sunDeg.ra - venusDeg.ra, sunDeg.dec).toCartesian().rotateY(-Math.PI / 2 + venusRad.dec);
            // 南から、天球の外から見て反時計回りに測った、月から見た太陽の方向
            const angleSMS = Math.atan2(SunInVenusNorthCoord.y, SunInVenusNorthCoord.x);
            const littleSunDirection = new RaDec(venusDeg.ra + 0.5 * Math.sin(angleSMS) / Math.cos(venusRad.dec), venusDeg.dec - 0.5 * Math.cos(angleSMS));
            const littleCloserToSunXY = littleSunDirection.toCanvasXYifin(this.config, this.orientationData, true)[1];
            // 地球から金星の外縁を時計回りに見たとき、明から暗に転じるところの、右（西）から時計回りに測った角度
            const p = Math.atan2(littleCloserToSunXY.y - y, littleCloserToSunXY.x - x) + Math.PI * 0.5;
            this.drawMichikake(x, y, radius, k, p, this.colorManager.getColor('solarSystem'), this.colorManager.getColor('moonShade'));
            this.ctx.fillStyle = this.colorManager.getColor('solarSystem');
            const dxy = Math.max(2, 0.8 * radius);
            this.ctx.fillText(venus.getJapaneseName(), x + dxy, y - dxy);
        }
    }
    drawMars(mars, limitingMagnitude, zeroMagSize, x, y) {
        const fov = Math.min(this.config.viewState.fieldOfViewRA, this.config.viewState.fieldOfViewDec);
        let radius = Math.max(this.canvas.width * (0.0013 / mars.getDistance()) / this.config.viewState.fieldOfViewRA, 1);
        if (fov > 2) {
            radius = Math.max(getStarSize(mars.getMagnitude(), limitingMagnitude, zeroMagSize), 1);
        }
        this.ctx.beginPath();
        this.ctx.fillStyle = this.colorManager.getColor('solarSystem');
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        const dxy = Math.max(2, 0.8 * radius);
        this.ctx.fillText(mars.getJapaneseName(), x + dxy, y - dxy);
    }
    drawJupiter(jupiter, limitingMagnitude, zeroMagSize, x, y) {
        const fov = Math.min(this.config.viewState.fieldOfViewRA, this.config.viewState.fieldOfViewDec);
        if (fov > 3) {
            const radius = Math.max(getStarSize(jupiter.getMagnitude(), limitingMagnitude, zeroMagSize), 1);
            this.ctx.beginPath();
            this.ctx.fillStyle = this.colorManager.getColor('solarSystem');
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            const dxy = Math.max(2, 0.8 * radius);
            this.ctx.fillText(jupiter.getJapaneseName(), x + dxy, y - dxy);
        }
        else {
            const textXyList = [];
            const radius = this.canvas.width * (0.027 / jupiter.getDistance()) / this.config.viewState.fieldOfViewRA;
            this.ctx.beginPath();
            this.ctx.fillStyle = this.colorManager.getColor('solarSystem');
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            const dxy = Math.max(2, 0.8 * radius);
            textXyList.push({ x: x + dxy, y: y - dxy, text: jupiter.getJapaneseName() });
            const galileoRaDecs = SolarSystemPositionCalculator.calculateJupiterMoons(this.config.displayTime.jd, jupiter);
            for (const [name, raDec] of Object.entries(galileoRaDecs)) {
                const screenXY = raDec.toCanvasXYifin(this.config, this.orientationData, true);
                const { x: jx, y: jy } = screenXY[1];
                this.ctx.beginPath();
                this.ctx.fillStyle = this.colorManager.getColor('solarSystem');
                this.ctx.arc(jx, jy, 2, 0, Math.PI * 2);
                this.ctx.fill();
                textXyList.push({ x: jx + 2, y: jy - 2, text: name });
            }
            textXyList.sort((a, b) => b.x - a.x); // 右から左
            textXyList.forEach((textXy, index) => {
                if (index > 0) {
                    if (Math.abs(textXy.x - textXyList[index - 1].x) < 20) {
                        textXy.y += 14;
                    }
                }
                this.ctx.fillText(textXy.text, textXy.x, textXy.y);
            });
        }
    }
    drawSaturn(saturn, limitingMagnitude, zeroMagSize, x, y) {
        const fov = Math.min(this.config.viewState.fieldOfViewRA, this.config.viewState.fieldOfViewDec);
        if (fov > 2) {
            const radius = Math.max(getStarSize(saturn.getMagnitude(), limitingMagnitude, zeroMagSize), 1);
            this.ctx.beginPath();
            this.ctx.fillStyle = this.colorManager.getColor('solarSystem');
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            const dxy = Math.max(2, 0.8 * radius);
            this.ctx.fillText(saturn.getJapaneseName(), x + dxy, y - dxy);
        }
        else {
            const textXyList = [];
            const radius = this.canvas.width * (0.023 / saturn.getDistance()) / this.config.viewState.fieldOfViewRA;
            this.ctx.beginPath();
            this.ctx.fillStyle = this.colorManager.getColor('solarSystem');
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            const dxy = Math.max(2, 0.8 * radius);
            textXyList.push({ x: x + dxy, y: y - dxy, text: saturn.getJapaneseName() });
            const saturnMoonRaDecs = SolarSystemPositionCalculator.calculateSaturnMoons(this.config.displayTime.jd, saturn);
            for (const [name, raDec] of Object.entries(saturnMoonRaDecs)) {
                const screenXY = raDec.toCanvasXYifin(this.config, this.orientationData, true);
                const { x: sx, y: sy } = screenXY[1];
                this.ctx.beginPath();
                this.ctx.fillStyle = this.colorManager.getColor('solarSystem');
                this.ctx.arc(sx, sy, 1, 0, Math.PI * 2);
                this.ctx.fill();
                textXyList.push({ x: sx + 2, y: sy - 2, text: name });
            }
            textXyList.sort((a, b) => b.x - a.x); // 右から左
            textXyList.forEach((textXy, index) => {
                if (index > 0) {
                    if (Math.abs(textXy.x - textXyList[index - 1].x) < 20) {
                        textXy.y += 14;
                    }
                }
                this.ctx.fillText(textXy.text, textXy.x, textXy.y);
            });
        }
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
    drawMichikake(x, y, radius, k, p, day, night, ctx = this.ctx) {
        // 登場する角度は右方向から"時計回りに"測る
        ctx.beginPath();
        if (k < 0.5) {
            ctx.fillStyle = day;
            ctx.arc(x, y, radius, p - Math.PI, p);
            ctx.fill();
            ctx.fillStyle = night;
            ctx.beginPath();
            ctx.arc(x, y, radius, p, p + Math.PI);
            ctx.ellipse(x, y, radius, radius * (1 - 2 * k), p - Math.PI, 0, Math.PI);
            ctx.fill();
        }
        else {
            ctx.fillStyle = night;
            ctx.arc(x, y, radius, p, p + Math.PI);
            ctx.fill();
            ctx.fillStyle = day;
            ctx.beginPath();
            ctx.arc(x, y, radius, p - Math.PI, p);
            ctx.ellipse(x, y, radius, radius * (2 * k - 1), p, 0, Math.PI);
            ctx.fill();
        }
    }
    drawPlanetMotion() {
        if (this.config.planetMotion.planet.length == 0)
            return;
        const duration = this.config.planetMotion.duration;
        const interval = this.config.planetMotion.interval;
        const timeDisplayStep = this.config.planetMotion.timeDisplayStep;
        const timeDisplayContent = this.config.planetMotion.timeDisplayContent;
        const halfCount = Math.floor(duration / interval);
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
            for (let count = -halfCount; count <= halfCount; count++) {
                const jd = this.config.displayTime.jd + count * interval;
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