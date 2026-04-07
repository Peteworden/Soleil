import { Cartesian } from "../core/coordinates/index.js";

export interface EquatorialCoordinates {
    ra: number;  // 赤経（度）
    dec: number; // 赤緯（度）
}

export interface HorizontalCoordinates {
    az: number;  // 方位角（度）
    alt: number; // 高度（度）
}

export interface CartesianCoordinates {
    x: number;
    y: number;
    z: number;
}

export interface LstLat {
    lst: number;
    lat: number;
}

export interface StarName {
    name: string;
    ra: number;
    dec: number;
    tier: number;
    jpnName?: string;
}

export interface BayerFlamData {
    coordinates: EquatorialCoordinates;
    constellation: string;
    flam?: number;
    bayer?: string;
}

export interface ConstellationData {
    JPNname: string;
    IAUname: string;
    abbr: string;
    ra: number;
    dec: number;
    lines: number[][];
}

export interface ConstellationBoundaryData {
    num: number;
    ra1: number;
    dec1: number;
    ra2: number;
    dec2: number;
}

// 人工衛星関連の型定義
export interface TLEData {
    line1: string;
    line2: string;
    name?: string;
    noradId?: string;
}

export interface SatellitePosition {
    name: string;
    noradId?: string;
    ra: number;      // 赤経（度）
    dec: number;     // 赤緯（度）
    az: number;      // 方位角（度）
    alt: number;     // 高度（度）
    range: number;   // 距離（km）
    rangeRate: number; // 距離変化率（km/s）
    magnitude?: number; // 等級
    illuminated: boolean; // 太陽光に照らされているか
}

export interface SatelliteData {
    tle: TLEData;
    position: SatellitePosition;
    lastUpdate: number;
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
    centerRA: number;
    centerDec: number;
    centerAz: number;
    centerAlt: number;
    fieldOfViewRA: number;
    fieldOfViewDec: number;
    starSizeKey1: number;
    starSizeKey2: number;
}

export interface ObservationSite {
    observerPlanet: string;
    name: string;
    latitude: number;      // 緯度（度）
    longitude: number;     // 経度（度）
    timezone: number;      // タイムゾーン（UTCからの時差)
    heliocentric?: Cartesian; // 日心直交座標
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

export interface CanvasSize {
    width: number;
    height: number;
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

export interface ObjectInformation {
    name: string;
    type: string;
    x: number;
    y: number;
    data: any;
}

export interface StarInformation {
    type: string;
    x: number;
    y: number;
    data: any;
}

// 座標系の型ガード関数
export function isEquatorialCoordinates(obj: any): obj is EquatorialCoordinates {
    return obj && typeof obj.ra === 'number' && typeof obj.dec === 'number';
}

export function isHorizontalCoordinates(obj: any): obj is HorizontalCoordinates {
    return obj && typeof obj.az === 'number' && typeof obj.alt === 'number';
}

export function isCartesianCoordinates(obj: any): obj is CartesianCoordinates {
    return obj && typeof obj.x === 'number' && typeof obj.y === 'number' && typeof obj.z === 'number';
}

// 座標系のユーティリティ型
export type CoordinateSystem = 'equatorial' | 'horizontal';

// 座標系の変換結果型
export interface CoordinateConversionResult<T> {
    coordinates: T;
    system: CoordinateSystem;
    timestamp?: number;
}

// 座標系の判定関数
export function getCoordinateSystem(coords: EquatorialCoordinates | HorizontalCoordinates): CoordinateSystem {
    if (isEquatorialCoordinates(coords)) {
        return 'equatorial';
    } else if (isHorizontalCoordinates(coords)) {
        return 'horizontal';
    } else {
        throw new Error('Unknown coordinate system');
    }
}