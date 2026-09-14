import { DEG_TO_RAD, RAD_TO_DEG } from '../utils/constants.js';
import { CanvasRaDec, RaDec } from '../core/coordinates/index.js';
import { TransformModeConfig, ViewState, Fov, EquatorialCoordinates, CanvasSize, ConstellationData } from '../types/index.js';
import { AstronomicalCalculator } from '../core/calculations.js';

// バグがあったらここにその状態のリンクを貼る
// https://peteworden.github.io/Soleil/chart.html?ra=28.486&dec=56.473&lat=35.03&lon=135.78&time=20260720-124312&fov=36.97
// https://peteworden.github.io/Soleil/chart.html?ra=30.168&dec=55.449&lat=35.03&lon=135.78&time=20260720-124312&fov=71.8

export function starSize_0mag(fov: Fov): number {
    return Math.max(200.0 / (Math.min(fov.ra, fov.dec) + 15), 3.0);
}

export function getStarSize(
    mag: number,
    limMag: number,
    zeroMagSize: number
): number {
    if (mag > limMag) {
        return 1;
    } else {
        return Math.min(15, Math.pow(zeroMagSize, -(mag - limMag) / limMag) + 3 - 2 * Math.atan(2.0 * (mag - 0.2 * limMag)));
    }
}

export function ifDrawConstellation(constellation: ConstellationData, fov: Fov): boolean {
    const minFov = Math.min(fov.ra, fov.dec);
    if (constellation.tier == 1) {
        return true;
    } else if (constellation.tier == 2) {
        return minFov < 70;
    } else {
        return minFov < 50;
    }
}

function areaNumber(ra: number, dec: number): number {
    return 360 * Math.floor(dec + 90) + Math.floor(ra);
}

function areaNumberRange(ra1: number, ra2: number, dec: number): number[] {
    const startArea = areaNumber(ra1, dec);
    const endArea = areaNumber(ra2, dec);
    return [startArea, endArea];
}

/**
 * 小さい方以上大きい方以下の整数を返す
 */
function rangeInt(a: number, b: number): number[] {
    const start = Math.ceil(Math.min(a, b));
    const end = Math.floor(Math.max(a, b));
    if (end < start) return [];
    const length = end - start + 1;
    const result = new Array(length);
    for (let i = 0; i < length; i++) {
        result[i] = start + i;
    }
    return result;

}

function addEdge(
    screenRA: number, screenDec: number,
    edgeRA: number[], edgeDec: number[],
    sinPrecess: number,
    cosPrecess: number,
    conf: TransformModeConfig
): void {
    const radecApp = CanvasRaDec.toRaDec({ ra: screenRA, dec: screenDec }, conf);
    const radec = RaDec.precessionFast({ ra: radecApp.ra * DEG_TO_RAD, dec: radecApp.dec * DEG_TO_RAD }, sinPrecess, cosPrecess);
    edgeRA.push((radec.ra * RAD_TO_DEG + 360) % 360);
    edgeDec.push(radec.dec * RAD_TO_DEG);
}

export function getAreaCandidates(
    viewState: ViewState,
    jd: number,
    conf: TransformModeConfig,
    ctx: CanvasRenderingContext2D,
    canvasSize: CanvasSize
): number[][] {
    if (!['AEP', 'view'].includes(conf.mode)) return [];

    const edgeRA: number[] = [];
    const edgeDec: number[] = [];

    const margin = 1.5;
    const poleArea = 4.0;
    const poleMargin = 3.0;

    const raWidth = viewState.fov.ra * 0.5 + margin;
    const decWidth = viewState.fov.dec * 0.5 + margin;

    const J2000NorthPoleApparent = RaDec.precession({ ra: 0, dec: 90 }, undefined, 'j2000', jd);
    const J2000SouthPoleApparent = RaDec.precession({ ra: 0, dec: -90 }, undefined, 'j2000', jd);

    const northPoleCanvasRaDec = RaDec.toCanvasRadec(J2000NorthPoleApparent, conf);
    const southPoleCanvasRaDec = RaDec.toCanvasRadec(J2000SouthPoleApparent, conf);

    let npIsIn =
        Math.abs(northPoleCanvasRaDec.ra) < raWidth + poleMargin &&
        Math.abs(northPoleCanvasRaDec.dec) < decWidth + poleMargin;

    let spIsIn =
        Math.abs(southPoleCanvasRaDec.ra) < raWidth + poleMargin &&
        Math.abs(southPoleCanvasRaDec.dec) < decWidth + poleMargin;

    // deg
    let screenRa = -raWidth;
    let screenDec = decWidth;
    let dscreenRa = 0.3;
    let dscreenDec = 0.3;

    const precessionAngle = AstronomicalCalculator.precessionAngle(jd, 'j2000');
    const sinPrecess = Math.sin(precessionAngle);
    const cosPrecess = Math.cos(precessionAngle);

    // 右上から左上
    while (screenRa < raWidth) {
        addEdge(screenRa, screenDec, edgeRA, edgeDec, sinPrecess, cosPrecess, conf);
        const edgePointRadec = CanvasRaDec.toRaDec({ ra: screenRa, dec: screenDec }, conf);
        dscreenRa = 0.3 * Math.max(Math.cos(edgePointRadec.dec * Math.PI / 180), 0.01);
        screenRa += dscreenRa;
    }

    // 左上から左下
    screenRa = raWidth;
    screenDec = decWidth;
    while (screenDec > -decWidth) {
        addEdge(screenRa, screenDec, edgeRA, edgeDec, sinPrecess, cosPrecess, conf);
        screenDec -= dscreenDec;
    }

    // 左下から右下
    screenRa = raWidth;
    screenDec = -decWidth;
    while (screenRa > -raWidth) {
        addEdge(screenRa, screenDec, edgeRA, edgeDec, sinPrecess, cosPrecess, conf);
        const edgePointRadec = CanvasRaDec.toRaDec({ ra: screenRa, dec: screenDec }, conf);
        dscreenRa = 0.3 * Math.max(Math.cos(edgePointRadec.dec * Math.PI / 180), 0.01);
        screenRa -= dscreenRa;
    }

    // 右下から右上
    screenRa = -raWidth;
    screenDec = -decWidth;
    while (screenDec < decWidth) {
        addEdge(screenRa, screenDec, edgeRA, edgeDec, sinPrecess, cosPrecess, conf);
        screenDec += dscreenDec;
    }

    // --------------------------------------------------
    // ここから境界線からareaを作る
    // --------------------------------------------------

    if (edgeRA.length !== edgeDec.length) {
        throw new Error('edgeRA and edgeDec must have the same length.');
    }

    if (edgeRA.length === 0) return [];
    const len = edgeRA.length;

    const rawDecMin = Math.min(...edgeDec);
    const rawDecMax = Math.max(...edgeDec);

    npIsIn = npIsIn || rawDecMax > 90.0 - poleArea;
    spIsIn = spIsIn || rawDecMin < -90.0 + poleArea;

    // 赤経0度線を横切るときの赤緯
    let ra0Dec: number[] = [];

    // dec + 90 番目：
    // 赤緯dec°線と境界線の交点の赤経
    const allIntersections: number[][] = Array.from({ length: 180 }, () => []);

    for (let i = 0; i < len; i++) {
        const ra1 = edgeRA[i];
        const dec1 = edgeDec[i];
        const ra2 = edgeRA[(i + 1) % len];
        const dec2 = edgeDec[(i + 1) % len];

        // aの方がbより南
        let raa = ra1, deca = dec1;
        let rab = ra2, decb = dec2;
        if (dec2 < dec1) {
            raa = ra2; deca = dec2;
            rab = ra1; decb = dec1;
        }

        const crossDec = rangeInt(dec1, dec2);

        if (raa > 300 && rab < 60) {
            const d0 = deca + (decb - deca) / (ra2 - ra1 + 360) * (360 - ra1);
            ra0Dec.push(d0);
            for (const dec of crossDec) {
                if (dec < d0) {
                    allIntersections[dec + 90].push(raa + (rab + 360 - raa) / (decb - deca) * (dec - deca));
                } else {
                    allIntersections[dec + 90].push(rab - (rab + 360 - raa) / (decb - deca) * (decb - dec));
                }
            }
        } else if (raa < 60 && rab > 300) {
            const d0 = deca + (decb - deca) / (ra1 - ra2 + 360) * ra1;
            ra0Dec.push(d0);
            for (const dec of crossDec) {
                if (dec < d0) {
                    allIntersections[dec + 90].push(raa - (raa + 360 - rab) / (decb - deca) * (dec - deca));
                } else {
                    allIntersections[dec + 90].push(rab + (raa + 360 - rab) / (decb - deca) * (decb - dec));
                }
            }
        } else {
            for (const dec of crossDec) {
                allIntersections[dec + 90].push(raa + (rab - raa) / (decb - deca) * (dec - deca));
            }
        }
    }

    if (npIsIn) {
        ra0Dec.push(90 - poleArea - 1);
        ra0Dec = ra0Dec.filter(dec => dec <= 90 - poleArea);
        for (let i = 180 - Math.floor(poleArea); i < 180; i++) {
            allIntersections[i] = [0, 360];
        }
    }

    if (spIsIn) {
        ra0Dec.push(-90 + poleArea);
        ra0Dec = ra0Dec.filter(dec => dec >= -90 + poleArea);
        for (let i = 0; i < Math.ceil(poleArea); i++) {
            allIntersections[i] = [0, 360];
        }
    }

    if (ra0Dec.length > 0) {
        ra0Dec.sort((a, b) => a - b);
        const ra0DecNegNum = ra0Dec.filter(d => d < 0).length;
        const [originIsIn, _] = RaDec.toCanvasXYifin({ ra: 0, dec: 0 }, viewState.fov, canvasSize, conf, false, margin);
        const startIndex = originIsIn ? (ra0DecNegNum + 1) % 2 : ra0DecNegNum % 2;
        for (let i = startIndex; i < ra0Dec.length - 1; i++) {
            const crossDec = rangeInt(ra0Dec[i], ra0Dec[i + 1]);
            for (const d of crossDec) {
                allIntersections[d + 90].push(0, 360);
            }
        }
    }

    const area: number[][] = [];

    if (npIsIn) {
        area.push([
            areaNumber(0, Math.min(90 - poleArea, Math.ceil(rawDecMax))),
            areaNumber(359.9, 89.9),
        ]);
    }
    if (spIsIn) {
        area.push([
            areaNumber(0, -90),
            areaNumber(359.9, Math.max(-90 + poleArea - 0.1, Math.floor(rawDecMin))),
        ]);
    }

    const decStart = Math.max(Math.floor(rawDecMin), -90 + (spIsIn ? Math.ceil(poleArea) : 0));
    const decEnd = Math.min(Math.ceil(rawDecMax), 90 - (npIsIn ? Math.ceil(poleArea) : 0));
    for (let dec = decStart; dec < decEnd; dec++) {
        const intersections = allIntersections[dec + 90];

        if (intersections.length > 0) {
            intersections.sort((a, b) => a - b);

            let longestRaStrokeIndex = 0;
            let longestRaStroke = 0;
            for (let i = 0; i < intersections.length - 1; i++) {
                const raStroke = intersections[(i + 1) % intersections.length] - intersections[i];
                if (raStroke > longestRaStroke) {
                    longestRaStrokeIndex = i;
                    longestRaStroke = raStroke;
                }
            }

            const midRa = (intersections[longestRaStrokeIndex] + intersections[longestRaStrokeIndex + 1]) / 2;
            const [midIsIn, _] = RaDec.toCanvasXYifin({ ra: midRa, dec: dec }, viewState.fov, canvasSize, conf, false, margin);
            const start = (midIsIn == (longestRaStrokeIndex % 2 == 0)) ? 0 : 1;
            for (let i = start; i < intersections.length - 1; i += 2) {
                area.push(areaNumberRange(intersections[i], intersections[i + 1], dec));
            }
        }
    }
    return area;
}

export function getGridIntervals(
    fov: Fov,
    alpha: number,
    beta: number
): number[] {
    const gridIntervalList: number[] = [0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 45.0];
    let betaCalcInterval = Math.min(fov.ra, fov.dec) / 30;
    let alphaCalcInterval = Math.min(betaCalcInterval / Math.max(Math.cos(beta * Math.PI / 180), 0.1), 8);
    let betaInterval = 45.0;
    for (const interval of gridIntervalList) {
        if (interval > Math.min(fov.ra, fov.dec) / 4) {
            betaInterval = interval;
            break;
        }
    }
    let alphaInterval = 45.0;
    for (const interval of gridIntervalList) {
        if (interval > betaInterval / Math.cos(beta * Math.PI / 180)) {
            alphaInterval = interval;
            break;
        }
    }
    // alphaInterval = 1.0;
    // betaInterval = 1.0;
    return [alphaInterval, betaInterval, alphaCalcInterval, betaCalcInterval];
}

export function getBetaRange(
    fov: Fov,
    config: TransformModeConfig,
): number[] {
    let maxBeta = 90;
    let minBeta = -90;
    if (config.mode == 'AEP') {
        maxBeta = Math.min(
            90,
            Math.max(
                config.center.dec + fov.dec / 2,
                CanvasRaDec.toRaDec({ ra: fov.ra / 2, dec: fov.dec / 2 }, config).dec
            )
        );
        minBeta = Math.max(
            -90,
            Math.min(
                config.center.dec - fov.dec / 2,
                CanvasRaDec.toRaDec({ ra: fov.ra / 2, dec: -fov.dec / 2 }, config).dec
            )
        );
    } else if (config.mode == 'view') {
        maxBeta = Math.min(
            90,
            Math.max(
                config.center.alt + fov.dec / 2,
                CanvasRaDec.toAzAlt({ ra: fov.ra / 2, dec: fov.dec / 2 }, config).alt
            )
        );
        minBeta = Math.max(
            -90,
            Math.min(config.center.alt - fov.dec / 2,
                CanvasRaDec.toAzAlt({ ra: fov.ra / 2, dec: -fov.dec / 2 }, config).alt
            )
        );
    } else {
        return [0, 0];
    }
    return [minBeta, maxBeta];
}

export function getGridLineWidth(beta: number): number {
    if (beta == 0.0) return 3;
    else return 1;
}

export function getAlphaRange(
    fov: Fov,
    alpha: number,
    config: TransformModeConfig,
): number {
    if (config.mode == 'AEP') {
        return Math.max(
            (CanvasRaDec.toRaDec({ ra: fov.ra / 2, dec: fov.dec / 2 }, config).ra - alpha + 360.0) % 360.0,
            (CanvasRaDec.toRaDec({ ra: fov.ra / 2, dec: 0.0 }, config).ra - alpha + 360.0) % 360.0,
            (CanvasRaDec.toRaDec({ ra: fov.ra / 2, dec: -fov.dec / 2 }, config).ra - alpha + 360.0) % 360.0,
        );
    } else if (config.mode == 'view') {
        return Math.max(
            (CanvasRaDec.toAzAlt({ ra: -fov.ra / 2, dec: fov.dec / 2 }, config).az - alpha + 360.0) % 360.0,
            (CanvasRaDec.toAzAlt({ ra: -fov.ra / 2, dec: 0.0 }, config).az - alpha + 360.0) % 360.0,
            (CanvasRaDec.toAzAlt({ ra: -fov.ra / 2, dec: -fov.dec / 2 }, config).az - alpha + 360.0) % 360.0,
        );
    } else {
        return 0;
    }
}