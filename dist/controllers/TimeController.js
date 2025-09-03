import { AstronomicalCalculator } from "../utils/calculations.js";
import { CoordinateConverter } from "../utils/coordinates.js";
import { SolarSystemDataManager } from '../models/SolarSystemObjects.js';
export class TimeController {
    static initialize() {
        this.setupTimeSlider();
        const dtlInput = document.getElementById('dtl');
        const realTime = document.getElementById('realTime');
        if (dtlInput && realTime) {
            dtlInput.addEventListener('input', (e) => {
                realTime.value = 'off';
            });
        }
    }
    static setupTimeSlider() {
        this.timeSliderDiv = document.getElementById('timeSliderDiv');
        if (!this.timeSliderDiv)
            return;
        this.timeSlider = document.getElementById('timeSlider');
        if (!this.timeSlider)
            return;
        // スライダーの初期値を設定
        const config = window.config;
        if (config && config.displayTime.realTime === 'off') {
            this.timeSliderDiv.style.display = 'block';
            // 現在のJDから前後1時間の範囲を設定
            const currentJd = config.displayTime.jd;
            const minJd = currentJd - 1.0 / 24.0; // 1時間前
            const maxJd = currentJd + 1.0 / 24.0; // 1時間後
            // step値を先に設定
            const stepValue = 1.0 / 1440.0;
            this.timeSlider.step = String(stepValue);
            // min, maxを設定
            this.timeSlider.min = String(minJd);
            this.timeSlider.max = String(maxJd);
            // step値に合わせて値を調整してから設定
            const adjustedJd = parseFloat(this.timeSlider.min) + Math.round((currentJd - parseFloat(this.timeSlider.min)) / stepValue) * stepValue;
            this.timeSlider.value = String(adjustedJd);
        }
        else {
            this.timeSliderDiv.style.display = 'none';
            // this.timeSlider.style.display = 'none';
        }
        // イベントリスナーを設定
        this.timeSlider.addEventListener('input', (e) => {
            this.handleSliderInput(e);
        });
        // controlPanelの可視性を初期化
        this.updateControlPanelVisibility();
    }
    static async handleSliderInput(event) {
        const target = event.target;
        const jd = parseFloat(target.value); // JDの値を直接取得
        const config = window.config;
        if (!config)
            return;
        const targetJd = AstronomicalCalculator.calculateYmdhmsJstFromJdTT(jd);
        const viewState = config.viewState;
        const coordinateConverter = new CoordinateConverter();
        if (config.displaySettings.mode == 'AEP') {
            const centerAzAlt = coordinateConverter.equatorialToHorizontal({ ra: viewState.centerRA, dec: viewState.centerDec }, config.siderealTime);
            viewState.centerAz = centerAzAlt.az;
            viewState.centerAlt = centerAzAlt.alt;
        }
        else if (config.displaySettings.mode == 'view') {
            const centerRaDec = coordinateConverter.horizontalToEquatorial({ az: viewState.centerAz, alt: viewState.centerAlt }, config.siderealTime);
            viewState.centerRA = centerRaDec.ra;
            viewState.centerDec = centerRaDec.dec;
        }
        const newConfig = {
            viewState: viewState,
            displayTime: {
                year: targetJd.year,
                month: targetJd.month,
                day: targetJd.day,
                hour: targetJd.hour,
                minute: targetJd.minute,
                second: targetJd.second,
                jd: jd,
                realTime: 'off' // 手動設定時はリアルタイムをオフにする
            },
            siderealTime: AstronomicalCalculator.calculateLocalSiderealTime(jd, config.observationSite.longitude || 135)
        };
        const updateConfig = window.updateConfig;
        if (updateConfig) {
            updateConfig(newConfig);
        }
        // ★ スライダー操作時に全天体データを更新
        SolarSystemDataManager.updateAllData(jd, config.observationSite);
        const renderAll = window.renderAll;
        if (renderAll) {
            renderAll();
        }
    }
    static setToCurrentTime() {
        const config = window.config;
        if (!config)
            return;
        const jd = AstronomicalCalculator.calculateCurrentJdTT();
        const targetJd = AstronomicalCalculator.calculateYmdhmsJstFromJdTT(jd);
        const updateConfig = window.updateConfig;
        if (updateConfig) {
            updateConfig({
                displayTime: {
                    year: targetJd.year,
                    month: targetJd.month,
                    day: targetJd.day,
                    hour: targetJd.hour,
                    minute: targetJd.minute,
                    second: targetJd.second,
                    jd: jd,
                    realTime: 'on' // 現在時刻に設定時はリアルタイムをオンにする
                }
            });
        }
        this.updateSliderValue();
    }
    static updateSliderValue() {
        if (!this.timeSliderDiv)
            return;
        if (!this.timeSlider)
            return;
        const config = window.config;
        if (!config)
            return;
        // リアルタイムモードの場合はスライダーを非表示
        if (config.displayTime.realTime != 'off') {
            this.timeSliderDiv.style.display = 'none';
            this.updateControlPanelVisibility();
            return;
        }
        // 手動モードの場合はスライダーを表示して値を更新
        this.timeSliderDiv.style.display = 'block';
        const currentJd = config.displayTime.jd;
        const minJd = currentJd - 1.0 / 24.0; // 1時間前
        const maxJd = currentJd + 1.0 / 24.0; // 1時間後
        // step値に合わせて値を調整
        const stepValue = 1.0 / 1440.0;
        const adjustedJd = Math.round(currentJd / stepValue) * stepValue;
        this.timeSlider.min = String(minJd);
        this.timeSlider.max = String(maxJd);
        this.timeSlider.value = String(adjustedJd);
        this.updateControlPanelVisibility();
    }
    // controlPanelの可視性を更新するメソッド
    static updateControlPanelVisibility() {
        const controlPanel = document.getElementById('controlPanel');
        if (!controlPanel)
            return;
        const cameraTiltSliderDiv = document.getElementById('cameraTiltSliderDiv');
        // すべてのスライダーが非表示かチェック
        const allSlidersHidden = (!this.timeSliderDiv || this.timeSliderDiv.style.display === 'none') &&
            (!cameraTiltSliderDiv || cameraTiltSliderDiv.style.display === 'none');
        // すべてのスライダーが非表示の場合はcontrolPanelも非表示にする
        if (allSlidersHidden) {
            controlPanel.style.display = 'none';
        }
        else {
            controlPanel.style.display = 'block';
        }
    }
    // 外部から呼び出せるメソッド
    static updateSlider() {
        this.updateSliderValue();
    }
    // configの変更を監視してスライダーを更新
    static onConfigUpdate() {
        // this.updateSliderValue();
    }
    // リアルタイムモードの切り替え
    static toggleRealTime(mode) {
        const config = window.config;
        if (!config)
            return;
        if (mode === 'radec') {
            if (this.intervalId !== null) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
            this.intervalId = setInterval(this.realtimeRadec, 500);
        }
        else if (mode === 'azalt') {
            if (this.intervalId !== null) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
            this.intervalId = setInterval(this.realtimeAzalt, 500);
        }
        else {
            if (this.intervalId !== null) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
            return;
        }
        this.updateSliderValue();
    }
    static realtimeRadec() {
        const config = window.config;
        if (!config)
            return;
        const now = new Date();
        if (now.getSeconds() % 3 == 0 && now.getMilliseconds() < 500) {
            const [y, m, d, h, mi, s] = [now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()];
            const jd = AstronomicalCalculator.jdTTFromYmdhmsJst(y, m, d, h, mi, s);
            config.displayTime.jd = jd;
            const coordinateConverter = new CoordinateConverter();
            const newCenterHorizontal = coordinateConverter.equatorialToHorizontal({ ra: config.viewState.centerRA, dec: config.viewState.centerDec }, config.siderealTime);
            config.viewState.centerAz = newCenterHorizontal.az;
            config.viewState.centerAlt = newCenterHorizontal.alt;
            const updateConfig = window.updateConfig;
            if (updateConfig) {
                updateConfig({
                    viewState: config.viewState,
                    displayTime: {
                        jd: jd,
                        year: y,
                        month: m,
                        day: d,
                        hour: h,
                        minute: mi,
                        second: 0,
                        realTime: 'radec'
                    }
                });
            }
            SolarSystemDataManager.updateAllData(jd, config.observationSite);
            const renderAll = window.renderAll;
            if (renderAll) {
                renderAll();
            }
        }
    }
    static realtimeAzalt() {
        const config = window.config;
        if (!config)
            return;
        const now = new Date();
        if (now.getSeconds() % 3 == 0 && now.getMilliseconds() < 500) {
            const [y, m, d, h, mi, s] = [now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()];
            const jd = AstronomicalCalculator.jdTTFromYmdhmsJst(y, m, d, h, mi, s);
            config.displayTime.jd = jd;
            const coordinateConverter = new CoordinateConverter();
            const newCenterEquatorial = coordinateConverter.horizontalToEquatorial({ az: config.viewState.centerAz, alt: config.viewState.centerAlt }, config.siderealTime);
            config.viewState.centerRA = newCenterEquatorial.ra;
            config.viewState.centerDec = newCenterEquatorial.dec;
            const updateConfig = window.updateConfig;
            if (updateConfig) {
                updateConfig({
                    viewState: config.viewState,
                    displayTime: {
                        jd: jd,
                        year: y,
                        month: m,
                        day: d,
                        hour: h,
                        minute: mi,
                        second: s,
                        realTime: 'azalt'
                    }
                });
            }
            SolarSystemDataManager.updateAllData(jd, config.observationSite);
            const renderAll = window.renderAll;
            if (renderAll) {
                renderAll();
            }
        }
    }
}
TimeController.timeSliderDiv = null;
TimeController.timeSlider = null;
TimeController.intervalId = null;
//# sourceMappingURL=TimeController.js.map