export function updateInfoDisplay() {
    console.log('updateInfoDisplay called');
    // 位置・時刻・中心座標・視野角の情報を更新
    const locationInfo = document.getElementById('locationInfo');
    const timeInfo = document.getElementById('timeInfo');
    const centerInfo = document.getElementById('centerInfo');
    const fovInfo = document.getElementById('fovInfo');
    // console.log('HTML elements found:', {
    //     locationInfo: !!locationInfo,
    //     timeInfo: !!timeInfo,
    //     centerInfo: !!centerInfo,
    //     fovInfo: !!fovInfo
    // });
    // configからデータを取得
    const config = window.config;
    console.log('config reference from window:', config);
    console.log('config === (window as any).config:', config === window.config);
    if (!config) {
        console.log('No config found');
        return;
    }
    console.log('Current config in updateInfoDisplay:', config);
    console.log('renderOptions:', config.renderOptions);
    console.log('observationSite:', config.observationSite);
    // console.log('displayTime:', config.displayTime);
    // 直接window.configからも取得してみる
    const windowConfig = window.config;
    console.log('Direct window.config:', windowConfig);
    console.log('window.config.renderOptions:', windowConfig?.renderOptions);
    // renderOptionsの参照を詳しく確認
    console.log('config.renderOptions === windowConfig.renderOptions:', config.renderOptions === windowConfig.renderOptions);
    // console.log('config.renderOptions reference:', config.renderOptions);
    // console.log('windowConfig.renderOptions reference:', windowConfig.renderOptions);
    // 観測地情報を更新
    if (locationInfo) {
        const { latitude, longitude } = config.observationSite;
        const ns = latitude >= 0 ? 'N' : 'S';
        const ew = longitude >= 0 ? 'E' : 'W';
        const latAbs = Math.abs(latitude);
        const lonAbs = Math.abs(longitude);
        const locationText = `${latAbs.toFixed(1)}° ${ns} ${lonAbs.toFixed(1)}° ${ew}`;
        locationInfo.textContent = locationText;
        console.log('Updated location info:', locationText);
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
        console.log('Updated time info:', timeText);
    }
    // 中心座標情報を更新
    if (centerInfo) {
        const { centerRA, centerDec } = config.renderOptions;
        console.log('centerRA:', centerRA, 'centerDec:', centerDec);
        // console.log('centerRA type:', typeof centerRA, 'centerDec type:', typeof centerDec);
        // console.log('centerRA isNaN:', isNaN(centerRA), 'centerDec isNaN:', isNaN(centerDec));
        const raHours = Math.floor(centerRA / 15);
        const raMinutes = Math.floor((centerRA % 15) * 4);
        const decSign = centerDec >= 0 ? '+' : '';
        const centerText = `赤経${raHours}h${raMinutes}m 赤緯${decSign}${centerDec.toFixed(1)}°`;
        console.log('Calculated values - raHours:', raHours, 'raMinutes:', raMinutes, 'decSign:', decSign);
        // console.log('centerInfo element:', centerInfo);
        console.log('centerText to set:', centerText);
        console.log('centerInfo.textContent before:', centerInfo.textContent);
        centerInfo.textContent = centerText;
        console.log('centerInfo.textContent after:', centerInfo.textContent);
        console.log('Updated center info:', centerText);
    }
    else {
        console.log('centerInfo element not found');
    }
    // 視野角情報を更新
    if (fovInfo) {
        const { fieldOfViewRA, fieldOfViewDec } = config.renderOptions;
        const fovText = `${fieldOfViewRA.toFixed(1)}° × ${fieldOfViewDec.toFixed(1)}°`;
        fovInfo.textContent = fovText;
        console.log('Updated FOV info:', fovText);
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