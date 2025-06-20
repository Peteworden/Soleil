const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
export class CoordinateConverter {
    constructor(latitude, longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }
    // 赤道座標から地平座標への変換
    equatorialToHorizontal(coords, siderealTime) {
        const ra = coords.ra * DEG_TO_RAD;
        const dec = coords.dec * DEG_TO_RAD;
        const lat = this.latitude * DEG_TO_RAD;
        const lst = siderealTime * DEG_TO_RAD;
        const hourAngle = lst - ra;
        const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(hourAngle);
        const alt = Math.asin(sinAlt) * RAD_TO_DEG;
        const cosAz = (Math.sin(dec) - Math.sin(alt * DEG_TO_RAD) * Math.sin(lat)) /
            (Math.cos(alt * DEG_TO_RAD) * Math.cos(lat));
        const sinAz = -Math.sin(hourAngle) * Math.cos(dec) / Math.cos(alt * DEG_TO_RAD);
        const az = Math.atan2(sinAz, cosAz) * RAD_TO_DEG;
        return {
            az: (az + 360) % 360,
            alt
        };
    }
    // 地平座標から赤道座標への変換
    horizontalToEquatorial(coords, siderealTime) {
        const az = coords.az * DEG_TO_RAD;
        const alt = coords.alt * DEG_TO_RAD;
        const lat = this.latitude * DEG_TO_RAD;
        const lst = siderealTime * DEG_TO_RAD;
        const sinDec = Math.sin(alt) * Math.sin(lat) + Math.cos(alt) * Math.cos(lat) * Math.cos(az);
        const dec = Math.asin(sinDec) * RAD_TO_DEG;
        const cosHA = (Math.sin(alt) - Math.sin(dec * DEG_TO_RAD) * Math.sin(lat)) /
            (Math.cos(dec * DEG_TO_RAD) * Math.cos(lat));
        const sinHA = -Math.sin(az) * Math.cos(alt) / Math.cos(dec * DEG_TO_RAD);
        const ha = Math.atan2(sinHA, cosHA) * RAD_TO_DEG;
        const ra = (lst - ha + 360) % 360;
        return { ra, dec };
    }
    // 赤道座標から直交座標への変換
    equatorialToCartesian(coords, distance = 1) {
        const ra = coords.ra * DEG_TO_RAD;
        const dec = coords.dec * DEG_TO_RAD;
        return {
            x: distance * Math.cos(dec) * Math.cos(ra),
            y: distance * Math.cos(dec) * Math.sin(ra),
            z: distance * Math.sin(dec)
        };
    }
    // 直交座標から赤道座標への変換
    cartesianToEquatorial(coords) {
        const distance = Math.sqrt(coords.x * coords.x + coords.y * coords.y + coords.z * coords.z);
        const dec = Math.asin(coords.z / distance) * RAD_TO_DEG;
        const ra = Math.atan2(coords.y, coords.x) * RAD_TO_DEG;
        return {
            ra: (ra + 360) % 360,
            dec: dec
        };
    }
}
//# sourceMappingURL=coordinates.js.map