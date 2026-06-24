export interface EquatorialCoordinates {
    ra: number;  // 赤経（度）
    dec: number; // 赤緯（度）
}

export interface HorizontalCoordinates {
    az: number;  // 方位角（度）
    alt: number; // 高度（度）
}

export interface CartesianCoords {
    x: number;
    y: number;
    z: number;
}

export interface CanvasRadecCoords {
    ra: number,
    dec: number
}

export interface Fov {
    ra: number,
    dec: number
}

export interface CanvasXy {
    x: number,
    y: number
}

export interface CanvasSize {
    width: number;
    height: number;
}

export interface LstLat {
    lst: number; // local sidereal time
    lat: number; // latitude
}

export interface DeviceOrientationData {
    alpha: number,
    beta: number,
    gamma: number,
    webkitCompassHeading: number
}

export type TransformModeConfig =
    | { mode: 'AEP'; center: EquatorialCoordinates; location: LstLat }
    | { mode: 'view'; center: HorizontalCoordinates; location: LstLat }
    | { mode: 'live' | 'ar'; center?: never; location: LstLat; orientationData: DeviceOrientationData };