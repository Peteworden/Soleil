import { HipStar } from '../models/CelestialObject.js';
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
    static async fetchBinary(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load ${url}: ${response.statusText}`);
        }
        return await response.arrayBuffer();
    }
    // 星座データの読み込み
    static async loadConstellationData() {
        return await this.fetchJson('data/constellation.json');
    }
    // メシエ天体データの読み込み
    static async loadMessierData() {
        return await this.fetchJson('data/messier.json');
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
    static async loadConstellationBoundaries() {
        return await this.fetchBinary('data/constellation_boundaries.bin');
    }
    // Gaiaデータの読み込み
    static async loadGaiaData(region) {
        return await this.fetchBinary(`data/gaia_${region}.bin`);
    }
    // 追加天体データの読み込み
    static async loadAdditionalObjects() {
        return await this.fetchText('data/additional_objects.txt');
    }
}
//# sourceMappingURL=DataLoader.js.map