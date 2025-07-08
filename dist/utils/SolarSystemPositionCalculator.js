import { isPlanet } from '../types/index.js';
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
    static updateAllXYZ(objects, jd) {
        if (objects.length === 0) {
            console.warn('天体データがありません');
            return [];
        }
        const positions = [];
        objects.forEach(obj => {
            const position = this.calculateSolarXYZ(obj, jd);
            if (position) {
                positions.push(position);
            }
        });
        return positions;
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
        // const xyzs: CartesianCoordinates[] = [];
        objects.forEach(obj => {
            const xyz = this.calculateSolarXYZ(obj, jd);
            if (xyz) {
                obj.xyz = xyz;
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
     * 観測地の惑星の日心直交座標を計算（基準として使用）
     */
    // private static calculateObserverPlanetSolarXYZ(observerPlanetObject: SolarSystemObjectBase, jd: number): void {
    //     const observerPlanetData = observerPlanetObject.getData();
    //     if (observerPlanetData !== undefined) {
    //         const position = this.calculateSolarXYZ(observerPlanetData as any, jd);
    //         this.observerPlanetPosition = position;
    //     }
    // }
    /**
     * 個別天体の位置を更新
     */
    static updateObjectData(obj, jd) {
        const solarXYZ = obj.xyz;
        // 観測地の天体を中心とする直交座標
        let xyz;
        if (obj.type === 'sun') {
            // 太陽は観測地惑星からの相対位置
            xyz = {
                x: -this.observerPlanetPosition.x,
                y: -this.observerPlanetPosition.y,
                z: -this.observerPlanetPosition.z
            };
        }
        else if (obj.type === 'moon') {
            // 月は地球を中心とした位置を計算
            // const lunarPosition = AstronomicalCalculator.calculateMoonPosition(jd);
            // 地球の位置に月の相対位置を加算
            xyz = {
                x: solarXYZ.x,
                y: solarXYZ.y,
                z: solarXYZ.z
            };
        }
        else {
            xyz = {
                x: solarXYZ.x - this.observerPlanetPosition.x,
                y: solarXYZ.y - this.observerPlanetPosition.y,
                z: solarXYZ.z - this.observerPlanetPosition.z
            };
        }
        const distance = this.calculateDistance(xyz);
        const equatorialCoords = this.calculateEquatorialCoordinates(xyz, distance);
        // 天体の座標と距離を更新
        obj.xyz = xyz;
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
    static calculateSolarXYZ(object, jd) {
        if (object.type === 'sun') {
            return { x: 0, y: 0, z: 0 };
        }
        else if (object.type === 'moon') {
            return this.calculateMoonPosition(jd);
        }
        else if (isPlanet(object)) {
            const planet = object;
            return this.calculatePlanetPositions(planet.orbit, jd);
        }
        else if (object.type === 'asteroid' || object.type === 'comet') {
            if ('orbit' in object) {
                const minorObject = object.orbit;
                if (minorObject.e < 0.999) {
                    return this.calculateEllipticOrbitPositions(minorObject, jd);
                }
                else if (minorObject.e > 1.001) {
                    return this.calculateHyperbolicOrbitPositions(minorObject, jd);
                }
                else {
                    return this.calculateParabolicOrbitPositions(minorObject, jd);
                }
            }
        }
        else {
            return { x: 0, y: 0, z: 0 };
        }
    }
    // 惑星の位置を計算
    static calculatePlanetPositions(planet, jd) {
        const t = (jd - planet.t0) / 36525;
        const elements = {
            a: planet.a + planet.da * t,
            e: planet.e + planet.de * t,
            incl: (planet.incl + planet.dIncl * t) * DEG_TO_RAD,
            meanLong: (planet.meanLong + planet.dMeanLong * t) * DEG_TO_RAD,
            longPeri: (planet.longPeri + planet.dLongPeri * t) * DEG_TO_RAD,
            node: (planet.node + planet.dNode * t) * DEG_TO_RAD
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
        return { x: x, y: y, z: z };
    }
    // 月の位置を計算（簡易版）
    static calculateMoonPosition(jd) {
        const t = (jd - 2451545.0) / 36525;
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
        const yv = a * Math.sqrt(1 - e ** 2) * Math.sin(E);
        const v = Math.atan2(yv, xv);
        const dist = Math.sqrt(xv ** 2 + yv ** 2);
        const xh = dist * (Math.cos(Nm) * Math.cos(v + wm) - Math.sin(Nm) * Math.sin(v + wm) * Math.cos(i));
        const yh = dist * (Math.sin(Nm) * Math.cos(v + wm) + Math.cos(Nm) * Math.sin(v + wm) * Math.cos(i));
        const zh = dist * (Math.sin(v + wm) * Math.sin(i));
        const lon_moon = Math.atan2(yh, xh);
        const lat_moon = Math.asin(zh / dist);
        const lon_moon_perturbation = (-1.274 * Math.sin(Mm - 2 * D)
            + 0.658 * Math.sin(2 * D)
            - 0.186 * Math.sin(Ms)
            - 0.059 * Math.sin(2 * Mm - 2 * D)
            - 0.057 * Math.sin(Mm - 2 * D + Ms)
            + 0.053 * Math.sin(Mm + 2 * D)
            + 0.046 * Math.sin(2 * D - Ms)
            + 0.009 * Math.sin(2 * Mm + 2 * D));
        return {
            x: 1,
            y: 1,
            z: 1
        };
    }
    static calculateEllipticOrbitPositions(minorObject, jd) {
        const t = (jd - minorObject.t0) / 36525;
        const a = minorObject.a;
        if (a == undefined)
            return { x: 0, y: 0, z: 0 };
        const e = minorObject.e;
        const incl = minorObject.incl * DEG_TO_RAD;
        const node = minorObject.node * DEG_TO_RAD;
        const peri = minorObject.peri * DEG_TO_RAD;
        const m0 = minorObject.m0 * DEG_TO_RAD;
        // ケプラー方程式を解く
        const n = 0.01720209895 * Math.pow(a, -1.5); //平均日日運動(rad)
        const ma = (m0 + n * (jd - minorObject.t0)) % (2 * Math.PI); // mean anomaly
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
        return { x: x, y: y, z: z };
    }
    static calculateHyperbolicOrbitPositions(minorObject, jd) {
        const t = (jd - minorObject.t0) / 36525;
        const q = minorObject.q;
        if (q == undefined)
            return { x: 0, y: 0, z: 0 };
        const e = minorObject.e;
        const incl = minorObject.incl * DEG_TO_RAD;
        const node = minorObject.node * DEG_TO_RAD;
        const peri = minorObject.peri * DEG_TO_RAD;
        return { x: 0, y: 0, z: 0 };
    }
    static calculateParabolicOrbitPositions(minorObject, jd) {
        const t = (jd - minorObject.t0) / 36525;
        const q = minorObject.q;
        if (q == undefined)
            return { x: 0, y: 0, z: 0 };
        const e = minorObject.e;
        const incl = minorObject.incl * DEG_TO_RAD;
        const node = minorObject.node * DEG_TO_RAD;
        const peri = minorObject.peri * DEG_TO_RAD;
        return { x: 0, y: 0, z: 0 };
    }
}
SolarSystemPositionCalculator.observerPlanetName = '地球';
SolarSystemPositionCalculator.observerPlanetPosition = { x: 0, y: 0, z: 0 };
//# sourceMappingURL=SolarSystemPositionCalculator.js.map