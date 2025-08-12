import { DataStore } from '../models/DataStore.js';
import { CoordinateConverter } from '../utils/coordinates.js';
import { SolarSystemDataManager } from '../models/SolarSystemObjects.js';
export class SearchController {
    static openSearch() {
        const searchDiv = document.getElementById('search');
        if (searchDiv) {
            searchDiv.style.display = 'block';
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
            }
            // 検索画面でのズーム防止イベントハンドラーを追加
            const preventZoom = (e) => {
                if (e.touches.length > 1) {
                    e.preventDefault();
                }
            };
            searchDiv.addEventListener('touchstart', preventZoom, { passive: false });
            searchDiv.addEventListener('touchmove', preventZoom, { passive: false });
        }
    }
    static closeSearch() {
        const searchDiv = document.getElementById('search');
        if (searchDiv) {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = '';
            }
            const numberOfResults = document.getElementById('numberOfResults');
            if (numberOfResults) {
                numberOfResults.textContent = '';
                numberOfResults.style.display = 'none';
            }
            const suggestionButtonContainer = document.getElementById('suggestionButtonContainer');
            if (suggestionButtonContainer) {
                suggestionButtonContainer.innerHTML = '';
            }
            searchDiv.style.display = 'none';
        }
    }
    static toggleSearch() {
        const searchDiv = document.getElementById('search');
        if (searchDiv) {
            if (searchDiv.style.display === 'block') {
                document.body.classList.remove('search-open');
                SearchController.closeSearch();
            }
            else {
                document.body.classList.add('search-open');
                SearchController.openSearch();
            }
        }
    }
    static performSearch(query) {
        // 検索処理の実装
        // 天体データから検索
        // 結果の表示
        if (query.length === 0) {
            const container = document.getElementById('suggestionButtonContainer');
            if (container) {
                container.innerHTML = '';
            }
            const numberOfResults = document.getElementById('numberOfResults');
            if (numberOfResults) {
                numberOfResults.textContent = '';
            }
            return;
        }
        // 検索結果を表示する処理
        this.displaySearchResults(this.normalizeText(query));
    }
    static displaySearchResults(query) {
        const container = document.getElementById('suggestionButtonContainer');
        if (!container)
            return;
        console.log("displaySearchResults", query);
        // 検索結果をクリア
        container.innerHTML = '';
        const matchPlanetsStart = [];
        const matchPlanetsInclude = [];
        if (SolarSystemDataManager.getAllObjects()) {
            for (const planet of SolarSystemDataManager.getAllObjects()) {
                if (this.normalizeText(planet.jpnName).includes(query)) {
                    matchPlanetsInclude.push({ title: planet.jpnName, position: { ra: planet.raDec.ra, dec: planet.raDec.dec } });
                }
                else if (this.normalizeText(planet.jpnName).startsWith(query)) {
                    matchPlanetsStart.push({ title: planet.jpnName, position: { ra: planet.raDec.ra, dec: planet.raDec.dec } });
                }
                if (this.normalizeText(planet.hiraganaName).startsWith(query)) {
                    matchPlanetsStart.push({ title: planet.jpnName, position: { ra: planet.raDec.ra, dec: planet.raDec.dec } });
                }
                else if (this.normalizeText(planet.hiraganaName).includes(query)) {
                    matchPlanetsInclude.push({ title: planet.jpnName, position: { ra: planet.raDec.ra, dec: planet.raDec.dec } });
                }
                if (this.normalizeText(planet.engName).startsWith(query)) {
                    matchPlanetsStart.push({ title: planet.jpnName, position: { ra: planet.raDec.ra, dec: planet.raDec.dec } });
                }
                else if (this.normalizeText(planet.engName).includes(query)) {
                    matchPlanetsInclude.push({ title: planet.jpnName, position: { ra: planet.raDec.ra, dec: planet.raDec.dec } });
                }
            }
        }
        // queryで始まるものと始まらないが含むものを分ける
        const matchConstellationsStart = [];
        const matchConstellationsInclude = [];
        if (DataStore.constellationData) {
            for (const constellation of DataStore.constellationData) {
                const jpnName = this.kanaToHira(constellation.JPNname);
                const iauName = constellation.IAUname.toLowerCase();
                if (jpnName.startsWith(query) || iauName.startsWith(query)) {
                    matchConstellationsStart.push({ title: `${constellation.JPNname} (${constellation.IAUname})`, position: { ra: constellation.ra, dec: constellation.dec } });
                }
                else if (jpnName.includes(query) || iauName.includes(query)) {
                    matchConstellationsInclude.push({ title: `${constellation.JPNname} (${constellation.IAUname})`, position: { ra: constellation.ra, dec: constellation.dec } });
                }
            }
        }
        const matchMessierStart = [];
        const matchMessierInclude = [];
        if (DataStore.messierData) {
            // start
            // 「数字のみ」「m+数字」のときのみ検索
            if ((query[0] === 'm' && this.isInteger(query.slice(1))) || this.isInteger(query)) {
                const queryNumber = this.isInteger(query) ? query : query.slice(1);
                console.log(queryNumber, DataStore.messierData.length);
                for (const messier of DataStore.messierData) {
                    console.log(messier.getNumberChar(), queryNumber);
                    if (messier.getNumberChar() === queryNumber) {
                        matchMessierStart.push({ title: messier.getName(), position: { ra: messier.getCoordinates().ra, dec: messier.getCoordinates().dec } });
                        break;
                    }
                }
            }
            // include
            for (const messier of DataStore.messierData) {
                if (messier.getAltName().length > 0) {
                    for (const altName of messier.getAltName()) {
                        if (this.normalizeText(altName).includes(query)) {
                            matchMessierInclude.push({ title: `${messier.getName()} (${altName})`, position: { ra: messier.getCoordinates().ra, dec: messier.getCoordinates().dec } });
                        }
                    }
                }
            }
        }
        const matchRecStart = [];
        const matchRecInclude = [];
        if (DataStore.recData) {
            for (const rec of DataStore.recData) {
                if (this.normalizeText(rec.getName()).startsWith(query)) {
                    matchRecStart.push({ title: rec.getName(), position: { ra: rec.getCoordinates().ra, dec: rec.getCoordinates().dec } });
                }
                else if (this.normalizeText(rec.getName()).includes(query)) {
                    matchRecInclude.push({ title: rec.getName(), position: { ra: rec.getCoordinates().ra, dec: rec.getCoordinates().dec } });
                }
                if (rec.getAltName().length > 0) {
                    for (const altName of rec.getAltName()) {
                        if (this.normalizeText(altName).includes(query)) {
                            matchRecInclude.push({ title: `${rec.getName()} (${altName})`, position: { ra: rec.getCoordinates().ra, dec: rec.getCoordinates().dec } });
                        }
                        else if (this.normalizeText(altName).startsWith(query)) {
                            matchRecStart.push({ title: `${rec.getName()} (${altName})`, position: { ra: rec.getCoordinates().ra, dec: rec.getCoordinates().dec } });
                        }
                    }
                }
            }
        }
        const matchNgc = [];
        if (DataStore.ngcData) {
            if (this.isInteger(query) || query.slice(0, 3) === 'ngc' || query.slice(0, 2) === 'ic') {
                const queryNumber = this.isInteger(query) ? query : (query.slice(0, 3) === 'ngc' ? query.slice(3) : query.slice(2));
                for (const ngc of DataStore.ngcData) {
                    if (ngc.getNumberChar() === queryNumber &&
                        !matchRecStart.some(rec => rec.title.includes(`${ngc.getCatalog()}${ngc.getNumber()}`)) &&
                        !matchMessierInclude.some(messier => messier.title.includes(`${ngc.getCatalog()}${ngc.getNumber()}`)) &&
                        !matchRecInclude.some(rec => rec.title.includes(`${ngc.getCatalog()}${ngc.getNumber()}`))) {
                        matchNgc.push({ title: `${ngc.getCatalog()}${ngc.getNumber()}`, position: { ra: ngc.getCoordinates().ra, dec: ngc.getCoordinates().dec } });
                        if (matchNgc.length === 2) {
                            break;
                        }
                    }
                }
            }
        }
        const matchStarNamesStart = [];
        const matchStarNamesInclude = [];
        if (DataStore.starNames) {
            for (const starName of DataStore.starNames) {
                if (this.normalizeText(starName.name).startsWith(query)) {
                    matchStarNamesStart.push({ title: starName.name, position: { ra: starName.ra, dec: starName.dec } });
                }
                else if (this.normalizeText(starName.name).includes(query)) {
                    matchStarNamesInclude.push({ title: starName.name, position: { ra: starName.ra, dec: starName.dec } });
                }
                if (starName.jpnName) {
                    if (this.normalizeText(starName.jpnName).startsWith(query)) {
                        matchStarNamesStart.push({ title: starName.jpnName, position: { ra: starName.ra, dec: starName.dec } });
                    }
                    else if (this.normalizeText(starName.jpnName).includes(query)) {
                        matchStarNamesInclude.push({ title: starName.jpnName, position: { ra: starName.ra, dec: starName.dec } });
                    }
                }
            }
        }
        // クエリにマッチする結果をフィルタリング
        const allResults = [
            ...matchPlanetsStart,
            ...matchConstellationsStart,
            ...matchMessierStart,
            ...matchRecStart,
            ...matchNgc,
            ...matchStarNamesStart,
            ...matchPlanetsInclude,
            ...matchConstellationsInclude,
            ...matchMessierInclude,
            ...matchRecInclude,
            ...matchStarNamesInclude
        ];
        allResults.forEach((result) => {
            const button = document.createElement('button');
            button.className = 'suggestionButton';
            button.textContent = result.title;
            const epoch = (matchPlanetsStart.some(planet => planet.title === result.title) || matchPlanetsInclude.some(planet => planet.title === result.title)) ? 'current' : 'j2000';
            button.addEventListener('click', () => {
                this.selectSearchResult(result.position, epoch);
            });
            button.classList.add('suggestionButton');
            container.appendChild(button);
        });
        if (allResults.length === 0) {
            const noResult = document.createElement('div');
            noResult.textContent = '検索結果が見つかりませんでした';
            noResult.style.padding = '10px';
            noResult.style.color = '#aaa';
            container.appendChild(noResult);
            const numberOfResults = document.getElementById('numberOfResults');
            if (numberOfResults) {
                numberOfResults.style.display = 'none';
            }
        }
        else {
            const numberOfResults = document.getElementById('numberOfResults');
            if (numberOfResults) {
                numberOfResults.style.display = 'block';
                numberOfResults.textContent = `検索結果: ${allResults.length}件`;
            }
        }
    }
    static selectSearchResult(position0, epoch = 'j2000') {
        // 検索結果が選択された時の処理
        const config = window.config;
        if (!config) {
            return;
        }
        const coordinateConverter = new CoordinateConverter();
        let position = position0;
        if (epoch === 'j2000') {
            position = coordinateConverter.precessionEquatorial(position0, undefined, 'j2000', config.displayTime.jd);
        }
        config.viewState.centerRA = position.ra;
        config.viewState.centerDec = position.dec;
        const horizontal = coordinateConverter.equatorialToHorizontal(position, config.siderealTime);
        config.viewState.centerAz = horizontal.az;
        config.viewState.centerAlt = horizontal.alt;
        window.updateConfig({
            viewState: config.viewState
        });
        window.renderAll();
        this.closeSearch();
    }
    //カタカナをひらがなにする関数
    static kanaToHira(name) {
        return name.replace(/[\u30a1-\u30f6]/g, function (match) {
            const chr = match.charCodeAt(0) - 0x60;
            return String.fromCharCode(chr);
        });
    }
    // 全角数字・アルファベットを半角にする関数
    static toHalfWidth(name) {
        return name.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (match) {
            const chr = match.charCodeAt(0) - 0xfee0;
            return String.fromCharCode(chr);
        });
    }
    static normalizeText(name) {
        return this.kanaToHira(this.toHalfWidth(name)).toLowerCase();
    }
    static toHalfWidthLower(name) {
        return this.toHalfWidth(name).toLowerCase();
    }
    static isInteger(name) {
        return /^\d+$/.test(name);
    }
    // private static showObjectInfo(object: any) {
    //     const objectInfo = document.getElementById('objectInfo');
    //     const objectInfoName = document.getElementById('objectInfoName');
    //     const objectInfoText = document.getElementById('objectInfoText');
    //     if (objectInfo && objectInfoName && objectInfoText) {
    //         objectInfoName.textContent = object.name;
    //         objectInfoText.innerHTML = `
    //             <p><strong>種類:</strong> ${object.type}</p>
    //             <p><strong>赤経:</strong> ${object.ra}</p>
    //             <p><strong>赤緯:</strong> ${object.dec}</p>
    //         `;
    //         objectInfo.style.display = 'block';
    //     }
    // }
    static setupSearchInput() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value;
                this.performSearch(query);
            });
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = searchInput.value;
                    if (query.length > 0) {
                        this.performSearch(query);
                    }
                }
            });
        }
    }
}
//# sourceMappingURL=SearchController.js.map