import { EquatorialCoordinates } from "./astrometry";

export interface HipData {
    raArray: Float32Array;  // 赤経, rad
    decArray: Float32Array; // 赤緯, rad
    magArray: Float32Array; // 等級
    bvArray: Float32Array;  // B-V色指数
    count: number;          // 星の数
}

export interface GaiaData {
    raArray: Float32Array;  // 赤経
    decArray: Float32Array; // 赤緯
    magArray: Float32Array; // 等級
    count: number;          // 星の数
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