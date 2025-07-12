import { AstronomicalCalculator } from "../utils/calculations.js";
import { TimeController } from "./TimeController.js";
import { SolarSystemDataManager } from '../models/SolarSystemObjects.js';
export class SettingController {
    static switchSettingTab(tabName) {
        // すべてのタブコンテンツを非表示
        document.querySelectorAll('.setting-section').forEach(section => {
            section.style.display = 'none';
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
    // OKボタンが押されたら
    static async finishSetting() {
        console.log('🔧 finishSetting called');
        // 設定値を読み取ってconfigを更新
        SettingController.updateConfigFromInputs();
        // 設定画面を隠す
        const setting = document.getElementById('setting');
        if (window.innerWidth <= 768) {
            setting.style.display = 'block';
            setting?.classList.remove('show');
        }
        else {
            if (setting) {
                setting.style.display = 'none';
            }
        }
        // 設定値をローカルストレージに保存
        SettingController.saveConfigToLocalStorage();
        // 設定反映後に全天体データを更新
        SolarSystemDataManager.updateAllData(window.config.displayTime.jd);
        window.renderAll();
    }
    static updateConfigFromInputs() {
        console.log('🔧 updateConfigFromInputs called');
        // 観測地の設定を読み取り
        const observerPlanetSelect = document.getElementById('observer_planet');
        const observationSiteSelect = document.getElementById('observation-site-select');
        const latInput = document.getElementById('lat');
        const lonInput = document.getElementById('lon');
        const nsSelect = document.getElementById('NSCombo');
        const ewSelect = document.getElementById('EWCombo');
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
            const updateConfig = window.updateConfig;
            if (updateConfig) {
                updateConfig({
                    observationSite: {
                        observerPlanet: observerPlanet,
                        name: observationSiteSelect.value,
                        latitude: latitude,
                        longitude: longitude,
                        timezone: 9
                    }
                });
            }
        }
        // 表示設定を読み取り
        const modeSelect = document.getElementById('mode');
        const magLimitSlider = document.getElementById('magLimitSlider');
        const darkMode = document.getElementById('dark');
        const gridCheck = document.getElementById('gridCheck');
        const reticleCheck = document.getElementById('reticleCheck');
        const starCheck = document.getElementById('starCheck');
        const starNameCheck = document.getElementById('starName');
        const constellationNameCheck = document.getElementById('constellationNameCheck');
        const constellationLineCheck = document.getElementById('constellationLineCheck');
        const planetCheck = document.getElementById('planetCheck');
        const messierCheck = document.getElementById('messierCheck');
        const recCheck = document.getElementById('recCheck');
        const ngcCheck = document.getElementById('ngcCheck');
        const camera = document.getElementById('camera');
        if (modeSelect && gridCheck && darkMode && magLimitSlider &&
            reticleCheck && starCheck && starNameCheck &&
            planetCheck && messierCheck && recCheck && ngcCheck && camera) {
            const updateConfig = window.updateConfig;
            if (updateConfig) {
                const currentConfig = window.config;
                const newDisplaySettings = {
                    ...currentConfig.displaySettings, // 既存の値を保持
                    mode: modeSelect.value,
                    showGrid: gridCheck.checked,
                    showReticle: reticleCheck.checked,
                    showStars: starCheck.checked,
                    showStarNames: starNameCheck.value,
                    showPlanets: planetCheck.checked,
                    showConstellationNames: constellationNameCheck.checked,
                    showConstellationLines: constellationLineCheck.checked,
                    showMessiers: messierCheck.checked,
                    showRecs: recCheck.checked,
                    showNGC: ngcCheck.checked,
                    camera: camera.value === 'none' ? null : camera.value
                };
                console.log('🔧 About to call updateConfig with newDisplaySettings:', newDisplaySettings);
                updateConfig({
                    displaySettings: newDisplaySettings
                });
                console.log('🔧 updateConfig called successfully');
            }
            else {
                console.log('❌ updateConfig function not found!');
            }
        }
        // 時刻設定を読み取り
        const dtlInput = document.getElementById('dtl');
        const realTime = document.getElementById('realTime');
        if (dtlInput && realTime) {
            let year, month, day, hour, minute, second, jd;
            const currentConfig = window.config;
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
                    console.log(year, month, day, hour, minute, second);
                }
                else {
                    // デフォルト値
                    year = currentConfig.displayTime.year;
                    month = currentConfig.displayTime.month;
                    day = currentConfig.displayTime.day;
                    hour = currentConfig.displayTime.hour;
                    minute = currentConfig.displayTime.minute;
                    second = currentConfig.displayTime.second;
                }
                jd = AstronomicalCalculator.jdTTFromYmdhmsJst(year, month, day, hour, minute, second);
            }
            else {
                jd = AstronomicalCalculator.calculateCurrentJdTT();
                [year, month, day, hour, minute, second] = AstronomicalCalculator.calculateYmdhmJstFromJdTT(jd);
            }
            const updateConfig = window.updateConfig;
            if (updateConfig) {
                updateConfig({
                    displayTime: {
                        year: year,
                        month: month,
                        day: day,
                        hour: hour,
                        minute: minute,
                        second: second,
                        jd: jd,
                        realTime: realTime.value || 'off'
                    }
                });
                TimeController.initialize();
            }
        }
    }
    // 現在の設定をlocalStorageに保存
    static saveConfigToLocalStorage() {
        const config = window.config;
        if (!config) {
            console.warn('💾 No config found, cannot save');
            return;
        }
        localStorage.setItem('config', JSON.stringify({
            displaySettings: config.displaySettings,
            viewState: config.viewState,
            observationSite: config.observationSite,
            displayTime: config.displayTime
        }));
    }
    // main.tsのconfigから設定をUIに反映するメソッド
    static loadSettingsFromConfig() {
        const config = window.config;
        if (!config)
            return;
        // 観測地の設定
        const observerPlanetSelect = document.getElementById('observer_planet');
        const observationSiteSelect = document.getElementById('observation-site-select');
        const latInput = document.getElementById('lat');
        const lonInput = document.getElementById('lon');
        const nsSelect = document.getElementById('NSCombo');
        const ewSelect = document.getElementById('EWCombo');
        if (observerPlanetSelect && observationSiteSelect && latInput && lonInput && nsSelect && ewSelect) {
            observerPlanetSelect.value = config.observationSite.observerPlanet;
            observationSiteSelect.value = config.observationSite.name;
            const latitude = Math.abs(config.observationSite.latitude);
            const longitude = Math.abs(config.observationSite.longitude);
            latInput.value = latitude.toString();
            lonInput.value = longitude.toString();
            nsSelect.value = config.observationSite.latitude >= 0 ? '北緯' : '南緯';
            ewSelect.value = config.observationSite.longitude >= 0 ? '東経' : '西経';
        }
        // 表示設定
        const modeSelect = document.getElementById('mode');
        const magLimitSlider = document.getElementById('magLimitSlider');
        const darkMode = document.getElementById('dark');
        const gridCheck = document.getElementById('gridCheck');
        const reticleCheck = document.getElementById('reticleCheck');
        const starCheck = document.getElementById('starCheck');
        const starNameCheck = document.getElementById('starName');
        const constellationNameCheck = document.getElementById('constellationNameCheck');
        const constellationLineCheck = document.getElementById('constellationLineCheck');
        const planetCheck = document.getElementById('planetCheck');
        const messierCheck = document.getElementById('messierCheck');
        const recCheck = document.getElementById('recCheck');
        const ngcCheck = document.getElementById('ngcCheck');
        const camera = document.getElementById('camera');
        if (modeSelect)
            modeSelect.value = config.displaySettings.mode || 'AEP';
        if (magLimitSlider)
            magLimitSlider.value = config.viewState.starSizeKey1.toString();
        if (darkMode)
            darkMode.checked = config.displaySettings.darkMode;
        if (gridCheck)
            gridCheck.checked = config.displaySettings.showGrid;
        if (reticleCheck)
            reticleCheck.checked = config.displaySettings.showReticle;
        if (starCheck)
            starCheck.checked = config.displaySettings.showStars;
        if (starNameCheck)
            starNameCheck.value = config.displaySettings.showStarNames ? 'all' : 'no';
        if (constellationNameCheck)
            constellationNameCheck.checked = config.displaySettings.showConstellationNames;
        if (constellationLineCheck)
            constellationLineCheck.checked = config.displaySettings.showConstellationLines;
        if (planetCheck)
            planetCheck.checked = config.displaySettings.showPlanets;
        if (messierCheck)
            messierCheck.checked = config.displaySettings.showMessiers;
        if (recCheck)
            recCheck.checked = config.displaySettings.showRecs;
        if (ngcCheck)
            ngcCheck.checked = config.displaySettings.showNGC;
        if (camera)
            camera.value = config.displaySettings.camera || 'none';
        // モード設定
        const modeRadio = document.querySelector(`input[name="mode"][value="${config.displaySettings.mode}"]`);
        if (modeRadio)
            modeRadio.checked = true;
        // 時刻設定
        const dtlInput = document.getElementById('dtl');
        const realTime = document.getElementById('realTime');
        if (dtlInput && realTime) {
            // ローカル時間で日時を作成（世界時変換を避ける）
            const year = config.displayTime.year;
            const month = String(config.displayTime.month).padStart(2, '0');
            const day = String(config.displayTime.day).padStart(2, '0');
            const hour = String(config.displayTime.hour).padStart(2, '0');
            const minute = String(config.displayTime.minute).padStart(2, '0');
            // YYYY-MM-DDTHH:MM 形式でローカル時間を直接設定
            const localDateTime = `${year}-${month}-${day}T${hour}:${minute}`;
            dtlInput.value = localDateTime;
            console.log('Local datetime set:', localDateTime);
            realTime.value = config.displayTime.realTime;
        }
        console.log('🔧 Settings loaded from config to UI');
    }
}
//# sourceMappingURL=SettingController.js.map