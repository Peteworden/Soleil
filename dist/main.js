//npm run dev
import { AstronomicalCalculator } from './utils/calculations.js';
import { CanvasRenderer } from './renderer/CanvasRenderer.js';
import { Planet, Moon } from './models/CelestialObject.js';
import { DataLoader } from './utils/DataLoader.js';
import { InteractionController } from "./renderer/interactionController.js";
import { jupiterData } from './data/planets.js';
// 星空表示の設定
const config = {
    renderOptions: {
        showGrid: true,
        showStars: true,
        showPlanets: true,
        showConstellations: true,
        centerRA: 90,
        centerDec: 0,
        fieldOfViewRA: 60,
        fieldOfViewDec: 60
    },
    observationSite: {
        latitude: 35.0, // 東京の緯度
        longitude: 135.0, // 東京の経度
        timezone: 9 // 日本標準時
    },
    displayTime: {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate(),
        hour: new Date().getHours(),
        minute: new Date().getMinutes(),
        second: new Date().getSeconds()
    },
    canvasSize: {
        width: window.innerWidth,
        height: window.innerHeight
    }
};
// メイン関数
export async function main() {
    const app = document.getElementById('app');
    if (!app)
        return;
    try {
        // データの読み込み
        const [constellationData, messierData, starNames, hipStars] = await Promise.all([
            DataLoader.loadConstellationData(),
            DataLoader.loadMessierData(),
            DataLoader.loadStarNames(),
            DataLoader.loadHIPData()
        ]);
        console.log(constellationData);
        // キャンバスの作成
        const canvas = document.createElement('canvas');
        canvas.width = config.canvasSize.width;
        canvas.height = config.canvasSize.height;
        app.appendChild(canvas);
        config.renderOptions.fieldOfViewDec = config.canvasSize.height / config.canvasSize.width * config.renderOptions.fieldOfViewRA;
        // レンダラーの作成
        const renderer = new CanvasRenderer(canvas, config.renderOptions, config.observationSite.latitude, config.observationSite.longitude);
        function renderAll() {
            renderer.clear();
            renderer.drawGrid();
            renderer.drawConstellationLines(Object.values(constellationData));
            renderer.drawHipStars(hipStars);
            renderer.drawObject(jupiter);
            renderer.drawObject(moon);
        }
        const controller = new InteractionController(canvas, config.renderOptions, renderAll);
        // 天体の作成
        const jupiter = new Planet(jupiterData);
        const moon = new Moon();
        // 現在のユリウス日を計算
        const jd = AstronomicalCalculator.calculateCurrentJulianDate();
        // 天体の位置を更新
        jupiter.updatePosition(jd);
        moon.updatePosition(jd);
        // 描画
        renderAll();
        // 情報の表示
        const info = document.createElement('div');
        info.innerHTML = `
            <h2>${jupiter.getJapaneseName()}（${jupiter.getHiraganaName()}）の情報</h2>
            <h3>基本情報</h3>
            <ul>
                <li>日本語名: ${jupiter.getJapaneseName()}</li>
                <li>ひらがな: ${jupiter.getHiraganaName()}</li>
                <li>英語名: ${jupiter.getEnglishName()}</li>
            </ul>
            <h3>現在の位置</h3>
            <ul>
                <li>赤経: ${jupiter.getCoordinates().ra.toFixed(2)}°</li>
                <li>赤緯: ${jupiter.getCoordinates().dec.toFixed(2)}°</li>
            </ul>
            <h3>表示設定</h3>
            <ul>
                <li>表示時刻: ${config.displayTime.year}年${config.displayTime.month}月${config.displayTime.day}日 ${config.displayTime.hour}時${config.displayTime.minute}分</li>
                <li>観測地点: 北緯${config.observationSite.latitude}° 東経${config.observationSite.longitude}°</li>
                <li>視野角: ${config.renderOptions.fieldOfViewRA}°</li>
            </ul>
            <h3>読み込んだデータ</h3>
            <ul>
                <li>星座データ: ${Object.keys(constellationData).length}件</li>
                <li>メシエ天体: ${Object.keys(messierData).length}件</li>
                <li>星名データ: ${Object.keys(starNames).length}件</li>
            </ul>
        `;
        app.appendChild(info);
    }
    catch (error) {
        console.error('データの読み込みに失敗しました:', error);
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.textContent = `エラー: ${error instanceof Error ? error.message : '不明なエラーが発生しました'}`;
        app.appendChild(errorDiv);
    }
}
// ページ読み込み時に実行
window.addEventListener('DOMContentLoaded', main);
//# sourceMappingURL=main.js.map