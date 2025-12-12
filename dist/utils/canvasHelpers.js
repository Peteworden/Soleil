export function starSize_0mag(fieldOfViewRA, fieldOfViewDec) {
    return Math.max(200.0 / (Math.min(fieldOfViewRA, fieldOfViewDec) + 15), 2.0);
}
export function getStarSize(magnitude, limitingMagnitude, starSize_0mag) {
    if (magnitude > limitingMagnitude) {
        return 1;
    }
    else if (magnitude > 0) {
        return 1.0 + starSize_0mag * Math.pow((limitingMagnitude - magnitude) / limitingMagnitude, 1.6);
    }
    else {
        return starSize_0mag - magnitude;
    }
}
export function areaNumber(ra, dec) {
    return Math.floor(360 * Math.floor(dec + 90) + Math.floor(ra));
}
export function areaNumberRange(ra1, ra2, dec) {
    const startArea = areaNumber(ra1, dec);
    const endArea = areaNumber(ra2, dec);
    return [startArea, endArea];
}
/**
 * 小さい方以上大きい方以下の整数を返す
 */
export function rangeInt(a, b) {
    const c = a > b ? a : b; // 大きい方
    const d = a > b ? b : a; // 小さい方
    const start = Math.ceil(d); // 小さい方の切り上げ
    const end = Math.floor(c); // 大きい方の切り下げ
    if (end < start)
        return [];
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
export function addEdge(lstLat, screenRA, screenDec, edgeRA, edgeDec, jd, coordinateConverter, mode) {
    const equatorialApparent = coordinateConverter.screenRaDecToEquatorial(lstLat, { ra: screenRA, dec: screenDec }, mode, undefined);
    const equatorial = coordinateConverter.precessionEquatorial(equatorialApparent, undefined, jd, 'j2000');
    edgeRA.push(equatorial.ra);
    edgeDec.push(equatorial.dec);
}
export function getAreaCandidatesFromEdge(edgeRA, edgeDec, np, sp) {
    // npのときは+85°以北を、spのときは-85°より南をすべて含める
    const RA_min = Math.min(...edgeRA);
    const RA_max = Math.max(...edgeRA);
    const Dec_min = sp ? -90 : Math.min(...edgeDec);
    const Dec_max = np ? 89.9 : Math.max(...edgeDec);
    let ra0Dec = []; // 赤経0度線を横切るときの赤緯
    // 境界線をセグメントに分割
    const segments = [];
    for (let i = 0; i < edgeRA.length - 1; i++) {
        segments.push({
            ra1: edgeRA[i], dec1: edgeDec[i],
            ra2: edgeRA[i + 1], dec2: edgeDec[i + 1],
            crossDecs: rangeInt(edgeDec[i], edgeDec[i + 1])
        });
        if (edgeRA[i] > 300 && edgeRA[i + 1] < 60) {
            ra0Dec.push(edgeDec[i] + (edgeDec[i + 1] - edgeDec[i]) / (edgeRA[i + 1] - edgeRA[i] + 360) * (360 - edgeRA[i]));
        }
        else if (edgeRA[i] < 60 && edgeRA[i + 1] > 300) {
            ra0Dec.push(edgeDec[i] + (edgeDec[i + 1] - edgeDec[i]) / (edgeRA[i] - edgeRA[i + 1] + 360) * edgeRA[i]);
        }
    }
    segments.push({
        ra1: edgeRA[edgeRA.length - 1], dec1: edgeDec[edgeDec.length - 1],
        ra2: edgeRA[0], dec2: edgeDec[0],
        crossDecs: rangeInt(edgeDec[edgeRA.length - 1], edgeDec[0])
    });
    if (edgeRA[edgeRA.length - 1] > 300 && edgeRA[0] < 60) {
        ra0Dec.push(edgeDec[edgeRA.length - 1] + (edgeDec[0] - edgeDec[edgeRA.length - 1]) / (edgeRA[0] - edgeRA[edgeRA.length - 1] + 360) * (360 - edgeRA[edgeRA.length - 1]));
    }
    else if (edgeRA[edgeRA.length - 1] < 60 && edgeRA[0] > 300) {
        ra0Dec.push(edgeDec[edgeRA.length - 1] + (edgeDec[0] - edgeDec[edgeRA.length - 1]) / (edgeRA[edgeRA.length - 1] - edgeRA[0] + 360) * edgeRA[edgeRA.length - 1]);
    }
    if (np) {
        ra0Dec.push(85);
        ra0Dec = ra0Dec.filter(dec => dec <= 85);
    }
    if (sp) {
        ra0Dec.push(-85);
        ra0Dec = ra0Dec.filter(dec => dec >= -85);
    }
    ra0Dec.sort((a, b) => a - b);
    for (let i = 0; i < ra0Dec.length; i += 2) {
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
    const allIntersections = Array.from({ length: 180 }, () => ({ intersections: [] }));
    for (const segment of segments) {
        for (const dec of segment.crossDecs) {
            const t = (dec - segment.dec1) / (segment.dec2 - segment.dec1);
            let intersectionRA;
            if (segment.ra1 > 300 && segment.ra2 < 60) {
                intersectionRA = (segment.ra1 + t * (segment.ra2 - segment.ra1 + 360) + 360) % 360;
            }
            else if (segment.ra1 < 60 && segment.ra2 > 300) {
                intersectionRA = (segment.ra1 + t * (segment.ra2 - segment.ra1 - 360) + 360) % 360;
            }
            else {
                intersectionRA = segment.ra1 + t * (segment.ra2 - segment.ra1);
            }
            allIntersections[dec + 90].intersections.push(intersectionRA);
        }
    }
    const candidateAreas = [];
    const raRanges = [];
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
        const intersections = allIntersections[dec + 90].intersections;
        intersections.sort((a, b) => a - b);
        let count = 0;
        // 交点のペアで領域を決定
        if (intersections.length === 0) {
            // この場合はないはずだがある
            // 交点がない場合は範囲全体を含める
            if (RA_max > 300 && RA_min < 60) {
                raRanges.push([0, Math.min(RA_min, 359.9), dec]);
                raRanges.push([Math.max(RA_max, 0), 359.9, dec]);
                candidateAreas.push(areaNumberRange(0, Math.min(RA_min, 359.9), dec));
                candidateAreas.push(areaNumberRange(Math.max(RA_max, 0), 359.9, dec));
            }
            else {
                raRanges.push([Math.max(RA_min, 0), Math.min(RA_max, 359.9), dec]);
                candidateAreas.push(areaNumberRange(Math.max(RA_min, 0), Math.min(RA_max, 359.9), dec));
            }
        }
        else {
            // console.log(dec, intersections.length, intersections);
            for (let i = 0; i < intersections.length - 1; i += 2) {
                const startRA = Math.max(intersections[i], 0);
                const endRA = Math.min(intersections[i + 1], 359.9);
                if (startRA < endRA) {
                    raRanges.push([startRA, endRA, dec]);
                    candidateAreas.push(areaNumberRange(startRA, endRA, dec));
                    count++;
                }
            }
        }
    }
    return candidateAreas;
}
export function getAreaCandidates(lstLat, viewState, jd, mode, coordinateConverter) {
    if (!['AEP', 'view'].includes(mode))
        return [];
    const edgeRA = [];
    const edgeDec = [];
    const raWidth = viewState.fieldOfViewRA * 0.5 + 1.0;
    const decWidth = viewState.fieldOfViewDec * 0.5 + 1.0;
    const currentNorthPoleJ2000 = coordinateConverter.precessionEquatorial({ ra: 0, dec: 90 }, undefined, jd, 'j2000');
    const currentSouthPoleJ2000 = coordinateConverter.precessionEquatorial({ ra: 0, dec: -90 }, undefined, jd, 'j2000');
    const npScreenRaDec = coordinateConverter.equatorialToScrenRaDec(currentNorthPoleJ2000, mode, lstLat, viewState, undefined);
    const spScreenRaDec = coordinateConverter.equatorialToScrenRaDec(currentSouthPoleJ2000, mode, lstLat, viewState, undefined);
    const npIsIn = Math.abs(npScreenRaDec.ra) < raWidth + 3.0 && Math.abs(npScreenRaDec.dec) < decWidth + 3.0;
    const spIsIn = Math.abs(spScreenRaDec.ra) < raWidth + 3.0 && Math.abs(spScreenRaDec.dec) < decWidth + 3.0;
    let screenRa = -raWidth;
    let screenDec = decWidth;
    let dscreenRa = 0.0;
    let dscreenDec = 0.0;
    //右上から左上
    while (screenRa < raWidth) {
        addEdge(lstLat, screenRa, screenDec, edgeRA, edgeDec, jd, coordinateConverter, mode);
        dscreenRa = 0.3 * Math.cos(coordinateConverter.screenRaDecToEquatorial(lstLat, { ra: screenRa, dec: screenDec }, mode, undefined).dec * Math.PI / 180);
        screenRa += dscreenRa;
    }
    //左上から左下
    screenRa = raWidth;
    screenDec = decWidth;
    while (screenDec > -decWidth) {
        addEdge(lstLat, screenRa, screenDec, edgeRA, edgeDec, jd, coordinateConverter, mode);
        dscreenDec = 0.3 * Math.cos(coordinateConverter.screenRaDecToEquatorial(lstLat, { ra: screenRa, dec: screenDec }, mode, undefined).dec * Math.PI / 180);
        screenDec -= dscreenDec;
    }
    //左下から右下
    screenRa = raWidth;
    screenDec = -decWidth;
    while (screenRa > -raWidth) {
        addEdge(lstLat, screenRa, screenDec, edgeRA, edgeDec, jd, coordinateConverter, mode);
        dscreenRa = 0.3 * Math.cos(coordinateConverter.screenRaDecToEquatorial(lstLat, { ra: screenRa, dec: screenDec }, mode, undefined).dec * Math.PI / 180);
        screenRa -= dscreenRa;
    }
    //右下から右上
    screenRa = -raWidth;
    screenDec = -decWidth;
    while (screenDec < decWidth) {
        addEdge(lstLat, screenRa, screenDec, edgeRA, edgeDec, jd, coordinateConverter, mode);
        dscreenDec = 0.3 * Math.cos(coordinateConverter.screenRaDecToEquatorial(lstLat, { ra: screenRa, dec: screenDec }, mode, undefined).dec * Math.PI / 180);
        screenDec += dscreenDec;
    }
    return getAreaCandidatesFromEdge(edgeRA, edgeDec, npIsIn, spIsIn);
}
export function getGridIntervals(fieldOfViewRA, fieldOfViewDec, alpha, beta) {
    const gridIntervalList = [0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 45.0];
    let betaCalcInterval = Math.min(fieldOfViewDec, fieldOfViewRA) / 30;
    let alphaCalcInterval = Math.min(betaCalcInterval / Math.max(Math.cos(beta * Math.PI / 180), 0.1), 8);
    let betaInterval = 45.0;
    for (const interval of gridIntervalList) {
        if (interval > Math.min(fieldOfViewDec, fieldOfViewRA) / 4) {
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
export function getBetaRange(lstLat, fieldOfViewRA, fieldOfViewDec, centerRA, centerDec, centerAz, centerAlt, mode, coordinateConverter, orientationData) {
    let maxBeta = 90;
    let minBeta = -90;
    if (mode == 'AEP') {
        maxBeta = Math.min(90, Math.max(centerDec + fieldOfViewDec / 2, coordinateConverter.screenRaDecToEquatorial(lstLat, { ra: fieldOfViewRA / 2, dec: fieldOfViewDec / 2 }, mode, undefined).dec));
        minBeta = Math.max(-90, Math.min(centerDec - fieldOfViewDec / 2, coordinateConverter.screenRaDecToEquatorial(lstLat, { ra: fieldOfViewRA / 2, dec: -fieldOfViewDec / 2 }, mode, undefined).dec));
    }
    else if (mode == 'view') {
        maxBeta = Math.min(90, Math.max(centerAlt + fieldOfViewDec / 2, coordinateConverter.screenRaDecToHorizontal(lstLat, { ra: fieldOfViewRA / 2, dec: fieldOfViewDec / 2 }, mode, undefined).alt));
        minBeta = Math.max(-90, Math.min(centerAlt - fieldOfViewDec / 2, coordinateConverter.screenRaDecToHorizontal(lstLat, { ra: fieldOfViewRA / 2, dec: -fieldOfViewDec / 2 }, mode, undefined).alt));
    }
    else {
        return [0, 0];
    }
    return [minBeta, maxBeta];
}
export function getGridLineWidth(beta) {
    if (beta == 0.0)
        return 3;
    else
        return 1;
}
export function getAlphaRange(lstLat, fieldOfViewRA, fieldOfViewDec, alpha, mode, coordinateConverter, orientationData) {
    if (mode == 'AEP') {
        return Math.max((coordinateConverter.screenRaDecToEquatorial(lstLat, { ra: fieldOfViewRA / 2, dec: fieldOfViewDec / 2 }, mode).ra - alpha + 360.0) % 360, (coordinateConverter.screenRaDecToEquatorial(lstLat, { ra: fieldOfViewRA / 2, dec: 0.0 }, mode).ra - alpha + 360.0) % 360, (coordinateConverter.screenRaDecToEquatorial(lstLat, { ra: fieldOfViewRA / 2, dec: -fieldOfViewDec / 2 }, mode).ra - alpha + 360.0) % 360);
    }
    else if (mode == 'view') {
        return Math.max((coordinateConverter.screenRaDecToHorizontal(lstLat, { ra: -fieldOfViewRA / 2, dec: fieldOfViewDec / 2 }, mode, undefined).az - alpha + 360.0) % 360, (coordinateConverter.screenRaDecToHorizontal(lstLat, { ra: -fieldOfViewRA / 2, dec: 0.0 }, mode, undefined).az - alpha + 360.0) % 360, (coordinateConverter.screenRaDecToHorizontal(lstLat, { ra: -fieldOfViewRA / 2, dec: -fieldOfViewDec / 2 }, mode, undefined).az - alpha + 360.0) % 360);
    }
    else {
        return 0;
    }
}
//# sourceMappingURL=canvasHelpers.js.map