import { CartesianCoords, LstLat } from "../types";
import { Asteroid, Comet, Moon, Planet, SolarSystemObject, SolarSystemObjectBase, Sun } from "../models/SolarSystemObjects";
import { SolarSystemPositionCalculator } from "./SolarSystemPositionCalculator";
import { RaDec } from "./coordinates/index";

/**
 * 太陽系天体データ管理クラス
 * データの読み込み、保存、検索、分類を統合管理
 */
export class SolarSystemManager {
    private static solarObjects: SolarSystemObjectBase[] = [];

    static async initialize(jd: number, observerPlanet: string, lat: number, siderealTime: number): Promise<void> {
        await this.loadSolarSystemObjectElements();
        this.updateAllData(jd, observerPlanet, lat, siderealTime);
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
            this.solarObjects = data.map(d => this.createSpecificClassObject(d));

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

    static updateAllData(jd: number, observer: string | CartesianCoords, lat: number, siderealTime: number): void {
        SolarSystemPositionCalculator.updateAllData(this.solarObjects, jd, observer, lat, siderealTime);
    }

    /**
     * UserObjectControllerで使用
     * @param name 
     * @param object 
     */
    static updateObject(name: string, object: SolarSystemObjectBase, jd: number, observerPlanet: string, lat: number, siderealTime: number): void {
        const index = this.solarObjects.findIndex(obj => obj.jpnName === name);
        if (name.length === 0 || index === -1) {
            this.solarObjects.push(object);
        } else {
            this.solarObjects[index] = object;
        }
        this.updateAllData(jd, observerPlanet, lat, siderealTime);
    }

    static createSpecificClassObject(data: SolarSystemObject): SolarSystemObjectBase {
        if (data.type === 'sun') {
            return new Sun(data);
        } else if (data.type === 'moon') {
            return new Moon(data);
        } else if (data.type === 'planet') {
            return new Planet(data);
        } else if (data.type === 'asteroid') {
            return new Asteroid(data);
        } else if (data.type === 'comet') {
            return new Comet(data);
        } else {
            throw new Error(`Unknown solar system object type: ${(data as any).type}`);
        }
    }

    /**
     * 全ての天体を取得
     * SearchController, CanvasRendererで使用
     */
    static getAllObjects(): SolarSystemObjectBase[] {
        return [...this.solarObjects];
    }

    static getSun(): Sun {
        return this.solarObjects.find(obj => obj.type === 'sun') as Sun;
    }

    static getTwilight(lstLat: LstLat): string {
        const sun = this.getSun();
        if (!sun) return '';
        const sunRaDec = sun.getRaDec();
        const sunAltitude = RaDec.toAzalt(sunRaDec, lstLat).alt;
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