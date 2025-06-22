import { CoordinateConverter } from "../utils/coordinates.js";
export class InteractionController {
    constructor(canvas, renderOptions, renderCallback) {
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
            // ポインターIDを追跡
            this.activePointers.add(e.pointerId);
            // ポインターの座標を記録
            this.pointerPositions.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (this.activePointers.size === 1) {
                this.isDragging = false;
                this.isPinch = false;
                this.lastX = e.clientX;
                this.lastY = e.clientY;
                this.canvas.releasePointerCapture(e.pointerId);
                this.canvas.setPointerCapture(e.pointerId);
                if (e.pointerType === 'mouse') {
                    this.canvas.style.cursor = 'grabbing';
                    this.canvas.addEventListener('pointermove', this.onPointerMove, { passive: false });
                }
                else if (e.pointerType === 'touch') {
                    this.canvas.style.touchAction = 'none'; // 'auto'にしない！
                }
            }
        };
        this.onPointerMove = (e) => {
            e.preventDefault();
            // ポインターの座標を更新
            this.pointerPositions.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (this.activePointers.size === 1) {
                this.isDragging = true;
                this.isPinch = false;
                // 直接e.clientX/Yを使用して座標を計算
                const deltaX = e.clientX - this.lastX;
                const deltaY = e.clientY - this.lastY;
                // 最小移動量チェック（タッチ操作では1ピクセルに調整）
                const minMove = e.pointerType === 'touch' ? 1 : 2;
                if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < minMove) {
                    return;
                }
                // ズームレベルに応じて移動量を調整
                const moveScale = this.renderOptions.fieldOfViewRA / this.canvas.width;
                if (this.renderOptions.mode == 'AEP') {
                    this.renderOptions.centerRA += deltaX * moveScale;
                    this.renderOptions.centerDec += deltaY * moveScale;
                    // 値を正規化
                    this.renderOptions.centerRA = ((this.renderOptions.centerRA % 360) + 360) % 360;
                    if (this.renderOptions.centerDec > 90)
                        this.renderOptions.centerDec = 90;
                    if (this.renderOptions.centerDec < -90)
                        this.renderOptions.centerDec = -90;
                    const centerHorizontal = this.coordinateConverter.equatorialToHorizontal({ ra: this.renderOptions.centerRA, dec: this.renderOptions.centerDec }, window.config.siderealTime);
                    this.renderOptions.centerAz = centerHorizontal.az;
                    this.renderOptions.centerAlt = centerHorizontal.alt;
                }
                else if (this.renderOptions.mode == 'view') {
                    this.renderOptions.centerAz += deltaX * moveScale;
                    this.renderOptions.centerAlt += deltaY * moveScale;
                    if (this.renderOptions.centerAz < 0)
                        this.renderOptions.centerAz += 360;
                    if (this.renderOptions.centerAz > 360)
                        this.renderOptions.centerAz -= 360;
                    if (this.renderOptions.centerAlt > 90)
                        this.renderOptions.centerAlt = 90;
                    if (this.renderOptions.centerAlt < -90)
                        this.renderOptions.centerAlt = -90;
                    const centerEquatorial = this.coordinateConverter.horizontalToEquatorial({ az: this.renderOptions.centerAz, alt: this.renderOptions.centerAlt }, window.config.siderealTime);
                    this.renderOptions.centerRA = centerEquatorial.ra;
                    this.renderOptions.centerDec = centerEquatorial.dec;
                }
                // 座標を更新
                this.lastX = e.clientX;
                this.lastY = e.clientY;
            }
            else if (this.activePointers.size > 1 && this.baseDistance) {
                this.isDragging = false;
                this.isPinch = true;
                const x1 = this.pointerPositions.get(0)?.x;
                const y1 = this.pointerPositions.get(0)?.y;
                const x2 = this.pointerPositions.get(1)?.x;
                const y2 = this.pointerPositions.get(1)?.y;
                if (!x1 || !y1 || !x2 || !y2)
                    return;
                const distance = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
                //原点で0, 右に行くと正、上に行くと正
                const x3 = (x1 + x2) / 2 - this.canvas.offsetLeft - this.canvas.width / 2;
                const y3 = (y1 + y2) / 2 - this.canvas.offsetTop - this.canvas.height / 2;
                let scale = distance / this.baseDistance;
                if (!scale || scale == Infinity)
                    return;
                if (this.canvas.width < this.canvas.height) {
                    scale = Math.max(Math.min(scale, this.renderOptions.fieldOfViewRA / 1.0), this.renderOptions.fieldOfViewDec / 180.0);
                }
                else {
                    scale = Math.max(Math.min(scale, this.renderOptions.fieldOfViewDec / 1.0), this.renderOptions.fieldOfViewRA / 180.0);
                }
                this.baseDistance = distance;
                this.renderOptions.fieldOfViewRA /= scale;
                this.renderOptions.fieldOfViewDec /= scale;
                const pinchScreenRA = -this.renderOptions.fieldOfViewRA * x3 / this.canvas.width;
                const pinchScreenDec = -this.renderOptions.fieldOfViewDec * y3 / this.canvas.height;
                const pinchEquatorial = this.coordinateConverter.screenRaDecToEquatorial({ ra: pinchScreenRA * (1 - 1 / scale), dec: pinchScreenDec * (1 - 1 / scale) });
                this.renderOptions.centerRA = pinchEquatorial.ra;
                this.renderOptions.centerDec = pinchEquatorial.dec;
            }
            // グローバルconfigも確実に更新
            const globalConfig = window.config;
            if (globalConfig && globalConfig.renderOptions) {
                globalConfig.renderOptions.centerRA = this.renderOptions.centerRA;
                globalConfig.renderOptions.centerDec = this.renderOptions.centerDec;
                globalConfig.renderOptions.centerAz = this.renderOptions.centerAz;
                globalConfig.renderOptions.centerAlt = this.renderOptions.centerAlt;
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
            this.activePointers.delete(e.pointerId);
            this.pointerPositions.delete(e.pointerId);
            // pointercancelの場合は即座にドラッグを停止
            if (e.type === 'pointercancel') {
                if (this.isDragging) {
                    this.isDragging = false;
                    if (e.pointerType === 'mouse') {
                        this.canvas.style.cursor = 'grab';
                        this.canvas.removeEventListener('pointermove', this.onPointerMove);
                    }
                    else if (e.pointerType === 'touch') {
                        // this.canvas.style.touchAction = 'none';  // autoではなくnoneに戻す
                    }
                    this.canvas.releasePointerCapture(e.pointerId);
                    console.log('onPointerUp (cancel)', e.pointerType, e.pointerId);
                }
                return;
            }
            // 通常のpointerupの場合
            if (this.activePointers.size === 0) {
                this.isDragging = false;
                this.isPinch = false;
                if (e.pointerType === 'mouse') {
                    this.canvas.style.cursor = 'grab';
                    this.canvas.removeEventListener('pointermove', this.onPointerMove);
                }
                else if (e.pointerType === 'touch') {
                    this.canvas.removeEventListener('pointermove', this.onPointerMove);
                    this.canvas.style.touchAction = 'none'; // autoではなくnoneに戻す
                    this.canvas.releasePointerCapture(e.pointerId); // タッチでもpointer captureを解放
                }
                console.log('onPointerUp', e.pointerType, e.pointerId, 'touchCount:', this.activePointers.size);
            }
            else if (this.isPinch && this.activePointers.size === 1) {
                this.isDragging = true;
                this.isPinch = false;
                this.canvas.releasePointerCapture(e.pointerId);
                console.log('onPointerUp (pinch)', e.pointerType, e.pointerId);
            }
            // タッチ操作の場合はonTouchEndで処理するため、ここでは何もしない
        };
        this.onWheel = (e) => {
            e.preventDefault();
            const zoomAmount = e.deltaY * this.zoomSensitivity;
            this.renderOptions.fieldOfViewRA /= (1 - zoomAmount);
            this.renderOptions.fieldOfViewDec /= (1 - zoomAmount);
            // ズーム範囲を制限
            if (this.renderOptions.fieldOfViewRA < 1.0) {
                this.renderOptions.fieldOfViewRA = 1.0;
                this.renderOptions.fieldOfViewDec = this.renderOptions.fieldOfViewRA * this.canvas.height / this.canvas.width;
            }
            else if (this.renderOptions.fieldOfViewRA > 200) {
                this.renderOptions.fieldOfViewRA = 200;
                this.renderOptions.fieldOfViewDec = this.renderOptions.fieldOfViewRA * this.canvas.height / this.canvas.width;
            }
            if (this.renderOptions.fieldOfViewDec < 1.0) {
                this.renderOptions.fieldOfViewDec = 1.0;
                this.renderOptions.fieldOfViewRA = this.renderOptions.fieldOfViewDec * this.canvas.width / this.canvas.height;
            }
            else if (this.renderOptions.fieldOfViewDec > 180) {
                this.renderOptions.fieldOfViewDec = 180;
                this.renderOptions.fieldOfViewRA = this.renderOptions.fieldOfViewDec * this.canvas.width / this.canvas.height;
            }
            // グローバルconfigも確実に更新
            const globalConfig = window.config;
            if (globalConfig && globalConfig.renderOptions) {
                globalConfig.renderOptions.fieldOfViewRA = this.renderOptions.fieldOfViewRA;
                globalConfig.renderOptions.fieldOfViewDec = this.renderOptions.fieldOfViewDec;
            }
            this.renderCallback();
            // 情報表示を即座に更新
            const updateInfoDisplay = window.updateInfoDisplay;
            if (updateInfoDisplay) {
                updateInfoDisplay();
            }
        };
        this.canvas = canvas;
        this.renderOptions = renderOptions;
        this.renderCallback = renderCallback;
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
            // 参照が異なる場合は、globalConfig.renderOptionsの参照に更新
            if (this.renderOptions !== globalConfig.renderOptions) {
                this.renderOptions = globalConfig.renderOptions;
            }
        }
        Object.assign(this.renderOptions, newOptions);
        // グローバルconfigも確実に更新
        if (globalConfig && globalConfig.renderOptions) {
            Object.assign(globalConfig.renderOptions, newOptions);
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