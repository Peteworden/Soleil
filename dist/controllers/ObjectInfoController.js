import { CoordinateConverter } from "../utils/coordinates.js";
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
        if (objectInfo.name[0] == 'M') {
            infoText = this.generateMessierInfo(objectInfo.data);
            imageUrl = this.getImageUrl(objectInfo.data);
        }
        else if (objectInfo.name[0] == 'NGC' || objectInfo.name[0] == 'IC') {
            infoText = this.generateNGCInfo(objectInfo.data);
            imageUrl = this.getImageUrl(objectInfo.data);
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
    static generateMessierInfo(messier) {
        const config = window.config;
        let infoText = '';
        // 座標情報
        const coords = messier.getCoordinates();
        const raHM = this.coordinateConverter.radeg2hm(coords.ra);
        const decDM = this.coordinateConverter.decdeg2dm(coords.dec);
        infoText += `RA: ${raHM[0]}h ${raHM[1].toFixed(1)}m Dec: ${decDM[0]}° ${decDM[1].toFixed(0)}'<br>`;
        if (config && config.displaySettings.mode !== 'AEP') {
            const horizontal = this.coordinateConverter.equatorialToHorizontal(coords, config.siderealTime);
            infoText += `方位: ${horizontal.az.toFixed(1)}° 高度: ${horizontal.alt.toFixed(1)}°<br>`;
        }
        // 等級
        const magnitude = messier.getMagnitude();
        if (magnitude !== undefined) {
            infoText += `等級: ${magnitude}<br>`;
        }
        // 分類
        const type = messier.getType();
        if (type) {
            infoText += `分類: ${this.getObjectClassDescription(type)}<br>`;
        }
        // 説明
        const description = messier.getDescription();
        if (description) {
            infoText += `<br>${description}<br>`;
        }
        // Wikipediaリンク
        const messierNumber = messier.getName().replace('M', '');
        infoText += `<br><a href="https://ja.wikipedia.org/wiki/M${messierNumber}_(天体)" target="_blank">Wikipedia</a>`;
        return infoText;
    }
    /**
     * おすすめ天体の情報を生成
     */
    static generateRecInfo(rec) {
        const config = window.config;
        let infoText = '';
        // 座標情報
        const coords = rec.getCoordinates();
        const raHM = this.coordinateConverter.radeg2hm(coords.ra);
        const decDM = this.coordinateConverter.decdeg2dm(coords.dec);
        infoText += `RA: ${raHM[0]}h ${raHM[1].toFixed(1)}m Dec: ${decDM[0]}° ${decDM[1].toFixed(0)}'<br>`;
        if (config && config.displaySettings.mode !== 'AEP') {
            const horizontal = this.coordinateConverter.equatorialToHorizontal(coords, config.siderealTime);
            infoText += `方位: ${horizontal.az.toFixed(1)}° 高度: ${horizontal.alt.toFixed(1)}°<br>`;
        }
        // 等級
        const magnitude = rec.getMagnitude();
        if (magnitude !== undefined) {
            infoText += `等級: ${magnitude}<br>`;
        }
        // 分類
        const type = rec.getType();
        if (type) {
            infoText += `分類: ${this.getObjectClassDescription(type)}<br>`;
        }
        // 説明
        const description = rec.getDescription();
        if (description) {
            infoText += `<br>${description}<br>`;
        }
        // Wikipediaリンク
        const name = rec.getName();
        if (name.startsWith('NGC') || name.startsWith('IC')) {
            infoText += `<br><a href="https://ja.wikipedia.org/wiki/${name}" target="_blank">Wikipedia</a>`;
        }
        return infoText;
    }
    /**
     * NGC天体の情報を生成
     */
    static generateNGCInfo(ngc) {
        const config = window.config;
        let infoText = '';
        // 座標情報
        const coords = ngc.getCoordinates();
        const raHM = this.coordinateConverter.radeg2hm(coords.ra);
        const decDM = this.coordinateConverter.decdeg2dm(coords.dec);
        infoText += `RA: ${raHM[0]}h ${raHM[1].toFixed(1)}m Dec: ${decDM[0]}° ${decDM[1].toFixed(0)}'<br>`;
        if (config && config.displaySettings.mode !== 'AEP') {
            const horizontal = this.coordinateConverter.equatorialToHorizontal(coords, config.siderealTime);
            infoText += `方位: ${horizontal.az.toFixed(1)}° 高度: ${horizontal.alt.toFixed(1)}°<br>`;
        }
        // 等級
        const magnitude = ngc.getMagnitude();
        if (magnitude !== undefined) {
            infoText += `等級: ${magnitude}<br>`;
        }
        // 分類
        const type = ngc.getType();
        if (type) {
            infoText += `分類: ${this.getObjectClassDescription(type)}<br>`;
        }
        // Wikipediaリンク
        const name = ngc.getName();
        infoText += `<br><a href="https://ja.wikipedia.org/wiki/${name}" target="_blank">Wikipedia</a>`;
        return infoText;
    }
    /**
     * 惑星の情報を生成
     */
    static generatePlanetInfo(planetName, planetData) {
        const config = window.config;
        let infoText = '';
        // 座標情報
        const raHM = this.coordinateConverter.radeg2hm(planetData.raDec.ra);
        const decDM = this.coordinateConverter.decdeg2dm(planetData.raDec.dec);
        infoText += `RA: ${raHM[0]}h ${raHM[1].toFixed(1)}m Dec: ${decDM[0]}° ${decDM[1].toFixed(0)}' (視位置)<br>`;
        if (config && config.displaySettings.mode !== 'AEP') {
            const horizontal = this.coordinateConverter.equatorialToHorizontal(planetData.raDec, config.siderealTime);
            infoText += `方位: ${horizontal.az.toFixed(1)}° 高度: ${horizontal.alt.toFixed(1)}°<br>`;
        }
        // J2000.0座標
        if (config) {
            // J2000.0座標の計算は現在のAstronomicalCalculatorには実装されていないため省略
            // const [raJ2000, decJ2000] = AstronomicalCalculator.apparentToJ2000(planetData.raDec.ra, planetData.raDec.dec, config.displayTime.jd);
            // const raHMJ2000 = this.coordinateConverter.radeg2hm(raJ2000);
            // const decDMJ2000 = this.coordinateConverter.decdeg2dm(decJ2000);
            // infoText += `RA: ${raHMJ2000[0]}h ${raHMJ2000[1].toFixed(1)}m Dec: ${decDMJ2000[0]}° ${decDMJ2000[1].toFixed(0)}' (J2000.0)<br>`;
        }
        // 距離情報
        if (planetName === '月') {
            infoText += `距離: ${(planetData.distance / 10000).toFixed(1)}万km<br>`;
            infoText += `（光の速さで${(planetData.distance / 299792.458).toFixed(2)}秒）<br>`;
        }
        else {
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
        }
        // 木星の特別情報
        if (planetName === '木星') {
            infoText += '<br>ガリレオ衛星（I:イオ、E:エウロパ、G:ガニメデ、C:カリスト）の位置は概略です。<br>';
            infoText += '<a href="https://www.ncsm.city.nagoya.jp/astro/jupiter/" target="_blank">名古屋市科学館のサイト</a>がより正確でしょう。';
        }
        return infoText;
    }
    /**
     * 恒星の情報を生成
     */
    static generateStarInfo(star) {
        const config = window.config;
        let infoText = '';
        // 座標情報
        const coords = star.getCoordinates();
        const raHM = this.coordinateConverter.radeg2hm(coords.ra);
        const decDM = this.coordinateConverter.decdeg2dm(coords.dec);
        infoText += `RA: ${raHM[0]}h ${raHM[1].toFixed(1)}m Dec: ${decDM[0]}° ${decDM[1].toFixed(0)}'<br>`;
        if (config && config.displaySettings.mode !== 'AEP') {
            const horizontal = this.coordinateConverter.equatorialToHorizontal(coords, config.siderealTime);
            infoText += `方位: ${horizontal.az.toFixed(1)}° 高度: ${horizontal.alt.toFixed(1)}°<br>`;
        }
        // 等級
        const magnitude = star.getMagnitude();
        if (magnitude !== undefined) {
            infoText += `等級: ${magnitude}<br>`;
        }
        // 分類
        const type = star.getType();
        if (type) {
            infoText += `分類: ${this.getObjectClassDescription(type)}<br>`;
        }
        // 説明
        // const description = star.getDescription();
        // if (description) {
        //     infoText += `<br>${description}<br>`;
        // }
        // Wikipediaリンク
        const name = star.getName();
        infoText += `<br><a href="https://ja.wikipedia.org/wiki/${name}" target="_blank">Wikipedia</a>`;
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
        const descriptions = {
            'G': '球状星団',
            'O': '散開星団',
            'N': '星雲',
            'P': '惑星状星雲',
            'Q': 'クエーサー',
            'S': '銀河',
            'D': '重星',
            'X': 'その他'
        };
        return descriptions[type] || type;
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