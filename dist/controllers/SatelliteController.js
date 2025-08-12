import { SatelliteDataManager } from '../models/SatelliteData.js';
import { SatelliteRenderer } from '../renderer/SatelliteRenderer.js';
import { TLELoader } from '../utils/TLELoader.js';
export class SatelliteController {
    constructor(ctx, observationSite, displaySettings, viewState, canvasSize) {
        this.ctx = ctx;
        this.displaySettings = displaySettings;
        this.viewState = viewState;
        this.canvasSize = canvasSize;
        this.satelliteManager = new SatelliteDataManager(observationSite);
        this.satelliteRenderer = new SatelliteRenderer(ctx, canvasSize, viewState);
    }
    /**
     * 人工衛星の位置を更新
     */
    updateSatellitePositions(date) {
        this.satelliteManager.updateAllPositions(date);
    }
    /**
     * 人工衛星を描画
     */
    renderSatellites() {
        // if (!this.displaySettings.showSatellites) {
        //     return;
        // }
        const satellites = this.satelliteManager.getAllPositions();
        this.satelliteRenderer.renderSatellites(satellites);
    }
    /**
     * CelestrakからTLEデータを読み込み
     */
    async loadSatellitesFromCelestrak(category) {
        try {
            const tles = await TLELoader.loadFromCelestrak(category);
            return this.satelliteManager.addSatellites(tles);
        }
        catch (error) {
            console.error('Error loading satellites from Celestrak:', error);
            return 0;
        }
    }
    /**
     * 特定の人工衛星を追加
     */
    async addSpecificSatellite(noradId) {
        try {
            const tle = await TLELoader.loadSpecificSatellite(noradId);
            if (tle) {
                return this.satelliteManager.addSatellite(tle);
            }
            return false;
        }
        catch (error) {
            console.error('Error adding specific satellite:', error);
            return false;
        }
    }
    /**
     * ファイルからTLEデータを読み込み
     */
    async loadSatellitesFromFile(file) {
        try {
            const tles = await TLELoader.loadFromFile(file);
            return this.satelliteManager.addSatellites(tles);
        }
        catch (error) {
            console.error('Error loading satellites from file:', error);
            return 0;
        }
    }
    /**
     * 手動でTLEデータを追加
     */
    addManualTLE(tleString) {
        const tle = this.satelliteManager.parseTLEFromString(tleString);
        if (tle) {
            return this.satelliteManager.addSatellite(tle);
        }
        return false;
    }
    /**
     * 人工衛星を削除
     */
    removeSatellite(key) {
        return this.satelliteManager.removeSatellite(key);
    }
    /**
     * 全人工衛星を削除
     */
    clearSatellites() {
        this.satelliteManager.clear();
    }
    /**
     * 観測可能な人工衛星を取得
     */
    getVisibleSatellites() {
        return this.satelliteManager.getVisibleSatellites();
    }
    /**
     * 人工衛星の一覧を取得
     */
    getSatelliteList() {
        return this.satelliteManager.getSatelliteList();
    }
    /**
     * 人工衛星の数を取得
     */
    getSatelliteCount() {
        return this.satelliteManager.getCount();
    }
    /**
     * 特定の人工衛星の位置を取得
     */
    getSatellitePosition(key) {
        return this.satelliteManager.getSatellitePosition(key);
    }
    /**
     * 観測地点を更新
     */
    updateObservationSite(site) {
        this.satelliteManager.updateObservationSite(site);
    }
    /**
     * 表示設定を更新
     */
    updateDisplaySettings(settings) {
        this.displaySettings = settings;
    }
    /**
     * ビューステートを更新
     */
    updateViewState(viewState) {
        this.viewState = viewState;
        this.satelliteRenderer.updateViewState(viewState);
    }
    /**
     * キャンバスサイズを更新
     */
    updateCanvasSize(canvasSize) {
        this.canvasSize = canvasSize;
        this.satelliteRenderer.updateCanvasSize(canvasSize);
    }
    /**
     * 利用可能なTLEカテゴリを取得
     */
    getAvailableCategories() {
        return TLELoader.getAvailableCategories();
    }
    /**
     * TLEデータをファイルに保存
     */
    saveSatellitesToFile(filename) {
        const satellites = Array.from(this.satelliteManager['satellites'].values());
        const tles = satellites.map(sat => sat.tle);
        TLELoader.saveToFile(tles, filename);
    }
    /**
     * 人工衛星の情報を取得
     */
    getSatelliteInfo(key) {
        const satelliteData = this.satelliteManager['satellites'].get(key);
        if (satelliteData) {
            return {
                name: satelliteData.position.name,
                noradId: satelliteData.position.noradId,
                tle: satelliteData.tle
            };
        }
        return null;
    }
    /**
     * 人工衛星の軌道予測を計算（将来の機能）
     */
    calculateOrbitPrediction(key, hours) {
        // 将来の機能として実装予定
        return [];
    }
}
//# sourceMappingURL=SatelliteController.js.map