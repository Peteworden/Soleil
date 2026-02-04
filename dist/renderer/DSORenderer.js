import { RaDec } from "../utils/coordinates/index.js";
import { MessierObject } from "../models/CelestialObject.js";
export class DSORenderer {
    constructor(canvas, ctx, config, colorManager, orientationData) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.config = config;
        this.colorManager = colorManager;
        this.orientationData = orientationData;
        this.imageCache = {};
    }
    setImageCache(imageCache) {
        this.imageCache = imageCache;
    }
    // 天体を描画
    drawDSOObject(object, category, objectInformation, nameCorner) {
        if (!object.getName() || object.getName() == '')
            return;
        const coordsJ2000 = new RaDec(object.getCoordinates().ra, object.getCoordinates().dec);
        const coords = coordsJ2000.precess(undefined, 'j2000', this.config.displayTime.jd);
        const screenXY = coords.toCanvasXYifin(this.config, this.orientationData, false);
        if (!screenXY[0])
            return;
        const { x, y } = screenXY[1];
        const type = object.getType();
        objectInformation.push({
            name: object.getName(),
            type: category,
            x: x,
            y: y,
            data: object
        });
        let markFlag = true;
        if (object instanceof MessierObject && object.getOverlay() !== null && this.config.viewState.fieldOfViewRA < 2 && object.getOverlay().width < 2.0 * 30.0 / this.canvas.width) {
            markFlag = false;
        }
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = this.colorManager.getColor('dso');
        this.ctx.strokeStyle = this.colorManager.getColor('dso');
        this.ctx.lineWidth = 1;
        /*
        Gx       Galaxy 銀河
        OC       Open star cluster 散開星団
        Gb       Globular star cluster, usually in the Milky Way Galaxy 球状星団
        Nb       Bright emission or reflection nebula 散光星雲、超新星残骸
        Pl       Planetary nebula 惑星状星雲
        C+N      Cluster associated with nebulosity
        Ast      Asterism or group of a few stars
        Kt       Knot or nebulous region in an external galaxy
        TS       Triple star    (was *** in the CDS table version)
        DS       Double star    (was ** in the CDS version)
        SS       Single star    (was * in the CDS version)
        ?        Uncertain type or may not exist
        U        Unidentified at the place given, or type unknown (was blank in CDS v.)
        -        Object called nonexistent in the RNGC (Sulentic and Tifft 1973)
        PD       Photographic plate defect
        */
        this.ctx.beginPath();
        if (nameCorner == 'bottom-right') {
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(object.getName(), x, y);
        }
        else {
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'bottom';
            this.ctx.fillText(object.getName(), x, y);
        }
        if (type === 'Gx') { // Galaxy, 楕円
            this.ctx.ellipse(x, y, 6, 3, 0, 0, Math.PI * 2);
            this.ctx.stroke();
            // this.ctx.fillText(object.getName(), x+5, y-5);
        }
        else if (['OC', 'C+N', 'Ast'].includes(type || '')) { // Open Cluster, 上三角形
            this.ctx.moveTo(x, y - 6);
            this.ctx.lineTo(x + 4, y + 3);
            this.ctx.lineTo(x - 4, y + 3);
            this.ctx.lineTo(x, y - 6);
            this.ctx.stroke();
            // this.ctx.fillText(object.getName(), x+5, y-5);
        }
        else if (type == 'Gb') { // Globular Cluster, 円
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.stroke();
            // this.ctx.fillText(object.getName(), x+5, y-5);
        }
        else if (['Nb', 'Pl', 'Kt'].includes(type || '')) { // Nebula, 正方形
            if (markFlag) {
                this.ctx.moveTo(x, y - 6);
                this.ctx.lineTo(x + 6, y);
                this.ctx.lineTo(x, y + 6);
                this.ctx.lineTo(x - 6, y);
                this.ctx.lineTo(x, y - 6);
                this.ctx.stroke();
            }
            // this.ctx.fillText(object.getName(), x+5, y-5);
        }
        else if (['DS', 'TS', 'SS'].includes(type || '')) { // Star, 星
            const a = Math.PI / 5;
            const b = 6;
            const c = 3;
            this.ctx.moveTo(x, y - b);
            this.ctx.lineTo(x + c * Math.sin(a), y - c * Math.cos(a));
            this.ctx.lineTo(x + b * Math.sin(2 * a), y - b * Math.cos(2 * a));
            this.ctx.lineTo(x + c * Math.sin(3 * a), y - c * Math.cos(3 * a));
            this.ctx.lineTo(x + b * Math.sin(4 * a), y - b * Math.cos(4 * a));
            this.ctx.lineTo(x + c * Math.sin(5 * a), y - c * Math.cos(5 * a));
            this.ctx.lineTo(x + b * Math.sin(6 * a), y - b * Math.cos(6 * a));
            this.ctx.lineTo(x + c * Math.sin(7 * a), y - c * Math.cos(7 * a));
            this.ctx.lineTo(x + b * Math.sin(8 * a), y - b * Math.cos(8 * a));
            this.ctx.lineTo(x + c * Math.sin(9 * a), y - c * Math.cos(9 * a));
            this.ctx.lineTo(x, y - b);
            this.ctx.stroke();
            // this.ctx.fillText(object.getName(), x+5, y-5);
        }
        else { // ×印
            this.ctx.moveTo(x - 4, y - 4);
            this.ctx.lineTo(x + 4, y + 4);
            this.ctx.moveTo(x + 4, y - 4);
            this.ctx.lineTo(x - 4, y + 4);
            this.ctx.stroke();
            // this.ctx.fillText(object.getName(), x+5, y-5);
        }
        if (object instanceof MessierObject &&
            ['AEP', 'view'].includes(this.config.displaySettings.mode) &&
            object.getName() in this.imageCache &&
            object.getOverlay() !== null &&
            window.config.viewState.fieldOfViewRA < 20) {
            const img = this.imageCache[object.getName()];
            // 画像が正常に読み込まれているかチェック
            if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                this.drawOverlay(object.getName(), coords, object.getOverlay(), x, y, this.config.displaySettings.mode);
            }
            else if (!img.complete) {
                // 画像がまだ読み込み中の場合
                img.onload = () => {
                    // 読み込み完了後も再度チェック
                    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                        this.drawOverlay(object.getName(), coords, object.getOverlay(), x, y, this.config.displaySettings.mode);
                    }
                };
                img.onerror = () => {
                    console.warn(`Failed to load image for ${object.getName()}`);
                };
            }
        }
    }
    drawOverlay(name, coords, overlay, x, y, mode) {
        this.ctx.save();
        const overlaySize = overlay.width * this.canvas.width / this.config.viewState.fieldOfViewRA;
        this.ctx.globalAlpha = overlay.opacity;
        if (mode == 'AEP') {
            this.ctx.drawImage(this.imageCache[name], x - overlaySize / 2, y - overlaySize / 2, overlaySize, overlaySize);
        }
        else if (mode == 'view') {
            this.ctx.translate(x, y);
            const oneDegNorth = new RaDec(coords.ra, Math.min(coords.dec + 1, 89.999999));
            const oneDegNorthXY = oneDegNorth.toCanvasXYifin(this.config, this.orientationData, true);
            // const oneDegNorthXY = this.coordinateConverter.equatorialToScreenXYifin({ ra: coords.ra, dec: Math.min(coords.dec + 1, 89.999999) }, this.config, true, this.orientationData);
            const rotation = Math.atan2(oneDegNorthXY[1].x - x, -oneDegNorthXY[1].y + y);
            this.ctx.rotate(rotation);
            this.ctx.drawImage(this.imageCache[name], -overlaySize / 2, -overlaySize / 2, overlaySize, overlaySize);
        }
        this.ctx.restore();
    }
}
//# sourceMappingURL=DSORenderer.js.map