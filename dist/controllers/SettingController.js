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
    static finishSetting() {
        console.log('🔧 finishSetting called');
        // 設定値を読み取ってconfigを更新
        SettingController.updateConfigFromInputs();
        // 設定を適用する処理
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
        // 設定値を保存
        SettingController.saveConfigToLocalStorage();
    }
    static updateConfigFromInputs() {
        console.log('🔧 updateConfigFromInputs called');
        // 観測地の設定を読み取り
        const latInput = document.getElementById('lat');
        const lonInput = document.getElementById('lon');
        const nsSelect = document.getElementById('NSCombo');
        const ewSelect = document.getElementById('EWCombo');
        if (latInput && lonInput && nsSelect && ewSelect) {
            const latitude = parseFloat(latInput.value) * (nsSelect.value === '北緯' ? 1 : -1);
            const longitude = parseFloat(lonInput.value) * (ewSelect.value === '東経' ? 1 : -1);
            const updateConfig = window.updateConfig;
            if (updateConfig) {
                updateConfig({
                    observationSite: {
                        latitude: latitude,
                        longitude: longitude,
                        timezone: 9
                    }
                });
            }
        }
        // 表示設定を読み取り
        const gridCheck = document.getElementById('gridCheck');
        const darkMode = document.getElementById('dark');
        const magLimitSlider = document.getElementById('magLimitSlider');
        const constNameCheck = document.getElementById('constNameCheck');
        const constLineCheck = document.getElementById('constLineCheck');
        const planetCheck = document.getElementById('planetCheck');
        const starNameCheck = document.querySelector('input[name="starName"]:checked');
        const modeSelect = document.getElementById('mode');
        if (gridCheck && darkMode && magLimitSlider) {
            const updateConfig = window.updateConfig;
            console.log('🔧 updateConfig function found:', !!updateConfig);
            if (updateConfig) {
                const currentConfig = window.config;
                const newDisplaySettings = {
                    ...currentConfig.displaySettings, // 既存の値を保持
                    showGrid: gridCheck.checked,
                    showPlanets: planetCheck ? planetCheck.checked : true,
                    showConstellationNames: constNameCheck ? constNameCheck.checked : true,
                    showConstellationLines: constLineCheck ? constLineCheck.checked : true,
                    mode: modeSelect ? modeSelect.value : 'AEP'
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
        const yearInput = document.getElementById('yearText');
        const monthInput = document.getElementById('monthText');
        const dayInput = document.getElementById('dateText');
        const hourInput = document.getElementById('hourText');
        const minuteInput = document.getElementById('minuteText');
        if (yearInput && monthInput && dayInput && hourInput && minuteInput) {
            const year = parseInt(yearInput.value);
            const month = parseInt(monthInput.value);
            const day = parseInt(dayInput.value);
            const hour = parseInt(hourInput.value);
            const minute = parseInt(minuteInput.value);
            const updateConfig = window.updateConfig;
            if (updateConfig) {
                updateConfig({
                    displayTime: {
                        year: year,
                        month: month,
                        day: day,
                        hour: hour,
                        minute: minute,
                        second: 0
                    }
                });
            }
        }
    }
    // 現在の設定をlocalStorageに保存
    static saveConfigToLocalStorage() {
        console.log('💾 SettingController: Saving current config to localStorage');
        const config = window.config;
        if (!config) {
            console.warn('💾 No config found, cannot save');
            return;
        }
        localStorage.setItem('config', JSON.stringify({
            displaySettings: config.displaySettings,
            viewState: config.viewState
            // mode: config.displaySettings.mode,
            // centerRA: config.viewState.centerRA,
            // centerDec: config.viewState.centerDec,
            // centerAz: config.viewState.centerAz,
            // centerAlt: config.viewState.centerAlt,
            // fieldOfViewRA: config.viewState.fieldOfViewRA,
            // fieldOfViewDec: config.viewState.fieldOfViewDec
        }));
        console.log('💾 Config saved to localStorage');
    }
    // static loadSettingsFromLocalStorage() {
    //     // 保存された設定値を読み込み
    //     const savedSettings = localStorage.getItem('starChartSettings');
    //     if (savedSettings) {
    //         const settings = JSON.parse(savedSettings);
    //         // 設定値をフォームに反映
    //         if (settings.observer) {
    //             (document.getElementById('observer') as HTMLSelectElement).value = settings.observer;
    //         }
    //         if (settings.latitude) {
    //             (document.getElementById('lat') as HTMLInputElement).value = settings.latitude;
    //         }
    //         if (settings.longitude) {
    //             (document.getElementById('lon') as HTMLInputElement).value = settings.longitude;
    //         }
    //         if (settings.darkMode !== undefined) {
    //             (document.getElementById('dark') as HTMLInputElement).checked = settings.darkMode;
    //         }
    //         if (settings.gridCheck !== undefined) {
    //             (document.getElementById('gridCheck') as HTMLInputElement).checked = settings.gridCheck;
    //         }
    //         if (settings.magLimit) {
    //             (document.getElementById('magLimitSlider') as HTMLInputElement).value = settings.magLimit;
    //         }
    //         if (settings.mode) {
    //             const modeRadio = document.querySelector(`input[name="mode"][value="${settings.mode}"]`) as HTMLInputElement;
    //             if (modeRadio) modeRadio.checked = true;
    //         }
    //         if (settings.starName) {
    //             const starNameRadio = document.querySelector(`input[name="starName"][value="${settings.starName}"]`) as HTMLInputElement;
    //             if (starNameRadio) starNameRadio.checked = true;
    //         }
    //         if (settings.constNameCheck !== undefined) {
    //             (document.getElementById('constNameCheck') as HTMLInputElement).checked = settings.constNameCheck;
    //         }
    //         if (settings.constLineCheck !== undefined) {
    //             (document.getElementById('constLineCheck') as HTMLInputElement).checked = settings.constLineCheck;
    //         }
    //         if (settings.planetCheck !== undefined) {
    //             (document.getElementById('planetCheck') as HTMLInputElement).checked = settings.planetCheck;
    //         }
    //         if (settings.MessierCheck !== undefined) {
    //             (document.getElementById('MessierCheck') as HTMLInputElement).checked = settings.MessierCheck;
    //         }
    //         if (settings.recsCheck !== undefined) {
    //             (document.getElementById('recsCheck') as HTMLInputElement).checked = settings.recsCheck;
    //         }
    //     }
    //     // main.tsのconfigからも設定を読み込む
    //     SettingController.loadSettingsFromConfig();
    // }
    // main.tsのconfigから設定をUIに反映するメソッド
    static loadSettingsFromConfig() {
        const config = window.config;
        if (!config)
            return;
        console.log('🔧 Loading settings from main config to UI');
        // 観測地の設定
        const latInput = document.getElementById('lat');
        const lonInput = document.getElementById('lon');
        const nsSelect = document.getElementById('NSCombo');
        const ewSelect = document.getElementById('EWCombo');
        if (latInput && lonInput && nsSelect && ewSelect) {
            const latitude = Math.abs(config.observationSite.latitude);
            const longitude = Math.abs(config.observationSite.longitude);
            latInput.value = latitude.toString();
            lonInput.value = longitude.toString();
            nsSelect.value = config.observationSite.latitude >= 0 ? '北緯' : '南緯';
            ewSelect.value = config.observationSite.longitude >= 0 ? '東経' : '西経';
        }
        // 表示設定
        const gridCheck = document.getElementById('gridCheck');
        const darkMode = document.getElementById('dark');
        const magLimitSlider = document.getElementById('magLimitSlider');
        const constNameCheck = document.getElementById('constNameCheck');
        const constLineCheck = document.getElementById('constLineCheck');
        const planetCheck = document.getElementById('planetCheck');
        if (gridCheck)
            gridCheck.checked = config.displaySettings.showGrid;
        if (darkMode)
            darkMode.checked = false; // ダークモードは別途管理
        if (magLimitSlider)
            magLimitSlider.value = config.viewState.starSizeKey1.toString();
        if (constNameCheck)
            constNameCheck.checked = config.displaySettings.showConstellationNames;
        if (constLineCheck)
            constLineCheck.checked = config.displaySettings.showConstellationLines;
        if (planetCheck)
            planetCheck.checked = config.displaySettings.showPlanets;
        // モード設定
        const modeRadio = document.querySelector(`input[name="mode"][value="${config.displaySettings.mode}"]`);
        if (modeRadio)
            modeRadio.checked = true;
        // 時刻設定
        const yearInput = document.getElementById('yearText');
        const monthInput = document.getElementById('monthText');
        const dayInput = document.getElementById('dateText');
        const hourInput = document.getElementById('hourText');
        const minuteInput = document.getElementById('minuteText');
        if (yearInput && monthInput && dayInput && hourInput && minuteInput) {
            yearInput.value = config.displayTime.year.toString();
            monthInput.value = config.displayTime.month.toString();
            dayInput.value = config.displayTime.day.toString();
            hourInput.value = config.displayTime.hour.toString();
            minuteInput.value = config.displayTime.minute.toString();
        }
        console.log('🔧 Settings loaded from config to UI');
    }
}
//# sourceMappingURL=SettingController.js.map