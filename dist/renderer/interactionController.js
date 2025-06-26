import { CoordinateConverter } from "../utils/coordinates.js";
export class InteractionController {
    constructor(canvas, config, renderCallback) {
        // 状態管理
        this.isDragging = false;
        this.isPinch = false;
        this.lastX = 0;
        this.lastY = 0;
        this.baseDistance = 0;
        // タッチ追跡
        this.activePointers = new Set();
        this.pointerPositions = new Map();
        // 感度設定
        this.dragSensitivity = 0.2;
        this.zoomSensitivity = 0.001;
        this.onPointerDown = (e) => {
            e.preventDefault();
            if (this.activePointers.size <= 2) {
                // ポインターIDを追跡
                this.activePointers.add(e.pointerId);
                // ポインターの座標を記録
                this.pointerPositions.set(e.pointerId, { x: e.clientX, y: e.clientY });
            }
            if (this.activePointers.size === 1) {
                this.isDragging = true;
                this.isPinch = false;
                this.lastX = e.clientX;
                this.lastY = e.clientY;
                this.canvas.releasePointerCapture(e.pointerId);
                this.canvas.setPointerCapture(e.pointerId);
                const titleElement = document.getElementById('titleText');
                if (titleElement) {
                    titleElement.innerHTML = e.pointerType;
                }
                if (e.pointerType === 'mouse') {
                    this.canvas.style.cursor = 'grabbing';
                    this.canvas.addEventListener('pointermove', this.onPointerMove, { passive: false });
                }
                else if (e.pointerType === 'touch') {
                    this.canvas.style.touchAction = 'none'; // 'auto'にしない！
                    this.canvas.addEventListener('pointermove', this.onPointerMove, { passive: false });
                }
            }
            else if (this.activePointers.size === 2) {
                this.isDragging = false;
                this.isPinch = true;
                const titleElement = document.getElementById('titleText');
                if (titleElement) {
                    titleElement.innerHTML = 'pinching';
                }
            }
        };
        this.onPointerMove = (e) => {
            e.preventDefault();
            // ポインターの座標を更新
            this.pointerPositions.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (this.isDragging) {
                const titleText = document.getElementById('titleText');
                if (titleText) {
                    titleText.innerHTML = 'dragging';
                }
                const deltaX = e.clientX - this.lastX;
                const deltaY = e.clientY - this.lastY;
                // 最小移動量チェック（タッチ操作では1ピクセルに調整）
                const minMove = e.pointerType === 'touch' ? 1 : 2;
                if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < minMove) {
                    return;
                }
                // ズームレベルに応じて移動量を調整
                const moveScale = this.viewState.fieldOfViewRA / this.canvas.width;
                if (this.displaySettings.mode == 'AEP') {
                    this.viewState.centerRA += deltaX * moveScale;
                    this.viewState.centerDec += deltaY * moveScale;
                    // 値を正規化
                    this.viewState.centerRA = ((this.viewState.centerRA % 360) + 360) % 360;
                    if (this.viewState.centerDec > 90)
                        this.viewState.centerDec = 90;
                    if (this.viewState.centerDec < -90)
                        this.viewState.centerDec = -90;
                    const centerHorizontal = this.coordinateConverter.equatorialToHorizontal({ ra: this.viewState.centerRA, dec: this.viewState.centerDec }, window.config.siderealTime);
                    this.viewState.centerAz = centerHorizontal.az;
                    this.viewState.centerAlt = centerHorizontal.alt;
                }
                else if (this.displaySettings.mode == 'view') {
                    this.viewState.centerAz += deltaX * moveScale;
                    this.viewState.centerAlt += deltaY * moveScale;
                    if (this.viewState.centerAz < 0)
                        this.viewState.centerAz += 360;
                    if (this.viewState.centerAz > 360)
                        this.viewState.centerAz -= 360;
                    if (this.viewState.centerAlt > 90)
                        this.viewState.centerAlt = 90;
                    if (this.viewState.centerAlt < -90)
                        this.viewState.centerAlt = -90;
                    const centerEquatorial = this.coordinateConverter.horizontalToEquatorial({ az: this.viewState.centerAz, alt: this.viewState.centerAlt }, window.config.siderealTime);
                    this.viewState.centerRA = centerEquatorial.ra;
                    this.viewState.centerDec = centerEquatorial.dec;
                }
                // 座標を更新
                this.lastX = e.clientX;
                this.lastY = e.clientY;
            }
            else if (this.isPinch) {
                const titleText = document.getElementById('titleText');
                const pointerIds = this.getActivePointerIds();
                if (pointerIds.length < 2)
                    return;
                const x1 = this.pointerPositions.get(pointerIds[0])?.x;
                const y1 = this.pointerPositions.get(pointerIds[0])?.y;
                const x2 = this.pointerPositions.get(pointerIds[1])?.x;
                const y2 = this.pointerPositions.get(pointerIds[1])?.y;
                if (!x1 || !y1 || !x2 || !y2)
                    return;
                const distance = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
                if (titleText) {
                    titleText.innerHTML = `pinching ${this.baseDistance} ${distance}`;
                }
                if (this.baseDistance == 0)
                    this.baseDistance = distance;
                if (distance == 0)
                    return;
                //原点で0, 右に行くと正、上に行くと正
                const x3 = (x1 + x2) / 2 - this.canvas.offsetLeft - this.canvas.width / 2;
                const y3 = (y1 + y2) / 2 - this.canvas.offsetTop - this.canvas.height / 2;
                // 1より大きければ拡大、小さければ縮小
                let scale = distance / this.baseDistance;
                if (!scale || scale == Infinity)
                    return;
                if (this.canvas.width < this.canvas.height) {
                    scale = Math.max(Math.min(scale, this.viewState.fieldOfViewRA / 1.0), this.viewState.fieldOfViewDec / 180.0);
                }
                else {
                    scale = Math.max(Math.min(scale, this.viewState.fieldOfViewDec / 1.0), this.viewState.fieldOfViewRA / 180.0);
                }
                this.viewState.fieldOfViewRA /= scale;
                this.viewState.fieldOfViewDec /= scale;
                if (this.displaySettings.mode == 'AEP') {
                    const pinchScreenRA = -this.viewState.fieldOfViewRA * x3 / this.canvas.width;
                    const pinchScreenDec = -this.viewState.fieldOfViewDec * y3 / this.canvas.height;
                    const pinchEquatorial = this.coordinateConverter.screenRaDecToEquatorial_AEP({ ra: pinchScreenRA * (1 - 1 / scale), dec: pinchScreenDec * (1 - 1 / scale) });
                    this.viewState.centerRA = pinchEquatorial.ra;
                    this.viewState.centerDec = pinchEquatorial.dec;
                    const centerHorizontal = this.coordinateConverter.equatorialToHorizontal({ ra: pinchEquatorial.ra, dec: pinchEquatorial.dec }, window.config.siderealTime);
                    this.viewState.centerAz = centerHorizontal.az;
                    this.viewState.centerAlt = centerHorizontal.alt;
                }
                else if (this.displaySettings.mode == 'view') {
                    const pinchScreenAz = this.viewState.fieldOfViewRA * x3 / this.canvas.width;
                    const pinchScreenAlt = -this.viewState.fieldOfViewDec * y3 / this.canvas.height;
                    const pinchHorizontal = this.coordinateConverter.screenRaDecToHorizontal_View({ ra: pinchScreenAz * (1 - 1 / scale), dec: pinchScreenAlt * (1 - 1 / scale) });
                    this.viewState.centerAz = pinchHorizontal.az;
                    this.viewState.centerAlt = pinchHorizontal.alt;
                    const pinchEquatorial = this.coordinateConverter.horizontalToEquatorial({ az: pinchHorizontal.az, alt: pinchHorizontal.alt }, window.config.siderealTime);
                    this.viewState.centerRA = pinchEquatorial.ra;
                    this.viewState.centerDec = pinchEquatorial.dec;
                }
                this.baseDistance = distance;
            }
            // グローバルconfigも確実に更新
            const globalConfig = window.config;
            if (globalConfig && globalConfig.viewState) {
                globalConfig.viewState.centerRA = this.viewState.centerRA;
                globalConfig.viewState.centerDec = this.viewState.centerDec;
                globalConfig.viewState.centerAz = this.viewState.centerAz;
                globalConfig.viewState.centerAlt = this.viewState.centerAlt;
                globalConfig.viewState.fieldOfViewRA = this.viewState.fieldOfViewRA;
                globalConfig.viewState.fieldOfViewDec = this.viewState.fieldOfViewDec;
            }
            this.renderCallback();
            // 情報表示を即座に更新
            const updateInfoDisplay = window.updateInfoDisplay;
            if (updateInfoDisplay) {
                updateInfoDisplay();
            }
        };
        this.onPointerUp = (e) => {
            console.log('onPointerUp', e.type, e.pointerType, e.pointerId, this.isDragging, this.activePointers.size);
            // // pointercancelの場合は即座にドラッグを停止
            // if (e.type === 'pointercancel') {
            //     if (this.isDragging) {
            //         this.isDragging = false;
            //         const titleElement = document.getElementById('titleText');
            //         if (titleElement) {
            //             titleElement.innerHTML = '星図';
            //         }
            //         if (e.pointerType === 'mouse') {
            //             this.canvas.style.cursor = 'grab';
            //             this.canvas.removeEventListener('pointermove', this.onPointerMove);
            //         } else if (e.pointerType === 'touch') {
            //             this.canvas.style.touchAction = 'none';  // autoではなくnoneに戻す
            //         }
            //         this.canvas.releasePointerCapture(e.pointerId);
            //         console.log('onPointerUp (cancel)', e.pointerType, e.pointerId);
            //         // localstorageに保存
            //         this.config.viewState.centerRA = this.viewState.centerRA;
            //         this.config.viewState.centerDec = this.viewState.centerDec;
            //         this.config.viewState.centerAz = this.viewState.centerAz;
            //         this.config.viewState.centerAlt = this.viewState.centerAlt;
            //         this.config.viewState.fieldOfViewRA = this.viewState.fieldOfViewRA;
            //         this.config.viewState.fieldOfViewDec = this.viewState.fieldOfViewDec;
            //         localStorage.setItem('config', JSON.stringify({
            //             displaySettings: this.config.displaySettings,
            //             viewState: this.config.viewState
            //         }));
            //         console.log('💾 Config saved to localStorage:', this.config);
            //     } else if (this.isPinch) {
            //         this.isPinch = false;
            //     }
            //     return;
            // }
            if (this.activePointers.size === 1) {
                this.isDragging = false;
                this.isPinch = false;
                const titleElement = document.getElementById('titleText');
                if (titleElement) {
                    titleElement.innerHTML = '星図';
                }
                this.activePointers.delete(e.pointerId);
                this.pointerPositions.delete(e.pointerId);
                this.canvas.releasePointerCapture(e.pointerId);
                if (e.pointerType === 'mouse') {
                    this.canvas.style.cursor = 'grab';
                    this.canvas.removeEventListener('pointermove', this.onPointerMove);
                }
                else if (e.pointerType === 'touch') {
                    this.canvas.style.touchAction = 'none';
                    this.canvas.removeEventListener('pointermove', this.onPointerMove);
                }
                console.log('onPointerUp', e.pointerType, e.pointerId, 'touchCount:', this.activePointers.size);
                this.config.viewState.centerRA = this.viewState.centerRA;
                this.config.viewState.centerDec = this.viewState.centerDec;
                this.config.viewState.centerAz = this.viewState.centerAz;
                this.config.viewState.centerAlt = this.viewState.centerAlt;
                this.config.viewState.fieldOfViewRA = this.viewState.fieldOfViewRA;
                this.config.viewState.fieldOfViewDec = this.viewState.fieldOfViewDec;
                localStorage.setItem('config', JSON.stringify({
                    displaySettings: this.config.displaySettings,
                    viewState: this.config.viewState
                }));
                console.log('💾 Config saved to localStorage:', this.config);
            }
            else if (this.activePointers.size === 2) {
                this.isDragging = true;
                this.isPinch = false;
                this.activePointers.delete(e.pointerId);
                this.pointerPositions.delete(e.pointerId);
                this.canvas.releasePointerCapture(e.pointerId);
                console.log('onPointerUp (2)', e.pointerType, e.pointerId);
            }
            this.baseDistance = 0;
        };
        this.onWheel = (e) => {
            e.preventDefault();
            let scale = 1 - e.deltaY * this.zoomSensitivity;
            if (!scale || scale == Infinity || scale == 0)
                return;
            if (this.canvas.width < this.canvas.height) {
                scale = Math.max(Math.min(scale, this.viewState.fieldOfViewRA / 1.0), this.viewState.fieldOfViewDec / 180.0);
            }
            else {
                scale = Math.max(Math.min(scale, this.viewState.fieldOfViewDec / 1.0), this.viewState.fieldOfViewRA / 180.0);
            }
            const x = e.clientX - this.canvas.offsetLeft - this.canvas.width / 2;
            const y = e.clientY - this.canvas.offsetTop - this.canvas.height / 2;
            this.viewState.fieldOfViewRA /= scale;
            this.viewState.fieldOfViewDec /= scale;
            if (this.displaySettings.mode == 'AEP') {
                const pinchScreenRA = -this.viewState.fieldOfViewRA * x / this.canvas.width;
                const pinchScreenDec = -this.viewState.fieldOfViewDec * y / this.canvas.height;
                const pinchEquatorial = this.coordinateConverter.screenRaDecToEquatorial_AEP({ ra: pinchScreenRA * (1 - 1 / scale), dec: pinchScreenDec * (1 - 1 / scale) });
                this.viewState.centerRA = pinchEquatorial.ra;
                this.viewState.centerDec = pinchEquatorial.dec;
                const centerHorizontal = this.coordinateConverter.equatorialToHorizontal({ ra: pinchEquatorial.ra, dec: pinchEquatorial.dec }, window.config.siderealTime);
                this.viewState.centerAz = centerHorizontal.az;
                this.viewState.centerAlt = centerHorizontal.alt;
            }
            else if (this.displaySettings.mode == 'view') {
                const pinchScreenAz = this.viewState.fieldOfViewRA * x / this.canvas.width;
                const pinchScreenAlt = -this.viewState.fieldOfViewDec * y / this.canvas.height;
                const pinchHorizontal = this.coordinateConverter.screenRaDecToHorizontal_View({ ra: pinchScreenAz * (1 - 1 / scale), dec: pinchScreenAlt * (1 - 1 / scale) });
                this.viewState.centerAz = pinchHorizontal.az;
                this.viewState.centerAlt = pinchHorizontal.alt;
                const pinchEquatorial = this.coordinateConverter.horizontalToEquatorial({ az: pinchHorizontal.az, alt: pinchHorizontal.alt }, window.config.siderealTime);
                this.viewState.centerRA = pinchEquatorial.ra;
                this.viewState.centerDec = pinchEquatorial.dec;
            }
            // グローバルconfigも確実に更新
            const globalConfig = window.config;
            if (globalConfig && globalConfig.viewState) {
                globalConfig.viewState.centerRA = this.viewState.centerRA;
                globalConfig.viewState.centerDec = this.viewState.centerDec;
                globalConfig.viewState.centerAz = this.viewState.centerAz;
                globalConfig.viewState.centerAlt = this.viewState.centerAlt;
                globalConfig.viewState.fieldOfViewRA = this.viewState.fieldOfViewRA;
                globalConfig.viewState.fieldOfViewDec = this.viewState.fieldOfViewDec;
            }
            this.renderCallback();
            // 情報表示を即座に更新
            const updateInfoDisplay = window.updateInfoDisplay;
            if (updateInfoDisplay) {
                updateInfoDisplay();
            }
        };
        this.canvas = canvas;
        this.config = config;
        this.displaySettings = config.displaySettings;
        this.viewState = config.viewState;
        this.renderCallback = renderCallback;
        this.baseDistance = 0;
        console.log('🎨 InteractionController constructor: renderCallback:', this.renderCallback);
        this.coordinateConverter = new CoordinateConverter();
        // タッチ操作のデフォルト動作を無効化
        this.canvas.style.touchAction = 'none';
        this.canvas.style.userSelect = 'none';
        this.canvas.style.webkitUserSelect = 'none';
        this.canvas.style.msUserSelect = 'none';
        this.canvas.style.webkitTouchCallout = 'none';
        this.setupEventListeners();
    }
    // オプション更新メソッドを追加
    updateOptions(newOptions) {
        // グローバルconfigとの参照を確認
        const globalConfig = window.config;
        if (globalConfig) {
            // 参照が異なる場合は、globalConfigの参照に更新
            if (this.config !== globalConfig || this.viewState !== globalConfig.viewState || this.displaySettings !== globalConfig.displaySettings) {
                this.config = globalConfig;
                this.viewState = globalConfig.viewState;
                this.displaySettings = globalConfig.displaySettings;
            }
        }
        Object.assign(this.config, newOptions);
        Object.assign(this.viewState, newOptions.viewState);
        Object.assign(this.displaySettings, newOptions.displaySettings);
        // グローバルconfigも確実に更新
        if (globalConfig) {
            Object.assign(globalConfig, newOptions);
        }
        this.renderCallback();
    }
    // アクティブなポインター数を取得
    getActivePointerCount() {
        return this.activePointers.size;
    }
    // アクティブなポインターIDのリストを取得
    getActivePointerIds() {
        return Array.from(this.activePointers);
    }
    // タッチ操作中かどうかを判定
    isTouchActive() {
        return this.activePointers.size > 0;
    }
    // 特定のポインターの座標を取得
    getPointerPosition(pointerId) {
        return this.pointerPositions.get(pointerId);
    }
    // 全ポインターの座標を取得
    getAllPointerPositions() {
        return new Map(this.pointerPositions);
    }
    // 全ポインターの座標をオブジェクト形式で取得
    getPointerPositionsObject() {
        return Object.fromEntries(this.pointerPositions);
    }
    // タッチ操作の状態をリセット
    resetTouchState() {
        this.isDragging = false;
        this.activePointers.clear();
        this.pointerPositions.clear();
        this.canvas.style.touchAction = 'none';
        this.canvas.style.cursor = 'grab';
        console.log('Touch state reset');
    }
    // configの変更を監視してCoordinateConverterを更新
    updateCoordinateConverter() {
        this.coordinateConverter.reloadFromConfig();
    }
    setupEventListeners() {
        // PointerEventでマウスとタッチを両方扱う
        this.canvas.addEventListener('pointerdown', this.onPointerDown, { passive: false });
        // this.canvas.addEventListener('pointermove', this.onPointerMove, { passive: false });
        this.canvas.addEventListener('pointerup', this.onPointerUp, { passive: false });
        this.canvas.addEventListener('pointercancel', this.onPointerUp, { passive: false });
        this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
    }
}
//# sourceMappingURL=interactionController.js.map