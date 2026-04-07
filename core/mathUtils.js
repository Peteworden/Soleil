const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
export function asinrad(a) {
    if (a > 1)
        return Math.PI / 2;
    else if (a < -1)
        return -Math.PI / 2;
    else
        return Math.asin(a);
}
export function acosrad(a) {
    if (a > 1)
        return 0;
    else if (a < -1)
        return Math.PI;
    else
        return Math.acos(a);
}
export function asindeg(a) {
    if (a > 1)
        return 90;
    else if (a < -1)
        return -90;
    else
        return Math.asin(a) * RAD_TO_DEG;
}
export function acosdeg(a) {
    if (a > 1)
        return 0;
    else if (a < -1)
        return 180;
    else
        return Math.acos(a) * RAD_TO_DEG;
}
//# sourceMappingURL=mathUtils.js.map