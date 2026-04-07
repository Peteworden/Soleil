import { ConstellationBoundaryData, ConstellationData, StarName } from "../types/index.js";
import { HipStar, MessierObject, NGCObject, SharplessObject } from "./CelestialObject";

export class DataStore {
    static hipStars: HipStar[] = [];
    static gaia100Data: number[][] = [];
    static gaia101_110Data: number[][] = [];
    static gaia111_120Data: number[][] = [];
    static constellationData: ConstellationData[] = [];
    static constellationBoundariesData: ConstellationBoundaryData[] = [];
    static messierData: MessierObject[] = [];
    static recData: MessierObject[] = [];
    static ngcData: NGCObject[] = [];
    static icData: NGCObject[] = [];
    static sharplessData: SharplessObject[] = [];
    static starNames: StarName[] = [];
    static artemisEphemerides: number[][] = [];

    // メシエデータ管理メソッド
    static getRecData(): MessierObject[] {
        return this.recData;
    }

    static setRecData(data: MessierObject[]): void {
        this.recData = data;
    }

    static addRecObject(object: MessierObject): void {
        this.recData.push(object);
    }

    static removeRecObject(name: string): boolean {
        const index = this.recData.findIndex(obj => obj.getName() === name);
        if (index !== -1) {
            this.recData.splice(index, 1);
            return true;
        }
        return false;
    }

    static addRecObjectAndRender(object: MessierObject): void {
        this.addRecObject(object);
        this.triggerRenderUpdate();
    }

    // nameには変更前の名前が入ることを想定している
    static updateRecObjectAndRender(name: string, object: MessierObject): void {
        const index = this.recData.findIndex(obj => obj.getName() == name);
        if (name.length === 0 || index === -1) {
            this.recData.push(object);
        } else {
            this.recData[index] = object;
        }
        this.triggerRenderUpdate();
    }

    // レンダリング更新をトリガーするメソッド
    static triggerRenderUpdate(): void {
        if ((window as any).renderAll) {
            (window as any).renderAll();
        }
    }
}