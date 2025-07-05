import { CoordinateConverter } from "../utils/coordinates.js";
import { AstronomicalCalculator } from "../utils/calculations.js";
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
            console.log('Slider setup:', {
                originalJd: currentJd,
                adjustedJd: adjustedJd,
                stepValue: stepValue,
                diff: adjustedJd - currentJd,
                min: this.timeSlider.min,
                max: this.timeSlider.max,
                value: this.timeSlider.value,
                step: this.timeSlider.step
            });
            // 直接DOM要素との比較
            const directElement = document.getElementById('timeSlider');
            console.log('Element comparison:', {
                thisTimeSlider: this.timeSlider,
                directElement: directElement,
                sameElement: this.timeSlider === directElement,
                thisValue: this.timeSlider.value,
                directValue: directElement?.value,
                directMin: directElement?.min,
                directMax: directElement?.max,
                directStep: directElement?.step
            });
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
    static handleSliderInput(event) {
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
    static toggleRealTime() {
        const config = window.config;
        if (!config)
            return;
        const newRealTime = config.displayTime.realTime === 'on' ? 'off' : 'on';
        const updateConfig = window.updateConfig;
        if (updateConfig) {
            updateConfig({
                displayTime: {
                    ...config.displayTime,
                    realTime: newRealTime
                }
            });
        }
        this.updateSliderValue();
    }
}
TimeController.timeSlider = null;
TimeController.isDragging = false;
//# sourceMappingURL=TimeController.js.map