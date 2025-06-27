import { AstronomicalCalculator } from '../utils/calculations.js';
export class CelestialObject {
    constructor(name, coordinates, magnitude, type) {
        this.name = name || '';
        this.coordinates = coordinates || { ra: 0, dec: 0 };
        this.magnitude = magnitude || 0;
        this.type = type || '';
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
}
export class HipStar extends CelestialObject {
    constructor(coordinates, magnitude, bv) {
        super('', { ra: coordinates.ra, dec: coordinates.dec }, magnitude, 'hipStar');
        this.bv = bv;
    }
    getBv() {
        return this.bv;
    }
}
export class MessierObject extends CelestialObject {
    constructor(name, alt_name, coordinates, magnitude, type, description) {
        super(name, coordinates, magnitude, type);
        this.alt_name = alt_name;
        this.description = description || '';
    }
    getAltName() {
        return this.alt_name;
    }
    getTypeName() {
        return this.type || '';
    }
    getDescription() {
        return this.description;
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