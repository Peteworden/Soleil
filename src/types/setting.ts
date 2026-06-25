import { CanvasSize, CartesianCoords, EquatorialCoordinates, Fov, HorizontalCoordinates } from "./astrometry";

export interface DisplaySettings {
    darkMode: boolean;
    mode: string;
    showGrid: boolean;
    showReticle: boolean;
    showObjectInfo: boolean;
    showStarInfo: boolean;
    usedStar: string;
    showStarNames: string;
    showBayerFS: boolean;
    showPlanets: boolean;
    showConstellationNames: boolean;
    showConstellationLines: boolean;
    showMessiers: boolean;
    showRecs: boolean;
    showNGC: boolean;
    showSharpless: boolean;
    showCameraView: boolean;
    camera: string;
    showTopography: boolean;
    equinox: string;
    // showSatellites: boolean;
    // showSatelliteLabels: boolean;
    // showSatelliteOrbits: boolean;
}

export interface ViewState {
    centerRadec: EquatorialCoordinates;
    centerAzalt: HorizontalCoordinates;
    fov: Fov;
    starSizeKey1: number;
    starSizeKey2: number;
}

export interface ObservationSite {
    observerPlanet: string;
    name: string;
    latitude: number;      // 緯度（度）
    longitude: number;     // 経度（度）
    timezone: number;      // タイムゾーン（UTCからの時差)
    heliocentric?: CartesianCoords; // 日心直交座標
}

export interface DisplayTime {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    jd: number;
    realTime: string;
    loadOnCurrentTime: boolean;
}

export interface PlanetMotion {
    planet: string[];
    duration: number;
    interval: number;
    timeDisplayStep: number;
    timeDisplayContent: string;
}

export interface NewsPopup {
    lastShownTime: string;
    dontShow: boolean;
}

export interface StarChartConfig {
    displaySettings: DisplaySettings;
    viewState: ViewState;
    observationSite: ObservationSite;
    displayTime: DisplayTime;
    planetMotion: PlanetMotion;
    canvasSize: CanvasSize;
    newsPopup: NewsPopup;
    siderealTime: number;
}

// 色設定の型定義
export interface ColorPalette {
    // 基本色
    background: string;
    text: string;
    textSecondary: string;
    yellow: string;
    orange: string;

    // グリッド・レティクル
    grid: string;
    gridEquatorialLine: string;
    reticle: string;

    // 恒星
    star: string;
    starName: string;

    // 星座
    constellationLine: string;
    constellationName: string;

    // 天体
    solarSystem: string;
    moonShade: string;
    solarSystemMotion: string;
    dso: string;

    // その他
    poleMark: string;
    cameraView: string;
    tempTarget: string;
    satellite: string;
    satelliteIlluminated: string;
    satelliteShadow: string;

    // UI要素
    border: string;
    button: string;
    buttonHover: string;
    error: string;
    warning: string;
    success: string;
    info: string;
}

export interface ColorTheme {
    light: ColorPalette;
    dark: ColorPalette;
}