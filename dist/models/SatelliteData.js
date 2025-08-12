import { SatelliteCalculator } from '../utils/SatelliteCalculator.js';
export class SatelliteDataManager {
    constructor(observationSite) {
        this.satellites = new Map();
        this.observationSite = observationSite;
        this.calculator = new SatelliteCalculator(observationSite);
    }
    /**
     * TLEデータを追加
     */
    addSatellite(tle) {
        if (!this.calculator.validateTLE(tle)) {
            console.error('Invalid TLE data');
            return false;
        }
        const key = tle.noradId || tle.name || 'unknown';
        this.satellites.set(key, {
            tle,
            position: {
                name: tle.name || 'Unknown Satellite',
                noradId: tle.noradId,
                ra: 0,
                dec: 0,
                az: 0,
                alt: 0,
                range: 0,
                rangeRate: 0,
                magnitude: 0,
                illuminated: false
            },
            lastUpdate: 0
        });
        return true;
    }
    /**
     * 複数のTLEデータを一括追加
     */
    addSatellites(tles) {
        let addedCount = 0;
        for (const tle of tles) {
            if (this.addSatellite(tle)) {
                addedCount++;
            }
        }
        return addedCount;
    }
    /**
     * 人工衛星を削除
     */
    removeSatellite(key) {
        return this.satellites.delete(key);
    }
    /**
     * 全人工衛星の位置を更新
     */
    updateAllPositions(date) {
        for (const [key, satelliteData] of this.satellites) {
            const position = this.calculator.calculateSatellitePosition(satelliteData.tle, date);
            if (position) {
                satelliteData.position = position;
                satelliteData.lastUpdate = date.getTime();
            }
        }
    }
    /**
     * 特定の人工衛星の位置を更新
     */
    updateSatellitePosition(key, date) {
        const satelliteData = this.satellites.get(key);
        if (!satelliteData) {
            return false;
        }
        const position = this.calculator.calculateSatellitePosition(satelliteData.tle, date);
        if (position) {
            satelliteData.position = position;
            satelliteData.lastUpdate = date.getTime();
            return true;
        }
        return false;
    }
    /**
     * 全人工衛星の位置を取得
     */
    getAllPositions() {
        return Array.from(this.satellites.values()).map(data => data.position);
    }
    /**
     * 特定の人工衛星の位置を取得
     */
    getSatellitePosition(key) {
        const satelliteData = this.satellites.get(key);
        return satelliteData ? satelliteData.position : null;
    }
    /**
     * 観測可能な人工衛星（高度 > 0度）を取得
     */
    getVisibleSatellites() {
        return this.getAllPositions().filter(sat => sat.alt > 0);
    }
    /**
     * 人工衛星の一覧を取得
     */
    getSatelliteList() {
        return Array.from(this.satellites.keys());
    }
    /**
     * 観測地点を更新
     */
    updateObservationSite(site) {
        this.observationSite = site;
        this.calculator.updateObservationSite(site);
    }
    /**
     * TLEデータを文字列から解析
     */
    parseTLEFromString(tleString) {
        const lines = tleString.trim().split('\n');
        if (lines.length < 2) {
            return null;
        }
        const line1 = lines[0].trim();
        const line2 = lines[1].trim();
        // 名前がある場合は最初の行から抽出
        let name = '';
        if (lines.length > 2) {
            name = lines[0].trim();
        }
        // NORAD IDをline1から抽出（簡易的な方法）
        const noradId = line1.substring(2, 7).trim();
        return {
            line1,
            line2,
            name: name || undefined,
            noradId: noradId || undefined
        };
    }
    /**
     * 複数のTLEデータを文字列から解析
     */
    parseMultipleTLEFromString(tleString) {
        const tles = [];
        const blocks = tleString.trim().split(/\n\s*\n/);
        for (const block of blocks) {
            const tle = this.parseTLEFromString(block);
            if (tle) {
                tles.push(tle);
            }
        }
        return tles;
    }
    /**
     * 人工衛星データをクリア
     */
    clear() {
        this.satellites.clear();
    }
    /**
     * 人工衛星の数を取得
     */
    getCount() {
        return this.satellites.size;
    }
}
//# sourceMappingURL=SatelliteData.js.map