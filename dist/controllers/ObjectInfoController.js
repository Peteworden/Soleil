import { CoordinateConverter } from "../utils/coordinates.js";
import { MessierObject, SharplessObject } from "../models/CelestialObject.js";
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
            this.generateMessierInfo(objectInfoTextElement, objectInfo.data);
            imageUrl = this.getImageUrl(objectInfo.data);
        }
        else if (objectInfo.type == 'sharpless') {
            this.generateSharplessInfo(objectInfoTextElement, objectInfo.data);
        }
        else if (['planet', 'asteroidComet'].includes(objectInfo.type)) {
            this.generatePlanetInfo(objectInfoTextElement, objectInfo.data);
        }
        else if (objectInfo.type == 'sun') {
            this.generateSunInfo(objectInfoTextElement, objectInfo.data);
        }
        else if (objectInfo.type == 'moon') {
            this.generateMoonInfo(objectInfoTextElement, objectInfo.data);
        }
        else if (objectInfo.type == 'star') {
            this.generateStarInfo(objectInfoTextElement, objectInfo.data);
        }
        else if (objectInfo.type == 'constellation') {
            this.generateConstellationInfo(objectInfoTextElement, objectInfo.data);
        }
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
    static generateMessierInfo(objectInfoTextElement, data) {
        const config = window.config;
        let infoText = '';
        // 座標情報
        const coords = data.getCoordinates();
        const raHM = this.coordinateConverter.radeg2hm(coords.ra);
        const decDM = this.coordinateConverter.decdeg2dm(coords.dec);
        infoText += `RA: ${raHM[0]}h ${raHM[1].toFixed(1)}m Dec: ${decDM[0]}${decDM[1]}° ${decDM[2].toFixed(0)}' (J2000.0)<br>`;
        if (config && config.observationSite.observerPlanet == '地球') {
            const lstLat = { lst: config.siderealTime, lat: config.observationSite.latitude };
            const horizontal = this.coordinateConverter.equatorialToHorizontal(lstLat, coords);
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
        objectInfoTextElement.innerHTML = infoText;
        return;
    }
    /**
     * シャープルス天体の情報を生成
     */
    static generateSharplessInfo(objectInfoTextElement, data) {
        if (!(data instanceof SharplessObject)) {
            return;
        }
        const config = window.config;
        let infoText = '';
        if (data.getAltNames().length > 0) {
            infoText += `別名: ${data.getAltNames().join(', ')}<br>`;
        }
        // 座標情報
        const coords = data.getCoordinates();
        const raHM = this.coordinateConverter.radeg2hm(coords.ra);
        const decDM = this.coordinateConverter.decdeg2dm(coords.dec);
        infoText += `RA: ${raHM[0]}h ${raHM[1].toFixed(1)}m Dec: ${decDM[0]}${decDM[1]}° ${decDM[2].toFixed(0)}' (J2000.0)<br>`;
        if (config && config.observationSite.observerPlanet == '地球') {
            const lstLat = { lst: config.siderealTime, lat: config.observationSite.latitude };
            const horizontal = this.coordinateConverter.equatorialToHorizontal(lstLat, coords);
            infoText += `方位: ${horizontal.az.toFixed(1)}° 高度: ${horizontal.alt.toFixed(1)}°<br>`;
        }
        // 明るさ
        const bright = data.getBright();
        if (bright == 1) {
            infoText += `明るさ: 淡い<br>`;
        }
        else if (bright == 2) {
            infoText += `明るさ: 普通<br>`;
        }
        else if (bright == 3) {
            infoText += `明るさ: 比較的明るい<br>`;
        }
        // 分類
        // const type = data.getType();
        // if (type) {
        //     infoText += `分類: ${this.getObjectClassDescription(type)}<br>`;
        // }
        // 直径
        const diameter = data.getDiameter();
        infoText += `最大視直径: ${diameter} 分角<br>`;
        // form
        const form = data.getForm();
        if (form == 1) {
            infoText += `形状: 円形<br>`;
        }
        else if (form == 2) {
            infoText += `形状: 楕円形<br>`;
        }
        else if (form == 3) {
            infoText += `形状: 不規則<br>`;
        }
        // 説明
        const description = data.getDescription();
        if (description.length > 0) {
            infoText += `<br>${description}<br>`;
        }
        // Wikipediaリンク
        if (data.getLink().length > 0) {
            infoText += `<br><a href="${data.getLink()}" target="_blank">関連リンク（別のタブ）</a>`;
        }
        objectInfoTextElement.innerHTML = infoText;
        return;
    }
    /**
     * 惑星の情報を生成
     */
    static generatePlanetInfo(objectInfoTextElement, planetData) {
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
                const lstLat = { lst: config.siderealTime, lat: config.observationSite.latitude };
                const horizontal = this.coordinateConverter.equatorialToHorizontal(lstLat, planetData.raDec);
                infoText += `方位: ${horizontal.az.toFixed(1)}° 高度: ${horizontal.alt.toFixed(1)}°<br>`;
            }
        }
        // 等級
        const magnitude = planetData.getMagnitude();
        if (magnitude != null && magnitude != 100 && planetData.jpnName != '地球') {
            infoText += `明るさ: ${magnitude.toFixed(1)}等級<br>`;
        }
        // 距離情報
        infoText += `距離: ${planetData.distance.toFixed(2)}au `;
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
        objectInfoTextElement.innerHTML = infoText;
        this.planetTrack(objectInfoTextElement, planetData.jpnName);
        return;
    }
    static generateSunInfo(objectInfoTextElement, data) {
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
                const lstLat = { lst: config.siderealTime, lat: config.observationSite.latitude };
                const horizontal = this.coordinateConverter.equatorialToHorizontal(lstLat, data.raDec);
                infoText += `方位: ${horizontal.az.toFixed(1)}° 高度: ${horizontal.alt.toFixed(1)}°<br>`;
            }
        }
        // 等級
        const magnitude = data.getMagnitude();
        if (magnitude != null && config && config.observationSite.observerPlanet == '地球') {
            infoText += `等級: ${magnitude}<br>`;
        }
        objectInfoTextElement.innerHTML = infoText;
        return;
    }
    static generateMoonInfo(objectInfoTextElement, data) {
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
                const lstLat = { lst: config.siderealTime, lat: config.observationSite.latitude };
                const horizontal = this.coordinateConverter.equatorialToHorizontal(lstLat, data.raDec);
                infoText += `方位: ${horizontal.az.toFixed(1)}° 高度: ${horizontal.alt.toFixed(1)}°<br>`;
            }
        }
        // 距離情報
        infoText += `距離: ${(data.distance / 1000).toFixed(0)},000 km<br>`;
        const lightMinutes = data.distance / 299792.458;
        infoText += `（光の速さで${lightMinutes.toFixed(1)}秒）<br>`;
        objectInfoTextElement.innerHTML = infoText;
        return;
    }
    static planetTrack(objectInfoTextElement, name) {
        // 毎回新しいチェックボックスを作成
        const planetTrackCheck = document.createElement('input');
        planetTrackCheck.type = 'checkbox';
        planetTrackCheck.id = 'planetTrackCheck_' + name;
        const config = window.config;
        planetTrackCheck.checked = config.planetMotion.planet.includes(name);
        planetTrackCheck.addEventListener('change', () => {
            const config = window.config;
            console.log(config.viewState.centerRA, config.viewState.centerDec);
            if (!config.planetMotion.planet.includes(name)) {
                config.planetMotion.planet.push(name);
            }
            else {
                config.planetMotion.planet = config.planetMotion.planet.filter((p) => p !== name);
            }
            // configを更新
            const updateConfig = window.updateConfig;
            if (updateConfig) {
                updateConfig({ planetMotion: config.planetMotion });
            }
            const renderAll = window.renderAll;
            if (renderAll) {
                renderAll();
            }
        });
        // 惑星軌跡設定のUIを作成
        const trackDiv = document.createElement('div');
        // チェックボックス
        const trackLabel = document.createElement('label');
        trackLabel.appendChild(planetTrackCheck);
        trackLabel.appendChild(document.createTextNode('移動を描画'));
        trackDiv.appendChild(trackLabel);
        // 設定項目
        const trackMarkSettingDiv = document.createElement('div');
        trackMarkSettingDiv.innerHTML = `
            印：<input type="text" id="trackInterval" value="1" style="width: 40px;">
            <select id="trackIntervalUnit">
                <option value="日">日</option>
            </select>
            ごとに前後それぞれ
            <input type="text" id="trackDuration" value="30" style="width: 40px;">
            <select id="trackDurationUnit">
                <option value="日">日</option>
            </select>
        `;
        trackDiv.appendChild(trackMarkSettingDiv);
        const trackTimeDisplaySettingDiv = document.createElement('div');
        trackTimeDisplaySettingDiv.innerHTML = `
        日時：印<input type="text" id="trackTimeDisplayInterval" value="1" style="width: 40px;">
        個ごとに
        <select id="trackTimeDisplayContent">
            <option value="ym">年月</option>
            <option value="md" selectec>月日</option>
            <option value="mdh">月日時</option>
            <option value="hm">時分</option>
        </select>
        を表示
    `;
        trackDiv.appendChild(trackTimeDisplaySettingDiv);
        // select要素の変更イベントリスナーを設定
        setTimeout(() => {
            const trackInterval = document.getElementById('trackInterval');
            const trackIntervalUnit = document.getElementById('trackIntervalUnit');
            const trackDuration = document.getElementById('trackDuration');
            const trackDurationUnit = document.getElementById('trackDurationUnit');
            const trackTimeDisplayInterval = document.getElementById('trackTimeDisplayInterval');
            const trackTimeDisplayContent = document.getElementById('trackTimeDisplayContent');
            if (trackInterval && trackIntervalUnit && trackDuration && trackDurationUnit && trackTimeDisplayInterval && trackTimeDisplayContent) {
                // 間隔設定の変更
                const handleIntervalChange = () => {
                    const config = window.config;
                    config.planetMotion.interval = parseFloat(trackInterval.value) || 1;
                    if (config.planetMotion.interval <= 0) {
                        config.planetMotion.interval = 1;
                        trackInterval.value = config.planetMotion.interval.toString();
                    }
                    console.log('間隔設定変更:', config.planetMotion.interval);
                    // configを更新
                    const updateConfig = window.updateConfig;
                    if (updateConfig) {
                        updateConfig({ planetMotion: config.planetMotion });
                    }
                    const renderAll = window.renderAll;
                    if (renderAll) {
                        renderAll();
                    }
                };
                // 期間設定の変更
                const handleDurationChange = () => {
                    const config = window.config;
                    config.planetMotion.duration = parseFloat(trackDuration.value) || 30;
                    if (config.planetMotion.duration <= 0) {
                        config.planetMotion.duration = 30;
                        trackDuration.value = config.planetMotion.duration.toString();
                    }
                    console.log('期間設定変更:', config.planetMotion.duration);
                    // configを更新
                    const updateConfig = window.updateConfig;
                    if (updateConfig) {
                        updateConfig({ planetMotion: config.planetMotion });
                    }
                    const renderAll = window.renderAll;
                    if (renderAll) {
                        renderAll();
                    }
                };
                const handleTimeDisplayIntervalChange = () => {
                    const config = window.config;
                    config.planetMotion.timeDisplayStep = parseInt(trackTimeDisplayInterval.value) || 1;
                    if (config.planetMotion.timeDisplayStep < 1) {
                        config.planetMotion.timeDisplayStep = 1;
                    }
                    config.planetMotion.timeDisplayContent = trackTimeDisplayContent.value;
                    // configを更新
                    const updateConfig = window.updateConfig;
                    if (updateConfig) {
                        updateConfig({ planetMotion: config.planetMotion });
                    }
                    const renderAll = window.renderAll;
                    if (renderAll) {
                        renderAll();
                    }
                };
                const handleTimeDisplayContentChange = () => {
                    const config = window.config;
                    config.planetMotion.timeDisplayContent = trackTimeDisplayContent.value;
                    // configを更新
                    const updateConfig = window.updateConfig;
                    if (updateConfig) {
                        updateConfig({ planetMotion: config.planetMotion });
                    }
                    const renderAll = window.renderAll;
                    if (renderAll) {
                        renderAll();
                    }
                };
                // イベントリスナーを追加
                trackInterval.addEventListener('input', handleIntervalChange);
                trackIntervalUnit.addEventListener('change', handleIntervalChange);
                trackDuration.addEventListener('input', handleDurationChange);
                trackDurationUnit.addEventListener('change', handleDurationChange);
                trackTimeDisplayInterval.addEventListener('input', handleTimeDisplayIntervalChange);
                trackTimeDisplayContent.addEventListener('change', handleTimeDisplayContentChange);
                // 初期値をconfigから設定
                if (config.planetMotion.interval) {
                    trackInterval.value = config.planetMotion.interval.toString();
                }
                if (config.planetMotion.duration) {
                    trackDuration.value = config.planetMotion.duration.toString();
                }
                if (config.planetMotion.timeDisplayStep) {
                    trackTimeDisplayInterval.value = config.planetMotion.timeDisplayStep.toString();
                }
                if (config.planetMotion.timeDisplayContent) {
                    trackTimeDisplayContent.value = config.planetMotion.timeDisplayContent;
                }
            }
        }, 0);
        objectInfoTextElement.appendChild(trackDiv);
        return;
    }
    /**
     * 恒星の情報を生成(今は使っていない)
     */
    static generateStarInfo(objectInfoTextElement, star) {
        const config = window.config;
        let infoText = '';
        // 座標情報
        const coords = star.getCoordinates();
        const raHM = this.coordinateConverter.radeg2hm(coords.ra);
        const decDM = this.coordinateConverter.decdeg2dm(coords.dec);
        infoText += `RA: ${raHM[0]}h ${raHM[1].toFixed(1)}m Dec: ${decDM[0]}° ${decDM[1].toFixed(0)}'<br>`;
        if (config && config.observationSite.observerPlanet == '地球') {
            const lstLat = { lst: config.siderealTime, lat: config.observationSite.latitude };
            const horizontal = this.coordinateConverter.equatorialToHorizontal(lstLat, coords);
            infoText += `方位: ${horizontal.az.toFixed(1)}° 高度: ${horizontal.alt.toFixed(1)}°<br>`;
        }
        // 等級
        const magnitude = star.getMagnitude();
        if (magnitude != null) {
            infoText += `等級: ${magnitude}<br>`;
        }
        objectInfoTextElement.innerHTML = infoText;
        return;
    }
    static generateConstellationInfo(objectInfoTextElement, data) {
        let infoText = '';
        infoText += `日本語名: ${data.JPNname}座<br>`;
        infoText += `英語名: ${data.IAUname}<br>`;
        infoText += `略符: ${data.abbr}<br>`;
        infoText += `赤経: ${data.ra.toFixed(1)}h<br>`;
        infoText += `赤緯: ${data.dec.toFixed(1)}°<br>`;
        objectInfoTextElement.innerHTML = infoText;
        return;
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
ObjectInfoController.CLICK_THRESHOLD = 50; // クリック判定の閾値（ピクセル）
//# sourceMappingURL=ObjectInfoController.js.map