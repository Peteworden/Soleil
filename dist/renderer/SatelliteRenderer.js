import { getColorManager } from '../utils/colorManager.js';
export class SatelliteRenderer {
    constructor(ctx, canvasSize, viewState, isDarkMode = false) {
        this.ctx = ctx;
        this.canvasSize = canvasSize;
        this.viewState = viewState;
        this.colorManager = getColorManager(isDarkMode);
    }
    /**
     * 人工衛星を描画
     */
    renderSatellites(satellites) {
        for (const satellite of satellites) {
            this.renderSatellite(satellite);
        }
    }
    /**
     * 単一の人工衛星を描画
     */
    renderSatellite(satellite) {
        // 座標変換（赤道座標から画面座標）
        const screenPos = this.equatorialToScreen(satellite.ra, satellite.dec);
        if (!screenPos)
            return;
        const x = screenPos.x;
        const y = screenPos.y;
        // 人工衛星の見た目を決定
        const size = this.getSatelliteSize(satellite.magnitude || 0);
        const color = this.getSatelliteColor(satellite.illuminated);
        // 人工衛星を描画
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = satellite.illuminated ? this.colorManager.getColor('text') : this.colorManager.getColor('textSecondary');
        this.ctx.lineWidth = 1;
        // 人工衛星のシンボルを描画（十字マーク）
        this.drawSatelliteSymbol(x, y, size);
        // 人工衛星の名前を描画
        if (satellite.name && satellite.alt > 10) { // 高度が10度以上の場合のみ表示
            this.drawSatelliteLabel(x, y, satellite.name, satellite.alt, satellite.range);
        }
        this.ctx.restore();
    }
    /**
     * 人工衛星のシンボルを描画
     */
    drawSatelliteSymbol(x, y, size) {
        // 十字マークを描画
        this.ctx.beginPath();
        this.ctx.moveTo(x - size, y);
        this.ctx.lineTo(x + size, y);
        this.ctx.moveTo(x, y - size);
        this.ctx.lineTo(x, y + size);
        this.ctx.stroke();
        // 中心に小さな円を描画
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.3, 0, 2 * Math.PI);
        this.ctx.fill();
    }
    /**
     * 人工衛星のラベルを描画
     */
    drawSatelliteLabel(x, y, name, alt, range) {
        const fontSize = 12;
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.fillStyle = this.colorManager.getColor('text');
        this.ctx.strokeStyle = this.colorManager.getColor('background');
        this.ctx.lineWidth = 2;
        // 高度と距離の情報を含むラベル
        const label = `${name}\n${alt.toFixed(1)}° ${(range / 1000).toFixed(0)}km`;
        const lines = label.split('\n');
        const lineHeight = fontSize + 2;
        const totalHeight = lines.length * lineHeight;
        // ラベルの背景
        const padding = 4;
        const labelWidth = Math.max(...lines.map(line => this.ctx.measureText(line).width));
        const labelHeight = totalHeight;
        this.ctx.fillStyle = this.colorManager.getColorWithAlpha('background', 0.7);
        this.ctx.fillRect(x + 10, y - labelHeight / 2, labelWidth + padding * 2, labelHeight + padding * 2);
        // テキストを描画
        this.ctx.fillStyle = this.colorManager.getColor('text');
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        for (let i = 0; i < lines.length; i++) {
            this.ctx.fillText(lines[i], x + 10 + padding, y - labelHeight / 2 + padding + i * lineHeight);
        }
    }
    /**
     * 人工衛星のサイズを決定
     */
    getSatelliteSize(magnitude) {
        // 等級に基づいてサイズを決定
        if (magnitude < 3)
            return 4;
        if (magnitude < 5)
            return 3;
        if (magnitude < 7)
            return 2;
        return 1;
    }
    /**
     * 人工衛星の色を決定
     */
    getSatelliteColor(illuminated) {
        return this.colorManager.getSatelliteColor(illuminated);
    }
    /**
     * 赤道座標を画面座標に変換
     */
    equatorialToScreen(ra, dec) {
        // 中心座標からの相対位置を計算
        const deltaRA = this.normalizeAngle(ra - this.viewState.centerRA);
        const deltaDec = dec - this.viewState.centerDec;
        // 視野内かどうかをチェック
        if (Math.abs(deltaRA) > this.viewState.fieldOfViewRA / 2 ||
            Math.abs(deltaDec) > this.viewState.fieldOfViewDec / 2) {
            return null;
        }
        // 画面座標に変換
        const x = this.canvasSize.width / 2 + (deltaRA / this.viewState.fieldOfViewRA) * this.canvasSize.width;
        const y = this.canvasSize.height / 2 - (deltaDec / this.viewState.fieldOfViewDec) * this.canvasSize.height;
        return { x, y };
    }
    /**
     * 角度を正規化（-180 から 180 の範囲に）
     */
    normalizeAngle(angle) {
        while (angle > 180)
            angle -= 360;
        while (angle < -180)
            angle += 360;
        return angle;
    }
    /**
     * キャンバスサイズを更新
     */
    updateCanvasSize(canvasSize) {
        this.canvasSize = canvasSize;
    }
    /**
     * ビューステートを更新
     */
    updateViewState(viewState) {
        this.viewState = viewState;
    }
    /**
     * 人工衛星の軌道を描画（将来の機能）
     */
    renderSatelliteOrbit(satellite, futurePositions) {
        if (futurePositions.length < 2)
            return;
        this.ctx.save();
        this.ctx.strokeStyle = this.colorManager.getColorWithAlpha('satellite', 0.5);
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        let firstPoint = true;
        for (const pos of futurePositions) {
            const screenPos = this.equatorialToScreen(pos.ra, pos.dec);
            if (screenPos) {
                if (firstPoint) {
                    this.ctx.moveTo(screenPos.x, screenPos.y);
                    firstPoint = false;
                }
                else {
                    this.ctx.lineTo(screenPos.x, screenPos.y);
                }
            }
        }
        this.ctx.stroke();
        this.ctx.restore();
    }
}
//# sourceMappingURL=SatelliteRenderer.js.map