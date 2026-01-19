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
        this.bv = bv || null;
    }
    getBv() {
        return this.bv;
    }
}
export class MessierObject extends CelestialObject {
    constructor(name, otherNames, searchKeys, coordinates, magnitude, type, image_url, image_credit, overlay, description, wiki) {
        super(name, coordinates, magnitude, type);
        this.otherNames = otherNames;
        this.searchKeys = searchKeys;
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
    getOtherNames() {
        return this.otherNames;
    }
    getSearchKeys() {
        return this.searchKeys;
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
    constructor(name, coordinates, magnitude, type, otherNames, searchKeys, description) {
        super(name, coordinates, magnitude, type);
        this.otherNames = otherNames;
        this.searchKeys = searchKeys;
        this.description = description;
    }
    setOtherNames(otherNames) {
        this.otherNames = otherNames;
    }
    setSearchKeys(searchKeys) {
        this.searchKeys = searchKeys;
    }
    setDescription(description) {
        this.description = description;
    }
    setSpecialInfo(otherNames, searchKeys, description) {
        this.otherNames = otherNames;
        this.searchKeys = searchKeys;
        this.description = description;
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
    getOtherNames() {
        return this.otherNames;
    }
    getSearchKeys() {
        return this.searchKeys;
    }
    getDescription() {
        return this.description;
    }
    static fromJson(json) {
        return new NGCObject(json.name, { ra: json.coordinates.ra, dec: json.coordinates.dec }, json.magnitude, json.type, json.otherNames, json.searchKeys, json.description);
    }
}
export class SharplessObject extends CelestialObject {
    constructor(name, alt_names, search_names, coordinates, diameter, form, bright, description, link) {
        super(name, coordinates, undefined, 'Nb');
        this.alt_names = alt_names;
        this.search_names = search_names;
        this.diameter = diameter;
        this.form = form;
        this.bright = bright;
        this.description = description;
        this.link = link;
    }
    getAltNames() {
        return this.alt_names;
    }
    getSearchNames() {
        return this.search_names;
    }
    getDiameter() {
        return this.diameter;
    }
    getForm() {
        return this.form;
    }
    getBright() {
        return this.bright;
    }
    getDescription() {
        return this.description;
    }
    getLink() {
        return this.link;
    }
    static fromJson(json) {
        return new SharplessObject(json.name, json.alt_names, json.search_names, { ra: json.coordinates.ra, dec: json.coordinates.dec }, json.diameter, json.form, json.bright, json.description, json.link);
    }
}
//# sourceMappingURL=CelestialObject.js.map