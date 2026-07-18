import { StarChartConfig, ViewState } from '../types/index.js';
import { DEG_TO_RAD } from '../utils/constants.js';

export class AstronomicalCalculator {
    // static YmdhmsLocalFromYmdhmsUtc(
    //     yr: number, mo: number, dy: number, hr: number, mi: number, sc: number, timezone: number
    // ): { year: number, month: number, day: number, hour: number, minute: number, second: number } {
    //     hr += timezone;
    //     if (hr > 24) {
    //         hr -= 24;
    //         dy++;
    //     }
    //     let daysOfMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 11];
    //     const isUruu = (yr % 4 === 0 && yr % 100 != 0) || (yr % 400 === 0);
    //     if (isUruu) daysOfMonth[1] = 29;
    //     if (daysOfMonth[mo - 1] < dy) {
    //         dy -= daysOfMonth[mo - 1];
    //         mo += 1;
    //     }
    //     if (mo > 12) {
    //         mo -= 12;
    //         yr += 1;
    //     }
    //     return {year: yr, month: mo, day: dy, hour: hr, minute: mi, second: sc};
    // }

    static jdUTCtoJdTT(jdUTC: number): number {
        return jdUTC + 0.0008;
    }

    static jdJSTtoJdTT(jdJST: number): number {
        return jdJST - 0.375 + 0.0008;
    }

    static jdTTtoUTC(jdTT: number): number {
        return jdTT - 0.0008;
    }

    static jdTTtoJST(jdTT: number): number {
        return jdTT + 0.375 - 0.0008;
    }

    static isGregorianUtc(yr: number, mo: number, dy: number): String {
        // 1582年10月4日の翌日が1582年10月15日になった
        const isGregorian = (yr > 1582) ||
            (yr === 1582 && mo > 10) ||
            (yr === 1582 && mo === 10 && dy >= 15);
        const isJulian = (yr < 1582) ||
            (yr === 1582 && mo < 10) ||
            (yr === 1582 && mo === 10 && dy <= 4);
        return isGregorian ? 'G' : (isJulian ? 'J' : 'mid');
    }

    // ユリウス日を計算
    static calculateJdFromYmdhmsUtc(year: number, month: number, day: number, hour: number = 0, minute: number = 0, second: number = 0): number {
        // ★ 時刻のアンダーフロー/オーバーフローを日数に変換して正規化する
        // hour - 9 などでマイナスになっても、Math.floor を使えば正しく前日に繰り下がります
        const extraDays = Math.floor(hour / 24);
        day += extraDays;
        hour -= extraDays * 24;

        // 分・秒も同様に安全のため正規化（通常は不要ですがより堅牢になります）
        const extraMins = Math.floor(minute / 60);
        hour += extraMins;
        minute -= extraMins * 60;

        const extraSecs = Math.floor(second / 60);
        minute += extraSecs;
        second -= extraSecs * 60;

        // 再度日数の繰り上がりをチェック
        const extraDays2 = Math.floor(hour / 24);
        day += extraDays2;
        hour -= extraDays2 * 24;

        // 暦の切り替え判定（完全に正規化されたUTC年月日で行う）
        const calendarType = this.isGregorianUtc(year, month, day);

        if (month <= 2) {
            year -= 1;
            month += 12;
        }
        let ans = Math.floor(365.25 * year)
            + Math.floor(30.6001 * (month + 1))
            + day
            + hour / 24
            + minute / 1440
            + second / 86400
            + 1720994.5;

        // グレゴリオ暦とユリウス暦による修正項の分岐
        if (this.isGregorianUtc(year, month, day) === 'G') {
            // グレゴリオ暦の世紀末閏年補正
            const a = Math.floor(year / 100);
            ans += 2 - a + Math.floor(a / 4);
        } else {
            // ユリウス暦のときは世紀末補正を入れない
            //（1721088.5 基準から 1720994.5 基準に変更したため、ユリウス暦時は一律 +3 される形で相殺されます）
            ans += 3;
        }

        return ans;
    }

    static jdTTFromYmdhmsJst(year: number, month: number, day: number, hour: number = 0, minute: number = 0, second: number = 0): number {
        const jdUtc = this.calculateJdFromYmdhmsUtc(year, month, day, hour - 9, minute, second);
        return this.jdUTCtoJdTT(jdUtc);
    }

    static calculateCurrentJdTT(): number {
        const now = new Date();
        return this.jdTTFromYmdhmsJst(
            now.getFullYear(), now.getMonth() + 1, now.getDate(),
            now.getHours(), now.getMinutes(), now.getSeconds()
        );
    }

    static calculateYmdhmsJstFromJdTT(jd_TT: number): { year: number, month: number, day: number, hour: number, minute: number, second: number } {
        const jdUTC = this.jdTTtoUTC(jd_TT);
        return this.calculateYmdhmsLocalFromJdUtc(jdUTC, 9);
    }

    static calculateYmdhmsLocalFromJdUtc(jd: number, timezone: number): { year: number, month: number, day: number, hour: number, minute: number, second: number } {
        // 時刻の繰り上がりを安全に処理するため、まず jd に 0.5 秒未満の微小な値を足して丸め誤差を防ぐ、
        // もしくは秒の四捨五入による繰り上がりを考慮した標準的な天文学的アプローチをとります。
        const localJd = jd + timezone / 24;
        const jdf = localJd + 0.5;
        let Z = Math.floor(jdf);
        const F = jdf - Z;

        let A = Z;
        // グレゴリオ暦の開始点（1582年10月15日）のJDは 2299160.5
        // Z（整数部）が 2299161 以上であればグレゴリオ暦、それ未満ならユリウス暦として処理
        if (Z >= 2299161) {
            const alpha = Math.floor((Z - 1867216.25) / 36524.25);
            A = Z + 1 + alpha - Math.floor(alpha / 4);
        }

        const B = A + 1524;
        const C = Math.floor((B - 122.1) / 365.25);
        const D = Math.floor(365.25 * C);
        const E = Math.floor((B - D) / 30.6001);

        // 日にち（小数点以下を含む）
        const dayWithFraction = B - D - Math.floor(30.6001 * E) + F;
        let d = Math.floor(dayWithFraction);

        let m = (E < 14) ? E - 1 : E - 13;
        let y = (m > 2) ? C - 4716 : C - 4715;

        // --- 時刻の計算および四捨五入に伴う繰り上がり処理 ---
        const fracDay = dayWithFraction - d;
        const totalSeconds = Math.round(fracDay * 86400);

        let hr = Math.floor(totalSeconds / 3600);
        let min = Math.floor((totalSeconds % 3600) / 60);
        let sec = totalSeconds % 60;

        // 不連続な数値チェックを避けるため、秒の四捨五入による24時超えの繰り上がりを安全に処理
        if (sec >= 60) {
            min += 1;
            sec -= 60;
        }
        if (min >= 60) {
            hr += 1;
            min -= 60;
        }
        if (hr >= 24) {
            d += 1;
            hr -= 24;

            // 日付が繰り上がった場合の月末処理
            // その月の上限日数を得るため、翌月1日のJDから逆算するか、暦に応じた閏年判定を行う
            let isLeap = false;
            if (Z >= 2299161) {
                // グレゴリオ暦の閏年判定
                isLeap = (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0));
            } else {
                // ユリウス暦の閏年判定（純粋に4で割れるかだけ）
                isLeap = (y % 4 === 0);
            }

            const daysInMonth = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

            // 1582年10月の特殊対応（ユリウス暦10/4の次はグレゴリオ暦10/15になるため、繰り上がり時は15日へジャンプ）
            if (y === 1582 && m === 10 && d === 5 && Z < 2299161) {
                d = 15;
            } else if (d > daysInMonth[m - 1]) {
                d = 1;
                m += 1;
                if (m > 12) {
                    m = 1;
                    y += 1;
                }
            }
        }

        return { year: y, month: m, day: d, hour: hr, minute: min, second: sec };
    }

    // グリニッジ恒星時を計算 経度を足せば地方恒星時
    static calculateGreenwichSiderealTime(jd_TT: number): number {
        const t = (jd_TT - 2451545.0) / 36525;
        // https://aa.usno.navy.mil/faq/GAST
        const jd_UT = jd_TT - 0.0008;
        const h = 24 * ((jd_UT + 0.5) % 1);
        const d_UT = jd_UT - h / 24 - 2451545.0;
        const ans = ((6.697375 + (0.065707485828 * d_UT) % 24 + 1.0027379 * h + 0.0854103 * t + 0.0000258 * t * t) % 24) * 15 * DEG_TO_RAD;
        return ans;
    }

    static calculateLocalSiderealTime(jd_TT: number, longitude: number): number {
        const greenwichSiderealTime = this.calculateGreenwichSiderealTime(jd_TT);
        return greenwichSiderealTime + longitude * DEG_TO_RAD;
    }

    static precessionAngle(time1: number | string, time2: number | string): number {
        if (typeof time1 == 'string') {
            if (time1 == 'j2000') {
                time1 = 2451545.0;
            } else {
                console.warn('precessionAngle: time1 is not a valid string');
                return 0;
            }
        }
        if (typeof time2 == 'string') {
            if (time2 == 'j2000') {
                time2 = 2451545.0;
            } else {
                console.warn('precessionAngle: time2 is not a valid string');
                return 0;
            }
        }
        const timeDiff = (time2 - time1) / 36525.0;
        return 5029.0 / 3600.0 * timeDiff * DEG_TO_RAD;
    }

    static limitingMagnitude(config: StarChartConfig): number {
        const key1 = config.viewState.starSizeKey1;
        const key2 = config.viewState.starSizeKey2;
        const usedStar = config.displaySettings.usedStar;
        let lm = Math.min(
            12.0,
            Math.max(3.0, key1 - key2 * 0.5 * Math.log(config.viewState.fov.ra * config.viewState.fov.dec)),
        );
        if (usedStar == 'noStar') {
            lm = -2.0
        } if (usedStar == 'to6') {
            lm = Math.min(lm, 6.0);
        } else if (usedStar == 'to10') {
            lm = Math.min(lm, 10.0);
        }
        return lm;
    }

    static unclipedLimitingMagnitude(viewState: ViewState): number {
        const key1 = viewState.starSizeKey1;
        const key2 = viewState.starSizeKey2;
        let lm = key1 - key2 * 0.5 * Math.log(viewState.fov.ra * viewState.fov.dec)
        return lm;
    }
}