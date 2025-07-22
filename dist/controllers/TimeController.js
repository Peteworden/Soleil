import { CoordinateConverter } from "../utils/coordinates.js";
import { AstronomicalCalculator } from "../utils/calculations.js";
import { SolarSystemDataManager } from '../models/SolarSystemObjects.js';
export class TimeController {
    static initialize() {
        this.setupTimeSlider();
        // this.setupTimeButtons();
    }
    static setupTimeSlider() {
        this.timeSlider = document.getElementById('timeSlider');
        if (!this.timeSlider) {
            console.warn('Time slider not found');
            return;
        }
        // スライダーの初期値を設定
        const config = window.config;
        if (config && config.displayTime.realTime === 'off') {
            this.timeSlider.style.display = 'block';
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
            this.timeSlider.style.display = 'none';
        }
        // イベントリスナーを設定
        this.timeSlider.addEventListener('input', (e) => {
            this.handleSliderInput(e);
        });
        // this.timeSlider.addEventListener('mousedown', () => {
        //     this.isDragging = true;
        // });
        // this.timeSlider.addEventListener('mouseup', () => {
        //     this.isDragging = false;
        // });
        // this.timeSlider.addEventListener('touchstart', () => {
        //     this.isDragging = true;
        // });
        // this.timeSlider.addEventListener('touchend', () => {
        //     this.isDragging = false;
        // });
    }
    // private static setupTimeButtons() {
    //     // 時刻ボタンのイベントリスナー
    //     const plus1Button = document.getElementById('plus1');
    //     const minus1Button = document.getElementById('minus1');
    //     const nowButton = document.getElementById('now');
    //     if (plus1Button) {
    //         plus1Button.addEventListener('click', () => {
    //             this.addDays(1);
    //         });
    //     }
    //     if (minus1Button) {
    //         minus1Button.addEventListener('click', () => {
    //             this.addDays(-1);
    //         });
    //     }
    //     if (nowButton) {
    //         nowButton.addEventListener('click', () => {
    //             this.setToCurrentTime();
    //         });
    //     }
    // }
    static async handleSliderInput(event) {
        const target = event.target;
        const jd = parseFloat(target.value); // JDの値を直接取得
        const config = window.config;
        if (!config)
            return;
        const targetJd = AstronomicalCalculator.calculateYmdhmJstFromJdTT(jd);
        const viewState = config.viewState;
        const coordinateConverter = new CoordinateConverter();
        if (config.displaySettings.mode == 'AEP') {
            const centerAzAlt = coordinateConverter.equatorialToHorizontal({ ra: viewState.centerRA, dec: viewState.centerDec }, config.siderealTime);
            viewState.centerAz = centerAzAlt.az;
            viewState.centerAlt = centerAzAlt.alt;
        }
        else {
            const centerRaDec = coordinateConverter.horizontalToEquatorial({ az: viewState.centerAz, alt: viewState.centerAlt }, config.siderealTime);
            viewState.centerRA = centerRaDec.ra;
            viewState.centerDec = centerRaDec.dec;
        }
        const newConfig = {
            viewState: viewState,
            displayTime: {
                year: targetJd[0],
                month: targetJd[1],
                day: targetJd[2],
                hour: targetJd[3],
                minute: targetJd[4],
                second: targetJd[5],
                jd: jd,
                realTime: 'off' // 手動設定時はリアルタイムをオフにする
            },
            siderealTime: AstronomicalCalculator.calculateLocalSiderealTime(jd, config.observationSite.longitude || 135)
        };
        const updateConfig = window.updateConfig;
        if (updateConfig) {
            updateConfig(newConfig);
        }
        const renderAll = window.renderAll;
        if (renderAll) {
            renderAll();
        }
        // ★ スライダー操作時に全天体データを更新
        SolarSystemDataManager.updateAllData(jd);
    }
    static addDays(days) {
        const config = window.config;
        if (!config)
            return;
        const jd = config.displayTime.jd + days;
        const targetJd = AstronomicalCalculator.calculateYmdhmJstFromJdTT(jd);
        const updateConfig = window.updateConfig;
        if (updateConfig) {
            updateConfig({
                displayTime: {
                    year: targetJd[0],
                    month: targetJd[1],
                    day: targetJd[2],
                    hour: targetJd[3],
                    minute: targetJd[4],
                    second: targetJd[5],
                    jd: jd,
                    realTime: 'off' // 手動設定時はリアルタイムをオフにする
                }
            });
        }
        this.updateSliderValue();
    }
    static setToCurrentTime() {
        const config = window.config;
        if (!config)
            return;
        const jd = AstronomicalCalculator.calculateCurrentJdTT();
        const targetJd = AstronomicalCalculator.calculateYmdhmJstFromJdTT(jd);
        const updateConfig = window.updateConfig;
        if (updateConfig) {
            updateConfig({
                displayTime: {
                    year: targetJd[0],
                    month: targetJd[1],
                    day: targetJd[2],
                    hour: targetJd[3],
                    minute: targetJd[4],
                    second: targetJd[5],
                    jd: jd,
                    realTime: 'on' // 現在時刻に設定時はリアルタイムをオンにする
                }
            });
        }
        this.updateSliderValue();
    }
    static updateSliderValue() {
        if (!this.timeSlider)
            return;
        const config = window.config;
        if (!config)
            return;
        // リアルタイムモードの場合はスライダーを非表示
        if (config.displayTime.realTime != 'off') {
            this.timeSlider.style.display = 'none';
            return;
        }
        // 手動モードの場合はスライダーを表示して値を更新
        this.timeSlider.style.display = 'block';
        const currentJd = config.displayTime.jd;
        const minJd = currentJd - 1.0 / 24.0; // 1時間前
        const maxJd = currentJd + 1.0 / 24.0; // 1時間後
        // step値に合わせて値を調整
        const stepValue = 1.0 / 1440.0;
        const adjustedJd = Math.round(currentJd / stepValue) * stepValue;
        this.timeSlider.min = String(minJd);
        this.timeSlider.max = String(maxJd);
        this.timeSlider.value = String(adjustedJd);
        console.log('updateSliderValue:', {
            currentJd: currentJd,
            sliderValue: this.timeSlider.value,
            directElementValue: document.getElementById('timeSlider')?.value
        });
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
            SolarSystemDataManager.updateAllData(jd);
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
                        second: 0,
                        realTime: 'azalt'
                    }
                });
            }
            SolarSystemDataManager.updateAllData(jd);
            const renderAll = window.renderAll;
            if (renderAll) {
                renderAll();
            }
        }
    }
}
TimeController.timeSlider = null;
TimeController.isDragging = false;
TimeController.intervalId = null;
//# sourceMappingURL=TimeController.js.map