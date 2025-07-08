import { SolarSystemObjectFactory } from '../models/SolarSystemObjects.js';
/**
 * 太陽系天体データの管理クラス
 * データの読み込み、保存、取得に特化
 */
export class SolarObjectsLoader {
    /**
     * solarObjects.jsonからデータを読み込む（最初の読み込み時のみ）
     */
    static async loadSolarSystemObjectElements() {
        if (this.isLoaded) {
            return this.solarObjects;
        }
        try {
            const response = await fetch('./data/solarObjects.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.solarObjects = SolarSystemObjectFactory.createFromArray(data);
            this.isLoaded = true;
            console.log(`太陽系天体データを読み込みました: ${this.solarObjects.length}個の天体`);
            return this.solarObjects;
        }
        catch (error) {
            console.error('太陽系天体データの読み込みに失敗:', error);
            return [];
        }
    }
    // 天体の取得メソッド
    static getObjectsByType(type) {
        return this.solarObjects.filter(obj => obj.type === type);
    }
    static getPlanets() {
        return this.getObjectsByType('planet');
    }
    static getAsteroids() {
        return this.getObjectsByType('asteroid');
    }
    static getComets() {
        return this.getObjectsByType('comet');
    }
    static getSun() {
        return this.solarObjects.find(obj => obj.type === 'sun');
    }
    static getMoon() {
        return this.solarObjects.find(obj => obj.type === 'moon');
    }
    static getEarth() {
        return this.solarObjects.find(obj => obj.engName === 'Earth');
    }
    // 検索メソッド
    static findByName(japaneseName) {
        return this.solarObjects.find(obj => obj.jpnName.includes(japaneseName));
    }
    static findByEnglishName(englishName) {
        return this.solarObjects.find(obj => obj.engName.includes(englishName));
    }
    static findByHiraganaName(hiraganaName) {
        return this.solarObjects.find(obj => obj.hiraganaName.includes(hiraganaName));
    }
    // ユーティリティメソッド
    static reset() {
        this.solarObjects = [];
        this.isLoaded = false;
    }
    static getObjectCount() {
        return this.solarObjects.length;
    }
    static isDataLoaded() {
        return this.isLoaded;
    }
    /**
     * 全ての天体を取得
     */
    static getAllObjects() {
        return [...this.solarObjects];
    }
}
SolarObjectsLoader.solarObjects = [];
SolarObjectsLoader.isLoaded = false;
//# sourceMappingURL=SolarObjectsLoader.js.map