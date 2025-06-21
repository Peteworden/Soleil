import { AstronomicalCalculator } from '../utils/calculations.js';
export class CelestialObject {
    constructor(name, coordinates, magnitude, type, bv) {
        this.name = name || '';
        this.coordinates = coordinates || { ra: 0, dec: 0 };
        this.magnitude = magnitude || 0;
        this.type = type || '';
        this.bv = bv || 100;
    }
    getName() {
        return this.name;
    }
    getCoordinates() {
        return this.coordinates;
    }
    getMagnitude() {
        return this.magnitude;
    }
    getType() {
        return this.type;
    }
    getBv() {
        return this.bv;
    }
}
export class HipStar extends CelestialObject {
    constructor(coordinates, magnitude, bv) {
        super('', coordinates, magnitude, 'hipStar', bv);
    }
}
export class Planet extends CelestialObject {
    constructor(data) {
        super(data.jpnName, { ra: 0, dec: 0 });
        this.data = data;
    }
    updatePosition(jd) {
        const position = AstronomicalCalculator.calculatePlanetPosition(this.data, jd);
        this.coordinates = {
            ra: Math.atan2(position.y, position.x) * 180 / Math.PI,
            dec: Math.asin(position.z / Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z)) * 180 / Math.PI
        };
    }
    getJapaneseName() {
        return this.data.jpnName;
    }
    getHiraganaName() {
        return this.data.hiraganaName;
    }
    getEnglishName() {
        return this.data.engName;
    }
}
export class Moon extends CelestialObject {
    constructor() {
        super('月', { ra: 0, dec: 0 });
    }
    updatePosition(jd) {
        const position = AstronomicalCalculator.calculateMoonPosition(jd);
        this.coordinates = position;
    }
}
//# sourceMappingURL=CelestialObject.js.map