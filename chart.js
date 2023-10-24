//2023/10/21 ~ 10/24

// 入力をURLに反映するのは
// URLを表示に反映するのは最初のみ

//分断の色と星の色を変える
const separationColor = '#FFF'
const starColor = '#FFF'
const yellowColor = 'yellow'
//'yellow'は全部yellowColorにする

document.getElementById('setting').style.visibility = "hidden";
document.getElementById('description').style.visibility = "hidden";

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 30;

document.getElementById('title').innerHTML = "星図　w=" + Math.round(window.innerWidth*100)/100 + " h=" + Math.round(window.innerHeight*100)/100;

var cenRA = 270;
var cenDec = -25;

var rgEW = 10;
var rgNS = rgEW * canvas.height / canvas.width;

var rgtext = "視野(左右):" + Math.round(rgEW * 20) / 10 + "°";

var magLimtext;
function find_magLim(rgEW) {
    var magLim = 10.5 - 1.8 * Math.log(rgEW);
    if (magLim > 10) {
        magLim = 10;
    } else if (magLim < 4) {
        magLim = 4;
    }
    magLimtext = "~" + Math.round(magLim * 10) / 10 + "等級";
    return magLim;
}
var magLim = find_magLim(rgEW);

function find_zerosize(EW) {
    return 13 - 2.4 * Math.log(rgEW + 3)
}
var zerosize = find_zerosize(rgEW);

var xhrcheck = 0;
var defaultcheck = 0;

function loadFile(filename) {
    var url = "https://peteworden.github.io/Soleil/" + filename + ".txt";
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.send();
    xhr.onreadystatechange = function() {
        if(xhr.readyState === 4 && xhr.status === 200) {
            const DataAry = xhr.responseText.split(',');
            
            num_of_stars = DataAry.length / 3;
    
            HIPRAary = Array(num_of_stars);
            HIPDecary = Array(num_of_stars);
            HIPmagary = Array(num_of_stars);
            for (i=0; i<num_of_stars; i++){
                HIPRAary[i] = parseFloat(DataAry[3*i]);
                HIPDecary[i] = parseFloat(DataAry[3*i+1]);
                HIPmagary[i] = parseFloat(DataAry[3*i+2]);
            }
            console.log("HIP ready");
            xhrcheck++;
            show_initial();
        }
    }
}

//HIP
var num_of_stars = 0;
var HIPRAary = Array(1);
var HIPDecary = Array(1);
var HIPmagary = Array(1);

var HIPurl = "https://peteworden.github.io/Soleil/StarsNewHIP_to6_5_set.txt";
var xhr = new XMLHttpRequest();

xhr.open('GET', HIPurl);
xhr.send();
xhr.onreadystatechange = function() {
    if(xhr.readyState === 4 && xhr.status === 200) {
        const DataAry = xhr.responseText.split(',');
        
        num_of_stars = DataAry.length / 3;

        HIPRAary = Array(num_of_stars);
        HIPDecary = Array(num_of_stars);
        HIPmagary = Array(num_of_stars);
        for (i=0; i<num_of_stars; i++){
            HIPRAary[i] = parseFloat(DataAry[3*i]);
            HIPDecary[i] = parseFloat(DataAry[3*i+1]);
            HIPmagary[i] = parseFloat(DataAry[3*i+2]);
        }
        console.log("HIP ready");
        xhrcheck++;
        show_initial();
    }
}

//Tycho
var Tycho = [];
var Tychourl = "https://peteworden.github.io/Soleil/StarsNew-Tycho-to10-2nd_forJS.txt";
var xhrT = new XMLHttpRequest();

xhrT.open('GET', Tychourl);
xhrT.send();
xhrT.onreadystatechange = function() {
    if(xhrT.readyState === 4 && xhrT.status === 200) {
        Tycho = xhrT.responseText.split(',');
        console.log("Tycho2 ready");
        xhrcheck++;
        show_initial();
    }
}

//Tycho helper
var Help = [];
var TychoHelpurl = "https://peteworden.github.io/Soleil/TychoSearchHelper2nd_forJS.txt";
var xhrH = new XMLHttpRequest();

xhrH.open('GET', TychoHelpurl);
xhrH.send();
xhrH.onreadystatechange = function() {
    if(xhrH.readyState === 4 && xhrH.status === 200) {
        Help = xhrH.responseText.split(',');
        console.log("helper ready")
        xhrcheck++;
        show_initial();
    }
}

// メシエ天体
var messier = Array(3 * 110);
var messierurl = "https://peteworden.github.io/Soleil/messier_forJS.txt";
var xhrM = new XMLHttpRequest();

xhrM.open('GET', messierurl);
xhrM.send();
xhrM.onreadystatechange = function() {
    if(xhrM.readyState === 4 && xhrM.status === 200) {
        messier = xhrM.responseText.split(',');
        console.log("Messier ready");
        xhrcheck++;
        show_initial();
    }
}

// NGC天体
var NGC;
var NGCurl = "https://peteworden.github.io/Soleil/NGC_forJS.txt";
var xhrNGC = new XMLHttpRequest();

xhrNGC.open('GET', NGCurl);
xhrNGC.send();
xhrNGC.onreadystatechange = function() {
    if(xhrNGC.readyState === 4 && xhrNGC.status === 200) {
        NGC = xhrNGC.responseText.split(',');
        console.log("NGC ready");
        xhrcheck++;
        show_initial();
    }
}

//星座名
var CLnames = [];
var CLurl = "https://peteworden.github.io/Soleil/ConstellationList.txt";
var xhrCL = new XMLHttpRequest();

xhrCL.open('GET', CLurl);
xhrCL.send();
xhrCL.onreadystatechange = function() {
    if(xhrCL.readyState === 4 && xhrCL.status === 200) {
        CLnames = xhrCL.responseText.split('\r\n');
        console.log("constellations' names ready");
        xhrcheck++;
        show_initial();
    }
}

//星座の位置
var constPos = [];
var constPosurl = "https://peteworden.github.io/Soleil/ConstellationPositionNew_forJS.txt";
var xhrconstPos = new XMLHttpRequest();

xhrconstPos.open('GET', constPosurl);
xhrconstPos.send();
xhrconstPos.onreadystatechange = function() {
    if(xhrconstPos.readyState === 4 && xhrconstPos.status === 200) {
        constPos = xhrconstPos.responseText.split(',');
        console.log("constellations' positions ready");
        xhrcheck++;
        show_initial();
    }
}

//星座線
var lines = [];
var lineurl = "https://peteworden.github.io/Soleil/Lines_light_forJS.txt";
var xhrL = new XMLHttpRequest();

xhrL.open('GET', lineurl);
xhrL.send();
xhrL.onreadystatechange = function() {
    if(xhrL.readyState === 4 && xhrL.status === 200) {
        lines = xhrL.responseText.split(',');
        console.log("lines ready");
        xhrcheck++;
        show_initial();
    }
}

//星座境界線
var boundary = [];
var boundaryurl = "https://peteworden.github.io/Soleil/boundary_light_forJS.txt";
var xhrB = new XMLHttpRequest();

xhrB.open('GET', boundaryurl);
xhrB.send();
xhrB.onreadystatechange = function() {
    if(xhrB.readyState === 4 && xhrB.status === 200) {
        boundary = xhrB.responseText.split(',');
        console.log("constellation boundarys ready");
        xhrcheck++;
        show_initial();
    }
}

//追加天体
var ENGplanets = ['Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Moon', 'Ceres', 'Vesta'];
var JPNplanets = ['太陽',  '水星', '金星', '地球', '火星',  '木星', '土星', '天王星', '海王星', '月', 'Ceres', 'Vesta'];
var RAlist = new Array(20);
var Declist = new Array(20);
var Distlist = new Array(20);
var Vlist = new Array(20);
var Ms, ws, lon, lat, dist_Moon, dist_Sun;

var extra = [];
var extraurl = "https://peteworden.github.io/Soleil/ExtraPlanet.txt";
var xhrX = new XMLHttpRequest();

xhrX.open('GET', extraurl);
xhrX.send();
xhrX.onreadystatechange = function() {
    if(xhrX.readyState === 4 && xhrX.status === 200) {
        extra = xhrX.responseText.split(' ');

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
                        
            if (url.searchParams.has('observer') && xhrcheck == 7) {
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

        console.log("extra ready");
        xhrcheck++;
        show_initial();
    }
}

var showingJD = 0;

const url = new URL(window.location.href);
console.log(url.href);
url.searchParams.set('RA', Math.round(cenRA*100)/100);
url.searchParams.set('Dec', Math.round(cenDec*100)/100);

function link(obj) {
    if (obj[0] == 'M' && isNaN(obj.substr(1)) == false) { //メシエ
        var i = parseInt(obj.substr(1)) - 1;
        cenRA = parseFloat(messier[3*i]);
        cenDec = parseFloat(messier[3*i+1]);
        url.searchParams.set('RA', cenRA);
        url.searchParams.set('Dec', cenDec);
    } else { //その他
        for (var i=0; i<NGC.length/4; i++) {
            console.log(obj, NGC[4*i]);
            if (obj == NGC[4*i]) {
                cenRA = parseFloat(NGC[4*i+1]);
                cenDec = parseFloat(NGC[4*i+2]);
                url.searchParams.set('RA', cenRA);
                url.searchParams.set('Dec', cenDec);
            }
        }
    }
    document.getElementById("settingBtn").removeAttribute("disabled");
    document.getElementById('description').style.visibility = "hidden";
    show_main();
}

// キーを指定し、クエリパラメータを取得
if (url.searchParams.has('time')) {
    var [y, m, d, h] = url.searchParams.get('time').split('-');
    setYMDH(y, m, d, h)
    defaultcheck++;
    show_initial();
} else {
    defaultcheck++;
    show_initial();
}

if (url.searchParams.has('lat')) {
    var lat = url.searchParams.get('lat');
    if (lat >= 0) {
        document.getElementById("NSCombo").value = '北緯';
        document.getElementById('lat').value = lat;
    } else {
        document.getElementById("NSCombo").value = '南緯';
        document.getElementById('lat').value = -lat;
    }
    defaultcheck++;
    show_initial();
} else {
    defaultcheck++;
    show_initial();
}

if (url.searchParams.has('lon')) {
    var lon = url.searchParams.get('lon');
    if (lon >= 0) {
        document.getElementById("EWCombo").value = '東経';
        document.getElementById('lon').value = lon;
    } else {
        document.getElementById("EWCombo").value = '西経';
        document.getElementById('lon').value = -lon;
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
    setYMDH(y, m, d, h)
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

function show_initial(){
    if (xhrcheck == 10 && defaultcheck == 4){
        now();
        show();
    } else {
        console.log(xhrcheck, defaultcheck);
    }
}

function showSetting() {
    document.getElementById("descriptionBtn").setAttribute("disabled", true);
    document.getElementById('setting').style.visibility = "visible";
}

function finishSetting() {
    document.getElementById("descriptionBtn").removeAttribute("disabled");
    document.getElementById('setting').style.visibility = "hidden";
    show();
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

function show() {
    let year = parseInt(document.getElementById('yearText').value);
    let month = parseInt(document.getElementById('monthText').value);
    let date = parseInt(document.getElementById('dateText').value);
    let hour = parseFloat(document.getElementById('hourText').value);

    url.searchParams.set('time', `${year}-${month}-${date}-${hour}`);
    console.log(url.href);
    history.replaceState('', '', url.href);

    if (document.getElementById("NSCombo").value == '北緯') {
        var lattext = document.getElementById('lat').value + "°N";
    } else {
        var lattext = document.getElementById('lat').value + "°S";
    }
    if (document.getElementById("EWCombo").value == '東経') {
        var lontext = document.getElementById('lon').value + "°E";
    } else {
        var lontext = document.getElementById('lon').value + "°W";
    }
    document.getElementById('showingData').innerHTML = year + "/" + month + "/" + date + "/" + hour + "時JST " + lattext + " " + lontext;

    showingJD = YMDH_to_JD(year, month, date, hour);
    calculation(showingJD);
    show_main();
}

function show_JD_plus1(){
    showingJD += 1;
    var [y, m, d, h] = JD_to_YMDH(showingJD);
    setYMDH(y, m, d, h)
    calculation(showingJD);
    show_main();
}

function show_JD_minus1(){
    showingJD -= 1;
    var [y, m, d, h] = JD_to_YMDH(showingJD);
    setYMDH(y, m, d, h)
    calculation(showingJD);
    show_main();
}

var startX, startY, moveX, moveY, dist_detect = Math.round(canvas.width / 25);// distはスワイプを感知する最低距離（ピクセル単位）
var baseDistance = 0;
var movedDistance = 0;
var distance = 0;
var pinchFrag = 0;

// タッチ開始
canvas.addEventListener("touchstart", function(e) {
    e.preventDefault();
    pinchFrag = 0;
    startX = e.touches[0].pageX;
    startY = e.touches[0].pageY;
});

// スワイプ中またはピンチイン・ピンチアウト中
canvas.addEventListener("touchmove", onMouseMove);
function onMouseMove(e) {
    e.preventDefault();
    var touches = e.changedTouches;
    if (touches.length.toString() == '1') {
        if (pinchFrag == 0) {
            moveX = touches[0].pageX;
            moveY = touches[0].pageY;
            if ((moveX-startX)*(moveX-startX) + (moveY-startY)*(moveY-startY) > dist_detect*dist_detect) {
                canvas.removeEventListener("touchmove", onMouseMove);
                cenRA  = ((cenRA  + 2 * rgEW * (moveX - startX) / canvas.width ) % 360 + 360) % 360;
                cenDec = Math.min(Math.max(-90, cenDec + 2 * rgNS * (moveY - startY) / canvas.height), 90);
                url.searchParams.set('RA', Math.round(cenRA*100)/100);
                url.searchParams.set('Dec', Math.round(cenDec*100)/100);
                show_main();
                startX = moveX;
                startY = moveY;
                canvas.addEventListener("touchmove", onMouseMove);
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
            canvas.removeEventListener("touchmove", onMouseMove);
            movedDistance = distance;
            var x3 = (x1 + x2) / 2 - canvas.offsetLeft;
            var y3 = (y1 + y2) / 2 - canvas.offsetTop;
            var pinchRA  = cenRA  - rgEW * (x3 - canvas.width  / 2) / (canvas.width  / 2);
            var pinchDec = cenDec - rgNS * (y3 - canvas.height / 2) / (canvas.height / 2);
            // scaleの調整はmoved=baseならばscale=1をキープするようscaleの1からのずれを定数倍する!
            var scale = 1 + (movedDistance / baseDistance - 1) * 1;
            if (scale && scale != Infinity) {
                rgNS /= scale;
                rgEW /= scale;
                if (rgEW < 0.3) {
                    rgNS = 0.3 * canvas.height / canvas.width;
                    rgEW = 0.3;
                }
                if (rgNS > 90) {
                    rgNS = 90;
                    rgEW = 90 * canvas.width / canvas.height;
                }
                cenRA  = (pinchRA  + (cenRA  - pinchRA ) / scale) % 360;
                cenDec = Math.min(Math.max(-90, pinchDec + (cenDec - pinchDec) / scale), 90);
                rgtext = "視野(左右):" + Math.round(rgEW * 20) / 10 + "°";
                magLim = find_magLim(rgEW);
                zerosize = find_zerosize(rgEW);
                url.searchParams.set('RA', Math.round(cenRA*100)/100);
                url.searchParams.set('Dec', Math.round(cenDec*100)/100);
                show_main();
                baseDistance = distance;
                canvas.addEventListener("touchmove", onMouseMove);
            }
        } else {
            // 基本の距離
            baseDistance = distance;
        }
    }
}

canvas.addEventListener('touchend', function(e) {
    baseDistance = 0;
});

canvas.addEventListener('touchcancel', function(e) {
    baseDistance = 0;
});


canvas.onmousedown = function(event){
    startX = event.pageX;
    startY = event.pageY;
    canvas.addEventListener("mousemove", onMouseMove);
}

//canvas.addEventListener("mousemove", onMouseMove);
var onMouseMove = function(e) {
    //e.preventDefault();
    moveX = e.pageX;
    moveY = e.pageY;
    if ((moveX-startX)*(moveX-startX) + (moveY-startY)*(moveY-startY) > dist_detect*dist_detect) {
        cenRA  = ((cenRA  + 2 * rgEW * (moveX - startX) / canvas.width ) % 360 + 360) % 360;
        cenDec =  cenDec + 2 * rgNS * (moveY - startY) / canvas.height;
        if (cenDec > 90) {
            cenDec = 90;
        }
        if (cenDec < -90) {
            cenDec = -90;
        }
        url.searchParams.set('RA', Math.round(cenRA*100)/100);
        url.searchParams.set('Dec', Math.round(cenDec*100)/100);
        show_main();
        startX = moveX;
        startY = moveY;
    }
}

canvas.onmouseup = function(event){
    canvas.removeEventListener("mousemove", onMouseMove);
}

canvas.onwheel = function zoom(event) {
    event.preventDefault();
    var x3 = event.pageX - canvas.offsetLeft;
    var y3 = event.pageY - canvas.offsetTop;
    var pinchRA  = cenRA  - rgEW * (x3 - canvas.width  / 2) / (canvas.width  / 2);
    var pinchDec = cenDec - rgNS * (y3 - canvas.height / 2) / (canvas.height / 2);
    var scale = 1 - event.deltaY * 0.0005;
    rgNS /= scale;
    rgEW /= scale;
    cenRA  = (pinchRA  + (cenRA  - pinchRA ) / scale) % 360;
    cenDec = Math.min(Math.max(-90, pinchDec + (cenDec - pinchDec) / scale), 90);
    if (rgEW < 0.3) {
        rgNS = 0.3 * canvas.height / canvas.width;
        rgEW = 0.3;
    }
    if (rgNS > 90) {
        rgNS = 90;
        rgEW = 90 * canvas.width / canvas.height;
    }

    rgtext = "視野(左右):" + Math.round(rgEW * 20) / 10 + "°";
    magLim = find_magLim(rgEW);
    zerosize = find_zerosize(rgEW);

    url.searchParams.set('RA', Math.round(cenRA*100)/100);
    url.searchParams.set('Dec', Math.round(cenDec*100)/100);
    show_main();
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
        JPNplanets.push(name);
        ENGplanets.push(name);
        var New = [];
        for (var i=parseInt(extra[0])+1; i<extra.length-4; i++) {
            New.push(parseFloat(extra[i]));
        }
        planets.push(New);
    }

    // 視点
    const ObsPlanet = document.getElementById("observer").value;
    const Obs_num = JPNplanets.indexOf(ObsPlanet);

    if (Obs_num == 3) {
        if (url.searchParams.has('observer')) {
            url.searchParams.delete('observer');
        }   
    } else {
        url.searchParams.set('observer', ENGplanets[Obs_num].split(' ').join('').split('/').join(''));
    }

    if (document.getElementById("NSCombo").value == '北緯' && document.getElementById('lat').value == '35') {
        if (url.searchParams.has('lat')) {
            url.searchParams.delete('lat');
        }
    } else {
        if (document.getElementById("NSCombo").value == '北緯') {
            url.searchParams.set('lat', document.getElementById('lat').value);
        } else {
            url.searchParams.set('lat', -document.getElementById('lat').value);
        }
    }

    if (document.getElementById("EWCombo").value == '東経' && document.getElementById('lon').value == '135') {
        if (url.searchParams.has('lon')) {
            url.searchParams.delete('lon');
        }
    } else {
        if (document.getElementById("EWCombo").value == '東経') {
            url.searchParams.set('lon', document.getElementById('lon').value);
        } else {
            url.searchParams.set('lon', -document.getElementById('lon').value);
        }
    }
        
    history.replaceState('', '', url.href);

    var lat_obs = parseInt(document.getElementById('lat').value) * pi/180;
    var lon_obs = parseInt(document.getElementById('lon').value) * pi/180;
    if (document.getElementById("NSCombo").value == '南緯') {lat_obs *= -1}
    if (document.getElementById("EWCombo").value == '西経') {lon_obs *= -1}
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
            var [Xe, Ye, Ze, RA_Moon, Dec_Moon, dist, Ms, ws, lon, lat] = calculate_Moon(JD, lat_obs, theta);
            Xlist[9] = x+Xe;
            Ylist[9] = y+Ye;
            Zlist[9] = z+Ze;
            RAlist[9] = RA_Moon;
            Declist[9] = Dec_Moon;
            Distlist[9] = dist;
            dist_Moon = dist;
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
            var [Xe, Ye, Ze, RA, Dec, dist, Ms, ws, lon, lat] = calculate_Moon(JD, lat_obs, theta)
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
        
        var lon = Math.atan2(yh, xh);
        var lat = Math.atan2(zh, Math.sqrt(xh**2 + yh**2));
        
        lon +=(- 1.274*sin(Mm - 2*D)
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
        lat += (- 0.173*sin(F - 2*D)
                - 0.055*sin(Mm - F - 2*D)
                - 0.046*sin(Mm + F - 2*D)
                + 0.033*sin(F + 2*D)
                + 0.017*sin(2*Mm + F)) * pi/180; //rad
        dist += -0.58*cos(Mm - 2*D) - 0.46*cos(2*D); //地球半径

        lon -= 0.0002437 * (JD - 2451545.0) / 365.25; //lon, latはJ2000.0
        
        var Xe = cos(lat) * cos(lon)                             * dist * 6378.14 / 1.49598e8; //au
        var Ye = (-sin(lat) * sine + cos(lat) * sin(lon) * cose) * dist * 6378.14 / 1.49598e8; //au
        var Ze = (sin(lat) * cose + cos(lat) * sin(lon) * sine)  * dist * 6378.14 / 1.49598e8; //au

        var xe = Xe - cos(lat_obs) * cos(theta) * 6378.14 / 1.49598e8; //au
        var ye = Ye - cos(lat_obs) * sin(theta) * 6378.14 / 1.49598e8; //au
        var ze = Ze - sin(lat_obs)              * 6378.14 / 1.49598e8; //au
        var RA = (Math.atan2(ye, xe) * 180/pi + 360) % 360; //deg
        var Dec = Math.atan2(ze, Math.sqrt(xe**2 + ye**2)) * 180/pi; //deg

        dist *= 6378.14;

        return [Xe, Ye, Ze, RA, Dec, dist, Ms, ws, lon, lat] //au, au, au, deg, deg, km, rad瞬時, rad瞬時, radJ2000.0, radJ2000.0
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

    var y = document.getElementById('yearText').value;
    var m = document.getElementById('monthText').value;
    var d = document.getElementById('dateText').value;
    var h = document.getElementById('hourText').value;
    url.searchParams.set('time', `${y}-${m}-${d}-${h}`);

    // 視点
    const ObsPlanet = document.getElementById("observer").value;
    const Obs_num = JPNplanets.indexOf(ObsPlanet);

    if (Obs_num == 3) {
        if (url.searchParams.has('observer')) {
            url.searchParams.delete('observer');
        }   
    } else {
        url.searchParams.set('observer', ENGplanets[Obs_num].split(' ').join('').split('/').join(''));
    }

    if (document.getElementById("NSCombo").value == '北緯' && document.getElementById('lat').value == '35') {
        if (url.searchParams.has('lat')) {
            url.searchParams.delete('lat');
        }
    } else {
        if (document.getElementById("NSCombo").value == '北緯') {
            url.searchParams.set('lat', document.getElementById('lat').value);
        } else {
            url.searchParams.set('lat', -document.getElementById('lat').value);
        }
    }

    if (document.getElementById("EWCombo").value == '東経' && document.getElementById('lon').value == '135') {
        if (url.searchParams.has('lon')) {
            url.searchParams.delete('lon');
        }
    } else {
        if (document.getElementById("EWCombo").value == '東経') {
            url.searchParams.set('lon', document.getElementById('lon').value);
        } else {
            url.searchParams.set('lon', -document.getElementById('lon').value);
        }
    }
        
    history.replaceState('', '', url.href);

    var lat_obs = parseInt(document.getElementById('lat').value) * pi/180;
    var lon_obs = parseInt(document.getElementById('lon').value) * pi/180;
    if (document.getElementById("NSCombo").value == '南緯') {
        lat_obs *= -1;
    }
    if (document.getElementById("EWCombo").value == '西経') {
        lon_obs *= -1;
    }
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
        Astr = '方位角  ' + Math.round(A*10)/10 + '°(' + direc + ')   ';
        hstr = '高度  ' + Math.round(h*10)/10 + '°  ';
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
        }
    }

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
    for (i=0; i<num_of_stars; i++){
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
            var skyareas = [[SkyArea(0,              cenDec-rgNS), SkyArea(cenRA+rgNS, cenDec-rgNS)],
                            [SkyArea(cenRA-rgEW+360, cenDec-rgNS), SkyArea(359.9,      cenDec-rgNS)]];
            for (var i=1; i<=Math.floor((cenDec+rgNS)/10)-Math.floor((cenDec-rgNS)/10); i++) {
                skyareas.push([skyareas[0][0]+360*i, skyareas[0][1]+360*i]);
                skyareas.push([skyareas[1][0]+360*i, skyareas[1][1]+360*i]);
            }
            DrawStars(skyareas);
        } else if (cenRA + rgEW >= 360) {
            var skyareas = [[SkyArea(0,          cenDec-rgNS), SkyArea(cenRA+rgEW-360, cenDec-rgNS)],
                            [SkyArea(cenRA-rgEW, cenDec-rgNS), SkyArea(359.9,          cenDec-rgNS)]];
            for (var i=1; i<=Math.floor((cenDec+rgNS)/10)-Math.floor((cenDec-rgNS)/10); i++) {
                skyareas.push([skyareas[0][0]+360*i, skyareas[0][1]+360*i]);
                skyareas.push([skyareas[1][0]+360*i, skyareas[1][1]+360*i]);
            }
            DrawStars(skyareas);
        } else {
            var skyareas = [[SkyArea(cenRA-rgEW, cenDec-rgNS), SkyArea(cenRA+rgEW, cenDec-rgNS)]];
            for (var i=1; i<=Math.floor((cenDec+rgNS)/10)-Math.floor((cenDec-rgNS)/10); i++) {
                skyareas.push([skyareas[0][0]+360*i, skyareas[0][1]+360*i]);
            }
            DrawStars(skyareas);
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

    //メシエ天体
    ctx.font = '16px serif';
    if (document.getElementById('MessierCheck').checked && rgEW < 0.5 * document.getElementById('MessierFrom').value) {
        DrawMessier();
    }

    // メシエ以外
    ctx.font = '16px serif';
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
                    var r = Math.max(canvas.width * (0.259 / (dist_Moon / 384400)) / rgEW / 2, 13);
                    var rs = RAlist[0] * pi/180;
                    var ds = Declist[0] * pi/180;
                    var rm = RAlist[9] * pi/180;
                    var dm = Declist[9] * pi/180;
                    var lons = Ms + 0.017 * sin(Ms + 0.017 * sin(Ms)) + ws;
                    k = (1 - cos(lons-lon) * cos(lat)) / 2;
                    P = pi - Math.atan2(cos(ds) * sin(rm-rs), -sin(dm) * cos(ds) * cos(rm-rs) + cos(dm) * sin(ds));

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

    var RAtext = "赤経 " + Math.floor(cenRA/15) + "h " + Math.round((cenRA-15*Math.floor(cenRA/15))*4*10)/10 + "m  ";
    if (cenDec >= 0) {
        var Dectext = "赤緯 +" + Math.floor(cenDec) + "° " + Math.round((cenDec-Math.floor(cenDec))*60) + "' (J2000.0)  ";
    } else {
        var Dectext = "赤緯 -" + Math.floor(-cenDec) + "° " + Math.round((-cenDec-Math.floor(-cenDec))*60) + "' (J2000.0)  ";
    }
    
    var coordtext = constellation + "　" + rgtext + "　" + magLimtext + "<br>" + RAtext + Dectext + "<br>" + Astr + hstr;
    document.getElementById("coordtext").innerHTML = coordtext;

    function SkyArea(RA, Dec) { //(RA, Dec)はHelper2ndで↓行目（0始まり）の行数からのブロックに入ってる
        return parseInt(360 * Math.floor(Dec / 10 + 9) + Math.floor(RA));
    }

    function RApos(RA) { //PythonでのadjustRA(RA)-piccenRAに相当
        return (RA + 540 - cenRA) % 360 - 180;
    }

    function coord (RA, Dec) {
        var x = canvas.width * (0.5 - RApos(RA) / rgEW / 2);
        var y = canvas.height * (0.5 - (Dec - cenDec) / rgNS / 2);
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
                var RA = parseFloat(Tycho[3*i]);
                var Dec = parseFloat(Tycho[3*i+1]);
                var mag = parseFloat(Tycho[3*i+2]);
                if (Math.abs(Dec-cenDec) < rgNS && Math.abs(RApos(RA)) < rgEW && mag < magLim) {
                    var [x, y] = coord(RA, Dec);
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
                ctx.fillText("M" + (i+1), x+5, y-5);
            }
        }
    }

    function DrawNGC() {
        ctx.strokeStyle = 'orange';
        ctx.fillStyle = 'orange';
        for (i=0; i<NGC.length/4; i++){
            var name = NGC[4*i];
            var RA = parseFloat(NGC[4*i+1]);
            var Dec = parseFloat(NGC[4*i+2]);
            var type = NGC[4*i+3];
            if (Math.abs(RApos(RA)) < rgEW && Math.abs(Dec-cenDec) < rgNS) {
                var [x, y] = coord(RA, Dec);
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
    }
}

function sin(a){return Math.sin(a)}
function cos(a){return Math.cos(a)}

document.body.appendChild(canvas);