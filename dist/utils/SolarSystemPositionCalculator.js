import { isMinorObject, isMoon } from '../models/SolarSystemObjects.js';
import { isPlanet, isSun } from '../types/index.js';
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const epsilon = 23.4392911 * DEG_TO_RAD;
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
    /**
     * 時刻変更時に全天体の位置を更新
     */
    // static updateAllXYZ(objects: SolarSystemObjectBase[], jd: number): CartesianCoordinates[] {
    //     if (objects.length === 0) {
    //         console.warn('天体データがありません');
    //         return [];
    //     }
    //     const positions: CartesianCoordinates[] = [];
    //     objects.forEach(obj => {
    //         const position = this.calculateSolarXYZ(obj, jd);
    //         if (position) {
    //             positions.push(position);
    //         }
    //     });
    //     return positions;
    // }
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
        // const xyzs: CartesianCoordinates[] = [];
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
        const equatorialCoords = this.calculateEquatorialCoordinates(xyz, distance);
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
     */
    static updateMagnitude(obj, distance) {
        if (obj.jpnName === this.observerPlanetName) {
            obj.magnitude = 100;
            return;
        }
        const sun_obs2 = this.calculateDistance(this.observerPlanetPosition);
        const sun_ast2 = this.calculateDistance(obj.xyz);
        const obs_ast2 = distance;
        if (obj.type === 'sun') {
            obj.magnitude = -26.74;
        }
        else if (obj.type === 'moon') {
            obj.magnitude = -12.74;
        }
        else if (obj.type === 'planet') {
            if (obj.jpnName === '水星') {
                obj.magnitude = 1;
            }
            else if (obj.jpnName === '金星') {
                obj.magnitude = -3;
            }
            else if (obj.jpnName === '地球') {
                obj.magnitude = 1;
            }
            else if (obj.jpnName === '火星') {
                obj.magnitude = 2;
            }
            else if (obj.jpnName === '木星') {
                obj.magnitude = -2;
            }
            else if (obj.jpnName === '土星') {
                obj.magnitude = 5;
            }
            else if (obj.jpnName === '天王星') {
                obj.magnitude = 8;
            }
            else {
                obj.magnitude = 100;
            }
        }
        else if (obj.type === 'asteroid') {
            const asteroid = obj;
            const H = asteroid.orbit.H;
            const G = asteroid.orbit.G;
            if (H !== undefined && G !== undefined) {
                const { x, y, z } = obj.xyz;
                const a = Math.acos((sun_ast2 + obs_ast2 - sun_obs2) / (2 * distance * Math.sqrt(obs_ast2)));
                const phi1 = Math.exp(-3.33 * (Math.tan(a / 2)) ** 0.63);
                const phi2 = Math.exp(-1.87 * (Math.tan(a / 2)) ** 1.22);
                obj.magnitude = H - 2.5 * Math.log10((1 - G) * phi1 + G * phi2) + 5 * Math.log10(distance * Math.sqrt(obs_ast2));
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
            incl: (orbit.incl + orbit.dIncl * t) * DEG_TO_RAD,
            meanLong: (orbit.meanLong + orbit.dMeanLong * t) * DEG_TO_RAD,
            longPeri: (orbit.longPeri + orbit.dLongPeri * t) * DEG_TO_RAD,
            node: (orbit.node + orbit.dNode * t) * DEG_TO_RAD
        };
        const peri = elements.longPeri - elements.node;
        const meanAnomaly = (elements.meanLong - elements.longPeri) % (2 * Math.PI);
        // ケプラー方程式を解く
        let eccentricAnomaly = meanAnomaly + elements.e * Math.sin(meanAnomaly);
        let newE = meanAnomaly + elements.e * Math.sin(eccentricAnomaly);
        while (Math.abs(newE - eccentricAnomaly) > 0.00000001) {
            eccentricAnomaly = newE;
            newE = meanAnomaly + elements.e * Math.sin(eccentricAnomaly);
        }
        eccentricAnomaly = newE;
        // 軌道面での座標
        const x0 = elements.a * (Math.cos(eccentricAnomaly) - elements.e);
        const y0 = elements.a * Math.sqrt(1 - elements.e * elements.e) * Math.sin(eccentricAnomaly);
        // 赤道面への変換
        const cosPeri = Math.cos(peri);
        const sinPeri = Math.sin(peri);
        const cosNode = Math.cos(elements.node);
        const sinNode = Math.sin(elements.node);
        const cosIncl = Math.cos(elements.incl);
        const sinIncl = Math.sin(elements.incl);
        const Px = cosPeri * cosNode - sinPeri * cosIncl * sinNode;
        const Qx = -sinPeri * cosNode - cosPeri * cosIncl * sinNode;
        const Py = sinPeri * cosIncl * cosNode * cosEpsl + cosPeri * sinNode * cosEpsl - sinPeri * sinIncl * sinEpsl;
        const Qy = cosPeri * cosIncl * cosNode * cosEpsl - sinPeri * sinNode * cosEpsl - cosPeri * sinIncl * sinEpsl;
        const Pz = sinPeri * cosIncl * cosNode * sinEpsl + cosPeri * sinNode * sinEpsl + sinPeri * sinIncl * cosEpsl;
        const Qz = cosPeri * cosIncl * cosNode * sinEpsl - sinPeri * sinNode * sinEpsl + cosPeri * sinIncl * cosEpsl;
        const x = Px * x0 + Qx * y0;
        const y = Py * x0 + Qy * y0;
        const z = Pz * x0 + Qz * y0;
        planet.xyz = { x: x, y: y, z: z };
        // return {x: x, y: y, z: z};
    }
    // 月の位置を計算（簡易版）
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
        const siderealTime = window.config.siderealTime * DEG_TO_RAD;
        const xe = Xe - Math.cos(obsLat) * Math.cos(siderealTime) * 6378.14 / 1.49598e8; //au
        const ye = Ye - Math.cos(obsLat) * Math.sin(siderealTime) * 6378.14 / 1.49598e8; //au
        const ze = Ze - Math.sin(obsLat) * 6378.14 / 1.49598e8; //au
        const RA = (Math.atan2(ye, xe) * RAD_TO_DEG + 360) % 360; //deg
        const Dec = Math.atan2(ze, Math.sqrt(xe ** 2 + ye ** 2)) * RAD_TO_DEG; //deg
        dist *= 6378.14;
        moon.xyz = { x: xe, y: ye, z: ze };
        moon.raDec = { ra: RA, dec: Dec };
        console.log(RA, Dec);
        moon.distance = dist;
        //Ms, ws, lon_moon, lat_moon
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
        const t = (jd - orbit.t0) / 36525;
        const a = orbit.a;
        if (a == undefined)
            return;
        const e = orbit.e;
        const incl = orbit.incl * DEG_TO_RAD;
        const node = orbit.node * DEG_TO_RAD;
        const peri = orbit.peri * DEG_TO_RAD;
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
        const x = Px * x0 + Qx * y0;
        const y = Py * x0 + Qy * y0;
        const z = Pz * x0 + Qz * y0;
        minorObject.xyz = { x: x, y: y, z: z };
    }
    static calculateHyperbolicOrbitPositions(minorObject, jd) {
        const orbit = minorObject.orbit;
        if (orbit == undefined)
            return;
        if (orbit.e > 1.001)
            return;
        const t = (jd - orbit.t0) / 36525;
        const q = orbit.q;
        if (q == undefined)
            return;
        const e = orbit.e;
        const incl = orbit.incl * DEG_TO_RAD;
        const node = orbit.node * DEG_TO_RAD;
        const peri = orbit.peri * DEG_TO_RAD;
        minorObject.xyz = { x: 0, y: 0, z: 0 };
    }
    static calculateParabolicOrbitPositions(minorObject, jd) {
        const orbit = minorObject.orbit;
        if (orbit == undefined)
            return;
        if (orbit.e > 1.001)
            return;
        const t = (jd - orbit.t0) / 36525;
        const q = orbit.q;
        if (q == undefined)
            return;
        const e = orbit.e;
        const incl = orbit.incl * DEG_TO_RAD;
        const node = orbit.node * DEG_TO_RAD;
        const peri = orbit.peri * DEG_TO_RAD;
        return { x: 0, y: 0, z: 0 };
    }
}
SolarSystemPositionCalculator.observerPlanetName = '地球';
SolarSystemPositionCalculator.observerPlanetPosition = { x: 0, y: 0, z: 0 };
//# sourceMappingURL=SolarSystemPositionCalculator.js.map