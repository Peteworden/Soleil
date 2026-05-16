import { CoordinateConverter } from "../core/coordinates.js";
import { AzAlt, CanvasRaDec, RaDec } from "../core/coordinates/index.js";
import { DisplaySettings, StarChartConfig, TransformModeConfig, ViewState } from "../types/index.js";
import { ObjectInfoController } from "./ObjectInfoController.js";
import { getConfig, saveConfigToLocalStorage, updateConfig } from "../main.js";

export class InteractionController {
    private canvas: HTMLCanvasElement;
    private config: StarChartConfig;
    private latestState: ViewState;
    private coordinateConverter: CoordinateConverter;
    // 状態管理
    private isDragging = false;
    private isPinch = false;
    private lastX = 0;
    private lastY = 0;
    private baseDistance = 0;
    private clickStartTime = 0;
    private clickStartX = 0;
    private clickStartY = 0;
    private isZoomScheduled: boolean = false;
    private accumulatedScale = 1.0;
    private wheelClientX = 0.0;
    private wheelClientY = 0.0;

    private configUpdated = true;

    // タッチ追跡
    private activePointers = new Set<number>();
    private pointerPositions = new Map<number, { x: number, y: number }>();

    // 感度設定
    private dragSensitivity = 0.2;
    private zoomSensitivity = 0.001;
    private lastDragTime = 0;
    private lastWheelTime = 0;

    constructor(
        canvas: HTMLCanvasElement,
        config: StarChartConfig
    ) {
        this.canvas = canvas;
        this.config = config;
        this.latestState = { ...config.viewState };
        this.baseDistance = 0;
        this.coordinateConverter = new CoordinateConverter();
        // タッチ操作のデフォルト動作を無効化
        this.canvas.style.touchAction = 'none';
        this.canvas.style.userSelect = 'none';
        (this.canvas.style as any).webkitUserSelect = 'none';
        (this.canvas.style as any).msUserSelect = 'none';
        (this.canvas.style as any).webkitTouchCallout = 'none';
        
        this.setupEventListeners();
        console.log("Wheel listener registered");
    }

    // アクティブなポインター数を取得
    getActivePointerCount(): number {
        return this.activePointers.size;
    }

    // アクティブなポインターIDのリストを取得
    getActivePointerIds(): number[] {
        return Array.from(this.activePointers);
    }

    // タッチ操作中かどうかを判定
    isTouchActive(): boolean {
        return this.activePointers.size > 0;
    }

    // 特定のポインターの座標を取得
    getPointerPosition(pointerId: number): { x: number, y: number } | undefined {
        return this.pointerPositions.get(pointerId);
    }

    // 全ポインターの座標を取得
    getAllPointerPositions(): Map<number, { x: number, y: number }> {
        return new Map(this.pointerPositions);
    }

    // 全ポインターの座標をオブジェクト形式で取得
    getPointerPositionsObject(): Record<number, { x: number, y: number }> {
        return Object.fromEntries(this.pointerPositions);
    }

    // タッチ操作の状態をリセット
    resetTouchState(): void {
        this.isDragging = false;
        this.activePointers.clear();
        this.pointerPositions.clear();
        this.canvas.style.touchAction = 'none';
        this.canvas.style.cursor = 'grab';
        console.log('Touch state reset');
    }

    setupEventListeners(): void {
        // PointerEventでマウスとタッチを両方扱う
        this.canvas.addEventListener('pointerdown', this.onPointerDown, { passive: false });
        this.canvas.addEventListener('pointerup', this.onPointerUp, { passive: false });
        this.canvas.addEventListener('pointercancel', this.onPointerUp, { passive: false });
        this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
    }

    removeEventListeners(): void {
        this.canvas.removeEventListener('pointerdown', this.onPointerDown);
        this.canvas.removeEventListener('pointermove', this.onPointerMove);
        this.canvas.removeEventListener('pointerup', this.onPointerUp);
        this.canvas.removeEventListener('pointercancel', this.onPointerUp);
        this.canvas.removeEventListener('wheel', this.onWheel);
    }

    private onPointerDown = (e: PointerEvent): void => {
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
            } else if (e.pointerType === 'touch') {
                this.canvas.style.touchAction = 'none'; // 'auto'にしない！
                this.canvas.addEventListener('pointermove', this.onPointerMove, { passive: false });
            }
        } else if (this.activePointers.size === 2) {
            this.isDragging = false;
            this.isPinch = true;
        }
    };

    private onPointerMove = (e: PointerEvent): void => {
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

        const fov = {ra: this.latestState.fieldOfViewRA, dec: this.latestState.fieldOfViewDec};
        const centerRaDec = {ra: this.latestState.centerRA, dec: this.latestState.centerDec};
        const centerAzAlt = {az: this.latestState.centerAz, alt: this.latestState.centerAlt};
        const lstLat = { lst: this.config.siderealTime, lat: this.config.observationSite.latitude };
        const mode = this.config.displaySettings.mode;

        // ポインターの座標を更新
        // this.pointerPositions.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (this.isDragging) {
            if (e.pointerType == 'touch' && ['live', 'ar'].includes(mode)) {
                return;
            }

            const now = performance.now();
            if (now - this.lastDragTime < 30) {
                return;
            }
            this.lastDragTime = now;

            const deltaX = e.clientX - this.lastX;
            const deltaY = e.clientY - this.lastY;

            // 最小移動量チェック
            const minMove = e.pointerType === 'touch' ? this.config.canvasSize.width / 200 : this.config.canvasSize.width / 400;
            if (Math.abs(deltaX) < minMove && Math.abs(deltaY) < minMove) {
                return;
            }
            if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
                return;
            }
            // console.log("slow enough");

            // ポインターの座標を更新
            this.pointerPositions.set(e.pointerId, { x: e.clientX, y: e.clientY });

            // 前回のポインター位置のスクリーン座標（キャンバス左上からの座標）
            const lastPointerX = this.lastX - this.canvas.offsetLeft;
            const lastPointerY = this.lastY - this.canvas.offsetTop;
            // 現在のポインター位置のスクリーン座標
            const currentPointerX = e.clientX - this.canvas.offsetLeft;
            const currentPointerY = e.clientY - this.canvas.offsetTop;

            // 前回のポインター位置のスクリーンRaDec
            const lastScreenRaDec = this.coordinateConverter.screenXYToScreenRaDec(
                lastPointerX, lastPointerY, fov, this.canvas
            );

            if (mode == 'AEP') {
                const transformConfig: TransformModeConfig = {mode: 'AEP', center: centerRaDec, location: lstLat}
                // 前回のポインター位置の赤道座標
                const lastEquatorial = CanvasRaDec.toRaDec(lastScreenRaDec, transformConfig);
                
                // 北極/南極付近の場合は従来の方式（数値的に不安定になるため）
                // const isNearPole = Math.abs(this.viewState.centerDec) > 85 || Math.abs(lastEquatorial.dec) > 85;
                const isNearPole = false;
                
                if (!isNearPole) {
                    // 現在のポインター位置のスクリーンRaDec
                    const currentCanvasRadec = this.coordinateConverter.screenXYToScreenRaDec(
                        currentPointerX, currentPointerY, fov, this.canvas
                    );
                    // 現在のポインター位置の赤道座標
                    const currentRadec = CanvasRaDec.toRaDec(currentCanvasRadec, transformConfig);
                    
                    // ポインター位置の天球座標が保たれるように中心座標を調整
                    centerRaDec.ra = ((lastEquatorial.ra + centerRaDec.ra - currentRadec.ra) % 360 + 360) % 360;
                    centerRaDec.dec = Math.max(-90, Math.min(90, lastEquatorial.dec + centerRaDec.dec - currentRadec.dec));
                }
                
                const newCenterAzalt = RaDec.toAzalt(centerRaDec, lstLat);
                centerAzAlt.az = newCenterAzalt.az;
                centerAzAlt.alt = newCenterAzalt.alt;
            } else if (mode == 'view') {
                const transformConfig: TransformModeConfig = {mode: 'view', center: centerAzAlt, location: lstLat}
                // 前回のポインター位置の地平座標
                const lastAzalt = CanvasRaDec.toAzAlt(lastScreenRaDec, transformConfig);
                
                // 天頂/天底付近の場合は従来の方式（数値的に不安定になるため）
                // const isNearZenith = Math.abs(this.viewState.centerAlt) > 85 || Math.abs(lastHorizontal.alt) > 85;
                const isNearZenith = false;
                
                if (!isNearZenith) {
                    // 現在のポインター位置のスクリーンRaDec
                    const currentScreenRaDec = this.coordinateConverter.screenXYToScreenRaDec(
                        currentPointerX, currentPointerY, fov, this.canvas
                    );
                    // 現在のポインター位置の地平座標
                    const currentAzAlt = CanvasRaDec.toAzAlt(currentScreenRaDec, transformConfig);
                    
                    // ポインター位置の天球座標が保たれるように中心座標を調整
                    centerAzAlt.az = ((lastAzalt.az + centerAzAlt.az - currentAzAlt.az) % 360 + 360) % 360;
                    centerAzAlt.alt = Math.max(-90, Math.min(90, lastAzalt.alt + centerAzAlt.alt - currentAzAlt.alt));
                }
                
                const newCenterRadec = AzAlt.toRadec(centerAzAlt, lstLat);
                centerRaDec.ra = newCenterRadec.ra;
                centerRaDec.dec = newCenterRadec.dec;
            }

            // 座標を更新
            this.lastX = e.clientX;
            this.lastY = e.clientY;
        } else if (this.isPinch) {
            const pointerIds = this.getActivePointerIds();
            if (pointerIds.length < 2) return;
            this.pointerPositions.set(e.pointerId, { x: e.clientX, y: e.clientY });
            const x1 = this.pointerPositions.get(pointerIds[0])?.x;
            const y1 = this.pointerPositions.get(pointerIds[0])?.y;
            const x2 = this.pointerPositions.get(pointerIds[1])?.x;
            const y2 = this.pointerPositions.get(pointerIds[1])?.y;
            if (!x1 || !y1 || !x2 || !y2) return;
            const distance = Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
            if (this.baseDistance == 0) this.baseDistance = distance;
            if (distance == 0) return;
            
            // ピンチ中心点のスクリーン座標（キャンバス左上からの座標）
            const pinchX = (x1 + x2) / 2 - this.canvas.offsetLeft;
            const pinchY = (y1 + y2) / 2 - this.canvas.offsetTop;
            
            // 1より大きければ拡大、小さければ縮小
            let scale = distance / this.baseDistance;
            if (!scale || scale == Infinity) return;
            if (this.canvas.width < this.canvas.height) {
                scale = Math.max(Math.min(scale, fov.ra / 1.0), fov.dec / 270.0);
            } else {
                scale = Math.max(Math.min(scale, fov.dec / 1.0), fov.ra / 270.0);
            }
            this.accumulatedScale *= scale;

            const now = performance.now();
            if (now - this.lastDragTime < 30) {
                return;
            }
            this.lastDragTime = now;

            // ズームを適用
            if (this.canvas.width < this.canvas.height) {
                this.accumulatedScale = Math.max(Math.min(this.accumulatedScale, fov.ra / 1.0), fov.dec / 270.0);
            } else {
                this.accumulatedScale = Math.max(Math.min(this.accumulatedScale, fov.dec / 1.0), fov.ra / 270.0);
            }
            fov.ra /= this.accumulatedScale;
            fov.dec /= this.accumulatedScale;
            
            // ズーム前のピンチ中心のスクリーンRaDec
            const pinchScreenRaDec = this.coordinateConverter.screenXYToScreenRaDec(
                pinchX, pinchY, fov, this.canvas
            );
            
            if (mode == 'AEP') {
                const transformConfig: TransformModeConfig = {mode: 'AEP', center: centerRaDec, location: lstLat}
                // ズーム前のピンチ中心の赤道座標を保存
                const pinchRadec = CanvasRaDec.toRaDec(pinchScreenRaDec, transformConfig);
                
                // 北極/南極付近の場合は画面中心でズーム（数値的に不安定になるため）
                const isNearPole = Math.abs(centerRaDec.dec) > 85 || Math.abs(pinchRadec.dec) > 85;
                if (!isNearPole) {
                    const newPinchScreenRaDec = this.coordinateConverter.screenXYToScreenRaDec(
                        pinchX, pinchY, fov, this.canvas
                    );
                    const newPinchRadec = CanvasRaDec.toRaDec(newPinchScreenRaDec, transformConfig);
                    centerRaDec.ra = ((pinchRadec.ra + centerRaDec.ra - newPinchRadec.ra) % 360 + 360) % 360;
                    centerRaDec.dec = Math.max(-90, Math.min(90, pinchRadec.dec + centerRaDec.dec - newPinchRadec.dec));
                    const newCenterAzalt = RaDec.toAzalt(centerRaDec, lstLat);
                    centerAzAlt.az = newCenterAzalt.az;
                    centerAzAlt.alt = newCenterAzalt.alt;
                }
            } else if (mode == 'view') { 
                const transformConfig: TransformModeConfig = {mode: 'view', center: centerAzAlt, location: lstLat};
                // ズーム前のピンチ中心の地平座標を保存
                const pinchAzalt = CanvasRaDec.toAzAlt(pinchScreenRaDec, transformConfig);
                
                // 天頂/天底付近の場合は画面中心でズーム（数値的に不安定になるため）
                const isNearZenith = Math.abs(centerAzAlt.alt) > 85 || Math.abs(pinchAzalt.alt) > 85;
                if (!isNearZenith) {
                    // ピンチした位置（スクリーン上の座標が不変という意味で）のスクリーンRaDecを計算
                    const newPinchScreenRaDec = this.coordinateConverter.screenXYToScreenRaDec(
                        pinchX, pinchY, fov, this.canvas
                    );
                    // 新しい中心座標でのピンチした位置での地平座標
                    const newPinchAzalt = CanvasRaDec.toAzAlt(newPinchScreenRaDec, transformConfig);
                    centerAzAlt.az = ((pinchAzalt.az + centerAzAlt.az - newPinchAzalt.az) % 360 + 360) % 360;
                    centerAzAlt.alt = Math.max(-90, Math.min(90, pinchAzalt.alt + centerAzAlt.alt - newPinchAzalt.alt));
                    const newCenterRadec = AzAlt.toRadec(centerAzAlt, lstLat);
                    centerRaDec.ra = newCenterRadec.ra;
                    centerRaDec.dec = newCenterRadec.dec;
                }
            }
            this.baseDistance = distance;
        }

        // URLのクエリを一度だけ削除（軽量）
        clearUrlSearchOnce();

        this.latestState = {
            centerRA: centerRaDec.ra,
            centerDec: centerRaDec.dec,
            centerAz: centerAzAlt.az,
            centerAlt: centerAzAlt.alt,
            fieldOfViewRA: fov.ra,
            fieldOfViewDec: fov.dec,
            starSizeKey1: this.config.viewState.starSizeKey1,
            starSizeKey2: this.config.viewState.starSizeKey2,
        }
        updateConfig({
            viewState: this.latestState
        })
    };

    private onPointerUp = (e: PointerEvent): void => {
        if (this.activePointers.size === 1) {
            // クリック判定
            const clickDuration = Date.now() - this.clickStartTime;
            const moveDistance = Math.sqrt(
                (e.clientX - this.clickStartX) ** 2 + 
                (e.clientY - this.clickStartY) ** 2
            );
            
            if (this.config.displaySettings.showObjectInfo) {
                //短時間（300ms以下）で移動量が少ない（10px以下）場合はクリックとして扱う
                if (clickDuration < 300 && moveDistance < 10) {
                    // キャンバス座標に変換
                    const rect = this.canvas.getBoundingClientRect();
                    const clickX = e.clientX;
                    const clickY = e.clientY;
                    const canvasX = (clickX - rect.left) * this.canvas.width / rect.width;
                    const canvasY = (clickY - rect.top) * this.canvas.height / rect.height;
                    // CSSの設定とmainのおかげでthis.canvas.width/heightとrec.width/heightはほぼ一致する
                    
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
                    } else if (starInfoElement && starInfoElement.style.display === 'block') {
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
            } else if (e.pointerType === 'touch') {
                this.canvas.style.touchAction = 'none';
                this.canvas.removeEventListener('pointermove', this.onPointerMove);
            }
            saveConfigToLocalStorage();
        } else {
            this.isDragging = false;
            this.isPinch = false;
            this.lastDragTime = performance.now();
            this.activePointers.delete(e.pointerId);
            this.pointerPositions.delete(e.pointerId);
            this.canvas.releasePointerCapture(e.pointerId);
            console.log('onPointerUp (2)', e.pointerType, e.pointerId);
        }
        this.accumulatedScale = 1.0;
        this.baseDistance = 0;
    };

    private onWheel = (e: WheelEvent): void => {
        e.preventDefault();
        let scale = 1 - e.deltaY * this.zoomSensitivity;
        if (!scale || scale == Infinity || scale == 0) return;
        this.accumulatedScale *= scale;

        const now = performance.now();
        if (now - this.lastWheelTime < 30) return;
        if (this.accumulatedScale == 1.0) return;

        this.wheelClientX = e.clientX;
        this.wheelClientY = e.clientY;

        const starInfoElement = document.getElementById('starInfo');
        if (starInfoElement && starInfoElement.style.display === 'block') {
            starInfoElement.style.display = 'none';
        }
        const starMarkerElement = document.getElementById('starMarker');
        if (starMarkerElement && starMarkerElement.style.display === 'block') {
            starMarkerElement.style.display = 'none';
        }

        const fov = {ra: this.latestState.fieldOfViewRA, dec: this.latestState.fieldOfViewDec};
        if (this.canvas.width < this.canvas.height) {
            this.accumulatedScale = Math.max(Math.min(this.accumulatedScale, fov.dec / 1.0), fov.ra / 270.0);
        } else {
            this.accumulatedScale = Math.max(Math.min(this.accumulatedScale, fov.ra / 1.0), fov.dec / 270.0);
        }
        
        // マウス位置のスクリーン座標（中心からのオフセット）
        const mouseX = this.wheelClientX - this.canvas.offsetLeft;
        const mouseY = this.wheelClientY - this.canvas.offsetTop;
        
        // ズーム前のマウス位置のスクリーンRaDec
        const mouseScreenRADec = this.coordinateConverter.screenXYToScreenRaDec(
            mouseX, mouseY, fov, this.canvas
        );
        
        const lstLat = { lst: this.config.siderealTime, lat: this.config.observationSite.latitude };
        const mode = this.config.displaySettings.mode;
        const centerRaDec = {ra: this.latestState.centerRA, dec: this.latestState.centerDec};
        const centerAzAlt = {az: this.latestState.centerAz, alt: this.latestState.centerAlt};
        
        if (mode == 'AEP') {
            const transformConfig: TransformModeConfig = {mode: 'AEP', center: centerRaDec, location: lstLat}
            // ズーム前のマウス位置の赤道座標を保存
            const mouseRadec = CanvasRaDec.toRaDec(mouseScreenRADec, transformConfig);
            
            // 北極/南極付近の場合は画面中心でズーム（数値的に不安定になるため）
            const isNearPole = Math.abs(centerRaDec.dec) > 85 || Math.abs(mouseRadec.dec) > 85;
            
            // ズームを適用
            // console.log(`fov1: ${fov.ra}, ${fov.dec} ${this.config.viewState.fieldOfViewRA} ${this.config.viewState.fieldOfViewDec}`);
            fov.ra /= this.accumulatedScale;
            fov.dec /= this.accumulatedScale;
            // console.log(`fov2: ${fov.ra}, ${fov.dec} ${this.config.viewState.fieldOfViewRA} ${this.config.viewState.fieldOfViewDec}`);
            
            if (!isNearPole) {
                const newMouseCanvasRadec = this.coordinateConverter.screenXYToScreenRaDec(
                    mouseX, mouseY, fov, this.canvas
                );
                const newMouseRadec = CanvasRaDec.toRaDec(newMouseCanvasRadec, transformConfig);
                centerRaDec.ra = ((mouseRadec.ra + centerRaDec.ra - newMouseRadec.ra) % 360 + 360) % 360;
                centerRaDec.dec = Math.max(-90, Math.min(90, mouseRadec.dec + centerRaDec.dec - newMouseRadec.dec));
                const centerHorizontal = RaDec.toAzalt(centerRaDec, lstLat);
                centerAzAlt.az = centerHorizontal.az;
                centerAzAlt.alt = centerHorizontal.alt;
            }
        } else if (mode == 'view') {
            const transformConfig: TransformModeConfig = {mode: 'view', center: centerAzAlt, location: lstLat};
            // ズーム前のマウス位置の地平座標を保存
            const mouseAzalt = CanvasRaDec.toAzAlt(mouseScreenRADec, transformConfig);
            
            // 天頂/天底付近の場合は画面中心でズーム（数値的に不安定になるため）
            const isNearZenith = Math.abs(centerAzAlt.alt) > 85 || Math.abs(mouseAzalt.alt) > 85;
            
            // ズームを適用
            fov.ra /= this.accumulatedScale;
            fov.dec /= this.accumulatedScale;
            
            if (!isNearZenith) {
                // ピンチした位置（スクリーン上の座標が不変という意味で）のスクリーンRaDecを計算
                const newMouseScreenRaDec = this.coordinateConverter.screenXYToScreenRaDec(
                    mouseX, mouseY, fov, this.canvas
                );
                // 新しい中心座標でのマウス位置での地平座標
                const newMouseAzalt = CanvasRaDec.toAzAlt(newMouseScreenRaDec, transformConfig);
                centerAzAlt.az = ((mouseAzalt.az + centerAzAlt.az - newMouseAzalt.az) % 360 + 360) % 360;
                centerAzAlt.alt = Math.max(-90, Math.min(90, mouseAzalt.alt + centerAzAlt.alt - newMouseAzalt.alt));
                
                const centerRadec = AzAlt.toRadec(centerAzAlt, lstLat);
                centerRaDec.ra = centerRadec.ra;
                centerRaDec.dec = centerRadec.dec;
            }
        }

        this.latestState = {
            centerRA: centerRaDec.ra,
            centerDec: centerRaDec.dec,
            centerAz: centerAzAlt.az,
            centerAlt: centerAzAlt.alt,
            fieldOfViewRA: fov.ra,
            fieldOfViewDec: fov.dec,
            starSizeKey1: this.config.viewState.starSizeKey1,
            starSizeKey2: this.config.viewState.starSizeKey2,
        }

        // URLのクエリを削除
        clearUrlSearchOnce();
        // console.log(`fov3: ${fov.ra}, ${fov.dec} ${this.config.viewState.fieldOfViewRA} ${this.config.viewState.fieldOfViewDec}`);
        updateConfig({
            viewState: this.latestState
        });
        // console.log(`fov4: ${fov.ra}, ${fov.dec} ${this.config.viewState.fieldOfViewRA} ${this.config.viewState.fieldOfViewDec}`);
        saveConfigToLocalStorage();
        
        // 情報表示を即座に更新
        const updateInfoDisplay = (window as any).updateInfoDisplay;
        if (updateInfoDisplay) {
            updateInfoDisplay();
        }

        this.accumulatedScale = 1.0;
        this.isZoomScheduled = false;
        this.lastWheelTime = now;
    };
}

// クエリ削除を一度だけ行う軽量関数（履歴書き換えの回数を抑制）
let __urlCleared = false;
function clearUrlSearchOnce(): void {
    if (__urlCleared) return;
    if (!location.search) { __urlCleared = true; return; }
    try {
        if (history.replaceState) {
            history.replaceState(null, '', location.pathname + location.hash);
        }
    } catch (_) {
        // noop
    } finally {
        __urlCleared = true;
    }
}