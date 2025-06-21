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
            this.isDragging = true;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            this.canvas.setPointerCapture(e.pointerId); // ポインターをキャプチャ
            this.canvas.style.cursor = 'grabbing';
        };
        this.onPointerMove = (e) => {
            if (!this.isDragging)
                return;
            const deltaX = e.clientX - this.lastX;
            const deltaY = e.clientY - this.lastY;
            // ズームレベルに応じて移動量を調整
            const moveScale = this.renderOptions.fieldOfViewRA / this.canvas.width;
            this.renderOptions.centerRA += deltaX * moveScale;
            this.renderOptions.centerDec += deltaY * moveScale;
            // 値を正規化
            this.renderOptions.centerRA = ((this.renderOptions.centerRA % 360) + 360) % 360;
            if (this.renderOptions.centerDec > 90)
                this.renderOptions.centerDec = 90;
            if (this.renderOptions.centerDec < -90)
                this.renderOptions.centerDec = -90;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            // グローバルconfigも更新
            const globalConfig = window.config;
            console.log('🎮 InteractionController: Checking references after drag');
            console.log('🎮 this.renderOptions:', this.renderOptions.centerRA, this.renderOptions.centerDec);
            console.log('🎮 globalConfig.renderOptions:', globalConfig?.renderOptions.centerRA, globalConfig?.renderOptions.centerDec);
            console.log('🎮 this.renderOptions === globalConfig.renderOptions:', this.renderOptions === globalConfig?.renderOptions);
            if (globalConfig && globalConfig.renderOptions === this.renderOptions) {
                console.log('🎮 InteractionController: Updating global config after drag');
                console.log('🎮 New centerRA:', this.renderOptions.centerRA, 'centerDec:', this.renderOptions.centerDec);
            }
            else {
                console.log('🎮 InteractionController: References do not match, skipping global update');
            }
            console.log('🎮 Calling renderCallback...');
            this.renderCallback();
            console.log('🎮 renderCallback completed');
            // 情報表示を即座に更新
            const updateInfoDisplay = window.updateInfoDisplay;
            if (updateInfoDisplay) {
                updateInfoDisplay();
            }
        };
        this.onPointerUp = (e) => {
            this.isDragging = false;
            this.canvas.releasePointerCapture(e.pointerId);
            this.canvas.style.cursor = 'grab';
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
            // グローバルconfigも更新
            const globalConfig = window.config;
            if (globalConfig && globalConfig.renderOptions === this.renderOptions) {
                console.log('🎮 InteractionController: Updating global config after zoom');
                console.log('🎮 New fieldOfViewRA:', this.renderOptions.fieldOfViewRA, 'fieldOfViewDec:', this.renderOptions.fieldOfViewDec);
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
        console.log('🎮 InteractionController constructor called');
        this.setupEventListeners();
    }
    // オプション更新メソッドを追加
    updateOptions(newOptions) {
        console.log('🎮 InteractionController updateOptions called with:', newOptions);
        // グローバルconfigとの参照を確認
        const globalConfig = window.config;
        if (globalConfig) {
            console.log('🎮 this.renderOptions === globalConfig.renderOptions:', this.renderOptions === globalConfig.renderOptions);
            // 参照が異なる場合は、globalConfig.renderOptionsの参照に更新
            if (this.renderOptions !== globalConfig.renderOptions) {
                console.log('🎮 Updating renderOptions reference to match globalConfig');
                this.renderOptions = globalConfig.renderOptions;
            }
        }
        Object.assign(this.renderOptions, newOptions);
        console.log('🎮 renderOptions after update:', this.renderOptions);
        // renderCallbackが正しく動作するかテスト
        console.log('🎮 Testing renderCallback after updateOptions...');
        this.renderCallback();
        console.log('🎮 renderCallback test completed');
    }
    setupEventListeners() {
        // PointerEventでマウスとタッチを両方扱う
        this.canvas.addEventListener('pointerdown', this.onPointerDown);
        this.canvas.addEventListener('pointermove', this.onPointerMove);
        this.canvas.addEventListener('pointerup', this.onPointerUp);
        this.canvas.addEventListener('pointerleave', this.onPointerUp);
        // ホイールイベントでズーム
        this.canvas.addEventListener('wheel', this.onWheel);
    }
}
//# sourceMappingURL=interactionController.js.map