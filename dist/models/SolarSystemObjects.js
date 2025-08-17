import { SolarSystemPositionCalculator } from '../utils/SolarSystemPositionCalculator.js';
import { DataStore } from './DataStore.js';
// 共通プロパティ
export class SolarSystemObjectBase {
    constructor(data) {
        this.jpnName = data.jpnName;
        this.hiraganaName = data.hiraganaName;
        this.engName = data.engName;
        this.type = data.type;
        this.xyz = data.xyz;
        this.raDec = data.raDec;
        this.distance = data.distance;
        this.magnitude = data.magnitude;
    }
    updatePosition(jd) {
        // ダミー実装
    }
    getJapaneseName() {
        return this.jpnName;
    }
    getHiraganaName() {
        return this.hiraganaName;
    }
    getEnglishName() {
        return this.engName;
    }
    getType() {
        return this.type;
    }
    getXYZ() {
        return this.xyz;
    }
    getRaDec() {
        return this.raDec;
    }
    getDistance() {
        return this.distance;
    }
    getMagnitude() {
        return this.magnitude;
    }
}
export class Sun extends SolarSystemObjectBase {
    constructor(data) {
        super(data);
    }
    updatePosition(jd) {
        // 空実装
    }
}
export class Moon extends SolarSystemObjectBase {
    constructor(data) {
        super(data);
        this.Ms = 0;
        this.ws = 0;
        this.lon_moon = 0;
        this.lat_moon = 0;
        this.Ms = data.Ms || 0;
        this.ws = data.ws || 0;
        this.lon_moon = data.lon_moon || 0;
        this.lat_moon = data.lat_moon || 0;
    }
    updatePosition(jd) {
        // 空実装
    }
}
export class Planet extends SolarSystemObjectBase {
    constructor(data) {
        super(data);
        this.orbit = data.orbit;
    }
    updatePosition(jd) {
        // 空実装
    }
}
export class Asteroid extends SolarSystemObjectBase {
    constructor(data) {
        super(data);
        this.orbit = data.orbit;
    }
    updatePosition(jd) {
        // 空実装
    }
}
export class Comet extends SolarSystemObjectBase {
    constructor(data) {
        super(data);
        this.orbit = data.orbit;
    }
    updatePosition(jd) {
        // 空実装
    }
}
// 型ガード
export function isPlanet(obj) {
    return obj.type === 'planet';
}
export function isAsteroid(obj) {
    return obj.type === 'asteroid';
}
export function isComet(obj) {
    return obj.type === 'comet';
}
export function isMinorObject(obj) {
    return obj.type === 'asteroid' || obj.type === 'comet';
}
export function isSun(obj) {
    return obj.type === 'sun';
}
export function isMoon(obj) {
    return obj.type === 'moon';
}
export function isOrbitalObject(obj) {
    return 'orbit' in obj;
}
// // ファクトリー関数
export class SolarSystemObjectFactory {
    static create(data) {
        if (isSun(data)) {
            return new Sun(data);
        }
        else if (isMoon(data)) {
            return new Moon(data);
        }
        else if (isPlanet(data)) {
            return new Planet(data);
        }
        else if (isAsteroid(data)) {
            return new Asteroid(data);
        }
        else if (isComet(data)) {
            return new Comet(data);
        }
        else {
            throw new Error(`Unknown solar system object type: ${data.type}`);
        }
    }
    static createFromArray(dataArray) {
        return dataArray.map(data => this.create(data));
    }
}
/**
 * 太陽系天体データ管理クラス
 * データの読み込み、保存、検索、分類を統合管理
 */
export class SolarSystemDataManager {
    /**
     * solarObjects.jsonからデータを読み込む（最初の読み込み時のみ）
     */
    static async loadSolarSystemObjectElements() {
        if (this.isLoaded) {
            console.log('太陽系天体データはすでに読み込まれています');
            return;
        }
        try {
            const response = await fetch('./data/solarObjects.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.solarObjects = SolarSystemObjectFactory.createFromArray(data);
            const userObjects = localStorage.getItem('userObject');
            if (userObjects) {
                const userObjectsData = JSON.parse(userObjects);
                if (userObjectsData && userObjectsData.userSolarSystem) {
                    for (const item of userObjectsData.userSolarSystem) {
                        const object = item.content;
                        if (object.orbit != null) {
                            this.solarObjects.push(SolarSystemObjectFactory.create(object));
                        }
                        else {
                            userObjectsData.userSolarSystem.splice(userObjectsData.userSolarSystem.indexOf(item), 1);
                        }
                    }
                }
                localStorage.setItem('userObject', JSON.stringify(userObjectsData));
            }
            this.isLoaded = true;
        }
        catch (error) {
            console.error('太陽系天体データの読み込みに失敗:', error);
        }
    }
    static updateAllData(jd, observationSite) {
        SolarSystemPositionCalculator.updateAllData(this.solarObjects, jd, observationSite);
    }
    static addObjectAndRender(object) {
        this.solarObjects.push(object);
        DataStore.triggerRenderUpdate();
    }
    static removeObject(object) {
        this.solarObjects = this.solarObjects.filter(obj => obj !== object);
    }
    static updateObjectAndRender(name, object) {
        const index = this.solarObjects.findIndex(obj => obj.jpnName === name);
        if (name.length === 0 || index === -1) {
            this.solarObjects.push(object);
        }
        else {
            this.solarObjects[index] = object;
        }
        DataStore.triggerRenderUpdate();
    }
    // 天体の取得メソッド
    static getObjects() {
        return this.solarObjects;
    }
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
    // 統合検索メソッド
    static findObject(name) {
        return this.findByName(name) ||
            this.findByEnglishName(name) ||
            this.findByHiraganaName(name);
    }
    /**
     * 惑星名から惑星データを取得
     * @param planetName 惑星名（日本語、英語、ひらがなのいずれか）
     * @returns 惑星データ、見つからない場合はundefined
     */
    static getPlanetByName(planetName) {
        const planets = this.getPlanets();
        return planets.find(planet => planet.jpnName === planetName ||
            planet.engName === planetName ||
            planet.hiraganaName === planetName ||
            planet.jpnName.includes(planetName) ||
            planet.engName.includes(planetName) ||
            planet.hiraganaName.includes(planetName));
    }
    /**
     * 惑星名から惑星データを取得（完全一致のみ）
     * @param planetName 惑星名（日本語、英語、ひらがなのいずれか）
     * @returns 惑星データ、見つからない場合はundefined
     */
    static getPlanetByExactName(planetName) {
        const planets = this.getPlanets();
        return planets.find(planet => planet.jpnName === planetName ||
            planet.engName === planetName ||
            planet.hiraganaName === planetName);
    }
    /**
     * 惑星名の一覧を取得
     * @returns 惑星名の配列（日本語名、英語名、ひらがな名を含む）
     */
    static getPlanetNames() {
        const planets = this.getPlanets();
        return planets.map(planet => ({
            japanese: planet.jpnName,
            english: planet.engName,
            hiragana: planet.hiraganaName
        }));
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
     * SearchController, CanvasRendererで使用
     */
    static getAllObjects() {
        return [...this.solarObjects];
    }
}
SolarSystemDataManager.solarObjects = [];
SolarSystemDataManager.isLoaded = false;
//# sourceMappingURL=SolarSystemObjects.js.map