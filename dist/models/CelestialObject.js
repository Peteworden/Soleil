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
    constructor(name, alt_name, coordinates, magnitude, type, image_url, image_credit, overlay, description, wiki) {
        super(name, coordinates, magnitude, type);
        this.alt_name = alt_name;
        this.image_url = image_url;
        this.image_credit = image_credit;
        if (overlay) {
            this.overlay = {
                width: overlay.width != null ? overlay.width : 1, // 赤緯の幅
                opacity: overlay.opacity != null ? overlay.opacity : 0.5
            };
        }
        else {
            this.overlay = null;
        }
        this.description = description || '';
        this.wiki = wiki || null;
    }
    getNumber() {
        return parseInt(this.name.replace('M', ''));
    }
    getNumberChar() {
        return this.name.replace('M', '');
    }
    getAltName() {
        return this.alt_name;
    }
    getTypeName() {
        return this.type || '';
    }
    getImageUrl() {
        return `chartImage/${this.image_url}`;
    }
    getImageCredit() {
        return this.image_credit;
    }
    getOverlay() {
        if (this.overlay != null && this.overlay.width !== null && this.overlay.opacity !== null) {
            return this.overlay;
        }
        else {
            return null;
        }
    }
    getDescription() {
        return this.description;
    }
    getWiki() {
        return this.wiki;
    }
}
export class NGCObject extends CelestialObject {
    constructor(name, coordinates, magnitude, type) {
        super(name, coordinates, magnitude, type);
    }
    getName() {
        return this.name;
    }
    getCatalog() {
        if (this.name.slice(0, 3) === 'NGC') {
            return 'NGC';
        }
        else if (this.name.slice(0, 2) === 'IC') {
            return 'IC';
        }
        else {
            return '';
        }
    }
    getNumber() {
        return parseInt(this.name.replace(this.getCatalog(), ''));
    }
    getNumberChar() {
        return this.name.replace(this.getCatalog(), '');
    }
}
//# sourceMappingURL=CelestialObject.js.map