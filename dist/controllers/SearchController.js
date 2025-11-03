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
        const startResults = [];
        const includeResults = [];
        if (SolarSystemDataManager.getAllObjects()) {
            for (const planet of SolarSystemDataManager.getAllObjects()) {
                const result = {
                    type: 'planet',
                    title: `${planet.jpnName} (${planet.engName})`,
                    coordinates: { ra: planet.raDec.ra, dec: planet.raDec.dec },
                    data: planet
                };
                if (this.normalizeText(planet.jpnName).startsWith(query) ||
                    this.normalizeText(planet.hiraganaName).startsWith(query) ||
                    this.normalizeText(planet.engName).startsWith(query)) {
                    startResults.push(result);
                }
                else if (this.normalizeText(planet.jpnName).includes(query) ||
                    this.normalizeText(planet.hiraganaName).includes(query) ||
                    this.normalizeText(planet.engName).includes(query)) {
                    includeResults.push(result);
                }
            }
        }
        // queryで始まるものと始まらないが含むものを分ける
        if (DataStore.constellationData) {
            for (const constellation of DataStore.constellationData) {
                const jpnName = this.kanaToHira(constellation.JPNname);
                const iauName = constellation.IAUname.toLowerCase();
                const abbr = constellation.abbr.toLowerCase();
                if (jpnName.startsWith(query) || iauName.startsWith(query) || abbr.startsWith(query)) {
                    startResults.push({
                        type: 'constellation',
                        title: `${constellation.JPNname} (${constellation.IAUname})`,
                        coordinates: { ra: constellation.ra, dec: constellation.dec },
                        data: constellation
                    });
                }
                else if (jpnName.includes(query) || iauName.includes(query) || abbr.includes(query)) {
                    includeResults.push({
                        type: 'constellation',
                        title: `${constellation.JPNname} (${constellation.IAUname})`,
                        coordinates: { ra: constellation.ra, dec: constellation.dec },
                        data: constellation
                    });
                }
            }
        }
        if (DataStore.messierData) {
            // start
            let queryAsMessier = '';
            let queryAsNGC = '';
            let queryAsIC = '';
            let queryAsSharpless = '';
            if (this.isInteger(query)) {
                const queryNumber = this.isInteger(query) ? query : query.slice(1);
                queryAsMessier = `m${queryNumber}`;
                queryAsNGC = `ngc${queryNumber}`;
                queryAsIC = `ic${queryNumber}`;
                queryAsSharpless = `sh2-${queryNumber}`;
            }
            else if (query.startsWith('m') && this.isInteger(query.slice(1))) {
                queryAsMessier = query;
            }
            else if (query.startsWith('ngc') && this.isInteger(query.slice(3))) {
                queryAsNGC = query;
            }
            else if (query.startsWith('ic') && this.isInteger(query.slice(2))) {
                queryAsIC = query;
            }
            else if (query.startsWith('sh2-') && this.isInteger(query.slice(4))) {
                queryAsSharpless = query;
            }
            for (const messier of DataStore.messierData) {
                if (messier.getName().length == 0)
                    continue;
                let hitThisMessier = false;
                let result = {
                    type: 'messier',
                    title: messier.getName(),
                    coordinates: { ra: messier.getCoordinates().ra, dec: messier.getCoordinates().dec },
                    data: messier
                };
                if (messier.getOtherNames() && messier.getOtherNames().length > 0 && messier.getOtherNames()[0].length > 0) {
                    result.title = `${messier.getName()} (${messier.getOtherNames()[0]})`;
                }
                if (queryAsMessier.length > 0) {
                    // 'm+数字'または数字のみのとき
                    if (messier.getName().toLowerCase() == queryAsMessier) {
                        startResults.push(result);
                    }
                }
                else if (messier.getOtherNames() || messier.getSearchKeys()) {
                    const otherNames = messier.getOtherNames() ? messier.getOtherNames().map(name => this.normalizeText(name)) : [];
                    const searchKeys = messier.getSearchKeys() ? messier.getSearchKeys().map(name => this.normalizeText(name)) : [];
                    if (queryAsNGC.length > 0 || queryAsIC.length > 0 || queryAsSharpless.length > 0) {
                        // 'ngc+数字'または'ic+数字'または'sh2-数字'または数字のみのとき
                        for (const otherName of otherNames) {
                            const normalizedOtherName = this.normalizeText(otherName);
                            if (normalizedOtherName == queryAsNGC ||
                                normalizedOtherName == queryAsIC ||
                                normalizedOtherName == queryAsSharpless) {
                                startResults.push(result);
                                hitThisMessier = true;
                            }
                        }
                        if (hitThisMessier) {
                            continue;
                        }
                        for (const searchKey of searchKeys) {
                            const normalizedSearchKey = this.normalizeText(searchKey);
                            if (normalizedSearchKey == queryAsNGC ||
                                normalizedSearchKey == queryAsIC ||
                                normalizedSearchKey == queryAsSharpless) {
                                startResults.push(result);
                            }
                        }
                    }
                    else { // 数字が含まれないとき
                        for (const otherName of otherNames) {
                            if (otherName.startsWith(query)) {
                                startResults.push(result);
                                hitThisMessier = true;
                                break;
                            }
                            else if (otherName.includes(query)) {
                                includeResults.push(result);
                                hitThisMessier = true;
                                break;
                            }
                        }
                        if (hitThisMessier) {
                            continue;
                        }
                        for (const searchKey of searchKeys) {
                            if (searchKey.startsWith(query)) {
                                startResults.push(result);
                                break;
                            }
                            else if (searchKey.includes(query)) {
                                includeResults.push(result);
                                break;
                            }
                        }
                    }
                }
            }
        }
        else {
            console.log('No Messier data found');
        }
        if (DataStore.recData) {
            let queryAsNGC = '';
            let queryAsIC = '';
            let queryAsSharpless = '';
            if (this.isInteger(query)) {
                const queryNumber = this.isInteger(query) ? query : query.slice(1);
                queryAsNGC = `ngc${queryNumber}`;
                queryAsIC = `ic${queryNumber}`;
                queryAsSharpless = `sh2-${queryNumber}`;
            }
            else if (query.startsWith('ngc') && this.isInteger(query.slice(3))) {
                queryAsNGC = query;
            }
            else if (query.startsWith('ic') && this.isInteger(query.slice(2))) {
                queryAsIC = query;
            }
            else if (query.startsWith('sh2-') && this.isInteger(query.slice(4))) {
                queryAsSharpless = query;
            }
            for (const rec of DataStore.recData) {
                if (rec.getName().length == 0)
                    continue;
                let hitThisRec = false;
                const result = {
                    type: 'rec',
                    title: rec.getName(),
                    coordinates: { ra: rec.getCoordinates().ra, dec: rec.getCoordinates().dec },
                    data: rec
                };
                if (rec.getOtherNames() && rec.getOtherNames().length > 0 && rec.getOtherNames()[0].length > 0) {
                    result.title = `${rec.getName()} (${rec.getOtherNames()[0]})`;
                }
                if (queryAsNGC.length > 0 || queryAsIC.length > 0 || queryAsSharpless.length > 0) {
                    if (rec.getName().toLowerCase() == queryAsNGC || rec.getName().toLowerCase() == queryAsIC || rec.getName().toLowerCase() == queryAsSharpless) {
                        startResults.push(result);
                        continue;
                    }
                }
                else if (this.normalizeText(rec.getName()).startsWith(query)) {
                    startResults.push(result);
                    continue;
                }
                else if (this.normalizeText(rec.getName()).includes(query)) {
                    includeResults.push(result);
                    continue;
                }
                if (rec.getOtherNames() || rec.getSearchKeys()) {
                    const otherNames = rec.getOtherNames() ? rec.getOtherNames().map(name => this.normalizeText(name)) : [];
                    const searchKeys = rec.getSearchKeys() ? rec.getSearchKeys().map(name => this.normalizeText(name)) : [];
                    if (queryAsNGC.length > 0 || queryAsIC.length > 0 || queryAsSharpless.length > 0) {
                        // 'ngc+数字'または'ic+数字'または'sh2-数字'または数字のみのとき
                        for (const otherName of otherNames) {
                            if (otherName.startsWith(query)) {
                                startResults.push(result);
                                hitThisRec = true;
                            }
                        }
                        if (hitThisRec) {
                            continue;
                        }
                        for (const searchKey of searchKeys) {
                            if (searchKey.startsWith(query)) {
                                startResults.push(result);
                            }
                        }
                    }
                    else {
                        // 数字が含まれないとき
                        for (const otherName of otherNames) {
                            if (otherName.startsWith(query)) {
                                startResults.push(result);
                                hitThisRec = true;
                                break;
                            }
                            else if (otherName.includes(query)) {
                                includeResults.push(result);
                                hitThisRec = true;
                                break;
                            }
                        }
                        if (hitThisRec) {
                            continue;
                        }
                        for (const searchKey of searchKeys) {
                            if (searchKey.startsWith(query)) {
                                startResults.push(result);
                                break;
                            }
                            else if (searchKey.includes(query)) {
                                includeResults.push(result);
                                break;
                            }
                        }
                    }
                }
            }
        }
        else {
            console.log('No REC data found');
        }
        if (DataStore.ngcData) {
            let queryAsNGC = '';
            if (this.isInteger(query)) {
                queryAsNGC = `ngc${query}`;
            }
            else if (query.slice(0, 3) === 'ngc') {
                queryAsNGC = query;
            }
            if (queryAsNGC.length > 0 &&
                !startResults.some(result => this.normalizeText(result.title).includes(queryAsNGC)) &&
                !includeResults.some(result => this.normalizeText(result.title).includes(queryAsNGC))) {
                for (const ngc of DataStore.ngcData) {
                    if (ngc.getName().toLowerCase() == queryAsNGC) {
                        ;
                        startResults.push({
                            type: 'ngc',
                            title: ngc.getName(),
                            coordinates: { ra: ngc.getCoordinates().ra, dec: ngc.getCoordinates().dec },
                            data: ngc
                        });
                        break;
                    }
                }
            }
        }
        else {
            console.log('No NGC data found');
        }
        if (DataStore.icData) {
            let queryAsIC = '';
            if (this.isInteger(query)) {
                queryAsIC = `ic${query}`;
            }
            else if (query.slice(0, 2) === 'ic') {
                queryAsIC = query;
            }
            if (queryAsIC.length > 0 &&
                !startResults.some(result => result.title.includes(queryAsIC)) &&
                !includeResults.some(result => result.title.includes(queryAsIC))) {
                for (const ic of DataStore.icData) {
                    if (ic.getName().toLowerCase() == queryAsIC) {
                        startResults.push({
                            type: 'ic',
                            title: ic.getName(),
                            coordinates: { ra: ic.getCoordinates().ra, dec: ic.getCoordinates().dec },
                            data: ic
                        });
                        continue;
                    }
                }
            }
        }
        else {
            console.log('No IC data found');
        }
        if (DataStore.sharplessData) {
            let queryAsSharpless = '';
            if (this.isInteger(query)) {
                queryAsSharpless = `sh2-${query}`;
            }
            else if (query.startsWith('sh2-') && this.isInteger(query.slice(4))) {
                queryAsSharpless = query;
            }
            if (queryAsSharpless.length > 0 &&
                !startResults.some(result => result.title.includes(queryAsSharpless)) &&
                !includeResults.some(result => result.title.includes(queryAsSharpless))) {
                for (const sharpless of DataStore.sharplessData) {
                    let result = {
                        type: 'sh2',
                        title: sharpless.getName(),
                        coordinates: { ra: sharpless.getCoordinates().ra, dec: sharpless.getCoordinates().dec },
                        data: sharpless
                    };
                    if (sharpless.getAltNames().length > 0) {
                        result.title = `${sharpless.getName()} (${sharpless.getAltNames()[0]})`;
                    }
                    if (sharpless.getName().toLowerCase() === queryAsSharpless) {
                        startResults.push(result);
                        continue;
                    }
                }
            }
            else {
                for (const sharpless of DataStore.sharplessData) {
                    let result = {
                        type: 'sh2',
                        title: sharpless.getName(),
                        coordinates: { ra: sharpless.getCoordinates().ra, dec: sharpless.getCoordinates().dec },
                        data: sharpless
                    };
                    if (sharpless.getAltNames().length > 0) {
                        result.title = `${sharpless.getName()} (${sharpless.getAltNames()[0]})`;
                    }
                    const alt_names = sharpless.getAltNames().map(name => this.normalizeText(name));
                    const search_names = sharpless.getSearchNames().map(name => this.normalizeText(name));
                    for (const alt_name of alt_names) {
                        if (this.normalizeText(alt_name).includes(query)) {
                            includeResults.push(result);
                            break;
                        }
                        else if (alt_name.startsWith(query)) {
                            startResults.push(result);
                            break;
                        }
                    }
                    for (const search_name of search_names) {
                        if (this.normalizeText(search_name).includes(query)) {
                            includeResults.push(result);
                            break;
                        }
                        else if (search_name.startsWith(query)) {
                            startResults.push(result);
                            break;
                        }
                    }
                }
            }
        }
        else {
            console.log('No Sharpless data found');
        }
        if (DataStore.starNames) {
            for (const starName of DataStore.starNames) {
                let result = {
                    type: 'starName',
                    title: starName.jpnName ? `${starName.jpnName} (${starName.name})` : starName.name,
                    coordinates: { ra: starName.ra, dec: starName.dec },
                    data: starName
                };
                if (this.normalizeText(starName.name).startsWith(query)) {
                    startResults.push(result);
                }
                else if (this.normalizeText(starName.name).includes(query)) {
                    includeResults.push(result);
                }
                if (starName.jpnName) {
                    if (this.normalizeText(starName.jpnName).startsWith(query)) {
                        startResults.push(result);
                    }
                    else if (this.normalizeText(starName.jpnName).includes(query)) {
                        includeResults.push(result);
                    }
                }
            }
        }
        // クエリにマッチする結果をフィルタリング
        const allResults = [
            ...startResults,
            ...includeResults
        ];
        allResults.forEach((result) => {
            const button = document.createElement('button');
            button.className = 'suggestionButton';
            button.textContent = result.title;
            const epoch = result.type === 'planet' ? 'current' : 'j2000';
            button.addEventListener('click', async () => {
                // NGC/IC/Sh2 の場合はそれだけ出しておく
                if (result.type === 'ngc' || result.type === 'ic') {
                    const object = result.data;
                    if (object) {
                        try {
                            sessionStorage.setItem('tempTarget', JSON.stringify(object));
                        }
                        catch (_) { }
                    }
                }
                else if (result.type === 'sh2') {
                    const object = result.data;
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
                await this.selectSearchResult(result.coordinates, epoch);
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
        const lstLat = { lst: config.siderealTime, lat: config.observationSite.latitude };
        for (let i = 0; i <= steps; i++) {
            const division_vector = {
                x: start_vector.x + (end_vector.x - start_vector.x) * i / steps,
                y: start_vector.y + (end_vector.y - start_vector.y) * i / steps,
                z: start_vector.z + (end_vector.z - start_vector.z) * i / steps
            };
            const new_position = coordinateConverter.cartesianToEquatorial(division_vector);
            const horizontal = coordinateConverter.equatorialToHorizontal(lstLat, { ra: new_position.ra, dec: new_position.dec });
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
                this.performSearch(this.normalizeText(query));
            });
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = searchInput.value;
                    if (query.length > 0) {
                        this.performSearch(this.normalizeText(query));
                    }
                }
            });
        }
    }
}
//# sourceMappingURL=SearchController.js.map