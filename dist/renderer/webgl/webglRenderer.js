import { StarsProgram } from './programs/starsProgram.js';
import { CoordinateConverter } from '../../utils/coordinates.js';
import { AstronomicalCalculator } from '../../utils/calculations.js';
export class WebGLRenderer {
    // WebGL2コンテキストの初期化、StarsProgramの準備
    constructor(canvas, config) {
        this.coordinateConverter = new CoordinateConverter();
        this.imageCache = {};
        this.objectInfomation = [];
        // Create an overlay canvas or reuse provided one for GL
        this.canvas = canvas;
        const gl = canvas.getContext('webgl2', { antialias: true, alpha: true });
        if (!gl)
            throw new Error('WebGL2 not supported');
        this.gl = gl;
        this.config = config;
        this.starsProgram = new StarsProgram(this.gl);
        this.objectInfomation = [];
    }
    // 画像キャッシュ（当面未使用）
    setImageCache(imageCache) {
        this.imageCache = imageCache;
    }
    // ベイヤー記号の描画（WebGLでは未実装、Canvasにフォールバック）
    drawBayerDesignations(bayerData, limitingMagnitude) {
        // WebGLではテキスト描画が複雑なため、当面は空実装
        // 将来的にはCanvas2DやWebGLテキスト描画ライブラリを使用する予定
        console.log('drawBayerDesignations called (WebGL - not implemented)');
    }
    // 設定更新時にcanvasサイズやviewportを同期
    updateOptions(options) {
        Object.assign(this.config, options);
        this.canvas.width = this.config.canvasSize.width;
        this.canvas.height = this.config.canvasSize.height;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    // 背景クリア（アルファ0でCanvas合成と両立）
    clear() {
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }
    // Gaia星の描画（最小実装）
    // 入力がRA/Dec, helpDataの通常経路の場合: 画面内の領域候補から投影して[xPx, yPx, mag]を生成
    // 既に[xPx, yPx, mag]が来る場合はそのまま変換
    drawGaiaStars(gaiaData, gaiaHelpData, brightestMagnitude) {
        if (this.config.displaySettings.usedStar == 'noStar')
            return;
        if (!['AEP', 'view'].includes(this.config.displaySettings.mode))
            return;
        if (!gaiaData || gaiaData.length === 0)
            return;
        // CanvasRenderer.starSize_0mag と同等のスケーリング
        const pointScale = Math.max(200.0 / (Math.min(this.config.viewState.fieldOfViewRA, this.config.viewState.fieldOfViewDec) + 15), 5);
        // [xPx, yPx, mag] or [ra, dec, mag] を処理
        const w = this.canvas.width;
        const h = this.canvas.height;
        const interleaved = []; //[xNdc, yNdc, mag, xNdc, yNdc, mag, ...]
        // この判定は厳密でない
        const isScreenXY = Number.isFinite(gaiaData[0][0]) && Math.abs(gaiaData[0][0]) > 1 && Math.abs(gaiaData[0][0]) <= Math.max(w, h);
        if (isScreenXY) {
            for (let i = 0; i < gaiaData.length; i++) {
                const d = gaiaData[i];
                if (!d || d.length < 3)
                    continue;
                const xPx = d[0];
                const yPx = d[1];
                const mag = d[2];
                const xNdc = xPx / w * 2 - 1;
                const yNdc = 1 - yPx / h * 2;
                interleaved.push(xNdc, yNdc, mag);
            }
        }
        else if (gaiaHelpData && gaiaHelpData.length > 0) {
            // 通常のGaiaデータ（区画+helpインデックス）を用いた投影（簡易版）
            const limitingMag = AstronomicalCalculator.limitingMagnitude(this.config);
            const currentJd = window.config.displayTime.jd;
            const precessionAngle = this.coordinateConverter.precessionAngle('j2000', currentJd);
            // 簡易: 全区画を走査（後でCanvasRendererのareaCandidates最適化を共有化可能）
            for (let unit = 0; unit < gaiaHelpData.length - 1; unit++) {
                const raInt = unit % 360;
                const decInt = Math.floor(unit / 360) - 90;
                const st = gaiaHelpData[unit];
                const fi = gaiaHelpData[unit + 1];
                for (let i = st; i < fi; i++) {
                    const d = gaiaData[i];
                    const mag = d[2];
                    if (mag >= limitingMag)
                        continue;
                    const ra = raInt + d[0];
                    const dec = decInt + d[1];
                    const eq = this.coordinateConverter.precessionEquatorial({ ra, dec }, precessionAngle);
                    const screenXY = this.coordinateConverter.equatorialToScreenXYifin(eq, this.config);
                    if (!screenXY[0])
                        continue;
                    const xPx = screenXY[1][0];
                    const yPx = screenXY[1][1];
                    //左下が原点
                    const xNdc = xPx / w * 2 - 1;
                    const yNdc = 1 - yPx / h * 2;
                    interleaved.push(xNdc, yNdc, mag);
                }
            }
        }
        if (interleaved.length === 0)
            return;
        const array = new Float32Array(interleaved);
        this.starsProgram.draw(array, interleaved.length / 3, pointScale, [1.0, 1.0, 1.0]);
    }
    // Stubs to match CanvasRenderer API (no-ops for now)
    drawHipStars(_) { }
    writeStarNames(_) { }
    drawConstellationLines(_) { }
    drawMessier(_) { }
    drawRec(_) { }
    drawNGC(_) { }
    drawTempTarget(_) { }
    writeConstellationNames(_) { }
    drawSolarSystemObjects() { }
    drawReticle() { }
    drawGrid() { }
    drawPoleMark() { }
    drawCameraView() { }
    clearObjectInfomation() { this.objectInfomation = []; }
    getVisibleObjects() { return this.objectInfomation; }
}
//# sourceMappingURL=webglRenderer.js.map