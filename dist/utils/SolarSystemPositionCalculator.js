import { isMinorObject, isMoon } from '../models/SolarSystemObjects.js';
import { isPlanet, isSun } from '../types/index.js';
import { CoordinateConverter } from './coordinates.js';
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const epsilon = 0.4090926;
const cosEpsl = Math.cos(epsilon);
const sinEpsl = Math.sin(epsilon);
/**
 * 太陽系天体の位置計算クラス
 * 位置計算、座標変換、等級計算に特化
 */
export class SolarSystemPositionCalculator {
    /**
     * 観測地の天体を設定
     */
    static setObserverPlanetName(planetName) {
        this.observerPlanetName = planetName;
    }
    /**
     * 観測地の天体を取得
     */
    static getObserverPlanetName() {
        return this.observerPlanetName;
    }
    static updateAllData(objects, jd) {
        if (objects.length === 0) {
            console.warn('天体データがありません');
            return;
        }
        const observerPlanetObject = objects.find(obj => obj.jpnName === this.observerPlanetName);
        if (!observerPlanetObject) {
            console.warn(`観測地の惑星「${this.observerPlanetName}」が見つかりません`);
            return;
        }
        // すべての太陽系天体の日心直交座標を計算
        objects.forEach(obj => {
            // 原点は太陽
            // 月のみ地球から見た赤経・赤緯も計算、xyzが地球基準になる
            if (isMoon(obj)) {
                const sun = objects.find(obj => isSun(obj));
                if (sun) {
                    this.calculateXYZ(obj, jd, sun);
                }
                //月のxyzに地球のxyzを加算
                const earth = objects.find(obj => isPlanet(obj) && obj.jpnName === "地球");
                if (earth) {
                    obj.xyz.x += earth.xyz.x;
                    obj.xyz.y += earth.xyz.y;
                    obj.xyz.z += earth.xyz.z;
                }
            }
            else {
                this.calculateXYZ(obj, jd);
            }
        });
        // 観測地の惑星の日心直交座標をセット
        this.observerPlanetPosition = observerPlanetObject.xyz;
        // 全天体の位置と等級を更新
        objects.forEach(obj => {
            this.updateObjectData(obj, jd);
        });
    }
    /**
     * 個別天体の位置を更新
     */
    static updateObjectData(obj, jd) {
        if (isMoon(obj) && this.observerPlanetName === "地球") {
            //すでに地球基準の座標が設定されている
            return;
        }
        // 観測地の天体を中心とする直交座標
        const xyz = {
            x: obj.xyz.x - this.observerPlanetPosition.x,
            y: obj.xyz.y - this.observerPlanetPosition.y,
            z: obj.xyz.z - this.observerPlanetPosition.z
        };
        const distance = this.calculateDistance(xyz);
        const equatorialCoordsJ2000 = this.calculateEquatorialCoordinates(xyz, distance);
        const equatorialCoords = this.coordinateConverter.precessionEquatorial(equatorialCoordsJ2000, undefined, 'j2000', jd);
        // 天体の座標と距離と等級を更新
        obj.raDec = equatorialCoords;
        obj.distance = distance;
        this.updateMagnitude(obj, distance);
    }
    /**
     * 直交座標から赤道座標を計算
     */
    static calculateEquatorialCoordinates(position, distance) {
        const ra = Math.atan2(position.y, position.x) * 180 / Math.PI;
        const dec = Math.asin(position.z / distance) * 180 / Math.PI;
        return { ra, dec };
    }
    /**
     * 距離を計算
     */
    static calculateDistance(position) {
        const { x, y, z } = position;
        return Math.sqrt(x * x + y * y + z * z);
    }
    /**
     * 等級を更新（距離効果を考慮）
     * https://arxiv.org/abs/1808.01973
     * Computing Apparent Planetary Magnitudes for The Astronomical Almanac
     */
    static updateMagnitude(obj, distance) {
        if (obj.jpnName === this.observerPlanetName) {
            obj.magnitude = 100;
            return;
        }
        const sun_obs = this.calculateDistance(this.observerPlanetPosition);
        const sun_pln = this.calculateDistance(obj.xyz);
        const obs_pln = distance;
        if (obj.type === 'sun') {
            obj.magnitude = -26.74;
        }
        else if (obj.type === 'moon') {
            obj.magnitude = -12.74;
        }
        else if (obj.type === 'planet') {
            const i = Math.acos((sun_pln * sun_pln + obs_pln * obs_pln - sun_obs * sun_obs) / (2 * sun_pln * obs_pln)) * RAD_TO_DEG;
            if (obj.jpnName === '水星') {
                obj.magnitude = -0.613 + 0.06328 * i - 0.0016336 * i * i + 0.000033644 * i * i * i - 3.4565e-7 * i * i * i * i + 1.6893e-9 * i * i * i * i * i - 3.0334e-12 * i * i * i * i * i * i + 5 * Math.log10(obs_pln * sun_pln);
            }
            else if (obj.jpnName === '金星') {
                if (i <= 163.7) {
                    obj.magnitude = -4.384 - 0.001044 * i + 0.0003687 * i * i - 2.814e-6 * i * i * i + 8.938e-9 * i * i * i * i + 5 * Math.log10(obs_pln * sun_pln);
                }
                else {
                    obj.magnitude = -4.384 + 240.44228 - 2.81914 * i + 0.00839034 * i * i + 5 * Math.log10(obs_pln * sun_pln);
                }
            }
            else if (obj.jpnName === '地球') {
                obj.magnitude = 1;
            }
            else if (obj.jpnName === '火星') {
                if (i <= 50) {
                    obj.magnitude = -1.601 + 0.002267 * i - 0.0001302 * i ** 2 + 5 * Math.log10(obs_pln * sun_pln);
                }
                else if (50 < i && i <= 120) {
                    obj.magnitude = -1.601 + 1.234 - 0.02573 * i + 0.0003445 * i ** 2 + 5 * Math.log10(obs_pln * sun_pln);
                }
                else {
                    obj.magnitude = 1;
                }
            }
            else if (obj.jpnName === '木星') {
                if (i <= 12) {
                    obj.magnitude = -9.395 - 0.00037 * i + 0.000616 * i ** 2 + 5 * Math.log10(obs_pln * sun_pln);
                }
                else {
                    obj.magnitude = -9.395 - 0.033 - 2.5 * Math.log10(1 - 1.507 * (i / 180) - 0.363 * (i / 180) ** 2 - 0.062 * (i / 180) ** 3 + 2.809 * (i / 180) ** 4 - 1.876 * (i / 180) ** 5) + 5 * Math.log10(obs_pln * sun_pln);
                }
            }
            else if (obj.jpnName === '土星') {
                if (i <= 6.5) {
                    obj.magnitude = -8.914 + 1.825 * Math.sin(15 * DEG_TO_RAD) + 0.026 * i - 0.378 * Math.sin(15 * DEG_TO_RAD) + Math.exp(-2.25 * i) + 5 * Math.log10(sun_pln * obs_pln); //勝手にリングの傾きβ=15°とした
                }
                else if (6 < i && i < 150) {
                    obj.magnitude = -8.914 + 0.026 + 0.0002446 * i + 0.0002672 * i ** 2 - 1.505e-6 * i ** 3 + 4.767e-9 * i ** 4 + 5 * Math.log10(sun_pln * obs_pln);
                }
                else {
                    obj.magnitude = 0.6;
                }
            }
            else if (obj.jpnName === '天王星') {
                if (i < 3.1) {
                    obj.magnitude = -7.110 + 0.00009617 * i * i + 0.0001045 * i * i + 5 * Math.log10(obs_pln * sun_pln);
                }
                else {
                    obj.magnitude = 5.6;
                }
            }
            else if (obj.jpnName === '海王星') {
                if (i < 133) {
                    obj.magnitude = -7.00 + 0.007944 * Math.pow(i, 3) + 0.00009617 * i * i + 5 * Math.log10(obs_pln * sun_pln);
                }
                else {
                    obj.magnitude = 7.8;
                }
            }
            else {
                console.warn(`${obj.jpnName}の等級計算が未実装です`);
                obj.magnitude = 100;
            }
        }
        else if (obj.type === 'asteroid') {
            const asteroid = obj;
            const H = asteroid.orbit.H;
            const G = asteroid.orbit.G ?? 0.15;
            if (H !== undefined) {
                const a = Math.acos((sun_pln * sun_pln + obs_pln * obs_pln - sun_obs * sun_obs) / (2 * sun_pln * obs_pln));
                const phi1 = Math.exp(-3.33 * (Math.tan(a * 0.5)) ** 0.63);
                const phi2 = Math.exp(-1.87 * (Math.tan(a * 0.5)) ** 1.22);
                obj.magnitude = H - 2.5 * Math.log10((1 - G) * phi1 + G * phi2) + 5 * Math.log10(obs_pln * sun_pln);
            }
            else {
                obj.magnitude = 100;
            }
        }
        else if (obj.type === 'comet') {
            obj.magnitude = 100;
        }
    }
    /**
     * 観測地惑星の位置を取得（デバッグ用）
     */
    static getObserverPlanetPosition() {
        return { ...this.observerPlanetPosition };
    }
    static calculateXYZ(object, jd, sun) {
        if (isSun(object)) {
            object.xyz = { x: 0, y: 0, z: 0 };
        }
        else if (isMoon(object)) {
            this.calculateMoonPosition(object, jd, sun);
        }
        else if (isPlanet(object)) {
            this.calculatePlanetPositions(object, jd);
        }
        else if (isMinorObject(object)) {
            if ('orbit' in object) {
                const orbit = object.orbit;
                if (orbit.e < 0.999) {
                    this.calculateEllipticOrbitPositions(object, jd);
                }
                else if (orbit.e > 1.001) {
                    this.calculateHyperbolicOrbitPositions(object, jd);
                }
                else {
                    this.calculateParabolicOrbitPositions(object, jd);
                }
            }
        }
        else {
            return { x: 0, y: 0, z: 0 };
        }
    }
    // 惑星の位置を計算
    static calculatePlanetPositions(planet, jd) {
        const orbit = planet.orbit;
        const t = (jd - orbit.t0) / 36525;
        const elements = {
            a: orbit.a + orbit.da * t,
            e: orbit.e + orbit.de * t,
            incl: (orbit.incl + orbit.dIncl * t),
            meanLong: (orbit.meanLong + orbit.dMeanLong * t),
            longPeri: (orbit.longPeri + orbit.dLongPeri * t),
            node: (orbit.node + orbit.dNode * t)
        };
        const peri = elements.longPeri - elements.node;
        const meanAnomaly = ((elements.meanLong - elements.longPeri) % 360) * DEG_TO_RAD;
        const e = elements.e;
        // ケプラー方程式を解く
        let eccentricAnomaly = meanAnomaly + e * Math.sin(meanAnomaly);
        let newE = meanAnomaly + e * Math.sin(eccentricAnomaly);
        while (Math.abs(newE - eccentricAnomaly) > 0.00000001) {
            eccentricAnomaly = newE;
            newE = meanAnomaly + e * Math.sin(eccentricAnomaly);
        }
        eccentricAnomaly = newE;
        // 軌道面での座標
        const x0 = elements.a * (Math.cos(eccentricAnomaly) - e);
        const y0 = elements.a * Math.sqrt(1 - e * e) * Math.sin(eccentricAnomaly);
        // 赤道面への変換
        const { Px, Qx, Py, Qy, Pz, Qz } = this.calculatePQ(elements.incl, elements.node, peri);
        const x = Px * x0 + Qx * y0;
        const y = Py * x0 + Qy * y0;
        const z = Pz * x0 + Qz * y0;
        planet.xyz = { x: x, y: y, z: z };
    }
    // 月の位置
    static calculateMoonPosition(moon, jd, sun) {
        const d = jd - 2451543.5;
        const Ms = (356.0470 + 0.9856002585 * d) % 360 * DEG_TO_RAD;
        const Mm = (115.3654 + 13.0649929509 * d) % 360 * DEG_TO_RAD;
        const Nm = (125.1228 - 0.0529538083 * d) % 360 * DEG_TO_RAD;
        const ws = (282.9404 + 0.0000470935 * d) * DEG_TO_RAD;
        const wm = (318.0634 + 0.1643573223 * d) % 360 * DEG_TO_RAD;
        const e = 0.054900;
        const a = 60.2666;
        const i = 5.1454 * DEG_TO_RAD;
        const D = Mm + wm + Nm - Ms - ws;
        const F = Mm + wm;
        let E = Mm + e * Math.sin(Mm);
        if (Math.abs(E - Mm) > 0.0000001) {
            let newE = Mm + e * Math.sin(E);
            while (Math.abs(newE - E) > 0.0000001) {
                E = newE;
                newE = Mm + e * Math.sin(E);
            }
            E = newE;
        }
        const xv = a * (Math.cos(E) - e);
        const yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
        const v = Math.atan2(yv, xv);
        let dist = Math.sqrt(xv * xv + yv * yv);
        const xh = dist * (Math.cos(Nm) * Math.cos(v + wm) - Math.sin(Nm) * Math.sin(v + wm) * Math.cos(i));
        const yh = dist * (Math.sin(Nm) * Math.cos(v + wm) + Math.cos(Nm) * Math.sin(v + wm) * Math.cos(i));
        const zh = dist * (Math.sin(v + wm) * Math.sin(i));
        let lon_moon = Math.atan2(yh, xh);
        let lat_moon = Math.atan2(zh, Math.sqrt(xh * xh + yh * yh));
        lon_moon += (-1.274 * Math.sin(Mm - 2 * D)
            + 0.658 * Math.sin(2 * D)
            - 0.186 * Math.sin(Ms)
            - 0.059 * Math.sin(2 * Mm - 2 * D)
            - 0.057 * Math.sin(Mm - 2 * D + Ms)
            + 0.053 * Math.sin(Mm + 2 * D)
            + 0.046 * Math.sin(2 * D - Ms)
            + 0.041 * Math.sin(Mm - Ms)
            - 0.035 * Math.sin(D)
            - 0.031 * Math.sin(Mm + Ms)
            - 0.015 * Math.sin(2 * F - 2 * D)
            + 0.011 * Math.sin(Mm - 4 * D)) * DEG_TO_RAD
            - 0.0002437 * (jd - 2451545.0) / 365.25; //rad, J2000.0
        lat_moon += (-0.173 * Math.sin(F - 2 * D)
            - 0.055 * Math.sin(Mm - F - 2 * D)
            - 0.046 * Math.sin(Mm + F - 2 * D)
            + 0.033 * Math.sin(F + 2 * D)
            + 0.017 * Math.sin(2 * Mm + F)) * DEG_TO_RAD; //rad, J2000.0
        dist += -0.58 * Math.cos(Mm - 2 * D) - 0.46 * Math.cos(2 * D); //地球半径
        const Xe = Math.cos(lat_moon) * Math.cos(lon_moon) * dist * 6378.14 / 1.49598e8; //au
        const Ye = (-Math.sin(lat_moon) * sinEpsl + Math.cos(lat_moon) * Math.sin(lon_moon) * cosEpsl) * dist * 6378.14 / 1.49598e8; //au
        const Ze = (Math.sin(lat_moon) * cosEpsl + Math.cos(lat_moon) * Math.sin(lon_moon) * sinEpsl) * dist * 6378.14 / 1.49598e8; //au
        const obsLat = window.config.observationSite.latitude * DEG_TO_RAD;
        const siderealTime = window.config.siderealTime;
        const xe = Xe - Math.cos(obsLat) * Math.cos(siderealTime) * 6378.14 / 1.49598e8; //au
        const ye = Ye - Math.cos(obsLat) * Math.sin(siderealTime) * 6378.14 / 1.49598e8; //au
        const ze = Ze - Math.sin(obsLat) * 6378.14 / 1.49598e8; //au
        const RA = (Math.atan2(ye, xe) * RAD_TO_DEG + 360) % 360; //deg
        const Dec = Math.atan2(ze, Math.sqrt(xe ** 2 + ye ** 2)) * RAD_TO_DEG; //deg
        dist *= 6378.14;
        moon.xyz = { x: xe, y: ye, z: ze };
        moon.raDec = { ra: RA, dec: Dec };
        moon.distance = dist;
        moon.Ms = Ms;
        moon.ws = ws;
        moon.lon_moon = lon_moon;
        moon.lat_moon = lat_moon;
    }
    static calculateEllipticOrbitPositions(minorObject, jd) {
        const orbit = minorObject.orbit;
        if (orbit == undefined)
            return;
        if (orbit.e > 0.999)
            return;
        const a = orbit.a;
        if (a == undefined)
            return;
        const e = orbit.e;
        const m0 = orbit.m0 * DEG_TO_RAD;
        // ケプラー方程式を解く
        const n = 0.01720209895 * Math.pow(a, -1.5); //平均日日運動(rad)
        const ma = (m0 + n * (jd - orbit.t0)) % (2 * Math.PI); // mean anomaly
        let ea = ma + e * Math.sin(ma); // eccentric anomaly
        let newE = ma + e * Math.sin(ea);
        while (Math.abs(newE - ea) > 0.00000001) {
            ea = newE;
            newE = ma + e * Math.sin(ea);
        }
        ea = newE;
        // 軌道面での座標
        const x0 = a * (Math.cos(ea) - e);
        const y0 = a * Math.sqrt(1 - e * e) * Math.sin(ea);
        // 赤道面への変換
        const { Px, Qx, Py, Qy, Pz, Qz } = this.calculatePQ(orbit.incl, orbit.node, orbit.peri);
        const x = Px * x0 + Qx * y0;
        const y = Py * x0 + Qy * y0;
        const z = Pz * x0 + Qz * y0;
        minorObject.xyz = { x: x, y: y, z: z };
    }
    static calculateParabolicOrbitPositions(minorObject, jd) {
        const orbit = minorObject.orbit;
        if (orbit == undefined)
            return;
        const q = orbit.q;
        const { Px, Qx, Py, Qy, Pz, Qz } = this.calculatePQ(orbit.incl, orbit.node, orbit.peri);
        const b = Math.atan(54.80779386 * Math.pow(q, 1.5) / (jd - orbit.t0));
        const sign = Math.tan(b / 2) >= 0 ? 1 : -1;
        const g = sign * Math.atan(Math.pow(sign * Math.tan(b / 2), 1 / 3));
        const tanv2 = 2 / Math.tan(2 * g);
        const x = q * Px * (1 - tanv2 ** 2) + 2 * q * Qx * tanv2;
        const y = q * Py * (1 - tanv2 ** 2) + 2 * q * Qy * tanv2;
        const z = q * Pz * (1 - tanv2 ** 2) + 2 * q * Qz * tanv2;
        minorObject.xyz = { x: x, y: y, z: z };
    }
    static calculateHyperbolicOrbitPositions(minorObject, jd) {
        const orbit = minorObject.orbit;
        if (orbit == undefined)
            return;
        const q = orbit.q;
        const e = orbit.e;
        const { Px, Qx, Py, Qy, Pz, Qz } = this.calculatePQ(orbit.incl, orbit.node, orbit.peri);
        const a = q / (1 - e);
        const mu = 0.01720209895 * Math.pow(Math.abs(a), -1.5);
        const mut_tp = mu * Math.abs(jd - orbit.t0);
        function f(s) {
            return e * (s - 1 / s) * 0.5 - Math.log(s) - mut_tp;
        }
        function fp(s) {
            return e * (1 + 1 / (s * s)) * 0.5 - 1 / s;
        }
        let s = Math.exp(mut_tp / e);
        if (s == Infinity)
            s = 2 * mut_tp / e;
        let snew = Math.max(s - f(s) / fp(s), 1.0);
        while (Math.abs(f(snew)) > 0.000001 || Math.abs(snew - s) > 0.000001) {
            s = snew;
            snew = Math.max(s - f(s) / fp(s), 1.0);
        }
        if (jd < orbit.t0)
            s = 1 / snew;
        else
            s = snew;
        const coefP = -a * 0.5 * (2 * e - s - 1 / s);
        const coefQ = -a * 0.5 * Math.sqrt(e * e - 1) * (s - 1 / s);
        const x = coefP * Px + coefQ * Qx;
        const y = coefP * Py + coefQ * Qy;
        const z = coefP * Pz + coefQ * Qz;
        minorObject.xyz = { x: x, y: y, z: z };
    }
    static calculatePQ(inclDec, nodeDec, periDec) {
        const incl = inclDec * DEG_TO_RAD;
        const node = nodeDec * DEG_TO_RAD;
        const peri = periDec * DEG_TO_RAD;
        const cosPeri = Math.cos(peri);
        const sinPeri = Math.sin(peri);
        const cosNode = Math.cos(node);
        const sinNode = Math.sin(node);
        const cosIncl = Math.cos(incl);
        const sinIncl = Math.sin(incl);
        const Px = cosPeri * cosNode - sinPeri * cosIncl * sinNode;
        const Qx = -sinPeri * cosNode - cosPeri * cosIncl * sinNode;
        const Py = sinPeri * cosIncl * cosNode * cosEpsl + cosPeri * sinNode * cosEpsl - sinPeri * sinIncl * sinEpsl;
        const Qy = cosPeri * cosIncl * cosNode * cosEpsl - sinPeri * sinNode * cosEpsl - cosPeri * sinIncl * sinEpsl;
        const Pz = sinPeri * cosIncl * cosNode * sinEpsl + cosPeri * sinNode * sinEpsl + sinPeri * sinIncl * cosEpsl;
        const Qz = cosPeri * cosIncl * cosNode * sinEpsl - sinPeri * sinNode * sinEpsl + cosPeri * sinIncl * cosEpsl;
        return { Px: Px, Qx: Qx, Py: Py, Qy: Qy, Pz: Pz, Qz: Qz };
    }
}
SolarSystemPositionCalculator.observerPlanetName = '地球';
SolarSystemPositionCalculator.observerPlanetPosition = { x: 0, y: 0, z: 0 };
SolarSystemPositionCalculator.coordinateConverter = new CoordinateConverter();
//# sourceMappingURL=SolarSystemPositionCalculator.js.map