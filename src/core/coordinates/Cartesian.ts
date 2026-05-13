// import { asindeg } from "../mathUtils.js";
// import { RaDec, AzAlt } from "./index.js";
// import { RAD_TO_DEG } from '../../utils/constants.js';

import { asindeg } from "../../core/mathUtils.js";
import { CartesianCoords, EquatorialCoordinates, HorizontalCoordinates } from "../../types";
import { RAD_TO_DEG } from "../../utils/constants.js";


// export class CartesianCoords {
//     x: number;
//     y: number;
//     z: number;
//     constructor(x: number, y: number, z: number) {
//         this.x = x;
//         this.y = y;
//         this.z = z;
//     }

export function add(xyz1: CartesianCoords, xyz2: CartesianCoords): CartesianCoords {
    return {
        x: xyz1.x + xyz2.x,
        y: xyz1.y + xyz2.y,
        z: xyz1.z + xyz2.z,
    }
}

export function subtract(xyz1: CartesianCoords, xyz2: CartesianCoords): CartesianCoords {
    return {
        x: xyz1.x - xyz2.x,
        y: xyz1.y - xyz2.y,
        z: xyz1.z - xyz2.z,
    }
}

// multiply(scalar: number): CartesianCoords {
//     return new CartesianCoords(this.x * scalar, this.y * scalar, this.z * scalar);
// }
export function multiply(xyz: CartesianCoords, k: number): CartesianCoords {
    return {
        x: xyz.x * k,
        y: xyz.y * k,
        z: xyz.z * k
    }
}

export function distance(xyz: CartesianCoords): number {
    const {x, y, z} = xyz;
    return Math.sqrt(x * x + y * y + z * z);
}

export function toRaDec(xyz: CartesianCoords): EquatorialCoordinates {
    const dist = distance(xyz);
    const dec = asindeg(xyz.z / dist);
    const ra = Math.atan2(xyz.y, xyz.x) * RAD_TO_DEG;
    return {ra: (ra + 360) % 360, dec};
}

export function toAzAlt(xyz: CartesianCoords): HorizontalCoordinates {
    const dist = distance(xyz);
    const alt = asindeg(xyz.z / dist);
    const az = Math.atan2(xyz.y, xyz.x) * RAD_TO_DEG;
    return {az: (az + 360) % 360, alt};
}

export function rotateX(xyz: CartesianCoords, angle: number): CartesianCoords {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    // const ans = new CartesianCoords(
    //     this.x,
    //     cos*this.y-sin*this.z,
    //     sin*this.y+cos*this.z
    // );
    const ans = {
        x: xyz.x,
        y: cos * xyz.y - sin * xyz.z,
        z: sin * xyz.y + cos * xyz.z
    }
    return ans;
}

export function rotateY(xyz: CartesianCoords, angle: number): CartesianCoords {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    // const ans = new CartesianCoords(
    //     cos*this.x+sin*this.z,
    //     this.y,
    //     -sin*this.x+cos*this.z
    // );
    const ans = {
        x: cos * xyz.x + sin * xyz.z,
        y: xyz.y,
        z: -sin * xyz.x + cos * xyz.z
    }
    return ans;
}

export function rotateZ(xyz: CartesianCoords, angle: number): CartesianCoords {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    // const ans = new CartesianCoords(
    //     cos*this.x-sin*this.y,
    //     sin*this.x+cos*this.y,
    //     this.z
    // );
    const ans = {
        x: cos * xyz.x - sin * xyz.y,
        y: sin * xyz.x + cos * xyz.y,
        z: xyz.z
    }
    return ans;
}