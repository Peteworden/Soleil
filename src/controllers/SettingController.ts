import { AstronomicalCalculator } from "../core/calculations.js";
import { TimeController } from "./TimeController.js";
import { SolarSystemDataManager } from '../models/SolarSystemObjects.js';
import { DisplaySettings, DisplayTime, ObservationSite, StarChartConfig } from "types/index.js";
import { getConfig, saveConfigToLocalStorage, updateConfig } from "../core/ConfigManager.js";
import { DeviceOrientationManager } from "device/deviceOrientation.js";
import { CanvasRenderer } from "renderer/CanvasRenderer.js";

export class SettingController {
    private deviceOrientationManager;
    private renderer;
    private config: StarChartConfig;
    constructor(
        deviceOrientationManager: DeviceOrientationManager,
        renderer: CanvasRenderer | null
    ) {
        this.deviceOrientationManager = deviceOrientationManager;
        this.renderer = renderer;
        this.config = getConfig();
    }

    setRenderer(renderer: CanvasRenderer) {
        this.renderer = renderer;
    }

    static switchSettingTab(tabName: string) {
        // すべてのタブコンテンツを非表示
        document.querySelectorAll('.setting-section').forEach(section => {
            (section as HTMLElement).style.display = 'none';
        });

        // すべてのタブボタンからactiveクラスを削除
        document.querySelectorAll('.setting-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // 選択されたタブを表示
        const targetTab = document.getElementById(tabName + '-tab');
        if (targetTab) {
            targetTab.style.display = 'block';
        }

        // 選択されたタブボタンにactiveクラスを追加
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
    }

    initialize() {
        const setting = document.getElementById('setting');
        if (setting) {
            if (window.innerWidth <= 768) {
                setting.style.display = 'block';
                setting.classList.add('show');
            } else {
                setting.style.display = 'block';
            }
            // 設定画面が開いていることを示すクラスをbodyに追加
            document.body.classList.add('subwindow-open');
        }
        const modeSelect = document.getElementById('mode') as HTMLSelectElement;
        if (modeSelect) {
            modeSelect.addEventListener('change', () => {
                SettingController.setObservationSiteOnMode(modeSelect.value);
            });
        }

        // 設定をUIに反映
        this.setUiOnConfig();
        SettingController.setObservationSiteOnMode(modeSelect.value);

        // デバイスに応じてモードの有効/無効を制御
        this.updateModeSelectAvailability();
    }

    // OKボタンが押されたら
    async finishSetting() {
        console.log('🔧 finishSetting called');

        // 設定値を読み取ってconfigを更新
        this.updateConfigFromInputs();

        //darkmode
        this.toggleDarkMode();

        // 設定画面を隠す
        const setting = document.getElementById('setting');
        if (window.innerWidth <= 768) {
            setting!.style.display = 'block';
            setting?.classList.remove('show');
        } else {
            if (setting) {
                setting.style.display = 'none';
            }
        }
        // 設定画面が閉じられたことを示すクラスをbodyから削除
        document.body.classList.remove('subwindow-open');

        const cameraTiltSliderDiv = document.getElementById('cameraTiltSliderDiv') as HTMLDivElement;
        const cameraSelect = document.getElementById('camera') as HTMLSelectElement;
        if (cameraTiltSliderDiv && cameraSelect) {
            if (cameraSelect.value != 'none') {
                cameraTiltSliderDiv.style.display = 'block';
            } else {
                cameraTiltSliderDiv.style.display = 'none';
            }
        }

        // controlPanelの可視性を更新
        const timeController = TimeController;
        if (timeController && timeController.updateControlPanelVisibility) {
            timeController.updateControlPanelVisibility();
        }

        // 設定値をローカルストレージに保存
        saveConfigToLocalStorage();
        // 設定反映後に全天体データを更新
        const config = getConfig();
        const jd = config.displayTime.jd;
        const observer = config.observationSite.observerPlanet;
        SolarSystemDataManager.updateAllData(jd, observer);

        (window as any).renderAll();
    }

    private updateConfigFromInputs(): void {
        console.log('🔧 updateConfigFromInputs called');

        const get = <T extends HTMLElement>(id: string): T | null => {
            return document.getElementById(id) as T;
        }

        // 観測地の設定を読み取り
        const observerPlanetSelect = get<HTMLSelectElement>('observer_planet');
        const observationSiteSelect = get<HTMLSelectElement>('observation-site-select');
        const latInput = get<HTMLInputElement>('lat');
        const lonInput = get<HTMLInputElement>('lon');
        const nsSelect = get<HTMLSelectElement>('NSCombo');
        const ewSelect = get<HTMLSelectElement>('EWCombo');

        if (observerPlanetSelect && observationSiteSelect && latInput && lonInput && nsSelect && ewSelect) {
            const observerPlanet = observerPlanetSelect.value;
            if (latInput.value.length === 0) {
                latInput.value = '35.00';
            }
            if (lonInput.value.length === 0) {
                lonInput.value = '135.00';
            }
            const latitude = parseFloat(latInput.value) * (nsSelect.value === '北緯' ? 1 : -1);
            const longitude = parseFloat(lonInput.value) * (ewSelect.value === '東経' ? 1 : -1);


            const observationSite: ObservationSite = {
                ...this.config.observationSite,
                observerPlanet: observerPlanet,
                name: observationSiteSelect.value,
                latitude: latitude,
                longitude: longitude,
                timezone: 9
            };
            updateConfig({
                observationSite: observationSite
            });
        }

        // 表示設定を読み取り
        const modeSelect = get<HTMLSelectElement>('mode');
        const magLimitSlider = get<HTMLInputElement>('magLimitSlider');
        const darkMode = get<HTMLInputElement>('dark');
        const gridCheck = get<HTMLInputElement>('gridCheck');
        const reticleCheck = get<HTMLInputElement>('reticleCheck');
        const objectInfoCheck = get<HTMLInputElement>('objectInfoCheck');
        const starInfoCheck = get<HTMLInputElement>('starInfoCheck');
        const usedStarSelect = get<HTMLSelectElement>('usedStarSelect');
        const starNameSelect = get<HTMLSelectElement>('starName');
        const bayerFSCheck = get<HTMLInputElement>('bayerFSCheck');
        const constellationNameCheck = get<HTMLInputElement>('constellationNameCheck');
        const constellationLineCheck = get<HTMLInputElement>('constellationLineCheck');
        const planetCheck = get<HTMLInputElement>('planetCheck');
        const messierCheck = get<HTMLInputElement>('messierCheck');
        const recCheck = get<HTMLInputElement>('recCheck');
        const ngcCheck = get<HTMLInputElement>('ngcCheck');
        const sharplessCheck = get<HTMLInputElement>('sharplessCheck');
        const cameraSelect = get<HTMLSelectElement>('camera');
        const equinoxSelect = get<HTMLSelectElement>('equinox');
        if (
            modeSelect && gridCheck && magLimitSlider && usedStarSelect && darkMode &&
            reticleCheck && objectInfoCheck && starInfoCheck && starNameSelect && bayerFSCheck &&
            constellationNameCheck && constellationLineCheck &&
            planetCheck && messierCheck && recCheck && ngcCheck && sharplessCheck &&
            cameraSelect && equinoxSelect
        ) {
            const newDisplaySettings: DisplaySettings = {
                ...this.config.displaySettings, // 既存の値を保持
                mode: modeSelect.value,
                darkMode: darkMode.checked,
                showGrid: gridCheck.checked,
                showReticle: reticleCheck.checked,
                showObjectInfo: objectInfoCheck.checked,
                showStarInfo: starInfoCheck.checked,
                usedStar: usedStarSelect.value,
                showStarNames: starNameSelect.value,
                showBayerFS: bayerFSCheck.checked,
                showPlanets: planetCheck.checked,
                showConstellationNames: constellationNameCheck.checked,
                showConstellationLines: constellationLineCheck.checked,
                showMessiers: messierCheck.checked,
                showRecs: recCheck.checked,
                showNGC: ngcCheck.checked,
                showSharpless: sharplessCheck.checked,
                camera: cameraSelect.value,
                equinox: equinoxSelect.value
            };
            updateConfig({
                displaySettings: newDisplaySettings
            });
            console.log('🔧 updateConfig called successfully');
        }

        // 時刻設定を読み取り
        const dtlInput = get<HTMLInputElement>('dtl');
        const loadOnCurrentTimeCheck = get<HTMLInputElement>('loadOnCurrentTime');
        const realTime = get<HTMLSelectElement>('realTime');

        if (dtlInput && realTime && loadOnCurrentTimeCheck) {
            let year: number, month: number, day: number, hour: number, minute: number, second: number, jd: number;
            if (realTime.value === 'off') {
                const dtlValue = dtlInput.value; // "2024-01-15T10:30" 形式
                if (dtlValue) {
                    const date = new Date(dtlValue);
                    year = date.getFullYear();
                    month = date.getMonth() + 1;
                    day = date.getDate();
                    hour = date.getHours();
                    minute = date.getMinutes();
                    second = date.getSeconds();
                } else {
                    // デフォルト値
                    const t = this.config.displayTime;
                    year = t.year;
                    month = t.month;
                    day = t.day;
                    hour = t.hour;
                    minute = t.minute;
                    second = t.second;
                }
                jd = AstronomicalCalculator.jdTTFromYmdhmsJst(year, month, day, hour, minute, second);
                TimeController.toggleRealTime('off');
            } else {
                jd = AstronomicalCalculator.calculateCurrentJdTT();
                const currentJd = AstronomicalCalculator.calculateYmdhmsJstFromJdTT(jd);
                year = currentJd.year;
                month = currentJd.month;
                day = currentJd.day;
                hour = currentJd.hour;
                minute = currentJd.minute;
                second = currentJd.second;
                // YYYY-MM-DDTHH:MM 形式でローカル時間を直接設定
                const localDateTime = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
                dtlInput.value = localDateTime;
                if (realTime.value === 'radec') {
                    TimeController.toggleRealTime('radec');
                } else if (realTime.value === 'azalt') {
                    TimeController.toggleRealTime('azalt');
                }
            }
            const displayTime: DisplayTime = {
                ...this.config.displayTime,
                year: year,
                month: month,
                day: day,
                hour: hour,
                minute: minute,
                second: second,
                jd: jd,
                realTime: realTime.value || 'off',
                loadOnCurrentTime: loadOnCurrentTimeCheck.checked
            }
            updateConfig({
                displayTime: displayTime
            });
            TimeController.initialize();
        }
    }

    // main.tsのconfigから設定をUIに反映するメソッド
    setUiOnConfig() {
        this.toggleDarkMode();

        const get = <T extends HTMLElement>(id: string): T | null => {
            return document.getElementById(id) as T;
        }
        const apply = {
            select: (element: HTMLSelectElement | null, value: string | null) => {
                if (element && value) element.value = value;
            },
            input: (element: HTMLInputElement | null, value: string | null) => {
                if (element && value) element.value = value;
            },
            checkbox: (element: HTMLInputElement | null, checked: boolean) => {
                if (element) element.checked = checked;
            },
            slider: (element: HTMLInputElement | null, value: number | null) => {
                if (element && value) element.value = value.toString();
            }
        }

        // 観測地の設定
        const observerPlanetSelect = get<HTMLSelectElement>('observer_planet');
        const observationSiteSelect = get<HTMLSelectElement>('observation-site-select');
        const latInput = get<HTMLInputElement>('lat');
        const lonInput = get<HTMLInputElement>('lon');
        const nsSelect = get<HTMLSelectElement>('NSCombo');
        const ewSelect = get<HTMLSelectElement>('EWCombo');

        if (observerPlanetSelect && observationSiteSelect && latInput && lonInput && nsSelect && ewSelect) {
            const site = this.config.observationSite;
            observerPlanetSelect.value = site.observerPlanet;
            observationSiteSelect.value = site.name;
            const latitude = Math.abs(site.latitude);
            const longitude = Math.abs(site.longitude);
            latInput.value = latitude.toFixed(2);
            lonInput.value = longitude.toFixed(2);
            nsSelect.value = site.latitude >= 0 ? '北緯' : '南緯';
            ewSelect.value = site.longitude >= 0 ? '東経' : '西経';
        }

        const ds = this.config.displaySettings;
        const vs = this.config.viewState;
        apply.select(get<HTMLSelectElement>('mode'), ds.mode);
        apply.slider(get<HTMLInputElement>('magLimitSlider'), vs.starSizeKey1);
        apply.select(get<HTMLSelectElement>('usedStarSelect'), ds.usedStar);
        apply.checkbox(get<HTMLInputElement>('dark'), ds.darkMode);
        apply.checkbox(get<HTMLInputElement>('gridCheck'), ds.showGrid);
        apply.checkbox(get<HTMLInputElement>('reticleCheck'), ds.showReticle);
        apply.checkbox(get<HTMLInputElement>('objectInfoCheck'), ds.showObjectInfo);
        apply.checkbox(get<HTMLInputElement>('starInfoCheck'), ds.showStarInfo);
        apply.checkbox(get<HTMLInputElement>('messierCheck'), ds.showMessiers);
        apply.checkbox(get<HTMLInputElement>('recCheck'), ds.showRecs);
        apply.checkbox(get<HTMLInputElement>('ngcCheck'), ds.showNGC);
        apply.checkbox(get<HTMLInputElement>('sharplessCheck'), ds.showSharpless);
        apply.select(get<HTMLSelectElement>('starName'), ds.showStarNames);
        apply.checkbox(get<HTMLInputElement>('bayerFSCheck'), ds.showBayerFS);
        apply.checkbox(get<HTMLInputElement>('constellationNameCheck'), ds.showConstellationNames);
        apply.checkbox(get<HTMLInputElement>('constellationLineCheck'), ds.showConstellationLines);
        apply.checkbox(get<HTMLInputElement>('planetCheck'), ds.showPlanets);
        apply.select(get<HTMLSelectElement>('equinox'), ds.equinox);

        const cameraSelect = get<HTMLSelectElement>('camera');
        apply.select(cameraSelect, ds.camera);
        if (cameraSelect && cameraSelect.value != 'none') {
            const cameraTiltSliderDiv = get<HTMLDivElement>('cameraTiltSliderDiv');
            if (cameraTiltSliderDiv) cameraTiltSliderDiv.style.display = 'block';
        } else {
            const cameraTiltSliderDiv = document.getElementById('cameraTiltSliderDiv') as HTMLDivElement;
            if (cameraTiltSliderDiv) cameraTiltSliderDiv.style.display = 'none';
        }

        // 時刻設定
        const dtlInput = get<HTMLInputElement>('dtl');
        const loadOnCurrentTimeCheck = get<HTMLInputElement>('loadOnCurrentTime');
        const realTimeSelect = get<HTMLSelectElement>('realTime');

        if (dtlInput && realTimeSelect && loadOnCurrentTimeCheck) {
            // ローカル時間で日時を作成（世界時変換を避ける）
            const t = this.config.displayTime;
            const year = t.year;
            const month = String(t.month).padStart(2, '0');
            const day = String(t.day).padStart(2, '0');
            const hour = String(t.hour).padStart(2, '0');
            const minute = String(t.minute).padStart(2, '0');

            // YYYY-MM-DDTHH:MM 形式でローカル時間を直接設定
            const localDateTime = `${year}-${month}-${day}T${hour}:${minute}`;
            dtlInput.value = localDateTime;
            loadOnCurrentTimeCheck.checked = t.loadOnCurrentTime;
            realTimeSelect.value = t.realTime;
        }

        console.log('🔧 Settings loaded from config to UI');
    }

    static setCurrentTimeOnSettingDisplay() {
        const dtlInput = document.getElementById('dtl') as HTMLInputElement;
        if (dtlInput) {
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
            dtlInput.value = jstString.replace(' ', 'T');
        }
    }

    // viewモード、liveモード、arモードのときはobservationPlanetを地球しか選択できないようにし、緯度経度もいじれないようにする
    // それ以外のモードのときはobservationPlanetを選択できるようにする
    static setObservationSiteOnMode(mode: string) {
        const observerPlanetSelect = document.getElementById('observer_planet') as HTMLSelectElement;
        const modeType = ['view', 'live', 'ar'].includes(mode) ? 'view' : 'AEP';
        if (observerPlanetSelect) {
            observerPlanetSelect.disabled = modeType === 'view';
            observerPlanetSelect.value = (modeType === 'view') ? '地球' : observerPlanetSelect.value;
        }
    }

    // デバイスに応じてモードの有効/無効を制御
    updateModeSelectAvailability() {
        const modeSelect = document.getElementById('mode') as HTMLSelectElement;
        if (!modeSelect) return;

        const deviceInfo = this.deviceOrientationManager.getDeviceInfo();

        // すべてのオプションを有効にする
        Array.from(modeSelect.options).forEach(option => {
            option.disabled = false;
        });

        // デバイスに応じて特定のモードを無効化
        if (deviceInfo.os === 'pc') {
            // PCの場合はliveとarモードを無効化
            Array.from(modeSelect.options).forEach(option => {
                if (['live', 'ar'].includes(option.value)) {
                    option.disabled = true;
                }
            });

            // 現在選択されているモードが無効の場合はviewに変更
            if (['live', 'ar'].includes(modeSelect.value)) {
                modeSelect.value = 'view';
            }
        } else if (deviceInfo.os === 'iphone' || deviceInfo.os === 'android') {
            // モバイルデバイスの場合はすべて有効
            // 必要に応じて特定のモードを無効化可能
            // 例: ARモードがサポートされていない場合
            // Array.from(modeSelect.options).forEach(option => {
            //     if (option.value === 'ar') {
            //         option.disabled = true;
            //     }
            // });
        }

        // AR透明度スライダーの表示/非表示を制御
        const arOpacitySliderDiv = document.getElementById('arOpacitySliderDiv') as HTMLDivElement;
        if (arOpacitySliderDiv) {
            if (deviceInfo.os === 'pc' || modeSelect.value !== 'ar') {
                arOpacitySliderDiv.style.display = 'none';
            } else {
                arOpacitySliderDiv.style.display = 'block';
                const arOpacitySlider = document.getElementById('arOpacitySlider') as HTMLInputElement;
                const video = document.getElementById('arVideo') as HTMLVideoElement;
                if (video && arOpacitySlider) {
                    video.style.opacity = arOpacitySlider.value;
                }
            }
        }

        const arFovDiv = document.getElementById('arFovDiv') as HTMLDivElement;
        if (arFovDiv) {
            if (deviceInfo.os === 'pc' || modeSelect.value !== 'ar') {
                arFovDiv.style.display = 'none';
            } else {
                arFovDiv.style.display = 'block';
                const arfovEl = document.getElementById('arFov') as HTMLInputElement;
                const video = document.getElementById('arVideo') as HTMLVideoElement;
                if (video && arfovEl) {
                    const fovDeg = this.config.viewState.fov.ra;
                    const fovVideo = parseFloat(arfovEl.value);
                    video.style.height = `${Math.round(100 * fovVideo / fovDeg)}%`;
                }
            }
        }
    }

    toggleDarkMode() {
        const darkMode = this.config.displaySettings.darkMode;
        document.querySelectorAll('*').forEach(el => {
            if (darkMode) {
                el.classList.add('dark-mode');
            } else {
                el.classList.remove('dark-mode');
            }
        });
        if (this.renderer !== null) {
            this.renderer.updateColorManager();
        }
    }
}
