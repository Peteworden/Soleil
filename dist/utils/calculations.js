const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const epsilon = 23.4392911 * DEG_TO_RAD;
const cosEpsl = Math.cos(epsilon);
const sinEpsl = Math.sin(epsilon);
export class AstronomicalCalculator {
    static jdJSTtoJdTT(jdJST) {
        return jdJST - 0.375 + 0.0008;
    }
    static jdTTtoJST(jdTT) {
        return jdTT + 0.375 - 0.0008;
    }
    // ユリウス日を計算
    static calculateJdFromYmdhms(year, month, day, hour = 0, minute = 0, second = 0) {
        if (month <= 2) {
            year -= 1;
            month += 12;
        }
        let ans = Math.floor(365.25 * year) + Math.floor(year / 400)
            - Math.floor(year / 100) + Math.floor(30.59 * (month - 2))
            + day + hour / 24 + minute / 1440 + second / 86400
            + 1721088.5;
        return ans;
    }
    static jdTTFromYmdhmsJst(year, month, day, hour = 0, minute = 0, second = 0) {
        const jdJST = this.calculateJdFromYmdhms(year, month, day, hour, minute, second);
        return this.jdJSTtoJdTT(jdJST);
    }
    static calculateCurrentJdTT() {
        const now = new Date();
        return this.jdTTFromYmdhmsJst(now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
    }
    static calculateYmdhmJstFromJdTT(jd_TT) {
        const jd_JST = this.jdTTtoJST(jd_TT) + 1 / 2880;
        const A = Math.floor(jd_JST + 68569.5);
        const B = Math.floor(A / 36524.25);
        const C = A - Math.floor(36524.25 * B + 0.75);
        const E = Math.floor((C + 1) / 365.25025);
        const F = C - Math.floor(365.25 * E) + 31;
        const G = Math.floor(F / 30.59);
        let D = F - Math.floor(30.59 * G);
        const H = Math.floor(G / 11);
        let M = G - 12 * H + 2;
        let Y = 100 * (B - 49) + E + H;
        const Hr = Math.floor((jd_JST + 0.5 - Math.floor(jd_JST + 0.5)) * 24);
        const Mi = Math.floor((jd_JST + 0.5 - Math.floor(jd_JST + 0.5)) * 1440 - Hr * 60);
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
        const h = 24 * ((jd_UT + 0.5) % 1);
        const d_UT = jd_UT - h / 24 - 2451545.0;
        const ans = ((6.697375 + (0.065707485828 * d_UT) % 24 + 1.0027379 * h + 0.0854103 * t + 0.0000258 * t * t) % 24) * 15 * DEG_TO_RAD;
        return ans;
    }
    static calculateLocalSiderealTime(jd_TT, longitude) {
        const greenwichSiderealTime = this.calculateGreenwichSiderealTime(jd_TT);
        return greenwichSiderealTime + longitude * DEG_TO_RAD;
    }
    static limitingMagnitude(config) {
        const key1 = config.viewState.starSizeKey1;
        const key2 = config.viewState.starSizeKey2;
        const lm = Math.min(11.5, Math.max(5, key1 - key2 * Math.log(Math.min(config.viewState.fieldOfViewRA, config.viewState.fieldOfViewDec) / 2)));
        return lm;
    }
}
//# sourceMappingURL=calculations.js.map