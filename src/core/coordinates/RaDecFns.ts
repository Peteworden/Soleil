import { DEG_TO_RAD } from "utils/constants";

export function radecToRad(ra: number, dec: number): {ra: number, dec: number} {
    return {ra: ra * DEG_TO_RAD, dec: dec * DEG_TO_RAD};
}