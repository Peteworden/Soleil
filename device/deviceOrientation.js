import { AzAlt, CanvasRaDec } from "../core/coordinates/index.js";
import { getConfig, updateConfig } from "../main.js";
import { DEG_TO_RAD } from "../utils/constants.js";
export class DeviceOrientationManager {
    constructor() {
        this.orientationData = {
            alpha: 0,
            beta: 0,
            gamma: 0,
            webkitCompassHeading: 0
        };
        this.prevOrientationData = {
            alpha: 0,
            beta: 0,
            gamma: 0,
            webkitCompassHeading: 0
        };
        this.currentOrientationData = {
            alpha: 0,
            beta: 0,
            gamma: 0,
            webkitCompassHeading: 0
        };
        this.orientationTime1 = Date.now();
        this.recentOrientationData = [];
        this.moving = false;
        this.videoOn = false;
        // オリエンテーションイベントハンドラー
        // private handleOrientation = (e: DeviceOrientationEvent) => {
        //     // 毎回オブジェクトを new せず、既存のメモリ（プロパティ）を上書きする（GC対策）
        //     this.orientationData.alpha = e.alpha ?? 0;
        //     this.orientationData.beta = e.beta ?? 0;
        //     this.orientationData.gamma = e.gamma ?? 0;
        //     this.orientationData.webkitCompassHeading = (e as any).webkitCompassHeading ?? null;
        // };
        this.handleOrientation = (event) => {
            const config = getConfig();
            if (!config || !['live', 'ar'].includes(config.displaySettings.mode)) {
                return;
            }
            if (event.alpha === null || event.beta === null || event.gamma === null) {
                return;
            }
            // const eventOrientationData = {
            //     alpha: event.alpha * DEG_TO_RAD || 0,
            //     beta: event.beta * DEG_TO_RAD || 0,
            //     gamma: event.gamma * DEG_TO_RAD || 0,
            //     webkitCompassHeading: (event as any).webkitCompassHeading * DEG_TO_RAD || 0
            // };
            // if (this.orientationData.alpha === null || this.orientationData.beta === null || this.orientationData.gamma === null) {
            //     this.orientationData = eventOrientationData;
            //     return;
            // }
            this.currentOrientationData.alpha = (event.alpha ?? 0) * DEG_TO_RAD;
            this.currentOrientationData.beta = (event.beta ?? 0) * DEG_TO_RAD;
            this.currentOrientationData.gamma = (event.gamma ?? 0) * DEG_TO_RAD;
            this.currentOrientationData.webkitCompassHeading = (event.webkitCompassHeading || 0) * DEG_TO_RAD;
            const orientationTime2 = Date.now();
            if (orientationTime2 - this.orientationTime1 < 30) {
                return;
            }
            this.orientationTime1 = orientationTime2;
            if (Math.max(Math.abs(this.currentOrientationData.alpha - this.prevOrientationData.alpha), Math.abs(this.currentOrientationData.beta - this.prevOrientationData.beta), Math.abs(this.currentOrientationData.gamma - this.prevOrientationData.gamma)) < 10 * DEG_TO_RAD) { //移動が大きすぎないとき
                // 最近のデータが3つ(以上)あるとき
                const numRecentOrientationData = this.recentOrientationData.length;
                if (this.recentOrientationData.length > 2) {
                    // 最初のデータを削除して、末尾に新しいデータを追加
                    this.recentOrientationData.shift();
                    this.recentOrientationData.push(this.currentOrientationData);
                    // this.moving = (Math.abs(this.currentOrientationData.alpha - this.prevOrientationData.alpha) > 0.2 * DEG_TO_RAD);
                    this.orientationData.alpha = this.recentOrientationData.reduce((acc, val) => acc + (val.alpha || 0), 0) / this.recentOrientationData.length,
                        this.orientationData.beta = this.recentOrientationData.reduce((acc, val) => acc + (val.beta || 0), 0) / this.recentOrientationData.length,
                        this.orientationData.gamma = this.recentOrientationData.reduce((acc, val) => acc + (val.gamma || 0), 0) / this.recentOrientationData.length,
                        this.orientationData.webkitCompassHeading = this.currentOrientationData.webkitCompassHeading;
                }
                else {
                    // 最近のデータが2つ以下のとき
                    this.recentOrientationData.push(this.currentOrientationData);
                }
            }
            else {
                // 移動が大きいときは作り直す
                this.recentOrientationData = [this.currentOrientationData];
                this.orientationData = this.currentOrientationData;
            }
            const lstLat = { lst: config.siderealTime, lat: config.observationSite.latitude };
            const centerHorizontal = CanvasRaDec.toAzAlt_Live({ ra: 0.0, dec: 0.0 }, this.orientationData);
            const centerRadec = AzAlt.toRadec(centerHorizontal, lstLat);
            updateConfig({
                viewState: {
                    ...config.viewState,
                    centerRA: centerRadec.ra,
                    centerDec: centerRadec.dec,
                    centerAz: centerHorizontal.az,
                    centerAlt: centerHorizontal.alt
                }
            });
            const canvasRenderer = window.renderer;
            if (canvasRenderer) {
                canvasRenderer.setOrientationData(this.orientationData);
            }
        };
        this.deviceInfo = this.detectOS();
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
        const config = getConfig();
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
    setVideoOn() {
        const constraints = { audio: false, video: { facingMode: "environment" } };
        navigator.mediaDevices.getUserMedia(constraints)
            .then(function (stream) {
            const video = document.getElementById('arVideo');
            if (video) {
                video.srcObject = stream;
                video.onloadedmetadata = function (e) {
                    video.play();
                };
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
    getOrientation() {
        return this.orientationData;
    }
}
//# sourceMappingURL=deviceOrientation.js.map