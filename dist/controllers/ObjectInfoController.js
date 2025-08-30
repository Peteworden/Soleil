import { CoordinateConverter } from "../utils/coordinates.js";
import { MessierObject } from "../models/CelestialObject.js";
import { Asteroid, Planet } from "../models/SolarSystemObjects.js";
export class ObjectInfoController {
    /**
     * クリックされた位置から最寄りの天体を見つけて情報を表示
     */
    static showObjectInfo(x, y) {
        const nearestObject = this.findNearestObject(x, y);
        if (nearestObject && nearestObject.distance <= this.CLICK_THRESHOLD) {
            this.displayObjectInfo(nearestObject);
        }
        else {
            console.log('近くに天体が見つかりませんでした');
        }
    }
    /**
     * クリックされた位置から最寄りの天体を見つける
     */
    static findNearestObject(x, y) {
        // CanvasRendererから画面内の天体リストを取得
        const canvasRenderer = window.renderer;
        if (!canvasRenderer) {
            console.warn('CanvasRenderer not found');
            return null;
        }
        const visibleObjects = canvasRenderer.getVisibleObjects();
        let nearestObject = null;
        let nearestDistance = Infinity;
        // 画面内の天体から最寄りのものを探す
        for (const obj of visibleObjects) {
            const distance = Math.sqrt((x - obj.x) ** 2 + (y - obj.y) ** 2);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestObject = {
                    name: obj.name,
                    type: obj.type,
                    x: obj.x,
                    y: obj.y,
                    distance: distance,
                    data: obj.data
                };
            }
        }
        return nearestObject;
    }
    /**
     * 天体情報を表示
     */
    static displayObjectInfo(objectInfo) {
        const objectInfoElement = document.getElementById('objectInfo');
        const objectInfoNameElement = document.getElementById('objectInfoName');
        const objectInfoTextElement = document.getElementById('objectInfoText');
        const objectInfoImageElement = document.getElementById('objectInfoImage');
        if (!objectInfoElement || !objectInfoNameElement || !objectInfoTextElement || !objectInfoImageElement) {
            console.warn('Object info elements not found');
            return;
        }
        // 天体名を表示
        objectInfoNameElement.textContent = objectInfo.name;
        // 画像をクリア
        objectInfoImageElement.innerHTML = '';
        // 天体タイプに応じて情報を生成
        let infoText = '';
        let imageUrl = '';
        if (['messier', 'rec', 'ngc'].includes(objectInfo.type)) {
            infoText = this.generateMessierInfo(objectInfo.data);
            imageUrl = this.getImageUrl(objectInfo.data);
        }
        else if (['planet', 'asteroidComet'].includes(objectInfo.type)) {
            infoText = this.generatePlanetInfo(objectInfo.data);
        }
        else if (objectInfo.type == 'sun') {
            infoText = this.generateSunInfo(objectInfo.data);
        }
        else if (objectInfo.type == 'moon') {
            infoText = this.generateMoonInfo(objectInfo.data);
        }
        else if (objectInfo.type == 'star') {
            infoText = this.generateStarInfo(objectInfo.data);
        }
        else if (objectInfo.type == 'constellation') {
            infoText = this.generateConstellationInfo(objectInfo.data);
        }
        // switch (objectInfo.type) {
        //     case 'messier':
        //         infoText = this.generateMessierInfo(objectInfo.data);
        //         imageUrl = this.getImageUrl(objectInfo.name);
        //         break;
        //     case 'rec':
        //         infoText = this.generateRecInfo(objectInfo.data);
        //         imageUrl = this.getImageUrl(objectInfo.name);
        //         break;
        //     case 'ngc':
        //         infoText = this.generateNGCInfo(objectInfo.data);
        //         imageUrl = this.getImageUrl(objectInfo.name);
        //         break;
        //     case 'planet':
        //         infoText = this.generatePlanetInfo(objectInfo.name, objectInfo.data);
        //         break;
        //     case 'star':
        //         infoText = this.generateStarInfo(objectInfo.data);
        //         break;
        //     default:
        //         infoText = '情報がありません';
        // }
        // 情報テキストを設定
        objectInfoTextElement.innerHTML = infoText;
        // 画像を表示
        if (imageUrl != '') {
            const img = new Image();
            img.onload = () => {
                objectInfoImageElement.appendChild(img);
            };
            img.onerror = () => {
                console.log(`画像が見つかりません: ${imageUrl}`);
            };
            img.src = imageUrl;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.borderRadius = '8px';
            img.style.border = '1px solid #666';
        }
        // 情報ウィンドウを表示
        objectInfoElement.style.display = 'block';
    }
    /**
     * メシエ天体の情報を生成
     */
    static generateMessierInfo(data) {
        const config = window.config;
        let infoText = '';
        // 座標情報
        const coords = data.getCoordinates();
        const raHM = this.coordinateConverter.radeg2hm(coords.ra);
        const decDM = this.coordinateConverter.decdeg2dm(coords.dec);
        infoText += `RA: ${raHM[0]}h ${raHM[1].toFixed(1)}m Dec: ${decDM[0]}${decDM[1]}° ${decDM[2].toFixed(0)}' (J2000.0)<br>`;
        if (config && config.observationSite.observerPlanet == '地球') {
            const horizontal = this.coordinateConverter.equatorialToHorizontal(coords, config.siderealTime);
            infoText += `方位: ${horizontal.az.toFixed(1)}° 高度: ${horizontal.alt.toFixed(1)}°<br>`;
        }
        // 等級
        const magnitude = data.getMagnitude();
        if (magnitude != null && magnitude != 100) {
            infoText += `等級: ${magnitude}<br>`;
        }
        // 分類
        const type = data.getType();
        if (type) {
            infoText += `分類: ${this.getObjectClassDescription(type)}<br>`;
        }
        // 説明
        if (data instanceof MessierObject) {
            const description = data.getDescription();
            if (description) {
                infoText += `<br>${description}<br>`;
            }
            // Wikipediaリンク
            if (data.getWiki()) {
                infoText += `<br><a href="https://ja.wikipedia.org/wiki/${data.getWiki()}" target="_blank">Wikipedia</a>`;
            }
            else if (data.getName().startsWith('M')) {
                const messierNumber = data.getName().replace('M', '');
                infoText += `<br><a href="https://ja.wikipedia.org/wiki/M${messierNumber}_(天体)" target="_blank">Wikipedia</a>`;
            }
        }
        return infoText;
    }
    /**
     * 惑星の情報を生成
     */
    static generatePlanetInfo(planetData) {
        const config = window.config;
        let infoText = '';
        const jpnName = planetData.jpnName;
        const engName = planetData.engName;
        const type = (planetData instanceof Planet) ? '惑星' : (planetData instanceof Asteroid) ? '準惑星・小惑星' : '彗星';
        if (engName != jpnName) {
            infoText += `${jpnName} (${engName})<br>分類: ${type}<br>`;
        }
        else {
            infoText += `${jpnName}<br>分類: ${type}<br>`;
        }
        // 座標情報
        const raHM = this.coordinateConverter.radeg2hm(planetData.raDec.ra);
        const decDM = this.coordinateConverter.decdeg2dm(planetData.raDec.dec);
        infoText += `RA: ${raHM[0]}h ${raHM[1].toFixed(1)}m Dec: ${decDM[0]}${decDM[1]}° ${decDM[2].toFixed(0)}' (視位置)<br>`;
        if (config) {
            const radecJ2000 = this.coordinateConverter.precessionEquatorial(planetData.raDec, undefined, config.displayTime.jd, 'j2000');
            const raHMJ2000 = this.coordinateConverter.radeg2hm(radecJ2000.ra);
            const decDMJ2000 = this.coordinateConverter.decdeg2dm(radecJ2000.dec);
            infoText += `RA: ${raHMJ2000[0]}h ${raHMJ2000[1].toFixed(1)}m Dec: ${decDMJ2000[0]}${decDMJ2000[1]}° ${decDMJ2000[2].toFixed(0)}' (J2000.0)<br>`;
            if (config.observationSite.observerPlanet == '地球') {
                const horizontal = this.coordinateConverter.equatorialToHorizontal(planetData.raDec, config.siderealTime);
                infoText += `方位: ${horizontal.az.toFixed(1)}° 高度: ${horizontal.alt.toFixed(1)}°<br>`;
            }
        }
        // 等級
        const magnitude = planetData.getMagnitude();
        if (magnitude != null && magnitude != 100 && planetData.jpnName != '地球') {
            infoText += `およその等級: ${magnitude.toFixed(1)}<br>`;
        }
        // 距離情報
        infoText += `距離: ${planetData.distance.toFixed(2)}au<br>`;
        const lightMinutes = planetData.distance * 149597870700 / 299792458 / 60;
        if (lightMinutes < 60) {
            infoText += `（光の速さで${lightMinutes.toFixed(1)}分）<br>`;
        }
        else if (lightMinutes < 1440) {
            infoText += `（光の速さで${(lightMinutes / 60).toFixed(1)}時間）<br>`;
        }
        else {
            infoText += `（光の速さで${(lightMinutes / 1440).toFixed(1)}日）<br>`;
        }
        // 木星の特別情報
        if (planetData.jpnName === '木星') {
            // infoText += '<br>ガリレオ衛星（I:イオ、E:エウロパ、G:ガニメデ、C:カリスト）の位置は概略です。<br>';
            // infoText += '<a href="https://www.ncsm.city.nagoya.jp/astro/jupiter/" target="_blank">名古屋市科学館のサイト</a>がより正確でしょう。';
            infoText += '<br>ガリレオ衛星の位置は<a href="https://www.ncsm.city.nagoya.jp/astro/jupiter/" target="_blank">名古屋市科学館のサイト</a>へ（星図へも実装予定）';
        }
        else if (planetData.jpnName === '土星') {
            infoText += '<br>土星の衛星の位置は<a href="https://skyandtelescope.org/wp-content/plugins/observing-tools/saturn_moons/saturn.html" target="_blank">SKY & TELESCOPEのサイト</a>へ';
        }
        if ((!(planetData instanceof Planet) && !['太陽', '月'].includes(planetData.jpnName)) || ['天王星', '海王星'].includes(planetData.jpnName)) {
            infoText += '<br>詳しい位置の確認は<a href="gaiaChart.html" target="_blank">こちらのPythonスクリプト</a>で！<br>';
        }
        return infoText;
    }
    static generateSunInfo(data) {
        const config = window.config;
        let infoText = '';
        // 座標情報
        const raHM = this.coordinateConverter.radeg2hm(data.raDec.ra);
        const decDM = this.coordinateConverter.decdeg2dm(data.raDec.dec);
        infoText += `RA: ${raHM[0]}h ${raHM[1].toFixed(1)}m Dec: ${decDM[0]}${decDM[1]}° ${decDM[2].toFixed(0)}'<br>`;
        if (config) {
            const radecJ2000 = this.coordinateConverter.precessionEquatorial(data.raDec, undefined, config.displayTime.jd, 'j2000');
            const raHMJ2000 = this.coordinateConverter.radeg2hm(radecJ2000.ra);
            const decDMJ2000 = this.coordinateConverter.decdeg2dm(radecJ2000.dec);
            infoText += `RA: ${raHMJ2000[0]}h ${raHMJ2000[1].toFixed(1)}m Dec: ${decDMJ2000[0]}${decDMJ2000[1]}° ${decDMJ2000[2].toFixed(0)}' (J2000.0)<br>`;
            if (config.observationSite.observerPlanet == '地球') {
                const horizontal = this.coordinateConverter.equatorialToHorizontal(data.raDec, config.siderealTime);
                infoText += `方位: ${horizontal.az.toFixed(1)}° 高度: ${horizontal.alt.toFixed(1)}°<br>`;
            }
        }
        // 等級
        const magnitude = data.getMagnitude();
        if (magnitude != null && config && config.observationSite.observerPlanet == '地球') {
            infoText += `等級: ${magnitude}<br>`;
        }
        return infoText;
    }
    static generateMoonInfo(data) {
        const config = window.config;
        let infoText = '';
        // 座標情報
        const raHM = this.coordinateConverter.radeg2hm(data.raDec.ra);
        const decDM = this.coordinateConverter.decdeg2dm(data.raDec.dec);
        infoText += `RA: ${raHM[0]}h ${raHM[1].toFixed(1)}m Dec: ${decDM[0]}${decDM[1]}° ${decDM[2].toFixed(0)}' (視位置)<br>`;
        if (config) {
            const radecJ2000 = this.coordinateConverter.precessionEquatorial(data.raDec, undefined, config.displayTime.jd, 'j2000');
            const raHMJ2000 = this.coordinateConverter.radeg2hm(radecJ2000.ra);
            const decDMJ2000 = this.coordinateConverter.decdeg2dm(radecJ2000.dec);
            infoText += `RA: ${raHMJ2000[0]}h ${raHMJ2000[1].toFixed(1)}m Dec: ${decDMJ2000[0]}${decDMJ2000[1]}° ${decDMJ2000[2].toFixed(0)}' (J2000.0)<br>`;
            console.log(config.observationSite.observerPlanet);
            if (config.observationSite.observerPlanet == '地球') {
                const horizontal = this.coordinateConverter.equatorialToHorizontal(data.raDec, config.siderealTime);
                infoText += `方位: ${horizontal.az.toFixed(1)}° 高度: ${horizontal.alt.toFixed(1)}°<br>`;
            }
        }
        // 距離情報
        infoText += `距離: ${(data.distance / 1000).toFixed(0)},000 km<br>`;
        const lightMinutes = data.distance / 299792.458;
        infoText += `（光の速さで${lightMinutes.toFixed(1)}秒）<br>`;
        return infoText;
    }
    /**
     * 恒星の情報を生成(今は使っていない)
     */
    static generateStarInfo(star) {
        const config = window.config;
        let infoText = '';
        // 座標情報
        const coords = star.getCoordinates();
        const raHM = this.coordinateConverter.radeg2hm(coords.ra);
        const decDM = this.coordinateConverter.decdeg2dm(coords.dec);
        infoText += `RA: ${raHM[0]}h ${raHM[1].toFixed(1)}m Dec: ${decDM[0]}° ${decDM[1].toFixed(0)}'<br>`;
        if (config && config.observationSite.observerPlanet == '地球') {
            const horizontal = this.coordinateConverter.equatorialToHorizontal(coords, config.siderealTime);
            infoText += `方位: ${horizontal.az.toFixed(1)}° 高度: ${horizontal.alt.toFixed(1)}°<br>`;
        }
        // 等級
        const magnitude = star.getMagnitude();
        if (magnitude != null) {
            infoText += `等級: ${magnitude}<br>`;
        }
        return infoText;
    }
    static generateConstellationInfo(data) {
        let infoText = '';
        infoText += `日本語名: ${data.JPNname}座<br>`;
        infoText += `英語名: ${data.IAUname}<br>`;
        infoText += `略符: ${data.abbr}<br>`;
        infoText += `赤経: ${data.ra.toFixed(1)}h<br>`;
        infoText += `赤緯: ${data.dec.toFixed(1)}°<br>`;
        return infoText;
    }
    /**
     * 天体情報ウィンドウを閉じる
     */
    static closeObjectInfo() {
        const objectInfoElement = document.getElementById('objectInfo');
        if (objectInfoElement) {
            objectInfoElement.style.display = 'none';
        }
    }
    /**
     * 天体分類の説明を取得
     */
    static getObjectClassDescription(type) {
        /*
        Gx       Galaxy 銀河
        OC       Open star cluster 散開星団
        Gb       Globular star cluster, usually in the Milky Way Galaxy 球状星団
        Nb       Bright emission or reflection nebula 散光星雲、超新星残骸
        Pl       Planetary nebula 惑星状星雲
        C+N      Cluster associated with nebulosity
        Ast      Asterism or group of a few stars
        Kt       Knot or nebulous region in an external galaxy
        TS       Triple star    (was *** in the CDS table version)
        DS       Double star    (was ** in the CDS version)
        SS       Single star    (was * in the CDS version)
        ?        Uncertain type or may not exist
        U        Unidentified at the place given, or type unknown (was blank in CDS v.)
        -        Object called nonexistent in the RNGC (Sulentic and Tifft 1973)
        PD       Photographic plate defect
        */
        const descriptions = {
            'Gx': '銀河',
            'OC': '散開星団',
            'Gb': '球状星団',
            'Nb': '星雲・超新星残骸',
            'Pl': '惑星状星雲',
            'C+N': '星雲+星団',
            'Ast': '星の集まり',
            'Kt': '星雲',
            'TS': '三重星',
            'DS': '二重星',
            'SS': '単星',
            '?': '不明',
            'U': '不明',
            '-': '不明',
            'PD': '不明',
            'planet': '惑星',
            'asteroid': '小惑星・準惑星',
            'comet': '彗星'
        };
        return descriptions[type] || '--';
    }
    /**
     * 画像URLを取得
     */
    static getImageUrl(object) {
        if (object.image_url) {
            return `chartImage/${object.image_url}`;
        }
        return '';
    }
}
ObjectInfoController.coordinateConverter = new CoordinateConverter();
ObjectInfoController.CLICK_THRESHOLD = 30; // クリック判定の閾値（ピクセル）
//# sourceMappingURL=ObjectInfoController.js.map