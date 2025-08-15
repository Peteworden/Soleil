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
        this.DEG_TO_RAD = Math.PI / 180;
        this.videoOn = false;
        this.deviceInfo = this.detectOS();
        this.orientationData = {
            alpha: 180 * this.DEG_TO_RAD,
            beta: 120 * this.DEG_TO_RAD,
            gamma: 0,
            webkitCompassHeading: 0
        };
        this.videoOn = false;
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
        if (config && ['live', 'ar'].includes(config.displaySettings.mode)) {
            if (typeof window !== 'undefined' && 'addEventListener' in window) {
                if (this.deviceInfo.os === 'iphone') {
                    window.addEventListener('deviceorientation', this.handleOrientation.bind(this), true);
                }
                else if (this.deviceInfo.os === 'android') {
                    // Androidでは両方のイベントを試す
                    try {
                        window.addEventListener('deviceorientationabsolute', this.handleOrientation.bind(this), true);
                        console.log('deviceorientationabsolute listener added');
                    }
                    catch (e) {
                        window.addEventListener('deviceorientation', this.handleOrientation.bind(this), true);
                        console.log('deviceorientation fallback listener added');
                    }
                }
                else if (this.deviceInfo.os === 'pc') {
                    // window.addEventListener('deviceorientation', this.handleOrientation.bind(this), true);
                    console.log('deviceorientation pc');
                }
            }
        }
        if (config) {
            if (config.displaySettings.mode === 'ar' && this.videoOn == false) {
                this.setVideoOn();
            }
            else if (config.displaySettings.mode != 'ar' && this.videoOn == true) {
                this.setVideoOff();
            }
        }
    }
    // オリエンテーションイベントハンドラー
    handleOrientation(event) {
        const config = window.config;
        if (!config || !['live', 'ar'].includes(config.displaySettings.mode)) {
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
        if (this.orientationData.alpha === null || this.orientationData.beta === null || this.orientationData.gamma === null) {
            this.orientationData = eventOrientationData;
            return;
        }
        const orientationTime2 = Date.now();
        if (orientationTime2 - this.orientationTime1 < 30) {
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
        }
        const canvasRenderer = window.renderer;
        if (canvasRenderer) {
            canvasRenderer.setOrientationData(this.orientationData);
        }
    }
    setVideoOn() {
        const arOpacity = document.getElementById('arOpacitySlider').valueAsNumber;
        const constraints = { audio: false, video: { facingMode: "environment" } };
        navigator.mediaDevices.getUserMedia(constraints)
            .then(function (stream) {
            const video = document.getElementById('arVideo');
            if (video) {
                video.srcObject = stream;
                video.onloadedmetadata = function (e) {
                    video.play();
                };
                video.style.opacity = arOpacity.toString();
                video.style.display = 'block';
            }
        });
        this.videoOn = true;
    }
    setVideoOff() {
        const video = document.getElementById('arVideo');
        if (video) {
            video.style.display = 'none';
            if (video.srcObject) {
                const stream = video.srcObject;
                stream.getTracks().forEach(track => track.stop());
                video.srcObject = null;
            }
        }
        this.videoOn = false;
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