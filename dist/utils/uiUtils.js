import { AstronomicalCalculator } from "./calculations.js";
import { CoordinateConverter } from "./coordinates.js";
// import { DataStore } from "../models/DataStore.js";
import { SolarSystemDataManager } from "../models/SolarSystemObjects.js";
export function updateInfoDisplay() {
    // 位置・時刻・中心座標・視野角の情報を更新
    const locationInfo = document.getElementById('locationInfo');
    const timeInfo = document.getElementById('timeInfo');
    const centerInfo = document.getElementById('centerInfo');
    const fovInfo = document.getElementById('fovInfo');
    const limitingMagnitudeInfo = document.getElementById('limitingMagnitudeInfo');
    // configからデータを取得
    const config = window.config;
    if (!config) {
        return;
    }
    // 観測地情報を更新
    if (locationInfo) {
        const observationSite = config.observationSite;
        if (observationSite.observerPlanet == '地球') {
            const ns = observationSite.latitude >= 0 ? 'N' : 'S';
            const ew = observationSite.longitude >= 0 ? 'E' : 'W';
            const latAbs = Math.abs(observationSite.latitude);
            const lonAbs = Math.abs(observationSite.longitude);
            if (observationSite.name == 'カスタム') {
                const locationText = `${latAbs.toFixed(2)}° ${ns} ${lonAbs.toFixed(2)}° ${ew}`;
                locationInfo.textContent = locationText;
            }
            else {
                const locationText = `${observationSite.name} (${latAbs.toFixed(2)}° ${ns} ${lonAbs.toFixed(2)}° ${ew})`;
                locationInfo.textContent = locationText;
            }
        }
        else {
            const locationText = `${observationSite.observerPlanet}`;
            locationInfo.textContent = locationText;
        }
    }
    // 時刻情報を更新
    if (timeInfo) {
        const { year, month, day, hour, minute, second } = config.displayTime;
        const date = new Date(year, month - 1, day, hour, minute, second);
        const timeText = date.toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        const twilight = SolarSystemDataManager.getTwilight();
        timeInfo.textContent = timeText + ' (' + twilight + ')';
    }
    // 中心座標情報を更新
    if (centerInfo) {
        let { centerRA, centerDec, centerAlt, centerAz } = config.viewState;
        const equinox = config.displaySettings.equinox;
        if (equinox == 'j2000') {
            const coordinateConverter = new CoordinateConverter();
            const { ra, dec } = coordinateConverter.precessionEquatorial({ ra: centerRA, dec: centerDec }, undefined, config.displayTime.jd, 'j2000');
            centerRA = ra;
            centerDec = dec;
            const centerLabel = document.getElementById('centerLabel');
            if (centerLabel) {
                centerLabel.textContent = '中心(J2000.0):';
            }
        }
        else {
            const centerLabel = document.getElementById('centerLabel');
            if (centerLabel) {
                centerLabel.textContent = '中心(視位置):';
            }
        }
        const coordinateConverter = new CoordinateConverter();
        const centerConstellation = coordinateConverter.determineConstellation({ ra: centerRA, dec: centerDec });
        const centerConstellationInfo = document.getElementById('centerConstellation');
        if (centerConstellationInfo) {
            centerConstellationInfo.textContent = centerConstellation;
        }
        let centerRArounded = Math.round(centerRA * 4 * 10);
        if (centerRArounded == 1440)
            centerRArounded = 0;
        const raHours = Math.floor(centerRArounded / 600);
        const raMinutes = Math.floor((centerRArounded % 600) / 10) + "." + Math.floor(centerRArounded % 10);
        const decSign = centerDec >= 0 ? '+' : '-';
        let centerDecrounded = Math.round(Math.abs(centerDec) * 60);
        const decDegrees = Math.floor(centerDecrounded / 60);
        const decMinutes = Math.floor(centerDecrounded % 60);
        let centerText = `赤経${raHours}h${raMinutes}m, 赤緯${decSign}${decDegrees}°${decMinutes}'`;
        if (config.observationSite.observerPlanet == '地球') {
            centerText += `<br>方位角${centerAz.toFixed(2)}°, 高度${centerAlt.toFixed(2)}°`;
        }
        centerInfo.innerHTML = centerText;
    }
    // 視野角情報を更新
    if (fovInfo) {
        const { fieldOfViewRA, fieldOfViewDec } = config.viewState;
        const fovText = `${fieldOfViewRA.toFixed(1)}°`;
        fovInfo.textContent = fovText;
    }
    if (limitingMagnitudeInfo) {
        const limitingMagnitude = AstronomicalCalculator.limitingMagnitude(config);
        limitingMagnitudeInfo.textContent = limitingMagnitude.toFixed(1);
    }
}
export function handleResize() {
    const mobileDock = document.getElementById('mobileButtonDock');
    const topButtons = document.querySelector('.top-right-buttons');
    const bottomButtons = document.querySelector('.bottom-right-buttons');
    if (window.innerWidth <= 768) {
        if (mobileDock)
            mobileDock.style.display = 'flex';
        if (topButtons)
            topButtons.style.display = 'none';
        if (bottomButtons)
            bottomButtons.style.display = 'none';
    }
    else {
        if (mobileDock)
            mobileDock.style.display = 'none';
        if (topButtons)
            topButtons.style.display = 'flex';
        if (bottomButtons)
            bottomButtons.style.display = 'flex';
    }
    // Canvasサイズの更新とrenderAllの呼び出し
    updateCanvasSize();
}
/**
 * ブラウザのUIを除いた描画可能領域のサイズを取得
 * @returns {width: number, height: number} 描画可能領域の幅と高さ
 * 推定ベース: 一般的なブラウザUIのサイズを固定値で推定
 * 用途: 簡単な用途、概算が必要な場合
 */
export function getAvailableScreenSize() {
    // フルスクリーン時は画面全体を使用
    if (document.fullscreenElement) {
        return {
            width: window.screen.width,
            height: window.screen.height
        };
    }
    // 通常時はブラウザのUIを除いた領域を使用
    // 一般的なブラウザUIの高さを推定（ツールバー、ブックマークバー、タブなど）
    const estimatedBrowserUI = {
        top: 80, // タブバー + ツールバー
        bottom: 0, // 通常は下部にUIはない
        left: 0, // 通常は左側にUIはない
        right: 0 // 通常は右側にUIはない
    };
    // 実際の利用可能な領域を計算
    const availableWidth = window.screen.width - estimatedBrowserUI.left - estimatedBrowserUI.right;
    const availableHeight = window.screen.height - estimatedBrowserUI.top - estimatedBrowserUI.bottom;
    // window.innerWidth/innerHeightと比較して、より小さい方を採用
    // （実際のブラウザウィンドウサイズが画面より小さい場合）
    const actualWidth = Math.min(availableWidth, window.innerWidth);
    const actualHeight = Math.min(availableHeight, window.innerHeight);
    return {
        width: actualWidth,
        height: actualHeight
    };
}
/**
 * 現在のウィンドウサイズに基づいて描画可能領域を取得
 * @returns {width: number, height: number} 描画可能領域の幅と高さ
 */
export function getCurrentWindowSize() {
    return {
        width: window.innerWidth,
        height: window.innerHeight
    };
}
/**
 * ブラウザのUIサイズを動的に測定
 * @returns {top: number, bottom: number, left: number, right: number} ブラウザUIのサイズ
 * UIサイズ測定: ブラウザのUIサイズを動的に計算
 * 用途: デバッグや詳細な分析が必要な場合
 */
export function measureBrowserUI() {
    // フルスクリーン時はUIはない
    if (document.fullscreenElement) {
        return { top: 0, bottom: 0, left: 0, right: 0 };
    }
    // 画面サイズとウィンドウサイズの差からUIサイズを推定
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const windowWidth = window.outerWidth;
    const windowHeight = window.outerHeight;
    // ウィンドウの位置を取得（可能な場合）
    const windowLeft = window.screenX || 0;
    const windowTop = window.screenY || 0;
    // UIサイズを計算
    const left = windowLeft;
    const top = windowTop;
    const right = screenWidth - (windowLeft + windowWidth);
    const bottom = screenHeight - (windowTop + windowHeight);
    return { top, bottom, left, right };
}
/**
 * Canvasサイズを更新し、renderAllを呼び出す
 */
export function updateCanvasSize() {
    // グローバルなconfigとrendererにアクセス
    const globalConfig = window.config;
    const renderer = window.renderer;
    const renderAll = window.renderAll;
    if (!globalConfig || !renderer || !renderAll) {
        console.warn('updateCanvasSize: 必要なグローバル変数が見つかりません');
        return;
    }
    // 現在のウィンドウサイズを取得
    const { width, height } = getCurrentWindowSize();
    // Canvasサイズを更新
    globalConfig.canvasSize.width = width;
    globalConfig.canvasSize.height = height;
    if (width > height) {
        globalConfig.viewState.fieldOfViewDec = globalConfig.viewState.fieldOfViewRA * height / width;
    }
    else {
        globalConfig.viewState.fieldOfViewRA = globalConfig.viewState.fieldOfViewDec * width / height;
    }
    // rendererのcanvasサイズも更新
    if (renderer.canvas) {
        renderer.canvas.width = width;
        renderer.canvas.height = height;
    }
    // rendererのupdateOptionsを呼び出して設定を更新
    if (renderer.updateOptions) {
        renderer.updateOptions({
            canvasSize: { width, height }
        });
    }
    // renderAllを呼び出して再描画
    renderAll();
    console.log(`Canvasサイズを更新しました: ${width}x${height}`);
}
/**
 * より正確な描画可能領域を取得（動的測定版）
 * @returns {width: number, height: number} 描画可能領域の幅と高さ
 * 動的測定: 実際のウィンドウ位置とサイズからUIサイズを計算
 * 用途: より正確な描画可能領域が必要な場合
 */
export function getAvailableSize() {
    if (document.fullscreenElement) {
        return {
            width: window.screen.width,
            height: window.screen.height
        };
    }
    const ui = measureBrowserUI();
    const availableWidth = window.screen.width - ui.left - ui.right;
    const availableHeight = window.screen.height - ui.top - ui.bottom;
    // 実際のウィンドウサイズと比較して、より小さい方を採用
    const actualWidth = Math.min(availableWidth, window.innerWidth);
    const actualHeight = Math.min(availableHeight, window.innerHeight);
    return {
        width: actualWidth,
        height: actualHeight
    };
}
export function getCanvasSize() {
    const availableSize = getAvailableSize();
    let heightDiff = 0;
    // タイトルバーの高さを取得
    const title = document.getElementById('title');
    if (title) {
        const titleHeight = title.offsetHeight || 0;
        console.log('title height:', titleHeight);
        heightDiff += titleHeight;
    }
    // モバイルボタンドックの高さを取得（表示されている場合のみ）
    const mobileDock = document.getElementById('mobileButtonDock');
    if (mobileDock) {
        const computedStyle = window.getComputedStyle(mobileDock);
        const isVisible = computedStyle.display !== 'none';
        console.log('mobileDock display:', computedStyle.display);
        if (isVisible) {
            const dockHeight = mobileDock.offsetHeight || 0;
            console.log('mobileDock height:', dockHeight);
            heightDiff += dockHeight;
        }
    }
    const canvasSize = {
        width: availableSize.width,
        height: availableSize.height - heightDiff
    };
    console.log('Available size:', availableSize);
    console.log('Height difference:', heightDiff);
    console.log('Final canvas size:', canvasSize);
    return canvasSize;
}
/**
 * 描画可能領域の情報をコンソールに出力（デバッグ用）
 */
export function logAvailableScreenInfo() {
    console.log('=== 描画可能領域の情報 ===');
    console.log('window.screen:', window.screen.width, 'x', window.screen.height);
    console.log('window.outerWidth/Height:', window.outerWidth, 'x', window.outerHeight);
    console.log('window.innerWidth/Height:', window.innerWidth, 'x', window.innerHeight);
    console.log('window.screenX/Y:', window.screenX, window.screenY);
    const ui = measureBrowserUI();
    console.log('ブラウザUIサイズ:', ui);
    const available = getAvailableSize();
    console.log('描画可能領域:', available);
    const current = getCurrentWindowSize();
    console.log('現在のウィンドウサイズ:', current);
    console.log('フルスクリーン状態:', !!document.fullscreenElement);
    console.log('========================');
}
export function updateTimeDisplay() {
    // 時刻表示を定期的に更新
    const timeInfo = document.getElementById('timeInfo');
    if (timeInfo) {
        const config = window.config;
        if (config) {
            const { year, month, day, hour, minute } = config.displayTime;
            const date = new Date(year, month - 1, day, hour, minute);
            timeInfo.textContent = date.toLocaleString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        else {
            // configが利用できない場合は現在時刻を表示
            const now = new Date();
            timeInfo.textContent = now.toLocaleString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
}
export function setupTimeUpdate() {
    // 1分ごとに時刻表示を更新
    setInterval(updateTimeDisplay, 1000);
    // 初期表示
    updateTimeDisplay();
}
// export function showLoading(show: boolean = true) {
//     const loadingText = document.getElementById('loadingtext');
//     if (loadingText) {
//         loadingText.textContent = show ? 'Loading...' : '';
//         loadingText.style.display = show ? 'block' : 'none';
//     }
// }
export function showError(message) {
    // エラーメッセージを表示
    console.error(message);
    // エラー表示用の要素を作成（必要に応じて）
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 1000;
        max-width: 80%;
        text-align: center;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    // 3秒後に自動削除
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 3000);
}
/**
 * CSS適用後にキャンバスサイズを再計算
 * @param canvas HTMLCanvasElement
 */
export function recalculateCanvasSize(canvas) {
    // 少し遅延を入れてCSSの適用を待つ
    setTimeout(() => {
        const newSize = getCanvasSize();
        console.log('Recalculating canvas size:', newSize);
        canvas.width = newSize.width;
        canvas.height = newSize.height;
        // レンダリングを再実行
        if (window.renderAll) {
            window.renderAll();
        }
    }, 100);
}
// export function showSuccess(message: string) {
//     // 成功メッセージを表示
//     console.log(message);
//     const successDiv = document.createElement('div');
//     successDiv.style.cssText = `
//         position: fixed;
//         top: 50%;
//         left: 50%;
//         transform: translate(-50%, -50%);
//         background: rgba(0, 255, 0, 0.9);
//         color: white;
//         padding: 20px;
//         border-radius: 8px;
//         z-index: 1000;
//         max-width: 80%;
//         text-align: center;
//     `;
//     successDiv.textContent = message;
//     document.body.appendChild(successDiv);
//     // 2秒後に自動削除
//     setTimeout(() => {
//         if (successDiv.parentNode) {
//             successDiv.parentNode.removeChild(successDiv);
//         }
//     }, 2000);
// } 
//# sourceMappingURL=uiUtils.js.map