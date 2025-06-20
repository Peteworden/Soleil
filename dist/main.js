//npm run dev
import { AstronomicalCalculator } from './utils/calculations.js';
import { CanvasRenderer } from './renderer/CanvasRenderer.js';
import { Planet, Moon } from './models/CelestialObject.js';
import { DataLoader } from './utils/DataLoader.js';
// 木星のデータ
const jupiterData = {
    jpnName: '木星',
    hiraganaName: 'もくせい',
    engName: 'Jupiter',
    t0: 2451545.0,
    a: 5.20288700,
    e: 0.04838624,
    incl: 1.30439695,
    meanLong: 34.39644051,
    longPeri: 14.72847983,
    node: 100.47390909,
    da: -0.00011607,
    de: -0.00013253,
    dIncl: -0.00183714,
    dMeanLong: 3034.74612775,
    dLongPeri: 0.21252668,
    dNode: 0.20469106
};
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
        // キャンバスの作成
        const canvas = document.createElement('canvas');
        canvas.width = config.canvasSize.width;
        canvas.height = config.canvasSize.height;
        app.appendChild(canvas);
        // レンダラーの作成
        const renderer = new CanvasRenderer(canvas, config.renderOptions, config.observationSite.latitude, config.observationSite.longitude);
        // 天体の作成
        const jupiter = new Planet(jupiterData);
        const moon = new Moon();
        // 現在のユリウス日を計算
        const jd = AstronomicalCalculator.calculateJulianDate(config.displayTime.year, config.displayTime.month, config.displayTime.day, config.displayTime.hour, config.displayTime.minute, config.displayTime.second);
        // 天体の位置を更新
        jupiter.updatePosition(jd);
        moon.updatePosition(jd);
        console.log(hipStars);
        // 描画
        renderer.clear();
        renderer.drawGrid();
        renderer.drawHipStars(hipStars);
        renderer.drawObject(jupiter);
        renderer.drawObject(moon);
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