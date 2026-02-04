import { asindeg } from "../mathUtils.js";
import { RaDec } from "./RaDec.js";
import { AzAlt } from "./AzAlt.js";
import { RAD_TO_DEG } from '../constants.js';
export class Cartesian {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    add(other) {
        return new Cartesian(this.x + other.x, this.y + other.y, this.z + other.z);
    }
    subtract(other) {
        return new Cartesian(this.x - other.x, this.y - other.y, this.z - other.z);
    }
    distance() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    toRaDec() {
        const distance = this.distance();
        const dec = asindeg(this.z / distance);
        const ra = Math.atan2(this.y, this.x) * RAD_TO_DEG;
        return new RaDec((ra + 360) % 360, dec);
    }
    toAzAlt() {
        const distance = this.distance();
        const alt = asindeg(this.z / distance);
        const az = Math.atan2(this.y, this.x) * RAD_TO_DEG;
        return new AzAlt((az + 360) % 360, alt);
    }
    rotateX(angle) {
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        const ans = new Cartesian(this.x, cos * this.y - sin * this.z, sin * this.y + cos * this.z);
        return ans;
    }
    rotateY(angle) {
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        const ans = new Cartesian(cos * this.x + sin * this.z, this.y, -sin * this.x + cos * this.z);
        return ans;
    }
    rotateZ(angle) {
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        const ans = new Cartesian(cos * this.x - sin * this.y, sin * this.x + cos * this.y, this.z);
        return ans;
    }
}
//# sourceMappingURL=Cartesian.js.map