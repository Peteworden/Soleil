import { SolarSystemController } from '../controllers/SolarSystemController.js';
/**
 * 太陽系天体クラスの使用例
 */
export class SolarObjectsExample {
    /**
     * 基本的な使用例
     */
    static async basicExample() {
        console.log('=== 太陽系天体データの読み込み例 ===');
        // 初期化（最初の読み込み時のみ実行）
        await SolarSystemController.initialize();
        // 天体の種類別に分類
        const planets = SolarSystemController.getPlanets();
        const asteroids = SolarSystemController.getAsteroids();
        const comets = SolarSystemController.getComets();
        const sun = SolarSystemController.getSun();
        const moon = SolarSystemController.getMoon();
        console.log(`惑星: ${planets.length}個`);
        console.log(`小惑星: ${asteroids.length}個`);
        console.log(`彗星: ${comets.length}個`);
        console.log(`太陽: ${sun ? 'あり' : 'なし'}`);
        console.log(`月: ${moon ? 'あり' : 'なし'}`);
    }
    /**
     * 天体の検索例
     */
    static searchExample() {
        console.log('\n=== 天体検索例 ===');
        // 日本語名で検索
        const earth = SolarSystemController.findObject('地球');
        if (earth) {
            console.log(`地球の英語名: ${earth.getEnglishName()}`);
            console.log(`地球のひらがな名: ${earth.getHiraganaName()}`);
        }
        // 英語名で検索
        const mars = SolarSystemController.findObject('Mars');
        if (mars) {
            console.log(`火星の日本語名: ${mars.getJapaneseName()}`);
        }
        // ひらがな名で検索
        const jupiter = SolarSystemController.findObject('もくせい');
        if (jupiter) {
            console.log(`木星の英語名: ${jupiter.getEnglishName()}`);
        }
    }
    /**
     * 位置計算例
     */
    static positionCalculationExample() {
        console.log('\n=== 位置計算例 ===');
        // 現在のユリウス日（例）
        const currentJd = 2460100.5; // 2024年1月1日頃
        // 設定変更時・時刻変更時の処理
        // SolarSystemController.updatePositions(currentJd);
        // 惑星の位置を表示
        const planets = SolarSystemController.getPlanets();
        planets.forEach(planet => {
            const coords = planet.getRaDec();
            const distance = planet.distance;
            const magnitude = planet.getMagnitude();
            console.log(`${planet.getJapaneseName()}: RA=${coords.ra.toFixed(2)}°, Dec=${coords.dec.toFixed(2)}°, 距離=${distance?.toFixed(3) || 'N/A'} AU, 等級=${magnitude?.toFixed(2) || 'N/A'}`);
        });
        // 太陽の位置を表示
        const sun = SolarSystemController.getSun();
        if (sun) {
            const coords = sun.getRaDec();
            const distance = sun.distance;
            const magnitude = sun.getMagnitude();
            console.log(`太陽: RA=${coords.ra.toFixed(2)}°, Dec=${coords.dec.toFixed(2)}°, 距離=${distance?.toFixed(3) || 'N/A'} AU, 等級=${magnitude?.toFixed(2) || 'N/A'}`);
        }
    }
    /**
     * 観測地変更例
     */
    static observerPlanetExample() {
        console.log('\n=== 観測地変更例 ===');
        // 現在の観測地を表示
        console.log(`現在の観測地: ${SolarSystemController.getObserverPlanet()}`);
        // 観測地を火星に変更
        // SolarSystemController.setObserverPlanet('火星');
        console.log(`観測地を変更: ${SolarSystemController.getObserverPlanet()}`);
        // 位置を再計算
        const currentJd = 2460100.5;
        // SolarSystemController.updatePositions(currentJd);
        // 地球の位置を表示（火星から見た地球）
        const earth = SolarSystemController.getEarth();
        if (earth) {
            const coords = earth.getRaDec();
            const distance = earth.distance;
            console.log(`火星から見た地球: RA=${coords.ra.toFixed(2)}°, Dec=${coords.dec.toFixed(2)}°, 距離=${distance?.toFixed(3) || 'N/A'} AU`);
        }
        // 観測地を地球に戻す
        // SolarSystemController.setObserverPlanet('地球');
    }
    /**
     * 軌道要素の取得例（惑星）
     */
    static orbitalElementsExample() {
        console.log('\n=== 軌道要素取得例 ===');
        const planets = SolarSystemController.getPlanets();
        planets.forEach(planet => {
            // 軌道要素を持つ天体としてキャスト
            const orbitalPlanet = planet;
            console.log(`\n${planet.getJapaneseName()}の軌道要素:`);
            console.log(`  軌道長半径: ${orbitalPlanet.getA?.()?.toFixed(6) || 'N/A'} AU`);
            console.log(`  離心率: ${orbitalPlanet.getE?.()?.toFixed(6) || 'N/A'}`);
            console.log(`  軌道傾斜角: ${orbitalPlanet.getIncl?.()?.toFixed(6) || 'N/A'}°`);
            console.log(`  昇交点黄経: ${orbitalPlanet.getNode?.()?.toFixed(6) || 'N/A'}°`);
        });
    }
    /**
     * 小惑星の詳細情報例
     */
    static asteroidDetailsExample() {
        console.log('\n=== 小惑星詳細情報例 ===');
        const asteroids = SolarSystemController.getAsteroids();
        asteroids.forEach(asteroid => {
            // 小惑星としてキャスト
            const asteroidObj = asteroid;
            console.log(`\n${asteroid.getJapaneseName()} (${asteroid.getEnglishName()}):`);
            console.log(`  絶対等級: ${asteroidObj.getAbsoluteMagnitude?.() || 'N/A'}`);
            console.log(`  近日点引数: ${asteroidObj.getPerihelionArgument?.()?.toFixed(6) || 'N/A'}°`);
            console.log(`  元期の平均近点角: ${asteroidObj.getMeanAnomaly?.()?.toFixed(6) || 'N/A'}°`);
            const phaseCoeff = asteroidObj.getPhaseCoefficient?.();
            if (phaseCoeff !== undefined) {
                console.log(`  位相係数: ${phaseCoeff.toFixed(6)}`);
            }
        });
    }
    /**
     * デバッグ情報表示例
     */
    static debugExample() {
        console.log('\n=== デバッグ情報例 ===');
        SolarSystemController.debugInfo();
    }
    /**
     * 全体的な使用例
     */
    static async runAllExamples() {
        console.log('太陽系天体クラスの使用例を開始します...\n');
        await this.basicExample();
        this.searchExample();
        this.positionCalculationExample();
        this.observerPlanetExample();
        this.orbitalElementsExample();
        this.asteroidDetailsExample();
        this.debugExample();
        console.log('\n=== 使用例完了 ===');
    }
}
// 使用例の実行（必要に応じてコメントアウト）
// SolarObjectsExample.runAllExamples(); 
//# sourceMappingURL=SolarObjectsExample.js.map