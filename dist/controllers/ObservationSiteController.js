import { SettingController } from './SettingController.js';
export class ObservationSiteController {
    /**
     * 観測地選択の初期化
     */
    static initialize() {
        console.log('🗺️ ObservationSiteController initialized');
        this.setupEventListeners();
        // this.loadSavedObservationSite();
    }
    /**
     * イベントリスナーの設定
     */
    static setupEventListeners() {
        const observationSiteSelect = document.getElementById('observation-site-select');
        if (observationSiteSelect) {
            observationSiteSelect.addEventListener('click', (event) => {
                this.handleObservationSiteChange(event);
            });
        }
        // 緯度・経度入力フィールドの変更監視
        const latInput = document.getElementById('lat');
        const lonInput = document.getElementById('lon');
        const nsSelect = document.getElementById('NSCombo');
        const ewSelect = document.getElementById('EWCombo');
        if (latInput && lonInput && nsSelect && ewSelect) {
            [latInput, lonInput, nsSelect, ewSelect].forEach(element => {
                element.addEventListener('input', () => {
                    this.handleManualCoordinateChange();
                });
            });
        }
    }
    /**
     * 観測地選択の変更を処理
     */
    static handleObservationSiteChange(event) {
        const select = event.target;
        const selectedValue = select.value;
        console.log('🗺️ Observation site changed to:', selectedValue);
        if (this.predefinedSites[selectedValue]) {
            // 定義済み観測地の場合
            console.log('🗺️ Observation site changed to:', selectedValue);
            const site = this.predefinedSites[selectedValue];
            this.setObservationSite(site);
        }
        else if (selectedValue === '現在地') {
            // 現在地を取得
            this.getCurrentLocation();
        }
        else if (selectedValue === '地図上で選択') {
            // 地図での選択
            this.showMapSelection();
        }
        else {
            // カスタム入力の場合、選択肢にあったのにデータがない場合
            this.handleManualCoordinateChange();
        }
    }
    /**
     * 手動座標入力の変更を処理
     */
    static handleManualCoordinateChange() {
        const latInput = document.getElementById('lat');
        const lonInput = document.getElementById('lon');
        const nsSelect = document.getElementById('NSCombo');
        const ewSelect = document.getElementById('EWCombo');
        if (latInput && lonInput && nsSelect && ewSelect) {
            const lat = parseFloat(latInput.value) * (nsSelect.value === '北緯' ? 1 : -1);
            const lon = parseFloat(lonInput.value) * (ewSelect.value === '東経' ? 1 : -1);
            if (!isNaN(lat) && !isNaN(lon)) {
                // 選択肢をカスタムに変更
                const observationSiteSelect = document.getElementById('observation-site-select');
                if (observationSiteSelect) {
                    observationSiteSelect.value = 'カスタム';
                }
                this.updateConfig({
                    observerPlanet: '地球',
                    name: 'カスタム',
                    latitude: lat,
                    longitude: lon,
                    timezone: 9
                });
            }
        }
    }
    // リストにある観測地が選ばれたとき、UIとconfigの更新
    static setObservationSite(site) {
        const name = site.name;
        let latDeg = site.latitude;
        let lonDeg = site.longitude;
        const timezone = site.timezone;
        // 緯度の検証と設定
        if (isNaN(latDeg) || latDeg < -90 || latDeg > 90) {
            latDeg = 35; // デフォルト値
        }
        // 経度の検証と設定
        if (isNaN(lonDeg) || lonDeg < -180 || lonDeg > 180) {
            lonDeg = 135; // デフォルト値
        }
        // UI要素の更新
        const latInput = document.getElementById('lat');
        const lonInput = document.getElementById('lon');
        const nsSelect = document.getElementById('NSCombo');
        const ewSelect = document.getElementById('EWCombo');
        if (latInput && lonInput && nsSelect && ewSelect) {
            latInput.value = Math.abs(latDeg).toFixed(2);
            lonInput.value = Math.abs(lonDeg).toFixed(2);
            nsSelect.value = latDeg >= 0 ? '北緯' : '南緯';
            ewSelect.value = lonDeg >= 0 ? '東経' : '西経';
        }
        // 設定の更新
        this.updateConfig(site);
        console.log(`🗺️ Observation site set to: ${latDeg}°, ${lonDeg}°`);
    }
    /**
     * 現在地を取得
     */
    static getCurrentLocation() {
        if (!navigator.geolocation) {
            alert("お使いのブラウザは位置情報に対応していません");
            return;
        }
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            this.setObservationSite({
                observerPlanet: '地球',
                name: '現在地',
                latitude: lat,
                longitude: lon,
                timezone: 9
            });
            console.log(`🗺️ Current location obtained: ${lat}°, ${lon}°`);
        }, () => {
            alert("位置情報を取得できません");
            console.error('🗺️ Failed to get current location');
        });
    }
    /**
     * 地図での選択を表示
     */
    static showMapSelection() {
        // オンライン状態の確認
        if (!navigator.onLine) {
            alert('オフラインでは地図での選択ができません');
            return;
        }
        // 地図コンテナの表示
        const mapDiv = document.getElementById('observation-site-map-div');
        if (mapDiv) {
            mapDiv.style.visibility = 'visible';
        }
        // 既存の地図を削除
        if (this.map) {
            this.map.remove();
        }
        // 新しい地図を作成
        this.initializeMap();
    }
    /**
     * 地図の初期化
     */
    static initializeMap() {
        // Leafletライブラリが必要
        if (typeof window.L === 'undefined') {
            console.error('🗺️ Leaflet library not loaded');
            alert('地図ライブラリが読み込まれていません');
            return;
        }
        const currentLat = window.lat_obs * 180 / Math.PI || 35;
        const currentLon = window.lon_obs * 180 / Math.PI || 135;
        this.map = window.L.map('observation-site-map').setView([currentLat, currentLon], 10);
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
        this.currentMarker = window.L.marker([currentLat, currentLon]).addTo(this.map);
        // 地図クリックイベント
        this.map.on('click', (e) => {
            this.latMap = e.latlng.lat;
            this.lonMap = e.latlng.lng;
            if (this.currentMarker) {
                this.map.removeLayer(this.currentMarker);
            }
            this.currentMarker = window.L.marker([this.latMap, this.lonMap]).addTo(this.map);
            // 選択肢をカスタムに変更
            const observationSiteSelect = document.getElementById('observation-site-select');
            if (observationSiteSelect) {
                observationSiteSelect.value = 'カスタム';
            }
        });
    }
    /**
     * 地図を閉じる
     */
    static closeMap() {
        const mapDiv = document.getElementById('observation-site-map-div');
        if (mapDiv) {
            mapDiv.style.visibility = 'hidden';
        }
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }
    /**
     * 設定を更新
     */
    static updateConfig(site) {
        const updateConfig = window.updateConfig;
        if (updateConfig) {
            updateConfig({
                observationSite: site
            });
        }
        SettingController.saveConfigToLocalStorage();
    }
    /**
     * ローカルストレージに観測地を保存
     */
    // private static saveObservationSiteToLocalStorage(name: string, lat: number, lon: number): void {
    //     // 座標も保存
    //     const latInput = document.getElementById('lat') as HTMLInputElement;
    //     const lonInput = document.getElementById('lon') as HTMLInputElement;
    //     const nsSelect = document.getElementById('NSCombo') as HTMLSelectElement;
    //     const ewSelect = document.getElementById('EWCombo') as HTMLSelectElement;
    //     if (latInput && lonInput && nsSelect && ewSelect) {
    //         // const lat = parseFloat(latInput.value) * (nsSelect.value === '北緯' ? 1 : -1);
    //         // const lon = parseFloat(lonInput.value) * (ewSelect.value === '東経' ? 1 : -1);
    //         this.updateConfig(name, lat, lon);
    //     }
    // }
    /**
     * 保存された観測地を読み込み
     */
    static loadSavedObservationSite() {
        const savedSite = localStorage.getItem('observationSite');
        if (savedSite && this.predefinedSites[savedSite]) {
            console.log('🗺️ savedSite', savedSite);
            // 定義済み観測地の場合
            const site = this.predefinedSites[savedSite];
            this.setObservationSite(site);
            const observationSiteSelect = document.getElementById('observation-site-select');
            if (observationSiteSelect) {
                observationSiteSelect.value = savedSite;
            }
        }
        else if (savedSite === '現在地') {
            // 現在地の場合
            this.getCurrentLocation();
            const observationSiteSelect = document.getElementById('observation-site-select');
            if (observationSiteSelect) {
                observationSiteSelect.value = '現在地';
            }
        }
        else {
            // カスタムまたは保存された座標の場合
            const savedLat = localStorage.getItem('lat');
            const savedLon = localStorage.getItem('lon');
            if (savedLat && savedLon) {
                const lat = parseFloat(savedLat);
                const lon = parseFloat(savedLon);
                if (!isNaN(lat) && !isNaN(lon)) {
                    this.setObservationSite({
                        observerPlanet: '地球',
                        name: 'カスタム',
                        latitude: lat,
                        longitude: lon,
                        timezone: 9
                    });
                }
            }
        }
    }
    /**
     * URLパラメータから観測地を設定
     */
    static setObservationSiteFromURL(lat, lon) {
        this.setObservationSite({
            observerPlanet: '地球',
            name: 'カスタム',
            latitude: lat,
            longitude: lon,
            timezone: 9
        });
        // 定義済み観測地と一致するかチェック
        for (const [siteName, site] of Object.entries(this.predefinedSites)) {
            if (Math.abs(site.latitude - lat) < 0.01 && Math.abs(site.longitude - lon) < 0.01) {
                const observationSiteSelect = document.getElementById('observation-site-select');
                if (observationSiteSelect) {
                    observationSiteSelect.value = siteName;
                }
                return;
            }
        }
        // 一致しない場合はカスタム
        const observationSiteSelect = document.getElementById('observation-site-select');
        if (observationSiteSelect) {
            observationSiteSelect.value = 'カスタム';
        }
    }
    /**
     * 定義済み観測地のリストを取得
     */
    static getPredefinedSites() {
        return { ...this.predefinedSites };
    }
    /**
     * 新しい観測地を追加
     */
    static addPredefinedSite(name, lat, lon, timezone) {
        this.predefinedSites[name] = {
            observerPlanet: '地球',
            name: name,
            latitude: lat,
            longitude: lon,
            timezone: timezone
        };
        console.log(`🗺️ Added new predefined site: ${name} (${lat}°, ${lon}°)`);
    }
    /**
     * 観測地を削除
     */
    static removePredefinedSite(name) {
        if (this.predefinedSites[name]) {
            delete this.predefinedSites[name];
            console.log(`🗺️ Removed predefined site: ${name}`);
            return true;
        }
        return false;
    }
}
// 定義済み観測地のデータ
ObservationSiteController.predefinedSites = {
    "京大西部構内": {
        observerPlanet: '地球',
        name: '京大西部構内',
        latitude: 35.03,
        longitude: 135.78,
        timezone: 9
    },
    "鵜倉園地": {
        observerPlanet: '地球',
        name: '鵜倉園地',
        latitude: 34.27,
        longitude: 136.55,
        timezone: 9
    },
    "乗鞍高原": {
        observerPlanet: '地球',
        name: '乗鞍高原',
        latitude: 36.11,
        longitude: 137.63,
        timezone: 9
    },
    "仙台": {
        observerPlanet: '地球',
        name: '仙台',
        latitude: 38.27,
        longitude: 140.87,
        timezone: 9
    },
    "東京": {
        observerPlanet: '地球',
        name: '東京',
        latitude: 35.68,
        longitude: 139.76,
        timezone: 9
    },
    "大阪": {
        observerPlanet: '地球',
        name: '大阪',
        latitude: 34.70,
        longitude: 135.50,
        timezone: 9
    },
    "石垣島": {
        observerPlanet: '地球',
        name: '石垣島',
        latitude: 24.41,
        longitude: 124.18,
        timezone: 9
    }
};
// 地図関連の変数
ObservationSiteController.map = null;
ObservationSiteController.currentMarker = null;
ObservationSiteController.latMap = 0;
ObservationSiteController.lonMap = 0;
//# sourceMappingURL=ObservationSiteController.js.map