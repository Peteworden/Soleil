import { DEG_TO_RAD, RAD_TO_DEG } from '../utils/constants.js';
import { CanvasRaDec, RaDec } from '../core/coordinates/index.js';
import { TransformModeConfig, ViewState, Fov, EquatorialCoordinates, CanvasSize } from '../types/index.js';
import { AstronomicalCalculator } from '../core/calculations.js';

export function starSize_0mag(fov: Fov): number {
    return Math.max(200.0 / (Math.min(fov.ra, fov.dec) + 15), 3.0);
}

export function getStarSize(
    magnitude: number,
    limitingMagnitude: number,
    starSize_0mag: number
): number {
    if (magnitude > limitingMagnitude) {
        return 1;
    } else if (magnitude > 0) {
        return 1.0 + starSize_0mag * Math.pow((limitingMagnitude - magnitude) / limitingMagnitude, 1.6);
    } else {
        return starSize_0mag - magnitude;
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

function getAreaCandidatesFromEdge(
    edgeRA: number[],
    edgeDec: number[],
    np: boolean,
    sp: boolean,
    n85: boolean,
    s85: boolean,
): number[][] {
    // npのときは+85°以北を、spのときは-85°より南をすべて含める
    const RA_min = Math.min(...edgeRA);
    const RA_max = Math.max(...edgeRA);
    sp = sp || Math.min(...edgeDec) < -85;
    np = np || Math.max(...edgeDec) > 85;
    const Dec_min = sp ? -90 : Math.min(...edgeDec);
    const Dec_max = np ? 89.9 : Math.max(...edgeDec);
    let ra0Dec: number[] = []; // 赤経0度線を横切るときの赤緯

    // 境界線をセグメントに分割
    const segments: Array<{ ra1: number, dec1: number, ra2: number, dec2: number, crossDecs: number[] }> = [];
    for (let i = 0; i < edgeRA.length - 1; i++) {
        if (edgeRA[i] > 300 && edgeRA[i + 1] < 60) {
            ra0Dec.push(edgeDec[i] + (edgeDec[i + 1] - edgeDec[i]) / (edgeRA[i + 1] - edgeRA[i] + 360) * (360 - edgeRA[i]));
        } else if (edgeRA[i] < 60 && edgeRA[i + 1] > 300) {
            ra0Dec.push(edgeDec[i] + (edgeDec[i + 1] - edgeDec[i]) / (edgeRA[i] - edgeRA[i + 1] + 360) * edgeRA[i]);
        } else {
            segments.push({
                ra1: edgeRA[i], dec1: edgeDec[i],
                ra2: edgeRA[i + 1], dec2: edgeDec[i + 1],
                crossDecs: rangeInt(edgeDec[i], edgeDec[i + 1])
            });
        }
    }
    const edgeLastIdx = edgeRA.length - 1;
    segments.push({
        ra1: edgeRA[edgeLastIdx], dec1: edgeDec[edgeDec.length - 1],
        ra2: edgeRA[0], dec2: edgeDec[0],
        crossDecs: rangeInt(edgeDec[edgeLastIdx], edgeDec[0])
    });
    if (edgeRA[edgeLastIdx] > 300 && edgeRA[0] < 60) {
        ra0Dec.push(edgeDec[edgeLastIdx] + (edgeDec[0] - edgeDec[edgeLastIdx]) / (edgeRA[0] - edgeRA[edgeLastIdx] + 360) * (360 - edgeRA[edgeLastIdx]));
    } else if (edgeRA[edgeLastIdx] < 60 && edgeRA[0] > 300) {
        ra0Dec.push(edgeDec[edgeLastIdx] + (edgeDec[0] - edgeDec[edgeLastIdx]) / (edgeRA[edgeLastIdx] - edgeRA[0] + 360) * edgeRA[edgeLastIdx]);
    }
    if (np) {
        ra0Dec = ra0Dec.filter(dec => dec < 85);
        if (n85) {
            ra0Dec.push(85);
        }
    }
    if (sp) {
        ra0Dec = ra0Dec.filter(dec => dec > -85);
        if (s85) {
            ra0Dec.push(-85);
        }
    }
    ra0Dec.sort((a, b) => a - b);
    for (let i = 0; i < ra0Dec.length; i += 2) {
        if (ra0Dec.length >= i + 1) {
            console.log(`Invalid array length: ${ra0Dec}`);
            break;
        }
        segments.push({
            ra1: 0, dec1: ra0Dec[i],
            ra2: 0, dec2: ra0Dec[i + 1],
            crossDecs: rangeInt(ra0Dec[i], ra0Dec[i + 1])
        });
        segments.push({
            ra1: 359.999, dec1: ra0Dec[i],
            ra2: 359.999, dec2: ra0Dec[i + 1],
            crossDecs: rangeInt(ra0Dec[i], ra0Dec[i + 1])
        });
    }

    // i番目:赤緯i-90の線と境界線が交わる点の赤経
    const allIntersections: { intersections: number[] }[] = Array.from({ length: 180 }, () => ({ intersections: [] }));
    for (const segment of segments) {
        for (const dec of segment.crossDecs) {
            const t = (dec - segment.dec1) / (segment.dec2 - segment.dec1);
            let intersectionRA;
            if (segment.ra1 > 300 && segment.ra2 < 60) {
                intersectionRA = (segment.ra1 + t * (segment.ra2 - segment.ra1 + 360) + 360) % 360;
            } else if (segment.ra1 < 60 && segment.ra2 > 300) {
                intersectionRA = (segment.ra1 + t * (segment.ra2 - segment.ra1 - 360) + 360) % 360;
            } else {
                intersectionRA = segment.ra1 + t * (segment.ra2 - segment.ra1);
            }
            allIntersections[dec + 90].intersections.push(intersectionRA);
        }
    }

    const candidateAreas: number[][] = [];
    const raRanges: number[][] = [];
    if (Dec_max > 84) {
        candidateAreas.push([areaNumber(0, 85.5), areaNumber(359.9, 89.9)]);
        for (let dec = 85.5; dec <= 89.9; dec++) {
            raRanges.push([0, 359.9, dec]);
        }
    }
    if (Dec_min < -84) {
        candidateAreas.push([areaNumber(0, -89.9), areaNumber(359.9, -85.5)]);
        for (let dec = -89.9; dec <= -85.5; dec++) {
            raRanges.push([0, 359.9, dec]);
        }
    }
    // 赤緯1度ごとに
    for (let dec = (sp ? -85 : Math.floor(Dec_min)); dec <= (np ? 84 : Math.floor(Dec_max)); dec++) {
        const intersections: number[] = allIntersections[dec + 90].intersections;
        intersections.sort((a, b) => a - b);
        // let count = 0;

        // 交点のペアで領域を決定
        if (intersections.length === 0) {
            // この場合はないはずだがある
            // 交点がない場合は範囲全体を含める
            if (RA_max > 300 && RA_min < 60) {
                raRanges.push([0, Math.min(RA_min, 359.9), dec]);
                raRanges.push([Math.max(RA_max, 0), 359.9, dec]);
                candidateAreas.push(areaNumberRange(0, Math.min(RA_min, 359.9), dec));
                candidateAreas.push(areaNumberRange(Math.max(RA_max, 0), 359.9, dec));
            } else {
                raRanges.push([Math.max(RA_min, 0), Math.min(RA_max, 359.9), dec]);
                candidateAreas.push(areaNumberRange(Math.max(RA_min, 0), Math.min(RA_max, 359.9), dec));
            }
        } else {
            // console.log(dec, intersections.length, intersections);
            for (let i = 0; i < intersections.length - 1; i += 2) {
                const startRA = Math.max(intersections[i], 0);
                const endRA = Math.min(intersections[i + 1], 359.9);
                if (startRA < endRA) {
                    raRanges.push([startRA, endRA, dec]);
                    candidateAreas.push(areaNumberRange(startRA, endRA, dec));
                    // count++;
                }
            }
        }
    }
    return candidateAreas;
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
    const J2000NorthPoleApparent = RaDec.precession({ ra: 0, dec: 90 }, undefined, 'j2000', jd);
    const J2000N85Apparent = RaDec.precession({ ra: 0, dec: 85 }, undefined, 'j2000', jd);
    const J2000S85Apparent = RaDec.precession({ ra: 0, dec: -85 }, undefined, 'j2000', jd);
    const J2000SouthPoleApparent = RaDec.precession({ ra: 0, dec: -90 }, undefined, 'j2000', jd);
    const npCanvasRadec = RaDec.toCanvasRadec(J2000NorthPoleApparent, conf);
    const n85CanvasRadec = RaDec.toCanvasRadec(J2000N85Apparent, conf);
    const s85CanvasRadec = RaDec.toCanvasRadec(J2000S85Apparent, conf);
    const spCanvasRadec = RaDec.toCanvasRadec(J2000SouthPoleApparent, conf);

    const margin = 0.0;
    const raWidth = viewState.fov.ra * 0.5 + margin;
    const decWidth = viewState.fov.dec * 0.5 + margin;
    const npIsIn = Math.abs(npCanvasRadec.ra) < raWidth && Math.abs(npCanvasRadec.dec) < decWidth;
    const spIsIn = Math.abs(spCanvasRadec.ra) < raWidth && Math.abs(spCanvasRadec.dec) < decWidth;
    const n85IsIn = Math.abs(n85CanvasRadec.ra) < raWidth && Math.abs(n85CanvasRadec.dec) < decWidth;
    const s85IsIn = Math.abs(s85CanvasRadec.ra) < raWidth && Math.abs(s85CanvasRadec.dec) < decWidth;

    let screenRa = -raWidth;
    let screenDec = decWidth;
    let dscreenRa = 0.0;
    let dscreenDec = 0.0;
    let edgePointRadec: EquatorialCoordinates;

    let precessionAngle = AstronomicalCalculator.precessionAngle(jd, 'j2000');
    let sinPrecess = Math.sin(precessionAngle);
    let cosPrecess = Math.cos(precessionAngle);

    // 天球全体が見えるときの処理はごまかしているかも

    //右上から左上
    while (screenRa < raWidth) {
        addEdge(screenRa, screenDec, edgeRA, edgeDec, sinPrecess, cosPrecess, conf);
        edgePointRadec = CanvasRaDec.toRaDec({ ra: screenRa, dec: screenDec }, conf);
        dscreenRa = 0.3 * Math.max(Math.cos(edgePointRadec.dec * Math.PI / 180), 0.01);
        screenRa += dscreenRa;
    }
    //左上から左下
    screenRa = raWidth;
    screenDec = decWidth;
    while (screenDec > -decWidth) {
        addEdge(screenRa, screenDec, edgeRA, edgeDec, sinPrecess, cosPrecess, conf);
        edgePointRadec = CanvasRaDec.toRaDec({ ra: screenRa, dec: screenDec }, conf);
        dscreenDec = 0.3 * Math.max(Math.cos(edgePointRadec.dec * Math.PI / 180), 0.01);
        screenDec -= dscreenDec;
    }
    //左下から右下
    screenRa = raWidth;
    screenDec = -decWidth;
    while (screenRa > -raWidth) {
        addEdge(screenRa, screenDec, edgeRA, edgeDec, sinPrecess, cosPrecess, conf);
        edgePointRadec = CanvasRaDec.toRaDec({ ra: screenRa, dec: screenDec }, conf);
        dscreenRa = 0.3 * Math.max(Math.cos(edgePointRadec.dec * Math.PI / 180), 0.01);
        screenRa -= dscreenRa;
    }
    //右下から右上
    screenRa = -raWidth;
    screenDec = -decWidth;
    while (screenDec < decWidth) {
        addEdge(screenRa, screenDec, edgeRA, edgeDec, sinPrecess, cosPrecess, conf);
        edgePointRadec = CanvasRaDec.toRaDec({ ra: screenRa, dec: screenDec }, conf);
        dscreenDec = 0.3 * Math.max(Math.cos(edgePointRadec.dec * Math.PI / 180), 0.01);
        screenDec += dscreenDec;
    }

    return getAreaCandidatesFromEdge(edgeRA, edgeDec, npIsIn, spIsIn, n85IsIn, s85IsIn);
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