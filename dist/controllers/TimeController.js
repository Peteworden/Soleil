import { AstronomicalCalculator } from "../utils/calculations.js";
import { CoordinateConverter } from "../utils/coordinates.js";
import { SolarSystemDataManager } from '../models/SolarSystemObjects.js';
export class TimeController {
    static initialize() {
        // 既に初期化済みの場合はスキップ（表示更新のみ）
        if (this.isInitialized) {
            this.updateSliderValue();
            return;
        }
        this.setupTimeControl();
        const dtlInput = document.getElementById('dtl');
        const realTime = document.getElementById('realTime');
        if (dtlInput && realTime) {
            dtlInput.addEventListener('input', (e) => {
                realTime.value = 'off';
            });
        }
        this.isInitialized = true;
    }
    static setupTimeControl() {
        this.timeControl = document.getElementById('timeControl');
        if (!this.timeControl)
            return;
        this.timeSlider = document.getElementById('timeSlider');
        if (!this.timeSlider)
            return;
        const config = window.config;
        if (config && config.displayTime.realTime === 'off') {
            this.timeControl.style.display = 'block';
            this.sliderBaseJd = config.displayTime.jd;
            this.initSliderRange();
        }
        else {
            this.timeControl.style.display = 'none';
        }
        // スライダーイベント
        this.timeSlider.addEventListener('input', (e) => {
            this.isDragging = true;
            this.handleSliderInput(e);
        });
        this.timeSlider.addEventListener('change', (e) => {
            this.isDragging = false;
            // ドラッグ終了後、基準点を更新
            const config = window.config;
            if (config) {
                this.sliderBaseJd = config.displayTime.jd;
                this.initSliderRange();
            }
        });
        // 折りたたみトグル
        const toggleBtn = document.getElementById('timeControlToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                console.log(`toggleBtn clicked: ${e}`);
                e.preventDefault();
                e.stopPropagation();
                this.toggleExpand();
            });
        }
        // NOWボタン
        const nowBtn = document.getElementById('timeNowBtn');
        if (nowBtn) {
            nowBtn.addEventListener('click', () => this.setToCurrentTime());
        }
        // 矢印ボタン
        const prevBtn = document.getElementById('timePrevBtn');
        const nextBtn = document.getElementById('timeNextBtn');
        if (prevBtn)
            prevBtn.addEventListener('click', () => this.stepBackward());
        if (nextBtn)
            nextBtn.addEventListener('click', () => this.stepForward());
        // ステップ選択ボタン
        const stepBtns = document.querySelectorAll('.time-step-btn');
        stepBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target;
                const step = parseInt(target.dataset.step || '1');
                this.setStep(step);
                // アクティブ状態を更新
                stepBtns.forEach(b => b.classList.remove('active'));
                target.classList.add('active');
            });
        });
        // 日の出・日没ボタン
        const sunriseBtn = document.getElementById('timeSunriseBtn');
        const sunsetBtn = document.getElementById('timeSunsetBtn');
        if (sunriseBtn)
            sunriseBtn.addEventListener('click', () => this.jumpToSunrise());
        if (sunsetBtn)
            sunsetBtn.addEventListener('click', () => this.jumpToSunset());
        // 再生ボタン
        const playBtn = document.getElementById('timePlayBtn');
        if (playBtn)
            playBtn.addEventListener('click', () => this.togglePlay());
        // 時刻表示を更新
        this.updateTimeDisplay();
        this.updateControlPanelVisibility();
    }
    // 折りたたみの切り替え
    static toggleExpand() {
        const body = document.getElementById('timeControlBody');
        const toggle = document.getElementById('timeControlToggle');
        if (body && toggle) {
            this.isExpanded = !this.isExpanded;
            body.style.display = this.isExpanded ? 'block' : 'none';
            // ▲で開く、▼で閉じる
            toggle.textContent = this.isExpanded ? '▼' : '▲';
            console.log(`toggleExpand: ${this.isExpanded}`);
        }
    }
    // ステップ設定
    static setStep(minutes) {
        this.currentStepMinutes = minutes;
        const config = window.config;
        if (config) {
            this.sliderBaseJd = config.displayTime.jd;
        }
        this.initSliderRange();
    }
    // スライダー範囲を初期化（基準点を使用）
    static initSliderRange() {
        if (!this.timeSlider)
            return;
        const stepJd = this.currentStepMinutes / 1440.0;
        // ステップに応じた範囲を設定
        let rangeMultiplier;
        if (this.currentStepMinutes <= 1) {
            rangeMultiplier = 60; // ±1時間
        }
        else if (this.currentStepMinutes <= 10) {
            rangeMultiplier = 360; // ±6時間
        }
        else if (this.currentStepMinutes <= 60) {
            rangeMultiplier = 1440; // ±1日
        }
        else if (this.currentStepMinutes <= 1440) {
            rangeMultiplier = 1440 * 30; // ±30日
        }
        else {
            rangeMultiplier = 1440 * 365; // ±1年
        }
        const rangeJd = rangeMultiplier / 1440.0;
        const minJd = this.sliderBaseJd - rangeJd;
        const maxJd = this.sliderBaseJd + rangeJd;
        this.timeSlider.step = String(stepJd);
        this.timeSlider.min = String(minJd);
        this.timeSlider.max = String(maxJd);
        this.timeSlider.value = String(this.sliderBaseJd);
    }
    // 時刻表示を更新
    static updateTimeDisplay() {
        const display = document.getElementById('timeDisplayCompact');
        if (!display)
            return;
        const config = window.config;
        if (!config)
            return;
        const dt = config.displayTime;
        display.textContent = `${dt.month}/${dt.day} ${String(dt.hour).padStart(2, '0')}:${String(dt.minute).padStart(2, '0')}`;
    }
    // 一歩進む
    static stepForward() {
        const config = window.config;
        if (!config)
            return;
        const jdStep = this.currentStepMinutes / 1440.0;
        this.setTimeWithoutSliderReset(config.displayTime.jd + jdStep);
    }
    // 一歩戻る
    static stepBackward() {
        const config = window.config;
        if (!config)
            return;
        const jdStep = this.currentStepMinutes / 1440.0;
        this.setTimeWithoutSliderReset(config.displayTime.jd - jdStep);
    }
    // 日の出（6時）にジャンプ
    static jumpToSunrise() {
        const config = window.config;
        if (!config)
            return;
        const dt = config.displayTime;
        let targetHour = 6;
        let year = dt.year;
        let month = dt.month;
        let day = dt.day;
        // 現在6時以降なら翌日の6時
        if (dt.hour >= 6) {
            const date = new Date(year, month - 1, day + 1);
            year = date.getFullYear();
            month = date.getMonth() + 1;
            day = date.getDate();
        }
        const jd = AstronomicalCalculator.jdTTFromYmdhmsJst(year, month, day, targetHour, 0, 0);
        this.setTime(jd);
    }
    // 日没（18時）にジャンプ
    static jumpToSunset() {
        const config = window.config;
        if (!config)
            return;
        const dt = config.displayTime;
        let targetHour = 18;
        let year = dt.year;
        let month = dt.month;
        let day = dt.day;
        // 現在18時以降なら翌日の18時
        if (dt.hour >= 18) {
            const date = new Date(year, month - 1, day + 1);
            year = date.getFullYear();
            month = date.getMonth() + 1;
            day = date.getDate();
        }
        const jd = AstronomicalCalculator.jdTTFromYmdhmsJst(year, month, day, targetHour, 0, 0);
        this.setTime(jd);
    }
    // 再生の切り替え
    static togglePlay() {
        if (this.isPlaying) {
            this.stopPlay();
        }
        else {
            this.startPlay();
        }
    }
    // 再生開始
    static startPlay() {
        this.isPlaying = true;
        const playBtn = document.getElementById('timePlayBtn');
        if (playBtn) {
            playBtn.textContent = '⏸ 停止';
            playBtn.classList.add('playing');
        }
        // 100msごとに時刻を進める
        this.playIntervalId = window.setInterval(() => {
            this.stepForward();
        }, 100);
    }
    // 再生停止
    static stopPlay() {
        this.isPlaying = false;
        const playBtn = document.getElementById('timePlayBtn');
        if (playBtn) {
            playBtn.textContent = '▶ 再生';
            playBtn.classList.remove('playing');
        }
        if (this.playIntervalId !== null) {
            clearInterval(this.playIntervalId);
            this.playIntervalId = null;
        }
        // 停止時に基準点を更新
        const config = window.config;
        if (config) {
            this.sliderBaseJd = config.displayTime.jd;
            this.initSliderRange();
        }
    }
    // 時刻を設定（スライダー範囲もリセット）
    static setTime(jd) {
        this.setTimeInternal(jd);
        this.sliderBaseJd = jd;
        this.initSliderRange();
    }
    // 時刻を設定（スライダー範囲はリセットしない - 矢印・再生用）
    static setTimeWithoutSliderReset(jd) {
        this.setTimeInternal(jd);
        // スライダーの値だけ更新
        if (this.timeSlider) {
            this.timeSlider.value = String(jd);
        }
    }
    // 内部の時刻設定処理
    static setTimeInternal(jd) {
        const config = window.config;
        if (!config)
            return;
        const targetJd = AstronomicalCalculator.calculateYmdhmsJstFromJdTT(jd);
        const viewState = config.viewState;
        const coordinateConverter = new CoordinateConverter();
        if (config.displaySettings.mode == 'AEP') {
            const centerAzAlt = coordinateConverter.equatorialToHorizontal({ lst: config.siderealTime, lat: config.observationSite.latitude }, { ra: viewState.centerRA, dec: viewState.centerDec });
            viewState.centerAz = centerAzAlt.az;
            viewState.centerAlt = centerAzAlt.alt;
        }
        else if (config.displaySettings.mode == 'view') {
            const centerRaDec = coordinateConverter.horizontalToEquatorial({ lst: config.siderealTime, lat: config.observationSite.latitude }, { az: viewState.centerAz, alt: viewState.centerAlt });
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
                realTime: 'off'
            },
            siderealTime: AstronomicalCalculator.calculateLocalSiderealTime(jd, config.observationSite.longitude || 135)
        };
        const updateConfig = window.updateConfig;
        if (updateConfig) {
            updateConfig(newConfig);
        }
        SolarSystemDataManager.updateAllData(jd, config.observationSite);
        this.updateTimeDisplay();
        const renderAll = window.renderAll;
        if (renderAll) {
            renderAll();
        }
    }
    static handleSliderInput(event) {
        const target = event.target;
        const jd = parseFloat(target.value);
        // スライダー操作中は範囲をリセットしない
        this.setTimeInternal(jd);
    }
    static setToCurrentTime() {
        const config = window.config;
        if (!config)
            return;
        // 再生中なら停止
        if (this.isPlaying) {
            this.stopPlay();
        }
        const jd = AstronomicalCalculator.calculateCurrentJdTT();
        this.setTime(jd);
    }
    static updateSliderValue() {
        if (!this.timeControl)
            return;
        if (!this.timeSlider)
            return;
        const config = window.config;
        if (!config)
            return;
        // リアルタイムモードの場合は非表示
        if (config.displayTime.realTime != 'off') {
            this.timeControl.style.display = 'none';
            this.updateControlPanelVisibility();
            return;
        }
        this.timeControl.style.display = 'block';
        this.sliderBaseJd = config.displayTime.jd;
        this.initSliderRange();
        this.updateTimeDisplay();
        this.updateControlPanelVisibility();
    }
    static updateControlPanelVisibility() {
        const controlPanel = document.getElementById('controlPanel');
        if (!controlPanel)
            return;
        const cameraTiltSliderDiv = document.getElementById('cameraTiltSliderDiv');
        const allHidden = (!this.timeControl || this.timeControl.style.display === 'none') &&
            (!cameraTiltSliderDiv || cameraTiltSliderDiv.style.display === 'none');
        if (allHidden) {
            controlPanel.style.display = 'none';
        }
        else {
            controlPanel.style.display = 'block';
        }
    }
    static updateSlider() {
        this.updateSliderValue();
    }
    static onConfigUpdate() {
        this.updateTimeDisplay();
    }
    static toggleRealTime(mode) {
        const config = window.config;
        if (!config)
            return;
        // 再生中なら停止
        if (this.isPlaying) {
            this.stopPlay();
        }
        if (mode === 'radec') {
            if (this.intervalId !== null) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
            this.intervalId = window.setInterval(this.realtimeRadec, 500);
        }
        else if (mode === 'azalt') {
            if (this.intervalId !== null) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
            this.intervalId = window.setInterval(this.realtimeAzalt, 500);
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
            const newCenterHorizontal = coordinateConverter.equatorialToHorizontal({ lst: config.siderealTime, lat: config.observationSite.latitude }, { ra: config.viewState.centerRA, dec: config.viewState.centerDec });
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
            const newCenterEquatorial = coordinateConverter.horizontalToEquatorial({ lst: config.siderealTime, lat: config.observationSite.latitude }, { az: config.viewState.centerAz, alt: config.viewState.centerAlt });
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
TimeController.timeControl = null;
TimeController.timeSlider = null;
TimeController.intervalId = null;
// 新機能用プロパティ
TimeController.currentStepMinutes = 1;
TimeController.isPlaying = false;
TimeController.playIntervalId = null;
TimeController.isExpanded = false;
// スライダー基準点（スライダー操作中は更新しない）
TimeController.sliderBaseJd = 0;
TimeController.isDragging = false;
// 初期化済みフラグ（イベントリスナーの重複登録を防止）
TimeController.isInitialized = false;
//# sourceMappingURL=TimeController.js.map