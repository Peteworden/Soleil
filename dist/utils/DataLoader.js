// import { SolarObjectsLoader } from './SolarObjectsLoader.js';
import { HipStar, MessierObject, NGCObject } from '../models/CelestialObject.js';
import { CoordinateConverter } from './coordinates.js';
export class DataLoader {
    static async fetchText(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load ${url}: ${response.statusText}`);
        }
        return await response.text();
    }
    static async fetchJson(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load ${url}: ${response.statusText}`);
        }
        const data = await response.json();
        return Object.values(data);
    }
    static async fetchCsvData(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load ${url}: ${response.statusText}`);
        }
        const text = await response.text();
        const lines = text.trim().split('\n');
        const data = lines.map(line => line.split(',').map(Number));
        return data;
    }
    static async fetchGaiaBinaryData(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load ${url}: ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        const view = new DataView(buffer);
        const bufferByteLength = buffer.byteLength;
        let gaia = [];
        if (url == 'data/gaia_-100_liten250719.bin') {
            const count = Math.floor(bufferByteLength / 4);
            gaia = new Array(count);
            for (let i = 0; i < bufferByteLength; i += 4) {
                const ra = ((view.getUint8(i) << 2) | (view.getUint8(i + 1) >> 6)) * 0.001;
                const dec = (((view.getUint8(i + 1) & 0x3F) << 4) | (view.getUint8(i + 2) >> 4)) * 0.001;
                const mag = (((view.getUint8(i + 2) & 0x0F) << 3) | ((view.getUint8(i + 3) & 0xE0) >> 5)) * 0.1 - 2.0;
                gaia[i >> 2] = [ra, dec, mag];
            }
        }
        else if (url == 'data/gaia_101-110_liten250719.bin') {
            const count = Math.floor(bufferByteLength / 3);
            gaia = new Array(count);
            for (let i = 0; i < bufferByteLength; i += 3) {
                const ra = ((view.getUint8(i) << 2) | (view.getUint8(i + 1) >> 6)) * 0.001;
                const dec = (((view.getUint8(i + 1) & 0x3F) << 4) | (view.getUint8(i + 2) >> 4)) * 0.001;
                const mag = (view.getUint8(i + 2) & 0x0F) * 0.1 + 10.1;
                gaia[i / 3] = [ra, dec, mag];
            }
        }
        else if (url == 'data/gaia_111-115_liten250719.bin') {
            const count = Math.floor(bufferByteLength / 3);
            gaia = new Array(count);
            for (let i = 0; i < bufferByteLength; i += 3) {
                const ra = ((view.getUint8(i) << 2) | (view.getUint8(i + 1) >> 6)) * 0.001;
                const dec = (((view.getUint8(i + 1) & 0x3F) << 4) | (view.getUint8(i + 2) >> 4)) * 0.001;
                const mag = (view.getUint8(i + 2) & 0x0F) * 0.1 + 11.1;
                gaia[i / 3] = [ra, dec, mag];
            }
        }
        return gaia;
    }
    // static async loadSolarSystemObjects(): Promise<SolarSystemObjectBase[]> {
    //     const solarObjects = await SolarSystemDataManager.loadSolarSystemObjectElements();
    //     return solarObjects;
    // }
    // HIP星表データの読み込み
    static async loadHIPData() {
        const h = await this.fetchText('data/hip_65.txt');
        const hipData = h.split(',').map(Number);
        const hips = [];
        for (let i = 0; i < hipData.length; i += 4) {
            const coordinates = {
                ra: hipData[i] * 0.001,
                dec: hipData[i + 1] * 0.001
            };
            hips.push(new HipStar(coordinates, hipData[i + 2] * 0.1, // magnitude
            hipData[i + 3] * 0.1 // bv
            ));
        }
        return hips;
    }
    // 星座データの読み込み
    static async loadConstellationData() {
        return await this.fetchJson('data/constellation.json');
    }
    // 星名データの読み込み
    static async loadStarNames() {
        const data = await this.fetchJson('data/starnames.json');
        const starNames = [];
        for (const starName of data) {
            starNames.push({
                name: starName.name,
                ra: starName.ra,
                dec: starName.dec,
                tier: starName.tier,
                jpnName: starName.jpnname
            });
        }
        return starNames;
    }
    // メシエ天体データの読み込み
    static async loadMessierData() {
        const converter = new CoordinateConverter();
        const data = await this.fetchJson('data/messier.json');
        const messier = [];
        for (const object of data) {
            messier.push(new MessierObject(object.name, object.alt_name, { ra: converter.rahmToDeg(object.ra), dec: converter.decdmToDeg(object.dec) }, object.vmag, object.class, object.overlay || undefined, object.description));
        }
        return messier;
    }
    // おすすめ天体データの読み込み
    static async loadRecData() {
        const converter = new CoordinateConverter();
        const data = await this.fetchJson('data/rec.json');
        const rec = [];
        for (const object of data) {
            let ra, dec;
            if (object.ra.includes(' ')) {
                ra = converter.rahmToDeg(object.ra);
                dec = converter.decdmToDeg(object.dec);
            }
            else {
                ra = +object.ra;
                dec = +object.dec;
            }
            rec.push(new MessierObject(object.name, object.alt_name, { ra, dec }, object.vmag, object.class, object.overlay, object.description));
        }
        return rec;
    }
    // NGC天体データの読み込み
    static async loadNGCData() {
        const data = (await this.fetchText('data/ngc.txt')).split(',');
        const ngc = [];
        for (let i = 0; i < data.length; i += 5) {
            ngc.push(new NGCObject(data[i], { ra: +data[i + 1], dec: +data[i + 2] }, +data[i + 3], data[i + 4]));
        }
        return ngc;
    }
    // 明るい星データの読み込み
    static async loadBrightStars() {
        return await this.fetchText('data/brights.txt');
    }
    // 星座境界データの読み込み
    // static async loadConstellationBoundaries(): Promise<number[][]> {
    //     return await this.fetchBinary('data/constellation_boundaries.bin');
    // }
    // Gaiaデータの読み込み
    static async loadGaiaData(magnitudeRange) {
        if (magnitudeRange == '-100') {
            return await this.fetchGaiaBinaryData(`data/gaia_${magnitudeRange}_liten250719.bin`);
        }
        else if (magnitudeRange == '101-110') {
            return await this.fetchGaiaBinaryData(`data/gaia_${magnitudeRange}_liten250719.bin`);
        }
        else if (magnitudeRange == '111-115') {
            return await this.fetchGaiaBinaryData(`data/gaia_${magnitudeRange}_liten250719.bin`);
        }
        else {
            throw new Error(`Invalid magnitude range: ${magnitudeRange}`);
        }
    }
    static async loadGaiaHelpData(magnitudeRange) {
        const help = await this.fetchText(`data/gaia_${magnitudeRange}_helper.txt`);
        const helpData = help.split(',').map(Number);
        return helpData;
    }
    // 追加天体データの読み込み
    static async loadAdditionalObjects() {
        return await this.fetchText('data/additional_objects.txt');
    }
}
//# sourceMappingURL=DataLoader.js.map