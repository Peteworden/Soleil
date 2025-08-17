import { CacheInfo } from '../utils/cacheInfo.js';
export class CacheInfoController {
    /**
     * キャッシュ情報コントローラーを初期化
     */
    static initialize() {
        this.popup = document.getElementById('cacheInfoPopup');
        this.textElement = document.getElementById('cacheInfoText');
        if (!this.popup || !this.textElement) {
            console.error('キャッシュ情報ポップアップの要素が見つかりません');
            return;
        }
        // イベントリスナーを設定
        this.setupEventListeners();
        // キャッシュクリアフラグをチェック
        CacheInfo.checkCacheClearFlag();
        console.log('✅ キャッシュ情報コントローラーが初期化されました');
    }
    /**
     * イベントリスナーを設定
     */
    static setupEventListeners() {
        // キャッシュ情報ボタン
        const showCacheInfoBtn = document.getElementById('showCacheInfoBtn');
        if (showCacheInfoBtn) {
            showCacheInfoBtn.addEventListener('click', () => {
                this.showCacheInfo();
            });
        }
        // ポップアップを閉じるボタン
        const closeCacheInfoPopup = document.getElementById('closeCacheInfoPopup');
        if (closeCacheInfoPopup) {
            closeCacheInfoPopup.addEventListener('click', () => {
                this.hideCacheInfo();
            });
        }
        // 閉じるボタン
        const closeCacheInfoBtn = document.getElementById('closeCacheInfoBtn');
        if (closeCacheInfoBtn) {
            closeCacheInfoBtn.addEventListener('click', () => {
                this.hideCacheInfo();
            });
        }
        // キャッシュ強制更新ボタン
        const forceCacheUpdateBtn = document.getElementById('forceCacheUpdateBtn');
        if (forceCacheUpdateBtn) {
            forceCacheUpdateBtn.addEventListener('click', () => {
                this.forceCacheUpdate();
            });
        }
        // ページ再読み込みボタン
        const reloadCacheBtn = document.getElementById('reloadCacheBtn');
        if (reloadCacheBtn) {
            reloadCacheBtn.addEventListener('click', () => {
                this.reloadWithCacheClear();
            });
        }
        // ポップアップ外クリックで閉じる
        if (this.popup) {
            this.popup.addEventListener('click', (e) => {
                if (e.target === this.popup) {
                    this.hideCacheInfo();
                }
            });
        }
    }
    /**
     * キャッシュ情報を表示
     */
    static showCacheInfo() {
        if (!this.popup || !this.textElement) {
            console.error('キャッシュ情報ポップアップの要素が見つかりません');
            return;
        }
        try {
            // キャッシュ情報を取得
            const cacheInfo = CacheInfo.showCacheInfo();
            // テキストを設定
            this.textElement.textContent = cacheInfo;
            // ポップアップを表示
            this.popup.style.display = 'flex';
            console.log('📄 キャッシュ情報を表示しました');
        }
        catch (error) {
            console.error('キャッシュ情報の取得に失敗しました:', error);
            this.textElement.textContent = 'キャッシュ情報の取得に失敗しました。\n\nエラー: ' + error;
            this.popup.style.display = 'flex';
        }
    }
    /**
     * キャッシュ情報を非表示
     */
    static hideCacheInfo() {
        if (!this.popup) {
            return;
        }
        this.popup.style.display = 'none';
        console.log('📄 キャッシュ情報を非表示にしました');
    }
    /**
     * キャッシュを強制更新
     */
    static forceCacheUpdate() {
        if (!this.textElement) {
            return;
        }
        try {
            // キャッシュを強制更新
            const result = CacheInfo.forceCacheUpdate();
            // 結果を表示
            this.textElement.textContent = result;
            console.log('🔄 キャッシュを強制更新しました');
            // 成功メッセージを一時的に表示
            this.showSuccessMessage('キャッシュを強制更新しました');
        }
        catch (error) {
            console.error('キャッシュの強制更新に失敗しました:', error);
            this.textElement.textContent = 'キャッシュの強制更新に失敗しました。\n\nエラー: ' + error;
        }
    }
    /**
     * ページをリロードしてキャッシュをクリア
     */
    static reloadWithCacheClear() {
        console.log('🔄 ページをリロードしてキャッシュをクリアします...');
        // 確認メッセージを表示
        if (confirm('ページをリロードしてキャッシュをクリアしますか？')) {
            CacheInfo.reloadWithCacheClear();
        }
    }
    /**
     * 成功メッセージを表示
     */
    static showSuccessMessage(message) {
        // 一時的な成功メッセージを作成
        const successMessage = document.createElement('div');
        successMessage.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 3000;
            animation: slideInRight 0.3s ease-out;
        `;
        successMessage.textContent = message;
        // アニメーション用のCSSを追加
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(successMessage);
        // 3秒後に削除
        setTimeout(() => {
            successMessage.style.animation = 'slideOutRight 0.3s ease-in';
            successMessage.style.transform = 'translateX(100%)';
            successMessage.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(successMessage);
                document.head.removeChild(style);
            }, 300);
        }, 3000);
    }
}
CacheInfoController.popup = null;
CacheInfoController.textElement = null;
//# sourceMappingURL=CacheInfoController.js.map