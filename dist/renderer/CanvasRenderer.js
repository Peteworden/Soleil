import { CoordinateConverter } from '../utils/coordinates.js';
export class CanvasRenderer {
    constructor(canvas, options, latitude, longitude) {
        this.canvas = canvas;
        const context = canvas.getContext('2d');
        if (!context)
            throw new Error('Failed to get canvas context');
        this.ctx = context;
        this.options = options;
        this.coordinateConverter = new CoordinateConverter(latitude, longitude);
    }
    // 描画をクリア
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    // 天体を描画
    drawObject(object) {
        const coords = object.getCoordinates();
        const screenCoords = this.celestialToScreen(coords);
        if (!screenCoords)
            return;
        const [x, y] = screenCoords;
        const magnitude = object.getMagnitude();
        const type = object.getType();
        this.ctx.beginPath();
        if (type === 'hipStar' && magnitude !== undefined) {
            const radius = Math.max(1, 7 - magnitude);
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'white';
            this.ctx.fill();
        }
        else {
            this.ctx.arc(x, y, 3, 0, Math.PI * 2);
            this.ctx.fillStyle = 'yellow';
            this.ctx.fill();
        }
    }
    drawHipStars(hipStars) {
        for (const star of hipStars) {
            const coords = star.getCoordinates();
            const screenCoords = this.celestialToScreen(coords);
            if (!screenCoords)
                continue;
            const [x, y] = screenCoords;
            const radius = Math.max(1, 7 - star.getMagnitude());
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'white';
            this.ctx.fill();
        }
    }
    // グリッドを描画
    drawGrid() {
        if (!this.options.showGrid)
            return;
        const step = 15; // 15度ごとにグリッド線を描画
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        // 赤経のグリッド線
        for (let ra = 0; ra < 360; ra += step) {
            this.ctx.beginPath();
            for (let dec = -90; dec <= 90; dec += 5) {
                const coords = { ra, dec };
                const screenCoords = this.celestialToScreen(coords);
                if (screenCoords) {
                    const [x, y] = screenCoords;
                    if (dec === -90) {
                        this.ctx.moveTo(x, y);
                    }
                    else {
                        this.ctx.lineTo(x, y);
                    }
                }
            }
            this.ctx.stroke();
        }
        // 赤緯のグリッド線
        for (let dec = -90; dec <= 90; dec += step) {
            this.ctx.beginPath();
            for (let ra = 0; ra <= 360; ra += 5) {
                const coords = { ra, dec };
                const screenCoords = this.celestialToScreen(coords);
                if (screenCoords) {
                    const [x, y] = screenCoords;
                    if (ra === 0) {
                        this.ctx.moveTo(x, y);
                    }
                    else {
                        this.ctx.lineTo(x, y);
                    }
                }
            }
            this.ctx.stroke();
        }
    }
    // 星座線を描画
    drawConstellations(constellations) {
        if (!this.options.showConstellations)
            return;
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        for (const constellation of constellations) {
            const coords1 = { ra: constellation.ra1, dec: constellation.dec1 };
            const coords2 = { ra: constellation.ra2, dec: constellation.dec2 };
            const screenCoords1 = this.celestialToScreen(coords1);
            const screenCoords2 = this.celestialToScreen(coords2);
            if (screenCoords1 && screenCoords2) {
                const [x1, y1] = screenCoords1;
                const [x2, y2] = screenCoords2;
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.stroke();
            }
        }
    }
    // 赤道座標を画面座標に変換
    celestialToScreen(coords) {
        const centerRA = this.options.centerRA;
        const centerDec = this.options.centerDec;
        const fovRA = this.options.fieldOfViewRA;
        const fovDec = this.options.fieldOfViewDec;
        // 中心からの相対位置を計算
        let raDiff = coords.ra - centerRA;
        if (raDiff > 180)
            raDiff -= 360;
        if (raDiff < -180)
            raDiff += 360;
        const decDiff = coords.dec - centerDec;
        // 画面座標に変換
        const x = this.canvas.width * (0.5 - raDiff / fovRA);
        const y = this.canvas.height * (0.5 - decDiff / fovDec);
        // 画面内かチェック
        if (x >= 0 && x <= this.canvas.width && y >= 0 && y <= this.canvas.height) {
            return [x, y];
        }
        return null;
    }
    // 描画オプションを更新
    updateOptions(options) {
        this.options = { ...this.options, ...options };
    }
}
//# sourceMappingURL=CanvasRenderer.js.map