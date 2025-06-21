export class SearchController {
    static closeSearch() {
        const searchDiv = document.getElementById('searchDiv');
        if (searchDiv) {
            searchDiv.style.display = 'none';
        }
    }
    static performSearch(query) {
        // 検索処理の実装
        // 天体データから検索
        // 結果の表示
        console.log('検索クエリ:', query);
        // 検索結果を表示する処理
        this.displaySearchResults(query);
    }
    static displaySearchResults(query) {
        const container = document.getElementById('suggestionButtonContainer');
        if (!container)
            return;
        // 検索結果をクリア
        container.innerHTML = '';
        // 仮の検索結果（実際の実装では天体データから検索）
        const mockResults = [
            { name: 'シリウス', type: '恒星', ra: '06h 45m 08.9s', dec: '-16° 42\' 58"' },
            { name: 'ベガ', type: '恒星', ra: '18h 36m 56.3s', dec: '+38° 47\' 01"' },
            { name: 'M42', type: '星雲', ra: '05h 35m 17.3s', dec: '-05° 23\' 28"' }
        ];
        // クエリにマッチする結果をフィルタリング
        const filteredResults = mockResults.filter(result => result.name.toLowerCase().includes(query.toLowerCase()));
        // 結果を表示
        filteredResults.forEach(result => {
            const button = document.createElement('button');
            button.className = 'suggestionButton';
            button.textContent = `${result.name} (${result.type})`;
            button.addEventListener('click', () => {
                this.selectSearchResult(result);
            });
            container.appendChild(button);
        });
        if (filteredResults.length === 0) {
            const noResult = document.createElement('div');
            noResult.textContent = '検索結果が見つかりませんでした';
            noResult.style.padding = '10px';
            noResult.style.color = '#aaa';
            container.appendChild(noResult);
        }
    }
    static selectSearchResult(result) {
        // 検索結果が選択された時の処理
        console.log('選択された天体:', result);
        // 天体情報を表示
        this.showObjectInfo(result);
        // 検索画面を閉じる
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
                if (query.length > 0) {
                    this.performSearch(query);
                }
                else {
                    const container = document.getElementById('suggestionButtonContainer');
                    if (container) {
                        container.innerHTML = '';
                    }
                }
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