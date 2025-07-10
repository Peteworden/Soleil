const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
export class CoordinateConverter {
    constructor() {
        // グローバルなconfigから緯度経度を取得
        const globalConfig = window.config;
        if (globalConfig && globalConfig.displaySettings && globalConfig.viewState && globalConfig.observationSite) {
            this.latitude = globalConfig.observationSite.latitude;
            this.longitude = globalConfig.observationSite.longitude;
            this.centerRA = globalConfig.viewState.centerRA;
            this.centerDec = globalConfig.viewState.centerDec;
            this.centerAz = globalConfig.viewState.centerAz;
            this.centerAlt = globalConfig.viewState.centerAlt;
            this.fieldOfViewRA = globalConfig.viewState.fieldOfViewRA;
            this.fieldOfViewDec = globalConfig.viewState.fieldOfViewDec;
            this.mode = globalConfig.displaySettings.mode;
        }
        else {
            // デフォルト値（東京）
            this.latitude = 35.6762;
            this.longitude = 139.6503;
            this.centerRA = 90;
            this.centerDec = 0;
            this.centerAz = 0;
            this.centerAlt = 0;
            this.fieldOfViewRA = 60;
            this.fieldOfViewDec = 60;
            this.mode = 'AEP';
            console.warn('CoordinateConverter: config not found, using default coordinates (Tokyo)');
        }
    }
    // 緯度経度を更新するメソッドを追加
    updateLocation(latitude, longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }
    // 現在の緯度経度を取得するメソッドを追加
    getLocation() {
        const config = this.getCurrentConfig();
        if (config && config.observationSite) {
            return {
                latitude: config.observationSite.latitude,
                longitude: config.observationSite.longitude
            };
        }
        // フォールバック: キャッシュされた値を使用
        return { latitude: this.latitude, longitude: this.longitude };
    }
    // configから緯度経度を再読み込みするメソッドを追加
    reloadFromConfig() {
        const globalConfig = window.config;
        if (globalConfig && globalConfig.latitude !== undefined && globalConfig.longitude !== undefined) {
            this.latitude = globalConfig.latitude;
            this.longitude = globalConfig.longitude;
            console.log('CoordinateConverter: location updated from config', this.latitude, this.longitude);
        }
    }
    // 動的にconfigから現在の値を取得するメソッド
    getCurrentConfig() {
        const globalConfig = window.config;
        if (!globalConfig || !globalConfig.displaySettings || !globalConfig.viewState || !globalConfig.observationSite) {
            console.warn('CoordinateConverter: config not found, using cached values');
            return null;
        }
        return globalConfig;
    }
    // 現在の中心座標を動的に取得
    getCurrentCenter() {
        const config = this.getCurrentConfig();
        if (config) {
            return {
                ra: config.viewState.centerRA,
                dec: config.viewState.centerDec,
                az: config.viewState.centerAz,
                alt: config.viewState.centerAlt
            };
        }
        // フォールバック: キャッシュされた値を使用
        return {
            ra: this.centerRA,
            dec: this.centerDec,
            az: this.centerAz,
            alt: this.centerAlt
        };
    }
    // 現在のフィールドオブビューを動的に取得
    getCurrentFieldOfView() {
        const config = this.getCurrentConfig();
        if (config) {
            return {
                ra: config.viewState.fieldOfViewRA,
                dec: config.viewState.fieldOfViewDec
            };
        }
        // フォールバック: キャッシュされた値を使用
        return {
            ra: this.fieldOfViewRA,
            dec: this.fieldOfViewDec
        };
    }
    // 現在のモードを動的に取得
    getCurrentMode() {
        const config = this.getCurrentConfig();
        if (config) {
            return config.displaySettings.mode;
        }
        // フォールバック: キャッシュされた値を使用
        return this.mode;
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
        const location = this.getLocation();
        const lat = location.latitude * DEG_TO_RAD;
        const hourAngle = siderealTime - ra;
        const sinDec = Math.sin(dec);
        const cosDec = Math.cos(dec);
        const sinLat = Math.sin(lat);
        const cosLat = Math.cos(lat);
        const sinHourAngle = Math.sin(hourAngle);
        const cosHourAngle = Math.cos(hourAngle);
        const x = cosLat * sinDec - sinLat * cosDec * cosHourAngle;
        const y = -cosDec * sinHourAngle;
        const z = sinLat * sinDec + cosLat * cosDec * cosHourAngle;
        const az = (Math.atan2(y, x) * RAD_TO_DEG + 360) % 360;
        const alt = Math.asin(z) * RAD_TO_DEG;
        return { az, alt };
    }
    // 地平座標から赤道座標への変換
    horizontalToEquatorial(coords, siderealTime) {
        const az = coords.az * DEG_TO_RAD;
        const alt = coords.alt * DEG_TO_RAD;
        const location = this.getLocation();
        const lat = location.latitude * DEG_TO_RAD;
        const sinAlt = Math.sin(alt);
        const cosAlt = Math.cos(alt);
        const sinLat = Math.sin(lat);
        const cosLat = Math.cos(lat);
        const sinAz = Math.sin(az);
        const cosAz = Math.cos(az);
        const x = sinLat * cosAlt * cosAz - cosLat * sinAlt;
        const y = -cosAlt * sinAz;
        const z = cosLat * cosAlt * cosAz + sinLat * sinAlt;
        const ra = ((siderealTime + Math.atan2(-y, -x)) * RAD_TO_DEG + 360) % 360;
        const dec = Math.asin(z) * RAD_TO_DEG;
        return { ra, dec };
    }
    // 赤道座標からある方向を中心とした正距方位図法への変換
    equatorialToScreenRaDec(coords, center) {
        const ra = coords.ra * DEG_TO_RAD;
        const dec = coords.dec * DEG_TO_RAD;
        const centerRARad = center.ra * DEG_TO_RAD;
        const centerDecRad = center.dec * DEG_TO_RAD;
        const ra_diff = ra - centerRARad;
        const sinDec = Math.sin(dec);
        const cosDec = Math.cos(dec);
        const sinCenterDec = Math.sin(centerDecRad);
        const cosCenterDec = Math.cos(centerDecRad);
        const a = sinCenterDec * cosDec * Math.cos(ra_diff) - cosCenterDec * sinDec;
        const b = cosDec * Math.sin(ra_diff);
        const c = cosCenterDec * cosDec * Math.cos(ra_diff) + sinCenterDec * sinDec;
        const r = Math.acos(c) * RAD_TO_DEG; //中心からの角距離, deg
        const thetaSH = Math.atan2(b, a); //南（下）向きから時計回り
        const scrRA = r * Math.sin(thetaSH);
        const scrDec = -r * Math.cos(thetaSH);
        return { ra: scrRA, dec: scrDec };
    }
    // 地平座標からある方向を中心とした正距方位図法への変換
    horizontalToScreenRaDec(coords, center) {
        const az = coords.az * DEG_TO_RAD;
        const alt = coords.alt * DEG_TO_RAD;
        const centerAzRad = center.az * DEG_TO_RAD;
        const centerAltRad = center.alt * DEG_TO_RAD;
        const az_diff = -(az - centerAzRad);
        const sinAlt = Math.sin(alt);
        const cosAlt = Math.cos(alt);
        const sinAzDiff = Math.sin(az_diff);
        const cosAzDiff = Math.cos(az_diff);
        const sinCenterAlt = Math.sin(centerAltRad);
        const cosCenterAlt = Math.cos(centerAltRad);
        // const a = sinCenterAlt * cosAlt * Math.cos(az_diff) - cosCenterAlt * sinAlt;
        // const b =                cosAlt * Math.sin(az_diff);
        // const c = cosCenterAlt * cosAlt * Math.cos(az_diff) + sinCenterAlt * sinAlt;
        const { x: a, y: b, z: c } = this.rotateY({ x: cosAlt * cosAzDiff, y: cosAlt * sinAzDiff, z: sinAlt }, -Math.PI / 2 + centerAltRad);
        const r = Math.acos(c) * RAD_TO_DEG; //中心からの角距離, deg
        const thetaSH = Math.atan2(b, a); //南（下）向きから時計回り
        const scrRa = r * Math.sin(thetaSH);
        const scrDec = -r * Math.cos(thetaSH);
        return { ra: scrRa, dec: scrDec };
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
    screenRaDecToScreenXY(raDec, canvas) {
        const fieldOfView = this.getCurrentFieldOfView();
        const x = canvas.width * (0.5 - raDec.ra / fieldOfView.ra);
        const y = canvas.height * (0.5 - raDec.dec / fieldOfView.dec);
        return [x, y];
    }
    screenXYToScreenRaDec(x, y, canvas) {
        const fieldOfView = this.getCurrentFieldOfView();
        const ra = (0.5 - x / canvas.width) * fieldOfView.ra;
        const dec = (0.5 - y / canvas.height) * fieldOfView.dec;
        return { ra, dec };
    }
    equatorialToScreenXYifin(raDec, canvas, siderealTime, force = false) {
        const center = this.getCurrentCenter();
        const fieldOfView = this.getCurrentFieldOfView();
        const mode = this.getCurrentMode();
        if (mode == 'AEP') {
            const screenRaDec = this.equatorialToScreenRaDec(raDec, { ra: center.ra, dec: center.dec });
            if (Math.abs(screenRaDec.ra) < 0.5 * fieldOfView.ra && Math.abs(screenRaDec.dec) < 0.5 * fieldOfView.dec) {
                const [x, y] = this.screenRaDecToScreenXY(screenRaDec, canvas);
                return [true, [x, y]];
            }
            else if (force) {
                const [x, y] = this.screenRaDecToScreenXY(screenRaDec, canvas);
                return [false, [x, y]];
            }
            else {
                return [false, [0, 0]];
            }
        }
        else if (mode == 'view') {
            const horizontal = this.equatorialToHorizontal(raDec, siderealTime);
            const screenRaDec = this.horizontalToScreenRaDec(horizontal, { az: center.az, alt: center.alt });
            if (Math.abs(screenRaDec.ra) < fieldOfView.ra && Math.abs(screenRaDec.dec) < fieldOfView.dec) {
                const [x, y] = this.screenRaDecToScreenXY(screenRaDec, canvas);
                return [true, [x, y]];
            }
            else if (force) {
                const [x, y] = this.screenRaDecToScreenXY(screenRaDec, canvas);
                return [false, [x, y]];
            }
            else {
                return [false, [0, 0]];
            }
        }
        else {
            return [false, [0, 0]];
        }
    }
    // AEPモードでスクリーンRaDecから赤道座標への変換
    screenRaDecToEquatorial_AEP(screenRaDec) {
        if (screenRaDec.ra == 0 && screenRaDec.dec == 0) {
            const center = this.getCurrentCenter();
            return { ra: center.ra, dec: center.dec };
        }
        else {
            const Ra = screenRaDec.ra * DEG_TO_RAD;
            const Dec = screenRaDec.dec * DEG_TO_RAD;
            const thetaSH = Math.atan2(Ra, -Dec);
            const r = Math.sqrt(Ra * Ra + Dec * Dec) * DEG_TO_RAD;
            const center = this.getCurrentCenter();
            const centerDec_rad = center.dec * DEG_TO_RAD;
            const sinDec = Math.sin(centerDec_rad);
            const cosDec = Math.cos(centerDec_rad);
            const sinR = Math.sin(r);
            const cosR = Math.cos(r);
            const sinThetaSH = Math.sin(thetaSH);
            const cosThetaSH = Math.cos(thetaSH);
            const a = sinDec * sinR * cosThetaSH + cosDec * cosR;
            const b = sinR * sinThetaSH;
            const c = -cosDec * sinR * cosThetaSH + sinDec * cosR;
            const dec = Math.asin(c) * RAD_TO_DEG;
            const ra = ((Math.atan2(b, a) * RAD_TO_DEG + center.ra) % 360 + 360) % 360;
            return { ra, dec };
        }
    }
    // ViewモードでスクリーンRaDecから地平座標への変換
    screenRaDecToHorizontal_View(screenRaDec) {
        if (screenRaDec.ra == 0 && screenRaDec.dec == 0) {
            const center = this.getCurrentCenter();
            return { az: center.az, alt: center.alt };
        }
        else {
            const Ra = screenRaDec.ra * DEG_TO_RAD;
            const Dec = screenRaDec.dec * DEG_TO_RAD;
            const thetaSH = Math.atan2(Ra, -Dec);
            const r = Math.sqrt(Ra * Ra + Dec * Dec);
            const center = this.getCurrentCenter();
            const centerAlt_rad = center.alt * DEG_TO_RAD;
            const sinAlt = Math.sin(centerAlt_rad);
            const cosAlt = Math.cos(centerAlt_rad);
            const sinR = Math.sin(r);
            const cosR = Math.cos(r);
            const sinThetaSH = Math.sin(thetaSH);
            const cosThetaSH = Math.cos(thetaSH);
            const abc1 = this.rotateY({ x: sinR * cosThetaSH, y: sinR * sinThetaSH, z: cosR }, Math.PI / 2 - centerAlt_rad);
            const abc2 = this.rotateZ(abc1, -center.az * DEG_TO_RAD);
            const { x: a, y: b, z: c } = abc2;
            const alt = Math.asin(c) * RAD_TO_DEG;
            const az = ((Math.atan2(-b, a) * RAD_TO_DEG) % 360 + 360) % 360;
            return { az, alt };
        }
    }
    pinchNewCenterRaDec(center1, pinchRaDec, pinchScreenRaDec, scale) {
        // x, yは固定。screenRA_p, screenDec_p(pinchの座標)はscale倍になる。
        // Equ->screenRaDecの関数でthetaSH=atan2(b, a)は符号も含めて変化せず、arccos(c)はscale倍になる。
        // 縮尺の変更前を1, 変更後を2とする。
        // a2^2+b2^2+c2^2=1よりa2 = cos(thetaSH/sqrt(1-c2^2)). b2はsin
        // 変更前後を通して、RA_p - centerRAの符号は変化しない
        const centerRA1 = center1.ra * DEG_TO_RAD;
        const centerDec1 = center1.dec * DEG_TO_RAD;
        const pinchRA = pinchRaDec.ra * DEG_TO_RAD;
        const pinchDec = pinchRaDec.dec * DEG_TO_RAD;
        const ra_diff1 = pinchRA - centerRA1;
        const thetaSH1 = Math.atan2(pinchScreenRaDec.ra, -pinchScreenRaDec.dec);
        const r1 = Math.sqrt(pinchScreenRaDec.ra * pinchScreenRaDec.ra + pinchScreenRaDec.dec * pinchScreenRaDec.dec);
        const c1 = Math.cos(r1 * DEG_TO_RAD);
        // const c1 = Math.cos(centerDec1) * Math.cos(pinchDec) * Math.cos(ra_diff1) + Math.sin(centerDec1) * Math.sin(pinchDec);
        const c2 = Math.acos(scale * Math.acos(c1));
        const a2 = Math.cos(thetaSH1 / Math.sqrt(1 - c1 * c1));
        const b2 = Math.sin(thetaSH1 / Math.sqrt(1 - c1 * c1));
        // c2 * sin(centerDec2) - a2 * cos(centerDec2) = sin(pinchDec)
        // c2 * cos(centerDec2) + a2 * sin(centerDec2) = cos(pinchDec) * cos(ra_diff2)
        const ra2 = Math.atan2(b2, a2) * RAD_TO_DEG;
        const dec2 = Math.asin(Math.sin(centerDec1) * Math.sin(c2)) * RAD_TO_DEG;
        return { ra: 0, dec: 0 };
    }
}
//# sourceMappingURL=coordinates.js.map