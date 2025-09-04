const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const epsilon = 0.4090926;
const cosEpsl = Math.cos(epsilon);
const sinEpsl = Math.sin(epsilon);
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
        if (globalConfig && globalConfig.latitude != null && globalConfig.longitude != null) {
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
        return {
            ra: this.fieldOfViewRA,
            dec: this.fieldOfViewDec
        };
    }
    asinrad(a) {
        if (a > 1)
            return Math.PI / 2;
        else if (a < -1)
            return -Math.PI / 2;
        else
            return Math.asin(a);
    }
    acosrad(a) {
        if (a > 1)
            return 0;
        else if (a < -1)
            return Math.PI;
        else
            return Math.acos(a);
    }
    asindeg(a) {
        if (a > 1)
            return 90;
        else if (a < -1)
            return -90;
        else
            return Math.asin(a) * RAD_TO_DEG;
    }
    acosdeg(a) {
        if (a > 1)
            return 0;
        else if (a < -1)
            return 180;
        else
            return Math.acos(a) * RAD_TO_DEG;
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
        if (rahm.length == 2) {
            return rahm[0] * 15 + rahm[1] * 0.25;
        }
        else {
            return rahm[0] * 15 + rahm[1] * 0.25 + rahm[2] / 240;
        }
    }
    decdmToDeg(decdmtext) {
        const decdm = decdmtext.split(' ').map(Number);
        const dec = (Math.abs(decdm[0]) + decdm[1] / 60) * (decdmtext[0] == '-' ? -1 : 1);
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
        const sign = dec_deg >= 0 ? '+' : '-';
        const decAbs = Math.abs(dec_deg);
        d = Math.floor(decAbs);
        m = Math.round((decAbs - d) * 60);
        if (m == 60) {
            m = 0;
            d += 1;
        }
        return [sign, d, m];
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
        const dec = this.asindeg(coords.z / distance);
        const ra = Math.atan2(coords.y, coords.x) * RAD_TO_DEG;
        return { ra: (ra + 360) % 360, dec: dec };
    }
    precessionAngle(time1, time2) {
        if (typeof time1 == 'string') {
            if (time1 == 'j2000') {
                time1 = 2451545.0;
            }
            else {
                console.warn('precessionAngle: time1 is not a valid string');
                return 0;
            }
        }
        if (typeof time2 == 'string') {
            if (time2 == 'j2000') {
                time2 = 2451545.0;
            }
            else {
                console.warn('precessionAngle: time2 is not a valid string');
                return 0;
            }
        }
        const timeDiff = (time2 - time1) / 36525.0;
        return 5029.0 / 3600.0 * timeDiff * DEG_TO_RAD;
    }
    precessionEquatorial(coords, precessionAngle, time1, time2) {
        if (precessionAngle == undefined) {
            if (time1 == undefined) {
                time1 = 2451545.0;
            }
            else if (typeof time1 == 'string' && time1 == 'j2000') {
                time1 = 2451545.0;
            }
            else if (typeof time1 != 'number') {
                console.warn('precessionEquatorial: time1 is invalid:', time1);
                return coords;
            }
            if (time2 == undefined) {
                time2 = 2451545.0;
            }
            else if (typeof time2 == 'string' && time2 == 'j2000') {
                time2 = 2451545.0;
            }
            else if (typeof time2 != 'number') {
                console.warn('precessionEquatorial: time2 is invalid:', time2, typeof time2);
                return coords;
            }
            precessionAngle = this.precessionAngle(time1, time2);
        }
        const { x, y, z } = this.equatorialToCartesian(coords, 1);
        const sin = Math.sin(precessionAngle);
        const cos = Math.cos(precessionAngle);
        // const xyz2 = this.rotateX(xyz1, -epsilon);
        // const xyz3 = this.rotateZ(xyz2, precessionAngle);
        // const xyz4 = this.rotateX(xyz3, epsilon);
        const xyz2 = {
            x: x * cos - y * cosEpsl * sin - z * sinEpsl * sin,
            y: cosEpsl * (x * sin + cos * (y * cosEpsl + z * sinEpsl)) - sinEpsl * (-y * sinEpsl + z * cosEpsl),
            z: sinEpsl * (x * sin + cos * (y * cosEpsl + z * sinEpsl)) + cosEpsl * (-y * sinEpsl + z * cosEpsl)
        };
        return this.cartesianToEquatorial(xyz2);
    }
    // ------------------------------赤道座標からの変換------------------------------
    // 赤道座標から地平座標への変換
    equatorialToHorizontal(coords, siderealTime, latitude) {
        if (latitude == undefined) {
            latitude = this.getLocation().latitude;
        }
        const ra = coords.ra * DEG_TO_RAD;
        const dec = coords.dec * DEG_TO_RAD;
        const lat = latitude * DEG_TO_RAD;
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
        const alt = this.asindeg(z);
        return { az, alt };
    }
    // 赤道座標からスクリーン座標への変換、判定
    // すべてのモードに対応
    equatorialToScreenXYifin(raDec, config, force = false, orientationData) {
        const viewState = config.viewState;
        const mode = config.displaySettings.mode;
        const canvas = config.canvasSize;
        const siderealTime = config.siderealTime;
        let screenRaDec;
        if (mode == 'AEP') {
            screenRaDec = this.equatorialToScreenRaDec_AEP(raDec, { ra: viewState.centerRA, dec: viewState.centerDec });
        }
        else if (mode == 'view') {
            const horizontal = this.equatorialToHorizontal(raDec, siderealTime);
            screenRaDec = this.horizontalToScreenRaDec_View(horizontal, { az: viewState.centerAz, alt: viewState.centerAlt });
        }
        else if (['live', 'ar'].includes(mode) && orientationData) {
            const horizontal = this.equatorialToHorizontal(raDec, siderealTime);
            screenRaDec = this.horizontalToScreenRaDec_Live(horizontal, orientationData);
        }
        else {
            return [false, [0, 0]];
        }
        if (Math.abs(screenRaDec.ra) < viewState.fieldOfViewRA * 0.5 && Math.abs(screenRaDec.dec) < viewState.fieldOfViewDec * 0.5) {
            const [x, y] = this.screenRaDecToScreenXY(screenRaDec, canvas, viewState);
            return [true, [x, y]];
        }
        else if (force) {
            const [x, y] = this.screenRaDecToScreenXY(screenRaDec, canvas, viewState);
            return [false, [x, y]];
        }
        else {
            return [false, [0, 0]];
        }
    }
    // 赤道座標からある方向を中心とした正距方位図法への変換
    equatorialToScreenRaDec_AEP(coords, center) {
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
        const r = this.acosdeg(c); //中心からの角距離, deg
        const thetaSH = Math.atan2(b, a); //南（下）向きから時計回り
        const scrRA = r * Math.sin(thetaSH);
        const scrDec = -r * Math.cos(thetaSH);
        return { ra: scrRA, dec: scrDec };
    }
    // ------------------------------地平座標からの変換------------------------------
    // 地平座標から赤道座標への変換
    horizontalToEquatorial(coords, siderealTime, latitude) {
        if (latitude == undefined) {
            latitude = this.getLocation().latitude;
        }
        const az = coords.az * DEG_TO_RAD;
        const alt = coords.alt * DEG_TO_RAD;
        const lat = latitude * DEG_TO_RAD;
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
        const dec = this.asindeg(z);
        return { ra, dec };
    }
    horizontalToScreenRaDec(coords, mode, center, orientationData) {
        if (mode == 'view') {
            return this.horizontalToScreenRaDec_View(coords, center);
        }
        else if (['live', 'ar'].includes(mode) && orientationData) {
            return this.horizontalToScreenRaDec_Live(coords, orientationData);
        }
        else {
            return { ra: 0, dec: 0 };
        }
    }
    // 地平座標からある方向を中心とした正距方位図法への変換
    horizontalToScreenRaDec_View(coords, center) {
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
        const r = this.acosdeg(c); //中心からの角距離, deg
        const thetaSH = Math.atan2(b, a); //南（下）向きから時計回り
        const scrRa = r * Math.sin(thetaSH);
        const scrDec = -r * Math.cos(thetaSH);
        return { ra: scrRa, dec: scrDec };
    }
    horizontalToScreenRaDec_Live(horizontal, orientationData) {
        const alpha = orientationData.alpha;
        const beta = orientationData.beta;
        const gamma = orientationData.gamma;
        const compassHeading = orientationData.webkitCompassHeading;
        const az = (horizontal.az - compassHeading - 90) * DEG_TO_RAD;
        const alt = horizontal.alt * DEG_TO_RAD;
        const x0 = Math.cos(alt) * Math.cos(az);
        const y0 = -Math.cos(alt) * Math.sin(az);
        const z0 = Math.sin(alt);
        const { x, y, z } = this.rotateY(this.rotateX(this.rotateZ({ x: x0, y: y0, z: z0 }, -alpha), -beta), -gamma);
        if (-z >= 1) {
            return { ra: 0, dec: 0 };
        }
        else {
            const b = this.acosdeg(-z);
            const scrRA = -b * x / Math.sqrt(x * x + y * y);
            const scrDec = b * y / Math.sqrt(x * x + y * y);
            return { ra: scrRA, dec: scrDec };
        }
    }
    // ------------------------------スクリーンRaDecからの変換------------------------------
    // スクリーン座標からスクリーンRaDecへの変換
    screenRaDecToScreenXY(raDec, canvasSize, viewState) {
        const x = canvasSize.width * (0.5 - raDec.ra / viewState.fieldOfViewRA);
        const y = canvasSize.height * (0.5 - raDec.dec / viewState.fieldOfViewDec);
        return [x, y];
    }
    // AEPモードでスクリーンRaDecから赤道座標への変換
    screenRaDecToEquatorial_AEP(screenRaDec) {
        if (screenRaDec.ra == 0 && screenRaDec.dec == 0) {
            const center = this.getCurrentCenter();
            return { ra: center.ra, dec: center.dec };
        }
        else {
            const thetaSH = Math.atan2(screenRaDec.ra, -screenRaDec.dec);
            const r = Math.sqrt(screenRaDec.ra * screenRaDec.ra + screenRaDec.dec * screenRaDec.dec) * DEG_TO_RAD;
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
            const dec = this.asindeg(c);
            const ra = ((Math.atan2(b, a) * RAD_TO_DEG + center.ra) % 360 + 360) % 360;
            return { ra, dec };
        }
    }
    screenRaDecToHorizontal(screenRaDec, mode, orientationData) {
        if (mode == 'view') {
            return this.screenRaDecToHorizontal_View(screenRaDec);
        }
        else if (['live', 'ar'].includes(mode) && orientationData) {
            return this.screenRaDecToHorizontal_Live(screenRaDec, orientationData);
        }
        else {
            return { az: 0, alt: 0 };
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
            const alt = this.asindeg(c);
            const az = ((Math.atan2(-b, a) * RAD_TO_DEG) % 360 + 360) % 360;
            return { az, alt };
        }
    }
    // LiveモードでスクリーンRaDecから地平座標への変換
    screenRaDecToHorizontal_Live(screenRaDec, orientationData) {
        const theta = Math.atan2(screenRaDec.dec, -screenRaDec.ra); //画面上で普通に極座標
        const r = Math.sqrt(screenRaDec.ra * screenRaDec.ra + screenRaDec.dec * screenRaDec.dec) * DEG_TO_RAD;
        const alpha = orientationData.alpha;
        const beta = orientationData.beta;
        const gamma = orientationData.gamma;
        const x0 = Math.sin(r) * Math.cos(theta);
        const y0 = Math.sin(r) * Math.sin(theta);
        const z0 = -Math.cos(r);
        const { x, y, z } = this.rotateZ(this.rotateX(this.rotateY({ x: x0, y: y0, z: z0 }, gamma), beta), alpha);
        const alt = this.asindeg(z);
        const az = ((Math.atan2(-y, x) * RAD_TO_DEG + (orientationData.webkitCompassHeading || 0) + 90) % 360 + 360) % 360;
        return { az, alt };
    }
    // ------------------------------スクリーンXYからの変換------------------------------
    // スクリーン座標からスクリーンRaDecへの変換
    screenXYToScreenRaDec(x, y, canvas) {
        const fieldOfView = this.getCurrentFieldOfView();
        const ra = (0.5 - x / canvas.width) * fieldOfView.ra;
        const dec = (0.5 - y / canvas.height) * fieldOfView.dec;
        return { ra, dec };
    }
    screenRaDecToEquatorial_View(screenRaDec, siderealTime) {
        const horizontal = this.screenRaDecToHorizontal_View(screenRaDec);
        return this.horizontalToEquatorial(horizontal, siderealTime, this.getLocation().latitude);
    }
    // デバイスオリエンテーションを使用した画面座標への変換
    horizontalToScreenXY_Live(horizontal, canvasSize, deviceOrientationManager) {
        const deviceInfo = deviceOrientationManager.getDeviceInfo();
        const orientationData = deviceOrientationManager.getOrientationData();
        // 基本的な座標変換
        const center = this.getCurrentCenter();
        const centerHorizontal = {
            az: center.az,
            alt: center.alt
        };
        // デバイスオリエンテーションが利用可能で許可されている場合
        if (deviceInfo.os === 'iphone' && deviceOrientationManager.isOrientationPermitted()) {
            const compassHeading = deviceOrientationManager.getCompassHeading();
            // コンパス方位を考慮して方位角を調整
            if (compassHeading !== 0) {
                const adjustedAzimuth = (horizontal.az - compassHeading + 360) % 360;
                const adjustedHorizontal = {
                    az: adjustedAzimuth,
                    alt: horizontal.alt
                };
                // 調整された座標を画面座標に変換
                const screenRaDec = this.horizontalToScreenRaDec_View(adjustedHorizontal, centerHorizontal);
                return this.screenRaDecToScreenXY(screenRaDec, canvasSize, window.config.viewState);
            }
        }
        // デバイスオリエンテーションが利用できない場合は通常の変換
        const screenRaDec = this.horizontalToScreenRaDec_View(horizontal, centerHorizontal);
        return this.screenRaDecToScreenXY(screenRaDec, canvasSize, window.config.viewState);
    }
    angularDistanceEquatorial(coords1, coords2) {
        const ra1 = coords1.ra * DEG_TO_RAD;
        const dec1 = coords1.dec * DEG_TO_RAD;
        const ra2 = coords2.ra * DEG_TO_RAD;
        const dec2 = coords2.dec * DEG_TO_RAD;
        return this.acosdeg(Math.cos(dec1) * Math.cos(dec2) * Math.cos(ra1 - ra2) + Math.sin(dec1) * Math.sin(dec2));
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
        const c2 = this.acosrad(scale * this.acosrad(c1));
        const a2 = Math.cos(thetaSH1 / Math.sqrt(1 - c1 * c1));
        const b2 = Math.sin(thetaSH1 / Math.sqrt(1 - c1 * c1));
        // c2 * sin(centerDec2) - a2 * cos(centerDec2) = sin(pinchDec)
        // c2 * cos(centerDec2) + a2 * sin(centerDec2) = cos(pinchDec) * cos(ra_diff2)
        const ra2 = Math.atan2(b2, a2) * RAD_TO_DEG;
        const dec2 = this.asindeg(Math.sin(centerDec1) * Math.sin(c2));
        return { ra: 0, dec: 0 };
    }
}
//# sourceMappingURL=coordinates.js.map