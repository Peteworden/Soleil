import { CoordinateConverter } from "../utils/coordinates.js";
import { SettingController } from "../controllers/SettingController.js";
import { ObjectInfoController } from "../controllers/ObjectInfoController.js";
export class InteractionController {
    constructor(canvas, config, renderCallback) {
        // 状態管理
        this.isDragging = false;
        this.isPinch = false;
        this.lastX = 0;
        this.lastY = 0;
        this.baseDistance = 0;
        this.clickStartTime = 0;
        this.clickStartX = 0;
        this.clickStartY = 0;
        // タッチ追跡
        this.activePointers = new Set();
        this.pointerPositions = new Map();
        // 感度設定
        this.dragSensitivity = 0.2;
        this.zoomSensitivity = 0.001;
        this.lastDragTime = 0;
        this.onPointerDown = (e) => {
            e.preventDefault();
            // クリック開始位置と時間を記録
            this.clickStartTime = Date.now();
            this.clickStartX = e.clientX;
            this.clickStartY = e.clientY;
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
            }
        };
        this.onPointerMove = (e) => {
            e.preventDefault();
            // ドラッグ中のみstarInfoを非表示にする（スマホでのタッチ時の誤動作を防ぐ）
            if (this.isDragging || this.isPinch) {
                const starInfoElement = document.getElementById('starInfo');
                if (starInfoElement && starInfoElement.style.display === 'block') {
                    starInfoElement.style.display = 'none';
                }
                const starMarkerElement = document.getElementById('starMarker');
                if (starMarkerElement && starMarkerElement.style.display === 'block') {
                    starMarkerElement.style.display = 'none';
                }
            }
            const lstLat = { lst: this.config.siderealTime, lat: this.config.observationSite.latitude };
            // ポインターの座標を更新
            // this.pointerPositions.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (this.isDragging) {
                if (e.pointerType == 'touch' && ['live', 'ar'].includes(this.displaySettings.mode)) {
                    return;
                }
                const deltaX = e.clientX - this.lastX;
                const deltaY = e.clientY - this.lastY;
                // 最小移動量チェック
                const minMove = e.pointerType === 'touch' ? this.config.canvasSize.width / 200 : this.config.canvasSize.width / 400;
                const now = performance.now();
                if (Math.abs(deltaX) < minMove && Math.abs(deltaY) < minMove && now - this.lastDragTime < 30) {
                    return;
                }
                if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
                    return;
                }
                if ((now - this.lastDragTime < 10)) {
                    return;
                }
                // console.log("slow enough");
                // ポインターの座標を更新
                this.pointerPositions.set(e.pointerId, { x: e.clientX, y: e.clientY });
                this.lastDragTime = now;
                // 前回のポインター位置のスクリーン座標（キャンバス左上からの座標）
                const lastPointerX = this.lastX - this.canvas.offsetLeft;
                const lastPointerY = this.lastY - this.canvas.offsetTop;
                // 現在のポインター位置のスクリーン座標
                const currentPointerX = e.clientX - this.canvas.offsetLeft;
                const currentPointerY = e.clientY - this.canvas.offsetTop;
                // 前回のポインター位置のスクリーンRaDec
                const lastScreenRaDec = this.coordinateConverter.screenXYToScreenRaDec(lastPointerX, lastPointerY, { ra: this.viewState.fieldOfViewRA, dec: this.viewState.fieldOfViewDec }, this.canvas);
                if (this.displaySettings.mode == 'AEP') {
                    // 前回のポインター位置の赤道座標
                    const lastEquatorial = this.coordinateConverter.screenRaDecToEquatorial_AEP(lastScreenRaDec);
                    // 北極/南極付近の場合は従来の方式（数値的に不安定になるため）
                    // const isNearPole = Math.abs(this.viewState.centerDec) > 85 || Math.abs(lastEquatorial.dec) > 85;
                    const isNearPole = false;
                    if (!isNearPole) {
                        // 現在のポインター位置のスクリーンRaDec
                        const currentScreenRaDec = this.coordinateConverter.screenXYToScreenRaDec(currentPointerX, currentPointerY, { ra: this.viewState.fieldOfViewRA, dec: this.viewState.fieldOfViewDec }, this.canvas);
                        // 現在のポインター位置の赤道座標
                        const currentEquatorial = this.coordinateConverter.screenRaDecToEquatorial_AEP(currentScreenRaDec);
                        // ポインター位置の天球座標が保たれるように中心座標を調整
                        this.viewState.centerRA = ((lastEquatorial.ra + this.viewState.centerRA - currentEquatorial.ra) % 360 + 360) % 360;
                        this.viewState.centerDec = Math.max(-90, Math.min(90, lastEquatorial.dec + this.viewState.centerDec - currentEquatorial.dec));
                    }
                    const centerHorizontal = this.coordinateConverter.equatorialToHorizontal(lstLat, { ra: this.viewState.centerRA, dec: this.viewState.centerDec });
                    this.viewState.centerAz = centerHorizontal.az;
                    this.viewState.centerAlt = centerHorizontal.alt;
                }
                else if (this.displaySettings.mode == 'view') {
                    // 前回のポインター位置の地平座標
                    const lastHorizontal = this.coordinateConverter.screenRaDecToHorizontal_View(lastScreenRaDec);
                    // 天頂/天底付近の場合は従来の方式（数値的に不安定になるため）
                    // const isNearZenith = Math.abs(this.viewState.centerAlt) > 85 || Math.abs(lastHorizontal.alt) > 85;
                    const isNearZenith = false;
                    if (!isNearZenith) {
                        // 現在のポインター位置のスクリーンRaDec
                        const currentScreenRaDec = this.coordinateConverter.screenXYToScreenRaDec(currentPointerX, currentPointerY, { ra: this.viewState.fieldOfViewRA, dec: this.viewState.fieldOfViewDec }, this.canvas);
                        // 現在のポインター位置の地平座標
                        const currentHorizontal = this.coordinateConverter.screenRaDecToHorizontal_View(currentScreenRaDec);
                        // ポインター位置の天球座標が保たれるように中心座標を調整
                        this.viewState.centerAz = ((lastHorizontal.az + this.viewState.centerAz - currentHorizontal.az) % 360 + 360) % 360;
                        this.viewState.centerAlt = Math.max(-90, Math.min(90, lastHorizontal.alt + this.viewState.centerAlt - currentHorizontal.alt));
                    }
                    const centerEquatorial = this.coordinateConverter.horizontalToEquatorial(lstLat, { az: this.viewState.centerAz, alt: this.viewState.centerAlt });
                    this.viewState.centerRA = centerEquatorial.ra;
                    this.viewState.centerDec = centerEquatorial.dec;
                }
                // 座標を更新
                this.lastX = e.clientX;
                this.lastY = e.clientY;
            }
            else if (this.isPinch) {
                const pointerIds = this.getActivePointerIds();
                if (pointerIds.length < 2)
                    return;
                this.pointerPositions.set(e.pointerId, { x: e.clientX, y: e.clientY });
                const x1 = this.pointerPositions.get(pointerIds[0])?.x;
                const y1 = this.pointerPositions.get(pointerIds[0])?.y;
                const x2 = this.pointerPositions.get(pointerIds[1])?.x;
                const y2 = this.pointerPositions.get(pointerIds[1])?.y;
                if (!x1 || !y1 || !x2 || !y2)
                    return;
                const distance = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
                if (this.baseDistance == 0)
                    this.baseDistance = distance;
                if (distance == 0)
                    return;
                // ピンチ中心点のスクリーン座標（キャンバス左上からの座標）
                const pinchX = (x1 + x2) / 2 - this.canvas.offsetLeft;
                const pinchY = (y1 + y2) / 2 - this.canvas.offsetTop;
                // 1より大きければ拡大、小さければ縮小
                let scale = distance / this.baseDistance;
                if (!scale || scale == Infinity)
                    return;
                if (this.canvas.width < this.canvas.height) {
                    scale = Math.max(Math.min(scale, this.viewState.fieldOfViewRA / 1.0), this.viewState.fieldOfViewDec / 270.0);
                }
                else {
                    scale = Math.max(Math.min(scale, this.viewState.fieldOfViewDec / 1.0), this.viewState.fieldOfViewRA / 270.0);
                }
                // ズーム前のピンチ中心のスクリーンRaDec
                const pinchScreenRaDec = this.coordinateConverter.screenXYToScreenRaDec(pinchX, pinchY, { ra: this.viewState.fieldOfViewRA, dec: this.viewState.fieldOfViewDec }, this.canvas);
                if (this.displaySettings.mode == 'AEP') {
                    // ズーム前のピンチ中心の赤道座標を保存
                    const pinchEquatorial = this.coordinateConverter.screenRaDecToEquatorial_AEP(pinchScreenRaDec);
                    // 北極/南極付近の場合は画面中心でズーム（数値的に不安定になるため）
                    const isNearPole = Math.abs(this.viewState.centerDec) > 85 || Math.abs(pinchEquatorial.dec) > 85;
                    // ズームを適用
                    this.viewState.fieldOfViewRA /= scale;
                    this.viewState.fieldOfViewDec /= scale;
                    if (!isNearPole) {
                        const newPinchScreenRaDec = this.coordinateConverter.screenXYToScreenRaDec(pinchX, pinchY, { ra: this.viewState.fieldOfViewRA, dec: this.viewState.fieldOfViewDec }, this.canvas);
                        const newPinchEquatorial = this.coordinateConverter.screenRaDecToEquatorial_AEP(newPinchScreenRaDec);
                        this.viewState.centerRA = ((pinchEquatorial.ra + this.viewState.centerRA - newPinchEquatorial.ra) % 360 + 360) % 360;
                        this.viewState.centerDec = Math.max(-90, Math.min(90, pinchEquatorial.dec + this.viewState.centerDec - newPinchEquatorial.dec));
                        const centerHorizontal = this.coordinateConverter.equatorialToHorizontal(lstLat, { ra: this.viewState.centerRA, dec: this.viewState.centerDec });
                        this.viewState.centerAz = centerHorizontal.az;
                        this.viewState.centerAlt = centerHorizontal.alt;
                    }
                }
                else if (this.displaySettings.mode == 'view') {
                    // ズーム前のピンチ中心の地平座標を保存
                    const pinchHorizontal = this.coordinateConverter.screenRaDecToHorizontal_View(pinchScreenRaDec);
                    // 天頂/天底付近の場合は画面中心でズーム（数値的に不安定になるため）
                    const isNearZenith = Math.abs(this.viewState.centerAlt) > 85 || Math.abs(pinchHorizontal.alt) > 85;
                    // ズームを適用
                    this.viewState.fieldOfViewRA /= scale;
                    this.viewState.fieldOfViewDec /= scale;
                    if (!isNearZenith) {
                        // ピンチした位置（スクリーン上の座標が不変という意味で）のスクリーンRaDecを計算
                        const newPinchScreenRaDec = this.coordinateConverter.screenXYToScreenRaDec(pinchX, pinchY, { ra: this.viewState.fieldOfViewRA, dec: this.viewState.fieldOfViewDec }, this.canvas);
                        // 新しい中心座標でのピンチした位置での地平座標
                        const newPinchHorizontal = this.coordinateConverter.screenRaDecToHorizontal_View(newPinchScreenRaDec);
                        this.viewState.centerAz = ((pinchHorizontal.az + this.viewState.centerAz - newPinchHorizontal.az) % 360 + 360) % 360;
                        this.viewState.centerAlt = Math.max(-90, Math.min(90, pinchHorizontal.alt + this.viewState.centerAlt - newPinchHorizontal.alt));
                        const centerEquatorial = this.coordinateConverter.horizontalToEquatorial(lstLat, { az: this.viewState.centerAz, alt: this.viewState.centerAlt });
                        this.viewState.centerRA = centerEquatorial.ra;
                        this.viewState.centerDec = centerEquatorial.dec;
                    }
                }
                this.baseDistance = distance;
            }
            // URLのクエリを一度だけ削除（軽量）
            clearUrlSearchOnce();
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
            if (this.activePointers.size === 1) {
                // クリック判定
                const clickDuration = Date.now() - this.clickStartTime;
                const moveDistance = Math.sqrt((e.clientX - this.clickStartX) ** 2 +
                    (e.clientY - this.clickStartY) ** 2);
                if (this.displaySettings.showObjectInfo) {
                    //短時間（300ms以下）で移動量が少ない（10px以下）場合はクリックとして扱う
                    if (clickDuration < 300 && moveDistance < 10) {
                        // キャンバス座標に変換
                        const rect = this.canvas.getBoundingClientRect();
                        const clickX = e.clientX;
                        const clickY = e.clientY;
                        const canvasX = (clickX - rect.left) * this.canvas.width / rect.width;
                        const canvasY = (clickY - rect.top) * this.canvas.height / rect.height;
                        window.setDebugInfo(`${this.canvas.width} ${this.canvas.height} ${rect.width} ${rect.height}`);
                        // starInfoが表示されている場合、クリックした場所がstarInfoの外側なら閉じる
                        const objectInfoElement = document.getElementById('objectInfo');
                        let isClickOutsideObjectInfo = false;
                        const starInfoElement = document.getElementById('starInfo');
                        let isClickOutsideStarInfo = false;
                        if (objectInfoElement && objectInfoElement.style.display === 'block') {
                            const objectInfoRect = objectInfoElement.getBoundingClientRect();
                            if (clickX < objectInfoRect.left || clickX > objectInfoRect.right ||
                                clickY < objectInfoRect.top || clickY > objectInfoRect.bottom) {
                                isClickOutsideObjectInfo = true;
                                ObjectInfoController.closeObjectInfo();
                            }
                        }
                        else if (starInfoElement && starInfoElement.style.display === 'block') {
                            const starInfoRect = starInfoElement.getBoundingClientRect();
                            // クリックした場所がstarInfoの外側かチェック
                            if (clickX < starInfoRect.left || clickX > starInfoRect.right ||
                                clickY < starInfoRect.top || clickY > starInfoRect.bottom) {
                                isClickOutsideStarInfo = true;
                                ObjectInfoController.closeObjectInfo();
                            }
                        }
                        ObjectInfoController.showObjectInfo(canvasX, canvasY, isClickOutsideStarInfo);
                    }
                }
                this.isDragging = false;
                this.isPinch = false;
                this.lastDragTime = performance.now();
                this.activePointers.delete(e.pointerId);
                this.pointerPositions.delete(e.pointerId);
                this.canvas.releasePointerCapture(e.pointerId);
                if (e.pointerType === 'mouse') {
                    this.canvas.style.cursor = 'default';
                    this.canvas.removeEventListener('pointermove', this.onPointerMove);
                }
                else if (e.pointerType === 'touch') {
                    this.canvas.style.touchAction = 'none';
                    this.canvas.removeEventListener('pointermove', this.onPointerMove);
                }
                this.config.viewState.centerRA = this.viewState.centerRA;
                this.config.viewState.centerDec = this.viewState.centerDec;
                this.config.viewState.centerAz = this.viewState.centerAz;
                this.config.viewState.centerAlt = this.viewState.centerAlt;
                this.config.viewState.fieldOfViewRA = this.viewState.fieldOfViewRA;
                this.config.viewState.fieldOfViewDec = this.viewState.fieldOfViewDec;
                SettingController.saveConfigToLocalStorage();
            }
            else {
                this.isDragging = false;
                this.isPinch = false;
                this.lastDragTime = performance.now();
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
            const starInfoElement = document.getElementById('starInfo');
            if (starInfoElement && starInfoElement.style.display === 'block') {
                starInfoElement.style.display = 'none';
            }
            const starMarkerElement = document.getElementById('starMarker');
            if (starMarkerElement && starMarkerElement.style.display === 'block') {
                starMarkerElement.style.display = 'none';
            }
            if (this.canvas.width < this.canvas.height) {
                scale = Math.max(Math.min(scale, this.viewState.fieldOfViewDec / 1.0), this.viewState.fieldOfViewRA / 270.0);
            }
            else {
                scale = Math.max(Math.min(scale, this.viewState.fieldOfViewRA / 1.0), this.viewState.fieldOfViewDec / 270.0);
            }
            // マウス位置のスクリーン座標（中心からのオフセット）
            const mouseX = e.clientX - this.canvas.offsetLeft;
            const mouseY = e.clientY - this.canvas.offsetTop;
            // ズーム前のマウス位置のスクリーンRaDec
            const mouseScreenRADec = this.coordinateConverter.screenXYToScreenRaDec(mouseX, mouseY, { ra: this.viewState.fieldOfViewRA, dec: this.viewState.fieldOfViewDec }, this.canvas);
            const lstLat = { lst: this.config.siderealTime, lat: this.config.observationSite.latitude };
            if (this.displaySettings.mode == 'AEP') {
                // ズーム前のマウス位置の赤道座標を保存
                const mouseEquatorial = this.coordinateConverter.screenRaDecToEquatorial_AEP(mouseScreenRADec);
                // 北極/南極付近の場合は画面中心でズーム（数値的に不安定になるため）
                const isNearPole = Math.abs(this.viewState.centerDec) > 85 || Math.abs(mouseEquatorial.dec) > 85;
                // ズームを適用
                this.viewState.fieldOfViewRA /= scale;
                this.viewState.fieldOfViewDec /= scale;
                if (!isNearPole) {
                    const newMouseScreenRaDec = this.coordinateConverter.screenXYToScreenRaDec(mouseX, mouseY, { ra: this.viewState.fieldOfViewRA, dec: this.viewState.fieldOfViewDec }, this.canvas);
                    const newMouseEquatorial = this.coordinateConverter.screenRaDecToEquatorial_AEP(newMouseScreenRaDec);
                    this.viewState.centerRA = ((mouseEquatorial.ra + this.viewState.centerRA - newMouseEquatorial.ra) % 360 + 360) % 360;
                    this.viewState.centerDec = Math.max(-90, Math.min(90, mouseEquatorial.dec + this.viewState.centerDec - newMouseEquatorial.dec));
                    const centerHorizontal = this.coordinateConverter.equatorialToHorizontal(lstLat, { ra: this.viewState.centerRA, dec: this.viewState.centerDec });
                    this.viewState.centerAz = centerHorizontal.az;
                    this.viewState.centerAlt = centerHorizontal.alt;
                }
            }
            else if (this.displaySettings.mode == 'view') {
                // ズーム前のマウス位置の地平座標を保存
                const mouseHorizontal = this.coordinateConverter.screenRaDecToHorizontal_View(mouseScreenRADec);
                // 天頂/天底付近の場合は画面中心でズーム（数値的に不安定になるため）
                const isNearZenith = Math.abs(this.viewState.centerAlt) > 85 || Math.abs(mouseHorizontal.alt) > 85;
                // ズームを適用
                this.viewState.fieldOfViewRA /= scale;
                this.viewState.fieldOfViewDec /= scale;
                if (!isNearZenith) {
                    // ピンチした位置（スクリーン上の座標が不変という意味で）のスクリーンRaDecを計算
                    const newMouseScreenRaDec = this.coordinateConverter.screenXYToScreenRaDec(mouseX, mouseY, { ra: this.viewState.fieldOfViewRA, dec: this.viewState.fieldOfViewDec }, this.canvas);
                    // 新しい中心座標でのマウス位置での地平座標
                    const newMouseHorizontal = this.coordinateConverter.screenRaDecToHorizontal_View(newMouseScreenRaDec);
                    this.viewState.centerAz = ((mouseHorizontal.az + this.viewState.centerAz - newMouseHorizontal.az) % 360 + 360) % 360;
                    this.viewState.centerAlt = Math.max(-90, Math.min(90, mouseHorizontal.alt + this.viewState.centerAlt - newMouseHorizontal.alt));
                    const centerEquatorial = this.coordinateConverter.horizontalToEquatorial(lstLat, { az: this.viewState.centerAz, alt: this.viewState.centerAlt });
                    this.viewState.centerRA = centerEquatorial.ra;
                    this.viewState.centerDec = centerEquatorial.dec;
                }
            }
            // URLのクエリを一度だけ削除（軽量）
            clearUrlSearchOnce();
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
            SettingController.saveConfigToLocalStorage();
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
        Object.assign(this.viewState, this.config.viewState);
        Object.assign(this.displaySettings, this.config.displaySettings);
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
        this.canvas.addEventListener('pointerup', this.onPointerUp, { passive: false });
        this.canvas.addEventListener('pointercancel', this.onPointerUp, { passive: false });
        this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
    }
    removeEventListeners() {
        this.canvas.removeEventListener('pointerdown', this.onPointerDown);
        this.canvas.removeEventListener('pointermove', this.onPointerMove);
        this.canvas.removeEventListener('pointerup', this.onPointerUp);
        this.canvas.removeEventListener('pointercancel', this.onPointerUp);
        this.canvas.removeEventListener('wheel', this.onWheel);
    }
}
// クエリ削除を一度だけ行う軽量関数（履歴書き換えの回数を抑制）
let __urlCleared = false;
function clearUrlSearchOnce() {
    if (__urlCleared)
        return;
    if (!location.search) {
        __urlCleared = true;
        return;
    }
    try {
        if (history.replaceState) {
            history.replaceState(null, '', location.pathname + location.hash);
        }
    }
    catch (_) {
        // noop
    }
    finally {
        __urlCleared = true;
    }
}
//# sourceMappingURL=interactionController.js.map