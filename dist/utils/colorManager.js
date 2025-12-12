/**
 * 色テーマの定義
 * ライトモードとダークモードの色パレットを定義
 */
export const colorTheme = {
    light: {
        // 基本色
        background: '#000000',
        text: '#ffffff',
        textSecondary: '#666666',
        yellow: 'yellow',
        orange: 'orange',
        // グリッド・レティクル
        grid: 'grey',
        gridEquatorialLine: 'rgba(150, 50, 50, 1)',
        reticle: 'grey',
        // 恒星
        star: '#ffffff',
        starName: 'white',
        // 星座
        constellationLine: 'rgba(68, 190, 206, 0.8)',
        constellationName: 'white',
        // 天体
        solarSystem: 'rgb(255, 219, 88)',
        moonShade: '#333333',
        solarSystemMotion: '#AAFFAA',
        dso: 'rgb(214, 139, 0)',
        // その他
        poleMark: 'orange',
        cameraView: 'rgba(255, 255, 0, 0.1)',
        tempTarget: 'red',
        satellite: 'yellow',
        satelliteIlluminated: 'yellow',
        satelliteShadow: 'gray',
        // UI要素
        border: '#cccccc',
        button: 'rgba(255, 255, 255, 0.1)',
        buttonHover: 'rgba(255, 255, 255, 0.2)',
        error: 'red',
        warning: 'orange',
        success: 'green',
        info: 'blue'
    },
    dark: {
        // 基本色
        background: '#000000',
        text: 'rgb(200, 150, 150)',
        textSecondary: 'gray',
        yellow: 'rgb(197, 197, 4)',
        orange: 'rgb(248, 173, 69)',
        // グリッド・レティクル
        grid: 'rgba(50, 50, 50, 1)',
        gridEquatorialLine: 'rgba(100, 0, 0, 1)',
        reticle: 'rgb(200, 150, 150)',
        // 恒星
        star: 'rgb(204, 102, 102)',
        starName: 'rgb(200, 150, 150)',
        // 星座
        constellationLine: 'rgba(48, 127, 127, 0.8)',
        constellationName: 'rgb(200, 150, 150)',
        // 天体
        solarSystem: 'rgb(248, 173, 69)',
        moonShade: '#222222',
        solarSystemMotion: 'rgb(64, 136, 64)',
        dso: 'rgb(248, 173, 69)',
        // その他
        poleMark: 'rgb(248, 173, 69)',
        cameraView: 'rgba(248, 173, 69, 0.1)',
        tempTarget: 'red',
        satellite: 'rgb(248, 173, 69)',
        satelliteIlluminated: 'rgb(248, 173, 69)',
        satelliteShadow: 'rgb(100, 100, 100)',
        // UI要素
        border: 'rgb(200, 150, 150)',
        button: 'rgba(200, 150, 150, 0.1)',
        buttonHover: 'rgba(200, 150, 150, 0.2)',
        error: 'rgb(204, 102, 102)',
        warning: 'rgb(248, 173, 69)',
        success: 'rgb(64, 136, 64)',
        info: 'rgb(64, 136, 64)'
    }
};
/**
 * 色管理クラス
 * ダークモード/ライトモードに応じて適切な色を提供
 */
export class ColorManager {
    constructor(isDarkMode = false) {
        this.currentTheme = isDarkMode ? 'dark' : 'light';
    }
    /**
     * テーマを更新
     * @param isDarkMode ダークモードかどうか
     */
    updateTheme(isDarkMode) {
        this.currentTheme = isDarkMode ? 'dark' : 'light';
    }
    /**
     * 現在のテーマの色パレットを取得
     * @returns 現在のテーマの色パレット
     */
    getCurrentPalette() {
        return colorTheme[this.currentTheme];
    }
    /**
     * 指定された色キーの色を取得
     * @param key 色キー
     * @returns 色の文字列
     */
    getColor(key) {
        return this.getCurrentPalette()[key];
    }
    /**
     * 恒星の色を取得（B-V値に基づく）
     * @param bv B-V値
     * @returns 恒星の色
     */
    getStarColor(bv) {
        if (bv == null || bv === 100 || Number.isNaN(bv) || !Number.isFinite(bv)) {
            return this.getColor('star');
        }
        // B-V値を適切な範囲に制限
        bv = Math.max(-0.4, Math.min(2.0, bv));
        let r = 0, g = 0, b = 0;
        // 色温度に基づく色計算
        if (bv < 0.4)
            r = 0.5 + 0.5 * (bv + 0.4) / 0.8;
        else
            r = 1.0;
        if (bv < 0)
            g = 1.0 + bv;
        else if (bv < 0.4)
            g = 1.0;
        else
            g = 1.0 - 0.6 * (bv - 0.4) / 1.6;
        if (bv < 0.4)
            b = 1.0;
        else
            b = 1.0 - 0.8 * (bv - 0.4) / 1.6;
        // RGB値を0-255の範囲に変換
        r = Math.round(r * 255);
        g = Math.round(g * 255);
        b = Math.round(b * 255);
        // ダークモードの場合、色を調整
        if (this.currentTheme === 'dark') {
            r = Math.round(r * 0.8);
            g = Math.round(g * 0.4);
            b = Math.round(b * 0.4);
        }
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    /**
     * 透明度付きの色を取得
     * @param key 色キー
     * @param alpha 透明度（0-1）
     * @returns 透明度付きの色
     */
    getColorWithAlpha(key, alpha) {
        const color = this.getColor(key);
        // 既にrgba形式の場合は、alpha値を置き換え
        if (color.startsWith('rgba')) {
            return color.replace(/,\s*[\d.]+\)$/, `, ${alpha})`);
        }
        // hex形式の場合は、rgbaに変換
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        // rgb形式の場合は、rgbaに変換
        if (color.startsWith('rgb')) {
            return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
        }
        // その他の場合はそのまま返す
        return color;
    }
    /**
     * 人工衛星の色を取得
     * @param illuminated 太陽光に照らされているかどうか
     * @returns 人工衛星の色
     */
    getSatelliteColor(illuminated) {
        return illuminated ? this.getColor('satelliteIlluminated') : this.getColor('satelliteShadow');
    }
    /**
     * 色文字列をRGB値にパース
     * @param color 色文字列（rgb(r, g, b)）
     * @returns RGB値の配列 [r, g, b]
     */
    parseRgbToList(color) {
        if (color.startsWith('rgba')) {
            const r = parseInt(color.slice(5, 7), 16);
            const g = parseInt(color.slice(8, 10), 16);
            const b = parseInt(color.slice(11, 13), 16);
            return [r, g, b];
        }
        else if (color.startsWith('rgb')) {
            const r = parseInt(color.slice(4, 6), 16);
            const g = parseInt(color.slice(7, 9), 16);
            const b = parseInt(color.slice(10, 12), 16);
            return [r, g, b];
        }
        else if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return [r, g, b];
        }
        return [0, 0, 0];
    }
    /**
     * 2つの色をブレンド
     * @param colorA 色A
     * @param colorB 色B
     * @param ratioB 色Bの比率（0.0-1.0）。0.3なら色Aが70%、色Bが30%
     * @returns ブレンドされた色（rgb形式）
     */
    blendColors(colorA, colorB, ratioB) {
        const colorBList = this.parseRgbToList(colorB);
        const r = Math.round(colorA[0] * (1 - ratioB) + colorBList[0] * ratioB);
        const g = Math.round(colorA[1] * (1 - ratioB) + colorBList[1] * ratioB);
        const b = Math.round(colorA[2] * (1 - ratioB) + colorBList[2] * ratioB);
        // console.log(colorA, r, ratioB);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
}
// グローバルな色管理インスタンス
let globalColorManager = null;
/**
 * グローバルな色管理インスタンスを取得
 * @param isDarkMode ダークモードかどうか
 * @returns 色管理インスタンス
 */
export function getColorManager(isDarkMode = false) {
    if (!globalColorManager) {
        globalColorManager = new ColorManager(isDarkMode);
    }
    else {
        globalColorManager.updateTheme(isDarkMode);
    }
    return globalColorManager;
}
/**
 * 色管理インスタンスをリセット
 */
export function resetColorManager() {
    globalColorManager = null;
}
//# sourceMappingURL=colorManager.js.map