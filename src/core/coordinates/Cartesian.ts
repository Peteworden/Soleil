import { asindeg } from "../mathUtils.js";
import { RaDec } from "./RaDec.js";
import { AzAlt } from "./AzAlt.js";
import { RAD_TO_DEG } from '../../utils/constants.js';

export class Cartesian {
    x: number;
    y: number;
    z: number;
    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add(other: Cartesian): Cartesian {
        return new Cartesian(this.x + other.x, this.y + other.y, this.z + other.z);
    }

    subtract(other: Cartesian): Cartesian {
        return new Cartesian(this.x - other.x, this.y - other.y, this.z - other.z);
    }

    multiply(scalar: number): Cartesian {
        return new Cartesian(this.x * scalar, this.y * scalar, this.z * scalar);
    }

    distance(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    toRaDec(): RaDec {
        const distance = this.distance();
        const dec = asindeg(this.z / distance);
        const ra = Math.atan2(this.y, this.x) * RAD_TO_DEG;
        return new RaDec((ra + 360) % 360, dec);
    }

    toAzAlt(): AzAlt {
        const distance = this.distance();
        const alt = asindeg(this.z / distance);
        const az = Math.atan2(this.y, this.x) * RAD_TO_DEG;
        return new AzAlt((az + 360) % 360, alt);
    }

    rotateX(angle: number): Cartesian {
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        const ans = new Cartesian(
            this.x,
            cos*this.y-sin*this.z,
            sin*this.y+cos*this.z
        );
        return ans;
    }
    rotateY(angle: number): Cartesian {
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        const ans = new Cartesian(
            cos*this.x+sin*this.z,
            this.y,
            -sin*this.x+cos*this.z
        );
        return ans;
    }
    rotateZ(angle: number): Cartesian {
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        const ans = new Cartesian(
            cos*this.x-sin*this.y,
            sin*this.x+cos*this.y,
            this.z
        );
        return ans;
    }
}