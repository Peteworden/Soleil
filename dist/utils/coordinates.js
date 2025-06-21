const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
export class CoordinateConverter {
    constructor(latitude, longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }
    rotateX(coords, angle) {
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        const ans = {
            x: coords.x,
            y: cos * coords.y - sin * coords.z,
            z: sin * coords.y + cos * coords.z
        };
        return ans;
    }
    rotateY(coords, angle) {
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        const ans = {
            x: cos * coords.x + sin * coords.z,
            y: coords.y,
            z: -sin * coords.x + cos * coords.z
        };
        return ans;
    }
    rotateZ(coords, angle) {
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        const ans = {
            x: cos * coords.x - sin * coords.y,
            y: sin * coords.x + cos * coords.y,
            z: coords.z
        };
        return ans;
    }
    rahmToDeg(rahmtext) {
        const rahm = rahmtext.split(' ').map(Number);
        return rahm[0] * 15 + rahm[1] * 0.25;
    }
    decdmToDeg(decdmtext) {
        const decdm = decdmtext.split(' ').map(Number);
        let dec = Math.abs(decdm[0]) + decdm[1] / 60;
        if (decdmtext[0] == '-') {
            dec *= -1;
        }
        return dec;
    }
    radeg2hm(ra_deg) {
        let h = Math.floor(ra_deg / 15);
        let m = Math.round((ra_deg - 15 * Math.floor(ra_deg / 15)) * 40);
        if (m == 600) {
            m = 0.0;
            if (h == 23)
                h = 0;
            else
                h += 1;
        }
        else {
            m = m / 10;
        }
        return [h, m];
    }
    decdeg2dm(dec_deg) {
        let d, m;
        if (dec_deg >= 0) {
            d = Math.floor(dec_deg);
            m = Math.round((dec_deg - d) * 60);
            if (m == 60) {
                m = 0;
                d += 1;
            }
        }
        else {
            d = Math.floor(-dec_deg);
            m = Math.round((-dec_deg - d) * 60);
            d *= -1;
            if (m == 60) {
                m = 0;
                d -= 1;
            }
        }
        return [d, m];
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
        const cosAz = (Math.sin(dec) - Math.sin(alt * DEG_TO_RAD) * Math.sin(lat)) / (Math.cos(alt * DEG_TO_RAD) * Math.cos(lat));
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
        const cosHA = (Math.sin(alt) - Math.sin(dec * DEG_TO_RAD) * Math.sin(lat)) / (Math.cos(dec * DEG_TO_RAD) * Math.cos(lat));
        const sinHA = -Math.sin(az) * Math.cos(alt) / Math.cos(dec * DEG_TO_RAD);
        const ha = Math.atan2(sinHA, cosHA) * RAD_TO_DEG;
        const ra = (lst - ha + 360) % 360;
        return { ra, dec };
    }
    // 赤道座標や地平座標からある方向を中心とした正距方位図法への変換
    equatorialToAepScreen(coords, center) {
        if (coords.ra == center.ra && coords.dec == center.dec) {
            return { ra: 0, dec: 0 };
        }
        const ra = coords.ra * DEG_TO_RAD;
        const dec = coords.dec * DEG_TO_RAD;
        const centerRA = center.ra * DEG_TO_RAD;
        const centerDec = center.dec * DEG_TO_RAD;
        const sinDec = Math.sin(dec);
        const cosDec = Math.cos(dec);
        const sinCenterDec = Math.sin(centerDec);
        const cosCenterDec = Math.cos(centerDec);
        const a = sinCenterDec * cosDec * Math.cos(ra - centerRA) - cosCenterDec * sinDec;
        const b = cosDec * Math.sin(ra - centerRA);
        const c = cosCenterDec * cosDec * Math.cos(ra - centerRA) + sinCenterDec * sinDec;
        const r = Math.acos(c) * RAD_TO_DEG; //中心からの角距離, deg
        const thetaSH = Math.atan2(b, a); //南（下）向きから時計回り
        const scrRA = r * Math.sin(thetaSH);
        const scrDec = -r * Math.cos(thetaSH);
        return { ra: scrRA, dec: scrDec };
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