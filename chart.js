//2023/10/21 ~ 11/2

// 入力をURLに反映するのは手を離したときとセッティングを終えたとき
// URLを表示に反映するのは最初のみ

//分断の色と星の色を変える
const separationColor = '#FFF'
const starColor = '#FFF'
const yellowColor = 'yellow'
//'yellow'は全部yellowColorにする

const pi = Math.PI;

document.getElementById('setting').style.visibility = "hidden";
document.getElementById('description').style.visibility = "hidden";
document.getElementById('exitFullScreenBtn').style.visibility = "hidden";

let canvas = document.createElement('canvas');
let ctx = canvas.getContext('2d');

const BIGWIDTH = window.screen.width;
const BIGHEIGHT = window.screen.height - 30;
const NORMALWIDTH = window.innerWidth;
const NORMALHEIGHT = window.innerHeight - 30;

function setCanvas (fullBool) {
    if (fullBool) {
        canvas.width = BIGWIDTH;
        canvas.height = BIGHEIGHT;
    } else {
        canvas.width = NORMALWIDTH;
        canvas.height = NORMALHEIGHT;
    }
    ctx = canvas.getContext('2d');
    if (rgEW != null && rgNS != null) {
        rgNS = rgEW * canvas.height / canvas.width;
    }
    if (xhrcheck != null && defaultcheck != null && xhrcheck >= 10 && defaultcheck == 9) {
        show_main();
    }
}
setCanvas(false);

var cenRA = 270;
var cenDec = -25;

if (canvas.width < canvas.height) {
    var rgEW = 10;
    var rgNS = rgEW * canvas.height / canvas.width;
} else {
    var rgNS = 10;
    var rgEW = rgNS * canvas.width / canvas.height;
    document.getElementById('constNameFrom').value = "180";
    document.getElementById('MessierFrom').value = "100";
    document.getElementById('NGCFrom').value = "80";
}

const minrg = 0.3;
const maxrg = 90;

var rgtext = `視野(左右):${Math.round(rgEW * 20) / 10}°`;

var magLimtext;
var magLimLim = 10;
function find_magLim() {
    var magLim = Math.min(Math.max(11.0 - 1.8 * Math.log(Math.min(rgEW, rgNS)), 4), magLimLim);
    //var magLim = 11;
    magLimtext = `~${Math.round(magLim * 10) / 10}等級`;
    return magLim;
}
var magLim = find_magLim();

function find_zerosize() {
    return 13 - 2.4 * Math.log(Math.min(rgEW, rgNS) + 3);
}
var zerosize = find_zerosize();

var SHmode = document.getElementById('SHzuhoCheck').checked;

var ObsPlanet, Obs_num, lat_obs, lon_obs, lattext, lontext;


var xhrcheck = 0;
var defaultcheck = 0;

function loadFile(filename, func, go) {
    var url = "https://peteworden.github.io/Soleil/" + filename + ".txt";
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
//loadFile("StarsNew-Tycho-from10to11-2nd_forJS", xhrTycho1011, 1);
function xhrTycho1011(data) {
    Tycho1011 = data.split(',');
}


//Tycho helper 10~11 mag
var Help1011 = [];
//loadFile("TychoSearchHelper-from10to11-2nd_forJS", xhrHelp1011, 1);
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

//追加天体
var ENGplanets = ['Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Moon', 'Ceres', 'Vesta'];
var JPNplanets = ['太陽',  '水星', '金星', '地球', '火星',  '木星', '土星', '天王星', '海王星', '月', 'Ceres', 'Vesta'];
var RAlist = new Array(20);
var Declist = new Array(20);
var Distlist = new Array(20);
var Vlist = new Array(20);
var Ms, ws, lon_moon, lat_moon, dist_Moon, dist_Sun;

var extra = [];

loadFile("ExtraPlanet", xhrExtra, 1);
function xhrExtra(data) {
    extra = data.split(' ');
    if (extra.length != 0) {
        var name = extra[1];
        for (var i=2; i<parseInt(extra[0])+1; i++) {
            name += ' ' + extra[i];
        }
        ENGplanets.push(name);
        JPNplanets.push(name);
        const option1 = document.createElement('option');
        option1.innerHTML = name;
        document.getElementById('observer').appendChild(option1);
                    
        if (url.searchParams.has('observer')) {// && xhrcheck == 7) {
            for (var i=0; i<ENGplanets.length; i++) {
                if (url.searchParams.get('observer') == ENGplanets[i].split(' ').join('').split('/').join('')) {
                    document.getElementById("observer").value = JPNplanets[i];
                    break;
                }
            }
            defaultcheck++;
        } else {
            defaultcheck++;
        }
    }
}

function show_initial(){
    if (xhrcheck == 10 && defaultcheck == 9){
        newSetting();
        show_main();
    } else {
        console.log(xhrcheck, defaultcheck);
    }
}

const popularList = ["NGC869", "NGC884", "コリンダー399", "アルビレオ", "NGC5139", "NGC2264"];

var showingJD = 0;

const url = new URL(window.location.href);
console.log(url.href);

function link(obj) {
    if (obj[0] == 'M' && isNaN(obj.substr(1)) == false) { //メシエ
        var i = parseInt(obj.substr(1)) - 1;
        cenRA = parseFloat(messier[3*i]);
        cenDec = parseFloat(messier[3*i+1]);
    } else { //その他
        for (var i=0; i<NGC.length/4; i++) {
            if (obj == NGC[4*i]) {
                cenRA = parseFloat(NGC[4*i+1]);
                cenDec = parseFloat(NGC[4*i+2]);
            }
        }
    }
    url.searchParams.set('RA', cenRA);
    url.searchParams.set('Dec', cenDec);
    history.replaceState('', '', url.href);
    document.getElementById("settingBtn").removeAttribute("disabled");
    document.getElementById('description').style.visibility = "hidden";
    show_main();
}

// キーを指定し、クエリパラメータを取得
if (url.searchParams.has('RA')) {
    cenRA = parseFloat(url.searchParams.get('RA'));
    defaultcheck++;
    show_initial();
} else {
    cenRA = 270;
    url.searchParams.set('RA', cenRA);
    defaultcheck++;
    show_initial();
}

if (url.searchParams.has('Dec')) {
    cenDec = parseFloat(url.searchParams.get('Dec'));
    defaultcheck++;
    show_initial();
} else {
    cenDec = -25;
    url.searchParams.set('Dec', cenDec);
    defaultcheck++;
    show_initial();
}

if (url.searchParams.has('time')) {
    var [y, m, d, h] = url.searchParams.get('time').split('-');
    console.log('time', url.searchParams.get('time').split('-'));
    setYMDH(y, m, d, h);
    showingJD = YMDH_to_JD(y, m, d, h);
    defaultcheck++;
    show_initial();
} else {
    now();
    defaultcheck++;
    show_initial();
}

if (url.searchParams.has('SH')) {
    console.log('SH', url.searchParams.get('SH'));
    if (url.searchParams.get('SH') == 1) {
        SHmode = true;
        document.getElementById('SHzuhoCheck').checked = true;
    } else {
        SHmode = false;
        url.searchParams.set('SH', 0);
        document.getElementById('SHzuhoCheck').checked = false;
    }
    defaultcheck++;
    show_initial();
} else {
    SHmode = true;
    document.getElementById('SHzuhoCheck').checked = true;
    url.searchParams.set('SH', 1);
    defaultcheck++;
    show_initial();
}

if (url.searchParams.has('to11')) {
    if (url.searchParams.get('to11') == 1) {
        document.getElementById('to11Check').checked = true;
        magLimLim = 11;
        magLim = find_magLim();
        if (xhrcheck == 10) {
            loadFile("StarsNew-Tycho-from10to11-2nd_forJS", xhrTycho1011, 2),
            loadFile("TychoSearchHelper-from10to11-2nd_forJS", xhrHelp1011, 2);
        }
    } else {
        document.getElementById('to11Check').checked = false;
        url.searchParams.set('to11', 0);
    }
    defaultcheck++;
    show_initial();
} else {
    document.getElementById('to11Check').checked = false;
    url.searchParams.set('to11', 0);
    defaultcheck++;
    show_initial();
}

if (url.searchParams.has('area')) {
    console.log('area', url.searchParams.get('area'));
    rgEW = parseFloat(url.searchParams.get('area')) / 2.0;
    rgNS = rgEW * canvas.height / canvas.width;
    defaultcheck++;
    show_initial();
} else {
    url.searchParams.set('area', (Math.round(2*rgEW*100)/100).toString());
    defaultcheck++;
    show_initial();
}

if (url.searchParams.has('lat')) {
    var lat_obs = url.searchParams.get('lat');
    if (lat_obs >= 0) {
        document.getElementById("NSCombo").value = '北緯';
        document.getElementById('lat').value = lat_obs;
    } else {
        document.getElementById("NSCombo").value = '南緯';
        document.getElementById('lat').value = -lat_obs;
    }
    defaultcheck++;
    show_initial();
} else {
    defaultcheck++;
    show_initial();
}

if (url.searchParams.has('lon')) {
    var lon_obs = url.searchParams.get('lon');
    if (lon_obs >= 0) {
        document.getElementById("EWCombo").value = '東経';
        document.getElementById('lon').value = lon_obs;
    } else {
        document.getElementById("EWCombo").value = '西経';
        document.getElementById('lon').value = -lon_obs;
    }
    defaultcheck++;
    show_initial();
} else {
    defaultcheck++;
    show_initial();
}

function now() {
    var ymdhm = new Date();
    var [y, m, d, h] = [ymdhm.getFullYear(), ymdhm.getMonth()+1, ymdhm.getDate(), ymdhm.getHours()+Math.round(ymdhm.getMinutes()*10/60)/10];
    setYMDH(y, m, d, h);
    showingJD = YMDH_to_JD(y, m, d, h);
}

function setYMDH(y, m, d, h) {
    document.getElementById('yearText').value = y;
    document.getElementById('monthText').value = m;
    document.getElementById('dateText').value = d;
    document.getElementById('hourText').value = h;
}

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

function YMDH_to_JD(Y, M, D, H){
    if (M <= 2) {
        M += 12;
        Y--;
    }
    var JD = Math.floor(365.25*Y) + Math.floor(Y/400) - Math.floor(Y/100) + Math.floor(30.59*(M-2)) + D + H/24 + 1721088.5 + 0.0008 - 0.375;
    return JD;
}

function showSetting() {
    document.getElementById("descriptionBtn").setAttribute("disabled", true);
    document.getElementById('setting').style.visibility = "visible";
}

function finishSetting() {
    newSetting();
    show_main();
    document.getElementById("descriptionBtn").removeAttribute("disabled");
    document.getElementById('setting').style.visibility = "hidden";
}

//入力をもとにURLを修正し、観測地についての変数を設定し、showingDataを設定し、showingJDを計算する
function newSetting() {
    let year = parseInt(document.getElementById('yearText').value);
    let month = parseInt(document.getElementById('monthText').value);
    let date = parseInt(document.getElementById('dateText').value);
    let hour = parseFloat(document.getElementById('hourText').value);

    ObsPlanet = document.getElementById("observer").value;
    Obs_num = JPNplanets.indexOf(ObsPlanet);

    // 視点
    if (Obs_num == 3) {
        if (url.searchParams.has('observer')) {
            url.searchParams.delete('observer');
        }   
    } else {
        url.searchParams.set('observer', ENGplanets[Obs_num].split(' ').join('').split('/').join(''));
    }

    if (document.getElementById('to11Check').checked) {
        url.searchParams.set('to11', 1);
        if (xhrcheck == 10) {
            loadFile("StarsNew-Tycho-from10to11-2nd_forJS", xhrTycho1011, 2),
            loadFile("TychoSearchHelper-from10to11-2nd_forJS", xhrHelp1011, 2);
        }
        magLimLim = 11;
        magLim = find_magLim();
    } else {
        url.searchParams.set('to11', 0);
        magLimLim = 10;
        magLim = find_magLim();
    }

    if (document.getElementById('SHzuhoCheck').checked) {
        SHmode = true;
        url.searchParams.set('SH', 1);
    } else {
        SHmode = false;
        url.searchParams.set('SH', 0);
    }

    if (document.getElementById("NSCombo").value == '北緯') {
        lat_obs = document.getElementById('lat').value * Math.PI/180;
        lattext = document.getElementById('lat').value + "°N";
        if (document.getElementById('lat').value == '35') {
            if (url.searchParams.has('lat')) {
                url.searchParams.delete('lat');
            }
        } else {
            url.searchParams.set('lat', document.getElementById('lat').value);
        }
    } else {
        lat_obs = -document.getElementById('lat').value * Math.PI/180;
        lattext = document.getElementById('lat').value + "°S";
        url.searchParams.set('lat', -document.getElementById('lat').value);
    }

    if (document.getElementById("EWCombo").value == '東経') {
        lon_obs = document.getElementById('lon').value * Math.PI/180;
        lontext = document.getElementById('lon').value + "°E";
        if (document.getElementById('lon').value == '135') {
            if (url.searchParams.has('lon')) {
                url.searchParams.delete('lon');
            }
        } else {
            url.searchParams.set('lon', document.getElementById('lon').value);
        }
    } else {
        lon_obs = -document.getElementById('lon').value * Math.PI/180;
        lontext = document.getElementById('lon').value + "°W";
        url.searchParams.set('lon', -document.getElementById('lon').value);
    }
        
    url.searchParams.set('time', `${year}-${month}-${date}-${hour}`);
    console.log(url.href);
    history.replaceState('', '', url.href);

    document.getElementById('showingData').innerHTML = `${year}/${month}/${date} ${hour}時JST ${lattext} ${lontext}`;

    showingJD = YMDH_to_JD(year, month, date, hour);
    calculation(showingJD);
}

function descriptionFunc() {
    if (document.getElementById('description').style.visibility == "visible") {
        document.getElementById("settingBtn").removeAttribute("disabled");
        document.getElementById('description').style.visibility = "hidden";
    } else {
        document.getElementById("settingBtn").setAttribute("disabled", true);
        document.getElementById('description').style.visibility = "visible";
    }
}

function toggleFullscreen() {  
    let elem = document.documentElement;    
    elem
    .requestFullscreen({ navigationUI: "show" })
    .then(() => {})
    .catch((err) => {
        alert(
            `An error occurred while trying to switch into fullscreen mode: ${err.message} (${err.name})`,
        );
    });
}

function fullScreenFunc() {
    toggleFullscreen();
    setCanvas(true);
    document.getElementById('fullScreenBtn').style.visibility = "hidden";
    document.getElementById('exitFullScreenBtn').style.visibility = "visible";
}

function exitFullScreenFunc() {
    document.exitFullscreen();
    setCanvas(false);
    document.getElementById('fullScreenBtn').style.visibility = "visible";
    document.getElementById('exitFullScreenBtn').style.visibility = "hidden";
}

function show_JD_plus1(){
    showingJD += 1;
    var [y, m, d, h] = JD_to_YMDH(showingJD);
    setYMDH(y, m, d, h)
}

function show_JD_minus1(){
    showingJD -= 1;
    var [y, m, d, h] = JD_to_YMDH(showingJD);
    setYMDH(y, m, d, h)
}

var startX, startY, moveX, moveY, dist_detect = Math.round(canvas.width / 25);// distはスワイプを感知する最低距離（ピクセル単位）
var baseDistance = 0;
var movedDistance = 0;
var distance = 0;
var pinchFrag = 0;

canvas.addEventListener("touchstart", ontouchstart);
canvas.addEventListener("touchmove", ontouchmove);
canvas.addEventListener('touchend', ontouchend);
canvas.addEventListener('touchcancel', ontouchcancel);
canvas.addEventListener('mousedown', onmousedown);
canvas.addEventListener('mouseup', onmouseup);
canvas.addEventListener('wheel', onwheel);

// タッチ開始
function ontouchstart(e) {
    e.preventDefault();
    console.log('touch');
    pinchFrag = 0;
    startX = e.touches[0].pageX;
    startY = e.touches[0].pageY;
};

// スワイプ中またはピンチイン・ピンチアウト中
function ontouchmove(e) {
    document.getElementById('title').innerHTML = `move ${e.changedTouches[0].pageX}`;
    e.preventDefault();
    var touches = e.changedTouches;
    console.log(touches.length);
    if (touches.length.toString() == '1') {
        if (pinchFrag == 0) {
            moveX = touches[0].pageX;
            moveY = touches[0].pageY;
            if ((moveX-startX)*(moveX-startX) + (moveY-startY)*(moveY-startY) > dist_detect*dist_detect) {
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
    //rgtext = "視野(左右):" + Math.round(rgEW * 20) / 10 + "°";
    //magLim = find_magLim(rgEW);
    //zerosize = find_zerosize();
    //show_main();
}

//位置推算とURLの書き換え
function calculation(JD) {
    const eps = 0.4090926; //黄道傾斜角
    const sine = sin(eps);
    const cose = cos(eps);
    const pi = Math.PI;

    const Sun = ['Sun'];
    const Marcury = [2451545.0,  0.387099, 0.205636,  29.127030,  7.004979,  48.330766, 174.792527,  0.000000,  0.000019,  0.285818, -0.005947, -0.125341];
    const Venus   = [2451545.0,  0.723336, 0.006777,  54.922625,  3.394676,  76.679843,  50.376632,  0.000004, -0.000041,  0.280377, -0.000789, -0.277694];
    const Earth   = [2451545.0,  1.000003, 0.016711, 102.937682, -0.000015,   0       ,  -2.473110,  0.000006, -0.000044,  0.323274, -0.012947,  0       ];
    const Mars    = [2451545.0,  1.523710, 0.093394, 286.496832,  1.849691,  49.559539,  19.390198,  0.000018,  0.000079,  0.736984, -0.008131, -0.292573];
    const Jupiter = [2451545.0,  5.202887, 0.048386, 274.254571,  1.304397, 100.473909,  19.667961, -0.000116, -0.000133,  0.007836, -0.001837,  0.204691];
    const Saturn  = [2451545.0,  9.536676, 0.053862, -21.063546,  2.485992, 113.662424, 317.355366, -0.001251, -0.000510, -0.130294,  0.001936, -0.288678];
    const Uranus  = [2451545.0, 19.189165, 0.047257,  96.937351,  0.772638,  74.016925, 142.283828, -0.001962, -0.000044,  0.365647, -0.002429,  0.042406];
    const Neptune = [2451545.0, 30.069923, 0.008590, 273.180537,  1.770043, 131.784226, 259.915208,  0.000263,  0.000051, -0.317328,  0.000354, -0.005087];
    const Moon    = ['Moon'];
    const Ceres   = [2459396.5,  2.76566 , 0.07839 ,  73.738268, 10.588196,  80.267638, 247.549972,  0       ,  0       ,  0       ,  0       ,  0       , 3.53, 0.12];
    const Vesta   = [2459396.5,  2.36166 , 0.08835 , 151.015603,  7.141541, 103.806059, 311.692061,  0       ,  0       ,  0       ,  0       ,  0       , 3.31, 0.32];

    const planets    = [   Sun, Marcury,  Venus,  Earth,   Mars, Jupiter, Saturn,   Uranus,  Neptune, Moon,   Ceres,   Vesta];
    //const JPNplanets = ['太陽',  '水星', '金星', '地球', '火星',  '木星', '土星', '天王星', '海王星', '月', 'Ceres', 'Vesta'];
    //const ENGplanets = ['Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Moon', 'Ceres', 'Vesta'];

    const OriginalNumOfPlanets = planets.length;

    if (extra.length != 0) {
        var name = extra[1];
        for (var i=2; i<parseInt(extra[0])+1; i++) {
            name += ' ' + extra[i];
        }
        console.log(name);
        //JPNplanets.push(name);
        //ENGplanets.push(name);
        var New = [];
        for (var i=parseInt(extra[0])+1; i<extra.length-4; i++) {
            New.push(parseFloat(extra[i]));
        }
        planets.push(New);
    }

    var t = (JD - 2451545.0) / 36525;
    var theta = ((24110.54841 + 8640184.812866*t + 0.093104*t**2 - 0.0000062*t**3)/86400 % 1 + 1.00273781 * ((JD-2451544.5)%1)) * 2*pi + lon_obs //rad

    var Xlist = new Array(20);
    var Ylist = new Array(20);
    var Zlist = new Array(20);

    var [X, Y, Z] = calc(planets[Obs_num], JD);
    var [RA_Sun, Dec_Sun, dist] = xyz_to_RADec(-X, -Y, -Z);
    Xlist[0] = X;
    Ylist[0] = Y;
    Zlist[0] = Z;
    RAlist[0] = RA_Sun;
    Declist[0] = Dec_Sun;
    Distlist[0] = dist;
    dist_Sun = dist;

    for (i=1; i<planets.length; i++) {
        var planet = planets[i];
        if (i == 12) {console.log(planet)}
        if (i == 9) {
            var [x, y, z] = calc(Earth, JD);
            var Xe, Ye, Ze, RA_Moon, Dec_Moon;
            [Xe, Ye, Ze, RA_Moon, Dec_Moon, dist_Moon, Ms, ws, lon_moon, lat_moon] = calculate_Moon(JD, lat_obs, theta);
            Xlist[9] = x+Xe;
            Ylist[9] = y+Ye;
            Zlist[9] = z+Ze;
            RAlist[9] = RA_Moon;
            Declist[9] = Dec_Moon;
            Distlist[9] = dist_Moon;
            console.log("9 OK");
        } else {
            var [x, y, z] = calc(planet, JD);
            var [RA, Dec, dist] = xyz_to_RADec(x-X, y-Y, z-Z);
            Xlist[i] = x;
            Ylist[i] = y;
            Zlist[i] = z;
            RAlist[i] = RA;
            Declist[i] = Dec;
            Distlist[i] = dist;
            console.log(i, "OK");
        }
    }
    
    //明るさを計算
    const ES_2 = X**2 + Y**2 + Z**2;
    for (n=0; n<planets.length; n++) {
        var x = Xlist[n];
        var y = Ylist[n];
        var z = Zlist[n];
        var dist = Distlist[n];
        var PS_2 = 1;
        var i = 0;
        var V = 10;
        if (n != Obs_num){
            if (n == 0) {
                Vlist[0] = -26.7
            }
            else if (n==1) {
                PS_2 = x**2 + y**2 + z**2;
                if (Obs_num != 0) {i = Math.acos((PS_2 + dist**2 - ES_2) / (2 * dist * Math.sqrt(PS_2))) * 180/ pi}
                else {i = 0}
                V = -0.613 + 0.06328*i - 0.0016336 * i**2 + 0.000033644 * i**3 - 3.4565e-7 * i**4 +1.6893e-9 * i**5 - 3.0334e-12 * i**6+ 5 * Math.log10(dist * Math.sqrt(PS_2));
                Vlist[1] = V;
            }
            else if (n == 2) {
                PS_2 = x**2 + y**2 + z**2;
                if (Obs_num != 0) {i = Math.acos((PS_2 + dist**2 - ES_2) / (2 * dist * Math.sqrt(PS_2))) * 180/ pi}
                else{i = 0}
                if (i <= 163.7) {V = -4.384 - 0.001044 * i + 0.0003687 * i**2 - 2.814e-6 * i**3 + 8.938e-9 * i**4 + 5 * Math.log10(dist * Math.sqrt(PS_2))}
                else {V = -4.384 + 240.44228 - 2.81914 * i + 0.00839034 * i**2 + 5 * Math.log10(dist * Math.sqrt(PS_2))}
                Vlist[2] = V;
            }    
            else if (n == 3) {
                Vlist[3] = 1
            }
            else if (n == 4) {
                PS_2 = x**2 + y**2 + z**2;
                if (Obs_num != 0) {i = Math.acos((PS_2 + dist**2 - ES_2) / (2 * dist * Math.sqrt(PS_2))) * 180/ pi}
                else{i = 0}
                if (i<= 50) {V = -1.601 + 0.002267 * i - 0.0001302 * i**2 + 5 * Math.log10(dist * Math.sqrt(PS_2))}
                else if (50 < i <= 120) {V = -1.601 + 1.234 - 0.02573 * i + 0.0003445 * i**2 + 5 * Math.log10(dist * Math.sqrt(PS_2))}
                else{V = 1}
                Vlist[4] = V;
            }
            else if (n == 5) {
                PS_2 = x**2 + y**2 + z**2;
                if (Obs_num != 0) {i = Math.acos((PS_2 + dist**2 - ES_2) / (2 * dist * Math.sqrt(PS_2))) * 180/ pi}
                else{i = 0}
                if(i <= 12){V = -9.395 - 0.00037 * i + 0.000616 * i**2 + 5 * Math.log10(dist * Math.sqrt(PS_2))}
                else{V = -9.395 - 0.033 - 2.5*Math.log10(1 - 1.507*(i/180) - 0.363*(i/180)**2 - 0.062*(i/180)**3 + 2.809*(i/180)**4 - 1.876*(i/180)**5) + 5 * Math.log10(dist * Math.sqrt(PS_2))}
                Vlist[5] = V;
            }
            else if (n == 6) {
                PS_2 = x**2 + y**2 + z**2;
                if (Obs_num != 0) {i = Math.acos((PS_2 + dist**2 - ES_2) / (2 * dist * Math.sqrt(PS_2))) * 180/ pi}
                else{i = 0}
                if (i <= 6.5) {V = -8.914 + 1.825*sin(15*pi/180) + 0.026 * i - 0.378*sin(15*pi/180) + Math.exp(-2.25*i) + 5 * Math.log10(dist * Math.sqrt(PS_2))} //勝手にリングの傾きβ=15°とした
                else if (6 < i < 150) {V = -8.914 + 0.026 + 0.0002446 * i + 0.0002672 * i**2 - 1.505e-6 * i**3 + 4.767e-9 * i**4 + 5 * Math.log10(dist * Math.sqrt(PS_2))}
                else{V = 0.6}
                Vlist[6] = V;
            }
            else if (n == 7) {
                PS_2 = x**2 + y**2 + z**2;                
                if (Obs_num != 0) {i = Math.acos((PS_2 + dist**2 - ES_2) / (2 * dist * Math.sqrt(PS_2))) * 180/ pi}
                else{i = 0}
                if (i < 3.1) {V = -7.110 + 0.00009617 * i**2 + 0.0001045 * i**2+ 5 * Math.log10(dist * Math.sqrt(PS_2))}
                else{V = 5.6}
                Vlist[7] = V;
            }    
            else if (n == 8) {
                PS_2 = x**2 + y**2 + z**2;
                if (Obs_num != 0) {i = Math.acos((PS_2 + dist**2 - ES_2) / (2 * dist * Math.sqrt(PS_2))) * 180/ pi}
                else{i = 0}
                if (i < 133) {V = -7.00 + 0.007944 * i**3 + 0.00009617 * i**2+ 5 * Math.log10(dist * Math.sqrt(PS_2))}
                else{V = 7.8}
                Vlist[8] = V;
            }
            else if (planets[n].length == 14 && planets[n][13] != 100.0){ //ちゃんとしたH,GがPlanetに入っているとき
                var planet = planets[n];
                var H = planet[12];
                var G = planet[13];
                var PS_2 = x**2 + y**2 + z**2;
                if (Obs_num != 0) {a = Math.acos((PS_2 + dist**2 - ES_2) / (2 * dist * Math.sqrt(PS_2)))}
                else{a = 0}
                var phi1 = Math.exp(-3.33 * (Math.tan(a/2))**0.63);
                var phi2 = Math.exp(-1.87 * (Math.tan(a/2))**1.22);
                V = H - 2.5 * Math.log10((1-G) * phi1 + G * phi2) + 5 * Math.log10(dist * Math.sqrt(PS_2));
                Vlist[n] = V;
            }
            else{Vlist[n] = 100}  //n=9（月）を含む
        }        
        else{ //観測地自体
            Vlist[n] = 0;
        }
    }

    function xyz_to_RADec(x, y, z) {  //deg
        dist = Math.sqrt(x*x + y*y + z*z);
        if (dist  < 0.00000001){
            var RA = 0;
            var Dec = 200;
        } else {
            RA = (Math.atan2(y, x) * 180/pi + 360) % 360; //deg
            Dec = Math.atan(z / Math.sqrt(x*x + y*y)) * 180/pi; //deg
        }
        return [RA, Dec, dist];
    }

    function calc(planet, JD) {
        if (planet == Sun) {
            return [0, 0, 0]
        } else if (planet == Moon) {
            var [x, y, z] = cal_Ellipse(Earth, JD)
            var Xe, Ye, Ze, RA, Dec
            [Xe, Ye, Ze, RA, Dec, dist_Moon, Ms, ws, lon_moon, lat_moon] = calculate_Moon(JD, lat_obs, theta);
            return [x+Xe, y+Ye, z+Ze]
        } else {
            var e = planet[2];
            if (e <= 0.99) {
                return cal_Ellipse(planet, JD);
            } else {
                return cal_Parabola(planet, JD);
            }
        }
    }

    function cal_Ellipse(planet, JD) {
        var T = planet[0];
        var a = planet[1] + planet[7] * (JD - T) / 36525;
        var e = planet[2] + planet[8] * (JD - T) / 36525;
        var peri = (planet[3] + planet[9] * (JD - T) / 36525) * pi / 180; //ω
        var i = (planet[4] + planet[10] * (JD - T) / 36525) * pi / 180;
        var node = (planet[5] + planet[11] * (JD - T) / 36525) * pi / 180; //Ω
        var M0 = planet[6] * pi / 180;
    
        var Ax = a *                     ( cos(peri)*cos(node) - sin(peri)*cos(i)*sin(node));
        var Bx = a * Math.sqrt(1-e**2) * (-sin(peri)*cos(node) - cos(peri)*cos(i)*sin(node));
        var Ay = a *                     ( sin(peri)*cos(i)*cos(node)*cose + cos(peri)*sin(node)*cose - sin(peri)*sin(i)*sine);
        var By = a * Math.sqrt(1-e**2) * ( cos(peri)*cos(i)*cos(node)*cose - sin(peri)*sin(node)*cose - cos(peri)*sin(i)*sine);
        var Az = a *                     ( sin(peri)*cos(i)*cos(node)*sine + cos(peri)*sin(node)*sine + sin(peri)*sin(i)*cose);
        var Bz = a * Math.sqrt(1-e**2) * ( cos(peri)*cos(i)*cos(node)*sine - sin(peri)*sin(node)*sine + cos(peri)*sin(i)*cose);
        var n = 0.01720209895 / Math.pow(a, 1.5); //平均日日運動(rad)
        var M = (M0 + n * (JD - T)) % (2 * pi);
        var E = M + e * sin(M);
        if (Math.abs(E - M) > 0.000001){
            var newE = M + e * sin(E);
            while (Math.abs(newE - E) > 0.000001){
                E = newE;
                newE = M + e * sin(E);
            }
            E = newE;
        }
        
        var cE_e = cos(E) - e;
        var sE = sin(E);
        
        var x = Ax * cE_e + Bx * sE;
        var y = Ay * cE_e + By * sE;
        var z = Az * cE_e + Bz * sE;
        
        return [x, y, z];
    }

    function calculate_Moon(JD, lat_obs, theta) {
        var d = JD - 2451543.5;
        var Ms = (356.0470 + 0.9856002585 * d) % 360 * pi/180;
        var Mm = (115.3654 + 13.0649929509 * d) % 360 * pi/180;
        var Nm = (125.1228 - 0.0529538083 * d) % 360 * pi/180;
        var ws = (282.9404 + 0.0000470935 * d) * pi/180;
        var wm = (318.0634 + 0.1643573223 * d) % 360 * pi/180;
        var e = 0.054900;
        var a = 60.2666;
        var i = 5.1454 * pi/180;
        var D = Mm + wm + Nm - Ms - ws;
        var F = Mm + wm;
        
        var E = Mm + e * sin(Mm);
        if (Math.abs(E - Mm) > 0.000001) {
            var newE = Mm + e * sin(E);
            while (Math.abs(newE - E) > 0.000001){
                E = newE;
                newE = Mm + e * sin(E);
            }
            E = newE;
        }
        var xv = a * (cos(E) - e);
        var yv = a * Math.sqrt(1 - e**2) * sin(E);

        var v = Math.atan2(yv, xv);
        var dist = Math.sqrt(xv**2 + yv**2);
        
        var xh = dist * (cos(Nm) * cos(v+wm) - sin(Nm) * sin(v+wm) * cos(i));
        var yh = dist * (sin(Nm) * cos(v+wm) + cos(Nm) * sin(v+wm) * cos(i));
        var zh = dist * sin(v+wm) * sin(i);
        
        var lon_moon = Math.atan2(yh, xh);
        var lat_moon = Math.atan2(zh, Math.sqrt(xh**2 + yh**2));
        
        lon_obs +=(- 1.274*sin(Mm - 2*D)
                    + 0.658*sin(2*D)
                    - 0.186*sin(Ms)
                    - 0.059*sin(2*Mm - 2*D)
                    - 0.057*sin(Mm - 2*D + Ms)
                    + 0.053*sin(Mm + 2*D)
                    + 0.046*sin(2*D - Ms)
                    + 0.041*sin(Mm - Ms)
                    - 0.035*sin(D)
                    - 0.031*sin(Mm + Ms)
                    - 0.015*sin(2*F - 2*D)
                    + 0.011*sin(Mm - 4*D))* pi/180; //rad
        lat_moon += (- 0.173*sin(F - 2*D)
                    - 0.055*sin(Mm - F - 2*D)
                    - 0.046*sin(Mm + F - 2*D)
                    + 0.033*sin(F + 2*D)
                    + 0.017*sin(2*Mm + F)) * pi/180; //rad
        dist += -0.58*cos(Mm - 2*D) - 0.46*cos(2*D); //地球半径

        lon_moon -= 0.0002437 * (JD - 2451545.0) / 365.25; //lon, latはJ2000.0
        
        var Xe = cos(lat_moon) * cos(lon_moon)                             * dist * 6378.14 / 1.49598e8; //au
        var Ye = (-sin(lat_moon) * sine + cos(lat_moon) * sin(lon_moon) * cose) * dist * 6378.14 / 1.49598e8; //au
        var Ze = (sin(lat_moon) * cose + cos(lat_moon) * sin(lon_moon) * sine)  * dist * 6378.14 / 1.49598e8; //au

        var xe = Xe - cos(lat_obs) * cos(theta) * 6378.14 / 1.49598e8; //au
        var ye = Ye - cos(lat_obs) * sin(theta) * 6378.14 / 1.49598e8; //au
        var ze = Ze - sin(lat_obs)              * 6378.14 / 1.49598e8; //au
        var RA = (Math.atan2(ye, xe) * 180/pi + 360) % 360; //deg
        var Dec = Math.atan2(ze, Math.sqrt(xe**2 + ye**2)) * 180/pi; //deg

        dist *= 6378.14;

        return [Xe, Ye, Ze, RA, Dec, dist, Ms, ws, lon_moon, lat_moon] //au, au, au, deg, deg, km, rad瞬時, rad瞬時, radJ2000.0, radJ2000.0
    }

    function cal_Parabola(planet, JD) {
        var tp = planet[0];
        var q = planet[1];
        var peri = planet[3] * pi / 180; //ω
        var i = planet[4] * pi / 180;
        var node = planet[5] * pi / 180; //Ω
    
        var Ax =     q * ( cos(peri)*cos(node) - sin(peri)*cos(i)*sin(node));
        var Bx = 2 * q * (-sin(peri)*cos(node) - cos(peri)*cos(i)*sin(node));
        var Ay =     q * ( sin(peri)*cos(i)*cos(node)*cose + cos(peri)*sin(node)*cose - sin(peri)*sin(i)*sine);
        var By = 2 * q * ( cos(peri)*cos(i)*cos(node)*cose - sin(peri)*sin(node)*cose - cos(peri)*sin(i)*sine);
        var Az =     q * ( sin(peri)*cos(i)*cos(node)*sine + cos(peri)*sin(node)*sine + sin(peri)*sin(i)*cose);
        var Bz = 2 * q * ( cos(peri)*cos(i)*cos(node)*sine - sin(peri)*sin(node)*sine + cos(peri)*sin(i)*cose);
        
        var b = Math.atan(54.80779386 * Math.pow(q, 1.5) / (JD - tp));
        if (Math.tan(b/2) >= 0) {
            var g = Math.atan(Math.pow(Math.tan(b/2), 1/3));
        } else {
            var g = -Math.atan(Math.pow(-Math.tan(b/2), 1/3));
        }
        var tanv2 = 2 / Math.tan(2*g);

        var x = Ax * (1 - tanv2**2) + Bx * tanv2;
        var y = Ay * (1 - tanv2**2) + By * tanv2;
        var z = Az * (1 - tanv2**2) + Bz * tanv2;
        
        return [x, y, z];
    }
}

function show_main(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#003';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const pi = Math.PI;

    var JD = showingJD;

    var t = (JD - 2451545.0) / 36525;
    var theta = ((24110.54841 + 8640184.812866*t + 0.093104*t**2 - 0.0000062*t**3)/86400 % 1 + 1.00273781 * ((JD-2451544.5)%1)) * 2*pi + lon_obs //rad

    var Astr = "";
    var hstr = "";
    if (ObsPlanet == "地球") {
        var Dec_rad = cenDec * pi/180;
        var RA_rad = cenRA * pi/180;
        var A = (Math.atan2(-cos(Dec_rad)*sin(theta-RA_rad), sin(Dec_rad)*cos(lat_obs)-cos(Dec_rad)*sin(lat_obs)*cos(theta-RA_rad)) * 180/pi + 360) % 360;
        const direcs = ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東', '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西', '北'];
        var direc = direcs[Math.floor((A + 11.25) / 22.5)];
        var h = Math.asin(sin(Dec_rad)*sin(lat_obs) + cos(Dec_rad)*cos(lat_obs)*cos(theta-RA_rad)) * 180/pi;
        Astr = `方位角 ${Math.round(A*10)/10}°(${direc}) `;
        hstr = `高度 ${Math.round(h*10)/10}° `;
    }

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
            constellation = CLnames[i] + "座  ";
            break;
        }
        if (cenDec > 0) {
            constellation = "こぐま座  ";
        } else {
            constellation = "はちぶんぎ座  ";
        }
    }

    if (SHmode) {
        //星座線
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
            if (Math.min(RA1_SH, RA2_SH) < rgEW && Math.max(RA1_SH, RA2_SH) > -rgEW) {
                if (Math.min(Dec1_SH, Dec2_SH) < rgNS && Math.max(Dec1_SH, Dec2_SH) > -rgNS) {
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

        //HIP
        ctx.fillStyle = starColor;
        for (i=0; i<HIPRAary.length; i++){
            var RA = HIPRAary[i];
            var Dec = HIPDecary[i];
            var mag = HIPmagary[i];
            var [RA_SH, Dec_SH] = angleSH(RA, Dec);
            if (mag < magLim && Math.abs(RA_SH) < rgEW && Math.abs(Dec_SH) < rgNS) {
                var [x, y] = coordSH(RA_SH, Dec_SH);
                ctx.beginPath();
                ctx.arc(x, y, size(mag), 0, 2 * pi, false);
                ctx.fill();
            }
        }

        //Tycho
        var skyareas = [];
        if (magLim > 6.5) {
            var minDec = Math.max(-90, Math.min(SHtoRADec(rgEW, -rgNS)[1], cenDec-rgNS));
            var maxDec = Math.min( 90, Math.max(SHtoRADec(rgEW,  rgNS)[1], cenDec+rgNS));

            if (minDec == -90) {
                skyareas = [[SkyArea(0, -90), SkyArea(359.9, maxDec)]];
            } else if (maxDec == 90) {
                skyareas = [[SkyArea(0, minDec), SkyArea(359.9, 89.9)]];
                console.log(skyareas);
            } else {
                var RArange1 = (SHtoRADec(rgEW,  rgNS)[0] - cenRA + 360) % 360;
                var RArange2 = (SHtoRADec(rgEW,     0)[0] - cenRA + 360) % 360;
                var RArange3 = (SHtoRADec(rgEW, -rgNS)[0] - cenRA + 360) % 360;
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

        // 星座名
        ctx.font = '20px times new roman';
        if (document.getElementById('constNameCheck').checked && rgEW < 0.5 * document.getElementById('constNameFrom').value) {
            ctx.fillStyle = 'white';
            for (i=0; i<88; i++){
                var RA = 1.0 * constPos[2*i];
                var Dec = 1.0 * constPos[2*i+1];
                var constName = CLnames[i];
                var [RA_SH, Dec_SH] = angleSH(RA, Dec);
                if (Math.abs(RA_SH) < rgEW && Math.abs(Dec_SH) < rgNS) {
                    var [x, y] = coordSH(RA_SH, Dec_SH);
                    ctx.fillText(constName, x-40, y-10);
                }
            }
        }

        ctx.font = '16px serif';
        ctx.strokeStyle = 'orange';
        ctx.fillStyle = 'orange';

        //メシエ天体とポピュラー天体
        if (document.getElementById('MessierCheck').checked && rgEW < 0.5 * document.getElementById('MessierFrom').value) {
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
                    if (Math.abs(RA_SH) < rgEW && Math.abs(Dec_SH) < rgNS) {
                        var [x, y] = coordSH(RA_SH, Dec_SH);
                        DrawObjects(name, x, y, type);
                    }
                }
            }
        }

        // メシエ以外
        if (document.getElementById('NGCCheck').checked && rgEW < 0.5 * document.getElementById('NGCFrom').value) {
            DrawNGC_SH();
        }

        //惑星、惑星の名前
        ctx.font = '20px serif';
        ctx.textBaseline = 'bottom';
        ctx.textAlign = 'left';

        for (i=0; i<JPNplanets.length; i++){
            var [RA_SH, Dec_SH] = angleSH(RAlist[i], Declist[i]);
            // 枠内に入っていて
            if (i != Obs_num && Math.abs(RA_SH) < rgEW && Math.abs(Dec_SH) < rgNS) {
                var [x, y] = coordSH(RA_SH, Dec_SH);
                if (i == 0){ // 太陽
                    var r = Math.max(canvas.width * (0.267 / dist_Sun) / rgEW / 2, 13);
                    ctx.fillStyle = yellowColor;
                    ctx.beginPath();
                    ctx.arc(x, y, r, 0, 2 * pi, false);
                    ctx.fill();
                    ctx.fillStyle = '#FF8';
                    ctx.fillText(JPNplanets[i], x+Math.max(0.8*r, 10), y-Math.max(0.8*r, 10));
                } else if (i == 9) { // 月(地球から見たときだけ)
                    if (Obs_num == 3) {
                        var r = DrawMoon();
                        ctx.fillStyle = '#FF8';
                        ctx.fillText(JPNplanets[i], x+Math.max(0.8*r, 10), y-Math.max(0.8*r, 10));
                    }
                } else if (i != 9) {// 太陽と月以外
                    var mag = Vlist[i];
                    ctx.fillStyle = '#F33'
                    ctx.beginPath();
                    ctx.arc(x, y, Math.max(size(mag), 0.5), 0, 2 * pi, false);
                    ctx.fill();
                    ctx.fillStyle = '#FF8';
                    ctx.fillText(JPNplanets[i], x, y);
                }
            }
        }
    } else { //正距円筒図法
        //星座線
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        const num_of_lines = lines.length / 5;
        for (var i=0; i<num_of_lines; i++) {
            var RA1 = parseFloat(lines[5*i+1]);
            var Dec1 = parseFloat(lines[5*i+2]);
            var RA2 = parseFloat(lines[5*i+3]);
            var Dec2 = parseFloat(lines[5*i+4]);
            function whetherDrawLine (RA1, Dec1, RA2, Dec2, a) {
                if (Math.min(RA1, RA2)+a < cenRA+rgEW && Math.max(RA1, RA2)+a > cenRA-rgEW) {
                    if (Math.min(Dec1, Dec2) < cenDec+rgNS && Math.max(Dec1, Dec2) > cenDec-rgNS) {
                        return true;
                    }
                }
                return false;
            }
            if (cenRA - rgEW < 0) {
                if (whetherDrawLine (RA1, Dec1, RA2, Dec2, 0)) {
                    drawLines(RA1, Dec1, RA2, Dec2, 0);
                }
                if (whetherDrawLine (RA1, Dec1, RA2, Dec2, -360)) {
                    drawLines(RA1, Dec1, RA2, Dec2, -360);
                }
            } else if (cenRA + rgEW >= 360) {
                if (whetherDrawLine (RA1, Dec1, RA2, Dec2, 0)) {
                    drawLines(RA1, Dec1, RA2, Dec2, 0);
                }
                if (whetherDrawLine (RA1, Dec1, RA2, Dec2, 360)) {
                    drawLines(RA1, Dec1, RA2, Dec2, 360);
                }
            } else {
                if (whetherDrawLine (RA1, Dec1, RA2, Dec2, 0)) {
                    drawLines(RA1, Dec1, RA2, Dec2, 0);
                }
            }
        }
        ctx.stroke();

        //HIP
        ctx.fillStyle = starColor;
        for (i=0; i<HIPRAary.length; i++){
            var RA = HIPRAary[i];
            var Dec = HIPDecary[i];
            var mag = HIPmagary[i];
            if (Math.abs(RApos(RA)) < rgEW && Math.abs(Dec-cenDec) < rgNS && mag < magLim) {
                var [x, y] = coord(RA, Dec);
                ctx.beginPath();
                ctx.arc(x, y, size(mag), 0, 2 * pi, false);
                ctx.fill();
            }
        }

        //Tycho
        if (magLim > 6.5) {
            if (cenRA - rgEW < 0) {
                //skyareasは[[a, b]]のaの領域とbの領域を両方含む
                var skyareas = [[SkyArea(0,              cenDec-rgNS), SkyArea(cenRA+rgEW, cenDec-rgNS)],
                                [SkyArea(cenRA-rgEW+360, cenDec-rgNS), SkyArea(359.9,      cenDec-rgNS)]];
                for (var i=1; i<=Math.floor(cenDec+rgNS)-Math.floor(cenDec-rgNS); i++) {
                    skyareas.push([skyareas[0][0]+360*i, skyareas[0][1]+360*i]);
                    skyareas.push([skyareas[1][0]+360*i, skyareas[1][1]+360*i]);
                }
            } else if (cenRA + rgEW >= 360) {
                var skyareas = [[SkyArea(0,          cenDec-rgNS), SkyArea(cenRA+rgEW-360, cenDec-rgNS)],
                                [SkyArea(cenRA-rgEW, cenDec-rgNS), SkyArea(359.9,          cenDec-rgNS)]];
                for (var i=1; i<=Math.floor(cenDec+rgNS)-Math.floor(cenDec-rgNS); i++) {
                    skyareas.push([skyareas[0][0]+360*i, skyareas[0][1]+360*i]);
                    skyareas.push([skyareas[1][0]+360*i, skyareas[1][1]+360*i]);
                }
            } else {
                var skyareas = [[SkyArea(cenRA-rgEW, cenDec-rgNS), SkyArea(cenRA+rgEW, cenDec-rgNS)]];
                for (var i=1; i<=Math.floor(cenDec+rgNS)-Math.floor(cenDec-rgNS); i++) {
                    skyareas.push([skyareas[0][0]+360*i, skyareas[0][1]+360*i]);
                }
            }
            DrawStars(skyareas);
            if (magLim > 10) {
                DrawStars1011(skyareas);
            }
        }

        // 星座名
        ctx.font = '20px times new roman';
        if (document.getElementById('constNameCheck').checked && rgEW < 0.5 * document.getElementById('constNameFrom').value) {
            ctx.fillStyle = 'white';
            for (i=0; i<88; i++){
                var RA = 1.0 * constPos[2*i];
                var Dec = 1.0 * constPos[2*i+1];
                var constName = CLnames[i];
                if (Math.abs(RApos(RA)) < rgEW && Math.abs(Dec-cenDec) < rgNS) {
                    var [x, y] = coord(RA, Dec);
                    ctx.fillText(constName, x-40, y-10);
                }
            }
        }

        ctx.font = '16px serif';
        ctx.strokeStyle = 'orange';
        ctx.fillStyle = 'orange';

        //メシエ天体とポピュラー天体
        if (document.getElementById('MessierCheck').checked && rgEW < 0.5 * document.getElementById('MessierFrom').value) {
            //メシエ
            DrawMessier();
            //ポピュラー
            for (i=0; i<NGC.length/4; i++){
                var name = NGC[4*i];
                if (popularList.indexOf(name) != -1) {
                    var RA = parseFloat(NGC[4*i+1]);
                    var Dec = parseFloat(NGC[4*i+2]);
                    var type = NGC[4*i+3];
                    if (Math.abs(RApos(RA)) < rgEW && Math.abs(Dec-cenDec) < rgNS) {
                        var [x, y] = coord(RA, Dec);
                        DrawObjects(name, x, y, type);
                    }
                }
            }
        }

        // メシエ以外
        if (document.getElementById('NGCCheck').checked && rgEW < 0.5 * document.getElementById('NGCFrom').value) {
            DrawNGC();
        }

        //惑星、惑星の名前
        ctx.font = '20px serif';
        ctx.textBaseline = 'bottom';
        ctx.textAlign = 'left';

        for (i=0; i<JPNplanets.length; i++){
            // 枠内に入っていて
            if (i != Obs_num && Math.abs(RApos(RAlist[i])) < rgEW && Math.abs(Declist[i]-cenDec) < rgNS) {
                var [x, y] = coord(RAlist[i], Declist[i]);
                if (i == 0){ // 太陽
                    var r = Math.max(canvas.width * (0.267 / dist_Sun) / rgEW / 2, 13);
                    ctx.fillStyle = yellowColor;
                    ctx.beginPath();
                    ctx.arc(x, y, r, 0, 2 * pi, false);
                    ctx.fill();
                    ctx.fillStyle = '#FF8';
                    ctx.fillText(JPNplanets[i], x+Math.max(0.8*r, 10), y-Math.max(0.8*r, 10));
                } else if (i == 9) { // 月(地球から見たときだけ)
                    if (Obs_num == 3) {
                        var r = DrawMoon();
                        ctx.fillStyle = '#FF8';
                        ctx.fillText(JPNplanets[i], x+Math.max(0.8*r, 10), y-Math.max(0.8*r, 10));
                    }
                } else if (i != 9) {// 太陽と月以外
                    var mag = Vlist[i];
                    ctx.fillStyle = '#F33'
                    ctx.beginPath();
                    ctx.arc(x, y, Math.max(size(mag), 0.5), 0, 2 * pi, false);
                    ctx.fill();
                    ctx.fillStyle = '#FF8';
                    ctx.fillText(JPNplanets[i], x, y);
                }
            }
        }
    }

    var RAtext = `赤経 ${Math.floor(cenRA/15)}h ${Math.round((cenRA-15*Math.floor(cenRA/15))*4*10)/10}m `;
    if (cenDec >= 0) {
        var Dectext = `赤緯 +${Math.floor(cenDec)}° ${Math.round((cenDec-Math.floor(cenDec))*60)}' (J2000.0) `;
    } else {
        var Dectext = `赤緯 -${Math.floor(-cenDec)}° ${Math.round((-cenDec-Math.floor(-cenDec))*60)}' (J2000.0) `;
    }
    
    var coordtext = `${constellation}　${rgtext}　${magLimtext}<br>${RAtext}${Dectext}<br>${Astr}${hstr}`;
    document.getElementById("coordtext").innerHTML = coordtext;

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

    function drawLines(RA1, Dec1, RA2, Dec2, a){
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
                if (Math.abs(Dec-cenDec) < rgNS && Math.abs(RApos(RA)) < rgEW && mag < magLim) {
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
                if (Math.abs(Dec-cenDec) < rgNS && Math.abs(RApos(RA)) < rgEW && mag < magLim) {
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
                if (mag < magLim && Math.abs(Dec_SH) < rgNS && Math.abs(RA_SH) < rgEW) {
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
                if (mag < magLim && Math.abs(Dec_SH) < rgNS && Math.abs(RA_SH) < rgEW) {
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
            if (Math.abs(RApos(RA)) < rgEW && Math.abs(Dec-cenDec) < rgNS) {
                var [x, y] = coord(RA, Dec);
                DrawObjects("M" + (i+1).toString(), x, y, type);
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
            if (Math.abs(RA_SH) < rgEW && Math.abs(Dec_SH) < rgNS) {
                var [x, y] = coordSH(RA_SH, Dec_SH);
                DrawObjects("M" + (i+1).toString(), x, y, type);
            }
        }
    }

    function DrawNGC_SH() {
        ctx.strokeStyle = 'orange';
        ctx.fillStyle = 'orange';
        for (i=0; i<NGC.length/4; i++){
            var name = NGC[4*i];
            if (popularList.indexOf(name) == -1) {
                var RA = parseFloat(NGC[4*i+1]);
                var Dec = parseFloat(NGC[4*i+2]);
                var type = NGC[4*i+3];
                var [RA_SH, Dec_SH] = angleSH(RA, Dec);
                if (Math.abs(RA_SH) < rgEW && Math.abs(Dec_SH) < rgNS) {
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