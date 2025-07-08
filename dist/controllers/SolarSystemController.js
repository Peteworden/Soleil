import { SolarSystemDataManager } from '../models/SolarSystemObjects.js';
import { SolarSystemPositionCalculator } from '../utils/SolarSystemPositionCalculator.js';
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
     * 観測地の惑星を設定
     */
    // static setObserverPlanet(planetName?: string): void {
    //     if (planetName) {
    //         this.currentObserverPlanet = planetName;
    //         SolarSystemPositionCalculator.setObserverPlanet(this.currentObserverPlanet);
    //         console.log(`観測地を「${this.currentObserverPlanet}」に設定しました`);
    //     } else {
    //         const config = (window as any).config;
    //         if (config && config.observationSite && config.observationSite.observerPlanet) {
    //             this.currentObserverPlanet = config.observationSite.observerPlanet;
    //             SolarSystemPositionCalculator.setObserverPlanet(this.currentObserverPlanet);
    //             console.log(`観測地を「${this.currentObserverPlanet}」に設定しました`);
    //         } else {
    //             this.currentObserverPlanet = '地球';
    //             SolarSystemPositionCalculator.setObserverPlanet(this.currentObserverPlanet);
    //             console.log(`観測地を「${this.currentObserverPlanet}」に設定しました`);
    //         }
    //     }
    // }
    /**
     * 観測地の惑星を取得
     */
    static getObserverPlanet() {
        return this.currentObserverPlanet;
    }
    /**
     * 時刻変更時の位置計算処理
     */
    // static updatePositions(jd: number): void {
    //     if (!this.isInitialized) {
    //         console.warn('太陽系天体データが初期化されていません');
    //         return;
    //     }
    //     console.log(`時刻 ${jd} における天体位置を更新中...`);
    //     const allObjects = SolarSystemDataManager.getAllObjects();
    //     SolarSystemPositionCalculator.updateAllRaDec(allObjects, jd);
    //     console.log('天体位置の更新が完了しました');
    // }
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
    /**
     * デバッグ情報を表示
     */
    static debugInfo() {
        if (!this.isInitialized) {
            console.log('太陽系天体データは初期化されていません');
            return;
        }
        const planets = this.getPlanets();
        const asteroids = this.getAsteroids();
        const comets = this.getComets();
        const sun = this.getSun();
        const moon = this.getMoon();
        console.log('=== 太陽系天体デバッグ情報 ===');
        console.log(`観測地: ${this.currentObserverPlanet}`);
        console.log(`惑星: ${planets.length}個`);
        console.log(`小惑星: ${asteroids.length}個`);
        console.log(`彗星: ${comets.length}個`);
        console.log(`太陽: ${sun ? 'あり' : 'なし'}`);
        console.log(`月: ${moon ? 'あり' : 'なし'}`);
        // 惑星の位置情報を表示
        planets.forEach(planet => {
            const coords = planet.raDec;
            const distance = planet.distance;
            const magnitude = planet.magnitude;
            console.log(`${planet.jpnName}: RA=${coords.ra.toFixed(2)}°, Dec=${coords.dec.toFixed(2)}°, 距離=${distance?.toFixed(3) || 'N/A'} AU, 等級=${magnitude?.toFixed(2) || 'N/A'}`);
        });
    }
    /**
     * 観測地惑星の位置を取得（デバッグ用）
     */
    static getObserverPlanetPosition() {
        return SolarSystemPositionCalculator.getObserverPlanetPosition();
    }
}
SolarSystemController.isInitialized = false;
SolarSystemController.currentObserverPlanet = '地球';
//# sourceMappingURL=SolarSystemController.js.map