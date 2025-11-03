const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
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
    static calculateYmdhmsJstFromJdTT(jd_TT) {
        const jd_JST = this.jdTTtoJST(jd_TT);
        return this.calculateYmdhmsFromJd(jd_JST);
    }
    static calculateYmdhmsFromJd(jd) {
        // https://eco.mtk.nao.ac.jp/koyomi/topics/html/topics2023_1.html
        const jdn = Math.floor(jd + 0.5);
        let L = jdn + 68569;
        const N = Math.floor(4 * L / 146097);
        L -= Math.floor(36524.25 * N + 0.75);
        const I = Math.floor(4000 * (L + 1) / 1461001);
        L -= Math.floor(1461 * I / 4) - 31;
        const J = Math.floor(80 * L / 2447);
        let d = L - Math.floor(2447 * J / 80);
        L = Math.floor(J / 11);
        let m = J - 12 * L + 2;
        let y = 100 * (N - 49) + I + L;
        const hms_second = ((jd + 0.5) % 1) * 86400;
        let hr = Math.floor(hms_second / 3600);
        let min = Math.floor((hms_second % 3600) / 60);
        let sec = Math.round(hms_second % 60);
        if (sec >= 60) {
            min += 1;
            sec -= 60;
        }
        else if (sec < 0) {
            min -= 1;
            sec += 60;
        }
        if (min >= 60) {
            hr += 1;
            min -= 60;
        }
        else if (min < 0) {
            hr -= 1;
            min += 60;
        }
        if (hr >= 24) {
            d += 1;
            hr -= 24;
        }
        else if (hr < 0) {
            d -= 1;
            hr += 24;
        }
        if (m > 12) {
            y += 1;
            m -= 12;
        }
        else if (m < 1) {
            y -= 1;
            m += 12;
        }
        const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (y % 4 == 0 && (y % 100 != 0 || y % 400 == 0)) {
            days[1] = 29;
        }
        if (d > days[m - 1]) {
            m += 1;
            d = 1;
        }
        else if (d < 1) {
            m -= 1;
            d = days[m - 1];
        }
        if (m > 12) {
            y += 1;
            m -= 12;
        }
        else if (m < 1) {
            y -= 1;
            m += 12;
        }
        return { year: y, month: m, day: d, hour: hr, minute: min, second: sec };
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
        const usedStar = config.displaySettings.usedStar;
        let lm = Math.min(12.0, Math.max(3.0, key1 - key2 * Math.log(Math.min(config.viewState.fieldOfViewRA, config.viewState.fieldOfViewDec) * 0.5)));
        if (usedStar == 'noStar') {
            lm = -2.0;
        }
        if (usedStar == 'to6') {
            lm = Math.min(lm, 6.0);
        }
        else if (usedStar == 'to10') {
            lm = Math.min(lm, 10.0);
        }
        return lm;
    }
}
//# sourceMappingURL=calculations.js.map