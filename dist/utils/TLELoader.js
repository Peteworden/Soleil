export class TLELoader {
    /**
     * CelestrakからTLEデータを取得
     */
    static async loadFromCelestrak(category) {
        try {
            const url = `${this.CELESTRAK_URL}${category}.txt`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch TLE data: ${response.status}`);
            }
            const text = await response.text();
            return this.parseTLEFromText(text);
        }
        catch (error) {
            console.error('Error loading TLE from Celestrak:', error);
            return [];
        }
    }
    /**
     * 利用可能なTLEカテゴリを取得
     */
    static getAvailableCategories() {
        return [
            { name: 'stations', url: 'stations.txt', description: 'ISS and other space stations' },
            { name: 'visual', url: 'visual.txt', description: 'Bright satellites visible to naked eye' },
            { name: 'weather', url: 'weather.txt', description: 'Weather satellites' },
            { name: 'noaa', url: 'noaa.txt', description: 'NOAA satellites' },
            { name: 'goes', url: 'goes.txt', description: 'GOES satellites' },
            { name: 'resource', url: 'resource.txt', description: 'Resource satellites' },
            { name: 'sarsat', url: 'sarsat.txt', description: 'SARSAT satellites' },
            { name: 'dmc', url: 'dmc.txt', description: 'DMC satellites' },
            { name: 'tdrss', url: 'tdrss.txt', description: 'TDRSS satellites' },
            { name: 'argos', url: 'argos.txt', description: 'ARGOS satellites' },
            { name: 'planet', url: 'planet.txt', description: 'Planet satellites' },
            { name: 'spire', url: 'spire.txt', description: 'Spire satellites' },
            { name: 'geo', url: 'geo.txt', description: 'Geosynchronous satellites' },
            { name: 'intelsat', url: 'intelsat.txt', description: 'Intelsat satellites' },
            { name: 'ses', url: 'ses.txt', description: 'SES satellites' },
            { name: 'iridium', url: 'iridium.txt', description: 'Iridium satellites' },
            { name: 'iridium-33-debris', url: 'iridium-33-debris.txt', description: 'Iridium 33 debris' },
            { name: 'cosmos-2251-debris', url: 'cosmos-2251-debris.txt', description: 'Cosmos 2251 debris' },
            { name: 'engineering', url: 'engineering.txt', description: 'Engineering satellites' },
            { name: 'education', url: 'education.txt', description: 'Education satellites' },
            { name: 'amateur', url: 'amateur.txt', description: 'Amateur radio satellites' },
            { name: 'x-comm', url: 'x-comm.txt', description: 'X-COMM satellites' },
            { name: 'other-comm', url: 'other-comm.txt', description: 'Other communication satellites' },
            { name: 'gorizont', url: 'gorizont.txt', description: 'Gorizont satellites' },
            { name: 'raduga', url: 'raduga.txt', description: 'Raduga satellites' },
            { name: 'molniya', url: 'molniya.txt', description: 'Molniya satellites' },
            { name: 'gnss', url: 'gnss.txt', description: 'GNSS satellites' },
            { name: 'gps-ops', url: 'gps-ops.txt', description: 'GPS operational satellites' },
            { name: 'glo-ops', url: 'glo-ops.txt', description: 'GLONASS operational satellites' },
            { name: 'galileo', url: 'galileo.txt', description: 'Galileo satellites' },
            { name: 'beidou', url: 'beidou.txt', description: 'BeiDou satellites' },
            { name: 'sbas', url: 'sbas.txt', description: 'SBAS satellites' },
            { name: 'nnss', url: 'nnss.txt', description: 'NNSS satellites' },
            { name: 'musson', url: 'musson.txt', description: 'Musson satellites' },
            { name: 'science', url: 'science.txt', description: 'Science satellites' },
            { name: 'geodetic', url: 'geodetic.txt', description: 'Geodetic satellites' },
            { name: 'engineering', url: 'engineering.txt', description: 'Engineering satellites' },
            { name: 'military', url: 'military.txt', description: 'Military satellites' },
            { name: 'radar', url: 'radar.txt', description: 'Radar satellites' },
            { name: 'cubesat', url: 'cubesat.txt', description: 'CubeSats' },
            { name: 'other', url: 'other.txt', description: 'Other satellites' }
        ];
    }
    /**
     * テキストからTLEデータを解析
     */
    static parseTLEFromText(text) {
        const tles = [];
        const lines = text.trim().split('\n');
        for (let i = 0; i < lines.length; i += 3) {
            if (i + 2 >= lines.length)
                break;
            const name = lines[i].trim();
            const line1 = lines[i + 1].trim();
            const line2 = lines[i + 2].trim();
            // TLEの妥当性をチェック
            if (this.isValidTLE(line1, line2)) {
                const noradId = this.extractNORADId(line1);
                tles.push({
                    name: name || undefined,
                    line1,
                    line2,
                    noradId
                });
            }
        }
        return tles;
    }
    /**
     * TLEの妥当性をチェック
     */
    static isValidTLE(line1, line2) {
        // 基本的なTLE形式チェック
        if (line1.length < 69 || line2.length < 69)
            return false;
        // 行1のチェック
        if (line1.charAt(0) !== '1')
            return false;
        // 行2のチェック
        if (line2.charAt(0) !== '2')
            return false;
        return true;
    }
    /**
     * NORAD IDを抽出
     */
    static extractNORADId(line1) {
        if (line1.length >= 7) {
            const noradId = line1.substring(2, 7).trim();
            return noradId || undefined;
        }
        return undefined;
    }
    /**
     * 特定のNORAD IDのTLEを取得
     */
    static async loadSpecificSatellite(noradId) {
        try {
            // 複数のカテゴリから検索
            const categories = ['visual', 'stations', 'weather', 'geo'];
            for (const category of categories) {
                const tles = await this.loadFromCelestrak(category);
                const satellite = tles.find(tle => tle.noradId === noradId);
                if (satellite) {
                    return satellite;
                }
            }
            return null;
        }
        catch (error) {
            console.error('Error loading specific satellite:', error);
            return null;
        }
    }
    /**
     * 複数のNORAD IDのTLEを取得
     */
    static async loadMultipleSatellites(noradIds) {
        const tles = [];
        for (const noradId of noradIds) {
            const tle = await this.loadSpecificSatellite(noradId);
            if (tle) {
                tles.push(tle);
            }
        }
        return tles;
    }
    /**
     * ローカルファイルからTLEを読み込み
     */
    static async loadFromFile(file) {
        try {
            const text = await file.text();
            return this.parseTLEFromText(text);
        }
        catch (error) {
            console.error('Error loading TLE from file:', error);
            return [];
        }
    }
    /**
     * TLEデータをファイルに保存
     */
    static saveToFile(tles, filename) {
        const content = tles.map(tle => `${tle.name || 'Unknown'}\n${tle.line1}\n${tle.line2}`).join('\n\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
TLELoader.CELESTRAK_URL = 'https://www.celestrak.com/NORAD/elements/';
TLELoader.SPACETRACK_URL = 'https://www.space-track.org/';
//# sourceMappingURL=TLELoader.js.map