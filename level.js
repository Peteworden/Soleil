const deg2rad = Math.PI / 180;
const rad2deg = 180 / Math.PI;
let dev = [180*deg2rad, 120*deg2rad, 0*deg2rad];
let os = init();
let loadAzm = 0;
let recording = 'none';
let recordingData = [];

// Canvasの設定
const canvas = document.getElementById('orientationCanvas');
const ctx = canvas.getContext('2d');
let animationFrameId;

// Canvasのサイズを設定
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

// 初期化時にCanvasのサイズを設定
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// 円と点を描画する関数
function drawOrientation(alpha, beta, gamma) {
    // Canvasをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 中心点を計算
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.8;

    // 基準円を描画
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    // ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 水平線を描画
    ctx.beginPath();
    ctx.moveTo(centerX - radius, centerY);
    ctx.lineTo(centerX + radius, centerY);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.stroke();

    // 垂直線を描画
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius);
    ctx.lineTo(centerX, centerY + radius);
    ctx.stroke();

    let [A, h] = centerAzmAlt([alpha, beta, gamma], loadAzm);
    if (beta == 0 && gamma == 0) {
        A = 0.0;
        h = 0.0;
    } else {
        A = Math.atan2(beta, gamma);
        h = h + 90;
    }

    // 傾きに応じた点の位置を計算
    // A = 1.0;
    // h = 3.0;
    function plot(h, A, color, size) {
        if (h <= 5) {
            const pointX = centerX + (h / 5) * radius * Math.cos(A);
            const pointY = centerY + (h / 5) * radius * Math.sin(A);
            ctx.beginPath();
            ctx.arc(pointX, pointY, size, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        }
    }
    if (recording != 'none') {
        for (let i = 0; i < recordingData.length; i++) {
            plot(recordingData[i][0], recordingData[i][1], 'orange', 4);
        }
    }
    plot(h, A, 'white', 10);
    if (recording == 'recording') {
        recordingData.push([h, A]);
    }
}

function toggleRecording() {
    if (recording == 'none') {
        recording = 'recording';
        document.getElementById('recordLabel').textContent = '停止';
    } else if (recording == 'recording') {
        recording = 'pausing';
        document.getElementById('recordLabel').textContent = '消去';
    } else if (recording == 'pausing') {
        recording = 'none';
        document.getElementById('recordLabel').textContent = '記録開始';
    }
}

function deviceOrientation(event) {
    if (os == 'iphone' && loadAzm == 0) {
        loadAzm = event.webkitCompassHeading;
    }
    let eventAngleDegRad = [event.alpha, event.beta, event.gamma].map(val => val * deg2rad);
    // Canvasに描画
    drawOrientation(eventAngleDegRad);
}

function init() {
    let os;
    if (
        navigator.userAgent.indexOf("iPhone") > 0 ||
        navigator.userAgent.indexOf("iPad") > 0 ||
        navigator.userAgent.indexOf("iPod") > 0
    ) {
        // iPad OS13のsafariはデフォルト「Macintosh」なので別途要対応
        os = "iphone";
    } else if (navigator.userAgent.indexOf("Android") > 0) {
        os = "android";
    } else {
        os = "pc";
    }
    if (os == "iphone") {
        // safari用。DeviceOrientation APIの使用をユーザに許可してもらう
        orientationPermittion = false;
        function permitDeviceOrientationForSafari() {
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response === "granted") {
                        window.addEventListener("deviceorientation", () => {});
                        orientationPermittion = true;
                    }
                })
                .catch(console.error);
        }
        document.body.addEventListener("click", permitDeviceOrientationForSafari);
    } else if (os == "android") {
        window.addEventListener("deviceorientationabsolute", deviceOrientation, true);
    } else {
        window.addEventListener("onmousemove", deviceOrientation, true);
        window.addEventListener("deviceorientation", deviceOrientation, true);
    }
    return os;
}

function sin(a) {
    return Math.sin(a);
}

function cos(a) {
    return Math.cos(a);
}

function Rx([x, y, z], a) {
    let s = sin(a);
    let c = cos(a);
    let ans = [x, c*y-s*z, s*y+c*z]
    return ans;
}

function Ry ([x, y, z], a) {
    let s = sin(a);
    let c = cos(a);
    let ans = [c*x+s*z, y, -s*x+c*z]
    return ans;
}

function Rz ([x, y, z], a) {
    let s = sin(a);
    let c = cos(a);
    let ans = [c*x-s*y, s*x+c*y, z];
    return ans;
}

function centerAzmAlt (dev, loadAzm) {
    let [x, y, z] = Rz(Rx(Ry([0, 0, -1], dev[2]), dev[1]), dev[0]);
    let h = Math.asin(z) * rad2deg;
    let A = ((Math.atan2(-y, x) * rad2deg + loadAzm + 90) % 360 + 360) % 360;
    return [A, h];
}