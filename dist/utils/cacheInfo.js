export class CacheInfo {
    /**
     * 現在読み込まれているCSSとJSファイルのキャッシュ情報を表示
     */
    static showCacheInfo() {
        let info = '=== キャッシュ情報 ===\n\n';
        // CSSファイルの情報
        info += '📄 CSSファイル:\n';
        for (let i = 0; i < document.styleSheets.length; i++) {
            const sheet = document.styleSheets[i];
            if (sheet.href) {
                info += `  ${i + 1}. ${sheet.href}\n`;
                info += this.getFileInfo(sheet.href);
            }
        }
        // JavaScriptファイルの情報
        info += '📄 JavaScriptファイル:\n';
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach((script, index) => {
            const src = script.src;
            info += `  ${index + 1}. ${src}\n`;
            info += this.getFileInfo(src);
        });
        // ローカルストレージのキャッシュ情報
        info += this.getLocalStorageCacheInfo();
        return info;
    }
    /**
     * ファイルの詳細情報を取得
     */
    static getFileInfo(url) {
        const fileName = url.split('/').pop() || url;
        const urlObj = new URL(url, window.location.href);
        const version = urlObj.searchParams.get('v') || urlObj.searchParams.get('version') || 'なし';
        return `     ファイル名: ${fileName}\n     バージョン: ${version}\n\n`;
    }
    /**
     * ローカルストレージのキャッシュ情報を取得
     */
    static getLocalStorageCacheInfo() {
        let info = '💾 ローカルストレージのキャッシュ情報:\n';
        const cacheKeys = Object.keys(localStorage).filter(key => key.includes('cache') || key.includes('version') || key.includes('timestamp'));
        if (cacheKeys.length === 0) {
            info += '  キャッシュ情報なし\n';
        }
        else {
            cacheKeys.forEach(key => {
                const value = localStorage.getItem(key);
                info += `  ${key}: ${value}\n`;
            });
        }
        return info;
    }
    /**
     * キャッシュを強制更新
     */
    static forceCacheUpdate() {
        const timestamp = new Date().getTime();
        let result = '🔄 キャッシュ強制更新を開始...\n\n';
        // CSSファイルの強制更新
        const styleSheets = document.querySelectorAll('link[rel="stylesheet"]');
        styleSheets.forEach((link, index) => {
            const href = link.href;
            if (href) {
                const newHref = this.addTimestampToUrl(href, timestamp);
                link.href = newHref;
                result += `CSS ${index + 1} 更新: ${newHref}\n`;
            }
        });
        // JavaScriptファイルの強制更新
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach((script, index) => {
            const src = script.src;
            if (src) {
                const newSrc = this.addTimestampToUrl(src, timestamp);
                script.src = newSrc;
                result += `JS ${index + 1} 更新: ${newSrc}\n`;
            }
        });
        // ローカルストレージに更新タイムスタンプを保存
        localStorage.setItem('cache_last_updated', timestamp.toString());
        result += `\n✅ キャッシュ強制更新完了\n`;
        result += `更新時刻: ${new Date(timestamp).toLocaleString()}`;
        return result;
    }
    /**
     * URLにタイムスタンプを追加
     */
    static addTimestampToUrl(url, timestamp) {
        const urlObj = new URL(url, window.location.href);
        urlObj.searchParams.set('_t', timestamp.toString());
        return urlObj.toString();
    }
    /**
     * ページをリロードしてキャッシュをクリア
     */
    static reloadWithCacheClear() {
        sessionStorage.setItem('clear_cache', 'true');
        window.location.reload();
    }
    /**
     * キャッシュクリアフラグをチェック
     */
    static checkCacheClearFlag() {
        const clearCache = sessionStorage.getItem('clear_cache');
        if (clearCache === 'true') {
            sessionStorage.removeItem('clear_cache');
            this.forceCacheUpdate();
        }
    }
}
//# sourceMappingURL=cacheInfo.js.map