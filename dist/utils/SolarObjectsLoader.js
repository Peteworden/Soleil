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
}
SolarObjectsLoader.solarObjects = [];
SolarObjectsLoader.isLoaded = false;
//# sourceMappingURL=SolarObjectsLoader.js.map