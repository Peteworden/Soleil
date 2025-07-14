export class InteractionController {
    constructor(canvas, renderOptions, renderCallback) {
        // 状態管理
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
        // 感度設定
        this.dragSensitivity = 0.2;
        this.zoomSensitivity = 0.001;
        this.onPointerDown = (e) => {
            // e.preventDefault();
            this.isDragging = true;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        };
        this.onPointerMove = (e) => {
            if (!this.isDragging)
                return;
            e.preventDefault();
            const deltaX = e.clientX - this.lastX;
            const deltaY = e.clientY - this.lastY;
            // ズームレベルに応じて移動量を調整
            const moveScale = this.dragSensitivity / this.renderOptions.zoom;
            this.renderOptions.cenRA -= deltaX * moveScale;
            this.renderOptions.cenDec += deltaY * moveScale;
            // 値を正規化
            this.renderOptions.cenRA = ((this.renderOptions.cenRA % 360) + 360) % 360;
            if (this.renderOptions.cenDec > 90)
                this.renderOptions.cenDec = 90;
            if (this.renderOptions.cenDec < -90)
                this.renderOptions.cenDec = -90;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            this.renderCallback();
        };
        this.onPointerUp = (e) => {
            if (!this.isDragging)
                return;
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        };
        this.onWheel = (e) => {
            e.preventDefault();
            const zoomAmount = e.deltaY * this.zoomSensitivity;
            this.renderOptions.zoom *= (1 - zoomAmount);
            // ズーム範囲を制限
            if (this.renderOptions.zoom < 0.1)
                this.renderOptions.zoom = 0.1;
            if (this.renderOptions.zoom > 100)
                this.renderOptions.zoom = 100;
            this.renderCallback();
        };
        this.canvas = canvas;
        this.renderOptions = renderOptions;
        this.renderCallback = renderCallback;
        this.setupEventListeners();
    }
    setupEventListeners() {
        // PointerEventでマウスとタッチを両方扱う
        this.canvas.addEventListener('pointerdown', this.onPointerDown);
        this.canvas.addEventListener('pointermove', this.onPointerMove);
        this.canvas.addEventListener('pointerup', this.onPointerUp);
        this.canvas.addEventListener('pointercancel', this.onPointerUp);
        // ホイールイベントでズーム
        this.canvas.addEventListener('wheel', this.onWheel);
    }
}
//# sourceMappingURL=interactionController.js.map