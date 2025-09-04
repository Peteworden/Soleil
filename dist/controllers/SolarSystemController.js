"use strict";
// import { SolarSystemDataManager } from '../models/SolarSystemObjects.js';
// /**
//  * 太陽系天体のアプリケーション制御クラス
//  * 位置計算とUI連携に特化
//  */
// export class SolarSystemController {
//     private static isInitialized = false;
//     /**
//      * 初期化（最初の読み込み時のみ実行）
//      */
//     static async initialize(): Promise<void> {
//         if (this.isInitialized) {
//             return;
//         }
//         try {
//             console.log('太陽系天体データを初期化中...');
//             await SolarSystemDataManager.loadSolarSystemObjectElements();
//             this.isInitialized = true;
//             console.log('太陽系天体データの初期化が完了しました', SolarSystemDataManager.getAllObjects().length);
//         } catch (error) {
//             console.error('太陽系天体データの初期化に失敗:', error);
//         }
//     }
// } 
//# sourceMappingURL=SolarSystemController.js.map