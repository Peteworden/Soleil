import { SolarSystemDataManager } from '../models/SolarSystemObjects.js';
/**
 * 太陽系天体のアプリケーション制御クラス
 * 位置計算とUI連携に特化
 */
export class SolarSystemController {
    /**
     * 初期化（最初の読み込み時のみ実行）
     */
    static async initialize() {
        if (this.isInitialized) {
            return;
        }
        try {
            console.log('太陽系天体データを初期化中...');
            await SolarSystemDataManager.loadSolarSystemObjectElements();
            this.isInitialized = true;
            console.log('太陽系天体データの初期化が完了しました');
        }
        catch (error) {
            console.error('太陽系天体データの初期化に失敗:', error);
        }
    }
    /**
     * 観測地の惑星を取得
     */
    static getObserverPlanet() {
        return this.currentObserverPlanet;
    }
    // データ取得メソッド（SolarSystemDataManagerへの委譲）
    static getPlanets() {
        return SolarSystemDataManager.getPlanets();
    }
    static getAsteroids() {
        return SolarSystemDataManager.getAsteroids();
    }
    static getComets() {
        return SolarSystemDataManager.getComets();
    }
    static getSun() {
        return SolarSystemDataManager.getSun();
    }
    static getMoon() {
        return SolarSystemDataManager.getMoon();
    }
    static getEarth() {
        return SolarSystemDataManager.getEarth();
    }
    static getAllObjects() {
        return SolarSystemDataManager.getAllObjects();
    }
    static findObject(name) {
        return SolarSystemDataManager.findObject(name);
    }
    /**
     * 惑星名から惑星データを取得
     * @param planetName 惑星名（日本語、英語、ひらがなのいずれか）
     * @returns 惑星データ、見つからない場合はundefined
     */
    static getPlanetByName(planetName) {
        return SolarSystemDataManager.getPlanetByName(planetName);
    }
    /**
     * 惑星名から惑星データを取得（完全一致のみ）
     * @param planetName 惑星名（日本語、英語、ひらがなのいずれか）
     * @returns 惑星データ、見つからない場合はundefined
     */
    static getPlanetByExactName(planetName) {
        return SolarSystemDataManager.getPlanetByExactName(planetName);
    }
    /**
     * 惑星名の一覧を取得
     * @returns 惑星名の配列（日本語名、英語名、ひらがな名を含む）
     */
    static getPlanetNames() {
        return SolarSystemDataManager.getPlanetNames();
    }
    /**
     * 初期化状態を確認
     */
    static getInitializationStatus() {
        return this.isInitialized;
    }
}
SolarSystemController.isInitialized = false;
SolarSystemController.currentObserverPlanet = '地球';
//# sourceMappingURL=SolarSystemController.js.map