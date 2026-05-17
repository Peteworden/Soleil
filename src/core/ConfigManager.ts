import { CanvasSize, DisplaySettings, DisplayTime, NewsPopup, ObservationSite, PlanetMotion, StarChartConfig, ViewState } from 'types';
import { AstronomicalCalculator } from './calculations.js';
import { AzAlt, RaDec } from './coordinates/index.js';

// ★他ファイルが参照を保持し続けられるよう、ファイルトップレベルで唯一の実体を定義
export const config: StarChartConfig = initializeConfig();

// renderer や updateInfoDisplay への直接依存を避けるためのコールバック（リスナー）
let onConfigChangeCallback: (() => void) | null = null;

/**
 * 設定が更新されたときの追加のアクション（再描画など）を登録する
 */
export function setConfigChangeListener(callback: () => void): void {
    onConfigChangeCallback = callback;
}

export function getConfig(): StarChartConfig {
    return config;
}

export function resetConfig(): void {
    localStorage.removeItem('config');
    const defaultConfig = initializeConfig(true); // 初期値を取得
    
    // 参照を維持したまま中身を空にしてからコピー
    // (ネストされたオブジェクトの残骸が残らないようにするため)
    clearObject(config);
    Object.assign(config, defaultConfig);
    
    console.log('🔄 Config reset completed');
    if (onConfigChangeCallback) onConfigChangeCallback();
}

export function updateConfigOnly(newConfig: Partial<StarChartConfig>): void {
    // 参照を破壊せずに中身だけを上書き
    // ただし、Object.assignは浅いコピーなので、ネストされたオブジェクト（displaySettingsなど）の
    // マージ漏れを防ぐため、必要に応じて個別に assign
    if (newConfig.displaySettings) {
        Object.assign(config.displaySettings, newConfig.displaySettings);
    }
    if (newConfig.viewState) {
        Object.assign(config.viewState, newConfig.viewState);
    }
    if (newConfig.observationSite) {
        Object.assign(config.observationSite, newConfig.observationSite);
    }
    if (newConfig.displayTime) {
         Object.assign(config.displayTime, newConfig.displayTime);
    }
    if (newConfig.planetMotion) {
         Object.assign(config.planetMotion, newConfig.planetMotion);
    }
    if (newConfig.newsPopup) {
         Object.assign(config.newsPopup, newConfig.newsPopup);
    }
    if (newConfig.canvasSize) {
         Object.assign(config.canvasSize, newConfig.canvasSize);
    }
    // 全体の第一階層をマージ
    Object.assign(config, newConfig);
}

/**
 * 設定を部分的に更新する
 */
export function updateConfig(newConfig: Partial<StarChartConfig>): void {
    // ダークモードが変更された場合、色管理システムを更新
    if (newConfig.displaySettings?.darkMode !== undefined && 
        (config.displaySettings.darkMode !== newConfig.displaySettings.darkMode)
    ) {
        import('../renderer/colorManager').then(({ getColorManager }) => {
            getColorManager(newConfig.displaySettings!.darkMode);
        });
    }

    updateConfigOnly(newConfig);

    // 恒星時の再計算
    if (newConfig.displayTime !== undefined || (newConfig.observationSite?.longitude !== undefined)) {
        config.siderealTime = AstronomicalCalculator.calculateLocalSiderealTime(
            config.displayTime.jd, 
            config.observationSite.longitude
        );
    }

    // メインの再描画トリガー（main.ts側で紐付けたリスナーを実行）
    if (onConfigChangeCallback) {
        onConfigChangeCallback();
    }
}

export function saveConfigToLocalStorage(): void {
    localStorage.setItem('config', JSON.stringify(config));
}

function initializeConfig(
    useUrlQuery: boolean = true, useLocalStorage: boolean = true
): StarChartConfig {
    // デフォルト値の生成
    const now = new Date();
    const displaySettings: DisplaySettings = {
        darkMode: false,
        mode: 'view',
        showGrid: true,
        showReticle: true,
        showObjectInfo: true,
        showStarInfo: false,
        usedStar: 'to12',
        showStarNames: 'to2',
        showBayerFS: true,
        showPlanets: true,
        showConstellationNames: true,
        showConstellationLines: true,
        showMessiers: true,
        showRecs: true,
        showNGC: false,
        showSharpless: false,
        showCameraView: false,
        camera: 'none',
        showTopography: false, // 読み込み時は常にfalse
        equinox: 'apparent'
    };
    const viewState: ViewState = {
        centerRA: 90,
        centerDec: 0,
        centerAz: 180,
        centerAlt: 45,
        fieldOfViewRA: 60,
        fieldOfViewDec: 60,
        starSizeKey1: 14,
        starSizeKey2: 1.8
    };
    const observationSite: ObservationSite = {
        observerPlanet: '地球',
        name: 'カスタム',
        latitude: 35.0,
        longitude: 135.0,
        timezone: 9,
        heliocentric: undefined
    };
    const displayTime: DisplayTime = {
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
    const planetMotion: PlanetMotion = {
        planet: [],
        duration: 30,
        interval: 1.0,
        timeDisplayStep: 5,
        timeDisplayContent: 'md'
    };
    const newsPopup: NewsPopup = {
        lastShownTime: '',
        dontShow: false
    };
    const canvasSize: CanvasSize = {
        width: window.innerWidth,
        height: window.innerHeight
    };

    let raOverride: number | null = null;
    let decOverride: number | null = null;
    let latOverride: number | null = null;
    let lonOverride: number | null = null;
    let timeOverride: { year: number; month: number; day: number; hour: number; minute: number; second: number } | null = null;
    let fovOverride: number | null = null;

    if (useUrlQuery) {
        // このブロックでは~~Overrideたちを変更するだけ。URLのチェックの後に適用する

        // URL クエリからの初期値上書き（例: ?ra=123.45）
        const params = new URLSearchParams(location.search);
        const raParam = params.get('ra');
        const decParam = params.get('dec');
        const latParam = params.get('lat');
        const lonParam = params.get('lon');
        const timeParam = params.get('time'); // YYYYMMDD-HHMM.M （JST）
        const fovParam = params.get('fov');

        if (raParam != null) {
            const raParsed = parseFloat(raParam);
            if (!Number.isNaN(raParsed)) raOverride = ((raParsed % 360) + 360) % 360;
        }
        if (decParam != null) {
            const decParsed = parseFloat(decParam);
            if (!Number.isNaN(decParsed)) decOverride = Math.max(-90, Math.min(90, decParsed));
        }
        if (latParam != null) {
            const latParsed = parseFloat(latParam);
            if (!Number.isNaN(latParsed)) latOverride = Math.max(-90, Math.min(90, latParsed));
        }
        if (lonParam != null) {
            const lonParsed = parseFloat(lonParam);
            // -180～180 に正規化
            if (!Number.isNaN(lonParsed)) lonOverride = (((lonParsed + 180) % 360) + 360) % 360 - 180;
        }
        if (timeParam != null) {
            // フォーマット: YYYYMMDD-HHMMSS
            // 例: 20251017-213030 => 2025/10/17 21:30:30 JST
            const m = timeParam.match(/^(\d{8})-(\d{2})(\d{2})(\d{2})$/);
            if (m) {
                const yyyymmdd = m[1];
                const year = parseInt(yyyymmdd.slice(0, 4));
                const month = parseInt(yyyymmdd.slice(4, 6));
                const day = parseInt(yyyymmdd.slice(6, 8));
                const hour = parseInt(m[2]);
                const minute = parseInt(m[3]);
                const second = parseInt(m[4]);
                if (
                    Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day) &&
                    Number.isFinite(hour) && Number.isFinite(minute) && Number.isFinite(second)
                ) {
                    timeOverride = { year, month, day, hour, minute, second };
                }
            }
        }
        if (fovParam != null) {
            const fovParsed = parseFloat(fovParam);
            if (!Number.isNaN(fovParsed)) fovOverride = Math.max(1, Math.min(180, fovParsed));
        }
    }

    if (useLocalStorage) {
        const lsConfigJson = localStorage.getItem('config');
        const lsConfig = lsConfigJson ? JSON.parse(lsConfigJson) : null;

        // displaySettings
        if (lsConfig && lsConfig.displaySettings) {
            const savedDisplaySettings = lsConfig.displaySettings;
            Object.keys(displaySettings).forEach(key => {
                const savedValue = savedDisplaySettings[key as keyof DisplaySettings];
                if (savedValue != null) {
                    (displaySettings as any)[key] = savedValue;
                }
            });
        }

        // viewState
        if (lsConfig && lsConfig.viewState) {
            const savedViewState = lsConfig.viewState;
            Object.keys(viewState).forEach(key => {
                const savedValue = savedViewState[key as keyof ViewState];
                if (savedValue != null) {
                    (viewState as any)[key] = savedValue;
                }
            });
        }

        // observationSite
        if (lsConfig && lsConfig.observationSite) {
            const savedObservationSite = lsConfig.observationSite;
            Object.keys(observationSite).forEach(key => {
                const savedValue = savedObservationSite[key as keyof ObservationSite];
                if (savedValue != null) {
                    (observationSite as any)[key] = savedValue;
                }
            });
            if (observationSite.name === '地図上で選択' || observationSite.name === '現在地') {
                observationSite.name = 'カスタム';
            }
        }

        // displayTime
        if (lsConfig && lsConfig.displayTime) {
            const savedDisplayTime = lsConfig.displayTime;
            displayTime.loadOnCurrentTime = savedDisplayTime.loadOnCurrentTime != null ? savedDisplayTime.loadOnCurrentTime : displayTime.loadOnCurrentTime;
            displayTime.realTime = savedDisplayTime.realTime != null ? savedDisplayTime.realTime : displayTime.realTime;
            if (displayTime.loadOnCurrentTime || displayTime.realTime != 'off' ||
                savedDisplayTime.year == null ||
                savedDisplayTime.month == null || savedDisplayTime.day == null ||
                savedDisplayTime.hour == null || savedDisplayTime.minute == null || savedDisplayTime.second == null
            ) {
                displayTime.year = now.getFullYear();
                displayTime.month = now.getMonth() + 1;
                displayTime.day = now.getDate();
                displayTime.hour = now.getHours();
                displayTime.minute = now.getMinutes();
                displayTime.second = now.getSeconds();
            } else {
                displayTime.year = savedDisplayTime.year;
                displayTime.month = savedDisplayTime.month;
                displayTime.day = savedDisplayTime.day;
                displayTime.hour = savedDisplayTime.hour;
                displayTime.minute = savedDisplayTime.minute;
                displayTime.second = savedDisplayTime.second;
            }
        }

        // newsPop
        if (lsConfig && lsConfig.newsPopup) {
            const savedNewsPopup = lsConfig.newsPopup;
            Object.keys(newsPopup).forEach(key => {
                const savedValue = savedNewsPopup[key as keyof NewsPopup];
                if (savedValue != null) {
                    (newsPopup as any)[key] = savedValue;
                }
            });
        }
    }

    if (useUrlQuery) {
        if (raOverride != null) viewState.centerRA = raOverride;
        if (decOverride != null) viewState.centerDec = decOverride;

        if (fovOverride != null) viewState.fieldOfViewRA = fovOverride;

        if (latOverride != null) {
            observationSite.latitude = latOverride;
            observationSite.name = 'カスタム';
        }
        if (lonOverride != null) {
            observationSite.longitude = lonOverride;
            observationSite.name = 'カスタム';
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
    }

    viewState.fieldOfViewDec = viewState.fieldOfViewRA * canvasSize.height / canvasSize.width;
    displayTime.jd = AstronomicalCalculator.jdTTFromYmdhmsJst(
        displayTime.year, displayTime.month, displayTime.day, displayTime.hour, displayTime.minute, displayTime.second
    );
    const siderealTime = AstronomicalCalculator.calculateLocalSiderealTime(displayTime.jd, observationSite.longitude);
    const loc = { lst: siderealTime, lat: observationSite.latitude }

    if (useLocalStorage && (raOverride != null || decOverride != null)) {
        const centerAzAlt =  RaDec.toAzalt({ ra: viewState.centerRA, dec: viewState.centerDec }, loc);
        viewState.centerAz = centerAzAlt.az;
        viewState.centerAlt = centerAzAlt.alt;
    } else {
        if (displaySettings.mode === 'AEP') {
            const centerAzalt =  RaDec.toAzalt({ ra: viewState.centerRA, dec: viewState.centerDec }, loc);
            viewState.centerAz = centerAzalt.az;
            viewState.centerAlt = centerAzalt.alt;
        } else if (displaySettings.mode === 'view') {
            const centerRadec =  AzAlt.toRadec({ az: viewState.centerRA, alt: viewState.centerDec }, loc);
            viewState.centerRA = centerRadec.ra;
            viewState.centerDec = centerRadec.dec;
        }
    }

    const config: StarChartConfig =  {
        displaySettings: displaySettings,
        viewState: viewState,
        observationSite: observationSite,
        displayTime: displayTime,
        canvasSize: canvasSize,
        planetMotion: planetMotion,
        siderealTime: siderealTime,
        newsPopup: newsPopup
    };
    return config;
}

// オブジェクトの参照を変えずにプロパティをすべて削除するヘルパー
function clearObject(obj: any): void {
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            delete obj[key];
        }
    }
}

// ダミー関数（既存の環境に合わせてインポートするか、ここに実体を置いてください）
// function resetURL() {
//     try {
//         if (location.search && history.replaceState) {
//             history.replaceState(null, '', location.pathname + location.hash);
//         }
//     } catch (_) {}
// }