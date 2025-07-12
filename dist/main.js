import { ObservationSiteController } from './controllers/ObservationSiteController.js';
import { SettingController } from './controllers/SettingController.js';
import { SearchController } from './controllers/SearchController.js';
import { SolarSystemController } from './controllers/SolarSystemController.js';
import { TimeController } from './controllers/TimeController.js';
import { DataStore } from './models/DataStore.js';
import { SolarSystemDataManager } from './models/SolarSystemObjects.js';
import { CanvasRenderer } from './renderer/CanvasRenderer.js';
import { InteractionController } from "./renderer/interactionController.js";
import { AstronomicalCalculator } from './utils/calculations.js';
import { CoordinateConverter } from './utils/coordinates.js';
import { DataLoader } from './utils/DataLoader.js';
import { updateInfoDisplay, handleResize, setupTimeUpdate } from './utils/uiUtils.js';
// 初期設定を読み込む関数
function initializeConfig() {
    const savedSettings = localStorage.getItem('config');
    const savedSettingsObject = savedSettings ? JSON.parse(savedSettings) : null;
    const now = new Date();
    // console.log('🔧 savedSettingsObject:', savedSettingsObject);
    const displaySettings = {
        darkMode: false,
        mode: 'view',
        showGrid: true,
        showReticle: true,
        showStars: true,
        showStarNames: true,
        showPlanets: true,
        showConstellationNames: true,
        showConstellationLines: true,
        showMessiers: true,
        showRecs: true,
        showNGC: false,
        showCameraView: false,
        camera: 'r200ss-cmos',
        showTopography: false // 読み込み時は常にfalse
    };
    const viewState = {
        centerRA: 90,
        centerDec: 0,
        centerAz: 180,
        centerAlt: 45,
        fieldOfViewRA: 60,
        fieldOfViewDec: 60,
        starSizeKey1: 11.5,
        starSizeKey2: 1.8
    };
    const observationSite = {
        observerPlanet: '地球',
        name: 'カスタム',
        latitude: 35.0,
        longitude: 135.0,
        timezone: 9
    };
    const displayTime = {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds(),
        jd: AstronomicalCalculator.calculateCurrentJdTT(),
        realTime: 'off'
    };
    if (savedSettingsObject && savedSettingsObject.displaySettings) {
        const savedDisplaySettings = savedSettingsObject.displaySettings;
        displaySettings.darkMode = savedDisplaySettings.darkMode !== undefined ? savedDisplaySettings.darkMode : displaySettings.darkMode;
        displaySettings.mode = savedDisplaySettings.mode !== undefined ? savedDisplaySettings.mode : displaySettings.mode;
        displaySettings.showReticle = savedDisplaySettings.showReticle !== undefined ? savedDisplaySettings.showReticle : displaySettings.showReticle;
        displaySettings.showGrid = savedDisplaySettings.showGrid !== undefined ? savedDisplaySettings.showGrid : displaySettings.showGrid;
        displaySettings.showStars = savedDisplaySettings.showStars !== undefined ? savedDisplaySettings.showStars : displaySettings.showStars;
        displaySettings.showStarNames = savedDisplaySettings.showStarNames !== undefined ? savedDisplaySettings.showStarNames : displaySettings.showStarNames;
        displaySettings.showPlanets = savedDisplaySettings.showPlanets !== undefined ? savedDisplaySettings.showPlanets : displaySettings.showPlanets;
        displaySettings.showConstellationNames = savedDisplaySettings.showConstellationNames !== undefined ? savedDisplaySettings.showConstellationNames : displaySettings.showConstellationNames;
        displaySettings.showConstellationLines = savedDisplaySettings.showConstellationLines !== undefined ? savedDisplaySettings.showConstellationLines : displaySettings.showConstellationLines;
        displaySettings.showMessiers = savedDisplaySettings.showMessiers !== undefined ? savedDisplaySettings.showMessiers : displaySettings.showMessiers;
        displaySettings.showRecs = savedDisplaySettings.showRecs !== undefined ? savedDisplaySettings.showRecs : displaySettings.showRecs;
        displaySettings.showNGC = savedDisplaySettings.showNGC !== undefined ? savedDisplaySettings.showNGC : displaySettings.showNGC;
        displaySettings.camera = savedDisplaySettings.camera !== undefined ? savedDisplaySettings.camera : displaySettings.camera;
    }
    if (savedSettingsObject && savedSettingsObject.viewState) {
        const savedViewState = savedSettingsObject.viewState;
        viewState.centerRA = savedViewState.centerRA !== undefined ? savedViewState.centerRA : viewState.centerRA;
        viewState.centerDec = savedViewState.centerDec !== undefined ? savedViewState.centerDec : viewState.centerDec;
        viewState.centerAz = savedViewState.centerAz !== undefined ? savedViewState.centerAz : viewState.centerAz;
        viewState.centerAlt = savedViewState.centerAlt !== undefined ? savedViewState.centerAlt : viewState.centerAlt;
        viewState.fieldOfViewRA = savedViewState.fieldOfViewRA !== undefined ? savedViewState.fieldOfViewRA : viewState.fieldOfViewRA;
        viewState.fieldOfViewDec = savedViewState.fieldOfViewDec !== undefined ? savedViewState.fieldOfViewDec : viewState.fieldOfViewDec;
        viewState.starSizeKey1 = savedViewState.starSizeKey1 !== undefined ? savedViewState.starSizeKey1 : viewState.starSizeKey1;
        viewState.starSizeKey2 = savedViewState.starSizeKey2 !== undefined ? savedViewState.starSizeKey2 : viewState.starSizeKey2;
    }
    viewState.fieldOfViewDec = viewState.fieldOfViewRA * window.innerHeight / window.innerWidth;
    if (savedSettingsObject && savedSettingsObject.observationSite) {
        const savedObservationSite = savedSettingsObject.observationSite;
        observationSite.observerPlanet = savedObservationSite.observerPlanet !== undefined ? savedObservationSite.observerPlanet : observationSite.observerPlanet;
        observationSite.name = savedObservationSite.name !== undefined ? savedObservationSite.name : observationSite.name;
        observationSite.latitude = savedObservationSite.latitude !== undefined ? savedObservationSite.latitude : observationSite.latitude;
        observationSite.longitude = savedObservationSite.longitude !== undefined ? savedObservationSite.longitude : observationSite.longitude;
        observationSite.timezone = savedObservationSite.timezone !== undefined ? savedObservationSite.timezone : observationSite.timezone;
    }
    if (savedSettingsObject && savedSettingsObject.displayTime &&
        savedSettingsObject.displayTime.realTime &&
        savedSettingsObject.displayTime.realTime === 'off') {
        displayTime.year = savedSettingsObject.displayTime.year !== undefined ? savedSettingsObject.displayTime.year : displayTime.year;
        displayTime.month = savedSettingsObject.displayTime.month !== undefined ? savedSettingsObject.displayTime.month : displayTime.month;
        displayTime.day = savedSettingsObject.displayTime.day !== undefined ? savedSettingsObject.displayTime.day : displayTime.day;
        displayTime.hour = savedSettingsObject.displayTime.hour !== undefined ? savedSettingsObject.displayTime.hour : displayTime.hour;
        displayTime.minute = savedSettingsObject.displayTime.minute !== undefined ? savedSettingsObject.displayTime.minute : displayTime.minute;
        displayTime.second = savedSettingsObject.displayTime.second !== undefined ? savedSettingsObject.displayTime.second : displayTime.second;
        displayTime.jd = savedSettingsObject.displayTime.jd !== undefined ? savedSettingsObject.displayTime.jd : displayTime.jd;
        displayTime.realTime = savedSettingsObject.displayTime.realTime !== undefined ? savedSettingsObject.displayTime.realTime : displayTime.realTime;
    }
    const siderealTime = AstronomicalCalculator.calculateLocalSiderealTime(displayTime.jd, observationSite.longitude);
    const converter = new CoordinateConverter();
    if (displaySettings.mode === 'AEP') {
        const centerHorizontal = converter.equatorialToHorizontal({ ra: viewState.centerRA, dec: viewState.centerDec }, siderealTime, observationSite.latitude);
        viewState.centerAz = centerHorizontal.az;
        viewState.centerAlt = centerHorizontal.alt;
    }
    else if (displaySettings.mode === 'view') {
        const centerEquatorial = converter.horizontalToEquatorial({ az: viewState.centerAz, alt: viewState.centerAlt }, siderealTime, observationSite.latitude);
        viewState.centerRA = centerEquatorial.ra;
        viewState.centerDec = centerEquatorial.dec;
    }
    return {
        displaySettings: displaySettings,
        viewState: viewState,
        observationSite: observationSite,
        displayTime: displayTime,
        canvasSize: {
            width: window.innerWidth,
            height: window.innerHeight
        },
        siderealTime: siderealTime
    };
}
// 星空表示の設定
export const config = initializeConfig();
// resetConfig();
// 設定をリセットする関数
export function resetConfig() {
    console.log('🔄 Resetting config to default values');
    localStorage.removeItem('config');
    const defaultConfig = initializeConfig();
    Object.assign(config, defaultConfig);
    window.config = config;
    console.log('🔄 Config reset completed');
}
// newconfigを受け取り、configを更新する
export function updateConfig(newConfig) {
    Object.assign(config, newConfig);
    window.config = config;
    if (newConfig.displaySettings) {
        Object.assign(config.displaySettings, newConfig.displaySettings);
        window.renderer.updateOptions(config.displaySettings);
        window.controller.updateOptions(config.displaySettings);
    }
    // 時刻関連の更新があればTimeControllerも更新
    if (newConfig.displayTime) {
        TimeController.onConfigUpdate();
    }
    window.renderAll();
    updateInfoDisplay();
}
// ViewStateのみを更新する関数
export function updateViewState(newViewState) {
    Object.assign(config.viewState, newViewState);
    window.renderer.updateOptions(newViewState);
    window.controller.updateOptions(newViewState);
    window.renderAll();
    updateInfoDisplay();
}
function resetAll() {
    // LocalStorage, config, UIをリセット
    resetConfig();
    SettingController.loadSettingsFromConfig();
}
// グローバルにconfigを公開（SettingControllerからアクセス可能）
window.config = config;
window.updateConfig = updateConfig;
window.updateViewState = updateViewState;
window.updateInfoDisplay = updateInfoDisplay;
window.resetConfig = resetConfig;
window.saveConfig = SettingController.saveConfigToLocalStorage;
window.loadSettingsFromConfig = SettingController.loadSettingsFromConfig;
window.updateTimeSlider = TimeController.updateSlider;
window.toggleRealTime = TimeController.toggleRealTime;
// メイン関数
export async function main() {
    const app = document.getElementById('app');
    if (!app)
        return;
    try {
        // データの読み込み
        const [hipStars, gaia100Data, gaia101_110Data, gaia111_115Data, gaia100HelpData, gaia101_110HelpData, gaia111_115HelpData, constellationData, messierData, recData, ngcData, starNames] = await Promise.all([
            DataLoader.loadHIPData(),
            DataLoader.loadGaiaData('-100'),
            DataLoader.loadGaiaData('101-110'),
            DataLoader.loadGaiaData('111-115'),
            DataLoader.loadGaiaHelpData('-100'),
            DataLoader.loadGaiaHelpData('101-110'),
            DataLoader.loadGaiaHelpData('111-115'),
            DataLoader.loadConstellationData(),
            DataLoader.loadMessierData(),
            DataLoader.loadRecData(),
            DataLoader.loadNGCData(),
            DataLoader.loadStarNames(),
        ]);
        document.getElementById('loadingtext').innerHTML = 'storing...';
        DataStore.hipStars = hipStars;
        // DataStore.gaia100Data = gaia100Data;
        // DataStore.gaia101_110Data = gaia101_110Data;
        // DataStore.gaia111_115Data = gaia111_115Data;
        DataStore.constellationData = constellationData;
        DataStore.messierData = messierData;
        DataStore.recData = recData;
        DataStore.ngcData = ngcData;
        DataStore.starNames = starNames;
        await SolarSystemController.initialize();
        // ★ 初回読み込み時に全太陽系天体データを更新
        SolarSystemDataManager.updateAllData(config.displayTime.jd);
        document.getElementById('loadingtext').innerHTML = '';
        // キャンバスの取得（HTMLで作成済み）
        const canvas = document.getElementById('starChartCanvas');
        if (!canvas) {
            throw new Error('Canvas element not found');
        }
        // キャンバスのサイズを設定
        canvas.width = config.canvasSize.width;
        canvas.height = config.canvasSize.height;
        // レンダラーの作成
        const renderer = new CanvasRenderer(canvas, config);
        function renderAll() {
            renderer.clear();
            renderer.drawGrid();
            renderer.drawConstellationLines(constellationData);
            renderer.drawGaiaStars(gaia111_115Data, gaia111_115HelpData, 11.1);
            renderer.drawGaiaStars(gaia101_110Data, gaia101_110HelpData, 10.1);
            renderer.drawGaiaStars(gaia100Data, gaia100HelpData, 0);
            renderer.drawHipStars(hipStars);
            renderer.drawMessier(messierData);
            renderer.drawRec(recData);
            renderer.drawNGC(ngcData);
            renderer.writeConstellationNames(constellationData);
            renderer.drawSolarSystemObjects();
            renderer.drawReticle();
        }
        const controller = new InteractionController(canvas, config, renderAll);
        // renderAll関数とrenderer、controllerをグローバルに公開
        window.renderAll = renderAll;
        window.renderer = renderer;
        window.controller = controller;
        setupButtonEvents();
        setupResizeHandler();
        // localStorageから読み込んだ設定をUIに反映（HTML要素が読み込まれた後に実行）
        SettingController.loadSettingsFromConfig();
        // 時刻コントローラーを初期化
        TimeController.initialize();
        // 観測地コントローラーを初期化
        ObservationSiteController.initialize();
        updateInfoDisplay();
        setupTimeUpdate();
        // 描画
        renderAll();
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
    document.getElementById('searchBtn')?.addEventListener('click', SearchController.toggleSearch);
    document.getElementById('searchBtnMobile')?.addEventListener('click', SearchController.toggleSearch);
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
    document.getElementById('clearLocalStorage')?.addEventListener('click', resetAll);
    SearchController.setupSearchInput();
    // 検索画面の閉じるボタン
    // document.getElementById('closeSearch')?.addEventListener('click', SearchController.closeSearch);
    // 天体説明画面の閉じるボタン
    document.getElementById('closeObjectInfo')?.addEventListener('click', closeObjectInfo);
    document.getElementById('dtlNow')?.addEventListener('click', function () {
        const dtl = document.getElementById('dtl');
        const now = new Date();
        dtl.value = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0') + 'T' +
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0');
        console.log(dtl.value);
    });
    document.getElementById('magLimitSlider')?.addEventListener('change', function () {
        const magLimitSlider = document.getElementById('magLimitSlider');
        const magLimitSliderValue = parseFloat(magLimitSlider.value);
        updateViewState({
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
        if (setting.style.display === 'none') {
            setting.style.display = 'block';
        }
        setting.classList.add('show');
    }
    else {
        setting.style.display = 'block';
    }
    // 設定画面を開く際に、現在のconfigからUIに値を反映
    SettingController.loadSettingsFromConfig();
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