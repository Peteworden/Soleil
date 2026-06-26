import { CartesianCoords, EquatorialCoordinates } from 'types/index.js';

type SolarObjectType = 'sun' | 'planet' | 'moon' | 'asteroid' | 'comet';

interface OrbitalElementsCore {
    t0: number;        // 元期（ユリウス日）
    e: number;         // 離心率
    incl: number;      // 軌道傾斜角（度）
    node: number;      // 昇交点黄経（度）
}

export interface PlanetOrbitalElements extends OrbitalElementsCore {
    a: number;         // 軌道長半径（AU）
    meanLong: number;  // 平均黄経（度）
    longPeri: number;  // 近日点黄経（度）
    da: number;        // 軌道長半径の変化率
    de: number;        // 離心率の変化率
    dIncl: number;     // 軌道傾斜角の変化率
    dMeanLong: number; // 平均黄経の変化率
    dLongPeri: number; // 近日点黄経の変化率
    dNode: number;     // 昇交点黄経の変化率
    // 木星・土星・天王星・海王星用の追加項
    sup1?: number;
    sup2?: number;
    sup3?: number;
    sup4?: number;
}

export interface EllipticOrbitalElements extends OrbitalElementsCore {
    a: number;         // 軌道長半径（AU）
    peri: number;      // 近日点引数（度）
    m0: number;        // 元期の平均近点角（度）
    H?: number;        // 絶対等級
    G?: number;        // 位相係数
}

export interface ParabolicOrHyperbolicOrbitalElements extends OrbitalElementsCore {
    q: number;         // 近日点距離（AU）
    peri: number;      // 近日点引数（度）
    H?: number;        // 絶対等級
    G?: number;        // 位相係数
}

// 共通プロパティ
export class SolarSystemObjectBase {
    jpnName: string;
    hiraganaName: string;
    engName: string;
    type: SolarObjectType;
    xyz: CartesianCoords; // 日心赤道直交座標、J2000
    raDec: EquatorialCoordinates; // 観測地から見た視位置
    distance: number; // 観測地からの距離（au)
    magnitude: number | undefined;
    constructor(data: any) {
        this.jpnName = data.jpnName;
        this.hiraganaName = data.hiraganaName;
        this.engName = data.engName;
        this.type = data.type;
        this.xyz = data.xyz;
        this.raDec = data.raDec;
        this.distance = data.distance;
        this.magnitude = data.magnitude;
    }

    getJapaneseName(): string {
        return this.jpnName;
    }

    getHiraganaName(): string {
        return this.hiraganaName;
    }

    getEnglishName(): string {
        return this.engName;
    }

    getType(): string {
        return this.type;
    }

    getXYZ(): CartesianCoords {
        return this.xyz;
    }

    getRaDec(): EquatorialCoordinates {
        return this.raDec;
    }

    getDistance(): number {
        return this.distance;
    }

    getMagnitude(): number | undefined {
        return this.magnitude ?? undefined;
    }
}

export class Sun extends SolarSystemObjectBase {
    constructor(data: any) {
        super(data);
        this.type = 'sun';
        this.magnitude = -26.74;
    }
}

export class Moon extends SolarSystemObjectBase {
    Ms: number = 0;
    ws: number = 0;
    lon_moon: number = 0;
    lat_moon: number = 0;
    constructor(data: any) {
        super(data);
        this.type = 'moon';
        this.magnitude = -12.74;
        this.Ms = data.Ms || 0;
        this.ws = data.ws || 0;
        this.lon_moon = data.lon_moon || 0;
        this.lat_moon = data.lat_moon || 0;
    }
}

export class Planet extends SolarSystemObjectBase {
    orbit: PlanetOrbitalElements;
    constructor(data: any) {
        super(data);
        this.type = 'planet';
        this.orbit = data.orbit;
    }
    updatePosition(jd: number): void {
        // 空実装
    }
}

export class Asteroid extends SolarSystemObjectBase {
    orbit: EllipticOrbitalElements;
    constructor(data: any) {
        super(data);
        this.type = 'asteroid';
        this.orbit = data.orbit;
    }
}

export class Comet extends SolarSystemObjectBase {
    orbit: EllipticOrbitalElements | ParabolicOrHyperbolicOrbitalElements;
    constructor(data: any) {
        super(data);
        this.type = 'comet';
        this.orbit = data.orbit;
    }
}

export type SolarSystemObject = Sun | Moon | Planet | Asteroid | Comet;
export type MinorObject = Asteroid | Comet;
export type OrbitalObject = Planet | Asteroid | Comet;

// 型ガード
export function isPlanet(obj: SolarSystemObjectBase): obj is Planet {
    return obj.type === 'planet';
}
export function isEarth(obj: SolarSystemObjectBase): obj is Planet {
    return obj.type === 'planet' && obj.jpnName === '地球';
}
export function isAsteroid(obj: SolarSystemObjectBase): obj is Asteroid {
    return obj.type === 'asteroid';
}
export function isComet(obj: SolarSystemObjectBase): obj is Comet {
    return obj.type === 'comet';
}
export function isMinorObject(obj: SolarSystemObjectBase): obj is MinorObject {
    return obj.type === 'asteroid' || obj.type === 'comet';
}
export function isSun(obj: SolarSystemObjectBase): obj is Sun {
    return obj.type === 'sun';
}
export function isMoon(obj: SolarSystemObjectBase): obj is Moon {
    return obj.type === 'moon';
}
export function isOrbitalObject(obj: SolarSystemObjectBase): obj is OrbitalObject {
    return obj.type === 'asteroid' || obj.type === 'comet' || obj.type === 'planet';
}