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
        if (config && config.displaySettings.mode == 'live') {
            if (typeof window !== 'undefined' && 'addEventListener' in window) {
                if (this.deviceInfo.os === 'iphone') {
                    window.addEventListener('deviceorientation', this.handleOrientation.bind(this));
                }
                else if (this.deviceInfo.os === 'android') {
                    window.addEventListener('deviceorientationabsolute', this.handleOrientation.bind(this));
                }
            }
        }
        else {
            if (typeof window !== 'undefined' && 'addEventListener' in window) {
                if (this.deviceInfo.os === 'iphone') {
                    window.removeEventListener('deviceorientation', this.handleOrientation.bind(this));
                }
                else if (this.deviceInfo.os === 'android') {
                    window.removeEventListener('deviceorientationabsolute', this.handleOrientation.bind(this));
                }
            }
        }
    }
    // オリエンテーションイベントハンドラー
    handleOrientation(event) {
        if (event.alpha === null || event.beta === null || event.gamma === null) {
            return;
        }
        const eventOrientationData = {
            alpha: event.alpha,
            beta: event.beta,
            gamma: event.gamma,
            webkitCompassHeading: event.webkitCompassHeading
        };
        if (this.deviceInfo.os === 'iphone' && this.compassHeadingAz === 0) {
            this.compassHeadingAz = eventOrientationData.webkitCompassHeading || 0;
        }
        if (this.orientationData.alpha === null || this.orientationData.beta === null || this.orientationData.gamma === null) {
            this.orientationData = {
                alpha: event.alpha,
                beta: event.beta,
                gamma: event.gamma,
                webkitCompassHeading: event.webkitCompassHeading
            };
            return;
        }
        const orientationTime2 = Date.now();
        if (orientationTime2 - this.orientationTime1 > 50) {
            this.orientationTime1 = orientationTime2;
            if (Math.max(Math.abs(this.orientationData.alpha - event.alpha), Math.abs(this.orientationData.beta - event.beta), Math.abs(this.orientationData.gamma - event.gamma)) < 10) { //移動が大きすぎないとき
                // 最近のデータが3つ(以上)あるとき
                if (this.recentOrientationData.length > 2) {
                    // 最初のデータを削除して、新しいデータを追加
                    this.recentOrientationData.shift();
                    this.recentOrientationData.push(eventOrientationData);
                    this.moving = (Math.abs(eventOrientationData.alpha - (this.recentOrientationData[1].alpha || eventOrientationData.alpha)) > 0.2);
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
            window.renderAll();
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
        return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
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