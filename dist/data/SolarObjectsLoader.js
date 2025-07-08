import { SolarSystemObjectFactory } from '../models/SolarSystemObjects.js';
import { AstronomicalCalculator } from '../utils/calculations.js';
export class SolarObjectsLoader {
    /**
     * 最初の読み込み時のみ惑星データを取得
     */
    static async loadSolarObjects() {
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
    /**
     * 設定変更時・時刻変更時に全天体の位置を更新
     */
    static updateAllPositions(jd) {
        if (!this.isLoaded) {
            console.warn('天体データがまだ読み込まれていません');
            return;
        }
        // 地球の位置を基準として計算
        this.calculateEarthPosition(jd);
        // 全天体の位置を更新
        this.solarObjects.forEach(obj => {
            this.updateObjectPosition(obj, jd);
        });
    }
    /**
     * 地球の位置を計算（基準として使用）
     */
    static calculateEarthPosition(jd) {
        const earth = this.solarObjects.find(obj => obj.getEnglishName() === 'Earth');
        if (earth) {
            const earthData = earth.getData();
            if ('a' in earthData && 'meanLong' in earthData) {
                // PlanetData形式に変換
                const planetData = earthData;
                const position = AstronomicalCalculator.calculatePlanetPositions(planetData, jd);
                this.earthPosition = position;
            }
        }
    }
    /**
     * 個別天体の位置を更新
     */
    static updateObjectPosition(obj, jd) {
        const data = obj.getData();
        // 太陽を中心とする直交座標を計算
        let heliocentricPosition;
        if (obj.getType() === 'sun') {
            // 太陽は原点
            heliocentricPosition = { x: 0, y: 0, z: 0 };
        }
        else if (obj.getType() === 'moon') {
            // 月は地球を中心とした位置を計算
            const lunarPosition = AstronomicalCalculator.calculateMoonPosition(jd);
            // 地球の位置に月の相対位置を加算（月の位置は赤道座標なので変換が必要）
            const lunarCartesian = this.equatorialToCartesian(lunarPosition);
            heliocentricPosition = {
                x: this.earthPosition.x + lunarCartesian.x,
                y: this.earthPosition.y + lunarCartesian.y,
                z: this.earthPosition.z + lunarCartesian.z
            };
        }
        else if ('a' in data && 'meanLong' in data) {
            // 惑星は太陽を中心とした位置を計算
            const planetData = data;
            heliocentricPosition = AstronomicalCalculator.calculatePlanetPositions(planetData, jd);
        }
        else {
            // 小惑星・彗星は簡易計算
            heliocentricPosition = { x: 0, y: 0, z: 0 };
        }
        // 地球からの相対位置を計算
        const relativePosition = {
            x: heliocentricPosition.x - this.earthPosition.x,
            y: heliocentricPosition.y - this.earthPosition.y,
            z: heliocentricPosition.z - this.earthPosition.z
        };
        // 赤経・赤緯・距離を計算
        const equatorialCoords = this.calculateEquatorialCoordinates(relativePosition);
        const distance = this.calculateDistance(relativePosition);
        // 天体の座標と距離を更新
        obj.updatePosition(jd);
        obj.coordinates = equatorialCoords;
        obj.distance = distance;
        // 等級を計算・更新
        this.updateMagnitude(obj, distance);
    }
    /**
     * 直交座標から赤道座標を計算
     */
    static calculateEquatorialCoordinates(position) {
        const { x, y, z } = position;
        // 赤経（RA）を計算
        const ra = Math.atan2(y, x) * 180 / Math.PI;
        // 赤緯（Dec）を計算
        const distance = Math.sqrt(x * x + y * y);
        const dec = Math.atan2(z, distance) * 180 / Math.PI;
        return { ra, dec };
    }
    /**
     * 距離を計算
     */
    static calculateDistance(position) {
        const { x, y, z } = position;
        return Math.sqrt(x * x + y * y + z * z);
    }
    /**
     * 赤道座標から直交座標に変換
     */
    static equatorialToCartesian(eq) {
        const raRad = eq.ra * Math.PI / 180;
        const decRad = eq.dec * Math.PI / 180;
        return {
            x: Math.cos(decRad) * Math.cos(raRad),
            y: Math.cos(decRad) * Math.sin(raRad),
            z: Math.sin(decRad)
        };
    }
    /**
     * 等級を更新（距離効果を考慮）
     */
    static updateMagnitude(obj, distance) {
        const baseMagnitude = obj.getMagnitude();
        if (baseMagnitude !== undefined) {
            // 距離効果を考慮した等級計算（簡易版）
            const distanceModulus = 5 * Math.log10(distance);
            const apparentMagnitude = baseMagnitude + distanceModulus;
            obj.magnitude = apparentMagnitude;
        }
    }
    // 天体の取得メソッド
    static getObjectsByType(type) {
        return this.solarObjects.filter(obj => obj.getType() === type);
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
        return this.solarObjects.find(obj => obj.getType() === 'sun');
    }
    static getMoon() {
        return this.solarObjects.find(obj => obj.getType() === 'moon');
    }
    static getEarth() {
        return this.solarObjects.find(obj => obj.getEnglishName() === 'Earth');
    }
    // 検索メソッド
    static findByName(japaneseName) {
        return this.solarObjects.find(obj => obj.getJapaneseName().includes(japaneseName));
    }
    static findByEnglishName(englishName) {
        return this.solarObjects.find(obj => obj.getEnglishName().includes(englishName));
    }
    static findByHiraganaName(hiraganaName) {
        return this.solarObjects.find(obj => obj.getHiraganaName().includes(hiraganaName));
    }
    // ユーティリティメソッド
    static reset() {
        this.solarObjects = [];
        this.isLoaded = false;
        this.earthPosition = { x: 0, y: 0, z: 0 };
    }
    static getObjectCount() {
        return this.solarObjects.length;
    }
    static isDataLoaded() {
        return this.isLoaded;
    }
    /**
     * 地球の位置を取得（デバッグ用）
     */
    static getEarthPosition() {
        return { ...this.earthPosition };
    }
}
SolarObjectsLoader.solarObjects = [];
SolarObjectsLoader.isLoaded = false;
SolarObjectsLoader.earthPosition = { x: 0, y: 0, z: 0 };
//# sourceMappingURL=SolarObjectsLoader.js.map