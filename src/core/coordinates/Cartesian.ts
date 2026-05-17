import { asindeg } from "../../core/mathUtils.js";
import { CartesianCoords, EquatorialCoordinates, HorizontalCoordinates } from "../../types";
import { RAD_TO_DEG } from "../../utils/constants.js";

export type Matrix3x3 = [
    number, number, number,
    number, number, number,
    number, number, number
];

export interface RotationStep {
    axis: 'X' | 'Y' | 'Z';
    angle: number;
}

function identityMatrix(): Matrix3x3 {
    return [
        1, 0, 0,
        0, 1, 0,
        0, 0, 1
    ];
}

function multiplyMatrix(a: Matrix3x3, b: Matrix3x3): Matrix3x3 {
    return [
        a[0]*b[0] + a[1]*b[3] + a[2]*b[6], a[0]*b[1] + a[1]*b[4] + a[2]*b[7], a[0]*b[2] + a[1]*b[5] + a[2]*b[8],
        a[3]*b[0] + a[4]*b[3] + a[5]*b[6], a[3]*b[1] + a[4]*b[4] + a[5]*b[7], a[3]*b[2] + a[4]*b[5] + a[5]*b[8],
        a[6]*b[0] + a[7]*b[3] + a[8]*b[6], a[6]*b[1] + a[7]*b[4] + a[8]*b[7], a[6]*b[2] + a[7]*b[5] + a[8]*b[8]
    ];
}

export function createRotation(axis: 'X' | 'Y' | 'Z', angle: number): Matrix3x3 {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    switch (axis) {
        case 'X':
            return [
                1, 0, 0,
                0, c, -s,
                0, s, c
            ];
        case 'Y':
            return [
                c, 0, s,
                0, 1, 0,
                -s, 0, c
            ];
        case 'Z':
            return [
                c, -s, 0,
                s, c, 0,
                0, 0, 1
            ];
    }
}

// 複数の回転ステップを適用順に合成
export function combineRotations(steps: RotationStep[]): Matrix3x3 {
    let result = identityMatrix();
    
    // ベクトル v に対する回転は、数学的には「左から行列を掛ける」ため、
    // 適用したい順序（stepsの配列順）の「逆順」に積み重ねる必要があります。
    for (let i = steps.length - 1; i >= 0; i--) {
        const step = steps[i];
        const m = createRotation(step.axis, step.angle);
        result = multiplyMatrix(m, result);
    }
    return result;
}

// ベクトルに行列を適用して回転させる
export function transform(v: CartesianCoords, m: Matrix3x3): CartesianCoords{
    return {
        x: m[0] * v.x + m[1] * v.y + m[2] * v.z,
        y: m[3] * v.x + m[4] * v.y + m[5] * v.z,
        z: m[6] * v.x + m[7] * v.y + m[8] * v.z
    };
}

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
    const ans = {
        x: cos * xyz.x - sin * xyz.y,
        y: sin * xyz.x + cos * xyz.y,
        z: xyz.z
    }
    return ans;
}