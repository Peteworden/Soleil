//npm run dev
import { ConstellationData, StarName, ConstellationBoundaryData, BayerFlamData, GaiaData, HipData } from './types/index.js';

import { CacheInfoController } from './controllers/CacheInfoController.js';
import { InteractionController } from "./controllers/interactionController.js";
import { ObjectInfoController } from './controllers/ObjectInfoController.js';
import { ObservationSiteController } from './controllers/ObservationSiteController.js';
import { ShareController } from './controllers/ShareController.js';
import { SearchController } from './controllers/SearchController.js';
import { SettingController } from './controllers/SettingController.js';
import { TimeController } from './controllers/TimeController.js';
import { UserObjectController } from './controllers/UserObjectController.js';

import { MessierObject, NGCObject, SharplessObject } from './models/CelestialObject.js';
import { DataStore } from './models/DataStore.js';

import { CanvasRenderer } from './renderer/CanvasRenderer.js';

import { DataLoader } from './loaders/DataLoader.js';
import { DeviceOrientationManager } from './device/deviceOrientation.js';
import { updateInfoDisplay, handleResize } from './utils/uiUtils.js';
import { AstronomicalCalculator } from './core/calculations.js';
import { config, getConfig, resetConfig, setConfigChangeListener, updateConfig, updateConfigOnly } from './core/ConfigManager.js';
import { SolarSystemManager } from './core/SolarSystemManager.js';

const news: { time: string, title: string, text: string }[] = [
    { time: '2026-05-15T00:00:00', title: '高速化', text: '高速化などを目的に、プログラムを大幅に書き換えました。これまですごく無駄な処理をさせていたことがわかりました...。バグあったら教えてください。' },
    { time: '2026-04-16T21:00:00', title: 'C/2025 R3 (PANSTARRS)', text: 'PANSTARRS彗星（C/2025 R3）を追加しました。明け方の東の空、双眼鏡で見えるかも！？' },
    { time: '2026-04-05T00:00:00', title: 'Artemis II オリオン宇宙船の表示', text: 'Artemis II打ち上げ成功！ということで、オリオン宇宙船（Orion Integrity）の位置が出ます！表示される条件などは右上の三本線から。' },
    { time: '2026-02-06T03:00:00', title: '惑星の表示を更新', text: '惑星、特に木星、土星や、今年10月ごろの金星を拡大して見てみてください！' },
    { time: '2026-02-01T18:00:00', title: '詳しい星図の作成が簡単に', text: '「詳しい星図を作る」が、ブラウザで簡単に実行できるようになりました！20等星図とかも作れます。<a href="https://petegaiachart.streamlit.app/">こちら</a>または左上のHOMEから。' },
    { time: '2026-01-29T15:00:00', title: '日時設定の改善', text: '星図の下の方に日時調節エリアを追加し、スライドバーで調節できる範囲やステップの種類を増やしました。' },
    { time: '2026-01-25T03:00:00', title: '恒星の表示を改善', text: '描画速度を維持しつつも、恒星の表示がとてもよくなりました。' },
    { time: '2026-01-18T22:42:00', title: '拡大・縮小の範囲を拡大', text: 'ご意見フォームでいただいた意見を反映し、これまでより広い範囲を表示できるようにしました。バグがあったら教えてください。' },
    { time: '2026-01-18T22:40:00', title: '移動・拡大縮小の改善', text: '指の位置にある星があまり変わらないように、また極付近や天頂付近を触ったときに変なぐるぐるが発生しないようにしました。' },
    { time: '2026-01-12T20:00:00', title: '恒星情報', text: '恒星をタップ・クリックすることで、座標と等級を見れます。ついでに、謎の縦長になってる問題が解決しました。' },
    { time: '2026-01-11T22:00:00', title: '視野の共有', text: 'リンクで共有したときに視野も同じになるようにしました。' },
    { time: '2025-12-13T00:00:00', title: '星の表示を改善', text: '暗い星の透明度を設定したり、明るい星に滲みを付けたりしました。どうでしょう。' },
    { time: '2025-10-29T04:00:00', title: 'シャープレスカタログを追加', text: 'シャープレスカタログに含まれる313のHII領域を追加しました。' },
    { time: '2025-10-26T13:20:00', title: '天の川', text: '天の川の輪郭を作りました。あと、ちょっと前にバイエル符号とフラムスティード番号も出るようにしています。' },
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

function setSessionItem(key: string, value: string | null) {
    try {
        if (value == null || value === '') {
            sessionStorage.removeItem(key);
        } else {
            sessionStorage.setItem(key, value);
        }
    } catch (_) {
        console.log('setSessionItem error');
    }
}

function getSessionItem(key: string): string | null {
    try {
        return sessionStorage.getItem(key);
    } catch (_) {
        return null;
    }
}

function setTempTarget(value: string | null) {
    if (value == null) {
        setSessionItem('tempTarget', null);
        return;
    }
    setSessionItem('tempTarget', JSON.stringify(value));
}

function getTempTarget(): string | null {
    const raw = getSessionItem('tempTarget');
    if (!raw) return null;
    try {
        return raw;
    } catch (_) {
        return null;
    }
}

function hasUrlQueryFunc(): boolean {
    const params = new URLSearchParams(location.search);
    const raParam = params.get('ra');
    const decParam = params.get('dec');
    const latParam = params.get('lat');
    const lonParam = params.get('lon');
    const timeParam = params.get('time'); // YYYYMMDD-HHMM.M （JST）
    const fovParam = params.get('fov');
    return (raParam != null || decParam != null || latParam != null || lonParam != null || timeParam != null || fovParam != null);
}
let hasUrlQuery = hasUrlQueryFunc();

// instances
let renderer: CanvasRenderer | null = null;
let deviceOrientationManager: DeviceOrientationManager | null = null;
let objectInfoController: ObjectInfoController | null = null;
let settingController: SettingController | null = null;
let interactionController: InteractionController | null = null;
let searchController: SearchController | null = null;

function resetAll() {
    // LocalStorage, config, UIをリセット
    resetConfig();
    if (settingController !== null) {
        settingController.setUiOnConfig();
    }
}

function resetURL() {
    if (!hasUrlQuery) return;
    try {
        if (location.search && history.replaceState) {
            const newUrl = location.pathname + location.hash;
            history.replaceState(null, '', newUrl);
        }
    } catch (_) {
        // noop
    }
}

export function showErrorMessage(text: string) {
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
        } else if (errorUserObject) {
            errorUserObject.innerHTML = 'userObjectはLocalStorageにありません';
        }
    }
    console.log(errorMessage);
}

export async function main() {
    const app = document.getElementById('app');
    if (!app) return;

    try {
        console.log('start');

        setConfigChangeListener(() => {
            resetURL();
            // 既存の renderer.updateOptions や window.renderAll()、updateInfoDisplay() をここに集約
            if (renderer !== null) {
                renderer.updateOptions(getConfig());
            }
            renderAll(); // (window as any).renderAll() を直接関数呼び出しに直せます
            updateInfoDisplay();
        });

        // 色管理システムを初期化
        const { getColorManager } = await import('./renderer/colorManager.js');
        getColorManager(config.displaySettings.darkMode);

        // キャンバスの取得（HTMLで作成済み）
        const canvas = document.getElementById('starChartCanvas') as HTMLCanvasElement;
        if (!canvas) {
            throw new Error('Canvas element not found');
        }

        // Canvasの論理サイズを実際の表示サイズに合わせる（スマホでのずれを防ぐ）
        const updateCanvasLogicalSize = () => {
            const rect = canvas.getBoundingClientRect();
            const actualWidth = Math.round(rect.width);
            const actualHeight = Math.round(rect.height);

            // 実際の表示サイズと論理サイズが異なる場合のみ更新
            if (canvas.width !== actualWidth || canvas.height !== actualHeight) {
                canvas.width = actualWidth;
                canvas.height = actualHeight;

                // 視野角も更新
                // let fovRa = config.viewState.fieldOfViewRA;
                // let fovDec = config.viewState.fieldOfViewDec;
                let fov = config.viewState.fov;
                if (actualWidth > actualHeight) {
                    fov.dec = fov.ra * actualHeight / actualWidth;
                } else {
                    fov.ra = fov.dec * actualWidth / actualHeight;
                }

                updateConfigOnly({
                    viewState: {
                        ...config.viewState,
                        // fieldOfViewDec: config.viewState.fieldOfViewRA * actualHeight / actualWidth
                        fov: fov,
                    },
                    canvasSize: {
                        width: actualWidth,
                        height: actualHeight,
                    }
                })
                console.log(`Canvas論理サイズを実際の表示サイズに合わせました: ${actualWidth}x${actualHeight}`);
            }
        };

        // 初期設定: getBoundingClientRect()を使って正確なサイズを取得
        // canvasはDOMに存在するので、すぐに呼べる
        {
            const rect = canvas.getBoundingClientRect();
            const actualWidth = Math.round(rect.width);
            const actualHeight = Math.round(rect.height);

            // 有効な値が取れた場合のみ使用（0の場合はwindow.innerWidth/Heightにフォールバック）
            if (actualWidth > 0 && actualHeight > 0) {
                canvas.width = actualWidth;
                canvas.height = actualHeight;

                // 視野角も更新
                updateConfigOnly({
                    viewState: {
                        ...config.viewState,
                        // fieldOfViewDec: config.viewState.fieldOfViewRA * actualHeight / actualWidth
                        fov: {
                            ra: config.viewState.fov.ra,
                            dec: config.viewState.fov.ra * actualHeight / actualWidth,
                        }
                    },
                    canvasSize: {
                        width: actualWidth,
                        height: actualHeight,
                    }
                })
                console.log(`Canvas初期サイズ: ${actualWidth}x${actualHeight}`);
            } else {
                // フォールバック
                canvas.width = config.canvasSize.width;
                canvas.height = config.canvasSize.height;
                console.log(`Canvas初期サイズ(フォールバック): ${config.canvasSize.width}x${config.canvasSize.height}`);
            }
        }

        // DOMが完全に読み込まれた後にも再度確認（CSSが完全に適用された状態で）
        if (document.readyState !== 'complete') {
            window.addEventListener('load', updateCanvasLogicalSize);
        }
        renderer = new CanvasRenderer(canvas);
        deviceOrientationManager = new DeviceOrientationManager(renderer);
        objectInfoController = new ObjectInfoController(renderer);
        settingController = new SettingController(deviceOrientationManager, renderer);
        settingController.setRenderer(renderer);

        // データの読み込み（段階的に）
        let hipStars: HipData = { raArray: new Float32Array(0), decArray: new Float32Array(0), magArray: new Float32Array(0), bvArray: new Float32Array(0), count: 0 };
        let gaia0_80Data: GaiaData = { raArray: new Float32Array(0), decArray: new Float32Array(0), magArray: new Float32Array(0), count: 0 };
        let gaia81_90Data: GaiaData = { raArray: new Float32Array(0), decArray: new Float32Array(0), magArray: new Float32Array(0), count: 0 };
        let gaia91_100Data: GaiaData = { raArray: new Float32Array(0), decArray: new Float32Array(0), magArray: new Float32Array(0), count: 0 };
        let gaia101_110Data: GaiaData = { raArray: new Float32Array(0), decArray: new Float32Array(0), magArray: new Float32Array(0), count: 0 };
        let gaia111_120Data: GaiaData = { raArray: new Float32Array(0), decArray: new Float32Array(0), magArray: new Float32Array(0), count: 0 };
        let gaia0_80HelpData: number[] = [];
        let gaia81_90HelpData: number[] = [];
        let gaia91_100HelpData: number[] = [];
        let gaia101_110HelpData: number[] = [];
        let gaia111_120HelpData: number[] = [];
        let brightStars: BayerFlamData[] = [];
        let constellationData: ConstellationData[] = [];
        let constellationBoundariesData: ConstellationBoundaryData[] = [];
        let messierData: MessierObject[] = [];
        let recData: MessierObject[] = [];
        let ngcData: NGCObject[] = [];
        let icData: NGCObject[] = [];
        let sharplessData: SharplessObject[] = [];
        let starNames: StarName[] = [];
        let milkyWayData: number[][] = [];
        let artemisEphemerides: number[][] = [];

        // imageCacheの初期化
        const imageCache: { [key: string]: HTMLImageElement } = {};
        const imageCacheNames: string[] = [];

        function renderAll() {
            if (renderer === null) return;
            renderer.clearObjectInformation();
            renderer.clearStarInformation();
            renderer.clear();
            const tempTarget = getTempTarget();
            renderer.drawGrid();
            renderer.drawMilkyWay(milkyWayData);
            renderer.drawPoleMark();
            renderer.drawCameraView();
            renderer.drawConstellationLines(constellationData);
            renderer.drawGaiaStars(gaia111_120Data, gaia111_120HelpData, 11.1);
            renderer.drawGaiaStars(gaia101_110Data, gaia101_110HelpData, 10.1);
            renderer.drawGaiaStars(gaia91_100Data, gaia91_100HelpData, 9.1);
            renderer.drawGaiaStars(gaia81_90Data, gaia81_90HelpData, 8.1);
            renderer.drawGaiaStars(gaia0_80Data, gaia0_80HelpData, 0);
            renderer.drawHipStars(hipStars);
            renderer.writeStarNames(starNames);
            renderer.drawBayerDesignations(brightStars, AstronomicalCalculator.limitingMagnitude(config));
            renderer.drawMessier(messierData);
            renderer.drawRec(DataStore.getRecData());
            renderer.drawNGC(ngcData, icData);
            renderer.drawSharpless(sharplessData);
            renderer.drawTempTarget(tempTarget);
            renderer.writeConstellationNames(constellationData);
            renderer.drawSolarSystemObjects();
            renderer.drawReticle();
        }
        (window as any).renderAll = renderAll;

        // localStorageから読み込んだ設定をUIに反映（HTML要素が読み込まれた後に実行）
        settingController.setUiOnConfig();
        TimeController.initialize();
        ObservationSiteController.initialize();

        if (deviceOrientationManager.isOrientationAvailable()) {
            deviceOrientationManager.setupOrientationListener();
        }
        setupOrientationPermissionButton(deviceOrientationManager);

        // フルスクリーン状態変更の監視（複数のイベントに対応）
        const fullscreenEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];

        fullscreenEvents.forEach(eventName => {
            document.addEventListener(eventName, () => {
                const isFullscreen = !!(document.fullscreenElement ||
                    (document as any).webkitFullscreenElement ||
                    (document as any).mozFullScreenElement ||
                    (document as any).msFullscreenElement);

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
                DataStore.hipStars = hipStars;
                DataStore.constellationData = constellationData;
                DataStore.constellationBoundariesData = constellationBoundariesData;
                document.getElementById('loadingtext')!.innerHTML = 'loading 3/14';
                renderAll();

                [
                    messierData, recData, starNames, gaia0_80Data, gaia0_80HelpData, milkyWayData, artemisEphemerides
                ] = await Promise.all([
                    DataLoader.loadMessierData(),
                    DataLoader.loadRecData(),
                    DataLoader.loadStarNames(),
                    DataLoader.loadGaiaData('0-80', '4bytes', 0),
                    DataLoader.loadGaiaHelpData('0-80'),
                    DataLoader.loadMilkyWayData(),
                    DataLoader.loadArtemisEphemerides()
                ]);
                DataStore.messierData = messierData;
                DataStore.starNames = starNames;
                DataStore.recData = recData;
                DataStore.artemisEphemerides = artemisEphemerides;
                document.getElementById('loadingtext')!.innerHTML = 'loading 8/14';
                renderAll();

                [
                    gaia81_90Data, gaia81_90HelpData,
                    gaia91_100Data, gaia91_100HelpData
                ] = await Promise.all([
                    DataLoader.loadGaiaData('81-90', '3bytes', 8.1),
                    DataLoader.loadGaiaHelpData('81-90'),
                    DataLoader.loadGaiaData('91-100', '3bytes', 9.1),
                    DataLoader.loadGaiaHelpData('91-100')
                ]);
                document.getElementById('loadingtext')!.innerHTML = 'loading 10/14';
                renderAll();

                [[ngcData, icData], brightStars, sharplessData] = await Promise.all([
                    DataLoader.loadNGCData(),
                    DataLoader.loadBrightStars(),
                    DataLoader.loadSharplessData()
                ]);
                DataStore.ngcData = ngcData;
                DataStore.icData = icData;
                DataStore.sharplessData = sharplessData;
                document.getElementById('loadingtext')!.innerHTML = 'loading 12/14';
                renderAll();

                // imageCacheの更新
                if (messierData.length > 0) {
                    for (const messier of messierData) {
                        if (messier.getOverlay() != null && messier.getName() != null) {
                            // imageCacheNames.push(messier.getName());
                            imageCacheNames.push(messier.getOverlay()!.filename);
                        }
                    }
                }
                if (DataStore.getRecData().length > 0) {
                    for (const rec of DataStore.getRecData()) {
                        if (rec.getOverlay() != null && rec.getName() != null) {
                            imageCacheNames.push(rec.getOverlay()!.filename);
                        }
                    }
                }
                for (const name of imageCacheNames) {
                    try {
                        const img = new Image();
                        img.src = `./chartImage/overlay/${name}`;
                        imageCache[name] = img;
                    } catch (error) {
                        console.error(`Error loading image for ${name}:`, error);
                    }
                }
                if (renderer !== null) renderer.setImageCache(imageCache);

                [
                    gaia101_110Data, gaia101_110HelpData,
                    gaia111_120Data, gaia111_120HelpData
                ] = await Promise.all([
                    DataLoader.loadGaiaData('101-110', '3bytes', 10.1),
                    DataLoader.loadGaiaHelpData('101-110'),
                    DataLoader.loadGaiaData('111-120', '3bytes', 11.1),
                    DataLoader.loadGaiaHelpData('111-120')
                ]);
                document.getElementById('loadingtext')!.innerHTML = '';
                renderAll();

            } catch (error) {
                console.error('データの読み込みに失敗しました:', error);
                showErrorMessage(`loadDataStep() in main() in main.ts: ${error}`);
                return;
            }
        };
        loadDataStep();

        await SolarSystemManager.initialize(config.displayTime.jd, config.observationSite.observerPlanet, config.observationSite.latitude, config.siderealTime);

        interactionController = new InteractionController(canvas, config, objectInfoController);
        (window as any).interactionController = interactionController;

        searchController = new SearchController(interactionController);

        UserObjectController.init();

        setupButtonEvents(settingController);

        // 画面のサイズ変更
        window.addEventListener('resize', () => {
            if (renderer !== null) handleResize(renderer);
        });
        handleResize(renderer); // 初期実行

        setupVisibilityHandler(renderAll, canvas, renderer);

        document.getElementById('loadingtext')!.innerHTML = '';
        // お知らせポップアップの表示チェック
        showNewsPopupIfNeeded();
    } catch (error: unknown) {
        console.error('データの読み込みに失敗しました:', error);
        showErrorMessage(`main() in main.ts: ${error}`);
        return;
    }
}

function openOrCloseDescription() {
    const description = document.getElementById('description');
    if (description!.style.display === 'none') {
        description!.style.display = 'block';
        document.body.classList.add('subwindow-open');
    } else {
        description!.style.display = 'none';
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
            (element as any).webkitRequestFullscreen ||
            (element as any).mozRequestFullScreen ||
            (element as any).msRequestFullscreen;

        if (requestFullscreen) {
            requestFullscreen.call(element).then(() => {
                (window as any).renderAll();
                updateFullScreenState(true);
                console.log('Successfully entered fullscreen');
            }).catch((err) => {
                console.error('Failed to enter fullscreen:', err);
            });
        } else {
            console.log('requestFullscreen not supported');
        }
    } else {
        // フルスクリーンの場合、通常表示に戻す
        console.log('togglefullScreen: exiting full screen');

        const exitFullscreen = document.exitFullscreen ||
            (document as any).webkitExitFullscreen ||
            (document as any).mozCancelFullScreen ||
            (document as any).msExitFullscreen;

        if (exitFullscreen) {
            exitFullscreen.call(document).then(() => {
                (window as any).renderAll();
                updateFullScreenState(false);
                console.log('Successfully exited fullscreen');
            }).catch((err) => {
                console.error('Failed to exit fullscreen:', err);
            });
        } else {
            console.log('exitFullscreen not supported');
        }
    }
}

// フルスクリーンボタンの状態を更新する関数
function updateFullScreenState(isFullscreen: boolean) {
    const fullScreenBtn = document.getElementById('fullScreenBtn');
    const fullScreenBtnMobile = document.getElementById('fullScreenBtnMobile');
    if (renderer === null) return;

    if (isFullscreen) {
        // フルスクリーンになった時
        console.log('Updating buttons to exit fullscreen state');
        if (fullScreenBtn) {
            fullScreenBtn.innerHTML = `<i class="fas fa-compress" aria-hidden="true"></i>`;
        }
        if (fullScreenBtnMobile) {
            fullScreenBtnMobile.innerHTML = `<i class="fas fa-compress" aria-hidden="true"></i>`;
        }
    } else {
        // フルスクリーンが解除された時
        console.log('Updating buttons to enter fullscreen state');
        if (fullScreenBtn) {
            fullScreenBtn.innerHTML = `<i class="fas fa-expand" aria-hidden="true"></i>`;
        }
        if (fullScreenBtnMobile) {
            fullScreenBtnMobile.innerHTML = `<i class="fas fa-expand" aria-hidden="true"></i>`;
        }
    }

    // Canvasの論理サイズを実際の表示サイズに合わせる
    const rect = renderer.getCanvasBoundingClientRect();
    const actualWidth = Math.round(rect.width);
    const actualHeight = Math.round(rect.height);

    let fov = config.viewState.fov;
    if (actualWidth > actualHeight) {
        fov.dec = fov.ra * actualHeight / actualWidth;
    } else {
        fov.ra = fov.dec * actualWidth / actualHeight;
    }

    updateConfig({
        canvasSize: { width: actualWidth, height: actualHeight },
        viewState: {
            ...config.viewState,
            fov: fov,
        }
    });
}

function setupFullScreenButton() {
    const fullScreenBtn = document.getElementById('fullScreenBtn');
    const fullScreenBtnMobile = document.getElementById('fullScreenBtnMobile');

    if (fullScreenBtn) {
        // console.log('fullScreenBtn found, adding event listener');
        fullScreenBtn.addEventListener('click', () => {
            console.log('fullScreenBtn clicked');
            togglefullScreen();
        });
    } else {
        console.log('fullScreenBtn not found');
    }

    if (fullScreenBtnMobile) {
        // console.log('fullScreenBtnMobile found, adding event listener');
        fullScreenBtnMobile.addEventListener('click', () => {
            console.log('fullScreenBtnMobile clicked');
            togglefullScreen();
        });
    } else {
        console.log('fullScreenBtnMobile not found');
    }

    // フルスクリーン状態変更の監視（複数のイベントに対応）
    const fullscreenEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];

    fullscreenEvents.forEach(eventName => {
        document.addEventListener(eventName, () => {
            console.log(`${eventName} event fired`);
            const isFullscreen = !!(document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement ||
                (document as any).msFullscreenElement);

            console.log('Fullscreen state:', isFullscreen);
            (window as any).renderAll();
            updateFullScreenState(isFullscreen);
        });
    });
}

// デバイスオリエンテーション許可ボタンの設定
function setupOrientationPermissionButton(deviceOrientationManager: DeviceOrientationManager) {
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
                (permissionBtn as HTMLButtonElement).disabled = true;

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
// Viteでは不要。代わりに最後にmain()
// window.addEventListener('DOMContentLoaded', main);

function setupButtonEvents(settingController: SettingController) {
    // 設定ボタン
    const settingBtn = document.getElementById('settingBtn');
    if (settingBtn) {
        settingBtn.addEventListener('click', () => {
            settingController.initialize();
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
            settingController.initialize();
        });
    } else {
    }

    // 天体情報を閉じるボタン
    const closeObjectInfoBtn = document.getElementById('closeObjectInfo');
    if (closeObjectInfoBtn) {
        closeObjectInfoBtn.addEventListener('click', () => {
            if (objectInfoController !== null) ObjectInfoController.closeObjectInfo();
        });
    }

    // 星情報を閉じるボタン
    const closeStarInfoBtn = document.getElementById('closeStarInfo');
    if (closeStarInfoBtn) {
        closeStarInfoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (objectInfoController !== null) ObjectInfoController.closeObjectInfo();
        });
    }

    // 検索ボタン
    document.getElementById('searchBtn')?.addEventListener('click', () => {
        if (searchController !== null) searchController.toggleSearch();
    });
    document.getElementById('searchBtnMobile')?.addEventListener('click', () => {
        if (searchController !== null) searchController.toggleSearch();
    });

    // 説明ボタン
    const descriptionBtn = document.getElementById('descriptionBtn');
    if (descriptionBtn) {
        descriptionBtn.addEventListener('click', () => {
            openOrCloseDescription();
        });
    }

    const descriptionBtnMobile = document.getElementById('descriptionBtnMobile');
    if (descriptionBtnMobile) {
        descriptionBtnMobile.addEventListener('click', () => {
            openOrCloseDescription();
        });
    }

    const closeDescriptionBtn = document.getElementById('closeDescription');
    if (closeDescriptionBtn) {
        closeDescriptionBtn.addEventListener('click', () => {
            openOrCloseDescription();
        });
    }

    // 全画面ボタン
    setupFullScreenButton();

    // 設定画面のタブ切り替え
    document.querySelectorAll('.setting-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = (e.target as HTMLElement).getAttribute('data-tab');
            if (tabName) {
                SettingController.switchSettingTab(tabName);
            }
        });
    });

    // 設定画面のOKボタン
    document.getElementById('showBtn')?.addEventListener('click', () => settingController.finishSetting());
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
    if (searchController !== null) searchController.setupSearchInput();

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
    ]

    const openPopup = (popup: HTMLElement) => {
        if (popup) {
            popup.style.display = 'flex';
        }
    };
    const closePopup = (popup: HTMLElement) => {
        if (popup) {
            popup.style.display = 'none';
        }
    };

    for (let i = 0; i < popupIds.length; i++) {
        const popupId = popupIds[i];
        const openBtn = document.getElementById(popupId.openBtn) as HTMLButtonElement;
        const closeBtn = document.getElementById(popupId.closeBtn) as HTMLButtonElement;
        const popup = document.getElementById(popupId.popup) as HTMLElement;

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
        const dtl = document.getElementById('dtl') as HTMLInputElement;

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
        const realTime = document.getElementById('realTime') as HTMLSelectElement;
        if (realTime.value !== 'off') {
            SettingController.setCurrentTimeOnSettingDisplay();
        }
    });

    document.getElementById('magLimitSlider')?.addEventListener('change', function () {
        const magLimitSlider = document.getElementById('magLimitSlider') as HTMLInputElement;
        const magLimitSliderValue = parseFloat(magLimitSlider.value);
        const viewState = config.viewState;
        if (viewState) {
            viewState.starSizeKey1 = magLimitSliderValue;
            viewState.starSizeKey2 = 1.8;
        }
        updateConfig({
            viewState: viewState
        });
    });

    // document.getElementById('dark')?.addEventListener('change', function () {
    //     SettingController.toggleDarkMode();
    // });

    document.getElementById('cameraTiltSlider')?.addEventListener('input', function () {
        (window as any).renderAll();
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
            (e.target as HTMLElement).style.display = 'none';
        }
    });
}

function setupVisibilityHandler(renderAll: () => void, canvas: HTMLCanvasElement, renderer: any) {
    // タブが非アクティブ/アクティブになったときの処理
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // タブが再び表示されたとき
            console.log('Tab became visible, checking canvas context...');

            // Canvasのコンテキストが有効か確認
            try {
                const testCtx = canvas.getContext('2d');
                if (!testCtx) {
                    console.warn('Canvas context lost, attempting to restore...');
                    // コンテキストが失われた場合、レンダラーを再初期化する必要がある
                    // ただし、これは通常発生しないので、まずはレンダリングを再実行してみる
                }

                // レンダリングを再実行
                setTimeout(() => {
                    renderAll();
                }, 100); // 少し遅延させて、ブラウザが完全に復帰してからレンダリング
            } catch (error) {
                console.error('Error checking canvas context:', error);
            }
        }
    });

    // ページがフォーカスされたときも同様に処理（モバイルブラウザで重要）
    window.addEventListener('focus', () => {
        console.log('Window focused, re-rendering...');
        setTimeout(() => {
            renderAll();
        }, 100);
    });
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
    } else {
        console.log('お知らせポップアップ: 初回アクセス');
    }

    const popup = document.getElementById('newsPopup');
    if (popup) {
        let newsCount = 0;
        let newsIndex = 0;
        let newsTimes: String[] = [];
        const newsItemElement = document.getElementById('newsItem');
        let text = ''
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
            } else {
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
            newsItemElement!.innerHTML = text;
            config.newsPopup.lastShownTime = currentTime;
            updateConfig({
                newsPopup: config.newsPopup
            });
            localStorage.setItem('config', JSON.stringify(config));
            console.log(`お知らせポップアップ: 表示完了 (${currentTime})`);
        }, 500);
    }
}

/**
 * デバッグ情報をタイトルバーの右端に表示
 * @param text 表示するテキスト
 */
(window as any).setDebugInfo = (text: string) => {
    const debugInfoElement = document.getElementById('debugInfo');
    if (debugInfoElement) {
        debugInfoElement.textContent = text;
    }
};

/**
 * デバッグ情報をクリア
 */
(window as any).clearDebugInfo = () => {
    const debugInfoElement = document.getElementById('debugInfo');
    if (debugInfoElement) {
        debugInfoElement.textContent = '';
    }
};

main();

function initializeConfig(arg0: boolean): any {
    throw new Error('Function not implemented.');
}
