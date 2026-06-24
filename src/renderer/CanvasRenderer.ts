import { CelestialObject, MessierObject, NGCObject, SharplessObject } from '../models/CelestialObject.js';
import { BayerFlamData, ConstellationData, StarInformation, StarChartConfig, StarName, ObjectInformation, GaiaData, HipData, CanvasXy, CanvasSize, DeviceOrientationData } from '../types/index.js';
import { CoordinateConverter } from '../core/coordinates.js';
import { ColorManager, getColorManager } from './colorManager.js';
import { getAreaCandidates, getGridIntervals, getBetaRange, getGridLineWidth, getAlphaRange } from './canvasHelpers.js';
import { HipStarRenderer } from './HipStarRenderer.js';
import { GaiaStarRenderer } from './GaiaStarRenderer.js';
import { SolarSystemRenderer } from './SolarSystemRenderer.js';
import { DSORenderer } from './DSORenderer.js';
import { AzAlt, RaDec } from '../core/coordinates/index.js';
import { AstronomicalCalculator } from '../core/calculations.js';
import { getConfig } from '../core/ConfigManager.js';

export interface areaCandidatesCacheInterface {
    areas: number[][],
    minDec: number, maxDec: number, minRa: number, maxRa: number,
    mode: string, jd: number, centerRa: number, centerDec: number, fovRa: number, fovDec: number, planet: string, lat: number, lon: number
}

export class CanvasRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private config: StarChartConfig;
    private coordinateConverter: CoordinateConverter;

    private solarSystemRenderer: SolarSystemRenderer;
    private hipStarRenderer: HipStarRenderer;
    private gaiaStarRenderer: GaiaStarRenderer;
    private dsoRenderer: DSORenderer;

    private areaCandidatesCache: areaCandidatesCacheInterface | null = null;
    private precessionCache: { angle: number, jd: number } | null = null;

    private objectInformation: Array<ObjectInformation> = [];
    private starInformation: Array<StarInformation> = [];

    private orientationData: DeviceOrientationData = { alpha: 0, beta: 0, gamma: 0, webkitCompassHeading: 0 };

    private colorManager: ColorManager;

    constructor(
        canvas: HTMLCanvasElement
    ) {
        this.canvas = canvas;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Failed to get canvas context');
        this.ctx = context;

        this.config = getConfig();

        this.objectInformation = [];
        console.log("CanvasRenderer constructor");

        this.coordinateConverter = new CoordinateConverter();

        // 色管理システムを初期化
        this.colorManager = getColorManager(this.config.displaySettings.darkMode);

        this.solarSystemRenderer = new SolarSystemRenderer(this.canvas, this.ctx, this.config, this.colorManager, this.orientationData);
        this.hipStarRenderer = new HipStarRenderer(this.ctx, this.config, this.colorManager, this.areaCandidates);
        this.gaiaStarRenderer = new GaiaStarRenderer(this.ctx, this.config, this.colorManager, this.areaCandidates);
        this.dsoRenderer = new DSORenderer(this.canvas, this.ctx, this.config, this.colorManager);
    }

    // imageCacheを設定
    setImageCache(imageCache: { [key: string]: HTMLImageElement }): void {
        this.dsoRenderer.setImageCache(imageCache);
    }

    // 描画をクリア
    clear(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawObject(object: CelestialObject, category: string, objectInformation: Array<ObjectInformation>, nameCorner?: string): void {
        this.dsoRenderer.drawDSOObject(object, category, objectInformation, nameCorner);
    }

    drawJsonObject(objects: CelestialObject[], category: string, nameCorner?: string): void {
        if (objects.length == 0) return;
        for (const object of objects) {
            this.drawObject(object, category, this.objectInformation, nameCorner);
        }
    }

    drawMessier(messierObjects: MessierObject[]): void {
        if (!this.config.displaySettings.showMessiers) return;
        this.drawJsonObject(messierObjects, 'messier');
    }

    drawRec(recObjects: MessierObject[]): void {
        if (!this.config.displaySettings.showRecs) return;
        this.drawJsonObject(recObjects, 'rec');
    }

    drawNGC(ngcObjects: NGCObject[], icObjects: NGCObject[]): void {
        if (!this.config.displaySettings.showNGC) return;
        this.drawJsonObject(ngcObjects, 'ngc', 'bottom-right');
        this.drawJsonObject(icObjects, 'ngc', 'bottom-left');
    }

    drawSharpless(sharplessObjects: SharplessObject[]): void {
        if (!this.config.displaySettings.showSharpless) return;
        this.drawJsonObject(sharplessObjects, 'sharpless');
    }

    drawTempTarget(tempTarget: string | null): void {
        if (!tempTarget) return;
        const tempTargetObject = JSON.parse(tempTarget);
        if (tempTargetObject.name.startsWith('NGC')) {
            const tempNGC = NGCObject.fromJson(tempTargetObject);
            this.drawJsonObject([tempNGC], 'ngc', 'bottom-right');
        } else if (tempTargetObject.name.startsWith('IC')) {
            const tempIC = NGCObject.fromJson(tempTargetObject);
            this.drawJsonObject([tempIC], 'ngc', 'bottom-left');
        } else if (tempTargetObject.name.startsWith('Sh2')) {
            const tempSh2 = SharplessObject.fromJson(tempTargetObject);
            this.drawJsonObject([tempSh2], 'sh2');
        }
    }

    drawSolarSystemObjects(): void {
        this.solarSystemRenderer.drawSolarSystemObjects(this.objectInformation);
    }

    drawHipStars(hipStars: HipData): void {
        this.hipStarRenderer.drawHipStars(hipStars, this.starInformation);
    }

    writeStarNames(starNames: StarName[]): void {
        if (starNames.length == 0) return;
        const showStarNames = this.config.displaySettings.showStarNames;
        if (this.config.displaySettings.showStarNames == 'off') return;
        if (starNames.length == 0) return;
        const currentJd = this.config.displayTime.jd;

        // 歳差運動補正をキャッシュ
        let precessionAngle: number;
        if (this.precessionCache && Math.abs(this.precessionCache.jd - currentJd) < 10.0) {
            precessionAngle = this.precessionCache.angle;
        } else {
            precessionAngle = AstronomicalCalculator.precessionAngle('j2000', currentJd);
            this.precessionCache = { angle: precessionAngle, jd: currentJd };
        }

        const fov = { ra: this.config.viewState.fieldOfViewRA, dec: this.config.viewState.fieldOfViewDec };
        const transformConfig = CoordinateConverter.chartConfigToTransformConfig(this.config, this.orientationData);

        // tierは0から5
        const tier_range = [180, 90, 60, 40, 30, 30];
        let tierLimit = 3;
        if (showStarNames == 'to1') {
            tierLimit = 1;
        } else if (showStarNames == 'to2') {
            tierLimit = 2;
        }
        this.ctx.font = `14px serif`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillStyle = this.colorManager.getColor('text');
        this.ctx.beginPath();
        for (const starName of starNames) {
            if (tierLimit == 1 && starName.tier > 0) continue;
            if (tierLimit == 2 && starName.tier > 1) continue;
            if (Math.max(fov.ra, fov.dec) > tier_range[starName.tier - 1]) continue;
            const coords = RaDec.precession({ ra: starName.ra, dec: starName.dec }, precessionAngle);
            const [ifin, { x, y }] = RaDec.toCanvasXYifin(coords, fov, this.config.canvasSize, transformConfig, true);
            if (!ifin) continue;
            if (starName.jpnName) {
                this.ctx.fillText(starName.jpnName, x + 2, y - 2);
            } else {
                this.ctx.fillText(starName.name, x + 2, y - 2);
            }
        }
        this.ctx.fill();
    }

    /**
     * バイエル符号、フラムスティード番号
     */
    drawBayerDesignations(bayerData: BayerFlamData[], limitingMagnitude: number): void {
        if (!bayerData || bayerData.length === 0) return;
        if (!this.config.displaySettings.showBayerFS) return;
        if (this.config.viewState.fieldOfViewRA * this.config.viewState.fieldOfViewDec > 400) return;

        const fov = { ra: this.config.viewState.fieldOfViewRA, dec: this.config.viewState.fieldOfViewDec };
        const transformConfig = CoordinateConverter.chartConfigToTransformConfig(this.config, this.orientationData);

        this.ctx.save();
        this.ctx.fillStyle = this.colorManager.getColor('text');
        this.ctx.font = '14px serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';

        // 歳差運動補正
        const currentJd = this.config.displayTime.jd;
        const precessionAngle = AstronomicalCalculator.precessionAngle('j2000', currentJd);

        for (const bayerStar of bayerData) {
            if (!bayerStar.coordinates) continue;
            const coords = RaDec.precession({ ra: bayerStar.coordinates.ra, dec: bayerStar.coordinates.dec }, precessionAngle);
            const canvasXY = RaDec.toCanvasXYifin(coords, fov, this.config.canvasSize, transformConfig);
            if (!canvasXY[0]) continue;

            const { x, y } = canvasXY[1];

            // ベイヤー記号を表示（既にフォーマット済み）
            if (bayerStar.bayer && bayerStar.flam) {
                this.ctx.fillText(`${bayerStar.bayer} (${bayerStar.flam})`, x + 5, y + 5);
            } else if (bayerStar.bayer) {
                this.ctx.fillText(bayerStar.bayer, x + 5, y + 5);
            } else if (bayerStar.flam) {
                this.ctx.fillText(`${bayerStar.flam}`, x + 2, y + 2);
            }
        }

        this.ctx.restore();
    }

    drawGaiaStars(gaiaData: GaiaData, gaiaHelpData: number[], magBrightest: number): void {
        this.gaiaStarRenderer.drawGaiaStars(gaiaData, gaiaHelpData, magBrightest, this.starInformation);
    }

    // グリッドを描画
    drawGrid(): void {
        if (!this.config.displaySettings.showGrid) return;
        if (!["AEP", "view"].includes(this.config.displaySettings.mode)) return;

        let i, j;
        const fieldOfViewRA = this.config.viewState.fieldOfViewRA;
        const fieldOfViewDec = this.config.viewState.fieldOfViewDec;
        const centerRA = this.config.viewState.centerRA;
        const centerDec = this.config.viewState.centerDec;
        const centerAz = this.config.viewState.centerAz;
        const centerAlt = this.config.viewState.centerAlt;
        const siderealTime = this.config.siderealTime;
        const latitude = this.config.observationSite.latitude;
        const lstLat = { lst: siderealTime, lat: latitude };
        const mode = this.config.displaySettings.mode as 'AEP' | 'view';

        const alpha = mode == 'AEP' ? centerRA : centerAz;
        const beta = mode == 'AEP' ? centerDec : centerAlt;

        const fov = { ra: this.config.viewState.fieldOfViewRA, dec: this.config.viewState.fieldOfViewDec };
        const transformConfig = CoordinateConverter.chartConfigToTransformConfig(this.config, this.orientationData);

        const [
            alphaInterval, betaInterval, alphaCalcInterval, betaCalcInterval
        ] = getGridIntervals(fieldOfViewRA, fieldOfViewDec, alpha, beta);
        const [minBeta, maxBeta] = getBetaRange(fov, transformConfig);
        const minBetaLineIdx = Math.floor(minBeta / betaInterval);
        const maxBetaLineIdx = Math.ceil(maxBeta / betaInterval);
        const minBetaCalcIdx = Math.floor(minBeta / betaCalcInterval);
        const maxBetaCalcIdx = Math.ceil(maxBeta / betaCalcInterval);
        this.ctx.strokeStyle = this.colorManager.getColor('grid');

        const canvasSize = this.config.canvasSize;
        const maxLengthSquared = this.coordinateConverter.getMaxLineLengthSquared(canvasSize, this.config.viewState);

        let a = 0.0, b = 0.0;
        let preXY = { ifin: false, x: 0.0, y: 0.0 };
        let ifin = false, x = 0.0, y = 0.0;
        let newLine = true;
        if (maxBeta == 90.0) {
            // 横の線
            for (i = minBetaLineIdx; i <= maxBetaLineIdx; i++) {
                newLine = true;
                b = i * betaInterval;
                this.ctx.lineWidth = getGridLineWidth(b);
                if (mode == 'AEP' && b == 0.0) {
                    this.ctx.strokeStyle = this.colorManager.getColor('gridEquatorialLine');
                }
                this.ctx.beginPath();
                for (j = 0; j <= 360 / alphaCalcInterval + 1; j++) {
                    a = j * alphaCalcInterval;
                    if (mode == 'AEP') {
                        [ifin, { x, y }] = RaDec.toCanvasXYifin({ ra: a, dec: b }, fov, canvasSize, transformConfig, true);
                    } else if (mode == 'view') {
                        [ifin, { x, y }] = AzAlt.toCanvasXYifin({ az: a, alt: b }, fov, canvasSize, transformConfig, true);
                    }
                    if (!newLine && this.coordinateConverter.shouldDrawLine(preXY.x, preXY.y, x, y, canvasSize, maxLengthSquared)) {
                        this.ctx.moveTo(preXY.x, preXY.y);
                        this.ctx.lineTo(x, y);
                    }
                    preXY = { ifin: ifin, x: x, y: y };
                    newLine = false;
                }
                this.ctx.stroke();
                if (mode == 'AEP' && b == 0.0) {
                    this.ctx.strokeStyle = this.colorManager.getColor('grid');
                }
            }
            // 縦の線
            this.ctx.lineWidth = 1;
            for (i = 0; i <= Math.ceil(360 / alphaInterval); i++) {
                newLine = true;
                a = i * alphaInterval;
                for (j = minBetaCalcIdx; j <= maxBetaCalcIdx; j++) {
                    b = j * betaCalcInterval;
                    if (mode == 'AEP') {
                        [ifin, { x, y }] = RaDec.toCanvasXYifin({ ra: a, dec: b }, fov, canvasSize, transformConfig, true);
                    } else if (mode == 'view') {
                        [ifin, { x, y }] = AzAlt.toCanvasXYifin({ az: a, alt: b }, fov, canvasSize, transformConfig, true);
                    }
                    if (!newLine && this.coordinateConverter.shouldDrawLine(preXY.x, preXY.y, x, y, canvasSize, maxLengthSquared)) {
                        this.ctx.moveTo(preXY.x, preXY.y);
                        this.ctx.lineTo(x, y);
                    }
                    preXY = { ifin: ifin, x: x, y: y };
                    newLine = false;
                }
                this.ctx.stroke();
            }
        } else if (minBeta == -90.0) {
            // 横の線
            for (i = maxBetaLineIdx; i >= minBetaLineIdx; i--) {
                newLine = true;
                b = i * betaInterval;
                this.ctx.lineWidth = getGridLineWidth(b);
                if (mode == 'AEP' && b == 0.0) {
                    this.ctx.strokeStyle = this.colorManager.getColor('gridEquatorialLine');
                }
                this.ctx.beginPath();
                for (j = 0; j <= 360 / alphaCalcInterval + 1; j++) {
                    a = j * alphaCalcInterval;
                    if (mode == 'AEP') {
                        [ifin, { x, y }] = RaDec.toCanvasXYifin({ ra: a, dec: b }, fov, canvasSize, transformConfig, true);
                    } else if (mode == 'view') {
                        [ifin, { x, y }] = AzAlt.toCanvasXYifin({ az: a, alt: b }, fov, canvasSize, transformConfig, true);
                    }
                    if (!newLine && this.coordinateConverter.shouldDrawLine(preXY.x, preXY.y, x, y, canvasSize, maxLengthSquared)) {
                        this.ctx.moveTo(preXY.x, preXY.y);
                        this.ctx.lineTo(x, y);
                    }
                    preXY = { ifin: ifin, x: x, y: y };
                    newLine = false;
                }
                this.ctx.stroke();
                if (mode == 'AEP' && b == 0.0) {
                    this.ctx.strokeStyle = this.colorManager.getColor('grid');
                }
            }
            // 縦の線
            this.ctx.lineWidth = 1;
            for (i = 0; i <= Math.ceil(360 / alphaInterval); i++) {
                newLine = true;
                a = i * alphaInterval;
                for (j = minBetaCalcIdx; j <= maxBetaCalcIdx; j++) {
                    b = j * betaCalcInterval;
                    if (mode == 'AEP') {
                        [ifin, { x, y }] = RaDec.toCanvasXYifin({ ra: a, dec: b }, fov, canvasSize, transformConfig, true);
                    } else if (mode == 'view') {
                        [ifin, { x, y }] = AzAlt.toCanvasXYifin({ az: a, alt: b }, fov, canvasSize, transformConfig, true);
                    }
                    if (!newLine && this.coordinateConverter.shouldDrawLine(preXY.x, preXY.y, x, y, canvasSize, maxLengthSquared)) {
                        this.ctx.moveTo(preXY.x, preXY.y);
                        this.ctx.lineTo(x, y);
                    }
                    preXY = { ifin: ifin, x: x, y: y };
                    newLine = false;
                }
                this.ctx.stroke();
            }
        } else {
            const alphaRange = getAlphaRange(fov, alpha, transformConfig);
            const minAlphaLineIdx = Math.ceil((alpha - alphaRange) / alphaInterval);
            const maxAlphaLineIdx = Math.floor((alpha + alphaRange) / alphaInterval);
            const maxAlphaCalcIdx = Math.ceil(alphaRange / alphaCalcInterval);
            // 横の線
            for (i = minBetaLineIdx; i <= maxBetaLineIdx; i++) {
                newLine = true;
                b = i * betaInterval;
                this.ctx.lineWidth = getGridLineWidth(b);
                if (mode == 'AEP' && b == 0.0) {
                    this.ctx.strokeStyle = this.colorManager.getColor('gridEquatorialLine');
                }
                this.ctx.beginPath();
                for (j = -maxAlphaCalcIdx; j <= maxAlphaCalcIdx; j++) {
                    a = alpha + j * alphaCalcInterval;
                    if (mode == 'AEP') {
                        [ifin, { x, y }] = RaDec.toCanvasXYifin({ ra: a, dec: b }, fov, canvasSize, transformConfig, true);
                    } else if (mode == 'view') {
                        [ifin, { x, y }] = AzAlt.toCanvasXYifin({ az: a, alt: b }, fov, canvasSize, transformConfig, true);
                    }
                    if (!newLine && this.coordinateConverter.shouldDrawLine(preXY.x, preXY.y, x, y, canvasSize, maxLengthSquared)) {
                        this.ctx.moveTo(preXY.x, preXY.y);
                        this.ctx.lineTo(x, y);
                    }
                    preXY = { ifin: ifin, x: x, y: y };
                    newLine = false;
                }
                this.ctx.stroke();
                if (mode == 'AEP' && b == 0.0) {
                    this.ctx.strokeStyle = this.colorManager.getColor('grid');
                }
            }
            // 縦の線
            this.ctx.lineWidth = 1;
            for (i = minAlphaLineIdx; i <= maxAlphaLineIdx; i++) {
                newLine = true;
                a = i * alphaInterval;
                for (j = minBetaCalcIdx; j <= maxBetaCalcIdx; j++) {
                    b = j * betaCalcInterval;
                    if (mode == 'AEP') {
                        [ifin, { x, y }] = RaDec.toCanvasXYifin({ ra: a, dec: b }, fov, canvasSize, transformConfig, true);
                    } else if (mode == 'view') {
                        [ifin, { x, y }] = AzAlt.toCanvasXYifin({ az: a, alt: b }, fov, canvasSize, transformConfig, true);
                    }
                    if (!newLine && this.coordinateConverter.shouldDrawLine(preXY.x, preXY.y, x, y, canvasSize, maxLengthSquared)) {
                        this.ctx.moveTo(preXY.x, preXY.y);
                        this.ctx.lineTo(x, y);
                    }
                    preXY = { ifin: ifin, x: x, y: y };
                    newLine = false;
                }
                this.ctx.stroke();
            }
        }

        if (mode == 'view') {
            const directions = ["北", "北東", "東", "南東", "南", "南西", "西", "北西"];
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            this.ctx.font = '15px monospace';
            this.ctx.fillStyle = this.colorManager.getColor('text');
            for (i = 0; i < 360; i += 45) {
                const direction = directions[i / 45];
                const directionRadec = AzAlt.toRadec({ az: i, alt: 0.0 }, lstLat);
                const [ifin, { x, y }] = RaDec.toCanvasXYifin(directionRadec, fov, canvasSize, transformConfig);
                if (ifin) {
                    const directionRadec2 = AzAlt.toRadec({ az: i + 1.0, alt: 0.0 }, lstLat);
                    const [ifin2, { x: x2, y: y2 }] = RaDec.toCanvasXYifin(directionRadec, fov, canvasSize, transformConfig);
                    this.ctx.save();
                    this.ctx.translate(x, y);
                    this.ctx.rotate(Math.atan2(y2 - y, x2 - x));
                    this.ctx.fillText(direction, 0, 0);
                    this.ctx.restore();
                }
            }
        }
    }

    drawEquatorialLine(): void {
    }

    drawPoleMark(): void {
        const fov = { ra: this.config.viewState.fieldOfViewRA, dec: this.config.viewState.fieldOfViewDec };
        const transformConfig = CoordinateConverter.chartConfigToTransformConfig(this.config, this.orientationData);
        const minFov = Math.min(this.config.viewState.fieldOfViewRA, this.config.viewState.fieldOfViewDec);
        if (minFov > 20) return;
        const [ifinNorth, xyNorth] = RaDec.toCanvasXYifin({ ra: 0, dec: 90 }, fov, this.config.canvasSize, transformConfig);
        if (ifinNorth) {
            if (minFov > 8) {
                this.poleMark(xyNorth, '天の北極', false);
            } else {
                this.poleMark(xyNorth, '天の北極', true);
            }
        }
        const [ifinSouth, xySouth] = RaDec.toCanvasXYifin({ ra: 0, dec: -90 }, fov, this.config.canvasSize, transformConfig);
        if (ifinSouth) {
            this.poleMark(xySouth, '天の南極', false);
        }
    }

    private poleMark(canvasXY: CanvasXy, text: string, ring: boolean = false): void {
        if (this.config.displaySettings.mode === 'AEP') return;
        const { x, y } = canvasXY;
        const a = 0.626 // 2025年始の天の北極とポラリスの離角
        const a_canvas = a * this.config.canvasSize.height / this.config.viewState.fieldOfViewDec;
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillStyle = this.colorManager.getColor('orange');
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = this.colorManager.getColor('orange');
        this.ctx.beginPath();
        this.ctx.moveTo(x - 4, y - 4);
        this.ctx.lineTo(x + 4, y + 4);
        this.ctx.moveTo(x + 4, y - 4);
        this.ctx.lineTo(x - 4, y + 4);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.fillText(text, x, y);
        if (ring) {
            this.ctx.arc(x, y, a_canvas, 0, 2 * Math.PI);
            for (let i = 0; i < 360; i += 15) {
                const ang = i * Math.PI / 180;
                const cos = Math.cos(ang);
                const sin = Math.sin(ang);
                this.ctx.moveTo(x + 0.96 * a_canvas * cos, y + 0.96 * a_canvas * sin);
                this.ctx.lineTo(x + a_canvas * cos, y + a_canvas * sin);
            }
            this.ctx.stroke();
            this.ctx.fillText('2025', x, y - a_canvas - 2);
        }
    }

    // 星座線
    drawConstellationLines(constellations: ConstellationData[]): void {
        if (constellations.length == 0) return;
        if (!this.config.displaySettings.showConstellationLines) return;
        const fov = { ra: this.config.viewState.fieldOfViewRA, dec: this.config.viewState.fieldOfViewDec };
        const transformConfig = CoordinateConverter.chartConfigToTransformConfig(this.config, this.orientationData);
        this.ctx.strokeStyle = this.colorManager.getColor('constellationLine');
        this.ctx.lineWidth = 1;
        const precessionAngle = AstronomicalCalculator.precessionAngle('j2000', this.config.displayTime.jd);
        const maxLengthSquared = this.coordinateConverter.getMaxLineLengthSquared(this.config.canvasSize, this.config.viewState);
        this.ctx.beginPath();
        let coords1 = { ra: 0.0, dec: 0.0 };
        let coords2 = { ra: 1.0, dec: 1.0 };
        let x1 = 0.0; let y1 = 0.0;
        let x2 = 0.0; let y2 = 0.0;
        for (const constellation of constellations) {
            for (const line of constellation.lines) {
                coords1 = RaDec.precession({ ra: line[0], dec: line[1] }, precessionAngle);
                coords2 = RaDec.precession({ ra: line[2], dec: line[3] }, precessionAngle);
                [, { x: x1, y: y1 }] = RaDec.toCanvasXYifin(coords1, fov, this.config.canvasSize, transformConfig, true);
                [, { x: x2, y: y2 }] = RaDec.toCanvasXYifin(coords2, fov, this.config.canvasSize, transformConfig, true);
                if (this.coordinateConverter.shouldDrawLine(x1, y1, x2, y2, this.config.canvasSize, maxLengthSquared)) {
                    this.ctx.moveTo(x1, y1);
                    this.ctx.lineTo(x2, y2);
                }
            }
        }
        this.ctx.stroke();
    }

    writeConstellationNames(constellations: ConstellationData[]): void {
        if (constellations.length == 0) return;
        if (!this.config.displaySettings.showConstellationNames) return;
        const fov = { ra: this.config.viewState.fieldOfViewRA, dec: this.config.viewState.fieldOfViewDec };
        const transformConfig = CoordinateConverter.chartConfigToTransformConfig(this.config, this.orientationData);
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = this.colorManager.getColor('constellationName');
        const precessionAngle = AstronomicalCalculator.precessionAngle('j2000', this.config.displayTime.jd);
        for (const constellation of constellations) {
            const radec = RaDec.precession({ ra: constellation.ra, dec: constellation.dec }, precessionAngle);
            const canvasXY = RaDec.toCanvasXYifin(radec, fov, this.config.canvasSize, transformConfig);
            if (!canvasXY[0]) continue;
            const { x, y } = canvasXY[1];
            this.objectInformation.push({
                name: constellation.JPNname + '座',
                type: 'constellation',
                x: x,
                y: y,
                data: constellation
            });
            this.ctx.fillText(constellation.JPNname, x, y);
        }
    }

    drawReticle(): void {
        if (!this.config.displaySettings.showReticle) return;
        this.ctx.strokeStyle = this.colorManager.getColor('reticle');
        this.ctx.lineWidth = 1;
        const a = 20;
        const b = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, this.canvas.height / 2 - a);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height / 2 - b);
        this.ctx.moveTo(this.canvas.width / 2, this.canvas.height / 2 + a);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height / 2 + b);
        this.ctx.moveTo(this.canvas.width / 2 - a, this.canvas.height / 2);
        this.ctx.lineTo(this.canvas.width / 2 - b, this.canvas.height / 2);
        this.ctx.moveTo(this.canvas.width / 2 + a, this.canvas.height / 2);
        this.ctx.lineTo(this.canvas.width / 2 + b, this.canvas.height / 2);
        this.ctx.stroke();
    }

    drawCameraView(): void {
        if (!this.config.displaySettings.camera || this.config.displaySettings.camera == 'none') return;
        if (this.config.displaySettings.mode != 'AEP' && this.config.displaySettings.mode != 'view') return;
        const cameraSelect = document.getElementById('camera') as HTMLSelectElement;
        if (!cameraSelect) return;
        const cameraTiltSlider = document.getElementById('cameraTiltSlider') as HTMLInputElement;
        if (!cameraTiltSlider || cameraTiltSlider.style.display == 'none') return;
        const cameraView = [
            { name: '85-cmos', w: 3.34, h: 2.27 },
            { name: 'fs128-cmos', w: 1.36, h: 0.91 },
            { name: 'r200ss-cmos', w: 1.44, h: 0.99 },
        ]
        const cameraName = cameraView.find(camera => camera.name == cameraSelect.value);
        if (!cameraName) return;
        const w = cameraName.w;
        const h = cameraName.h;
        const cameraTilt = +cameraTiltSlider.value * Math.PI / 180;
        const sinCameraTilt = Math.sin(cameraTilt);
        const cosCameraTilt = Math.cos(cameraTilt);
        const w1 = w * cosCameraTilt + h * sinCameraTilt;
        const w2 = w * cosCameraTilt - h * sinCameraTilt;
        const h1 = -w * sinCameraTilt + h * cosCameraTilt;
        const h2 = -w * sinCameraTilt - h * cosCameraTilt;
        const raWidth = this.config.viewState.fieldOfViewRA;
        const decWidth = this.config.viewState.fieldOfViewDec;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        this.ctx.strokeStyle = this.colorManager.getColor('orange');
        this.ctx.fillStyle = this.colorManager.getColorWithAlpha('orange', 0.1);
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX * (1 - w1 / raWidth), centerY * (1 - h1 / decWidth));
        this.ctx.lineTo(centerX * (1 + w2 / raWidth), centerY * (1 + h2 / decWidth));
        this.ctx.lineTo(centerX * (1 + w1 / raWidth), centerY * (1 + h1 / decWidth));
        this.ctx.lineTo(centerX * (1 - w2 / raWidth), centerY * (1 - h2 / decWidth));
        this.ctx.lineTo(centerX * (1 - w1 / raWidth), centerY * (1 - h1 / decWidth));
        this.ctx.fill();
        this.ctx.stroke();
    }

    drawMilkyWay(milkyWay: number[][]): void {
        if (milkyWay.length == 0) return;
        if (Math.max(this.config.viewState.fieldOfViewRA, this.config.viewState.fieldOfViewDec) < 30) return;
        const fov = { ra: this.config.viewState.fieldOfViewRA, dec: this.config.viewState.fieldOfViewDec };
        const transformConfig = CoordinateConverter.chartConfigToTransformConfig(this.config, this.orientationData);
        const ifins: boolean[] = [];
        const screenXYs: number[][] = [];
        const precessionAngle = AstronomicalCalculator.precessionAngle('j2000', this.config.displayTime.jd);
        for (let i = 0; i < milkyWay.length; i++) {
            const radec = RaDec.precession({ ra: milkyWay[i][0], dec: milkyWay[i][1] }, precessionAngle);
            const [ifin, { x, y }] = RaDec.toCanvasXYifin(radec, fov, this.config.canvasSize, transformConfig, true);
            ifins.push(ifin);
            screenXYs.push([x, y]);
        }
        const maxLengthSquared = this.coordinateConverter.getMaxLineLengthSquared(this.config.canvasSize, this.config.viewState);
        // (ra=0, dec=55)と同じ側を塗る
        this.ctx.strokeStyle = 'rgba(106, 171, 241, 0.5)';
        this.ctx.fillStyle = 'rgba(8, 46, 87, 0.5)';
        // this.ctx.fillStyle = this.colorManager.getColorWithAlpha('orange', 0.1);
        this.ctx.setLineDash([3, 3]);
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(screenXYs[0][0], screenXYs[0][1]);
        for (let i = 1; i < screenXYs.length; i++) {
            if (this.coordinateConverter.shouldDrawLine(
                screenXYs[i - 1][0], screenXYs[i - 1][1], screenXYs[i][0], screenXYs[i][1],
                this.config.canvasSize, maxLengthSquared)
            ) {
                this.ctx.moveTo(screenXYs[i - 1][0], screenXYs[i - 1][1]);
                this.ctx.lineTo(screenXYs[i][0], screenXYs[i][1]);
            }
        }
        this.ctx.stroke();
        // this.ctx.fill();
        this.ctx.setLineDash([]);
    }

    private areaCandidates(): areaCandidatesCacheInterface | null {
        const mode0 = this.config.displaySettings.mode;
        if (mode0 != 'AEP' && mode0 != "view") return null;
        // キャッシュをチェック（設定が変更されていない場合）
        const jd = this.config.displayTime.jd;
        if (
            this.areaCandidatesCache != null &&
            Math.abs(jd - this.areaCandidatesCache.jd) < 10.0 &&
            this.areaCandidatesCache.mode == this.config.displaySettings.mode &&
            this.areaCandidatesCache.centerRa == this.config.viewState.centerRA &&
            this.areaCandidatesCache.centerDec == this.config.viewState.centerDec &&
            this.areaCandidatesCache.fovRa == this.config.viewState.fieldOfViewRA &&
            this.areaCandidatesCache.fovDec == this.config.viewState.fieldOfViewDec &&
            this.areaCandidatesCache.planet == this.config.observationSite.observerPlanet &&
            this.areaCandidatesCache.lat == this.config.observationSite.latitude &&
            this.areaCandidatesCache.lon == this.config.observationSite.longitude
        ) {
            return this.areaCandidatesCache;
        }
        const conf = CoordinateConverter.chartConfigToTransformConfig(this.config, this.orientationData);
        const areas = getAreaCandidates(this.config.viewState, jd, conf, this.ctx, this.config.canvasSize);
        const minDec = Math.floor(Math.min(...areas.map(([a, _]) => a)) / 360) - 90;
        const maxDec = Math.ceil(Math.max(...areas.map(([_, b]) => b)) / 360) - 89;
        const minRa = Math.floor(Math.min(...areas.map(([a, _]) => a)) % 360);
        const maxRa = Math.ceil(Math.max(...areas.map(([_, b]) => b)) % 360) + 1;
        // キャッシュを更新
        this.areaCandidatesCache = {
            areas: areas,
            minDec: minDec, maxDec: maxDec, minRa: minRa, maxRa: maxRa,
            jd: jd,
            mode: this.config.displaySettings.mode,
            centerRa: this.config.viewState.centerRA, centerDec: this.config.viewState.centerDec,
            fovRa: this.config.viewState.fieldOfViewRA, fovDec: this.config.viewState.fieldOfViewDec,
            planet: this.config.observationSite.observerPlanet,
            lat: this.config.observationSite.latitude, lon: this.config.observationSite.longitude,
        };
        return this.areaCandidatesCache;
    }

    getCanvasBoundingClientRect(): DOMRect {
        return this.canvas.getBoundingClientRect()
    }

    updateCanvasSize(size: CanvasSize): void {
        this.canvas.width = size.width;
        this.canvas.height = size.height;
    }

    // 描画オプションを更新
    // timeSliderが動いたときに呼び出される
    updateOptions(options: Partial<StarChartConfig>): void {
        this.updateCanvasSize(this.config.canvasSize);
        // 設定が変更されたらキャッシュをクリア
        if (options.viewState || options.displaySettings) {
            this.areaCandidatesCache = null;
            this.objectInformation = [];
        }

        // 時刻が変更されたらキャッシュをクリア
        if (options.displayTime) {
            this.hipStarRenderer.clearHipStarsCache(options.displayTime.jd);
        }
    }

    updateColorManager(): void {
        this.colorManager = getColorManager(this.config.displaySettings.darkMode);
        this.hipStarRenderer.createHipStarSprites();
        this.gaiaStarRenderer.createGaiaStarSprites();
    }

    setOrientationData(data: DeviceOrientationData): void {
        this.orientationData = data;
        this.hipStarRenderer.updateOrientationData(data);
        this.gaiaStarRenderer.updateOrientationData(data);
        this.dsoRenderer.updateOrientationData(data);
    }

    clearObjectInformation(): void {
        this.objectInformation = [];
    }

    clearStarInformation(): void {
        this.starInformation = [];
    }

    /**
     * 画面内に表示されている天体のリストを取得
     */
    getVisibleObjects(): Array<ObjectInformation> {
        return this.objectInformation;
    }

    getStarInformation(): Array<StarInformation> {
        return this.starInformation;
    }
} 