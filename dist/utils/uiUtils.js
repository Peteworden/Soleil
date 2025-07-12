import { AstronomicalCalculator } from "./calculations.js";
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
        const { latitude, longitude } = config.observationSite;
        const ns = latitude >= 0 ? 'N' : 'S';
        const ew = longitude >= 0 ? 'E' : 'W';
        const latAbs = Math.abs(latitude);
        const lonAbs = Math.abs(longitude);
        const locationText = `${latAbs.toFixed(2)}° ${ns} ${lonAbs.toFixed(2)}° ${ew}`;
        locationInfo.textContent = locationText;
    }
    // 時刻情報を更新
    if (timeInfo) {
        const { year, month, day, hour, minute } = config.displayTime;
        const date = new Date(year, month - 1, day, hour, minute);
        const timeText = date.toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        timeInfo.textContent = timeText;
    }
    // 中心座標情報を更新
    if (centerInfo) {
        const { centerRA, centerDec, centerAlt, centerAz } = config.viewState;
        const raHours = Math.floor(centerRA / 15);
        const raMinutes = Math.floor((centerRA % 15) * 4);
        const decSign = centerDec >= 0 ? '+' : '';
        const centerText = `赤経${raHours}h${raMinutes}m, 赤緯${decSign}${centerDec.toFixed(1)}°<br>高度${centerAlt.toFixed(1)}°, 方位角${centerAz.toFixed(1)}°`;
        centerInfo.innerHTML = centerText;
    }
    // 視野角情報を更新
    if (fovInfo) {
        const { fieldOfViewRA, fieldOfViewDec } = config.viewState;
        const fovText = `${fieldOfViewRA.toFixed(1)}° × ${fieldOfViewDec.toFixed(1)}°`;
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
export function showLoading(show = true) {
    const loadingText = document.getElementById('loadingtext');
    if (loadingText) {
        loadingText.textContent = show ? 'Loading...' : '';
        loadingText.style.display = show ? 'block' : 'none';
    }
}
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
export function showSuccess(message) {
    // 成功メッセージを表示
    console.log(message);
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 255, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 1000;
        max-width: 80%;
        text-align: center;
    `;
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    // 2秒後に自動削除
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 2000);
}
//# sourceMappingURL=uiUtils.js.map