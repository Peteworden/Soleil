import { ObservationSiteController } from '../controllers/ObservationSiteController.js';
/**
 * 観測地選択機能の統合例
 * 既存のアプリケーションにObservationSiteControllerを統合する方法を示します
 */
export class ObservationSiteIntegration {
    /**
     * アプリケーションの初期化時に呼び出す
     */
    static initializeWithApp() {
        console.log('🔧 Initializing ObservationSiteController with application...');
        // 観測地選択機能を初期化
        ObservationSiteController.initialize();
        // 既存の設定読み込み処理と統合
        this.integrateWithExistingSettings();
        // URLパラメータの処理
        this.handleURLParameters();
        console.log('✅ ObservationSiteController integrated successfully');
    }
    /**
     * 既存の設定システムとの統合
     */
    static integrateWithExistingSettings() {
        // 既存の設定読み込み処理がある場合の統合例
        const existingConfig = window.config;
        if (existingConfig && existingConfig.observationSite) {
            console.log('🔧 Integrating with existing config:', existingConfig.observationSite);
            // 既存の設定を観測地コントローラーに反映
            const { latitude, longitude } = existingConfig.observationSite;
            if (latitude && longitude) {
                ObservationSiteController.setObservationSiteFromURL(latitude, longitude);
            }
        }
    }
    /**
     * URLパラメータの処理
     */
    static handleURLParameters() {
        const url = new URL(window.location.href);
        const latParam = url.searchParams.get('lat');
        const lonParam = url.searchParams.get('lon');
        if (latParam && lonParam) {
            const lat = parseFloat(latParam);
            const lon = parseFloat(lonParam);
            if (!isNaN(lat) && !isNaN(lon)) {
                console.log(`🔧 Setting observation site from URL: ${lat}°, ${lon}°`);
                ObservationSiteController.setObservationSiteFromURL(lat, lon);
            }
        }
    }
    /**
     * 設定画面との統合
     */
    static integrateWithSettingsPanel() {
        // 設定画面が開かれたときの処理
        const settingButton = document.getElementById('setting-btn');
        if (settingButton) {
            settingButton.addEventListener('click', () => {
                console.log('🔧 Settings panel opened, ensuring observation site controls are ready');
                // 観測地選択の状態を確認・更新
                this.refreshObservationSiteDisplay();
            });
        }
    }
    /**
     * 観測地表示の更新
     */
    static refreshObservationSiteDisplay() {
        // 現在の設定に基づいて観測地選択の表示を更新
        const config = window.config;
        if (config && config.observationSite) {
            const { latitude, longitude } = config.observationSite;
            // UI要素の更新
            const latInput = document.getElementById('lat');
            const lonInput = document.getElementById('lon');
            const nsSelect = document.getElementById('NSCombo');
            const ewSelect = document.getElementById('EWCombo');
            if (latInput && lonInput && nsSelect && ewSelect) {
                latInput.value = Math.abs(latitude).toFixed(2);
                lonInput.value = Math.abs(longitude).toFixed(2);
                nsSelect.value = latitude >= 0 ? '北緯' : '南緯';
                ewSelect.value = longitude >= 0 ? '東経' : '西経';
            }
        }
    }
    /**
     * 地図機能の統合
     */
    static integrateMapFunctionality() {
        // 地図を閉じるボタンの処理
        const closeMapButton = document.getElementById('close-map-btn');
        if (closeMapButton) {
            closeMapButton.addEventListener('click', () => {
                ObservationSiteController.closeMap();
            });
        }
        // 地図での座標選択完了時の処理
        this.setupMapCoordinateSelection();
    }
    /**
     * 地図での座標選択の設定
     */
    static setupMapCoordinateSelection() {
        // 地図で座標が選択されたときの処理
        // この処理はObservationSiteController内で既に実装されていますが、
        // 必要に応じて追加の処理をここに記述できます
        console.log('🗺️ Map coordinate selection setup completed');
    }
    /**
     * リアルタイム更新との統合
     */
    static integrateWithRealTimeUpdates() {
        // 観測地が変更されたときにリアルタイム更新をトリガー
        const originalUpdateConfig = window.updateConfig;
        if (originalUpdateConfig) {
            window.updateConfig = (newConfig) => {
                // 元の更新処理を実行
                originalUpdateConfig(newConfig);
                // 観測地が変更された場合の追加処理
                if (newConfig.observationSite) {
                    console.log('🗺️ Observation site updated, triggering real-time updates');
                    this.triggerRealTimeUpdate();
                }
            };
        }
    }
    /**
     * リアルタイム更新のトリガー
     */
    static triggerRealTimeUpdate() {
        // 既存のリアルタイム更新処理を呼び出し
        const renderAll = window.renderAll;
        if (renderAll) {
            renderAll();
        }
        // その他の必要な更新処理
        const updateSolarSystemData = window.updateSolarSystemData;
        if (updateSolarSystemData) {
            updateSolarSystemData();
        }
    }
    /**
     * エラーハンドリングの統合
     */
    static integrateErrorHandling() {
        // グローバルエラーハンドラーに観測地関連のエラー処理を追加
        window.addEventListener('error', (event) => {
            if (event.message && event.message.includes('observation')) {
                console.error('🗺️ Observation site error:', event.error);
                // エラー時のフォールバック処理
                this.handleObservationSiteError();
            }
        });
    }
    /**
     * 観測地エラーの処理
     */
    static handleObservationSiteError() {
        // デフォルトの観測地に戻す
        ObservationSiteController.setObservationSiteFromURL(35, 135);
        console.log('🗺️ Fallback to default observation site due to error');
    }
    /**
     * 完全な統合の実行
     */
    static performFullIntegration() {
        console.log('🚀 Starting full integration of ObservationSiteController...');
        // 1. 基本初期化
        this.initializeWithApp();
        // 2. 設定画面との統合
        this.integrateWithSettingsPanel();
        // 3. 地図機能の統合
        this.integrateMapFunctionality();
        // 4. リアルタイム更新との統合
        this.integrateWithRealTimeUpdates();
        // 5. エラーハンドリングの統合
        this.integrateErrorHandling();
        console.log('✅ Full integration completed successfully');
    }
}
// 自動統合（オプション）
if (typeof window !== 'undefined') {
    // DOMContentLoadedイベントで自動統合を実行
    window.addEventListener('DOMContentLoaded', () => {
        // 既存のアプリケーションの初期化が完了した後に統合を実行
        setTimeout(() => {
            ObservationSiteIntegration.performFullIntegration();
        }, 100);
    });
}
//# sourceMappingURL=ObservationSiteIntegration.js.map