import { RAD_TO_DEG } from "../utils/constants";
import { saveConfigToLocalStorage, updateConfig } from "../core/ConfigManager.js";
import { AzAlt, CanvasRaDec, CanvasXy, RaDec } from "../core/coordinates/index.js";
import { StarChartConfig, TransformModeConfig, ViewState } from "../types/index.js";
import { ObjectInfoController } from "./ObjectInfoController.js";

export class InteractionController {
    private canvas: HTMLCanvasElement;
    private config: StarChartConfig;
    private objectInfoController: ObjectInfoController;
    private latestState: ViewState;
    // 状態管理
    private isDragging = false;
    private isPinch = false;
    private lastX = 0;
    private lastY = 0;
    private baseDistance = 0;
    private clickStartTime = 0;
    private clickStartX = 0;
    private clickStartY = 0;
    private isScheduled: boolean = false;
    private accumulatedScale = 1.0;
    private wheelClientX = 0.0;
    private wheelClientY = 0.0;

    // タッチ追跡
    private activePointers = new Set<number>();
    private pointerPositions = new Map<number, { x: number, y: number }>();

    // 感度設定
    private zoomSensitivity = 0.001;
    private lastDragTime = 0;

    constructor(
        canvas: HTMLCanvasElement,
        config: StarChartConfig,
        objectInfoController: ObjectInfoController
    ) {
        this.canvas = canvas;
        this.config = config;
        this.objectInfoController = objectInfoController;
        this.latestState = { ...config.viewState };
        this.baseDistance = 0;
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

        const now = performance.now();

        const fov = this.latestState.fov; // deg
        const centerRaDec = this.latestState.centerRadec; // deg
        const centerAzAlt = this.latestState.centerAzalt; // deg
        const lstLat = { lst: this.config.siderealTime, lat: this.config.observationSite.latitude };
        const mode = this.config.displaySettings.mode;

        // ポインターの座標を更新
        // 複数の指が同時に動くときはonPointerMoveは指毎に呼ばれるので、描画間隔を時間で管理するときもこれはreturnの前に呼ぶ
        this.pointerPositions.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (!this.isScheduled) {
            requestAnimationFrame(() => {
                if (this.isDragging) {
                    if (now - this.lastDragTime < 30) {
                        return;
                    }
                    this.lastDragTime = now;
                    if (e.pointerType == 'touch' && ['live', 'ar'].includes(mode)) {
                        return;
                    }

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

                    // 前回のポインター位置のスクリーン座標（キャンバス左上からの座標）
                    const lastXY = { x: this.lastX - this.canvas.offsetLeft, y: this.lastY - this.canvas.offsetTop };
                    // 現在のポインター位置のスクリーン座標
                    const currentXY = { x: e.clientX - this.canvas.offsetLeft, y: e.clientY - this.canvas.offsetTop };

                    // 前回のポインター位置のスクリーンRaDec
                    const lastCanvasRaDec = CanvasXy.toCanvasRadec(lastXY, fov, this.config.canvasSize);

                    if (mode == 'AEP') {
                        const transformConfig: TransformModeConfig = { mode: 'AEP', center: centerRaDec, location: lstLat };
                        const lastRadec = CanvasRaDec.toRaDec(lastCanvasRaDec, transformConfig);
                        const currentCanvasRadec = CanvasXy.toCanvasRadec(currentXY, fov, this.config.canvasSize);
                        centerRaDec.dec = centerRaDec.dec - (currentCanvasRadec.dec - lastCanvasRaDec.dec);
                        if (centerRaDec.dec > 90) {
                            const rotationAngle = Math.atan2(lastCanvasRaDec.ra, lastCanvasRaDec.dec) - Math.atan2(currentCanvasRadec.ra, currentCanvasRadec.dec);
                            centerRaDec.ra = centerRaDec.ra - rotationAngle * RAD_TO_DEG;
                            centerRaDec.dec = 90;
                        } else if (centerRaDec.dec <= -90) {
                            const rotationAngle = Math.atan2(lastCanvasRaDec.ra, lastCanvasRaDec.dec) - Math.atan2(currentCanvasRadec.ra, currentCanvasRadec.dec);
                            centerRaDec.ra = centerRaDec.ra + rotationAngle * RAD_TO_DEG;
                            centerRaDec.dec = -90;
                        } else {
                            centerRaDec.ra = RaDec.getCenterByCanvasRadec(lastRadec, currentCanvasRadec, centerRaDec.dec).ra;
                        }
                        centerRaDec.ra = (centerRaDec.ra % 360 + 360) % 360;
                        const newCenterAzalt = RaDec.toAzalt(centerRaDec, lstLat);
                        centerAzAlt.az = newCenterAzalt.az;
                        centerAzAlt.alt = newCenterAzalt.alt;
                    } else if (mode == 'view') {
                        const transformConfig: TransformModeConfig = { mode: 'view', center: centerAzAlt, location: lstLat }
                        const lastAzalt = CanvasRaDec.toAzAlt(lastCanvasRaDec, transformConfig);
                        const currentCanvasRadec = CanvasXy.toCanvasRadec(currentXY, fov, this.config.canvasSize);
                        centerAzAlt.alt = centerAzAlt.alt - (currentCanvasRadec.dec - lastCanvasRaDec.dec);
                        if (centerAzAlt.alt > 90) {
                            const rotationAngle = Math.atan2(lastCanvasRaDec.ra, lastCanvasRaDec.dec) - Math.atan2(currentCanvasRadec.ra, currentCanvasRadec.dec);
                            centerAzAlt.az = centerAzAlt.az + rotationAngle * RAD_TO_DEG;
                            centerAzAlt.alt = 90;
                        } else if (centerAzAlt.alt <= -90) {
                            const rotationAngle = Math.atan2(lastCanvasRaDec.ra, lastCanvasRaDec.dec) - Math.atan2(currentCanvasRadec.ra, currentCanvasRadec.dec);
                            centerAzAlt.az = centerAzAlt.az - rotationAngle * RAD_TO_DEG;
                            centerAzAlt.alt = -90;
                        } else {
                            centerAzAlt.az = AzAlt.getCenterByCanvasRadec(lastAzalt, currentCanvasRadec, centerAzAlt.alt).az;
                        }
                        centerAzAlt.az = (centerAzAlt.az % 360 + 360) % 360;

                        const newCenterRadec = AzAlt.toRadec(centerAzAlt, lstLat);
                        centerRaDec.ra = newCenterRadec.ra;
                        centerRaDec.dec = newCenterRadec.dec;
                    }

                    // 座標を更新
                    this.lastX = e.clientX;
                    this.lastY = e.clientY;
                } else if (this.isPinch) {
                    if (now - this.lastDragTime < 100) {
                        return;
                    }
                    this.lastDragTime = now;
                    const pointerIds = this.getActivePointerIds();
                    if (pointerIds.length < 2) return;
                    const x1 = this.pointerPositions.get(pointerIds[0])?.x;
                    const y1 = this.pointerPositions.get(pointerIds[0])?.y;
                    const x2 = this.pointerPositions.get(pointerIds[1])?.x;
                    const y2 = this.pointerPositions.get(pointerIds[1])?.y;
                    if (!x1 || !y1 || !x2 || !y2) return;
                    const distance = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
                    if (this.baseDistance == 0) this.baseDistance = distance;
                    if (distance == 0) return;

                    // ピンチ中心点のスクリーン座標（キャンバス左上からの座標）
                    const pinchXY = { x: (x1 + x2) / 2 - this.canvas.offsetLeft, y: (y1 + y2) / 2 - this.canvas.offsetTop };

                    // 1より大きければ拡大、小さければ縮小
                    let scale = distance / this.baseDistance;
                    if (!scale || scale == Infinity) return;

                    // ズームを適用
                    if (this.canvas.width < this.canvas.height) {
                        scale = Math.max(Math.min(scale, fov.ra / 1.0), fov.dec / 270.0);
                    } else {
                        scale = Math.max(Math.min(scale, fov.dec / 1.0), fov.ra / 270.0);
                    }
                    fov.ra /= scale;
                    fov.dec /= scale;

                    // ズーム前のピンチ中心のスクリーンRaDec
                    const pinchCanvasRaDec = CanvasXy.toCanvasRadec(pinchXY, fov, this.config.canvasSize);

                    if (mode == 'AEP') {
                        const transformConfig: TransformModeConfig = { mode: 'AEP', center: centerRaDec, location: lstLat }
                        // ズーム前のピンチ中心の赤道座標を保存
                        const pinchRadec = CanvasRaDec.toRaDec(pinchCanvasRaDec, transformConfig);

                        // 北極/南極付近の場合は画面中心でズーム（数値的に不安定になるため）
                        const isNearPole = Math.abs(centerRaDec.dec) > 85 || Math.abs(pinchRadec.dec) > 85;
                        if (!isNearPole) {
                            const newPinchCanvasRaDec = CanvasXy.toCanvasRadec(pinchXY, fov, this.config.canvasSize);
                            const newPinchRadec = CanvasRaDec.toRaDec(newPinchCanvasRaDec, transformConfig);
                            centerRaDec.ra = ((pinchRadec.ra + centerRaDec.ra - newPinchRadec.ra) % 360 + 360) % 360;
                            centerRaDec.dec = Math.max(-90, Math.min(90, pinchRadec.dec + centerRaDec.dec - newPinchRadec.dec));
                            const newCenterAzalt = RaDec.toAzalt(centerRaDec, lstLat);
                            centerAzAlt.az = newCenterAzalt.az;
                            centerAzAlt.alt = newCenterAzalt.alt;
                        }
                    } else if (mode == 'view') {
                        const transformConfig: TransformModeConfig = { mode: 'view', center: centerAzAlt, location: lstLat };
                        // ズーム前のピンチ中心の地平座標を保存
                        const pinchAzalt = CanvasRaDec.toAzAlt(pinchCanvasRaDec, transformConfig);

                        // 天頂/天底付近の場合は画面中心でズーム（数値的に不安定になるため）
                        const isNearZenith = Math.abs(centerAzAlt.alt) > 85 || Math.abs(pinchAzalt.alt) > 85;
                        if (!isNearZenith) {
                            // ピンチした位置（スクリーン上の座標が不変という意味で）のスクリーンRaDecを計算
                            const newPinchCanvasRaDec = CanvasXy.toCanvasRadec(pinchXY, fov, this.config.canvasSize);
                            // 新しい中心座標でのピンチした位置での地平座標
                            const newPinchAzalt = CanvasRaDec.toAzAlt(newPinchCanvasRaDec, transformConfig);
                            centerAzAlt.az = ((pinchAzalt.az + centerAzAlt.az - newPinchAzalt.az) % 360 + 360) % 360;
                            centerAzAlt.alt = Math.max(-90, Math.min(90, pinchAzalt.alt + centerAzAlt.alt - newPinchAzalt.alt));
                            const newCenterRadec = AzAlt.toRadec(centerAzAlt, lstLat);
                            centerRaDec.ra = newCenterRadec.ra;
                            centerRaDec.dec = newCenterRadec.dec;
                        }
                    }
                    this.baseDistance = distance;
                }

                this.latestState = {
                    centerRadec: centerRaDec,
                    centerAzalt: centerAzAlt,
                    fov: fov,
                    starSizeKey1: this.config.viewState.starSizeKey1,
                    starSizeKey2: this.config.viewState.starSizeKey2,
                }
                updateConfig({
                    viewState: this.latestState
                })
            });
        }
    };

    private onPointerUp = (e: PointerEvent): void => {
        // なぜか2回実行されてる！？
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
                    this.objectInfoController.showObjectInfo(canvasX, canvasY, isClickOutsideStarInfo);
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

        if (this.accumulatedScale == 1.0) return;

        if (!this.isScheduled) {
            this.isScheduled = true;
            requestAnimationFrame(() => {
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

                const fov = this.latestState.fov;
                if (this.canvas.width < this.canvas.height) {
                    this.accumulatedScale = Math.max(Math.min(this.accumulatedScale, fov.dec / 1.0), fov.ra / 270.0);
                } else {
                    this.accumulatedScale = Math.max(Math.min(this.accumulatedScale, fov.ra / 1.0), fov.dec / 270.0);
                }

                // マウス位置のスクリーン座標（中心からのオフセット）
                const mouseXY = { x: this.wheelClientX - this.canvas.offsetLeft, y: this.wheelClientY - this.canvas.offsetTop };

                // ズーム前のマウス位置のスクリーンRaDec
                const mouseCanvasRadec = CanvasXy.toCanvasRadec(mouseXY, fov, this.config.canvasSize);

                const lstLat = { lst: this.config.siderealTime, lat: this.config.observationSite.latitude };
                const mode = this.config.displaySettings.mode;
                const centerRaDec = this.latestState.centerRadec;
                const centerAzAlt = this.latestState.centerAzalt;

                if (mode == 'AEP') {
                    const transformConfig: TransformModeConfig = { mode: 'AEP', center: centerRaDec, location: lstLat }
                    // ズーム前のマウス位置の赤道座標を保存
                    const mouseRadec = CanvasRaDec.toRaDec(mouseCanvasRadec, transformConfig);

                    // 北極/南極付近の場合は画面中心でズーム（数値的に不安定になるため）
                    const isNearPole = Math.abs(centerRaDec.dec) > 85 || Math.abs(mouseRadec.dec) > 85;

                    // ズームを適用
                    fov.ra /= this.accumulatedScale;
                    fov.dec /= this.accumulatedScale;

                    if (!isNearPole) {
                        const newMouseCanvasRadec = CanvasXy.toCanvasRadec(mouseXY, fov, this.config.canvasSize);
                        const newMouseRadec = CanvasRaDec.toRaDec(newMouseCanvasRadec, transformConfig);
                        centerRaDec.ra = ((mouseRadec.ra + centerRaDec.ra - newMouseRadec.ra) % 360 + 360) % 360;
                        centerRaDec.dec = Math.max(-90, Math.min(90, mouseRadec.dec + centerRaDec.dec - newMouseRadec.dec));
                        const centerHorizontal = RaDec.toAzalt(centerRaDec, lstLat);
                        centerAzAlt.az = centerHorizontal.az;
                        centerAzAlt.alt = centerHorizontal.alt;
                    }
                } else if (mode == 'view') {
                    const transformConfig: TransformModeConfig = { mode: 'view', center: centerAzAlt, location: lstLat };
                    // ズーム前のマウス位置の地平座標を保存
                    const mouseAzalt = CanvasRaDec.toAzAlt(mouseCanvasRadec, transformConfig);

                    // 天頂/天底付近の場合は画面中心でズーム（数値的に不安定になるため）
                    const isNearZenith = Math.abs(centerAzAlt.alt) > 85 || Math.abs(mouseAzalt.alt) > 85;

                    // ズームを適用
                    fov.ra /= this.accumulatedScale;
                    fov.dec /= this.accumulatedScale;

                    if (!isNearZenith) {
                        // ピンチした位置（スクリーン上の座標が不変という意味で）のスクリーンRaDecを計算
                        const newMouseCanvasRadec = CanvasXy.toCanvasRadec(mouseXY, fov, this.config.canvasSize);
                        // 新しい中心座標でのマウス位置での地平座標
                        const newMouseAzalt = CanvasRaDec.toAzAlt(newMouseCanvasRadec, transformConfig);
                        centerAzAlt.az = ((mouseAzalt.az + centerAzAlt.az - newMouseAzalt.az) % 360 + 360) % 360;
                        centerAzAlt.alt = Math.max(-90, Math.min(90, mouseAzalt.alt + centerAzAlt.alt - newMouseAzalt.alt));

                        const centerRadec = AzAlt.toRadec(centerAzAlt, lstLat);
                        centerRaDec.ra = centerRadec.ra;
                        centerRaDec.dec = centerRadec.dec;
                    }
                }

                this.latestState = {
                    centerRadec: centerRaDec,
                    centerAzalt: centerAzAlt,
                    fov: fov,
                    starSizeKey1: this.config.viewState.starSizeKey1,
                    starSizeKey2: this.config.viewState.starSizeKey2,
                }

                updateConfig({
                    viewState: this.latestState
                });
                saveConfigToLocalStorage();

                this.accumulatedScale = 1.0;
                this.isScheduled = false;
            });
        }
    };
}