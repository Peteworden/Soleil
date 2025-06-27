const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
export class CoordinateConverter {
    constructor() {
        // グローバルなconfigから緯度経度を取得
        const globalConfig = window.config;
        console.log('🌐 globalConfig:', globalConfig);
        console.log('🌐 globalConfig.displaySettings:', globalConfig.displaySettings);
        console.log('🌐 globalConfig.viewState:', globalConfig.viewState);
        console.log('🌐 globalConfig.observationSite:', globalConfig.observationSite);
        console.log('gggg', globalConfig && globalConfig.displaySettings && globalConfig.viewState && globalConfig.observationSite);
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
        const x = cosLat * sinAlt - sinLat * cosAlt * cosAz;
        const y = -cosAlt * sinAz;
        const z = sinLat * sinAlt + cosLat * cosAlt * cosAz;
        const ra = ((siderealTime - Math.atan2(-y, x)) * RAD_TO_DEG + 360) % 360;
        const dec = Math.asin(z) * RAD_TO_DEG;
        // const sinDec = Math.sin(alt) * Math.sin(lat) + Math.cos(alt) * Math.cos(lat) * Math.cos(az);
        // const dec = Math.asin(sinDec) * RAD_TO_DEG;
        // const cosHA = (Math.sin(alt) - Math.sin(dec * DEG_TO_RAD) * Math.sin(lat)) / (Math.cos(dec * DEG_TO_RAD) * Math.cos(lat));
        // const sinHA = -Math.sin(az) * Math.cos(alt) / Math.cos(dec * DEG_TO_RAD);
        // const ha = Math.atan2(sinHA, cosHA) * RAD_TO_DEG;
        // const ra = (lst - ha + 360) % 360;
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
        // const {x: a, y: b, z: c} = this.rotateY({x: cosDec, y: 0, z: sinDec}, Math.PI / 2 - centerDecRad);
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
    // CelestialCoordinates型を使用した汎用的な座標変換メソッド
    celestialToScreenCoordinates(coords, center) {
        if (coords.primary == center.primary && coords.secondary == center.secondary) {
            return { primary: 0, secondary: 0 };
        }
        const ra = coords.primary * DEG_TO_RAD;
        const dec = coords.secondary * DEG_TO_RAD;
        const centerRARad = center.primary * DEG_TO_RAD;
        const centerDecRad = center.secondary * DEG_TO_RAD;
        const sinDec = Math.sin(dec);
        const cosDec = Math.cos(dec);
        const sinCenterDec = Math.sin(centerDecRad);
        const cosCenterDec = Math.cos(centerDecRad);
        const a = sinCenterDec * cosDec * Math.cos(ra - centerRARad) - cosCenterDec * sinDec;
        const b = cosDec * Math.sin(ra - centerRARad);
        const c = cosCenterDec * cosDec * Math.cos(ra - centerRARad) + sinCenterDec * sinDec;
        const r = Math.acos(c) * RAD_TO_DEG; //中心からの角距離, deg
        const thetaSH = Math.atan2(b, a); //南（下）向きから時計回り
        const scrRA = r * Math.sin(thetaSH);
        const scrDec = -r * Math.cos(thetaSH);
        return { primary: scrRA, secondary: scrDec };
    }
}
//# sourceMappingURL=coordinates.js.map