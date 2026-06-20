import { RAD_TO_DEG } from "../utils/constants.js";

export function asinrad(a: number): number {
    return Math.asin(Math.max(-1, Math.min(1, a)));
}

export function acosrad(a: number): number {
    return Math.acos(Math.max(-1, Math.min(1, a)));
}

export function asindeg(a: number): number {
    return Math.asin(Math.max(-1, Math.min(1, a))) * RAD_TO_DEG;
}

export function acosdeg(a: number): number {
    return Math.acos(Math.max(-1, Math.min(1, a))) * RAD_TO_DEG;
}