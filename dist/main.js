import { CacheInfoController } from './controllers/CacheInfoController.js';
import { ObjectInfoController } from './controllers/ObjectInfoController.js';
import { ObservationSiteController } from './controllers/ObservationSiteController.js';
import { ShareController } from './controllers/ShareController.js';
import { SearchController } from './controllers/SearchController.js';
import { SettingController } from './controllers/SettingController.js';
import { TimeController } from './controllers/TimeController.js';
import { UserObjectController } from './controllers/UserObjectController.js';
import { DataStore } from './models/DataStore.js';
import { SolarSystemDataManager } from './models/SolarSystemObjects.js';
import { createRenderer } from './renderer/index.js';
import { InteractionController } from "./renderer/interactionController.js";
import { AstronomicalCalculator } from './utils/calculations.js';
import { CoordinateConverter } from './utils/coordinates.js';
import { DataLoader } from './utils/DataLoader.js';
import { DeviceOrientationManager } from './utils/deviceOrientation.js';
import { updateInfoDisplay, handleResize } from './utils/uiUtils.js';
const news = [
    { time: '2025-10-06T22:45:00', title: '等級設定を追加', text: '星が多すぎると思われるかもしれないので、限界等級の設定を等級スライドバーの下に作りました。' },
    { time: '2025-10-06T19:03:00', title: '最微等級が12.0等級に！', text: '最も暗い星の等級がこれまでの11.5等級から12.0等級になりました！これで星の数は320万個以上になりましたが、工夫して星以外も含めた総データサイズを11MBに抑えています。' },
    { time: '2025-10-04T20:30:00', title: 'アプリ名募集！', text: 'この星図をアンドロイドアプリにします！思ったより早く完成しそうなので名前募集中です～' },
    { time: '2025-09-06T19:30:00', title: '薄明情報', text: '時刻の横に薄明などの状況が出ます' },
    { time: '2025-09-04T23:40:00', title: '月食の表示', text: '8日未明は皆既月食ですね。というわけで月食を表示できるようにしました。' },
    { time: '2025-09-03T21:02:00', title: '検索時のアニメーション', text: '検索した天体までゆっくりと移動するようにしてみました。' },
    { time: '2025-09-03T21:01:00', title: '検索したNGC/IC天体のみの表示', text: 'おすすめに含まれないNGC天体・IC天体を検索したときに、その天体のみ表示するようにしました。NGC/IC天体をすべて表示する必要がなくなりました。' },
    { time: '2025-09-03T21:00:00', title: '太陽系天体の軌跡', text: '惑星などの太陽系天体をタップ/クリックしたときの画面から、移動経路を描画できるようにしました。同時に複数の天体の経路を表示できます。' },
    { time: '2025-08-30T13:50:00', title: '', text: '横に伸びる不具合は直ったでしょうか？' },
    { time: '2025-08-30T13:40:00', title: '彗星追加', text: '今話題のLemmon彗星とK1 ATLASを追加しました。' },
    { time: '2025-08-30T12:40:00', title: '方角の表示', text: 'ご要望に応えてプラネモードで方角を出しました。右上メニュー>ご意見フォームからご意見お待ちしております（SNS繋がってる方はそっちの方が早いです）。' },
    { time: '2025-08-18T00:00:00', title: 'お気に入り天体', text: '自分の好きな天体を星図に表示できるようになりました。設定>その他の設定>お気に入り天体の編集 から設定できます。' },
    { time: '2025-08-15T20:19:30', title: '天の北極・南極', text: '印をつけました' },
    { time: '2025-08-12T12:19:30', title: 'ペルセウス座流星群が見ごろ', text: '曇って見れなさそう...' },
];
function setSessionItem(key, value) {
    try {
        if (value == null || value === '') {
            sessionStorage.removeItem(key);
        }
        else {
            sessionStorage.setItem(key, value);
        }
    }
    catch (_) {
        console.log('setSessionItem error');
    }
}
function getSessionItem(key) {
    try {
        return sessionStorage.getItem(key);
    }
    catch (_) {
        return null;
    }
}
export function setTempTarget(value) {
    if (value == null) {
        setSessionItem('tempTarget', null);
        return;
    }
    setSessionItem('tempTarget', JSON.stringify(value));
}
export function getTempTarget() {
    const raw = getSessionItem('tempTarget');
    if (!raw)
        return null;
    try {
        return raw;
    }
    catch (_) {
        return null;
    }
}
// 初期設定を読み込む関数
function initializeConfig(noLoad = false) {
    const savedSettings = localStorage.getItem('config');
    const savedSettingsObject = savedSettings ? JSON.parse(savedSettings) : null;
    const now = new Date();
    const displaySettings = {
        darkMode: false,
        mode: 'view',
        showGrid: true,
        showReticle: true,
        showObjectInfo: true,
        usedStar: 'to12',
        showStarNames: 'to2',
        showBayerFS: true,
        showPlanets: true,
        showConstellationNames: true,
        showConstellationLines: true,
        showMessiers: true,
        showRecs: true,
        showNGC: false,
        showCameraView: false,
        camera: 'none',
        showTopography: false, // 読み込み時は常にfalse
        equinox: 'apparent'
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
        realTime: 'off',
        loadOnCurrentTime: true
    };
    const planetMotion = {
        planet: [],
        duration: 30,
        interval: 1.0,
        timeDisplayStep: 5,
        timeDisplayContent: 'md'
    };
    const newsPopup = {
        lastShownTime: '',
        dontShow: false
    };
    const canvasSize = {
        width: window.innerWidth,
        height: window.innerHeight
    };
    // URL クエリからの初期値上書き（例: ?ra=123.45）
    const params = new URLSearchParams(location.search);
    const raParam = params.get('ra');
    const decParam = params.get('dec');
    const latParam = params.get('lat');
    const lonParam = params.get('lon');
    const timeParam = params.get('time'); // YYYYMMDD-HHMM.M （JST）
    let raOverride = null;
    let decOverride = null;
    let latOverride = null;
    let lonOverride = null;
    let timeOverride = null;
    if (raParam != null) {
        const raParsed = parseFloat(raParam);
        if (!Number.isNaN(raParsed)) {
            raOverride = ((raParsed % 360) + 360) % 360;
        }
    }
    if (decParam != null) {
        const decParsed = parseFloat(decParam);
        if (!Number.isNaN(decParsed)) {
            decOverride = Math.max(-90, Math.min(90, decParsed));
        }
    }
    if (latParam != null) {
        const latParsed = parseFloat(latParam);
        if (!Number.isNaN(latParsed)) {
            latOverride = Math.max(-90, Math.min(90, latParsed));
        }
    }
    if (lonParam != null) {
        const lonParsed = parseFloat(lonParam);
        if (!Number.isNaN(lonParsed)) {
            // -180～180 に正規化
            lonOverride = (((lonParsed + 180) % 360) + 360) % 360 - 180;
        }
    }
    if (timeParam != null) {
        // フォーマット: YYYYMMDD-HHMMSS
        // 例: 20251017-213030 => 2025/10/17 21:30:30 JST
        const m = timeParam.match(/^(\d{8})-(\d{2})(\d{2})(\d{2})$/);
        if (m) {
            const yyyymmdd = m[1];
            const hourStr = m[2];
            const minuteStr = m[3];
            const secondStr = m[4];
            const year = parseInt(yyyymmdd.slice(0, 4));
            const month = parseInt(yyyymmdd.slice(4, 6));
            const day = parseInt(yyyymmdd.slice(6, 8));
            const hour = parseInt(hourStr);
            const minute = parseInt(minuteStr);
            const second = parseInt(secondStr);
            if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day) &&
                Number.isFinite(hour) && Number.isFinite(minute) && Number.isFinite(second)) {
                timeOverride = { year, month, day, hour, minute, second };
            }
        }
    }
    if (noLoad) {
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
        viewState.fieldOfViewDec = viewState.fieldOfViewRA * canvasSize.height / canvasSize.width;
        return {
            displaySettings: displaySettings,
            viewState: viewState,
            observationSite: observationSite,
            displayTime: displayTime,
            canvasSize: canvasSize,
            planetMotion: planetMotion,
            siderealTime: siderealTime,
            newsPopup: newsPopup
        };
    }
    if (savedSettingsObject && savedSettingsObject.displaySettings) {
        const savedDisplaySettings = savedSettingsObject.displaySettings;
        Object.keys(displaySettings).forEach(key => {
            const savedValue = savedDisplaySettings[key];
            if (savedValue != null) {
                displaySettings[key] = savedValue;
            }
        });
    }
    if (savedSettingsObject && savedSettingsObject.viewState) {
        const savedViewState = savedSettingsObject.viewState;
        Object.keys(viewState).forEach(key => {
            const savedValue = savedViewState[key];
            if (savedValue != null) {
                viewState[key] = savedValue;
            }
        });
    }
    if (raOverride != null) {
        viewState.centerRA = raOverride;
    }
    if (decOverride != null) {
        viewState.centerDec = decOverride;
    }
    viewState.fieldOfViewDec = viewState.fieldOfViewRA * canvasSize.height / canvasSize.width;
    if (savedSettingsObject && savedSettingsObject.observationSite) {
        const savedObservationSite = savedSettingsObject.observationSite;
        Object.keys(observationSite).forEach(key => {
            const savedValue = savedObservationSite[key];
            if (savedValue != null) {
                observationSite[key] = savedValue;
            }
        });
        if (observationSite.name === '地図上で選択' || observationSite.name === '現在地') {
            observationSite.name = 'カスタム';
        }
    }
    if (latOverride != null) {
        observationSite.latitude = latOverride;
        observationSite.name = 'カスタム';
    }
    if (lonOverride != null) {
        observationSite.longitude = lonOverride;
        observationSite.name = 'カスタム';
    }
    if (savedSettingsObject && savedSettingsObject.displayTime) {
        const savedDisplayTime = savedSettingsObject.displayTime;
        displayTime.loadOnCurrentTime = savedDisplayTime.loadOnCurrentTime != null ? savedDisplayTime.loadOnCurrentTime : displayTime.loadOnCurrentTime;
        displayTime.realTime = savedDisplayTime.realTime != null ? savedDisplayTime.realTime : displayTime.realTime;
        if (displayTime.loadOnCurrentTime || displayTime.realTime != 'off' ||
            savedDisplayTime.year == null ||
            savedDisplayTime.month == null || savedDisplayTime.day == null ||
            savedDisplayTime.hour == null || savedDisplayTime.minute == null || savedDisplayTime.second == null) {
            displayTime.year = now.getFullYear();
            displayTime.month = now.getMonth() + 1;
            displayTime.day = now.getDate();
            displayTime.hour = now.getHours();
            displayTime.minute = now.getMinutes();
            displayTime.second = now.getSeconds();
        }
        else {
            displayTime.year = savedDisplayTime.year;
            displayTime.month = savedDisplayTime.month;
            displayTime.day = savedDisplayTime.day;
            displayTime.hour = savedDisplayTime.hour;
            displayTime.minute = savedDisplayTime.minute;
            displayTime.second = savedDisplayTime.second;
        }
    }
    if (timeOverride != null) {
        displayTime.year = timeOverride.year;
        displayTime.month = timeOverride.month;
        displayTime.day = timeOverride.day;
        displayTime.hour = timeOverride.hour;
        displayTime.minute = timeOverride.minute;
        displayTime.second = timeOverride.second;
        displayTime.realTime = 'off';
        displayTime.loadOnCurrentTime = false;
    }
    displayTime.jd = AstronomicalCalculator.jdTTFromYmdhmsJst(displayTime.year, displayTime.month, displayTime.day, displayTime.hour, displayTime.minute, displayTime.second);
    const siderealTime = AstronomicalCalculator.calculateLocalSiderealTime(displayTime.jd, observationSite.longitude);
    if (savedSettingsObject && savedSettingsObject.newsPopup) {
        const savedNewsPopup = savedSettingsObject.newsPopup;
        Object.keys(newsPopup).forEach(key => {
            const savedValue = savedNewsPopup[key];
            if (savedValue != null) {
                newsPopup[key] = savedValue;
            }
        });
    }
    const converter = new CoordinateConverter();
    if (raOverride != null || decOverride != null) {
        const centerHorizontal = converter.equatorialToHorizontal({ ra: viewState.centerRA, dec: viewState.centerDec }, siderealTime, observationSite.latitude);
        viewState.centerAz = centerHorizontal.az;
        viewState.centerAlt = centerHorizontal.alt;
    }
    else {
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
    }
    return {
        displaySettings: displaySettings,
        viewState: viewState,
        observationSite: observationSite,
        displayTime: displayTime,
        canvasSize: canvasSize,
        planetMotion: planetMotion,
        siderealTime: siderealTime,
        newsPopup: newsPopup
    };
}
// 星空表示の設定
export const config = initializeConfig();
// 設定をリセットする関数
export function resetConfig() {
    localStorage.removeItem('config');
    const defaultConfig = initializeConfig();
    Object.assign(config, defaultConfig);
    window.config = config;
    console.log('🔄 Config reset completed');
}
// newconfigを受け取り、configを更新する
export function updateConfig(newConfig) {
    const config = window.config;
    // 状態変更時はクエリパラメータをクリア
    resetURL();
    Object.assign(config, newConfig);
    if (newConfig.displayTime || (newConfig.observationSite && newConfig.observationSite.longitude)) {
        config.siderealTime = AstronomicalCalculator.calculateLocalSiderealTime(config.displayTime.jd, config.observationSite.longitude);
    }
    // ダークモードが変更された場合、色管理システムを更新
    if (newConfig.displaySettings?.darkMode !== undefined) {
        import('./utils/colorManager.js').then(({ getColorManager }) => {
            getColorManager(newConfig.displaySettings.darkMode);
            // レンダラーの色も即時更新
            // if ((window as any).renderer && (window as any).renderer.updateOptions) {
            //     (window as any).renderer.updateOptions({ displaySettings: { ...config.displaySettings } });
            // }
        });
    }
    window.config = config;
    window.renderer.updateOptions(config);
    if (newConfig.displaySettings || newConfig.viewState) {
        window.interactionController.updateOptions({
            displaySettings: config.displaySettings,
            viewState: config.viewState
        });
    }
    console.log('updateConfig called');
    console.log(config);
    window.renderAll();
}
function resetAll() {
    // LocalStorage, config, UIをリセット
    resetConfig();
    SettingController.setUiOnConfig();
}
function resetURL() {
    try {
        if (location.search && history.replaceState) {
            const newUrl = location.pathname + location.hash;
            history.replaceState(null, '', newUrl);
        }
    }
    catch (_) {
        // noop
    }
}
function showErrorMessage(text) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.style.display = 'block';
        const errorMessageText = document.getElementById('errorMessage-text');
        if (errorMessageText) {
            errorMessageText.innerHTML = text;
        }
        const errorConfig = document.getElementById('error-config');
        if (errorConfig) {
            errorConfig.innerHTML = JSON.stringify(config).replace(/\\n/g, '<br>').replace(/\\"/g, '"').replace(/\\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;').replace(/\\r/g, '');
        }
        const errorUserObject = document.getElementById('error-userObject');
        const userObject = localStorage.getItem('userObject');
        if (errorUserObject && userObject) {
            errorUserObject.innerHTML = JSON.stringify(JSON.parse(userObject)).replace(/\\n/g, '<br>').replace(/\\"/g, '"').replace(/\\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;').replace(/\\r/g, '');
        }
        else if (errorUserObject) {
            errorUserObject.innerHTML = 'userObjectはLocalStorageにありません';
        }
    }
    console.log(errorMessage);
}
window.config = config;
window.updateConfig = updateConfig;
window.updateInfoDisplay = updateInfoDisplay;
window.showErrorMessage = showErrorMessage;
export async function main() {
    const app = document.getElementById('app');
    if (!app)
        return;
    try {
        // 設定を初期化（DOM要素が読み込まれた後に実行）
        const config = initializeConfig();
        window.config = config;
        // 色管理システムを初期化
        const { getColorManager } = await import('./utils/colorManager.js');
        getColorManager(config.displaySettings.darkMode);
        // キャンバスの取得（HTMLで作成済み）
        const canvas = document.getElementById('starChartCanvas');
        if (!canvas) {
            throw new Error('Canvas element not found');
        }
        canvas.width = config.canvasSize.width;
        canvas.height = config.canvasSize.height;
        ;
        // レンダラーの作成（URLパラメータ renderer=webgl で切替。例: ?renderer=webgl）
        const params = new URLSearchParams(location.search);
        const rendererType = (params.get('renderer') === 'webgl') ? 'webgl' : 'canvas';
        const renderer = createRenderer(rendererType, canvas, config);
        window.renderer = renderer;
        // データの読み込み（段階的に）
        let hipStars = [];
        let gaia100Data = [];
        let gaia101_110Data = [];
        let gaia111_120Data = [];
        let gaia100HelpData = [];
        let gaia101_110HelpData = [];
        let gaia111_120HelpData = [];
        let brightStars = [];
        let constellationData = [];
        let constellationBoundariesData = [];
        let messierData = [];
        let recData = [];
        let ngcData = [];
        let starNames = [];
        // imageCacheの初期化
        const imageCache = {};
        const imageCacheNames = [];
        function renderAll() {
            const time000 = performance.now();
            renderer.clearObjectInfomation();
            renderer.clear();
            const tempTarget = getTempTarget();
            renderer.drawGrid();
            renderer.drawPoleMark();
            renderer.drawCameraView();
            renderer.drawConstellationLines(constellationData);
            const time100 = performance.now();
            renderer.drawGaiaStars(gaia111_120Data, gaia111_120HelpData, 11.1);
            renderer.drawGaiaStars(gaia101_110Data, gaia101_110HelpData, 10.1);
            renderer.drawGaiaStars(gaia100Data, gaia100HelpData, 0);
            const time200 = performance.now();
            renderer.drawHipStars(hipStars);
            renderer.writeStarNames(starNames);
            renderer.drawBayerDesignations(brightStars, AstronomicalCalculator.limitingMagnitude(config));
            renderer.drawMessier(messierData);
            renderer.drawRec(DataStore.getRecData());
            renderer.drawNGC(ngcData);
            renderer.drawTempTarget(tempTarget);
            renderer.writeConstellationNames(constellationData);
            renderer.drawSolarSystemObjects();
            renderer.drawReticle();
            updateInfoDisplay();
            const time300 = performance.now();
            // if (1 || time300 - time000 > 10) {
            //     console.log((time300 - time000).toFixed(1), 'ms (', (time100 - time000).toFixed(1), 'ms, ', (time200 - time100).toFixed(1), 'ms, ', (time300 - time200).toFixed(1), 'ms)');
            // }
        }
        window.renderAll = renderAll;
        // localStorageから読み込んだ設定をUIに反映（HTML要素が読み込まれた後に実行）
        SettingController.setUiOnConfig();
        TimeController.initialize();
        ObservationSiteController.initialize();
        const deviceOrientationManager = new DeviceOrientationManager();
        window.deviceOrientationManager = deviceOrientationManager;
        if (deviceOrientationManager.isOrientationAvailable()) {
            deviceOrientationManager.setupOrientationListener();
        }
        setupOrientationPermissionButton(deviceOrientationManager);
        // フルスクリーン状態変更の監視（複数のイベントに対応）
        const fullscreenEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
        fullscreenEvents.forEach(eventName => {
            document.addEventListener(eventName, () => {
                const isFullscreen = !!(document.fullscreenElement ||
                    document.webkitFullscreenElement ||
                    document.mozFullScreenElement ||
                    document.msFullscreenElement);
                updateFullScreenState(isFullscreen);
            });
        });
        updateInfoDisplay();
        // 段階的なデータ読み込みとレンダリング
        const loadDataStep = async () => {
            try {
                [constellationData, constellationBoundariesData, hipStars] = await Promise.all([
                    DataLoader.loadConstellationData(),
                    DataLoader.loadConstellationBoundariesData(),
                    DataLoader.loadHIPData()
                ]);
                DataStore.constellationData = constellationData;
                DataStore.constellationBoundariesData = constellationBoundariesData;
                document.getElementById('loadingtext').innerHTML = 'loading 3/14';
                renderAll();
                [messierData, recData, starNames, gaia100Data, gaia100HelpData] = await Promise.all([
                    DataLoader.loadMessierData(),
                    DataLoader.loadRecData(),
                    DataLoader.loadStarNames(),
                    DataLoader.loadGaiaData('-100'),
                    DataLoader.loadGaiaHelpData('-100'),
                ]);
                DataStore.messierData = messierData;
                DataStore.recData = recData;
                document.getElementById('loadingtext').innerHTML = 'loading 8/14';
                renderAll();
                [gaia101_110Data, gaia101_110HelpData] = await Promise.all([
                    DataLoader.loadGaiaData('101-110'),
                    DataLoader.loadGaiaHelpData('101-110')
                ]);
                document.getElementById('loadingtext').innerHTML = 'loading 10/14';
                renderAll();
                [ngcData, brightStars] = await Promise.all([
                    DataLoader.loadNGCData(),
                    DataLoader.loadBrightStars()
                ]);
                document.getElementById('loadingtext').innerHTML = 'loading 12/14';
                renderAll();
                // imageCacheの更新
                if (messierData.length > 0) {
                    for (const messier of messierData) {
                        if (messier.getOverlay() != null && messier.getName() != null) {
                            imageCacheNames.push(messier.getName());
                        }
                    }
                }
                if (DataStore.getRecData().length > 0) {
                    for (const rec of DataStore.getRecData()) {
                        if (rec.getOverlay() != null && rec.getName() != null) {
                            imageCacheNames.push(rec.getName());
                        }
                    }
                }
                for (const name of imageCacheNames) {
                    try {
                        const img = new Image();
                        img.src = `./chartImage/overlay/${name}.PNG`;
                        imageCache[name] = img;
                    }
                    catch (error) {
                        console.error(`Error loading image for ${name}:`, error);
                    }
                }
                renderer.setImageCache(imageCache);
                [gaia111_120Data, gaia111_120HelpData] = await Promise.all([
                    DataLoader.loadGaiaData('111-120'),
                    DataLoader.loadGaiaHelpData('111-120')
                ]);
                document.getElementById('loadingtext').innerHTML = '';
                renderAll();
                DataStore.hipStars = hipStars;
                DataStore.ngcData = ngcData;
                DataStore.starNames = starNames;
            }
            catch (error) {
                console.error('データの読み込みに失敗しました:', error);
                window.showErrorMessage(`loadDataStep() in main() in main.ts: ${error}`);
                return;
            }
        };
        loadDataStep();
        await SolarSystemDataManager.initialize();
        const interactionController = new InteractionController(canvas, config, renderAll);
        window.interactionController = interactionController;
        UserObjectController.init();
        setupButtonEvents();
        setupResizeHandler();
        document.getElementById('loadingtext').innerHTML = '';
        // お知らせポップアップの表示チェック
        showNewsPopupIfNeeded();
    }
    catch (error) {
        console.error('データの読み込みに失敗しました:', error);
        window.showErrorMessage(`main() in main.ts: ${error}`);
        return;
    }
}
function descriptionFunc() {
    const description = document.getElementById('description');
    if (description.style.display === 'none') {
        description.style.display = 'block';
        document.body.classList.add('subwindow-open');
    }
    else {
        description.style.display = 'none';
        document.body.classList.remove('subwindow-open');
    }
}
function togglefullScreen() {
    console.log('togglefullScreen called');
    console.log('document.fullscreenElement:', document.fullscreenElement);
    // 現在のフルスクリーン状態をチェック
    if (!document.fullscreenElement) {
        // フルスクリーンでない場合、フルスクリーンにする
        console.log('togglefullScreen: entering full screen');
        // 各ブラウザのフルスクリーンAPIを試行
        const element = document.documentElement;
        const requestFullscreen = element.requestFullscreen ||
            element.webkitRequestFullscreen ||
            element.mozRequestFullScreen ||
            element.msRequestFullscreen;
        if (requestFullscreen) {
            requestFullscreen.call(element).then(() => {
                window.renderAll();
                updateFullScreenState(true);
                console.log('Successfully entered fullscreen');
            }).catch((err) => {
                console.error('Failed to enter fullscreen:', err);
            });
        }
        else {
            console.log('requestFullscreen not supported');
        }
    }
    else {
        // フルスクリーンの場合、通常表示に戻す
        console.log('togglefullScreen: exiting full screen');
        const exitFullscreen = document.exitFullscreen ||
            document.webkitExitFullscreen ||
            document.mozCancelFullScreen ||
            document.msExitFullscreen;
        if (exitFullscreen) {
            exitFullscreen.call(document).then(() => {
                window.renderAll();
                updateFullScreenState(false);
                console.log('Successfully exited fullscreen');
            }).catch((err) => {
                console.error('Failed to exit fullscreen:', err);
            });
        }
        else {
            console.log('exitFullscreen not supported');
        }
    }
}
// フルスクリーンボタンの状態を更新する関数
function updateFullScreenState(isFullscreen) {
    const fullScreenBtn = document.getElementById('fullScreenBtn');
    const fullScreenBtnMobile = document.getElementById('fullScreenBtnMobile');
    if (isFullscreen) {
        // フルスクリーンになった時
        console.log('Updating buttons to exit fullscreen state');
        if (fullScreenBtn) {
            fullScreenBtn.innerHTML = `<i class="fas fa-compress" aria-hidden="true"></i>`;
        }
        if (fullScreenBtnMobile) {
            fullScreenBtnMobile.innerHTML = `<i class="fas fa-compress" aria-hidden="true"></i>`;
        }
        const config = window.config;
        // config.canvasSize.width = window.outerWidth;
        config.canvasSize.height = window.outerHeight;
        config.viewState.fieldOfViewDec = config.viewState.fieldOfViewRA * config.canvasSize.height / config.canvasSize.width;
        updateConfig(config);
    }
    else {
        // フルスクリーンが解除された時
        console.log('Updating buttons to enter fullscreen state');
        if (fullScreenBtn) {
            fullScreenBtn.innerHTML = `<i class="fas fa-expand" aria-hidden="true"></i>`;
        }
        if (fullScreenBtnMobile) {
            fullScreenBtnMobile.innerHTML = `<i class="fas fa-expand" aria-hidden="true"></i>`;
        }
        const config = window.config;
        // config.canvasSize.width = window.innerWidth;
        config.canvasSize.height = window.innerHeight;
        config.viewState.fieldOfViewDec = config.viewState.fieldOfViewRA * config.canvasSize.height / config.canvasSize.width;
        updateConfig(config);
    }
}
function setupFullScreenButton() {
    const fullScreenBtn = document.getElementById('fullScreenBtn');
    const fullScreenBtnMobile = document.getElementById('fullScreenBtnMobile');
    if (fullScreenBtn) {
        console.log('fullScreenBtn found, adding event listener');
        fullScreenBtn.addEventListener('click', () => {
            console.log('fullScreenBtn clicked');
            togglefullScreen();
        });
    }
    else {
        console.log('fullScreenBtn not found');
    }
    if (fullScreenBtnMobile) {
        console.log('fullScreenBtnMobile found, adding event listener');
        fullScreenBtnMobile.addEventListener('click', () => {
            console.log('fullScreenBtnMobile clicked');
            togglefullScreen();
        });
    }
    else {
        console.log('fullScreenBtnMobile not found');
    }
    // フルスクリーン状態変更の監視（複数のイベントに対応）
    const fullscreenEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    fullscreenEvents.forEach(eventName => {
        document.addEventListener(eventName, () => {
            console.log(`${eventName} event fired`);
            const isFullscreen = !!(document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement);
            console.log('Fullscreen state:', isFullscreen);
            window.renderAll();
            updateFullScreenState(isFullscreen);
        });
    });
}
// デバイスオリエンテーション許可ボタンの設定
function setupOrientationPermissionButton(deviceOrientationManager) {
    const deviceInfo = deviceOrientationManager.getDeviceInfo();
    const permissionRow = document.getElementById('orientationPermissionRow');
    const permissionBtn = document.getElementById('orientationPermissionBtn');
    // iPhoneの場合のみボタンを表示
    if (deviceInfo.os === 'iphone' && permissionRow && permissionBtn) {
        permissionRow.style.display = 'block';
        permissionBtn.addEventListener('click', async () => {
            const granted = await deviceOrientationManager.requestOrientationPermission();
            if (granted) {
                permissionBtn.textContent = '許可済み';
                permissionBtn.style.backgroundColor = '#666';
                permissionBtn.disabled = true;
                // オリエンテーション変更時のコールバックを設定
                deviceOrientationManager.setOrientationCallback((data) => {
                    // デバイスの向きに応じて表示を更新
                    deviceOrientationManager.handleDeviceOrientation(data);
                });
            }
        });
    }
}
// ページ読み込み時に実行
window.addEventListener('DOMContentLoaded', main);
function setupButtonEvents() {
    console.log("setupButtonEvents called");
    // 設定ボタン
    const settingBtn = document.getElementById('settingBtn');
    if (settingBtn) {
        settingBtn.addEventListener('click', () => {
            SettingController.initialize();
        });
    }
    // 共有ボタン
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            ShareController.copyShareUrl();
        });
    }
    const shareBtnMobile = document.getElementById('shareBtnMobile');
    if (shareBtnMobile) {
        shareBtnMobile.addEventListener('click', () => {
            ShareController.copyShareUrl();
        });
    }
    // 設定ボタン（モバイル）
    const settingBtnMobile = document.getElementById('settingBtnMobile');
    if (settingBtnMobile) {
        settingBtnMobile.addEventListener('click', () => {
            SettingController.initialize();
        });
    }
    else {
    }
    // 天体情報を閉じるボタン
    const closeObjectInfoBtn = document.getElementById('closeObjectInfo');
    if (closeObjectInfoBtn) {
        closeObjectInfoBtn.addEventListener('click', () => {
            ObjectInfoController.closeObjectInfo();
        });
    }
    // 検索ボタン
    document.getElementById('searchBtn')?.addEventListener('click', SearchController.toggleSearch);
    document.getElementById('searchBtnMobile')?.addEventListener('click', SearchController.toggleSearch);
    // 説明ボタン
    const descriptionBtn = document.getElementById('descriptionBtn');
    if (descriptionBtn) {
        descriptionBtn.addEventListener('click', () => {
            descriptionFunc();
        });
    }
    const descriptionBtnMobile = document.getElementById('descriptionBtnMobile');
    if (descriptionBtnMobile) {
        descriptionBtnMobile.addEventListener('click', () => {
            descriptionFunc();
        });
    }
    const closeDescriptionBtn = document.getElementById('closeDescription');
    if (closeDescriptionBtn) {
        closeDescriptionBtn.addEventListener('click', () => {
            descriptionFunc();
        });
    }
    // 全画面ボタン
    setupFullScreenButton();
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
    document.getElementById('checkDefaultConfig')?.addEventListener('click', () => {
        const defaultConfigPopup = document.getElementById('defaultConfigPopup');
        if (defaultConfigPopup) {
            defaultConfigPopup.style.display = 'block';
            const defaultConfigElement = document.getElementById('defaultConfig');
            const defaultConfig = JSON.stringify(initializeConfig(true), null, 2)
                .replace(/\\n/g, '<br>')
                .replace(/\\"/g, '"')
                .replace(/\\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
                .replace(/\\r/g, '')
                .replace(/,/g, ',<br>')
                .replace(/: {/g, ':<br>{');
            if (defaultConfigElement) {
                defaultConfigElement.innerHTML = `<p>${defaultConfig}</p>`;
            }
        }
    });
    document.getElementById('closeDefaultConfigPopup')?.addEventListener('click', () => {
        const defaultConfigPopup = document.getElementById('defaultConfigPopup');
        if (defaultConfigPopup) {
            defaultConfigPopup.style.display = 'none';
        }
    });
    SearchController.setupSearchInput();
    const popupIds = [
        {
            openBtn: 'modeHelpBtn',
            closeBtn: 'closeModeHelp',
            popup: 'modeHelpPopup'
        },
        {
            openBtn: 'observerPlanetHelpBtn',
            closeBtn: 'closeObserverPlanetHelp',
            popup: 'observerPlanetHelpPopup'
        }
    ];
    const openPopup = (popup) => {
        if (popup) {
            popup.style.display = 'flex';
        }
    };
    const closePopup = (popup) => {
        if (popup) {
            popup.style.display = 'none';
        }
    };
    for (let i = 0; i < popupIds.length; i++) {
        const popupId = popupIds[i];
        const openBtn = document.getElementById(popupId.openBtn);
        const closeBtn = document.getElementById(popupId.closeBtn);
        const popup = document.getElementById(popupId.popup);
        // 各配列の要素が存在するかチェック
        if (openBtn) {
            openBtn.addEventListener('click', () => {
                openPopup(popup);
            });
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                closePopup(popup);
            });
        }
        if (popup) {
            popup.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    closePopup(popup);
                }
            });
        }
    }
    document.getElementById('closeObservationSiteMap')?.addEventListener('click', ObservationSiteController.closeMap);
    document.getElementById('dtlNow')?.addEventListener('click', function () {
        const dtl = document.getElementById('dtl');
        // 日本標準時（JST）で現在時刻を取得
        const now = new Date();
        const jstString = now.toLocaleString('sv-SE', {
            timeZone: 'Asia/Tokyo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        // 'sv-SE'形式（YYYY-MM-DD HH:mm:ss）からdatetime-local形式に変換
        dtl.value = jstString.replace(' ', 'T').slice(0, 16);
    });
    document.getElementById('realTime')?.addEventListener('change', function () {
        const realTime = document.getElementById('realTime');
        if (realTime.value !== 'off') {
            SettingController.setCurrentTimeOnSettingDisplay();
        }
    });
    document.getElementById('magLimitSlider')?.addEventListener('change', function () {
        const magLimitSlider = document.getElementById('magLimitSlider');
        const magLimitSliderValue = parseFloat(magLimitSlider.value);
        const viewState = window.config.viewState;
        if (viewState) {
            viewState.starSizeKey1 = magLimitSliderValue;
            viewState.starSizeKey2 = 1.8;
        }
        updateConfig({
            viewState: viewState
        });
    });
    document.getElementById('cameraTiltSlider')?.addEventListener('input', function () {
        window.renderAll();
    });
    // ピンチズームを防ぐためのグローバルタッチイベントハンドラー
    document.addEventListener('touchstart', function (e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    document.addEventListener('touchmove', function (e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    document.addEventListener('gesturestart', function (e) {
        e.preventDefault();
    }, { passive: false });
    document.addEventListener('gesturechange', function (e) {
        e.preventDefault();
    }, { passive: false });
    document.addEventListener('gestureend', function (e) {
        e.preventDefault();
    }, { passive: false });
    // より強力なviewport設定を動的に適用
    const setViewport = () => {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover');
        }
    };
    // ページ読み込み時とリサイズ時にviewportを再設定
    setViewport();
    window.addEventListener('resize', setViewport);
    // iOS Safariでのズーム防止
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    // キャッシュ情報コントローラーを初期化
    CacheInfoController.initialize();
    // お知らせポップアップのイベントリスナー
    document.getElementById('closeNewsPopup')?.addEventListener('click', () => {
        const popup = document.getElementById('newsPopup');
        if (popup) {
            popup.style.display = 'none';
        }
    });
    document.getElementById('closeNewsBtn')?.addEventListener('click', () => {
        const popup = document.getElementById('newsPopup');
        if (popup) {
            popup.style.display = 'none';
        }
    });
    document.getElementById('dontShowAgainBtn')?.addEventListener('click', () => {
        config.newsPopup.dontShow = true;
        localStorage.setItem('config', JSON.stringify(config));
        const popup = document.getElementById('newsPopup');
        if (popup) {
            popup.style.display = 'none';
        }
    });
    // ポップアップ外をクリックして閉じる
    document.getElementById('newsPopup')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            e.target.style.display = 'none';
        }
    });
}
function setupResizeHandler() {
    window.addEventListener('resize', handleResize);
    handleResize(); // 初期実行
}
function showNewsPopupIfNeeded() {
    const now = new Date();
    const currentTime = now.toString();
    const lastShownTimeString = config.newsPopup.lastShownTime;
    const dontShow = config.newsPopup.dontShow;
    // 今後表示しないフラグをチェック
    if (dontShow) {
        console.log('お知らせポップアップ: ユーザーが「今後表示しない」を選択済み');
        return;
    }
    // 最後にアクセスした日時をチェック
    let lastAccess = new Date("2000-01-01T00:00:00");
    if (lastShownTimeString) {
        lastAccess = new Date(lastShownTimeString);
        console.log('最後にアクセスした日時:', lastAccess);
    }
    else {
        console.log('お知らせポップアップ: 初回アクセス');
    }
    const popup = document.getElementById('newsPopup');
    if (popup) {
        let newsCount = 0;
        let newsIndex = 0;
        let newsTimes = [];
        const newsItemElement = document.getElementById('newsItem');
        let text = '';
        let lastItemDate = '';
        while (true) {
            const newsItem = news[newsIndex];
            const newsTime = new Date(newsItem.time);
            // 最後のアクセスより新しく、1か月前より新しいnewsを表示
            const oneMonthAgo = new Date(new Date().setMonth(new Date().getMonth() - 1));
            if (newsTime > lastAccess && newsTime >= oneMonthAgo) {
                const itemDate = newsItem.time.split('T')[0];
                if (newsCount == 0 || itemDate != lastItemDate) {
                    if (newsCount > 0) {
                        text += "</ul>";
                    }
                    text += `<h4>${itemDate}</h4><ul>`;
                    lastItemDate = itemDate;
                }
                text += `<li><strong>${newsItem.title}</strong>: ${newsItem.text}</li>`;
                newsTimes.push(newsItem.time);
                newsCount++;
                newsIndex++;
                if (newsIndex >= news.length) {
                    text += "</ul>";
                    break;
                }
            }
            else {
                if (newsCount > 0) {
                    text += "</ul>";
                }
                break;
            }
        }
        if (newsCount == 0) {
            popup.style.display = 'none';
            return;
        }
        console.log('お知らせポップアップ: 表示します');
        // 少し遅延させて表示（ページ読み込み完了後）
        setTimeout(() => {
            popup.style.display = 'flex';
            newsItemElement.innerHTML = text;
            config.newsPopup.lastShownTime = currentTime;
            updateConfig({
                newsPopup: config.newsPopup
            });
            localStorage.setItem('config', JSON.stringify(config));
            console.log(`お知らせポップアップ: 表示完了 (${currentTime})`);
        }, 500);
    }
}
//# sourceMappingURL=main.js.map