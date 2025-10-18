"use strict";
let ctx = null;
let width = 0;
let height = 0;
self.onmessage = (e) => {
    if (e.data.canvas) {
        const canvas = e.data.canvas;
        ctx = canvas.getContext("2d");
        width = canvas.width;
        height = canvas.height;
        return;
    }
    if (e.data.stars && ctx) {
        drawStars(e.data.stars);
    }
};
function drawStars(stars) {
    if (!ctx)
        return;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    // 星をサイズ帯でグループ化して描画
    // pushを使わずループ中で分岐 → CPUキャッシュ効率が高く速い
    let currentBin = Math.floor(stars[0].size); // 例: 0,1,2,...
    ctx.beginPath();
    for (let i = 0; i < stars.length; i++) {
        const { x, y, size } = stars[i];
        const bin = Math.floor(size);
        // サイズ帯が変わったら一度flush
        if (bin !== currentBin) {
            ctx.fill();
            ctx.beginPath();
            currentBin = bin;
        }
        if (size < 0.5) {
            ctx.rect(x - 0.5, y - 0.5, 1, 1);
        }
        else {
            ctx.moveTo(x, y);
            ctx.arc(x, y, size, 0, Math.PI * 2);
        }
    }
    ctx.fill(); // 最後のグループを描画
}
//# sourceMappingURL=renderWorker.js.map