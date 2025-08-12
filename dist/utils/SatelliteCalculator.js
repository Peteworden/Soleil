import * as satellite from 'satellite.js';
export class SatelliteCalculator {
    constructor(observationSite) {
        this.satellites = new Map();
        this.observationSite = observationSite;
    }
    /**
     * TLEデータから人工衛星の位置を計算
     */
    calculateSatellitePosition(tle, date) {
        try {
            // TLEをパース
            const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
            if (!satrec) {
                console.error('Failed to parse TLE data');
                return null;
            }
            // 日時をJulian Dateに変換
            const jd = this.dateToJulianDate(date);
            // 人工衛星の位置を計算
            const positionAndVelocity = satellite.propagate(satrec, jd);
            if (!positionAndVelocity.position) {
                console.error('Failed to calculate satellite position');
                return null;
            }
            // ECI座標を地理座標に変換
            const gmst = satellite.gstime(jd);
            // 観測地点からの方位角と高度を計算
            const observerGd = {
                longitude: this.observationSite.longitude * Math.PI / 180,
                latitude: this.observationSite.latitude * Math.PI / 180,
                height: 0
            };
            // ECI座標をECF座標に変換
            const positionEcf = satellite.eciToEcf(positionAndVelocity.position, gmst);
            const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);
            // 赤道座標に変換
            const equatorial = this.calculateEquatorialCoordinates(positionAndVelocity.position, gmst);
            // 太陽光の照射状況を計算
            const sunPosition = this.calculateSunPosition(jd);
            const illuminated = this.isSatelliteIlluminated(positionAndVelocity.position, sunPosition);
            // 等級を計算（簡易計算）
            const magnitude = this.calculateMagnitude(lookAngles.rangeSat, illuminated);
            return {
                name: tle.name || 'Unknown Satellite',
                noradId: tle.noradId,
                ra: equatorial.ra,
                dec: equatorial.dec,
                az: lookAngles.azimuth * 180 / Math.PI,
                alt: lookAngles.elevation * 180 / Math.PI,
                range: lookAngles.rangeSat,
                rangeRate: 0, // rangeRateは利用できないため0に設定
                magnitude,
                illuminated
            };
        }
        catch (error) {
            console.error('Error calculating satellite position:', error);
            return null;
        }
    }
    /**
     * 複数の人工衛星の位置を一括計算
     */
    calculateMultipleSatellites(tles, date) {
        const positions = [];
        for (const tle of tles) {
            const position = this.calculateSatellitePosition(tle, date);
            if (position) {
                positions.push(position);
            }
        }
        return positions;
    }
    /**
     * 日付をJulian Dateに変換
     */
    dateToJulianDate(date) {
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth() + 1;
        const day = date.getUTCDate();
        const hour = date.getUTCHours();
        const minute = date.getUTCMinutes();
        const second = date.getUTCSeconds();
        return satellite.jday(year, month, day, hour, minute, second);
    }
    /**
     * ECI座標から赤道座標に変換
     */
    calculateEquatorialCoordinates(positionEci, gmst) {
        // ECI座標を赤道座標に変換
        const positionEcf = satellite.eciToEcf(positionEci, gmst);
        // 地理座標に変換
        const geodetic = satellite.eciToGeodetic(positionEci, gmst);
        // 赤経・赤緯を計算（簡易計算）
        const ra = (gmst + geodetic.longitude * 180 / Math.PI) % 360;
        const dec = geodetic.latitude * 180 / Math.PI;
        return { ra, dec };
    }
    /**
     * 太陽の位置を計算
     */
    calculateSunPosition(jd) {
        // 簡易的な太陽位置計算
        const t = (jd - 2451545.0) / 36525.0;
        const l = 280.460 + 36000.771 * t;
        const m = 357.5277233 + 35999.05034 * t;
        const lambda = l + 1.914666471 * Math.sin(m * Math.PI / 180) + 0.019994643 * Math.sin(2 * m * Math.PI / 180);
        const beta = 0;
        const distance = 1.000140 - 0.016708 * Math.cos(m * Math.PI / 180) - 0.000139 * Math.cos(2 * m * Math.PI / 180);
        // 赤道座標に変換
        const epsilon = 23.439 - 0.0000004 * t;
        const ra = Math.atan2(Math.sin(lambda * Math.PI / 180) * Math.cos(epsilon * Math.PI / 180), Math.cos(lambda * Math.PI / 180)) * 180 / Math.PI;
        const dec = Math.asin(Math.sin(lambda * Math.PI / 180) * Math.sin(epsilon * Math.PI / 180)) * 180 / Math.PI;
        // ECI座標に変換
        const x = distance * Math.cos(ra * Math.PI / 180) * Math.cos(dec * Math.PI / 180);
        const y = distance * Math.sin(ra * Math.PI / 180) * Math.cos(dec * Math.PI / 180);
        const z = distance * Math.sin(dec * Math.PI / 180);
        return { x: x * 149597870.7, y: y * 149597870.7, z: z * 149597870.7 }; // AU to km
    }
    /**
     * 人工衛星が太陽光に照らされているかを判定
     */
    isSatelliteIlluminated(satellitePos, sunPos) {
        // 地球の半径（km）
        const earthRadius = 6378.137;
        // 人工衛星から太陽へのベクトル
        const toSun = {
            x: sunPos.x - satellitePos.x,
            y: sunPos.y - satellitePos.y,
            z: sunPos.z - satellitePos.z
        };
        // 人工衛星から地球中心へのベクトル
        const toEarth = {
            x: -satellitePos.x,
            y: -satellitePos.y,
            z: -satellitePos.z
        };
        // ベクトルの内積を計算
        const dotProduct = toSun.x * toEarth.x + toSun.y * toEarth.y + toSun.z * toEarth.z;
        const sunDistance = Math.sqrt(toSun.x * toSun.x + toSun.y * toSun.y + toSun.z * toSun.z);
        const earthDistance = Math.sqrt(toEarth.x * toEarth.x + toEarth.y * toEarth.y + toEarth.z * toEarth.z);
        // 角度を計算
        const angle = Math.acos(dotProduct / (sunDistance * earthDistance));
        // 地球の視半径を計算
        const earthAngularRadius = Math.asin(earthRadius / earthDistance);
        // 人工衛星が地球の影に入っているかどうかを判定
        return angle > earthAngularRadius;
    }
    /**
     * 人工衛星の等級を計算（簡易計算）
     */
    calculateMagnitude(range, illuminated) {
        if (!illuminated) {
            return 15; // 影に入っている場合は暗い
        }
        // 距離に基づく簡易的な等級計算
        const baseMagnitude = 5.0; // 基準等級
        const distanceFactor = 5 * Math.log10(range / 1000); // 1000kmを基準とする
        return baseMagnitude + distanceFactor;
    }
    /**
     * TLEデータの妥当性をチェック
     */
    validateTLE(tle) {
        try {
            const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
            return satrec !== null;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * 観測地点を更新
     */
    updateObservationSite(site) {
        this.observationSite = site;
    }
}
//# sourceMappingURL=SatelliteCalculator.js.map