//2023/12/08~

const starColor = '#FFF'
const yellowColor = 'yellow'
//'yellow'は全部yellowColorにする

const pi = Math.PI;

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
var [cenRA, cenDec] = setCenCoord();

function setRange() {
    if (canvas.width < canvas.height) {
        var rgLR = 10.0 + Math.random() * 15.0;
        var rgTB = rgLR * canvas.height / canvas.width;
    } else {
        var rgTB = 10.0 + Math.random() * 15.0;
        var rgLR = rgTB * canvas.width / canvas.height;
    }
    return [rgLR, rgTB];
}
var [rgLR, rgTB] = setRange();

const minrg = 0.3;
const maxrg = 90;

var rgtext = `視野(左右):${Math.round(rgLR * 20) / 10}°`;

var magLimtext;
var magLimLim = 11;
function find_magLim() {
    var magLim = Math.min(Math.max(13.5 - 1.8 * Math.log(Math.min(rgLR, rgTB)), 4), magLimLim);
    //var magLim = 11;
    magLimtext = `~${Math.round(magLim * 10) / 10}等級`;
    return magLim;
}
var magLim = find_magLim();

function find_zerosize() {
    return 13 - 2.4 * Math.log(Math.min(rgLR, rgTB) + 3);
}
var zerosize = find_zerosize();

var SHmode = true;

var ObsPlanet="地球", Obs_num=3, lat_obs=35, lon_obs=135;

var xhrcheck = 0;

function loadFile(filename, func, go) {
    var url = `https://peteworden.github.io/Soleil/${filename}.txt`;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.send();
    xhr.onreadystatechange = function() {
        if(xhr.readyState === 4 && xhr.status === 200) {
            func(xhr.responseText);
            console.log(filename + " ready");
            xhrcheck++;
            if (go == 1) {
                show_initial();
            } else {
                if (xhrcheck == 12) {
                    show_main();
                }
            }
            return 0;
        }
    }
}

//HIP
var HIPRAary = Array(1);
var HIPDecary = Array(1);
var HIPmagary = Array(1);
loadFile("StarsNewHIP_to6_5_set", xhrHIP, 1);
function xhrHIP(data) {
    const DataAry = data.split(',');
    var num_of_stars = DataAry.length / 3;
    HIPRAary = Array(num_of_stars);
    HIPDecary = Array(num_of_stars);
    HIPmagary = Array(num_of_stars);
    for (i=0; i<num_of_stars; i++){
        HIPRAary[i] = parseFloat(DataAry[3*i]);
        HIPDecary[i] = parseFloat(DataAry[3*i+1]);
        HIPmagary[i] = parseFloat(DataAry[3*i+2]);
    }
}

//Tycho
var Tycho = [];
loadFile("StarsNew-Tycho-to10-2nd_forJS", xhrTycho, 1);
function xhrTycho(data) {
    Tycho = data.split(',');
}


//Tycho helper
var Help = [];
loadFile("TychoSearchHelper2nd_forJS", xhrHelp, 1);
function xhrHelp(data) {
    Help = data.split(',');
}

//Tycho 10~11 mag
var Tycho1011 = [];
loadFile("StarsNew-Tycho-from10to11-2nd_forJS", xhrTycho1011, 1);
function xhrTycho1011(data) {
    Tycho1011 = data.split(',');
}


//Tycho helper 10~11 mag
var Help1011 = [];
loadFile("TychoSearchHelper-from10to11-2nd_forJS", xhrHelp1011, 1);
function xhrHelp1011(data) {
    Help1011 = data.split(',');
}

// メシエ天体
var messier  = Array(3 * 110);
loadFile("messier_forJS", xhrMessier, 1);
function xhrMessier(data) {
    messier = data.split(',');
}

// NGC天体
var NGC = [];
loadFile("NGC_forJS", xhrNGC, 1);
function xhrNGC(data) {
    NGC = data.split(',');
}

//星座名
var CLnames = [];
loadFile("ConstellationList", xhrCLnames, 1);
function xhrCLnames(data) {
    CLnames = data.split('\r\n');
}

//星座の位置
var constPos = [];
loadFile("ConstellationPositionNew_forJS", xhrCLpos, 1);
function xhrCLpos(data) {
    constPos = data.split(',');
}

//星座線
var lines = [];
loadFile("Lines_light_forJS", xhrCLlines, 1);
function xhrCLlines(data) {
    lines = data.split(',');
}

//星座境界線
var boundary = [];
loadFile("boundary_light_forJS", xhrCLboundary, 1);
function xhrCLboundary(data) {
    boundary = data.split(',');
}


function show_initial(){
    if (xhrcheck == 11){
        console.log(xhrcheck);
        show_main();
    } else {
        console.log(xhrcheck);
    }
}

var ENGplanets = ['Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Moon', 'Ceres', 'Vesta'];
var JPNplanets = ['太陽',  '水星', '金星', '地球', '火星',  '木星', '土星', '天王星', '海王星', '月', 'Ceres', 'Vesta'];
var Ms, ws, lon_moon, lat_moon, dist_Moon, dist_Sun;


const popularList = ["NGC869", "NGC884", "コリンダー399", "アルビレオ", "NGC5139", "NGC2264"];

var JD = 2459945.125 + Math.random() * 365.0;
var azimuth = Math.random() * 360.0;
var altitude = 90.0 - Math.random() * (100.0 - rgTB);

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
    var chartLink = `https://peteworden.github.io/Soleil/chart.html?RA=${Math.round(cenRA*100)/100}&Dec=${Math.round(cenDec*100)/100}&SH=1&to11=1&area=${Math.round(rgLR*200)/100}`;
    chartLinkElement.href = chartLink;
    chartLinkElement.textContent = '星図で見る'

    show_main();
}

function showNext() {
    showInfo = false;
    JD = 2459945.125 + Math.random() * 365.0;
    [cenRA, cenDec] = setCenCoord();
    [rgLR, rgTB] = setRange();
    magLim = find_magLim();
    zerosize = find_zerosize();

    canvas.removeEventListener("touchstart", ontouchstart);
    canvas.removeEventListener("touchmove", ontouchmove);
    canvas.removeEventListener('touchend', ontouchend);
    canvas.removeEventListener('touchcancel', ontouchcancel);
    canvas.removeEventListener('mousedown', onmousedown);
    canvas.removeEventListener('mousemove', onmousemove);
    canvas.removeEventListener('wheel', onwheel);
    canvas.removeEventListener('wheel', onwheel);

    canvas.addEventListener('mousedown', startPoint, false);
    canvas.addEventListener('mousemove', movePoint, false);
    canvas.addEventListener('mouseup', endPoint, false);
    canvas.addEventListener('touchstart', startPoint, false);
    canvas.addEventListener('touchmove', movePoint, false);
    canvas.addEventListener('touchend', endPoint, false);

    document.getElementById('drawBtn').style.visibility = "visible";
    document.getElementById('coordtext').style.visibility = "hidden";
    document.getElementById('answerBtn').style.visibility = "visible";
    document.getElementById('nextBtn').style.visibility = "hidden";
    chartLinkElement.href = '';
    chartLinkElement.textContent = ''

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
                    var startRA_SH = -rgLR * (startX - canvas.offsetLeft - canvas.width  / 2) / (canvas.width  / 2);
                    var startDec_SH = -rgTB * (startY - canvas.offsetTop - canvas.height / 2) / (canvas.height / 2);
                    var [startRA, startDec] = SHtoRADec(startRA_SH, startDec_SH);
                    var moveRA_SH = -rgLR * (moveX - canvas.offsetLeft - canvas.width  / 2) / (canvas.width  / 2);
                    var moveDec_SH = -rgTB * (moveY - canvas.offsetTop - canvas.height / 2) / (canvas.height / 2);
                    var [moveRA, moveDec] = SHtoRADec(moveRA_SH, moveDec_SH);
                    cenRA = ((cenRA - moveRA + startRA) % 360 + 360) % 360;
                    cenDec = Math.min(Math.max(cenDec - moveDec + startDec, -90), 90);
                } else {
                    cenRA  = ((cenRA  + 2 * rgLR * (moveX - startX) / canvas.width) % 360 + 360) % 360;
                    cenDec = Math.min(Math.max(-90, cenDec + 2 * rgTB * (moveY - startY) / canvas.height), 90);
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
                    scale = Math.max(Math.min(scale, rgLR/minrg), rgTS/maxrg);
                } else {
                    scale = Math.max(Math.min(scale, rgTS/minrg), rgLR/maxrg);
                }
                rgTB /= scale;
                rgLR /= scale;
                if (SHmode) {
                    var pinchRA_SH  = -rgLR * x3 / (canvas.width  / 2);
                    var pinchDec_SH = -rgTB * y3 / (canvas.height / 2);
                    [cenRA, cenDec] = SHtoRADec(pinchRA_SH * (1 - 1 / scale), pinchDec_SH * (1 - 1 / scale));
                } else {
                    var pinchRA  = cenRA  - rgLR * x3 / (canvas.width  / 2);
                    var pinchDec = cenDec - rgTB * y3 / (canvas.height / 2);
                    cenRA  = (pinchRA  + (cenRA  - pinchRA ) / scale) % 360;
                    cenDec = Math.min(Math.max(-90, pinchDec + (cenDec - pinchDec) / scale), 90);
                }
                rgtext = `視野(左右):${Math.round(rgLR * 20) / 10}°`;
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
            var startRA_SH = -rgLR * (startX - canvas.offsetLeft - canvas.width  / 2) / (canvas.width  / 2);
            var startDec_SH = -rgTB* (startY - canvas.offsetTop - canvas.height / 2) / (canvas.height / 2);
            var [startRA, startDec] = SHtoRADec(startRA_SH, startDec_SH);
            var moveRA_SH = -rgLR * (moveX - canvas.offsetLeft - canvas.width  / 2) / (canvas.width  / 2);
            var moveDec_SH = -rgTB * (moveY - canvas.offsetTop - canvas.height / 2) / (canvas.height / 2);
            var [moveRA, moveDec] = SHtoRADec(moveRA_SH, moveDec_SH);
            cenRA = ((cenRA - moveRA + startRA) % 360 + 360) % 360;
            cenDec = Math.min(Math.max(cenDec - moveDec + startDec, -90), 90);
        } else {
            cenRA  = ((cenRA  + 2 * rgLR * (moveX - startX) / canvas.width ) % 360 + 360) % 360;
            cenDec =  Math.min(Math.max(cenDec + 2 * rgTB * (moveY - startY) / canvas.height, -90), 90);
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
            scale = Math.max(Math.min(scale, rgLR/minrg), rgTB/maxrg);
        } else {
            scale = Math.max(Math.min(scale, rgTB/minrg), rgLR/maxrg);
        }
        rgTB /= scale;
        rgLR /= scale;
        if (SHmode) {
            var pinchRA_SH  = -rgLR * x3 / (canvas.width  / 2);
            var pinchDec_SH = -rgTB * y3 / (canvas.height / 2);
            [cenRA, cenDec] = SHtoRADec(pinchRA_SH * (1 - 1 / scale), pinchDec_SH * (1 - 1 / scale));
        } else {
            var pinchRA  = cenRA  - rgLR * x3 / (canvas.width  / 2);
            var pinchDec = cenDec - rgTB * y3 / (canvas.height / 2);
            cenRA  = (pinchRA  + (cenRA  - pinchRA ) / scale) % 360;
            cenDec = Math.min(Math.max(-90, pinchDec + (cenDec - pinchDec) / scale), 90);
        }
        rgtext = `視野(左右):${Math.round(rgLR * 20) / 10}°`;
        magLim = find_magLim();
        zerosize = find_zerosize();
        show_main();
        baseDistance = distance;
        //canvas.addEventListener("touchmove", onTouchMove);
    }
    //rgtext = `視野(左右):${Math.round(rgLR * 20) / 10}°`;
    //magLim = find_magLim(rgLR);
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
canvas.addEventListener('mousemove', movePoint, false);
canvas.addEventListener('mouseup', endPoint, false);
// スマホ対応
canvas.addEventListener('touchstart', startPoint, false);
canvas.addEventListener('touchmove', movePoint, false);
canvas.addEventListener('touchend', endPoint, false);
 
function startPoint(e){
    e.preventDefault();
    ctx.beginPath();
    Xpoint = e.pageX - canvas.offsetLeft;
    Ypoint = e.pageY - canvas.offsetTop;
    ctx.moveTo(Xpoint, Ypoint);
    console.log(e.pageX);
}
 
function movePoint(e){
    if(e.buttons === 1 || e.witch === 1 || e.type == 'touchmove'){
        Xpoint = e.pageX - canvas.offsetLeft;
        Ypoint = e.pageY - canvas.offsetTop;
        moveflg = 1;
        ctx.lineTo(Xpoint, Ypoint);
        ctx.lineCap = "round";
        ctx.lineWidth = defSize * 2;
        ctx.strokeStyle = defColor;
        ctx.stroke();  
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
}
function setLocalStoreage(){
    var png = canvas.toDataURL();
    var logs = JSON.parse(myStorage.getItem("__log"));
 
    setTimeout(function(){
        console.log({png:png});
        logs.unshift({png:png});
        myStorage.setItem("__log", JSON.stringify(logs));
        temp = [];
    }, 0);
}
 
function prevCanvas(){
    var logs = JSON.parse(myStorage.getItem("__log"));
    if(logs.length > 0){
        if (temp.length == 0) {
            temp.unshift(logs.shift());
        }
        temp.unshift(logs.shift());
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

    if (showInfo) {
        var t = (JD - 2451545.0) / 36525;
        var theta = ((24110.54841 + 8640184.812866*t + 0.093104*t**2 - 0.0000062*t**3)/86400 % 1 + 1.00273781 * ((JD-2451544.5)%1)) * 2*pi + lon_obs //rad

        var Astr = "";
        var hstr = "";
        //azimuth = (Math.atan2(-cos(Dec_rad)*sin(theta-RA_rad), sin(Dec_rad)*cos(lat_obs)-cos(Dec_rad)*sin(lat_obs)*cos(theta-RA_rad)) * 180/pi + 360) % 360;
        const direcs = ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東', '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西', '北'];
        var direc = direcs[Math.floor((azimuth + 11.25) / 22.5)];
        //altitude = Math.asin(sin(Dec_rad)*sin(lat_obs) + cos(Dec_rad)*cos(lat_obs)*cos(theta-RA_rad)) * 180/pi;
        Astr = '';//`方位角 ${Math.round(azimuth*10)/10}°(${direc}) `;
        hstr = '';//`高度 ${Math.round(altitude*10)/10}° `;

        //星座判定
        var A = Array(89).fill(0);
        const num_of_boundary = boundary.length / 5;
        for (var i=0; i<num_of_boundary; i++) {
            var Dec1 = parseFloat(boundary[5*i+2]);
            var Dec2 = parseFloat(boundary[5*i+4]);
            if (Math.min(Dec1, Dec2) <= cenDec && cenDec < Math.max(Dec1, Dec2)) {
                var RA1 = parseFloat(boundary[5*i+1]);
                var RA2 = parseFloat(boundary[5*i+3]);
                if (cenRA >= (cenDec-Dec1) * (RA2-RA1) / (Dec2-Dec1) + RA1) {
                    var No = parseInt(boundary[5*i]) - 1;
                    A[No] = (A[No] + 1) % 2;
                }
            }
        }
        
        var constellation = "";
        for (var i=0; i<89; i++) {
            if (A[i] == 1) {
                constellation = CLnames[i] + "座 ";
                break;
            }
            if (cenDec > 0) {
                constellation = "こぐま座 ";
            } else {
                constellation = "はちぶんぎ座 ";
            }
        }

        //星座線
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        const num_of_lines = lines.length / 5;
        for (var i=0; i<num_of_lines; i++) {
            var RA1 = parseFloat(lines[5*i+1]);
            var Dec1 = parseFloat(lines[5*i+2]);
            var RA2 = parseFloat(lines[5*i+3]);
            var Dec2 = parseFloat(lines[5*i+4]);
            var [RA1_SH, Dec1_SH] = angleSH(RA1, Dec1);
            var [RA2_SH, Dec2_SH] = angleSH(RA2, Dec2);
            if (Math.min(RA1_SH, RA2_SH) < rgLR && Math.max(RA1_SH, RA2_SH) > -rgLR) {
                if (Math.min(Dec1_SH, Dec2_SH) < rgTB && Math.max(Dec1_SH, Dec2_SH) > -rgTB) {
                    if (Math.pow(RA2_SH-RA1_SH, 2) + Math.pow(Dec2_SH-Dec1_SH, 2) < 30*30) {
                        var [x1, y1] = coordSH(RA1_SH, Dec1_SH);
                        var [x2, y2] = coordSH(RA2_SH, Dec2_SH);
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                    }
                }
            }
        }
        ctx.stroke();
    }

    //HIP
    ctx.fillStyle = starColor;
    for (i=0; i<HIPRAary.length; i++){
        var RA = HIPRAary[i];
        var Dec = HIPDecary[i];
        var mag = HIPmagary[i];
        var [RA_SH, Dec_SH] = angleSH(RA, Dec);
        if (mag < magLim && Math.abs(RA_SH) < rgLR && Math.abs(Dec_SH) < rgTB) {
            var [x, y] = coordSH(RA_SH, Dec_SH);
            ctx.beginPath();
            ctx.arc(x, y, size(mag), 0, 2 * pi, false);
            ctx.fill();
        }
    }

    //Tycho
    var skyareas = [];
    if (magLim > 6.5) {
        var minDec = Math.max(-90, Math.min(SHtoRADec(rgLR, -rgTB)[1], cenDec-rgTB));
        var maxDec = Math.min( 90, Math.max(SHtoRADec(rgLR,  rgTB)[1], cenDec+rgTB));
        
        if (minDec == -90) {
            skyareas = [[SkyArea(0, -90), SkyArea(359.9, maxDec)]];
        } else if (maxDec == 90) {
            skyareas = [[SkyArea(0, minDec), SkyArea(359.9, 89.9)]];
        } else {
            var RArange1 = (SHtoRADec(rgLR,  rgTB)[0] - cenRA + 360) % 360;
            var RArange2 = (SHtoRADec(rgLR,     0)[0] - cenRA + 360) % 360;
            var RArange3 = (SHtoRADec(rgLR, -rgTB)[0] - cenRA + 360) % 360;
            var RArange = Math.max(RArange1, RArange2, RArange3);

            if (cenRA - RArange < 0) {
                var skyareas = [[SkyArea(                0, minDec), SkyArea(cenRA+RArange, minDec)],
                                [SkyArea(cenRA-RArange+360, minDec), SkyArea(        359.9, minDec)]];
                for (var i=1; i<=Math.floor(maxDec)-Math.floor(minDec); i++) {
                    skyareas.push([skyareas[0][0]+360*i, skyareas[0][1]+360*i]);
                    skyareas.push([skyareas[1][0]+360*i, skyareas[1][1]+360*i]);
                }
            } else if (cenRA + RArange > 360) {
                var skyareas = [[SkyArea(            0, minDec), SkyArea(cenRA+RArange, minDec)],
                                [SkyArea(cenRA-RArange, minDec), SkyArea(        359.9, minDec)]];
                for (var i=1; i<=Math.floor(maxDec)-Math.floor(minDec); i++) {
                    skyareas.push([skyareas[0][0]+360*i, skyareas[0][1]+360*i]);
                    skyareas.push([skyareas[1][0]+360*i, skyareas[1][1]+360*i]);
                }
            } else {
                var skyareas = [[SkyArea(cenRA-RArange, minDec), SkyArea(cenRA+RArange, minDec)]];
                for (var i=1; i<=Math.floor(maxDec)-Math.floor(minDec); i++) {
                    skyareas.push([skyareas[0][0]+360*i, skyareas[0][1]+360*i]);
                }
            }
        }
        DrawStars_SH(skyareas);
        if (magLim > 10) {
            DrawStars1011_SH(skyareas);
        }
    }

    if (showInfo) {
        // 星座名
        ctx.font = '20px times new roman';
        ctx.fillStyle = 'white';
        for (i=0; i<88; i++){
            var RA = 1.0 * constPos[2*i];
            var Dec = 1.0 * constPos[2*i+1];
            var constName = CLnames[i];
            var [RA_SH, Dec_SH] = angleSH(RA, Dec);
            if (Math.abs(RA_SH) < rgLR && Math.abs(Dec_SH) < rgTB) {
                var [x, y] = coordSH(RA_SH, Dec_SH);
                ctx.fillText(constName, x-40, y-10);
            }
        }

        ctx.font = '16px serif';
        ctx.strokeStyle = 'orange';
        ctx.fillStyle = 'orange';

        //メシエ
        DrawMessier_SH();
        //ポピュラー
        for (i=0; i<NGC.length/4; i++){
            var name = NGC[4*i];
            if (popularList.indexOf(name) != -1) {
                var RA = parseFloat(NGC[4*i+1]);
                var Dec = parseFloat(NGC[4*i+2]);
                var type = NGC[4*i+3];
                var [RA_SH, Dec_SH] = angleSH(RA, Dec);
                if (Math.abs(RA_SH) < rgLR && Math.abs(Dec_SH) < rgTB) {
                    var [x, y] = coordSH(RA_SH, Dec_SH);
                    DrawObjects(name, x, y, type);
                }
            }
        }
        DrawNGC_SH();

        var RAtext = `赤経 ${Math.floor(cenRA/15)}h ${Math.round((cenRA-15*Math.floor(cenRA/15))*4*10)/10}m `;
        if (cenDec >= 0) {
            var Dectext = `赤緯 +${Math.floor(cenDec)}° ${Math.round((cenDec-Math.floor(cenDec))*60)}' (J2000.0) `;
        } else {
            var Dectext = `赤緯 -${Math.floor(-cenDec)}° ${Math.round((-cenDec-Math.floor(-cenDec))*60)}' (J2000.0) `;
        }
        
        var coordtext = `${constellation}　${rgtext}　${magLimtext}<br>${RAtext}${Dectext}<br>${Astr}${hstr}`;
        document.getElementById("coordtext").innerHTML = coordtext;
    }

    function SkyArea(RA, Dec) { //(RA, Dec)はHelper2ndで↓行目（0始まり）の行数からのブロックに入ってる
        return parseInt(360 * Math.floor(Dec + 90) + Math.floor(RA));
    }

    function RApos(RA) { //PythonでのadjustRA(RA)-piccenRAに相当
        return (RA + 540 - cenRA) % 360 - 180;
    }

    function coord (RA, Dec) {
        var x = canvas.width * (0.5 - RApos(RA) / rgLR / 2);
        var y = canvas.height * (0.5 - (Dec - cenDec) / rgTB / 2);
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
        var x = canvas.width * (0.5 - RA_SH / rgLR / 2);
        var y = canvas.height * (0.5 - Dec_SH / rgTB / 2);
        return [x, y];
    }

    function drawLines(RA1, Dec1, RA2, Dec2, a){
        ctx.lineWidth = 3;
        var [x1, y1] = coord(RA1+a, Dec1);
        var [x2, y2] = coord(RA2+a, Dec2);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
    }

    function size (mag) {
        if (mag > magLim) {
            return zerosize / (magLim + 1);
        } else {
            return zerosize * (magLim + 1 - mag) / (magLim + 1);
        }
    }       

    function DrawStars(skyareas){
        for (var arearange of skyareas) {
            var st = parseInt(Help[arearange[0]]);
            var fi = parseInt(Help[arearange[1]+1]);
            for (i=st; i<fi; i++) {
                var RA = parseFloat(Tycho[3*(i-1)]);
                var Dec = parseFloat(Tycho[3*(i-1)+1]);
                var mag = parseFloat(Tycho[3*(i-1)+2]);
                if (Math.abs(Dec-cenDec) < rgTB && Math.abs(RApos(RA)) < rgLR && mag < magLim) {
                    var [x, y] = coord(RA, Dec);
                    ctx.beginPath();
                    ctx.arc(x, y, size(mag), 0, 2 * pi, false);
                    ctx.fill();
                }
            }
        }
    }

    function DrawStars1011(skyareas){
        for (var arearange of skyareas) {
            var st = parseInt(Help1011[arearange[0]]);
            var fi = parseInt(Help1011[arearange[1]+1]);
            for (i=st; i<fi; i++) {
                var RA = parseFloat(Tycho1011[3*(i-1)]);
                var Dec = parseFloat(Tycho1011[3*(i-1)+1]);
                var mag = parseFloat(Tycho1011[3*(i-1)+2]);
                if (Math.abs(Dec-cenDec) < rgTB && Math.abs(RApos(RA)) < rgLR && mag < magLim) {
                    var [x, y] = coord(RA, Dec);
                    ctx.beginPath();
                    ctx.arc(x, y, size(mag), 0, 2 * pi, false);
                    ctx.fill();
                }
            }
        }
    }

    function DrawStars_SH(skyareas){
        for (var arearange of skyareas) {
            var st = parseInt(Help[arearange[0]]);
            var fi = parseInt(Help[arearange[1]+1]);
            for (i=st; i<fi; i++) {
                var RA = parseFloat(Tycho[3*(i-1)]);
                var Dec = parseFloat(Tycho[3*(i-1)+1]);
                var mag = parseFloat(Tycho[3*(i-1)+2]);
                var [RA_SH, Dec_SH] = angleSH(RA, Dec);
                if (mag < magLim && Math.abs(Dec_SH) < rgTB && Math.abs(RA_SH) < rgLR) {
                    var [x, y] = coordSH(RA_SH, Dec_SH);
                    ctx.beginPath();
                    ctx.arc(x, y, size(mag), 0, 2 * pi, false);
                    ctx.fill();
                }
            }
        }
    }

    function DrawStars1011_SH(skyareas){
        for (var arearange of skyareas) {
            var st = parseInt(Help1011[arearange[0]]);
            var fi = parseInt(Help1011[arearange[1]+1]);
            for (i=st; i<fi; i++) {
                var RA = parseFloat(Tycho1011[3*(i-1)]);
                var Dec = parseFloat(Tycho1011[3*(i-1)+1]);
                var mag = parseFloat(Tycho1011[3*(i-1)+2]);
                var [RA_SH, Dec_SH] = angleSH(RA, Dec);
                if (mag < magLim && Math.abs(Dec_SH) < rgTB && Math.abs(RA_SH) < rgLR) {
                    var [x, y] = coordSH(RA_SH, Dec_SH);
                    ctx.beginPath();
                    ctx.arc(x, y, size(mag), 0, 2 * pi, false);
                    ctx.fill();
                }
            }
        }
    }

    function DrawMessier() {
        ctx.strokeStyle = 'orange';
        ctx.fillStyle = 'orange';
        for (i=0; i<110; i++){
            var RA = parseFloat(messier[3*i]);
            var Dec = parseFloat(messier[3*i+1]);
            var type = messier[3*i+2];
            if (Math.abs(RApos(RA)) < rgLR && Math.abs(Dec-cenDec) < rgTB) {
                var [x, y] = coord(RA, Dec);
                DrawObjects(`M${i+1}`, x, y, type);
            }
        }
    }

    function DrawNGC() {
        ctx.strokeStyle = 'orange';
        ctx.fillStyle = 'orange';
        for (i=0; i<NGC.length/4; i++){
            var name = NGC[4*i];
            if (popularList.indexOf(name) == -1) {
                var RA = parseFloat(NGC[4*i+1]);
                var Dec = parseFloat(NGC[4*i+2]);
                var type = NGC[4*i+3];
                var [x, y] = coord(RA, Dec);
                DrawObjects(name, x, y, type);
            }
        }
    }

    function DrawMessier_SH() {
        ctx.strokeStyle = 'orange';
        ctx.fillStyle = 'orange';
        for (i=0; i<110; i++){
            var RA = parseFloat(messier[3*i]);
            var Dec = parseFloat(messier[3*i+1]);
            var type = messier[3*i+2];
            var [RA_SH, Dec_SH] = angleSH(RA, Dec);
            if (Math.abs(RA_SH) < rgLR && Math.abs(Dec_SH) < rgTB) {
                var [x, y] = coordSH(RA_SH, Dec_SH);
                DrawObjects("M" + (i+1).toString(), x, y, type);
            }
        }
    }

    function DrawNGC_SH() {
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'orange';
        ctx.fillStyle = 'orange';
        for (i=0; i<NGC.length/4; i++){
            var name = NGC[4*i];
            if (popularList.indexOf(name) == -1) {
                var RA = parseFloat(NGC[4*i+1]);
                var Dec = parseFloat(NGC[4*i+2]);
                var type = NGC[4*i+3];
                var [RA_SH, Dec_SH] = angleSH(RA, Dec);
                if (Math.abs(RA_SH) < rgLR && Math.abs(Dec_SH) < rgTB) {
                    var [x, y] = coordSH(RA_SH, Dec_SH);
                    DrawObjects(name, x, y, type);
                }
            }
        }
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
    /*
    function DrawMoon () {
        var r = Math.max(canvas.width * (0.259 / (dist_Moon / 384400)) / rgEW / 2, 13);
        var rs = RAlist[0] * pi/180;
        var ds = Declist[0] * pi/180;
        var rm = RAlist[9] * pi/180;
        var dm = Declist[9] * pi/180;
        var lon_sun = Ms + 0.017 * sin(Ms + 0.017 * sin(Ms)) + ws;
        var k = (1 - cos(lon_sun-lon_moon) * cos(lat_moon)) / 2;
        var P = pi - Math.atan2(cos(ds) * sin(rm-rs), -sin(dm) * cos(ds) * cos(rm-rs) + cos(dm) * sin(ds));

        ctx.beginPath();
        if (k < 0.5) {
            ctx.fillStyle = yellowColor;
            ctx.arc(x, y, r, 0, 2*pi, false);
            ctx.fill();
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(x, y, r, pi-P, 2*pi-P);
            ctx.ellipse(x, y, r, r*(1-2*k), -P, 0, pi);
            ctx.fill()
        } else {
            ctx.fillStyle = '#333';
            ctx.arc(x, y, r, 0, 2*pi, false);
            ctx.fill();
            ctx.fillStyle = yellowColor;
            ctx.beginPath();
            ctx.arc(x, y, r, -P, pi-P);
            ctx.ellipse(x, y, r, r*(2*k-1), pi-P, 0, pi);
            ctx.fill()
        }
        return r;
    }
    */
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

document.body.appendChild(canvas);