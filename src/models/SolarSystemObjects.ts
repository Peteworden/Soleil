import { SolarSystemPositionCalculator } from '../core/SolarSystemPositionCalculator.js';
import { DataStore } from './DataStore.js';
import { Cartesian, RaDec } from '../core/coordinates/index.js';

type SolarObjectType = 'sun' | 'planet' | 'moon' | 'asteroid' | 'comet';

interface OrbitalElementsCore {
    t0: number;        // 元期（ユリウス日）
    e: number;         // 離心率
    incl: number;      // 軌道傾斜角（度）
    node: number;      // 昇交点黄経（度）
}

export interface PlanetOrbitalElements extends OrbitalElementsCore {
    a: number;         // 軌道長半径（AU）
    meanLong: number;  // 平均黄経（度）
    longPeri: number;  // 近日点黄経（度）
    da: number;        // 軌道長半径の変化率
    de: number;        // 離心率の変化率
    dIncl: number;     // 軌道傾斜角の変化率
    dMeanLong: number; // 平均黄経の変化率
    dLongPeri: number; // 近日点黄経の変化率
    dNode: number;     // 昇交点黄経の変化率
    // 木星・土星・天王星・海王星用の追加項
    sup1?: number;
    sup2?: number;
    sup3?: number;
    sup4?: number;
}

export interface EllipticOrbitalElements extends OrbitalElementsCore {
    a: number;         // 軌道長半径（AU）
    peri: number;      // 近日点引数（度）
    m0: number;        // 元期の平均近点角（度）
    H?: number;        // 絶対等級
    G?: number;        // 位相係数
}

export interface ParabolicOrHyperbolicOrbitalElements extends OrbitalElementsCore {
    q: number;         // 近日点距離（AU）
    peri: number;      // 近日点引数（度）
    H?: number;        // 絶対等級
    G?: number;        // 位相係数
}

// 共通プロパティ
export class SolarSystemObjectBase {
    jpnName: string;
    hiraganaName: string;
    engName: string;
    type: SolarObjectType;
    xyz: Cartesian; // 日心赤道直交座標
    raDec: RaDec; // 観測地から見た赤道座標
    distance: number; // 観測地からの距離（au)
    magnitude: number | undefined;
    constructor(data: any) {
        this.jpnName = data.jpnName;
        this.hiraganaName = data.hiraganaName;
        this.engName = data.engName;
        this.type = data.type;
        this.xyz = data.xyz;
        this.raDec = data.raDec;
        this.distance = data.distance;
        this.magnitude = data.magnitude;
    }

    getJapaneseName(): string {
        return this.jpnName;
    }

    getHiraganaName(): string {
        return this.hiraganaName;
    }

    getEnglishName(): string {
        return this.engName;
    }

    getType(): string {
        return this.type;
    }

    getXYZ(): Cartesian {
        return this.xyz;
    }

    getRaDec(): RaDec {
        return this.raDec;
    }

    getDistance(): number {
        return this.distance;
    }

    getMagnitude(): number | undefined {
        return this.magnitude ?? undefined;
    }
}

export class Sun extends SolarSystemObjectBase {
    constructor(data: any) {
        super(data);
        this.type = 'sun';
        this.magnitude = -26.74;
    }
}

export class Moon extends SolarSystemObjectBase {
    Ms: number = 0;
    ws: number = 0;
    lon_moon: number = 0;
    lat_moon: number = 0;
    constructor(data: any) {
        super(data);
        this.type = 'moon';
        this.magnitude = -12.74;
        this.Ms = data.Ms || 0;
        this.ws = data.ws || 0;
        this.lon_moon = data.lon_moon || 0;
        this.lat_moon = data.lat_moon || 0;
    }
}

export class Planet extends SolarSystemObjectBase {
    orbit: PlanetOrbitalElements;
    constructor(data: any) {
        super(data);
        this.type = 'planet';
        this.orbit = data.orbit;
    }
    updatePosition(jd: number): void {
        // 空実装
    }
}

export class Asteroid extends SolarSystemObjectBase {
    orbit: EllipticOrbitalElements;
    constructor(data: any) {
        super(data);
        this.type = 'asteroid';
        this.orbit = data.orbit;
    }
}

export class Comet extends SolarSystemObjectBase {
    orbit: EllipticOrbitalElements | ParabolicOrHyperbolicOrbitalElements;
    constructor(data: any) {
        super(data);
        this.type = 'comet';
        this.orbit = data.orbit;
    }
}

export type SolarSystemObject = Sun | Moon | Planet | Asteroid | Comet;
export type MinorObject = Asteroid | Comet;
export type OrbitalObject = Planet | Asteroid | Comet;

// 型ガード
export function isPlanet(obj: SolarSystemObjectBase): obj is Planet {
    return obj.type === 'planet';
}
export function isAsteroid(obj: SolarSystemObjectBase): obj is Asteroid {
    return obj.type === 'asteroid';
}
export function isComet(obj: SolarSystemObjectBase): obj is Comet {
    return obj.type === 'comet';
}
export function isMinorObject(obj: SolarSystemObjectBase): obj is MinorObject {
    return obj.type === 'asteroid' || obj.type === 'comet';
}
export function isSun(obj: SolarSystemObjectBase): obj is Sun {
    return obj.type === 'sun';
}
export function isMoon(obj: SolarSystemObjectBase): obj is Moon {
    return obj.type === 'moon';
}
export function isOrbitalObject(obj: SolarSystemObjectBase): obj is OrbitalObject {
    return obj.type === 'asteroid' || obj.type === 'comet' || obj.type === 'planet';
}

/**
 * 太陽系天体データ管理クラス
 * データの読み込み、保存、検索、分類を統合管理
 */
export class SolarSystemDataManager {
    private static solarObjects: SolarSystemObjectBase[] = [];

    static async initialize(): Promise<void> {
        await this.loadSolarSystemObjectElements();
        const config = (window as any).config;
        if (config) {
            this.updateAllData(config.displayTime.jd, config.observationSite.observerPlanet);
        }
    }

    /**
     * solarObjects.jsonからデータを読み込む（最初の読み込み時のみ）
     */
    static async loadSolarSystemObjectElements(): Promise<void> {
        try {
            const response = await fetch('./data/solarObjects.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data: SolarSystemObject[] = await response.json();
            this.solarObjects = this.createSpecificClassObjectFromArray(data);

            const userObjects = localStorage.getItem('userObject');
            if (userObjects) {
                const userObjectsData = JSON.parse(userObjects);
                if (userObjectsData && userObjectsData.userSolarSystem) {
                    for (const item of userObjectsData.userSolarSystem) {
                        const object = item.content;
                        if (object.orbit != null) {
                            this.solarObjects.push(this.createSpecificClassObject(object));
                        } else {
                            userObjectsData.userSolarSystem.splice(userObjectsData.userSolarSystem.indexOf(item), 1);
                        }
                    }
                }
                localStorage.setItem('userObject', JSON.stringify(userObjectsData));
            }
        } catch (error) {
            console.error('太陽系天体データの読み込みに失敗:', error);
        }
    }

    static updateAllData(jd: number, observer: string | Cartesian): void {
        SolarSystemPositionCalculator.updateAllData(this.solarObjects, jd, observer);
    }

    static addObjectAndRender(object: SolarSystemObjectBase): void {
        this.solarObjects.push(object);
        DataStore.triggerRenderUpdate();
    }


    /**
     * UserObjectControllerで使用
     * @param name 
     * @param object 
     */
    static updateObjectAndRender(name: string, object: SolarSystemObjectBase): void {
        const index = this.solarObjects.findIndex(obj => obj.jpnName === name);
        if (name.length === 0 || index === -1) {
            this.solarObjects.push(object);
        } else {
            this.solarObjects[index] = object;
        }
        this.updateAllData((window as any).config.displayTime.jd, (window as any).config.observationSite.observerPlanet);
        DataStore.triggerRenderUpdate();
    }

    static createSpecificClassObject(data: SolarSystemObject): SolarSystemObjectBase {
        if (isSun(data)) {
            return new Sun(data);
        } else if (isMoon(data)) {
            return new Moon(data);
        } else if (isPlanet(data)) {
            return new Planet(data);
        } else if (isAsteroid(data)) {
            return new Asteroid(data);
        } else if (isComet(data)) {
            return new Comet(data);
        } else {
            throw new Error(`Unknown solar system object type: ${(data as any).type}`);
        }
    }

    static createSpecificClassObjectFromArray(dataArray: SolarSystemObject[]): SolarSystemObjectBase[] {
        return dataArray.map(data => this.createSpecificClassObject(data));
    }

    /**
     * 全ての天体を取得
     * SearchController, CanvasRendererで使用
     */
    static getAllObjects(): SolarSystemObjectBase[] {
        return [...this.solarObjects];
    }
    
    static getSun(): Sun {
        return this.solarObjects.find(obj => isSun(obj)) as Sun;
    }

    static getTwilight(): string {
        const sun = this.getSun();
        if (!sun) return '';
        const sunRaDec = sun.getRaDec();
        const latitude = (window as any).config.observationSite.latitude;
        const siderealTime = (window as any).config.siderealTime;
        const lstLat = { lst: siderealTime, lat: latitude };
        const sunAltitude = sunRaDec.toAzAlt(lstLat).alt;
        let twilight = '';
        if (sunAltitude > -0.84) {
            twilight = '昼';
        } else if (sunAltitude > -6) {
            twilight = '常用薄明';
        } else if (sunAltitude > -12) {
            twilight = '航海薄明';
        } else if (sunAltitude > -18) {
            twilight = '天文薄明';
        } else if (sunAltitude <= -18) {
            twilight = '深夜';
        } else {
            twilight = '';
        }
        return twilight;
    }
} 