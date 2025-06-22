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
            setting?.classList.remove('show');
        }
        else {
            if (setting) {
                setting.style.display = 'none';
            }
        }
        // 設定値の保存や適用処理
        SettingController.saveSettings();
    }
    static updateConfigFromInputs() {
        console.log('updateConfigFromInputs called');
        // 観測地の設定を読み取り
        const latInput = document.getElementById('lat');
        const lonInput = document.getElementById('lon');
        const nsSelect = document.getElementById('NSCombo');
        const ewSelect = document.getElementById('EWCombo');
        if (latInput && lonInput && nsSelect && ewSelect) {
            let latitude = parseFloat(latInput.value);
            let longitude = parseFloat(lonInput.value);
            // 南緯の場合は負の値に
            if (nsSelect.value === '南緯') {
                latitude = -latitude;
            }
            // 西経の場合は負の値に
            if (ewSelect.value === '西経') {
                longitude = -longitude;
            }
            console.log('Updating observation site:', { latitude, longitude });
            // configを更新
            const updateConfig = window.updateConfig;
            if (updateConfig) {
                updateConfig({
                    observationSite: {
                        latitude: latitude,
                        longitude: longitude,
                        timezone: 9 // 日本標準時
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
                const newRenderOptions = {
                    ...currentConfig.renderOptions, // 既存の値を保持
                    showGrid: gridCheck.checked,
                    showPlanets: planetCheck ? planetCheck.checked : true,
                    showConstellationNames: constNameCheck ? constNameCheck.checked : true,
                    showConstellationLines: constLineCheck ? constLineCheck.checked : true,
                    mode: modeSelect ? modeSelect.value : 'AEP',
                    // 位置・ズーム関連のプロパティも明示的に含める
                    centerRA: currentConfig.renderOptions.centerRA,
                    centerDec: currentConfig.renderOptions.centerDec,
                    fieldOfViewRA: currentConfig.renderOptions.fieldOfViewRA,
                    fieldOfViewDec: currentConfig.renderOptions.fieldOfViewDec,
                    starSizeKey1: currentConfig.renderOptions.starSizeKey1,
                    starSizeKey2: currentConfig.renderOptions.starSizeKey2
                };
                console.log('🔧 About to call updateConfig with centerRA:', newRenderOptions.centerRA);
                updateConfig({
                    renderOptions: newRenderOptions
                });
                console.log('🔧 updateConfig called successfully');
            }
            else {
                console.log('❌ updateConfig function not found!');
            }
        }
        // 時刻設定を読み取り（もし時刻入力フィールドがある場合）
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
    static saveSettings() {
        // 設定値をローカルストレージに保存
        const settings = {
            observer: document.getElementById('observer')?.value,
            latitude: document.getElementById('lat')?.value,
            longitude: document.getElementById('lon')?.value,
            darkMode: document.getElementById('dark')?.checked,
            gridCheck: document.getElementById('gridCheck')?.checked,
            magLimit: document.getElementById('magLimitSlider')?.value,
            mode: document.querySelector('input[name="mode"]:checked')?.value,
            starName: document.querySelector('input[name="starName"]:checked')?.value,
            constNameCheck: document.getElementById('constNameCheck')?.checked,
            constLineCheck: document.getElementById('constLineCheck')?.checked,
            planetCheck: document.getElementById('planetCheck')?.checked,
            MessierCheck: document.getElementById('MessierCheck')?.checked,
            recsCheck: document.getElementById('recsCheck')?.checked
        };
        localStorage.setItem('starChartSettings', JSON.stringify(settings));
    }
    static loadSettings() {
        // 保存された設定値を読み込み
        const savedSettings = localStorage.getItem('starChartSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            // 設定値をフォームに反映
            if (settings.observer) {
                document.getElementById('observer').value = settings.observer;
            }
            if (settings.latitude) {
                document.getElementById('lat').value = settings.latitude;
            }
            if (settings.longitude) {
                document.getElementById('lon').value = settings.longitude;
            }
            if (settings.darkMode !== undefined) {
                document.getElementById('dark').checked = settings.darkMode;
            }
            if (settings.gridCheck !== undefined) {
                document.getElementById('gridCheck').checked = settings.gridCheck;
            }
            if (settings.magLimit) {
                document.getElementById('magLimitSlider').value = settings.magLimit;
            }
            if (settings.mode) {
                const modeRadio = document.querySelector(`input[name="mode"][value="${settings.mode}"]`);
                if (modeRadio)
                    modeRadio.checked = true;
            }
            if (settings.starName) {
                const starNameRadio = document.querySelector(`input[name="starName"][value="${settings.starName}"]`);
                if (starNameRadio)
                    starNameRadio.checked = true;
            }
            if (settings.constNameCheck !== undefined) {
                document.getElementById('constNameCheck').checked = settings.constNameCheck;
            }
            if (settings.constLineCheck !== undefined) {
                document.getElementById('constLineCheck').checked = settings.constLineCheck;
            }
            if (settings.planetCheck !== undefined) {
                document.getElementById('planetCheck').checked = settings.planetCheck;
            }
            if (settings.MessierCheck !== undefined) {
                document.getElementById('MessierCheck').checked = settings.MessierCheck;
            }
            if (settings.recsCheck !== undefined) {
                document.getElementById('recsCheck').checked = settings.recsCheck;
            }
        }
    }
}
//# sourceMappingURL=SettingController.js.map