import { SolarSystemPositionCalculator } from '../utils/SolarSystemPositionCalculator.js';
// import { EllipticOrbitalElements, ParabolicOrHyperbolicOrbitalElements, PlanetOrbitalElements, SolarObjectType } from '../types/solarObjects.js';
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
    return obj.type === 'asteroid' || obj.type === 'comet' || obj.type === 'planet';
}
/**
 * 太陽系天体データ管理クラス
 * データの読み込み、保存、検索、分類を統合管理
 */
export class SolarSystemDataManager {
    static async initialize() {
        await this.loadSolarSystemObjectElements();
        const config = window.config;
        if (config) {
            this.updateAllData(config.displayTime.jd, config.observationSite);
        }
    }
    /**
     * solarObjects.jsonからデータを読み込む（最初の読み込み時のみ）
     */
    static async loadSolarSystemObjectElements() {
        try {
            const response = await fetch('./data/solarObjects.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.solarObjects = this.createSpecificClassObjectFromArray(data);
            const userObjects = localStorage.getItem('userObject');
            if (userObjects) {
                const userObjectsData = JSON.parse(userObjects);
                if (userObjectsData && userObjectsData.userSolarSystem) {
                    for (const item of userObjectsData.userSolarSystem) {
                        const object = item.content;
                        if (object.orbit != null) {
                            this.solarObjects.push(this.createSpecificClassObject(object));
                        }
                        else {
                            userObjectsData.userSolarSystem.splice(userObjectsData.userSolarSystem.indexOf(item), 1);
                        }
                    }
                }
                localStorage.setItem('userObject', JSON.stringify(userObjectsData));
            }
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
    static createSpecificClassObject(data) {
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
    static createSpecificClassObjectFromArray(dataArray) {
        return dataArray.map(data => this.createSpecificClassObject(data));
    }
    /**
     * 全ての天体を取得
     * SearchController, CanvasRendererで使用
     */
    static getAllObjects() {
        return [...this.solarObjects];
    }
    static getSun() {
        return this.solarObjects.find(obj => isSun(obj));
    }
    static getTwilight() {
        const sun = this.getSun();
        if (!sun)
            return '';
        const sunRaDec = sun.getRaDec();
        const latitude = window.config.observationSite.latitude;
        const siderealTime = window.config.siderealTime;
        const lstLat = { lst: siderealTime, lat: latitude };
        const sunAltitude = sunRaDec.toAzAlt(lstLat).alt;
        let twilight = '';
        if (sunAltitude > -0.84) {
            twilight = '昼';
        }
        else if (sunAltitude > -6) {
            twilight = '常用薄明';
        }
        else if (sunAltitude > -12) {
            twilight = '航海薄明';
        }
        else if (sunAltitude > -18) {
            twilight = '天文薄明';
        }
        else if (sunAltitude <= -18) {
            twilight = '深夜';
        }
        else {
            twilight = '';
        }
        return twilight;
    }
}
SolarSystemDataManager.solarObjects = [];
//# sourceMappingURL=SolarSystemObjects.js.map