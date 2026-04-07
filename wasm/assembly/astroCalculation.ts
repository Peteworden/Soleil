

const DEG_TO_RAD: f64 = Math.PI / 180;
const RAD_TO_DEG: f64 = 180 / Math.PI;

// wasm/assembly/astroCalculation.ts
export function allocF64Array(n: i32): usize {
    const size = n * 8;
    const ptr = heap.alloc(size + 7); // Allocate extra for alignment
    // Align to 8-byte boundary for f64
    return (ptr + 7) & ~7;
}

function asindeg(a: f64): f64 {
    if (a > 1) return 90;
    else if (a < -1) return -90;
    else return Math.asin(a) * RAD_TO_DEG;
}

function acosdeg(a: f64): f64 {
    if (a > 1) return 0;
    else if (a < -1) return 180;
    else return Math.acos(a) * RAD_TO_DEG;
}

export function wasmEquatorialToHorizontal(
    lst: f64, lat: f64, raArray: usize, decArray: usize, n: i32, result: usize
): void{
    const sinLat = Math.sin(lat * DEG_TO_RAD);
    const cosLat = Math.cos(lat * DEG_TO_RAD);
    for (let i = 0; i < n; i++) {
        const ra = load<f64>(raArray + i * sizeof<f64>()) * DEG_TO_RAD;
        const dec = load<f64>(decArray + i * sizeof<f64>()) * DEG_TO_RAD;
        const sinDec = Math.sin(dec);
        const cosDec = Math.cos(dec);
        const sinHa = Math.sin(lst - ra);
        const cosHa = Math.cos(lst - ra);
        const x = cosLat * sinDec - sinLat * cosDec * cosHa;
        const y = -cosDec * sinHa;
        const z = sinLat * sinDec + cosLat * cosDec * cosHa;
        const az = (Math.atan2(y, x) * RAD_TO_DEG + 360) % 360;
        const alt = asindeg(z);
        store<f64>(result + (i * 2    ) * sizeof<f64>(), az);
        store<f64>(result + (i * 2 + 1) * sizeof<f64>(), alt);
    }
}

export function wasmEquatorialToHorizontalSingle(
    lst: f64, lat: f64, ra: f64, dec: f64, result: usize
): void{
    const sinLat = Math.sin(lat * DEG_TO_RAD);
    const cosLat = Math.cos(lat * DEG_TO_RAD);
    const sinDec = Math.sin(dec);
    const cosDec = Math.cos(dec);
    const sinHa = Math.sin(lst - ra);
    const cosHa = Math.cos(lst - ra);
    const x = cosLat * sinDec - sinLat * cosDec * cosHa;
    const y = -cosDec * sinHa;
    const z = sinLat * sinDec + cosLat * cosDec * cosHa;
    const az = (Math.atan2(y, x) * RAD_TO_DEG + 360) % 360;
    const alt = asindeg(z);
    store<f64>(result, az);
    store<f64>(result + sizeof<f64>(), alt);
}

export function wasmEquatorialToScreenRaDec(
    lst: f64, lat: f64, mode: i32, 
    centerRA: f64, centerDec: f64, centerAz: f64, centerAlt: f64, 
    raArray: usize, decArray: usize, n: i32, result: usize
): void{
    const sinCenterDec = Math.sin(centerDec * DEG_TO_RAD);
    const cosCenterDec = Math.cos(centerDec * DEG_TO_RAD);
    const sinCenterAlt = Math.sin(centerAlt * DEG_TO_RAD);
    const cosCenterAlt = Math.cos(centerAlt * DEG_TO_RAD);
    if (mode == 0) {
        for (let i = 0; i < n; i++) {
            const ra = load<f64>(raArray + i * sizeof<f64>()) * DEG_TO_RAD;
            const dec = load<f64>(decArray + i * sizeof<f64>()) * DEG_TO_RAD;
            const sinDec = Math.sin(dec);
            const cosDec = Math.cos(dec);
            const sinHa = Math.sin(ra - centerRA * DEG_TO_RAD);
            const cosHa = Math.cos(ra - centerRA * DEG_TO_RAD);
            const x = sinCenterDec * cosDec * cosHa - cosCenterDec * sinDec;
            const y = cosDec * sinHa;
            const z = cosCenterDec * cosDec * cosHa + sinCenterDec * sinDec;
            const r = acosdeg(z);
            const thetaSH = Math.atan2(y, x);
            const scrRA = r * Math.sin(thetaSH);
            const scrDec = - r * Math.cos(thetaSH);
            store<f64>(result + (i * 2    ) * sizeof<f64>(), scrRA);
            store<f64>(result + (i * 2 + 1) * sizeof<f64>(), scrDec);
        }
    } else if (mode == 1) {
        const tmpResult = result;
        wasmEquatorialToHorizontal(lst, lat, raArray, decArray, n, tmpResult);
        for (let i = 0; i < n; i++) {
            const az = load<f64>(tmpResult + (i * 2    ) * sizeof<f64>());
            const alt = load<f64>(tmpResult + (i * 2 + 1) * sizeof<f64>());
            const sinAlt = Math.sin(alt * DEG_TO_RAD);
            const cosAlt = Math.cos(alt * DEG_TO_RAD);
            const sinAzDiff = Math.sin(-az + centerAz * DEG_TO_RAD);
            const cosAzDiff = Math.cos(-az + centerAz * DEG_TO_RAD);
            const x = sinCenterAlt * cosAlt * cosAzDiff - cosCenterAlt * sinAlt;
            const y = cosAlt * sinAzDiff;
            const z = cosCenterAlt * cosAlt * cosAzDiff + sinCenterAlt * sinAlt;
            const r = acosdeg(z);
            const thetaSH = Math.atan2(y, x);
            const scrRA = r * Math.sin(thetaSH);
            const scrDec = - r * Math.cos(thetaSH);
            store<f64>(result + (i * 2    ) * sizeof<f64>(), scrRA);
            store<f64>(result + (i * 2 + 1) * sizeof<f64>(), scrDec);
        }
    }

}

export function wasmEquatorialToScreenRaDecSingle(
    lst: f64, lat: f64, mode: i32, 
    centerRA: f64, centerDec: f64, centerAz: f64, centerAlt: f64, 
    ra: f64, dec: f64, result: usize
): void{
    const sinCenterDec = Math.sin(centerDec * DEG_TO_RAD);
    const cosCenterDec = Math.cos(centerDec * DEG_TO_RAD);
    const sinCenterAlt = Math.sin(centerAlt * DEG_TO_RAD);
    const cosCenterAlt = Math.cos(centerAlt * DEG_TO_RAD);
        if (mode == 0) {
        const sinDec = Math.sin(dec);
        const cosDec = Math.cos(dec);
        const sinHa = Math.sin(ra - centerRA * DEG_TO_RAD);
        const cosHa = Math.cos(ra - centerRA * DEG_TO_RAD);
        const x = sinCenterDec * cosDec * cosHa - cosCenterDec * sinDec;
        const y = cosDec * sinHa;
        const z = cosCenterDec * cosDec * cosHa + sinCenterDec * sinDec;
        const r = acosdeg(z);
        const thetaSH = Math.atan2(y, x);
        const scrRA = r * Math.sin(thetaSH);
        const scrDec = - r * Math.cos(thetaSH);
        store<f64>(result, scrRA);
        store<f64>(result + sizeof<f64>(), scrDec);
    } else if (mode == 1) {
        const tmpResult = result;
        wasmEquatorialToHorizontalSingle(lst, lat, ra, dec, tmpResult);
        const az = load<f64>(tmpResult);
        const alt = load<f64>(tmpResult + sizeof<f64>());
        const sinAlt = Math.sin(alt * DEG_TO_RAD);
        const cosAlt = Math.cos(alt * DEG_TO_RAD);
        const sinAzDiff = Math.sin(-az + centerAz * DEG_TO_RAD);
        const cosAzDiff = Math.cos(-az + centerAz * DEG_TO_RAD);
        const x = sinCenterAlt * cosAlt * cosAzDiff - cosCenterAlt * sinAlt;
        const y = cosAlt * sinAzDiff;
        const z = cosCenterAlt * cosAlt * cosAzDiff + sinCenterAlt * sinAlt;
        const r = acosdeg(z);
        const thetaSH = Math.atan2(y, x);
        const scrRA = r * Math.sin(thetaSH);
        const scrDec = - r * Math.cos(thetaSH);
        store<f64>(result, scrRA);
        store<f64>(result + sizeof<f64>(), scrDec);
    }
}