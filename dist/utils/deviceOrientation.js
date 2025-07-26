import { CoordinateConverter } from "./coordinates.js";
export class DeviceOrientationManager {
    constructor() {
        this.orientationData = {
            alpha: 0,
            beta: 0,
            gamma: 0,
            webkitCompassHeading: 0
        };
        this.orientationTime1 = Date.now();
        this.recentOrientationData = [];
        this.moving = false;
        this.compassHeadingAz = 0;
        this.DEG_TO_RAD = Math.PI / 180;
        this.deviceInfo = this.detectOS();
        this.orientationData = {
            alpha: 180 * this.DEG_TO_RAD,
            beta: 120 * this.DEG_TO_RAD,
            gamma: 0,
            webkitCompassHeading: 0
        };
    }
    // OS検出
    detectOS() {
        let os;
        if (navigator.userAgent.indexOf("iPhone") > 0 ||
            navigator.userAgent.indexOf("iPad") > 0 ||
            navigator.userAgent.indexOf("iPod") > 0) {
            os = "iphone";
        }
        else if (navigator.userAgent.indexOf("Android") > 0) {
            os = "android";
        }
        else {
            os = "pc";
        }
        return {
            os,
            orientationPermission: false
        };
    }
    // デバイス情報を取得
    getDeviceInfo() {
        return this.deviceInfo;
    }
    // デバイスオリエンテーション許可を要求（Safari用）
    async requestOrientationPermission() {
        if (this.deviceInfo.os === 'iphone' && typeof DeviceOrientationEvent !== 'undefined' && 'requestPermission' in DeviceOrientationEvent) {
            try {
                const response = await DeviceOrientationEvent.requestPermission();
                if (response === "granted") {
                    this.deviceInfo.orientationPermission = true;
                    this.setupOrientationListener();
                    return true;
                }
            }
            catch (error) {
                console.error('Orientation permission request failed:', error);
            }
        }
        return false;
    }
    // オリエンテーションリスナーを設定
    setupOrientationListener() {
        const config = window.config;
        // まず既存のリスナーを削除
        if (typeof window !== 'undefined' && 'addEventListener' in window) {
            if (this.deviceInfo.os === 'iphone') {
                window.removeEventListener('deviceorientation', this.handleOrientation.bind(this));
            }
            else if (this.deviceInfo.os === 'android') {
                window.removeEventListener('deviceorientationabsolute', this.handleOrientation.bind(this));
                window.removeEventListener('deviceorientation', this.handleOrientation.bind(this));
            }
            else if (this.deviceInfo.os === 'pc') {
                window.removeEventListener('deviceorientation', this.handleOrientation.bind(this));
            }
        }
        // liveモードの場合のみリスナーを追加
        if (config && config.displaySettings.mode === 'live') {
            if (typeof window !== 'undefined' && 'addEventListener' in window) {
                if (this.deviceInfo.os === 'iphone') {
                    window.addEventListener('deviceorientation', this.handleOrientation.bind(this), true);
                }
                else if (this.deviceInfo.os === 'android') {
                    // Androidでは両方のイベントを試す
                    const title = document.getElementById('title');
                    try {
                        window.addEventListener('deviceorientationabsolute', this.handleOrientation.bind(this), true);
                        if (title) {
                            title.innerHTML = `<h6>do223 - deviceorientationabsolute added
                            </h6>`;
                        }
                        console.log('deviceorientationabsolute listener added');
                    }
                    catch (e) {
                        window.addEventListener('deviceorientation', this.handleOrientation.bind(this), true);
                        if (title) {
                            title.innerHTML = `<h6>do223 - deviceorientation fallback added
                            </h6>`;
                        }
                        console.log('deviceorientation fallback listener added');
                    }
                }
                else if (this.deviceInfo.os === 'pc') {
                    // window.addEventListener('deviceorientation', this.handleOrientation.bind(this), true);
                    console.log('deviceorientation pc');
                }
            }
        }
    }
    // オリエンテーションイベントハンドラー
    handleOrientation(event) {
        // デバッグ情報を表示
        const title = document.getElementById('title');
        /*
        if (title) {
            title.innerHTML = `<h6>
            OS: ${this.deviceInfo.os}<br>
            a=${event.alpha?.toFixed(2) || 0},
            b=${event.beta?.toFixed(2) || 0},
            g=${event.gamma?.toFixed(2) || 0}<br>
            compass=${(event as any).webkitCompassHeading?.toFixed(2) || 'N/A'}
            </h6>`;
            console.log('Title updated successfully');
        } else {
            console.log('Title element not found');
            // 代替手段：bodyに直接追加
            const debugDiv = document.createElement('div');
            debugDiv.style.position = 'fixed';
            debugDiv.style.top = '10px';
            debugDiv.style.left = '10px';
            debugDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
            debugDiv.style.color = 'white';
            debugDiv.style.padding = '10px';
            debugDiv.style.zIndex = '9999';
            debugDiv.innerHTML = `
                OS: ${this.deviceInfo.os}<br>
                a=${event.alpha?.toFixed(2) || 0},
                b=${event.beta?.toFixed(2) || 0},
                g=${event.gamma?.toFixed(2) || 0}<br>
                compass=${(event as any).webkitCompassHeading?.toFixed(2) || 'N/A'}
            `;
            document.body.appendChild(debugDiv);
        }
            */
        // liveモード以外の場合は処理をスキップ
        const config = window.config;
        if (!config || config.displaySettings.mode !== 'live') {
            return;
        }
        if (event.alpha === null || event.beta === null || event.gamma === null) {
            return;
        }
        const eventOrientationData = {
            alpha: event.alpha * this.DEG_TO_RAD || 0,
            beta: event.beta * this.DEG_TO_RAD || 0,
            gamma: event.gamma * this.DEG_TO_RAD || 0,
            webkitCompassHeading: event.webkitCompassHeading * this.DEG_TO_RAD || 0
        };
        if (this.deviceInfo.os === 'iphone' && this.compassHeadingAz === 0) {
            this.compassHeadingAz = eventOrientationData.webkitCompassHeading || 0;
        }
        if (this.orientationData.alpha === null || this.orientationData.beta === null || this.orientationData.gamma === null) {
            this.orientationData = {
                alpha: event.alpha * this.DEG_TO_RAD || 0,
                beta: event.beta * this.DEG_TO_RAD || 0,
                gamma: event.gamma * this.DEG_TO_RAD || 0,
                webkitCompassHeading: event.webkitCompassHeading * this.DEG_TO_RAD || 0
            };
            return;
        }
        const orientationTime2 = Date.now();
        if (orientationTime2 - this.orientationTime1 < 50) {
            return;
        }
        this.orientationTime1 = orientationTime2;
        if (Math.max(Math.abs(this.orientationData.alpha - eventOrientationData.alpha), Math.abs(this.orientationData.beta - eventOrientationData.beta), Math.abs(this.orientationData.gamma - eventOrientationData.gamma)) < 10 * this.DEG_TO_RAD) { //移動が大きすぎないとき
            // 最近のデータが3つ(以上)あるとき
            if (this.recentOrientationData.length > 2) {
                // 最初のデータを削除して、新しいデータを追加
                this.recentOrientationData.shift();
                this.recentOrientationData.push(eventOrientationData);
                this.moving = (Math.abs(eventOrientationData.alpha - (this.recentOrientationData[1].alpha || eventOrientationData.alpha)) > 0.2 * this.DEG_TO_RAD);
                this.orientationData = {
                    alpha: this.recentOrientationData.reduce((acc, val) => acc + (val.alpha || 0), 0) / this.recentOrientationData.length,
                    beta: this.recentOrientationData.reduce((acc, val) => acc + (val.beta || 0), 0) / this.recentOrientationData.length,
                    gamma: this.recentOrientationData.reduce((acc, val) => acc + (val.gamma || 0), 0) / this.recentOrientationData.length,
                    webkitCompassHeading: this.recentOrientationData[2].webkitCompassHeading
                };
            }
            else {
                // 最近のデータが2つ以下のとき
                this.recentOrientationData.push(eventOrientationData);
            }
        }
        else {
            // 移動が大きいときは作り直す
            this.recentOrientationData = [eventOrientationData];
            this.orientationData = eventOrientationData;
        }
        const coordinateConverter = new CoordinateConverter();
        if (coordinateConverter) {
            const centerHorizontal = coordinateConverter.screenRaDecToHorizontal_Live({ ra: 0, dec: 0 }, this.orientationData);
            const centerRaDec = coordinateConverter.horizontalToEquatorial(centerHorizontal, window.config.siderealTime);
            const updateConfig = window.updateConfig;
            if (updateConfig) {
                updateConfig({
                    viewState: {
                        ...window.config.viewState,
                        centerRA: centerRaDec.ra,
                        centerDec: centerRaDec.dec,
                        centerAz: centerHorizontal.az,
                        centerAlt: centerHorizontal.alt
                    }
                });
            }
            if (title) {
                title.innerHTML = `<h6>do232
                ${window.config.viewState.centerRA.toFixed(2)},
                ${window.config.viewState.centerDec.toFixed(2)},
                ${window.config.viewState.centerAz.toFixed(2)},
                ${window.config.viewState.centerAlt.toFixed(2)}
                </h6>`;
            }
        }
    }
    // オリエンテーションデータを取得
    getOrientationData() {
        return this.orientationData;
    }
    // デバイスが動いているかどうかを取得
    isDeviceMoving() {
        return this.moving;
    }
    // コンパス方位を取得
    getCompassHeading() {
        return this.orientationData.webkitCompassHeading || 0;
    }
    // オリエンテーション変更時のコールバックを設定
    setOrientationCallback(callback) {
        this.orientationCallback = callback;
    }
    // デバイスオリエンテーション機能が利用可能かどうかを確認
    // main.tsで呼ばれる
    isOrientationAvailable() {
        const available = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
        console.log('DeviceOrientationEvent available:', available);
        return available;
    }
    // デバイスオリエンテーション機能が許可されているかどうかを確認
    isOrientationPermitted() {
        return this.deviceInfo.orientationPermission;
    }
    handleDeviceOrientation(data) {
        this.orientationData = data;
        window.renderAll();
    }
}
//# sourceMappingURL=deviceOrientation.js.map