//npm run dev
import { AstronomicalCalculator } from './utils/calculations.js';
import { CanvasRenderer } from './renderer/CanvasRenderer.js';
import { Planet, Moon } from './models/CelestialObject.js';
import { DataLoader } from './utils/DataLoader.js';
import { InteractionController } from "./renderer/interactionController.js";
import { jupiterData } from './data/planets.js';
import { SettingController } from './controllers/SettingController.js';
import { SearchController } from './controllers/SearchController.js';
import { updateInfoDisplay, handleResize, setupTimeUpdate } from './utils/uiUtils.js';
// 星空表示の設定
export let config = {
    renderOptions: {
        showGrid: true,
        showStars: true,
        showPlanets: true,
        showConstellationNames: true,
        showConstellationLines: true,
        mode: 'AEP',
        centerRA: 90,
        centerDec: 0,
        fieldOfViewRA: 60,
        fieldOfViewDec: 60,
        starSizeKey1: 11.5,
        starSizeKey2: 1.8
    },
    observationSite: {
        latitude: 35.0, // 東京の緯度
        longitude: 135.0, // 東京の経度
        timezone: 9 // 日本標準時
    },
    displayTime: {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate(),
        hour: new Date().getHours(),
        minute: new Date().getMinutes(),
        second: new Date().getSeconds()
    },
    canvasSize: {
        width: window.innerWidth,
        height: window.innerHeight
    }
};
// 設定更新用の関数
export function updateConfig(newConfig) {
    console.log('🔧 updateConfig called with:', newConfig);
    // config全体を更新
    Object.assign(config, newConfig);
    // グローバル参照も更新
    window.config = config;
    // renderOptionsが含まれている場合は、レンダラーとコントローラーも更新
    if (newConfig.renderOptions) {
        console.log('🔧 Updating renderOptions:', newConfig.renderOptions);
        // 既存のrenderOptionsを保持しながら部分更新
        Object.assign(config.renderOptions, newConfig.renderOptions);
        console.log('🔧 renderOptions after update:', config.renderOptions);
        // 完全なrenderOptionsオブジェクトを渡す
        window.renderer.updateOptions(config.renderOptions);
        window.controller.updateOptions(config.renderOptions);
        console.log('🔧 Renderer and controller updated');
    }
    // 観測地が変更された場合は、レンダラーの座標変換器も更新する必要がある
    if (newConfig.observationSite) {
        console.log('🔧 Observation site updated:', newConfig.observationSite);
    }
    window.renderAll();
    // 情報表示を更新
    updateInfoDisplay();
}
// レンダリングオプションのみを更新する関数
export function updateRenderOptions(newOptions) {
    Object.assign(config.renderOptions, newOptions);
    window.renderer.updateOptions(newOptions);
    window.controller.updateOptions(newOptions);
    window.renderAll();
    // 情報表示を更新
    updateInfoDisplay();
}
// グローバルにconfigを公開（SettingControllerからアクセス可能）
window.config = config;
console.log('🌐 config published to window:', window.config);
console.log('🌐 config reference check:', config === window.config);
window.updateConfig = updateConfig;
window.updateRenderOptions = updateRenderOptions;
window.updateInfoDisplay = updateInfoDisplay;
// メイン関数
export async function main() {
    const app = document.getElementById('app');
    if (!app)
        return;
    try {
        // データの読み込み
        const [hipStars, constellationData, messierData, starNames, gaia100Data, gaia101_110Data, gaia111_115Data, gaia100HelpData, gaia101_110HelpData, gaia111_115HelpData] = await Promise.all([
            DataLoader.loadHIPData(),
            DataLoader.loadConstellationData(),
            DataLoader.loadMessierData(),
            DataLoader.loadStarNames(),
            DataLoader.loadGaiaData('-100'),
            DataLoader.loadGaiaData('101-110'),
            DataLoader.loadGaiaData('111-115'),
            DataLoader.loadGaiaHelpData('-100'),
            DataLoader.loadGaiaHelpData('101-110'),
            DataLoader.loadGaiaHelpData('111-115')
        ]);
        document.getElementById('loadingtext').innerHTML = '';
        // キャンバスの作成
        const canvas = document.createElement('canvas');
        canvas.width = config.canvasSize.width;
        canvas.height = config.canvasSize.height;
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.zIndex = '1';
        app.appendChild(canvas);
        config.renderOptions.fieldOfViewDec = config.canvasSize.height / config.canvasSize.width * config.renderOptions.fieldOfViewRA;
        // レンダラーの作成
        const renderer = new CanvasRenderer(canvas, config.renderOptions, config.observationSite.latitude, config.observationSite.longitude);
        // CanvasRendererのoptionsを確実にconfig.renderOptionsと同じ参照にする
        renderer.options = config.renderOptions;
        console.log('🎨 CanvasRenderer options set to config.renderOptions');
        console.log('🎨 renderer.options === config.renderOptions:', renderer.options === config.renderOptions);
        console.log('🎨 renderer.options reference:', renderer.options);
        console.log('🎨 config.renderOptions reference:', config.renderOptions);
        // 天体の作成
        const jupiter = new Planet(jupiterData);
        const moon = new Moon();
        // 現在のユリウス日を計算
        const jd = AstronomicalCalculator.calculateCurrentJdTT();
        // 天体の位置を更新
        jupiter.updatePosition(jd);
        moon.updatePosition(jd);
        function renderAll() {
            renderer.clear();
            renderer.drawGrid();
            renderer.drawConstellationLines(Object.values(constellationData));
            renderer.drawGaiaStars(gaia100Data, gaia100HelpData, 0);
            renderer.drawHipStars(hipStars);
            renderer.writeConstellationNames(Object.values(constellationData));
            renderer.drawGaiaStars(gaia101_110Data, gaia101_110HelpData, 10.1);
            renderer.drawGaiaStars(gaia111_115Data, gaia111_115HelpData, 11.1);
            renderer.drawObject(jupiter);
            renderer.drawObject(moon);
        }
        const controller = new InteractionController(canvas, config.renderOptions, renderAll);
        // 描画
        renderAll();
        // renderAll関数とrenderer、controllerをグローバルに公開
        window.renderAll = renderAll;
        window.renderer = renderer;
        window.controller = controller;
        console.log('🎨 renderer published to window:', window.renderer);
        console.log('🎨 renderer has updateOptions method:', typeof window.renderer.updateOptions);
        setupButtonEvents();
        setupResizeHandler();
        updateInfoDisplay();
        setupTimeUpdate();
        // 木星データの表示（テスト用）
        const info = document.createElement('div');
        info.style.cssText = `
            position: fixed;
            top: 100px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 10;
            font-size: 12px;
        `;
        info.innerHTML = `
            <h4>木星の情報</h4>
            <p>日本語名: ${jupiterData.jpnName}</p>
            <p>英語名: ${jupiterData.engName}</p>
            <p>軌道長半径: ${jupiterData.a} AU</p>
        `;
        // app.appendChild(info);
    }
    catch (error) {
        console.error('データの読み込みに失敗しました:', error);
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.textContent = `エラー: ${error instanceof Error ? error.message : '不明なエラーが発生しました'}`;
        app.appendChild(errorDiv);
    }
}
function setupButtonEvents() {
    // 設定ボタン
    document.getElementById('settingBtn')?.addEventListener('click', showSetting);
    document.getElementById('settingBtnMobile')?.addEventListener('click', showSetting);
    // 検索ボタン
    document.getElementById('searchBtn')?.addEventListener('click', openSearch);
    document.getElementById('searchBtnMobile')?.addEventListener('click', openSearch);
    // 説明ボタン
    document.getElementById('descriptionBtn')?.addEventListener('click', descriptionFunc);
    document.getElementById('descriptionBtnMobile')?.addEventListener('click', descriptionFunc);
    // 全画面ボタン
    document.getElementById('fullScreenBtn')?.addEventListener('click', fullScreenFunc);
    document.getElementById('fullScreenBtnMobile')?.addEventListener('click', fullScreenFunc);
    // 設定画面のタブ切り替え
    document.querySelectorAll('.setting-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.target.getAttribute('data-tab');
            if (tabName) {
                SettingController.switchSettingTab(tabName);
            }
        });
    });
    // 設定画面のOKボタン
    document.getElementById('showBtn')?.addEventListener('click', SettingController.finishSetting);
    // 検索画面の閉じるボタン
    document.getElementById('closeSearch')?.addEventListener('click', SearchController.closeSearch);
    // 天体説明画面の閉じるボタン
    document.getElementById('closeObjectInfo')?.addEventListener('click', closeObjectInfo);
    document.getElementById('magLimitSlider')?.addEventListener('change', function () {
        const magLimitSlider = document.getElementById('magLimitSlider');
        const magLimitSliderValue = parseFloat(magLimitSlider.value);
        updateRenderOptions({
            starSizeKey1: magLimitSliderValue,
            starSizeKey2: 1.8
        });
    });
}
function setupResizeHandler() {
    window.addEventListener('resize', handleResize);
    handleResize(); // 初期実行
}
// 基本的なUI制御関数
function showSetting() {
    const setting = document.getElementById('setting');
    if (window.innerWidth <= 768) {
        setting?.classList.add('show');
    }
    else {
        setting.style.display = 'block';
    }
}
function openSearch() {
    const searchDiv = document.getElementById('searchDiv');
    searchDiv.style.display = 'block';
    document.getElementById('searchInput')?.focus();
}
function descriptionFunc() {
    const description = document.getElementById('description');
    if (description.style.display === 'none') {
        description.style.display = 'block';
    }
    else {
        description.style.display = 'none';
    }
}
function fullScreenFunc() {
    if (document.documentElement.requestFullscreen) {
        console.log('fullScreenFunc: make full screen');
        document.documentElement.requestFullscreen();
        document.getElementById('fullScreenBtn').innerHTML = `<img src="images/exitFullScreenBtn.png" alt="全画面表示終了">`;
    }
    else {
        console.log('fullScreenFunc: make normal screen');
        document.exitFullscreen();
        document.getElementById('fullScreenBtn').innerHTML = `<img src="images/fullScreenBtn.png" alt="全画面表示">`;
    }
}
function closeObjectInfo() {
    const objectInfo = document.getElementById('objectInfo');
    objectInfo.style.display = 'none';
}
// ページ読み込み時に実行
window.addEventListener('DOMContentLoaded', main);
//# sourceMappingURL=main.js.map