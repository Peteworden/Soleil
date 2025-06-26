import { HipStar, MessierObject } from '../models/CelestialObject.js';
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
        return await response.json();
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
        let index = 0;
        let gaia = [];
        if (url == 'data/gaia_-100.bin') {
            gaia = new Array(505972).fill(0);
        }
        else if (url == 'data/gaia_101-110.bin') {
            gaia = new Array(800359).fill(0);
        }
        else if (url == 'data/gaia_111-115.bin') {
            gaia = new Array(666677).fill(0);
        }
        for (let i = 0; i < bufferByteLength; i += 6) {
            const ra = (view.getUint8(i) << 16) | (view.getUint8(i + 1) << 8) | view.getUint8(i + 2);
            const decMag = (view.getUint8(i + 3) << 16) | (view.getUint8(i + 4) << 8) | view.getUint8(i + 5);
            const decPart = Math.floor(decMag / 10);
            const dec = decPart - 90000;
            let mag = 0;
            if (url == 'data/gaia_101-110.bin') {
                mag = decMag - 10 * decPart + 101;
            }
            else if (url == 'data/gaia_111-115.bin') {
                mag = decMag - 10 * decPart + 111;
            }
            gaia[index] = [ra, dec, mag];
            index++;
        }
        return gaia;
    }
    // 星座データの読み込み
    static async loadConstellationData() {
        return await this.fetchJson('data/constellation.json');
    }
    // メシエ天体データの読み込み
    static async loadMessierData() {
        const converter = new CoordinateConverter();
        const data = await this.fetchJson('data/messier.json');
        const messier = [];
        for (const object of data) {
            messier.push(new MessierObject(object.name, object.alt_name, { ra: converter.rahmToDeg(object.ra), dec: converter.decdmToDeg(object.dec) }, object.vmag, object.class, object.description));
        }
        return messier;
    }
    // 星名データの読み込み
    static async loadStarNames() {
        return await this.fetchJson('data/starnames.json');
    }
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
    // NGC天体データの読み込み
    static async loadNGCData() {
        return await this.fetchText('data/ngc.txt');
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
            return await this.fetchCsvData(`data/gaia_${magnitudeRange}.csv`);
        }
        else {
            return await this.fetchGaiaBinaryData(`data/gaia_${magnitudeRange}.bin`);
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