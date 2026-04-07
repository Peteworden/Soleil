import { SatelliteDataManager } from '../models/SatelliteData.js';
import { SatelliteRenderer } from '../renderer/SatelliteRenderer.js';
import { TLELoader } from '../loaders/TLELoader.js';
import { TLEData, SatellitePosition, ObservationSite, DisplaySettings, ViewState, CanvasSize } from '../types/index.js';

export class SatelliteController {
    private satelliteManager: SatelliteDataManager;
    private satelliteRenderer: SatelliteRenderer;
    private displaySettings: DisplaySettings;
    private viewState: ViewState;
    private canvasSize: CanvasSize;
    private ctx: CanvasRenderingContext2D;

    constructor(
        ctx: CanvasRenderingContext2D,
        observationSite: ObservationSite,
        displaySettings: DisplaySettings,
        viewState: ViewState,
        canvasSize: CanvasSize
    ) {
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
    updateSatellitePositions(date: Date): void {
        this.satelliteManager.updateAllPositions(date);
    }

    /**
     * 人工衛星を描画
     */
    renderSatellites(): void {
        // if (!this.displaySettings.showSatellites) {
        //     return;
        // }

        const satellites = this.satelliteManager.getAllPositions();
        this.satelliteRenderer.renderSatellites(satellites);
    }

    /**
     * CelestrakからTLEデータを読み込み
     */
    async loadSatellitesFromCelestrak(category: string): Promise<number> {
        try {
            const tles = await TLELoader.loadFromCelestrak(category);
            return this.satelliteManager.addSatellites(tles);
        } catch (error) {
            console.error('Error loading satellites from Celestrak:', error);
            return 0;
        }
    }

    /**
     * 特定の人工衛星を追加
     */
    async addSpecificSatellite(noradId: string): Promise<boolean> {
        try {
            const tle = await TLELoader.loadSpecificSatellite(noradId);
            if (tle) {
                return this.satelliteManager.addSatellite(tle);
            }
            return false;
        } catch (error) {
            console.error('Error adding specific satellite:', error);
            return false;
        }
    }

    /**
     * ファイルからTLEデータを読み込み
     */
    async loadSatellitesFromFile(file: File): Promise<number> {
        try {
            const tles = await TLELoader.loadFromFile(file);
            return this.satelliteManager.addSatellites(tles);
        } catch (error) {
            console.error('Error loading satellites from file:', error);
            return 0;
        }
    }

    /**
     * 手動でTLEデータを追加
     */
    addManualTLE(tleString: string): boolean {
        const tle = this.satelliteManager.parseTLEFromString(tleString);
        if (tle) {
            return this.satelliteManager.addSatellite(tle);
        }
        return false;
    }

    /**
     * 人工衛星を削除
     */
    removeSatellite(key: string): boolean {
        return this.satelliteManager.removeSatellite(key);
    }

    /**
     * 全人工衛星を削除
     */
    clearSatellites(): void {
        this.satelliteManager.clear();
    }

    /**
     * 観測可能な人工衛星を取得
     */
    getVisibleSatellites(): SatellitePosition[] {
        return this.satelliteManager.getVisibleSatellites();
    }

    /**
     * 人工衛星の一覧を取得
     */
    getSatelliteList(): string[] {
        return this.satelliteManager.getSatelliteList();
    }

    /**
     * 人工衛星の数を取得
     */
    getSatelliteCount(): number {
        return this.satelliteManager.getCount();
    }

    /**
     * 特定の人工衛星の位置を取得
     */
    getSatellitePosition(key: string): SatellitePosition | null {
        return this.satelliteManager.getSatellitePosition(key);
    }

    /**
     * 観測地点を更新
     */
    updateObservationSite(site: ObservationSite): void {
        this.satelliteManager.updateObservationSite(site);
    }

    /**
     * 表示設定を更新
     */
    updateDisplaySettings(settings: DisplaySettings): void {
        this.displaySettings = settings;
    }

    /**
     * ビューステートを更新
     */
    updateViewState(viewState: ViewState): void {
        this.viewState = viewState;
        this.satelliteRenderer.updateViewState(viewState);
    }

    /**
     * キャンバスサイズを更新
     */
    updateCanvasSize(canvasSize: CanvasSize): void {
        this.canvasSize = canvasSize;
        this.satelliteRenderer.updateCanvasSize(canvasSize);
    }

    /**
     * 利用可能なTLEカテゴリを取得
     */
    getAvailableCategories(): { name: string; url: string; description: string }[] {
        return TLELoader.getAvailableCategories();
    }

    /**
     * TLEデータをファイルに保存
     */
    saveSatellitesToFile(filename: string): void {
        const satellites = Array.from(this.satelliteManager['satellites'].values());
        const tles = satellites.map(sat => sat.tle);
        TLELoader.saveToFile(tles, filename);
    }

    /**
     * 人工衛星の情報を取得
     */
    getSatelliteInfo(key: string): { name: string; noradId?: string; tle: TLEData } | null {
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
    calculateOrbitPrediction(key: string, hours: number): SatellitePosition[] {
        // 将来の機能として実装予定
        return [];
    }
} 