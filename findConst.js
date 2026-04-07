//2023/12/08~

const online = navigator.onLine;

// 定数
const pi = Math.PI;
const rad2deg = 180 / pi;
const deg2rad = pi / 180;
const eps = 0.4090926; //黄道傾斜角
const sine = sin(eps);
const cose = cos(eps);

// html要素
const yearTextElem = document.getElementById('yearText');
const monthTextElem = document.getElementById('monthText');
const dateTextElem = document.getElementById('dateText');
const hourTextElem = document.getElementById('hourText');
const minuteTextElem = document.getElementById('minuteText');
const aovSliderElem = document.getElementById('aovSlider');
const timeSliderElem = document.getElementById('timeSlider');
let zuhoElem = document.getElementsByName('mode');
const permitBtns = document.getElementsByClassName('permitBtn');
const realtimeElem = document.getElementsByName('realtime');
const trackDateElem = document.getElementsByName('trackTime');
const starNameElem = document.getElementsByName('starName');

document.getElementById('setting').style.visibility = "hidden";
document.getElementById('exitFullScreenBtn').style.visibility = "hidden";
document.getElementById('description').style.visibility = "hidden";
document.getElementById('setPicsFor360Div').style.visibility = "hidden";
document.getElementById('demDescriptionDiv').style.visibility = "hidden";
document.getElementById('searchDiv').style.visibility = "hidden";
document.getElementById('objectInfo').style.visibility = "hidden";

// 変数
// 色
let darker = false;
let skycolor = '#001';
let starColor = '#FFF';
let yellowColor = 'yellow';
let objectColor = 'orange';
let specialObjectNameColor = '#FF8';
let lineColor = 'red';
let textColor = 'white';

// 視野
let [cenRA, cenDec] = setCenCoord();
let cenAzm = 180;
let cenAlt = 60;
let dev = [180*deg2rad, 120*deg2rad, 0*deg2rad];

const minrg = 0.3;
const maxrg = 90;
let rgEW, rgNS;
let rgtext;

// 天文計算
let showingJD = 0;
let theta;
let mode; //AEP(正距方位図法), EtP(正距円筒図法), view(プラネタリウム), live(実際の傾き), ar
let lattext, lontext;
let ObsPlanet="地球", Obs_num=3, lat_obs=35*deg2rad, lon_obs=135*deg2rad;

let Ms, ws, lon_moon, lat_moon;

// データ

let hips = [];
let gaia100 = new Array(505972);
let gaia100_help = new Array(64801);
let gaia101_110 = new Array(800359);
let gaia101_110_help = new Array(64801);
let gaia111_115 = new Array(666677);
let gaia111_115_help = new Array(64801);
let Tycho = new Array(980634);
let Help = new Array(64801);
let Tycho1011 = new Array(1602511);
let Help1011 = new Array(64801);
let BSCnum = 0;
let BSCRAary = Array(1);
let BSCDecary = Array(1);
let FSs = Array(1);
let Bayers = Array(1);
let BayerNums = Array(1);
let starNames;
let messier;
let recs;
let NGC = new Array(66130);
let constellations;
let boundary = new Array(4801);

var showInfo = false;
document.getElementById('nextBtn').style.visibility = "hidden";

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 30;

function setCenCoord() {
    var cenRA = Math.random() * 360.0;
    var cenDec = -90.0 + Math.acos(Math.random() * 2 - 1) / pi * 180.0;
    console.log(cenRA, cenDec);
    return [cenRA, cenDec];
}

function setRange() {
    if (canvas.width < canvas.height) {
        var rgEW = 10.0 + Math.random() * 15.0;
        var rgNS = rgEW * canvas.height / canvas.width;
    } else {
        var rgNS = 10.0 + Math.random() * 15.0;
        var rgEW = rgNS * canvas.width / canvas.height;
    }
    return [rgEW, rgNS];
}
[rgEW, rgNS] = setRange();
rgtext = `視野(左右):${Math.round(rgEW * 20) / 10}°`;

var magLimtext;
var magLimLim = 11;
function find_magLim() {
    var magLim = Math.min(Math.max(12.5 - 1.8 * Math.log(Math.min(rgEW, rgNS)), 4), magLimLim);
    //var magLim = 11;
    magLimtext = `~${Math.round(magLim * 10) / 10}等級`;
    return magLim;
}
var magLim = find_magLim();

function find_zerosize() {
    return 15 - 2.4 * Math.log(Math.min(rgEW, rgNS) + 3);
}
var zerosize = find_zerosize();

var SHmode = true;

var xhrcheck = 0;
let xhrimpcheck = 0;
let defaultcheck = 0;
let loaded = [];
document.addEventListener('DOMContentLoaded', function() {
    loadFiles();
});

function show_initial(){
    console.log(xhrcheck);
    if (xhrcheck == 14){
        console.log(xhrcheck);
        show_main();
    } else {
        console.log(xhrcheck);
    }
}

var ENGplanets = ['Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Moon', 'Ceres', 'Vesta'];
var JPNplanets = ['太陽',  '水星', '金星', '地球', '火星',  '木星', '土星', '天王星', '海王星', '月', 'Ceres', 'Vesta'];
var dist_Moon, dist_Sun;


var JD = 2459945.125 + Math.random() * 365.0;
var azimuth = Math.random() * 360.0;
var altitude = 90.0 - Math.random() * (100.0 - rgNS);

//基本的にYMDHはJST, JDはTT

function JD_to_YMDH(JD) { //TT-->JST として変換　TT-->TTのときはJDに-0.3742しておく
    var JD = JD + 0.375;
    var A = Math.floor(JD + 68569.5);
    var B = Math.floor(A / 36524.25);
    var C = A - Math.floor(36524.25 * B + 0.75);
    var E = Math.floor((C + 1) / 365.25025);
    var F = C - Math.floor(365.25 * E) + 31;
    var G = Math.floor(F / 30.59);
    var D = F - Math.floor(30.59 * G);
    var H = Math.floor(G / 11);
    var M = G - 12 * H + 2;
    var Y = 100 * (B -49) + E + H;
    var Hr = Math.round((JD + 0.5 - Math.floor(JD + 0.5)) * 240) / 10;
    if (M == 12 && D == 32) {
        Y += 1;
        M = 1;
        D = 1;
    }

    return [Y, M, D, Hr];
}

/*
function YMDH_to_JD(Y, M, D, H){
    if (M <= 2) {
        M += 12;
        Y--;
    }
    var JD = Math.floor(365.25*Y) + Math.floor(Y/400) - Math.floor(Y/100) + Math.floor(30.59*(M-2)) + D + H/24 + 1721088.5 + 0.0008 - 0.375;
    return JD;
}*/

var logs, temp;

chartLinkElement = document.getElementById('chart');

function showAnswer() {
    showInfo = true;

    canvas.addEventListener("touchstart", ontouchstart);
    canvas.addEventListener("touchmove", ontouchmove);
    canvas.addEventListener('touchend', ontouchend);
    canvas.addEventListener('touchcancel', ontouchcancel);
    canvas.addEventListener('mousedown', onmousedown);
    canvas.addEventListener('mouseup', onmouseup);
    canvas.addEventListener('wheel', onwheel);

    canvas.removeEventListener('mousedown', startPoint, false);
    canvas.removeEventListener('mousemove', movePoint, false);
    canvas.removeEventListener('mouseup', endPoint, false);
    canvas.removeEventListener('touchstart', startPoint, false);
    canvas.removeEventListener('touchmove', movePoint, false);
    canvas.removeEventListener('touchend', endPoint, false);

    document.getElementById('drawBtn').style.visibility = "hidden";
    document.getElementById('coordtext').style.visibility = "visible";
    document.getElementById('answerBtn').style.visibility = "hidden";
    document.getElementById('nextBtn').style.visibility = "visible";
    var chartLink = `https://peteworden.github.io/Soleil/chart.html?RA=${Math.round(cenRA*100)/100}&Dec=${Math.round(cenDec*100)/100}&mode=AEP&area=${Math.round(rgEW*200)/100}`;
    chartLinkElement.href = chartLink;
    chartLinkElement.textContent = '星図で見る'

    show_main();
}

function showNext() {
    showInfo = false;
    JD = 2459945.125 + Math.random() * 365.0;
    [cenRA, cenDec] = setCenCoord();
    [rgEW, rgNS] = setRange();
    magLim = find_magLim();
    zerosize = find_zerosize();

    canvas.removeEventListener("touchstart", ontouchstart);
    canvas.removeEventListener("touchmove", ontouchmove);
    canvas.removeEventListener('touchend', ontouchend);
    canvas.removeEventListener('touchcancel', ontouchcancel);
    canvas.removeEventListener('mousedown', onmousedown);
    canvas.removeEventListener('mousemove', onmousemove);
    canvas.removeEventListener('mouseup', onmouseup);
    canvas.removeEventListener('wheel', onwheel);

    canvas.addEventListener('mousedown', startPoint, false);
    //canvas.addEventListener('mousemove', movePoint, false);
    canvas.addEventListener('mouseup', endPoint, false);
    canvas.addEventListener('touchstart', startPoint, false);
    //canvas.addEventListener('touchmove', movePoint, false);
    canvas.addEventListener('touchend', endPoint, false);

    document.getElementById('drawBtn').style.visibility = "visible";
    document.getElementById('coordtext').style.visibility = "hidden";
    document.getElementById('answerBtn').style.visibility = "visible";
    document.getElementById('nextBtn').style.visibility = "hidden";
    chartLinkElement.href = '';
    chartLinkElement.textContent = ''

    initLocalStorage();
    show_main();
}

var startX, startY, moveX, moveY, dist_detect = Math.round(canvas.width / 25);// distはスワイプを感知する最低距離（ピクセル単位）
var baseDistance = 0;
var movedDistance = 0;
var distance = 0;
var pinchFrag = 0;

// タッチ開始
function ontouchstart(e) {
    e.preventDefault();
    pinchFrag = 0;
    startX = e.touches[0].pageX;
    startY = e.touches[0].pageY;
};

// スワイプ中またはピンチイン・ピンチアウト中
function ontouchmove(e) {
    e.preventDefault();
    var touches = e.changedTouches;
    if (touches.length.toString() == '1') {
        if (pinchFrag == 0) {
            moveX = touches[0].pageX;
            moveY = touches[0].pageY;
            if ((moveX-startX)*(moveX-startX) + (moveY-startY)*(moveY-startY) > dist_detect*dist_detect) {
                //canvas.removeEventListener("touchmove", onMouseMove);
                if (SHmode) {
                    var startRA_SH = -rgEW * (startX - canvas.offsetLeft - canvas.width  / 2) / (canvas.width  / 2);
                    var startDec_SH = -rgNS * (startY - canvas.offsetTop - canvas.height / 2) / (canvas.height / 2);
                    var [startRA, startDec] = SHtoRADec(startRA_SH, startDec_SH);
                    var moveRA_SH = -rgEW * (moveX - canvas.offsetLeft - canvas.width  / 2) / (canvas.width  / 2);
                    var moveDec_SH = -rgNS * (moveY - canvas.offsetTop - canvas.height / 2) / (canvas.height / 2);
                    var [moveRA, moveDec] = SHtoRADec(moveRA_SH, moveDec_SH);
                    cenRA = ((cenRA - moveRA + startRA) % 360 + 360) % 360;
                    cenDec = Math.min(Math.max(cenDec - moveDec + startDec, -90), 90);
                } else {
                    cenRA  = ((cenRA  + 2 * rgEW * (moveX - startX) / canvas.width) % 360 + 360) % 360;
                    cenDec = Math.min(Math.max(-90, cenDec + 2 * rgNS * (moveY - startY) / canvas.height), 90);
                }
                show_main();
                startX = moveX;
                startY = moveY;
                //canvas.addEventListener("touchmove", onMouseMove);
            }
        }
    } else {
        pinchFrag = 1;
        var x1 = touches[0].pageX ;
        var y1 = touches[0].pageY ;
        var x2 = touches[1].pageX ;
        var y2 = touches[1].pageY ;
        distance = Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
        if (baseDistance) {
            //canvas.removeEventListener("touchmove", onTouchMove);
            movedDistance = distance;
            var x3 = (x1 + x2) / 2 - canvas.offsetLeft - canvas.width / 2;
            var y3 = (y1 + y2) / 2 - canvas.offsetTop - canvas.height / 2;
            var scale = movedDistance / baseDistance;
            if (scale && scale != Infinity) {
                if (canvas.width < canvas.height) {
                    scale = Math.max(Math.min(scale, rgEW/minrg), rgNS/maxrg);
                } else {
                    scale = Math.max(Math.min(scale, rgNS/minrg), rgEW/maxrg);
                }
                rgNS /= scale;
                rgEW /= scale;
                if (SHmode) {
                    var pinchRA_SH  = -rgEW * x3 / (canvas.width  / 2);
                    var pinchDec_SH = -rgNS * y3 / (canvas.height / 2);
                    [cenRA, cenDec] = SHtoRADec(pinchRA_SH * (1 - 1 / scale), pinchDec_SH * (1 - 1 / scale));
                } else {
                    var pinchRA  = cenRA  - rgEW * x3 / (canvas.width  / 2);
                    var pinchDec = cenDec - rgNS * y3 / (canvas.height / 2);
                    cenRA  = (pinchRA  + (cenRA  - pinchRA ) / scale) % 360;
                    cenDec = Math.min(Math.max(-90, pinchDec + (cenDec - pinchDec) / scale), 90);
                }
                rgtext = `視野(左右):${Math.round(rgEW * 20) / 10}°`;
                magLim = find_magLim();
                zerosize = find_zerosize();
                show_main();
                baseDistance = distance;
                //canvas.addEventListener("touchmove", onTouchMove);
            }
        } else {
            // 基本の距離
            baseDistance = distance;
        }
    }
}

function ontouchend(e) {
    baseDistance = 0;
};

function ontouchcancel(e) {
    baseDistance = 0;
};

function onmousedown(e){
    startX = e.pageX;
    startY = e.pageY;
    canvas.addEventListener("mousemove", onmousemove);
}

function onmousemove(e) {
    //e.preventDefault();
    moveX = e.pageX;
    moveY = e.pageY;
    if ((moveX-startX)*(moveX-startX) + (moveY-startY)*(moveY-startY) > dist_detect*dist_detect) {
        if (SHmode) {
            var startRA_SH = -rgEW * (startX - canvas.offsetLeft - canvas.width  / 2) / (canvas.width  / 2);
            var startDec_SH = -rgNS* (startY - canvas.offsetTop - canvas.height / 2) / (canvas.height / 2);
            var [startRA, startDec] = SHtoRADec(startRA_SH, startDec_SH);
            var moveRA_SH = -rgEW * (moveX - canvas.offsetLeft - canvas.width  / 2) / (canvas.width  / 2);
            var moveDec_SH = -rgNS * (moveY - canvas.offsetTop - canvas.height / 2) / (canvas.height / 2);
            var [moveRA, moveDec] = SHtoRADec(moveRA_SH, moveDec_SH);
            cenRA = ((cenRA - moveRA + startRA) % 360 + 360) % 360;
            cenDec = Math.min(Math.max(cenDec - moveDec + startDec, -90), 90);
        } else {
            cenRA  = ((cenRA  + 2 * rgEW * (moveX - startX) / canvas.width ) % 360 + 360) % 360;
            cenDec =  Math.min(Math.max(cenDec + 2 * rgNS * (moveY - startY) / canvas.height, -90), 90);
        }
        show_main();
        startX = moveX;
        startY = moveY;
    }
}

function onmouseup(e){
    canvas.removeEventListener("mousemove", onmousemove);
}

function onwheel(event) {
    event.preventDefault();
    var x3 = event.pageX - canvas.offsetLeft - canvas.width / 2;
    var y3 = event.pageY - canvas.offsetTop - canvas.height / 2;
    var scale = 1 - event.deltaY * 0.0005;
    if (scale && scale != Infinity) {
        if (canvas.width < canvas.height) {
            scale = Math.max(Math.min(scale, rgEW/minrg), rgNS/maxrg);
        } else {
            scale = Math.max(Math.min(scale, rgNS/minrg), rgEW/maxrg);
        }
        rgNS /= scale;
        rgEW /= scale;
        if (SHmode) {
            var pinchRA_SH  = -rgEW * x3 / (canvas.width  / 2);
            var pinchDec_SH = -rgNS * y3 / (canvas.height / 2);
            [cenRA, cenDec] = SHtoRADec(pinchRA_SH * (1 - 1 / scale), pinchDec_SH * (1 - 1 / scale));
        } else {
            var pinchRA  = cenRA  - rgEW * x3 / (canvas.width  / 2);
            var pinchDec = cenDec - rgNS * y3 / (canvas.height / 2);
            cenRA  = (pinchRA  + (cenRA  - pinchRA ) / scale) % 360;
            cenDec = Math.min(Math.max(-90, pinchDec + (cenDec - pinchDec) / scale), 90);
        }
        rgtext = `視野(左右):${Math.round(rgEW * 20) / 10}°`;
        magLim = find_magLim();
        zerosize = find_zerosize();
        show_main();
        baseDistance = distance;
        //canvas.addEventListener("touchmove", onTouchMove);
    }
    //rgtext = `視野(左右):${Math.round(rgEW * 20) / 10}°`;
    //magLim = find_magLim(rgEW);
    //zerosize = find_zerosize();
    //show_main();
}

var moveflg = 0, Xpoint, Ypoint;
 
//初期値（サイズ、色、アルファ値）の決定
var defSize = 2, defColor = 'red';

// ストレージの初期化
var myStorage = localStorage;
window.onload = initLocalStorage();
 
// PC対応
canvas.addEventListener('mousedown', startPoint, false);
//canvas.addEventListener('mousemove', movePoint, false);
canvas.addEventListener('mouseup', endPoint, false);
// スマホ対応
canvas.addEventListener('touchstart', startPoint, false);
//canvas.addEventListener('touchmove', movePoint, false);
canvas.addEventListener('touchend', endPoint, false);
 
function startPoint(e){
    e.preventDefault();
    ctx.beginPath();
    if (e.pageX) {
        Xpoint = e.pageX - canvas.offsetLeft;
        Ypoint = e.pageY - canvas.offsetTop;
    } else {
        Xpoint = e.touches[0].pageX - canvas.offsetLeft;
        Ypoint = e.touches[0].pageY - canvas.offsetTop;
    }
    ctx.lineTo(Xpoint, Ypoint);
    canvas.addEventListener('mousemove', movePoint, false);
    canvas.addEventListener('touchmove', movePoint, false);
}
 
function movePoint(e){
    if (e.pageX) {
        Xpoint = e.pageX - canvas.offsetLeft;
        Ypoint = e.pageY - canvas.offsetTop;
    } else {
        Xpoint = e.touches[0].pageX - canvas.offsetLeft;
        Ypoint = e.touches[0].pageY - canvas.offsetTop;
    }
    if (0 <= Xpoint && Xpoint <= canvas.width && 0 <= Ypoint && Ypoint <= canvas.height) {
        if (moveflg === 0) {
            moveflg = 1;
            ctx.lineTo(Xpoint, Ypoint);
            ctx.lineCap = "round";
            ctx.lineWidth = defSize * 2;
            ctx.strokeStyle = defColor;
            ctx.stroke();
        }
        moveflg = 0;
    }
}
 
function endPoint(e) {
    if(moveflg === 0){
        ctx.lineTo(Xpoint-1, Ypoint-1);
        ctx.lineCap = "round";
        ctx.lineWidth = defSize * 2;
        ctx.strokeStyle = defColor;
        ctx.stroke();       
    }
    moveflg = 0;
    setLocalStoreage();
    canvas.removeEventListener('mousemove', movePoint, false);
    canvas.removeEventListener('touchmove', movePoint, false);
}
 
function clearCanvas(){
    if (confirm('お絵描きを初期化しますか？')) {
        initLocalStorage();
        temp = [];
        show_main();
    }
}

function initLocalStorage(){
    myStorage.setItem("__log", JSON.stringify([]));
    temp = [];
}

function setLocalStoreage(){
    var png = canvas.toDataURL();
    logs = JSON.parse(myStorage.getItem("__log"));
 
    setTimeout(function(){
        logs.unshift({png:png});
        myStorage.setItem("__log", JSON.stringify(logs));
        //temp = [];
        console.log(logs.length, temp.length);
    }, 0);
}
 
function prevCanvas(){
    logs = JSON.parse(myStorage.getItem("__log"));
    console.log(logs.length);
    if(logs.length > 0){
        /*if (temp.length == 0) {
            temp.unshift(logs.shift());
        }*/
        temp.unshift(logs.shift());
        console.log(logs.length, temp.length);
        //show_main();
        setTimeout(function(){
            myStorage.setItem("__log", JSON.stringify(logs));
            console.log(temp[0]);
            draw(temp[0]['png']);
        }, 0);
    } else {
        show_main();
    }
}

function nextCanvas(){
    var logs = JSON.parse(myStorage.getItem("__log"));
    if(temp.length > 0){
        logs.unshift(temp.shift());
        //show_main();
        setTimeout(function(){
            myStorage.setItem("__log", JSON.stringify(logs));
            console.log(logs[0]);
            draw(logs[0]['png']);
        }, 0);
    }
}
 
function draw(src) {
    var img = new Image();
    img.src = src;
 
    img.onload = function() {
        ctx.drawImage(img, 0, 0);
    }
}

function show_main(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#003';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const pi = Math.PI;
    let x, y;
    let ra, dec, mag;
    let scrRA, scrDec;
    let inFlag = false;
    infoList = [];
    
    var t = (JD - 2451545.0) / 36525;
    let theta = hourAngle(JD, lon_obs);

    if (showInfo) {
        var Astr = "";
        var hstr = "";
        //azimuth = (Math.atan2(-cos(Dec_rad)*sin(theta-RA_rad), sin(Dec_rad)*cos(lat_obs)-cos(Dec_rad)*sin(lat_obs)*cos(theta-RA_rad)) * 180/pi + 360) % 360;
        const direcs = ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東', '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西', '北'];
        var direc = direcs[Math.floor((azimuth + 11.25) / 22.5)];
        //altitude = Math.asin(sin(Dec_rad)*sin(lat_obs) + cos(Dec_rad)*cos(lat_obs)*cos(theta-RA_rad)) * 180/pi;
        Astr = '';//`方位角 ${Math.round(azimuth*10)/10}°(${direc}) `;
        hstr = '';//`高度 ${Math.round(altitude*10)/10}° `;

        //星座線
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        for (i=0; i<89; i++) {
            for (let line of constellations[i].lines) {
                let RA1 = line[0], Dec1 = line[1];
                let RA2 = line[2], Dec2 = line[3];
                let [RA1_SH, Dec1_SH] = RADec2scrAEP(RA1, Dec1);
                let [RA2_SH, Dec2_SH] = RADec2scrAEP(RA2, Dec2);
                if (Math.min(RA1_SH, RA2_SH) < rgEW && Math.max(RA1_SH, RA2_SH) > -rgEW) {
                    if (Math.min(Dec1_SH, Dec2_SH) < rgNS && Math.max(Dec1_SH, Dec2_SH) > -rgNS) {
                        if (Math.pow(RA2_SH-RA1_SH, 2) + Math.pow(Dec2_SH-Dec1_SH, 2) < 30*30) {
                            ctx.moveTo(...coordSH(RA1_SH, Dec1_SH));
                            ctx.lineTo(...coordSH(RA2_SH, Dec2_SH));
                        }
                    }
                }
            }
        }
        ctx.stroke();
    }

    //Gaia
    if (magLim > 6.5 && gaia100[0] != undefined && gaia100_help[0] != undefined) {
        let minDec = Math.max(-90, Math.min(scr2RADec(rgEW, -rgNS)[1], cenDec-rgNS));
        let maxDec = Math.min( 90, Math.max(scr2RADec(rgEW,  rgNS)[1], cenDec+rgNS));

        if (minDec == -90) {
            skyareas = [[SkyArea(0, -90), SkyArea(359.9, maxDec)]];
        } else if (maxDec == 90) {
            skyareas = [[SkyArea(0, minDec), SkyArea(359.9, 89.9)]];
        } else {
            let RArange1 = (scr2RADec(rgEW,  rgNS)[0] - cenRA + 360) % 360;
            let RArange2 = (scr2RADec(rgEW,     0)[0] - cenRA + 360) % 360;
            let RArange3 = (scr2RADec(rgEW, -rgNS)[0] - cenRA + 360) % 360;
            let RArange = Math.max(RArange1, RArange2, RArange3);

            if (cenRA - RArange < 0) {
                skyareas = [[SkyArea(                0, minDec), SkyArea(cenRA+RArange, minDec)],
                            [SkyArea(cenRA-RArange+360, minDec), SkyArea(        359.9, minDec)]];
                for (let i=1; i<=Math.floor(maxDec)-Math.floor(minDec); i++) {
                    skyareas.push([skyareas[0][0]+360*i, skyareas[0][1]+360*i]);
                    skyareas.push([skyareas[1][0]+360*i, skyareas[1][1]+360*i]);
                }
            } else if (cenRA + RArange > 360) {
                skyareas = [[SkyArea(            0, minDec), SkyArea(cenRA+RArange, minDec)],
                            [SkyArea(cenRA-RArange, minDec), SkyArea(        359.9, minDec)]];
                for (let i=1; i<=Math.floor(maxDec)-Math.floor(minDec); i++) {
                    skyareas.push([skyareas[0][0]+360*i, skyareas[0][1]+360*i]);
                    skyareas.push([skyareas[1][0]+360*i, skyareas[1][1]+360*i]);
                }
            } else {
                skyareas = [[SkyArea(cenRA-RArange, minDec), SkyArea(cenRA+RArange, minDec)]];
                for (let i=1; i<=Math.floor(maxDec)-Math.floor(minDec); i++) {
                    skyareas.push([skyareas[0][0]+360*i, skyareas[0][1]+360*i]);
                }
            }
        }
        drawGaia(gaia100, gaia100_help, skyareas);
        if (magLim > 10 && gaia101_110[0] != undefined && gaia101_110_help[0] != undefined) {
            drawGaia(gaia101_110, gaia101_110_help, skyareas);
            if (magLim > 11 && gaia111_115[0] != undefined && gaia111_115_help[0] != undefined) {
                drawGaia(gaia111_115, gaia111_115_help, skyareas);
            }
        }
        // drawStars(skyareas);
        // if (magLim > 10 && Tycho1011.length != 0 && Help1011.length != 0) {
        //     drawStars1011(skyareas);
        // }
    }

    ctx.fillStyle = starColor;
    function drawHIPstar(x, y, mag, c) {
        drawFilledCircle(x, y, size(mag), c);
        //回折による光の筋みたいなのを作りたい
    }
    var hips_magfilter = hips.filter(hip => hip.mag <= magLim);
    for (i=0; i<hips_magfilter.length; i++){
        let hip = hips_magfilter[i];
        [x, y, inFlag] = xyIfInCanvas(hip.ra, hip.dec);
        if (inFlag) drawHIPstar(x, y, hip.mag, bv2color(hip.bv));
    }

    if (showInfo) {
        writeStarNames();

        ctx.font = '16px serif';
        ctx.strokeStyle = 'orange';
        ctx.fillStyle = 'orange';

        drawMessier();
        drawRecs();

        var RAtext = `赤経 ${Math.floor(cenRA/15)}h ${Math.round((cenRA-15*Math.floor(cenRA/15))*4*10)/10}m `;
        if (cenDec >= 0) {
            var Dectext = `赤緯 +${Math.floor(cenDec)}° ${Math.round((cenDec-Math.floor(cenDec))*60)}' (J2000.0) `;
        } else {
            var Dectext = `赤緯 -${Math.floor(-cenDec)}° ${Math.round((-cenDec-Math.floor(-cenDec))*60)}' (J2000.0) `;
        }
        
        let centerConstellation = determineConstellation(cenRA, cenDec);
        var coordtext = `${centerConstellation}　${rgtext}　${magLimtext}<br>${RAtext}${Dectext}<br>${Astr}${hstr}`;
        document.getElementById("coordtext").innerHTML = coordtext;
    }

    function SkyArea(RA, Dec) { //(RA, Dec)はHelper2ndで↓行目（0始まり）の行数からのブロックに入ってる
        return parseInt(360 * Math.floor(Dec + 90) + Math.floor(RA));
    }

    function RApos(RA) { //PythonでのadjustRA(RA)-piccenRAに相当
        return (RA + 540 - cenRA) % 360 - 180;
    }

    function coord (RA, Dec) {
        var x = canvas.width * (0.5 - RApos(RA) / rgEW / 2);
        var y = canvas.height * (0.5 - (Dec - cenDec) / rgNS / 2);
        return [x, y];
    }

    function angleSH (RA, Dec) { //deg
        if (RA == cenRA && Dec == cenDec) {
            var RA_SH = 0;
            var Dec_SH = 0;
        } else {
            RA *= pi/180;
            Dec *= pi/180;
            
            var cenRA_rad = cenRA * pi/180;
            var cenDec_rad = cenDec * pi/180;
            
            var a = sin(cenDec_rad)*cos(Dec)*cos(RA-cenRA_rad) - cos(cenDec_rad)*sin(Dec);
            var b =                 cos(Dec)*sin(RA-cenRA_rad);
            var c = cos(cenDec_rad)*cos(Dec)*cos(RA-cenRA_rad) + sin(cenDec_rad)*sin(Dec);

            var r = Math.acos(c) * 180/pi; //中心からの角距離, deg
            var thetaSH = Math.atan2(b, a); //南（下）向きから時計回り
            var RA_SH = r * sin(thetaSH);
            var Dec_SH = - r * cos(thetaSH);
        }
        return [RA_SH, Dec_SH];
    }

    function SHtoRADec (RA_SH, Dec_SH) { //deg 画面中心を原点とし、各軸の向きはいつも通り
        if (RA_SH == 0 && Dec_SH == 0) {
            var RA = cenRA;
            var Dec = cenDec;
        } else {
            var thetaSH = Math.atan2(RA_SH, -Dec_SH);
            var r = Math.sqrt(RA_SH*RA_SH + Dec_SH*Dec_SH) * pi / 180;
            
            var cenRA_rad = cenRA * pi/180;
            var cenDec_rad = cenDec * pi/180;
            
            var a =  sin(cenDec_rad)*sin(r)*cos(thetaSH) + cos(cenDec_rad)*cos(r);
            var b =                  sin(r)*sin(thetaSH);
            var c = -cos(cenDec_rad)*sin(r)*cos(thetaSH) + sin(cenDec_rad)*cos(r);

            var Dec = Math.asin(c) * 180/pi;
            var RA = ((Math.atan2(b, a) * 180/pi + cenRA) % 360 + 360) % 360;
        }
        return [RA, Dec];
    }

    function coordSH (RA_SH, Dec_SH) {
        var x = canvas.width * (0.5 - RA_SH / rgEW / 2);
        var y = canvas.height * (0.5 - Dec_SH / rgNS / 2);
        return [x, y];
    }
    
    function xyIfInCanvas(ra, dec) {
        let scrRA, scrDec;
        let x, y;
        let inFlag = false;
        [scrRA, scrDec] = RADec2scrAEP(ra, dec);
        if (Math.abs(scrRA) < rgEW && Math.abs(scrDec) < rgNS) {
            [x, y] = coordSH(scrRA, scrDec);
            inFlag = true;
        }
        return [x, y, inFlag];
    }

    function RADec2scrAEP (RA, Dec) { //deg
        if (RA == cenRA && Dec == cenDec) {
            return [0, 0];
        } else {
            RA *= deg2rad;
            Dec *= deg2rad;

            let cenRA_rad = cenRA * deg2rad;
            let cenDec_rad = cenDec * deg2rad;

            let a = sin(cenDec_rad)*cos(Dec)*cos(RA-cenRA_rad) - cos(cenDec_rad)*sin(Dec);
            let b =                 cos(Dec)*sin(RA-cenRA_rad);
            let c = cos(cenDec_rad)*cos(Dec)*cos(RA-cenRA_rad) + sin(cenDec_rad)*sin(Dec);

            let r = Math.acos(c) * rad2deg; //中心からの角距離, deg
            let thetaSH = Math.atan2(b, a); //南（下）向きから時計回り
            let scrRA = r * sin(thetaSH);
            let scrDec = - r * cos(thetaSH);
            return [scrRA, scrDec];
        }
    }

    function size(mag) {
        if (mag > magLim) {
            return zerosize / (magLim + 1);
        } else {
            return zerosize / (magLim + 1) + zerosize * 0.8 * (magLim / (magLim + 1)) * Math.pow((magLim - mag) / magLim, 1.3);
            //return zerosize * (magLim + 1 - mag) / (magLim + 1);
        }
    }
    
    function bv2color(bv) {
        let c;
        if (darker) {
            c = starColor;
        } else if (bv == -10) {
            c = starColor;
        } else {
            bv = Math.max(-0.4, Math.min(2.0, parseFloat(bv)));
            let r = 0, g = 0, b = 0;
            if (bv < 0.4) r = 0.5 + 0.5 * (bv + 0.4) / 0.8;
            else r = 1.0;
            if (bv < 0) g = 1.0 + bv;
            else if (bv < 0.4) g = 1.0;
            else g = 1.0 - 0.75 * (bv - 0.4) / 1.6;
            if (bv < 0.4) b = 1.0;
            else b = 1.0 - (bv - 0.4) / 1.6;

            r = Math.round(r * 255);
            g = Math.round(g * 255);
            b = Math.round(b * 255);
            c = `rgba(${r}, ${g}, ${b}, 1)`;
        }
        return c;
    }

    function determineConstellation(cenRA, cenDec) {
        let a = Array(89).fill(0);
        for (let i=0; i<boundary.length; i+=5) {
            let Dec1 = boundary[i+2];
            let Dec2 = boundary[i+4];
            if (Math.min(Dec1, Dec2) <= cenDec && cenDec < Math.max(Dec1, Dec2)) {
                let RA1 = boundary[i+1];
                let RA2 = boundary[i+3];
                if (cenRA >= (cenDec-Dec1) * (RA2-RA1) / (Dec2-Dec1) + RA1) {
                    let No = boundary[i] - 1;
                    a[No] = (a[No] + 1) % 2;
                }
            }
        }

        let centerConstellation = "";
        for (let i=0; i<89; i++) {
            if (a[i] == 1) {
                centerConstellation = constellations[i].JPNname + "座  ";
                break;
            }
            if (cenDec > 0) {
                centerConstellation = "こぐま座  ";
            } else {
                centerConstellation = "はちぶんぎ座  ";
            }
        }
        return centerConstellation;
    }

    function drawLines(RA1, Dec1, RA2, Dec2, a){
        ctx.lineWidth = 3;
        var [x1, y1] = coord(RA1+a, Dec1);
        var [x2, y2] = coord(RA2+a, Dec2);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
    }

    function drawFilledCircle (x, y, r, c=starColor) {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * pi, false);
        ctx.fill();
    }

    function drawGaia(gaia, help, skyareas) {
        ctx.fillStyle = starColor;
        ctx.beginPath();
        for (let arearange of skyareas) {
            // help[0] = 0
            // help[1<=i<180*360] = i番目の領域に入る直前までの星の数
            // help[180*360] = gaia.length
            let st = help[arearange[0]];
            let fi = help[arearange[1]+1];
            for (i=st; i<fi; i++) {
                let data = gaia[i];
                let mag = data[2] * 0.1;
                if (mag >= magLim) continue;
                let ra = data[0] * 0.001;
                let dec = data[1] * 0.001;
                let [x, y, inFlag] = xyIfInCanvas(ra, dec);
                if (inFlag) {
                    ctx.moveTo(x, y);
                    ctx.arc(x, y, size(mag), 0, 2 * pi, false);
                }
            }
        }
        ctx.fill();
    }

    function writeStarNames () {
        const tier_range = [180, 90, 60, 40, 30, 30];
        let tierLimitUmu = starNameElem[1].checked;
        ctx.strokeStyle = textColor;
        ctx.fillStyle = textColor;
        for (i=0; i<starNames.length; i++){
            let d = starNames[i]
            let tier = d.tier
            if (tierLimitUmu && tier > 1) continue;
            if (2*Math.max(rgNS, rgEW) > tier_range[tier-1]) continue;
            let ra = d.ra;
            let dec = d.dec;
            [x, y, inFlag] = xyIfInCanvas(ra, dec);
            if (inFlag) {
                let size = 20 - 1 * tier;
                if (d.jpnname) {
                    drawObjects(d.jpnname, x, y+15, 0, fontsize=size);
                } else {
                    drawObjects(d.name, x, y+15, 0, fontsize=size);
                }
            }
        }
    }

    //入っていることは前提
    function drawObjects (name, x, y, type, fontsize=16, fontname='serif') {
        ctx.beginPath();
        /*
        Gx       Galaxy 銀河
        OC       Open star cluster 散開星団
        Gb       Globular star cluster, usually in the Milky Way Galaxy 球状星団
        Nb       Bright emission or reflection nebula 散光星雲、超新星残骸
        Pl       Planetary nebula 惑星状星雲
        C+N      Cluster associated with nebulosity
        Ast      Asterism or group of a few stars
        Kt       Knot or nebulous region in an external galaxy
        TS       Triple star    (was *** in the CDS table version)
        DS       Double star    (was ** in the CDS version)
        SS       Single star    (was * in the CDS version)
        ?        Uncertain type or may not exist
        U        Unidentified at the place given, or type unknown (was blank in CDS v.)
        -        Object called nonexistent in the RNGC (Sulentic and Tifft 1973)
        PD       Photographic plate defect
        */
        if (type == "Gx") { //銀河
            ctx.strokeRect(x-8, y-4, 16, 8);
        } else if (type == "Nb" || type == "Pl" || type == "Kt") { //星雲
            ctx.moveTo(x  , y-5);
            ctx.lineTo(x+5, y  );
            ctx.lineTo(x  , y+5);
            ctx.lineTo(x-5, y  );
            ctx.lineTo(x  , y-5);
        } else if (type == "Gb") {
            ctx.arc(x, y, 5, 0, 2 * pi, false);
        } else if (type == "OC" || type == "C+N" || type == "Ast" || type == "TS" || type == "DS") {
            ctx.moveTo(x  , y-6);
            ctx.lineTo(x-5, y+3);
            ctx.lineTo(x+5, y+3);
            ctx.lineTo(x  , y-6);
        } else if (type == 0) {
            1;
        } else {
            ctx.moveTo(x-4, y-4);
            ctx.lineTo(x+4, y+4);
            ctx.moveTo(x-4, y+4);
            ctx.lineTo(x+4, y-4);
        }
        ctx.stroke();
        ctx.font = fontsize + 'px ' + fontname;
        ctx.fillText(name, x+5, y-5);
    }

    function drawJsonObjects (data, func, color=objectColor) {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        for (i=0; i<data.length; i++){
            let name = data[i].name;
            if (name == '') continue;
            let ra = rahm2deg(data[i].ra);
            let dec = decdm2deg(data[i].dec);
            [x, y, inFlag] = xyIfInCanvas(ra, dec);
            if (inFlag) {
                func(i, name, x, y);
            }
        }
    }

    function drawMessier () {
        drawJsonObjects(messier, function(i, name, x, y) {
            drawObjects(name, x, y, messier[i].class);
            infoList.push([name, x, y]);
        });
    }

    function drawRecs () {
        drawJsonObjects(recs, function(i, name, x, y) {
            drawObjects(name, x, y, recs[i].class);
            infoList.push([name, x, y]);
        })
    }

    //入っていることは前提
    function DrawObjects(name, x, y, type) {
        ctx.beginPath();
        if (type == "1") { //銀河
            ctx.strokeRect(x-8, y-4, 16, 8);
        } else if (type == "3") { //星雲
            ctx.arc(x, y, 5, 0, 2 * pi, false);
        } else { //星団、M40:二重星、M73
            ctx.moveTo(x  , y-6);
            ctx.lineTo(x-5, y+3);
            ctx.lineTo(x+5, y+3);
            ctx.lineTo(x  , y-6);
        }
        ctx.stroke();
        ctx.fillText(name, x+5, y-5);
    }
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

function rahm2deg(rahmtext) {
    let rahm = rahmtext.split(' ').map(Number);
    return rahm[0] * 15 + rahm[1] * 0.25;
}

function decdm2deg(decdmtext) {
    let decdm = decdmtext.split(' ').map(Number);
    let dec = Math.abs(decdm[0]) + decdm[1] / 60;
    if (decdmtext[0] == '-') {
        dec *= -1;
    }
    return dec;
}

function hourAngle(JD_TT, lon_obs) {
    let t = (JD_TT - 2451545.0) / 36525;
    let ans = ((24110.54841 + 8640184.812866*t + 0.093104*t**2 - 0.0000062*t**3)/86400 % 1 + 1.00273781 * ((JD_TT-0.0008-2451544.5)%1)) * 2*pi + lon_obs - 0.0203; //rad
    return ans;
}

function RADec2Ah (RA, Dec, theta) { //deg
    RA *= deg2rad;
    Dec *= deg2rad;
    let [x, y, z] = Ry([sin(Dec), cos(Dec)*sin(theta-RA), cos(Dec)*cos(theta-RA)], -lat_obs);
    let A = (Math.atan2(-y, x) * rad2deg + 360) % 360;
    let h = Math.asin(z) * rad2deg;
    return [A, h]; //deg
}

function Ah2RADec (A, h, theta) {
    A *= deg2rad;
    h *= deg2rad;
    let [x, y, z] = Ry([cos(h)*cos(A), -cos(h)*sin(A), sin(h)], lat_obs);
    let RA = ((theta - Math.atan2(y, z)) * rad2deg + 360) % 360;
    let Dec = Math.asin(x) * rad2deg;
    return [RA, Dec]; //deg
}

function scr2RADec (scrRA, scrDec) { //deg 画面中心を原点とし、各軸の向きはいつも通り
    if (scrRA == 0 && scrDec == 0) {
        return [cenRA, cenDec];
    } else {
        let thetaSH = Math.atan2(scrRA, -scrDec);
        let r = Math.sqrt(scrRA*scrRA + scrDec*scrDec) * deg2rad;
        let cenDec_rad = cenDec * deg2rad;

        let a =  sin(cenDec_rad)*sin(r)*cos(thetaSH) + cos(cenDec_rad)*cos(r);
        let b =                  sin(r)*sin(thetaSH);
        let c = -cos(cenDec_rad)*sin(r)*cos(thetaSH) + sin(cenDec_rad)*cos(r);

        let dec = Math.asin(c) * rad2deg;
        let ra = ((Math.atan2(b, a) * rad2deg + cenRA) % 360 + 360) % 360;
        return [ra, dec]
    }
}

function SHtoAh (scrRA, scrDec) { //deg 画面中心を原点とし、各軸の向きはいつも通り
    let A, h;
    if (scrRA == 0 && scrDec == 0) {
        A = cenAzm;
        h = cenAlt;
    } else {
        let thetaSH = Math.atan2(scrRA, -scrDec); //地球から見て下から始めて時計回り
        let r = Math.sqrt(scrRA*scrRA + scrDec*scrDec) * deg2rad;

        let cenAzm_rad = cenAzm * deg2rad;
        let cenAlt_rad = cenAlt * deg2rad;
        let [x, y, z] = Rz(Ry([sin(r)*cos(thetaSH), sin(r)*sin(thetaSH), cos(r)], pi/2-cenAlt_rad), -cenAzm_rad);
        h = Math.asin(z) * rad2deg;
        A = (Math.atan2(-y, x) * rad2deg % 360 + 360) % 360;
    }
    return [A, h];
}

function SHtoRADec (RA_SH, Dec_SH) { //deg 画面中心を原点とし、各軸の向きはいつも通り
    if (RA_SH == 0 && Dec_SH == 0) {
        var RA = cenRA;
        var Dec = cenDec;
    } else {
        var thetaSH = Math.atan2(RA_SH, -Dec_SH);
        var r = Math.sqrt(RA_SH*RA_SH + Dec_SH*Dec_SH) * pi / 180;
        
        var cenRA_rad = cenRA * pi/180;
        var cenDec_rad = cenDec * pi/180;
        
        var a =  sin(cenDec_rad)*sin(r)*cos(thetaSH) + cos(cenDec_rad)*cos(r);
        var b =                  sin(r)*sin(thetaSH);
        var c = -cos(cenDec_rad)*sin(r)*cos(thetaSH) + sin(cenDec_rad)*cos(r);

        var Dec = Math.asin(c) * 180/pi;
        var RA = ((Math.atan2(b, a) * 180/pi + cenRA) % 360 + 360) % 360;
    }
    return [RA, Dec];
}

function sin(a){return Math.sin(a)}
function cos(a){return Math.cos(a)}

function loadFiles() {
    // 決めるもの
    // hips
    // BSCRAary, BSCDecary, FSs, Bayers, BayerNums
    // ENGplanets, JPNplanets, planets, document.getElementById('observer')
    // hip_65, constellations, ...

    function xhrHIP(data) {
        const hipData = data.split(',').map(Number);
        for (i=0; i<hipData.length; i+=4){
            hips.push({
                ra: hipData[i] * 0.001,
                dec: hipData[i+1] * 0.001,
                mag: hipData[i+2] * 0.1,
                bv: hipData[i+3] * 0.1 //割って-10（もともと-100）ならNaN
            });
        }
    }

    //Bayer
    function xhrBSC(data) {
        const BSC = data.split(',');
        BSCnum = BSC.length / 6;
        BSCRAary = Array(BSCnum);
        BSCDecary = Array(BSCnum);
        FSs = Array(BSCnum);
        Bayers = Array(BSCnum);
        BayerNums = Array(BSCnum);
        for (i=0; i<BSCnum; i++){
            BSCRAary[i] = +BSC[6*i];
            BSCDecary[i] = +BSC[6*i+1];
            FSs[i] = BSC[6*i+2];
            Bayers[i] = BSC[6*i+3];
            BayerNums[i] = BSC[6*i+4];
        }
    }

    if (online) {
        function loadFile(filename, func, impflag=false) {
            let url_load = "https://peteworden.github.io/Soleil/data/" + filename + ".txt";
            let xhr = new XMLHttpRequest();
            xhr.open('GET', url_load);
            xhr.send();
            xhr.onreadystatechange = function() {
                if(xhr.readyState === 4 && xhr.status === 200) {
                    func(xhr.responseText);
                    xhrcheck++;
                    if (impflag) {
                       xhrimpcheck++;
                    }
                    loaded.push(filename);
                    console.log(`${xhrcheck} ${defaultcheck} ${filename}.txt`);
                    show_initial();
                    return 0;
                }
            }
        }

        function loadJsonData(filename, func, impflag=false) {
            fetch(`https://peteworden.github.io/Soleil/data/${filename}.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                func(data)
                xhrcheck++;
                if (impflag) {
                    xhrimpcheck++;
                }
                loaded.push(filename)
                console.log(`${xhrcheck} ${defaultcheck} ${filename}.json`);
                show_initial();
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });
        }
        
        function loadCsvData(filename, func, impflag=false) {
            fetch(`https://peteworden.github.io/Soleil/data/${filename}.csv`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(text => {
                let rows = text.trim().split('\n');
                let data = rows.map(row => row.split(",").map(Number));
                func(data)
                xhrcheck++;
                if (impflag) {
                    xhrimpcheck++;
                }
                loaded.push(filename)
                console.log(`${xhrcheck} ${defaultcheck} ${filename}.csv`);
                show_initial();
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });
        }

        // デバッグ用。テキストファイル専用。getfileに関連するjsの2行をコメントアウトする。
        // 公開時コメントアウトの解除を忘れないように！
        // 例
        // document.getElementById('getFile').addEventListener('change', function(event) {
        //     loadFileForDebug(event, 'localhip', xhrHIP, true)
        // })
        function loadFileForDebug(event, filename, func, impflag=false) {
            let fr = new FileReader();
            fr.onload = function () {
                const content = fr.result;
                func(content);
                xhrcheck++;
                if (impflag) {
                   xhrimpcheck++;
                }
                loaded.push(filename);
                console.log(`${xhrcheck} ${defaultcheck} ${filename}.txt`);
                show_initial();
            }
            fr.readAsText(event.target.files[0]);
        }
        function loadCSVForDebug(event, filename,func, impflag=false) {
            const file = e.target.files[0];
            if (file) {
                const fr = new FileReader();
                fr.onload = function(event) {
                    const csvText = event.target.result;
                    const data = parseCSV(csvText);
                    func(data)
                    xhrcheck++;
                    if (impflag) {
                       xhrimpcheck++;
                    }
                    loaded.push(filename);
                    console.log(`${xhrcheck} ${defaultcheck} ${filename}.txt`);
                    show_initial();
                };
                reader.readAsText(file);
            }
        }

        //HIP
        loadFile("hip_65", xhrHIP, true);

        loadJsonData('constellation', (data) => {
            constellations = data;
        }, true);

        //星座境界線
        loadFile("constellation_boundaries", (data) => {
            boundary = data.split(',').map(Number);
        }, true);

        loadJsonData('starnames', (data) => {
            starNames = data;
        }, true);

        loadJsonData('messier', (data) => {
            messier = data;
        }, true);

        //gaia offlineはまだ
        loadCsvData('gaia_-100', (data) => {
            gaia100 = data;
        });
        loadFile("gaia_-100_helper", (data) => {
            gaia100_help = data.split(',').map(Number);
        });
        loadCsvData('gaia_101-110', (data) => {
            gaia101_110 = data;
        });
        loadFile("gaia_101-110_helper", (data) => {
            gaia101_110_help = data.split(',').map(Number);
        });
        loadCsvData('gaia_111-115', (data) => {
            gaia111_115 = data;
        });
        loadFile("gaia_111-115_helper", (data) => {
            gaia111_115_help = data.split(',').map(Number);
        });

        //Bayer
        loadFile("brights", xhrBSC);

        loadJsonData('rec', (data) => {
            recs = data;
        });

        // NGC天体とIC天体
        loadFile("ngc", (data) => {
            NGC = data.split(',');
        });
    }
}

document.body.appendChild(canvas);