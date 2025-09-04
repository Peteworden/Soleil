import { DataStore } from '../models/DataStore.js';
import { SolarSystemDataManager } from '../models/SolarSystemObjects.js';
import { CoordinateConverter } from '../utils/coordinates.js';
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
            document.body.classList.remove('search-open');
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
        // 検索結果をクリア
        container.innerHTML = '';
        const matchPlanetsStart = [];
        const matchPlanetsInclude = [];
        if (SolarSystemDataManager.getAllObjects()) {
            for (const planet of SolarSystemDataManager.getAllObjects()) {
                const param = { title: planet.jpnName, position: { ra: planet.raDec.ra, dec: planet.raDec.dec } };
                if (this.normalizeText(planet.jpnName).includes(query)) {
                    matchPlanetsInclude.push(param);
                }
                else if (this.normalizeText(planet.jpnName).startsWith(query)) {
                    matchPlanetsStart.push(param);
                }
                else if (this.normalizeText(planet.hiraganaName).startsWith(query)) {
                    matchPlanetsStart.push(param);
                }
                else if (this.normalizeText(planet.hiraganaName).includes(query)) {
                    matchPlanetsInclude.push(param);
                }
                else if (this.normalizeText(planet.engName).startsWith(query)) {
                    matchPlanetsStart.push(param);
                }
                else if (this.normalizeText(planet.engName).includes(query)) {
                    matchPlanetsInclude.push(param);
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
                for (const messier of DataStore.messierData) {
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
        const matchNgcData = [];
        if (DataStore.ngcData) {
            let catalogName = '';
            let queryNumber = '0';
            if (this.isInteger(query)) {
                queryNumber = query;
            }
            else if (query.slice(0, 3) === 'ngc') {
                catalogName = 'NGC';
                queryNumber = query.slice(3);
            }
            else if (query.slice(0, 2) === 'ic') {
                catalogName = 'IC';
                queryNumber = query.slice(2);
            }
            if (queryNumber !== '0') {
                const mayInclude = `(${catalogName}${queryNumber})`;
                for (const ngc of DataStore.ngcData) {
                    if (catalogName !== '' && ngc.getCatalog() !== catalogName) {
                        continue;
                    }
                    if (ngc.getNumberChar() === queryNumber &&
                        !matchRecStart.some(rec => rec.title.includes(mayInclude)) &&
                        !matchMessierInclude.some(messier => messier.title.includes(mayInclude)) &&
                        !matchRecInclude.some(rec => rec.title.includes(mayInclude))) {
                        matchNgc.push({ title: `${ngc.getCatalog()}${ngc.getNumber()}`, position: { ra: ngc.getCoordinates().ra, dec: ngc.getCoordinates().dec } });
                        matchNgcData.push(ngc);
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
            button.addEventListener('click', async () => {
                // NGC/IC の場合は天体オブジェクトを保存
                const isNgcIc = matchNgc.some(ngc => ngc.title === result.title);
                if (isNgcIc) {
                    const object = matchNgcData.find(ngc => ngc.getName() === result.title);
                    if (object) {
                        try {
                            sessionStorage.setItem('tempTarget', JSON.stringify(object));
                        }
                        catch (_) { }
                    }
                }
                else {
                    try {
                        sessionStorage.removeItem('tempTarget');
                    }
                    catch (_) { }
                }
                await this.selectSearchResult(result.position, epoch);
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
    static async selectSearchResult(position0, epoch = 'j2000') {
        // 検索結果が選択された時の処理
        const config = window.config;
        if (!config)
            return;
        const renderAll = window.renderAll;
        if (!renderAll)
            return;
        const coordinateConverter = new CoordinateConverter();
        let position = position0;
        if (epoch === 'j2000') {
            position = coordinateConverter.precessionEquatorial(position0, undefined, 'j2000', config.displayTime.jd);
        }
        const start_vector = coordinateConverter.equatorialToCartesian({ ra: config.viewState.centerRA, dec: config.viewState.centerDec });
        const end_vector = coordinateConverter.equatorialToCartesian(position);
        const steps = 30;
        const path_ras = [];
        const path_decs = [];
        const path_azs = [];
        const path_alts = [];
        for (let i = 0; i <= steps; i++) {
            const division_vector = {
                x: start_vector.x + (end_vector.x - start_vector.x) * i / steps,
                y: start_vector.y + (end_vector.y - start_vector.y) * i / steps,
                z: start_vector.z + (end_vector.z - start_vector.z) * i / steps
            };
            const new_position = coordinateConverter.cartesianToEquatorial(division_vector);
            const horizontal = coordinateConverter.equatorialToHorizontal({ ra: new_position.ra, dec: new_position.dec }, config.siderealTime);
            path_ras.push(new_position.ra);
            path_decs.push(new_position.dec);
            path_azs.push(horizontal.az);
            path_alts.push(horizontal.alt);
        }
        this.closeSearch();
        const interval = 20;
        async function move() {
            for (let i = 0; i <= steps; i++) {
                config.viewState.centerRA = path_ras[i];
                config.viewState.centerDec = path_decs[i];
                config.viewState.centerAz = path_azs[i];
                config.viewState.centerAlt = path_alts[i];
                window.updateConfig({
                    viewState: config.viewState
                });
                renderAll();
                await new Promise(resolve => setTimeout(resolve, interval));
            }
        }
        const interactionController = window.interactionController;
        if (interactionController) {
            interactionController.removeEventListeners();
            await move();
            interactionController.setupEventListeners();
        }
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
    static isInteger(name) {
        return /^\d+$/.test(name);
    }
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