import { Moon, isPlanet, isSun, isMinorObject, isMoon, isOrbitalObject } from '../models/SolarSystemObjects.js';
import { COS_EPSL, DEG_TO_RAD, EPSILON, RAD_TO_DEG, SIN_EPSL } from './constants.js';
import { acosdeg, acosrad } from './mathUtils.js';
import { Cartesian, RaDec } from './coordinates/index.js';
/**
 * 太陽系天体の位置計算クラス
 * 位置計算、座標変換、等級計算に特化
 */
export class SolarSystemPositionCalculator {
    /**
     * 観測地の天体を設定
     */
    static setObserverPlanetName() {
        const config = window.config;
        if (config && config.observationSite) {
            this.observationSite = config.observationSite;
        }
        else {
            this.observationSite.observerPlanet = '地球';
        }
    }
    /**
     * 観測地の天体を取得
     */
    static getObserverPlanetName() {
        return this.observationSite.observerPlanet;
    }
    static updateAllData(objects, jd, observationSite) {
        this.observationSite = observationSite;
        if (objects.length === 0) {
            console.warn('天体データがありません');
            return;
        }
        const observerPlanetObject = objects.find(obj => obj.jpnName === this.observationSite.observerPlanet);
        if (!observerPlanetObject) {
            console.warn(`観測地の惑星「${this.observationSite.observerPlanet}」が見つかりません`);
            return;
        }
        // すべての太陽系天体の日心直交座標を計算
        // 月のみ地球から見た赤経・赤緯も計算、xyzが地球基準になる
        objects.forEach(obj => {
            this.calculateXYZ(obj, jd);
        });
        const moon = objects.find(obj => isMoon(obj));
        const earth = objects.find(obj => isPlanet(obj) && obj.jpnName === "地球");
        if (moon && earth) {
            moon.xyz.x += earth.xyz.x;
            moon.xyz.y += earth.xyz.y;
            moon.xyz.z += earth.xyz.z;
        }
        // 全天体の位置と等級を更新
        objects.forEach(obj => {
            this.updateObjectData(obj, jd, observerPlanetObject.xyz);
        });
    }
    static oneObjectData(objects0, objName, jd, observationSite) {
        this.observationSite = observationSite;
        if (objects0.length === 0) {
            console.warn('天体データがありません');
            return undefined;
        }
        let target;
        if (objects0.find(obj => obj.jpnName === objName)) {
            target = this.deepCopySolarSystemObject(objects0.find(obj => obj.jpnName === objName));
        }
        else {
            console.warn(`天体「${objName}」が見つかりません`);
            return undefined;
        }
        let observer;
        if (objects0.find(obj => obj.jpnName === observationSite.observerPlanet)) {
            observer = this.deepCopySolarSystemObject(objects0.find(obj => obj.jpnName === observationSite.observerPlanet));
        }
        else {
            console.warn(`観測地の天体「${observationSite.observerPlanet}」が見つかりません`);
            return undefined;
        }
        this.calculateXYZ(target, jd);
        this.calculateXYZ(observer, jd);
        let earth;
        if (isMoon(target)) {
            if (observer.jpnName == "地球") {
                earth = observer;
            }
            else {
                earth = this.deepCopySolarSystemObject(objects0.find(obj => isPlanet(obj) && obj.jpnName === "地球"));
                this.calculateXYZ(earth, jd);
            }
            target.xyz.x += earth.xyz.x;
            target.xyz.y += earth.xyz.y;
            target.xyz.z += earth.xyz.z;
        }
        else if (isMoon(observer)) {
            if (target.jpnName == "地球") {
                earth = target;
            }
            else {
                earth = this.deepCopySolarSystemObject(objects0.find(obj => isPlanet(obj) && obj.jpnName === "地球"));
                this.calculateXYZ(earth, jd);
            }
            observer.xyz.x += earth.xyz.x;
            observer.xyz.y += earth.xyz.y;
            observer.xyz.z += earth.xyz.z;
        }
        this.updateObjectData(target, jd, observer.xyz);
        return target;
    }
    /**
     * 個別天体の位置を更新
     */
    static updateObjectData(obj, jd, observerPosition) {
        if (isMoon(obj) && this.observationSite.observerPlanet === "地球") {
            obj.raDec = obj.raDec.precess(undefined, 'j2000', jd);
            return;
        }
        // 観測地の天体を中心とする直交座標
        const xyz = obj.xyz.subtract(observerPosition);
        obj.raDec = xyz.toRaDec().precess(undefined, 'j2000', jd);
        obj.distance = xyz.distance();
        this.updateMagnitude(obj, observerPosition);
    }
    /**
     * 等級を更新
     * https://arxiv.org/abs/1808.01973
     * Computing Apparent Planetary Magnitudes for The Astronomical Almanac
     */
    static updateMagnitude(obj, observerPosition) {
        if (obj.jpnName === this.observationSite.observerPlanet) {
            obj.magnitude = 100;
            return;
        }
        const sun_obs = observerPosition.distance();
        const sun_pln = obj.xyz.distance();
        const obs_pln = obj.distance;
        if (obj.type === 'sun') {
            obj.magnitude = -26.74;
        }
        else if (obj.type === 'moon') {
            obj.magnitude = -12.74;
        }
        else if (obj.type === 'planet') {
            const i = acosdeg((sun_pln * sun_pln + obs_pln * obs_pln - sun_obs * sun_obs) / (2 * sun_pln * obs_pln));
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
            if (H != null) {
                const a = acosrad((sun_pln * sun_pln + obs_pln * obs_pln - sun_obs * sun_obs) / (2 * sun_pln * obs_pln));
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
    static calculateXYZ(object, jd) {
        if (isSun(object)) {
            object.xyz = new Cartesian(0, 0, 0);
        }
        else if (isMoon(object)) {
            this.calculateMoonPosition(object, jd);
        }
        else if (isPlanet(object)) {
            this.calculatePlanetPositions(object, jd);
        }
        else if (isMinorObject(object)) {
            if (isOrbitalObject(object)) {
                const orbit = object.orbit;
                if (orbit.e < 0.99999999999999999) {
                    this.calculateEllipticOrbitPositions(object, jd);
                }
                else if (orbit.e > 1.0000000000000001) {
                    this.calculateHyperbolicOrbitPositions(object, jd);
                }
                else {
                    this.calculateParabolicOrbitPositions(object, jd);
                }
            }
        }
        else {
            return new Cartesian(0, 0, 0);
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
        planet.xyz = new Cartesian(x, y, z);
    }
    // 月の位置
    static calculateMoonPosition(moon, jd) {
        const d = jd - 2451543.5;
        const Ms = (356.0470 + 0.9856002585 * d) % 360 * DEG_TO_RAD;
        const Mm = (115.3654 + 13.0649929509 * d) % 360 * DEG_TO_RAD;
        const Nm = (125.1228 - 0.0529538083 * d) % 360 * DEG_TO_RAD;
        const ws = (282.9404 + 0.0000470935 * d) % 360 * DEG_TO_RAD;
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
        const Ye = (-Math.sin(lat_moon) * SIN_EPSL + Math.cos(lat_moon) * Math.sin(lon_moon) * COS_EPSL) * dist * 6378.14 / 1.49598e8; //au
        const Ze = (Math.sin(lat_moon) * COS_EPSL + Math.cos(lat_moon) * Math.sin(lon_moon) * SIN_EPSL) * dist * 6378.14 / 1.49598e8; //au
        const obsLat = window.config.observationSite.latitude * DEG_TO_RAD;
        const siderealTime = window.config.siderealTime;
        const xe = Xe - Math.cos(obsLat) * Math.cos(siderealTime) * 6378.14 / 1.49598e8; //au
        const ye = Ye - Math.cos(obsLat) * Math.sin(siderealTime) * 6378.14 / 1.49598e8; //au
        const ze = Ze - Math.sin(obsLat) * 6378.14 / 1.49598e8; //au
        const RA = (Math.atan2(ye, xe) * RAD_TO_DEG + 360) % 360; //deg
        const Dec = Math.atan2(ze, Math.sqrt(xe ** 2 + ye ** 2)) * RAD_TO_DEG; //deg
        dist *= 6378.14;
        moon.xyz = new Cartesian(xe, ye, ze);
        moon.raDec = new RaDec(RA, Dec);
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
        if (orbit.t0 == undefined) {
            // (window as any).showErrorMessage(`${minorObject.jpnName}の元期が未設定です`);
            return;
        }
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
        minorObject.xyz = new Cartesian(x, y, z);
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
        minorObject.xyz = new Cartesian(x, y, z);
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
        minorObject.xyz = new Cartesian(x, y, z);
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
        const Py = sinPeri * cosIncl * cosNode * COS_EPSL + cosPeri * sinNode * COS_EPSL - sinPeri * sinIncl * SIN_EPSL;
        const Qy = cosPeri * cosIncl * cosNode * COS_EPSL - sinPeri * sinNode * COS_EPSL - cosPeri * sinIncl * SIN_EPSL;
        const Pz = sinPeri * cosIncl * cosNode * SIN_EPSL + cosPeri * sinNode * SIN_EPSL + sinPeri * sinIncl * COS_EPSL;
        const Qz = cosPeri * cosIncl * cosNode * SIN_EPSL - sinPeri * sinNode * SIN_EPSL + cosPeri * sinIncl * COS_EPSL;
        return { Px: Px, Qx: Qx, Py: Py, Qy: Qy, Pz: Pz, Qz: Qz };
    }
    static calculateJupiterMoons(jd, jupiter) {
        function doubleSin(A1, T1, phi1, A2, T2, phi2, C) {
            return A1 * Math.sin(2 * Math.PI * (jd - 2460700) / T1 + phi1) + A2 * Math.sin(2 * Math.PI * (jd - 2460700) / T2 + phi2) + C;
        }
        const io = [
            [2.81902066e-03, 1.76913779e+00, 8.65841524e-01, 1.74598769e-05, 4.86827421e+02, 2.66915800e+00, -2.18722549e-07],
            [2.81749741e-03, 1.76913780e+00, -7.05455552e-01, 1.74491534e-05, 4.86856291e+02, 4.24131033e+00, 8.18597552e-08],
            [0.00010859262101371663, 1.769140962458129, -0.3257986471267499, 0, 1, 0, -1.3007560448464165e-07]
        ];
        const europa = [
            [4.48458800e-03, 3.55118035e+00, -9.02192463e-01, 6.26054071e-05, 4.86569848e+02, -4.74084307e-01, -8.69788604e-07],
            [4.48339424e-03, 3.55118004e+00, -2.47369227e+00, 6.26447647e-05, 4.87167668e+02, 1.10308902e+00, 2.64572475e-07],
            [1.68287262e-04, 3.55119272e+00, -1.87783527e+00, 0, 1, 0, 4.81407414e-07]
        ];
        const ganymede = [
            [7.15463873e-03, 7.15455397e+00, 2.92727313e+00, 6.59854992e-06, 4.78597640e+02, 2.60102925e+00, -2.00450346e-05],
            [7.15015296e-03, 7.15455414e+00, 1.35593375e+00, 6.52410267e-06, 4.95415244e+02, -1.96356203e+00, 8.13836093e-06],
            [2.92016360e-04, 7.15446463e+00, 1.71476937e+00, 0, 1, 0, -3.35154035e-08]
        ];
        const callisto = [
            [1.25841245e-02, 1.66890172e+01, 2.15602328e-01, 4.53197520e-05, 8.34464401e+00, -1.31205372e+00, -1.33895795e-04],
            [1.25786592e-02, 1.66890142e+01, -1.35561583e+00, 4.53041567e-05, 8.34463367e+00, -2.88356795e+00, -2.38334693e-05],
            [4.28550326e-04, 1.66890365e+01, -9.48956811e-01, 0, 1, 0, -2.54730259e-06]
        ];
        const galileo = {
            "Io": io,
            "Eur": europa,
            "Gan": ganymede,
            "Cal": callisto,
        };
        const jupiterObservingCartesian = jupiter.getRaDec().precess(undefined, jd, 'j2000').toCartesian(jupiter.getDistance());
        const galileoRaDecs = {};
        for (const [name, moon] of Object.entries(galileo)) {
            const moonJupitercenEclpXyz = moon.map(([A1, T1, phi1, A2, T2, phi2, C]) => doubleSin(A1, T1, phi1, A2, T2, phi2, C));
            const moonJupitercenRaDecCartesian = new Cartesian(moonJupitercenEclpXyz[0], moonJupitercenEclpXyz[1], moonJupitercenEclpXyz[2]).rotateX(EPSILON);
            const moonRaDecJ2000 = moonJupitercenRaDecCartesian.add(jupiterObservingCartesian).toRaDec();
            galileoRaDecs[name] = moonRaDecJ2000.precess(undefined, 'j2000', jd);
        }
        return galileoRaDecs;
    }
    static calculateSaturnMoons(jd, saturn) {
        function doubleSin(A1, T1, phi1, A2, T2, phi2, C) {
            return A1 * Math.sin(2 * Math.PI * (jd - 2460700) / T1 + phi1) + A2 * Math.sin(2 * Math.PI * (jd - 2460700) / T2 + phi2) + C;
        }
        const titan = [
            [8.13324323e-03, 1.59454546e+01, -1.38704895e+00, -1.16677669e-04, 7.97298247e+00, -7.27356118e+00, -3.44120801e-04],
            [7.26386494e-03, 1.59454528e+01, 3.27984535e+00, 1.04227881e-04, 7.97297949e+00, 5.34643083e-01, 7.17235537e-05],
            [3.79423154e-03, 1.59454464e+01, 3.52786814e-01, 5.44443719e-05, 7.97297511e+00, -2.39276352e+00, -2.72850500e-06]
        ];
        const moons = {
            "Titan": titan,
        };
        const saturnObservingCartesian = saturn.getRaDec().precess(undefined, jd, 'j2000').toCartesian(saturn.getDistance());
        const saturnMoonRaDecs = {};
        for (const [name, moon] of Object.entries(moons)) {
            const moonSaturncenEclpXyz = moon.map(([A1, T1, phi1, A2, T2, phi2, C]) => doubleSin(A1, T1, phi1, A2, T2, phi2, C));
            const moonSaturncenRaDecCartesian = new Cartesian(moonSaturncenEclpXyz[0], moonSaturncenEclpXyz[1], moonSaturncenEclpXyz[2]).rotateX(EPSILON);
            const moonRaDecJ2000 = moonSaturncenRaDecCartesian.add(saturnObservingCartesian).toRaDec();
            saturnMoonRaDecs[name] = moonRaDecJ2000.precess(undefined, 'j2000', jd);
        }
        return saturnMoonRaDecs;
    }
    /**
     * 太陽系天体オブジェクトのディープコピーを作成（メソッドを保持）
     */
    static deepCopySolarSystemObject(obj) {
        // 元のオブジェクトのコンストラクタを使用して新しいインスタンスを作成
        const copy = new obj.constructor({
            jpnName: obj.jpnName,
            hiraganaName: obj.hiraganaName,
            engName: obj.engName,
            type: obj.type,
            xyz: { x: obj.xyz.x, y: obj.xyz.y, z: obj.xyz.z },
            raDec: { ra: obj.raDec.ra, dec: obj.raDec.dec },
            distance: obj.distance,
            magnitude: obj.magnitude
        });
        // 軌道要素がある場合はコピー（Planetクラスの場合）
        if ('orbit' in obj && obj.orbit) {
            copy.orbit = { ...obj.orbit };
        }
        // Moonクラスの追加プロパティをコピー
        if (obj instanceof Moon) {
            copy.Ms = obj.Ms;
            copy.ws = obj.ws;
            copy.lon_moon = obj.lon_moon;
            copy.lat_moon = obj.lat_moon;
        }
        return copy;
    }
}
SolarSystemPositionCalculator.observationSite = {
    observerPlanet: '地球',
    name: 'カスタム',
    latitude: 0,
    longitude: 0,
    timezone: 0
};
//# sourceMappingURL=SolarSystemPositionCalculator.js.map