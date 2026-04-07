import { EquatorialCoordinates} from '../types/index.js';

export class CelestialObject {
    name: string;
    coordinates: EquatorialCoordinates;
    magnitude?: number;
    type?: string;

    constructor(name: string, coordinates: EquatorialCoordinates, magnitude?: number, type?: string) {
        this.name = name || '';
        this.coordinates = coordinates || { ra: 0, dec: 0 };
        this.magnitude = magnitude || 0;
        this.type = type || '';
    }

    getName(): string {
        return this.name;
    }

    getCoordinates(): EquatorialCoordinates {
        return this.coordinates;
    }

    getMagnitude(): number | undefined {
        return this.magnitude;
    }

    getType(): string | undefined {
        return this.type;
    }
}

export class HipStar extends CelestialObject {
    private bv: number | null;
    constructor(coordinates: EquatorialCoordinates, magnitude: number, bv: number | null) {
        super('', {ra: coordinates.ra, dec: coordinates.dec}, magnitude, 'hipStar');
        this.bv = bv || null;
    }

    getBv(): number | null {
        return this.bv;
    }
}

export class MessierObject extends CelestialObject {
    private otherNames: string[] | null;
    private searchKeys: string[] | null;
    private image_url: string | null;
    private image_credit: string | null;
    private overlay: { filename: string, width: number, opacity: number } | null;
    private description: string;
    private wiki: string | null;

    constructor(
        name: string,
        otherNames: string[] | null,
        searchKeys: string[] | null,
        coordinates: EquatorialCoordinates,
        magnitude: number,
        type: string,
        image_url: string | null,
        image_credit: string | null,
        overlay: { filename: string, width: number, opacity: number } | null,
        description: string,
        wiki: string | null
    ) {
        super(name, coordinates, magnitude, type);
        this.otherNames = otherNames;
        this.searchKeys = searchKeys;
        this.image_url = image_url;
        this.image_credit = image_credit;
        if (overlay) {
            this.overlay = { 
                filename: overlay.filename != null ? overlay.filename : `${name}.png`,
                width: overlay.width != null ? overlay.width : 1, // 赤緯の幅
                opacity: overlay.opacity != null ? overlay.opacity : 0.5 
            };
        } else {
            this.overlay = null;
        }
        this.description = description || '';
        this.wiki = wiki || null;
    }

    getNumber(): number {
        return parseInt(this.name.replace('M', ''));
    }

    getNumberChar(): string {
        return this.name.replace('M', '');
    }

    getOtherNames(): string[] | null {
        return this.otherNames;   
    }

    getSearchKeys(): string[] | null {
        return this.searchKeys;
    }

    getTypeName(): string {
        return this.type || '';
    }

    getImageUrl(): string | null {
        return `chartImage/${this.image_url}`;
    }

    getImageCredit(): string | null {
        return this.image_credit;
    }

    getOverlay(): { filename: string, width: number, opacity: number } | null {
        if (this.overlay != null && this.overlay.filename !== '' && this.overlay.width !== null && this.overlay.opacity !== null) {
            return this.overlay;
        } else {
            return null;
        }
    }

    getDescription(): string {
        return this.description;
    }

    getWiki(): string | null {
        return this.wiki;
    }
}

export class NGCObject extends CelestialObject {
    private otherNames: string[] | null;
    private searchKeys: string[] | null;
    private description: string | null;
    constructor(name: string, coordinates: EquatorialCoordinates, magnitude: number, type: string, otherNames: string[] | null, searchKeys: string[] | null, description: string | null) {
        super(name, coordinates, magnitude, type);
        this.otherNames = otherNames;
        this.searchKeys = searchKeys;
        this.description = description;
    }

    setOtherNames(otherNames: string[] | null) {
        this.otherNames = otherNames;
    }

    setSearchKeys(searchKeys: string[] | null) {
        this.searchKeys = searchKeys;
    }

    setDescription(description: string | null) {
        this.description = description;
    }

    setSpecialInfo(otherNames: string[] | null, searchKeys: string[] | null, description: string | null) {
        this.otherNames = otherNames;
        this.searchKeys = searchKeys;
        this.description = description;
    }

    getName(): string {
        return this.name;
    }

    getCatalog(): string {
        if (this.name.slice(0, 3) === 'NGC') {
            return 'NGC';
        } else if (this.name.slice(0, 2) === 'IC') {
            return 'IC';
        } else {
            return '';
        }
    }

    getNumber(): number {
        return parseInt(this.name.replace(this.getCatalog(), ''));
    }

    getNumberChar(): string {
        return this.name.replace(this.getCatalog(), '');
    }

    getOtherNames(): string[] | null {
        return this.otherNames;
    }

    getSearchKeys(): string[] | null {
        return this.searchKeys;
    }

    getDescription(): string | null {
        return this.description;
    }

    static fromJson(json: any): NGCObject {
        return new NGCObject(
            json.name, 
            { ra: json.coordinates.ra, dec: json.coordinates.dec }, 
            json.magnitude, 
            json.type, 
            json.otherNames, 
            json.searchKeys, 
            json.description
        );
    }
}

export class SharplessObject extends CelestialObject {
    private alt_names: string[];
    private search_names: string[];
    private diameter: number;
    private form: number;
    private bright: number;
    private description: string;
    private link: string;
    constructor(
        name: string, 
        alt_names: string[],
        search_names: string[],
        coordinates: EquatorialCoordinates, 
        diameter: number, 
        form: number, 
        bright: number,
        description: string,
        link: string
    ) {
        super(name, coordinates, undefined, 'Nb');
        this.alt_names = alt_names;
        this.search_names = search_names;
        this.diameter = diameter;
        this.form = form;
        this.bright = bright;
        this.description = description;
        this.link = link;
    }

    getAltNames(): string[] {
        return this.alt_names;
    }

    getSearchNames(): string[] {
        return this.search_names;
    }

    getDiameter(): number {
        return this.diameter;
    }

    getForm(): number {
        return this.form;
    }

    getBright(): number {
        return this.bright;
    }

    getDescription(): string {
        return this.description;
    }

    getLink(): string {
        return this.link;
    }

    static fromJson(json: any): SharplessObject {
        return new SharplessObject(
            json.name, 
            json.alt_names, 
            json.search_names, 
            { ra: json.coordinates.ra, dec: json.coordinates.dec }, 
            json.diameter, 
            json.form, 
            json.bright, 
            json.description, 
            json.link
        );
    }
}