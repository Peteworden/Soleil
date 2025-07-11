import { DataStore } from '../models/DataStore.js';
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
                SearchController.closeSearch();
            }
            else {
                SearchController.openSearch();
            }
        }
    }
    static performSearch(query) {
        // 検索処理の実装
        // 天体データから検索
        // 結果の表示
        console.log('検索クエリ:', query, query.length);
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
        this.displaySearchResults(query);
    }
    static displaySearchResults(query) {
        const container = document.getElementById('suggestionButtonContainer');
        if (!container)
            return;
        // 検索結果をクリア
        container.innerHTML = '';
        // queryで始まるものと始まらないが含むものを分ける
        const matchConstellationsStart = [];
        const matchConstellationsInclude = [];
        for (const constellation of DataStore.constellationData) {
            if (constellation.JPNname.startsWith(query.toLowerCase()) || constellation.IAUname.startsWith(query.toLowerCase())) {
                matchConstellationsStart.push({ title: `${constellation.JPNname} (${constellation.IAUname})`, position: { ra: constellation.ra, dec: constellation.dec } });
            }
            else if (constellation.JPNname.includes(query.toLowerCase()) || constellation.IAUname.includes(query.toLowerCase())) {
                matchConstellationsInclude.push({ title: `${constellation.JPNname} (${constellation.IAUname})`, position: { ra: constellation.ra, dec: constellation.dec } });
            }
        }
        const matchMessier = DataStore.messierData.filter((messier) => messier.name.toLowerCase().includes(query.toLowerCase()));
        // クエリにマッチする結果をフィルタリング
        const allResults = [...matchConstellationsStart, ...matchConstellationsInclude, ...matchMessier];
        allResults.forEach((result) => {
            const button = document.createElement('button');
            button.className = 'suggestionButton';
            button.textContent = result.title;
            button.addEventListener('click', () => {
                this.selectSearchResult(result.position);
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
    static selectSearchResult(position0) {
        // 検索結果が選択された時の処理
        console.log('選択された天体:', position0);
        const config = window.config;
        if (!config) {
            return;
        }
        const coordinateConverter = new CoordinateConverter();
        const position = coordinateConverter.precessionEquatorial(position0, undefined, 'j2000', config.displayTime.jd);
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
    static showObjectInfo(object) {
        const objectInfo = document.getElementById('objectInfo');
        const objectInfoName = document.getElementById('objectInfoName');
        const objectInfoText = document.getElementById('objectInfoText');
        if (objectInfo && objectInfoName && objectInfoText) {
            objectInfoName.textContent = object.name;
            objectInfoText.innerHTML = `
                <p><strong>種類:</strong> ${object.type}</p>
                <p><strong>赤経:</strong> ${object.ra}</p>
                <p><strong>赤緯:</strong> ${object.dec}</p>
            `;
            objectInfo.style.display = 'block';
        }
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