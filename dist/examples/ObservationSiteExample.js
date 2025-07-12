import { ObservationSiteController } from '../controllers/ObservationSiteController.js';
/**
 * 観測地選択機能の使用例
 */
export class ObservationSiteExample {
    /**
     * 基本的な使用方法の例
     */
    static basicUsage() {
        console.log('🗺️ ObservationSiteController の使用例');
        // 1. 初期化
        ObservationSiteController.initialize();
        // 2. 定義済み観測地のリストを取得
        const sites = ObservationSiteController.getPredefinedSites();
        console.log('定義済み観測地:', sites);
        // 3. 新しい観測地を追加
        ObservationSiteController.addPredefinedSite('富士山頂', 35.36, 138.73, 9);
        // 4. URLパラメータから観測地を設定（例：東京）
        ObservationSiteController.setObservationSiteFromURL(35.68, 139.76);
    }
    /**
     * 地図機能の使用例
     */
    static mapUsage() {
        // 地図での選択を開始
        // 注意：Leafletライブラリが必要
        if (typeof window.L !== 'undefined') {
            // 地図での選択を表示
            // この機能はHTMLで地図コンテナが必要
            console.log('地図での選択機能が利用可能です');
        }
        else {
            console.log('Leafletライブラリが読み込まれていません');
        }
    }
    /**
     * 現在地取得の例
     */
    static currentLocationExample() {
        // 現在地を取得するには、ユーザーが観測地選択で「現在地」を選択する必要があります
        console.log('現在地を取得するには、観測地選択で「現在地」を選択してください');
    }
    /**
     * カスタム座標設定の例
     */
    static customCoordinatesExample() {
        // 手動で座標を設定
        const customLat = 35.6581; // 東京タワー
        const customLon = 139.7454;
        ObservationSiteController.setObservationSiteFromURL(customLat, customLon);
        console.log(`カスタム座標を設定: ${customLat}°, ${customLon}°`);
    }
    /**
     * 観測地の管理例
     */
    static siteManagementExample() {
        // 新しい観測地を追加
        ObservationSiteController.addPredefinedSite('京都タワー', 34.9858, 135.7588, 9);
        ObservationSiteController.addPredefinedSite('大阪城', 34.6873, 135.5262, 9);
        // 観測地を削除
        const removed = ObservationSiteController.removePredefinedSite('京都タワー');
        console.log('京都タワーを削除:', removed);
        // 現在の定義済み観測地を取得
        const currentSites = ObservationSiteController.getPredefinedSites();
        console.log('現在の定義済み観測地:', currentSites);
    }
    /**
     * エラーハンドリングの例
     */
    static errorHandlingExample() {
        try {
            // 無効な座標を設定しようとする
            ObservationSiteController.setObservationSiteFromURL(200, 300); // 無効な座標
            // 存在しない観測地を削除しようとする
            const removed = ObservationSiteController.removePredefinedSite('存在しない場所');
            console.log('存在しない場所を削除:', removed);
        }
        catch (error) {
            console.error('エラーが発生しました:', error);
        }
    }
    /**
     * 全機能のデモ
     */
    static runFullDemo() {
        console.log('=== 観測地選択機能 デモ ===');
        this.basicUsage();
        this.mapUsage();
        this.customCoordinatesExample();
        this.siteManagementExample();
        this.errorHandlingExample();
        console.log('=== デモ完了 ===');
    }
}
// ブラウザ環境での使用例
if (typeof window !== 'undefined') {
    // ページ読み込み完了後にデモを実行
    window.addEventListener('DOMContentLoaded', () => {
        console.log('観測地選択機能のデモを開始します');
        ObservationSiteExample.runFullDemo();
    });
}
//# sourceMappingURL=ObservationSiteExample.js.map