const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const epsilon = 23.4392911 * DEG_TO_RAD;
const cosEpsl = Math.cos(epsilon);
const sinEpsl = Math.sin(epsilon);
export class AstronomicalCalculator {
    // ユリウス日を計算
    static calculateJdTT(year, month, day, hour = 0, minute = 0, second = 0) {
        if (month <= 2) {
            year -= 1;
            month += 12;
        }
        const a = Math.floor(year / 100);
        const b = 2 - a + Math.floor(a / 4);
        const jd = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;
        return jd + (hour + minute / 60 + second / 3600) / 24;
    }
    static calculateCurrentJdTT() {
        const now = new Date();
        return this.calculateJdTT(now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
    }
    static calculateJstYmdhmFromJdTT(jd_TT) {
        const jd_UT = jd_TT + 0.375 - 0.0008 + 1 / 2880;
        const A = Math.floor(jd_UT + 68569.5);
        const B = Math.floor(A / 36524.25);
        const C = A - Math.floor(36524.25 * B + 0.75);
        const E = Math.floor((C + 1) / 365.25025);
        const F = C - Math.floor(365.25 * E) + 31;
        const G = Math.floor(F / 30.59);
        let D = F - Math.floor(30.59 * G);
        const H = Math.floor(G / 11);
        let M = G - 12 * H + 2;
        let Y = 100 * (B - 49) + E + H;
        const Hr = Math.floor((jd_TT + 0.5 - Math.floor(jd_TT + 0.5)) * 24);
        const Mi = Math.floor((jd_TT + 0.5 - Math.floor(jd_TT + 0.5)) * 1440 - Hr * 60);
        if (M == 12 && D == 32) {
            Y += 1;
            M = 1;
            D = 1;
        }
        const ans = [Y, M, D, Hr, Mi];
        return ans;
    }
    // グリニッジ恒星時を計算 経度を足せば地方恒星時
    static calculateGreenwichSiderealTime(jd_TT) {
        const t = (jd_TT - 2451545.0) / 36525;
        // https://aa.usno.navy.mil/faq/GAST
        const jd_UT = jd_TT - 0.0008;
        const h = 24 * ((jd_TT + 0.5) % 1);
        const d_UT = jd_UT - h / 24 - 2451545.0;
        const ans = ((6.697375 + (0.065707485828 * d_UT) % 24 + 1.0027379 * h + 0.0854103 * t + 0.0000258 * t * t) % 24) * 15 * DEG_TO_RAD;
        return ans;
    }
    // 惑星の軌道要素を計算
    static calculatePlanetElements(planet, jd) {
        const t = (jd - planet.t0) / 36525;
        return {
            a: planet.a + planet.da * t,
            e: planet.e + planet.de * t,
            incl: (planet.incl + planet.dIncl * t) * DEG_TO_RAD,
            meanLong: (planet.meanLong + planet.dMeanLong * t) * DEG_TO_RAD,
            longPeri: (planet.longPeri + planet.dLongPeri * t) * DEG_TO_RAD,
            node: (planet.node + planet.dNode * t) * DEG_TO_RAD
        };
    }
    // 惑星の位置を計算
    static calculatePlanetPosition(planet, jd) {
        const elements = this.calculatePlanetElements(planet, jd);
        const peri = elements.longPeri - elements.node;
        const meanAnomaly = elements.meanLong - elements.longPeri;
        // ケプラー方程式を解く
        let eccentricAnomaly = meanAnomaly + elements.e * Math.sin(meanAnomaly);
        let newE = meanAnomaly + elements.e * Math.sin(eccentricAnomaly);
        while (Math.abs(newE - eccentricAnomaly) > 0.00000001) {
            eccentricAnomaly = newE;
            newE = meanAnomaly + elements.e * Math.sin(eccentricAnomaly);
        }
        eccentricAnomaly = newE;
        // 軌道面での座標
        const x = elements.a * (Math.cos(eccentricAnomaly) - elements.e);
        const y = elements.a * Math.sqrt(1 - elements.e * elements.e) * Math.sin(eccentricAnomaly);
        // 赤道面への変換
        const cosPeri = Math.cos(peri);
        const sinPeri = Math.sin(peri);
        const cosNode = Math.cos(elements.node);
        const sinNode = Math.sin(elements.node);
        const cosIncl = Math.cos(elements.incl);
        const sinIncl = Math.sin(elements.incl);
        // const x1 = x * cosPeri - y * sinPeri;
        // const y1 = x * sinPeri + y * cosPeri;
        // const z1 = 0;
        // const x2 = x1 * cosNode - y1 * sinNode;
        // const y2 = x1 * sinNode + y1 * cosNode;
        // const z2 = z1;
        // const x3 = x2;
        // const y3 = y2 * cosIncl - z2 * sinIncl;
        // const z3 = y2 * sinIncl + z2 * cosIncl;
        const coeffB = elements.a * Math.sqrt(1 - elements.e * elements.e);
        const Ax = elements.a * (cosPeri * cosNode - sinPeri * cosIncl * sinNode);
        const Bx = coeffB * (-sinPeri * cosNode - cosPeri * cosIncl * sinNode);
        const Ay = elements.a * (sinPeri * cosIncl * cosNode * cosEpsl + cosPeri * sinNode * cosEpsl - sinPeri * sinIncl * sinEpsl);
        const By = coeffB * (cosPeri * cosIncl * cosNode * cosEpsl - sinPeri * sinNode * cosEpsl - cosPeri * sinIncl * sinEpsl);
        const Az = elements.a * (sinPeri * cosIncl * cosNode * sinEpsl + cosPeri * sinNode * sinEpsl + sinPeri * sinIncl * cosEpsl);
        const Bz = coeffB * (cosPeri * cosIncl * cosNode * sinEpsl - sinPeri * sinNode * sinEpsl + cosPeri * sinIncl * cosEpsl);
        const x4 = Ax * (Math.cos(eccentricAnomaly) - elements.e) + Bx * Math.sin(eccentricAnomaly);
        const y4 = Ay * (Math.cos(eccentricAnomaly) - elements.e) + By * Math.sin(eccentricAnomaly);
        const z4 = Az * (Math.cos(eccentricAnomaly) - elements.e) + Bz * Math.sin(eccentricAnomaly);
        return {
            x: x4,
            y: y4,
            z: z4
        };
    }
    // 月の位置を計算（簡易版）
    static calculateMoonPosition(jd) {
        const t = (jd - 2451545.0) / 36525;
        // 月の平均軌道要素
        const meanLong = (218.3164477 + 481267.88123421 * t) % 360;
        const meanAnomaly = (134.9633964 + 477198.8675055 * t) % 360;
        const node = (125.0445550 - 1934.1361849 * t) % 360;
        // 摂動項
        const perturbation = 6.2886 * Math.sin(meanAnomaly * DEG_TO_RAD) +
            1.2740 * Math.sin((2 * meanLong - meanAnomaly) * DEG_TO_RAD) +
            0.6583 * Math.sin(2 * meanLong * DEG_TO_RAD) +
            0.2136 * Math.sin(2 * meanAnomaly * DEG_TO_RAD);
        const longitude = meanLong + perturbation;
        const latitude = 5.1281 * Math.sin((meanLong - node) * DEG_TO_RAD);
        return {
            ra: longitude,
            dec: latitude
        };
    }
}
//# sourceMappingURL=calculations.js.map