//2023/10/21 ~
// 入力をURLに反映するのは手を離したときとセッティングを終えたとき
// URLを表示に反映するのは最初のみ

const online = navigator.onLine;
const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
const isElectron = typeof process !== 'undefined' && process.versions && process.versions.electron;
console.log(online, isLocalhost, isElectron);

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
const realtimeElem = document.getElementById('realtime');
const coordinateSystemElem = document.getElementById('coordinateSystem');
const trackDateElem = document.getElementsByName('trackTime');
const starNameElem = document.getElementsByName('starName');

// 要素の表示/非表示
if (online) {
    document.getElementById('fileBtn').style.visibility = "hidden";
    document.getElementById('getFile').style.visibility = "hidden";
} else {
    alert('Sorry, this star chart is unablable offline now.');
    document.getElementById('fileBtn').style.visibility = "hidden";
    document.getElementById('getFile').style.visibility = "hidden";
}

document.getElementById('setting').style.visibility = "hidden";
document.getElementById('exitFullScreenBtn').style.visibility = "hidden";
document.getElementById('description').style.visibility = "hidden";
document.getElementById('setPicsFor360Div').style.visibility = "hidden";
document.getElementById('demDescriptionDiv').style.visibility = "hidden";
document.getElementById('searchDiv').style.visibility = "hidden";
document.getElementById('news').style.visibility = "hidden";
document.getElementById('objectInfo').style.visibility = "hidden";
document.getElementById('darkerbtntext').innerHTML = 'dark';

if (isElectron) {
    document.getElementById("customizeObjectsBtn").style.visibility = "visible";
}

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
let cenRA = 270;
let cenDec = -25;
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
let ObsPlanet, Obs_num, lat_obs, lon_obs, lattext, lontext;
const observationSites = {
    "京大西部構内": [35.03, 135.78],
    "鵜倉園地": [34.27, 136.55],
    "乗鞍高原": [36.11, 137.63],
    "仙台": [38.27, 140.87],
    "東京": [35.68, 139.76],
    "大阪": [34.70, 135.50]
};

let Ms, ws, lon_moon, lat_moon;

// データ

let hips = [];
let gaia100 = new Array(505972);
let gaia100_help = new Array(64801);
let gaia101_110 = new Array(800359);
let gaia101_110_help = new Array(64801);
let gaia111_115 = new Array(666677);
let gaia111_115_help = new Array(64801);
let BSCnum = 0;
let BSCRAary = [];
let BSCDecary = [];
let FSs = [];
let Bayers = [];
let BayerNums = [];
let starNames = [];
let messier = [];
let recs = [];
let NGC = new Array(66130);
let constellations = [];
let boundary = new Array(4801);
let demFileName = '';
let dem = new Array(256*256);
let demAngle = [];

const Sun = ['Sun'];
const Mercury = [2451545.0,  0.38709927, 0.20563593,  7.00497902, 252.25032350,  77.45779628,  48.33076593,  0.00000037,  0.00001906, -0.00594749, 149472.67411175,  0.16047689, -0.12534081];
const Venus   = [2451545.0,  0.72333566, 0.00677672,  3.39467605, 181.97909950, 131.60246718,  76.67984255,  0.00000390, -0.00004107, -0.00078890,  58517.81538729,  0.00268329, -0.27769418];
const Earth   = [2451545.0,  1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193,   0.0       ,  0.00000562, -0.00004392, -0.01294668,  35999.37244981,  0.32327364,  0.0       ];
const Mars    = [2451545.0,  1.52371034, 0.09339410,  1.84969142,  -4.55343205, -23.94362959,  49.5595389 ,  0.00001847,  0.00007882, -0.00813131,  19140.30268499,  0.44441088, -0.29257343];
const Jupiter = [2451545.0,  5.20288700, 0.04838624,  1.30439695,  34.39644051,  14.72847983, 100.47390909, -0.00011607, -0.00013253, -0.00183714,   3034.74612775,  0.21252668,  0.20469106, -0.00012452,  0.06064060, -0.35635438, 38.35125000];
const Saturn  = [2451545.0,  9.53667594, 0.05386179,  2.48599187,  49.95424423,  92.59887831, 113.66242448, -0.00125060, -0.00050991,  0.00193609,   1222.49362201, -0.41897216, -0.28867794,  0.00025899, -0.13434469,  0.87320147, 38.35125000];
const Uranus  = [2451545.0, 19.18916464, 0.04725744,  0.77263783, 313.23810451, 170.95427630,  74.01692503, -0.00196176, -0.00004397, -0.00242939,    428.48202785,  0.40805281,  0.04240589,  0.00058331, -0.97731848,  0.17689245,  7.67025000];
const Neptune = [2451545.0, 30.06992276, 0.00859048,  1.77004347, -55.12002969,  44.96476227, 131.78422574,  0.00026291,  0.00005105,  0.00035372,    218.45945325, -0.32241464, -0.00508664, -0.00041348,  0.68346318, -0.10162547,  7.67025000];
const Moon    = ['Moon'];
const Ceres   = [2459396.5,  2.76566 , 0.07839 ,  73.738268, 10.588196,  80.267638, 247.549972,  0       ,  0       ,  0       ,  0       ,  0       , 3.53, 0.12];
const Vesta   = [2459396.5,  2.36166 , 0.08835 , 151.015603,  7.141541, 103.806059, 311.692061,  0       ,  0       ,  0       ,  0       ,  0       , 3.31, 0.32];

const planets    = [Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, Moon, Ceres, Vesta];
const OriginalNumOfPlanets = planets.length;

let ENGplanets = ['Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Moon', 'Ceres', 'Vesta'];
let JPNplanets = ['太陽', '水星', '金星', '地球', '火星', '木星', '土星', '天王星', '海王星', '月', 'Ceres', 'Vesta'];
const planetNamesHiragana = ['たいよう', 'すいせい', 'きんせい', 'ちきゅう', 'かせい', 'もくせい', 'どせい', 'てんのうせい', 'かいおうせい', 'つき'];

let solarSystemBodies = new Array(20);

let infoList = []; //[[name, scrRA, scrDec], [,,], ...]

// 読み込み
let xhrcheck = 0;
let xhrimpcheck = 0;
let defaultcheck = 0;
let loaded = [];
let lastVisitDate;
let news = [
    {time: '2025-04-19T02:20:00+09:00', text: ['この星図のURLのQRコードを右下？ボタン→「QRコードで...」から見れます！　広めてもらえるとうれしいです。']},
    {time: '2025-04-12T17:00:00+09:00', text: ['メインで使う座標系をJ2000.0から視位置にしました。表示のバグは少しありますが計算間違いはないはずです', '以前からですが、設定画面の一番下のボタンで地形を表示させることができます。SWAN彗星見るときに使えそう', 'いくつかのNGC天体が複数個表示されるバグは気が向いたら直します']},
    {time: '2025-04-04T15:50:00+09:00', text: ['惑星の位置がより正確になりました', '惑星をクリック（タップ）したときの情報が増えました']},
    {time: '2025-04-03T19:45:00+09:00', text: ['木星を拡大するとガリレオ衛星が見れます！意外と正弦波１，２つ重ねるだけで高い精度出た']},
    {time: '2025-03-28T00:52:00+09:00', text: ['アイコンが素敵になりました。ありがとう！', '場所の設定方法を改良し、地図上で選択できるようになりました', 'Windows向けデスクトップアプリを鋭意開発中です！ -> https://github.com/Peteworden/reticle/releases']},
    {time: '2025-03-23T23:15:00+09:00', text: ['この星図のいい名前を募集しています！', '星が消えるバグ、恒星時の計算式のずれを修正しました', 'バグ報告などの連絡は？ボタンを押したところのフォームから！']},
    {time: '2025-02-08T19:00:00+09:00', text: ['以前から日本語名を表示できた(Thanks to ToE42)90個の星を含む428個の星の英語名を収録しました。天文冬の陣2024でいただいた意見をもとにした改良です']},
    {time: '2025-02-08T16:00:00+09:00', text: ['これまではヒッパルコス星表とティコ第2星表を使っていましたが、後者をやめガイア星表を使うことにしました', '最微等級が11.0等級から11.5等級になりました。多すぎる場合は設定のスライダーで調整してください', '恒星の位置の精度が0.01°から0.001°になりました']},
    {time: '2025-01-11T00:00:00+09:00', text: ['月が表示されないバグを修正。小豆ありがとう', 'リロード時の時刻設定を現在時刻にしました', '右下の?ボタンにブックマーク用のURLを書きました。少し前にご意見フォームも設置しています']},
    {time: '2025-01-09T16:00:00+09:00', text: ['C/2024 G3(ATLAS彗星)などが加わりました']}
];

// リアルタイム
let intervalId = null;

// ライブモード、AR
let moving = false;
let picsFor360 = 5;
let videoHeight = 1;
let videoWidth = 1;
let videoOn = false;

let os, orientationPermittion=true, loadAzm=0;
let orientationTime1 = Date.now();

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
}
setCanvas(false);

if (canvas.width < canvas.height) {
    rgEW = 20;
    rgNS = rgEW * canvas.height / canvas.width;
    document.getElementById('constNameFrom').value = "90";
    document.getElementById('MessierFrom').value = "60";
    document.getElementById('recsFrom').value = "50";
} else {
    rgNS = 20;
    rgEW = rgNS * canvas.width / canvas.height;
    document.getElementById('constNameFrom').value = "180";
    document.getElementById('MessierFrom').value = "180";
    document.getElementById('recsFrom').value = "120";
}
rgtext = `視野(左右):${(rgEW * 2).toFixed(1)}°`;

let magLimtext;
let magLimLim = 11.5;
let magkey1 = 11.5, magkey2 = 1.8;//key1は10~13
let magLim = determinMagLim(magkey1, magkey2);
let zerosize = determinZerosize();

document.getElementById('magLimitSlider').addEventListener('change', function(){
	magkey1 = document.getElementById('magLimitSlider').value;
    magLim = determinMagLim(magkey1, magkey2);
    zerosize = determinZerosize();
});

init();
function init() {
    os = detectOSSimply();
    if (os == "iphone") {
        // safari用。DeviceOrientation APIの使用をユーザに許可してもらう
        orientationPermittion = false;
        for (i=0; i<permitBtns.length; i++) {
            permitBtns[i].addEventListener("click", permitDeviceOrientationForSafari);
        }
        window.addEventListener("deviceorientation", deviceOrientation, true);
    } else if (os == "android") {
        window.addEventListener("deviceorientationabsolute", deviceOrientation, true);
    }
}

function detectOSSimply() {
    let ret;
    if (
        navigator.userAgent.indexOf("iPhone") > 0 ||
        navigator.userAgent.indexOf("iPad") > 0 ||
        navigator.userAgent.indexOf("iPod") > 0
    ) {
        // iPad OS13のsafariはデフォルト「Macintosh」なので別途要対応
        ret = "iphone";
    } else if (navigator.userAgent.indexOf("Android") > 0) {
        ret = "android";
    } else {
        ret = "pc";
    }
    return ret;
}
// iPhone + Safariの場合はDeviceOrientation APIの使用許可をユーザに求める
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

const url = new URL(window.location.href);

function changePicsFor360() {
    document.getElementById('setPicsFor360Div').style.visibility = 'visible';
}

function setPicsFor360() {
    let picsFor360Input = document.getElementById('picsFor360').value;
    if (!isNaN(picsFor360Input) && 1 < parseFloat(picsFor360Input) < 20) {
        videoHeight = 360 / parseFloat(picsFor360Input);
        document.getElementById('arVideo').style.height = `${Math.round(100*videoHeight/2/rgNS)}%`;
        document.getElementById('setPicsFor360Div').style.visibility = 'hidden';
    } else {
        alert('ほんまに？');
    }
}
setPicsFor360();

//objという名前がメシエかNGCかICにあればTrueを返す
function linkExist(obj) {
    let linkExist = false;
    if (obj[0] == 'M' && !isNaN(obj.substr(1))) { //メシエ
        for (i=0; i<messier.length; i++) {
            if (messier[i].name == obj) {
                linkExist = true;
                break;
            }
        }
    } else if ((obj.startsWith('NGC') && !isNaN(obj.substr(3))) || (obj.startsWith('IC') && !isNaN(obj.substr(2)))) {
        for (i=0; i<NGC.length; i+=5) {
            if (NGC[i] == obj) {
                linkExist = true;
                break;
            }
        }
    }
    return linkExist;
}

//objの位置に移動する
function link(obj) {
    if (!obj) {
        console.error('Invalid input:', obj);
        return;
    }
    let cenRaJ2000, cenDecJ2000;
    // 見つかったかどうかのフラグ
    let flag = false;
    for (i=0; i<10; i++) {
        if (JPNplanets[i] == obj) {
            cenRA = solarSystemBodies[i].ra;
            cenDec = solarSystemBodies[i].dec;
            flag = true;
            break;
        }
    }
    for (i=0; i<starNames.length; i++) {
        if (starNames[i].name == obj || starNames[i].jpnname == obj) {
            // cenRA = starNames[i].ra;
            // cenDec = starNames[i].dec;
            [cenRA, cenDec] = J2000toApparent(starNames[i].ra, starNames[i].dec, showingJD);
            flag = true;
            break;
        }
    }
    for (i=0; i<recs.length; i++) {
        if (recs[i].name == obj) {
            cenRaJ2000 = rahm2deg(recs[i].ra);
            cenDecJ2000 = decdm2deg(recs[i].dec);
            [cenRA, cenDec] = J2000toApparent(cenRaJ2000, cenDecJ2000, showingJD);
            flag = true;
            break;
        }
    }
    if (!flag) {
        if (obj[0] == 'M' && !isNaN(obj.substr(1))) { //メシエ
            for (i=0; i<messier.length; i++) {
                if (messier[i].name == obj) {
                    cenRaJ2000 = rahm2deg(messier[i].ra);
                    cenDecJ2000 = decdm2deg(messier[i].dec);
                    [cenRA, cenDec] = J2000toApparent(cenRaJ2000, cenDecJ2000, showingJD);
                    break;
                }
            }
        } else if ((obj.startsWith('NGC') && !isNaN(obj.substr(3))) || (obj.startsWith('IC') && !isNaN(obj.substr(2)))) {
            for (i=0; i<NGC.length; i+=5) {
                if (NGC[i] == obj) {
                    // cenRA = +NGC[i+1];
                    // cenDec = +NGC[i+2];
                    [cenRA, cenDec] = J2000toApparent(+NGC[i+1], +NGC[i+2], showingJD);
                    break;
                }
            }
        } else if (obj.slice(-1) == '座') {
            for (i=0; i<89; i++){
                if (obj == constellations[i].JPNname + '座') {
                    // cenRA = constellations[i].ra;
                    // cenDec = constellations[i].dec;
                    [cenRA, cenDec] = J2000toApparent(constellations[i].ra, constellations[i].dec, showingJD);
                    break;
                }
            }
        }
    }
    setUrlAndLocalStorage('RA', cenRA.toFixed(2));
    setUrlAndLocalStorage('Dec', cenDec.toFixed(2));
    [cenAzm, cenAlt] = RADec2Ah(cenRA, cenDec, siderealTime(showingJD, lon_obs));
    setUrlAndLocalStorage('azm', cenAzm.toFixed(2));
    setUrlAndLocalStorage('alt', cenAlt.toFixed(2));
    history.replaceState('', '', url.href);
    document.getElementById("settingBtn").removeAttribute("disabled");
    document.getElementById('description').style.visibility = "hidden";
    show_main();
}

document.getElementById('searchInput').addEventListener('input', function() {
    let searchText = toUpperCaseOrKatakana(document.getElementById('searchInput').value);
    let suggestions1 = [[], []];
    let suggestions2 = [[], []];
    let recsugs = [];
    if (searchText.length == 0) {
        suggestions1 = [[], []];
        suggestions2 = [[], []];
    } else if (searchText.length == 1) { //1文字
        if (isNaN(searchText)) {
            // 惑星
            for (i=0; i<planetNamesHiragana.length; i++) {
                if (i == Obs_num) continue;
                if (toUpperCaseOrKatakana(planetNamesHiragana[i]) == searchText) {
                    suggestions1[0].push(JPNplanets[i]);
                    suggestions1[1].push(JPNplanets[i]);
                } 
            }
            // 星座
            for (i=0; i<89; i++) {
                if (constellations[i].JPNname.length && toUpperCaseOrKatakana(constellations[i].JPNname[0]) == searchText) {
                    suggestions1[0].push(`${constellations[i].JPNname}座`);
                    suggestions1[1].push(`${constellations[i].JPNname}座`);
                }
            }
            // 恒星
            for (i=0; i<starNames.length; i++) {
                if (toUpperCaseOrKatakana(starNames[i].name[0]) == searchText) {
                    suggestions2[0].push(starNames[i].name);
                    suggestions2[1].push(starNames[i].name);
                }
                if (starNames[i].jpnname && toUpperCaseOrKatakana(starNames[i].jpnname[0]) == searchText) {
                    suggestions1[0].push(starNames[i].jpnname);
                    suggestions1[1].push(starNames[i].jpnname);
                }
            }
        }
        // Mをつけてメシエになるとき
        if (!isNaN(searchText) && 1 <= parseInt(searchText) <= 110 && linkExist(`M${searchText}`)) {
            suggestions1[0].push(`M${searchText}`);
            suggestions1[1].push(`M${searchText}`);
        }
        // 文字
        if (isNaN(searchText)) {
            for (m of messier) {
                for (alt of m.alt_name) {
                    if (alt.length && toUpperCaseOrKatakana(alt[0]) == searchText && !alt[0].startsWith('NGC') && !alt[0].startsWith('IC')) {
                        suggestions1[0].push(m.name);
                        suggestions1[1].push(m.name);
                    }
                }
            }

            for (let rec of recs) {
                if (rec.name.length && toUpperCaseOrKatakana(rec.name[0]) == searchText && !rec.name[0].startsWith('NGC') && !rec.name[0].startsWith('IC')) {
                    suggestions1[0].push(rec.name);
                    suggestions1[1].push(rec.name);
                }
                for (let alt of rec.alt_name) {
                    if (alt.length && toUpperCaseOrKatakana(alt[0]) == searchText && !alt[0].startsWith('NGC') && !alt[0].startsWith('IC')) {
                        suggestions1[0].push(rec.name);
                        suggestions1[1].push(rec.name);
                    }
                }
            }
        } else { // 数字
            for (let rec of recs) {
                if ([`NGC${searchText}`, `IC${searchText}`, `Cr${searchText}`].includes(rec.name)) {
                    suggestions1[0].push(rec.name);
                    suggestions1[1].push(rec.name);
                    recsugs.push(rec.name);
                }
                for (let alt of rec.alt_name) {
                    if ([`NGC${searchText}`, `IC${searchText}`, `Cr${searchText}`].includes(alt)) {
                        suggestions1[0].push(`${rec.name}(${alt})`);
                        suggestions1[1].push(rec.name);
                        recsugs.push(alt);
                    }
                }
            }
            if (1 <= parseInt(searchText) && parseInt(searchText) <= 7840 && !recsugs.includes(`NGC${searchText}`) && linkExist(`NGC${searchText}` && !suggestions1[0].includes(`NGC${searchText}`))) {
                suggestions1[0].push(`NGC${searchText}`);
                suggestions1[1].push(`NGC${searchText}`);
            }
            if (1 <= parseInt(searchText) && parseInt(searchText) <= 5386 && !recsugs.includes(`IC${searchText}`) && linkExist(`IC${searchText}`) && !suggestions1[0].includes(`IC${searchText}`)) {
                suggestions1[0].push(`IC${searchText}`);
                suggestions1[1].push(`IC${searchText}`);
            }
        }
    } else {
        suggestions1 = [[], []];
        suggestions2 = [[], []];
        if (isNaN(searchText)) {
            for (i=0; i<planetNamesHiragana.length; i++) {
                if (i == Obs_num) continue;
                if (toUpperCaseOrKatakana(planetNamesHiragana[i]).includes(searchText)) {
                    if (toUpperCaseOrKatakana(planetNamesHiragana[i]).startsWith(searchText)) {
                        suggestions1[0].push(JPNplanets[i]);
                        suggestions1[1].push(JPNplanets[i]);
                    } else {
                        suggestions1[2].push(JPNplanets[i]);
                        suggestions1[2].push(JPNplanets[i]);
                    }
                } 
            }
            for (i=0; i<89; i++) {
                if ((toUpperCaseOrKatakana(constellations[i].JPNname)+'座').includes(searchText)) {
                    if (toUpperCaseOrKatakana(constellations[i].JPNname+'座').startsWith(searchText)) {
                        suggestions1[0].push(`${constellations[i].JPNname}座`);
                        suggestions1[1].push(`${constellations[i].JPNname}座`);
                    } else {
                        suggestions2[0].push(`${constellations[i].JPNname}座`);
                        suggestions2[1].push(`${constellations[i].JPNname}座`);
                    }
                }
            }
            // 恒星
            for (i=0; i<starNames.length; i++) {
                if (toUpperCaseOrKatakana(starNames[i].name).includes(searchText)) {
                    if (toUpperCaseOrKatakana(starNames[i].name).startsWith(searchText)) {
                        suggestions2[0].push(starNames[i].name);
                        suggestions2[1].push(starNames[i].name);
                    } else {
                        suggestions2[0].push(starNames[i].name);
                        suggestions2[1].push(starNames[i].name);
                    }
                }
                if (starNames[i].jpnname && toUpperCaseOrKatakana(starNames[i].jpnname).includes(searchText)) {
                    if (toUpperCaseOrKatakana(starNames[i].jpnname).startsWith(searchText)) {
                        suggestions1[0].push(starNames[i].jpnname);
                        suggestions1[1].push(starNames[i].jpnname);
                    } else {
                        suggestions2[0].push(starNames[i].jpnname);
                        suggestions2[1].push(starNames[i].jpnname);
                    }
                }
            }
        }
        //Mをつけてメシエになるとき
        if (!isNaN(searchText) && 1 <= parseInt(searchText) <= 110 && linkExist(`M${searchText}`) && !recsugs.includes(`NGC${searchText}`)) {
            suggestions1[0].push(`M${searchText}`);
            suggestions1[1].push(`M${searchText}`);
        }
        //そのままでメシエになるとき
        if (searchText[0] == 'M' && !isNaN(searchText.substr(1)) && 1 <= parseInt(searchText.substr(1)) && parseInt(searchText.substr(1)) <= 110 && linkExist(searchText) && !recsugs.includes(`IC${searchText}`)) {
            suggestions1[0].push(searchText.toUpperCase());
            suggestions1[1].push(searchText.toUpperCase());
        }
        if (isNaN(searchText)) {
            for (let rec of recs) {
                if (toUpperCaseOrKatakana(rec.name).startsWith(searchText)) {
                    suggestions1[0].push(rec.name);
                    suggestions1[1].push(rec.name);
                    recsugs.push(rec.name);
                } else if (toUpperCaseOrKatakana(rec.name).includes(searchText)) {
                    suggestions2[0].push(rec.name);
                    suggestions2[1].push(rec.name);
                    recsugs.push(rec.name);
                }
                for (let alt of rec.alt_name) {
                    if (toUpperCaseOrKatakana(alt).startsWith(searchText)) {
                        suggestions1[0].push(rec.name);
                        suggestions1[1].push(rec.name);
                        recsugs.push(alt);
                    } else if (toUpperCaseOrKatakana(alt).includes(searchText)) {
                        suggestions2[0].push(rec.name);
                        suggestions2[1].push(rec.name);
                        recsugs.push(alt);
                    }
                }
            }
        } else {
            for (let rec of recs) {
                if ([`NGC${searchText}`, `IC${searchText}`, `Cr${searchText}`].includes(rec.name)) {
                    suggestions1[0].push(rec.name);
                    suggestions1[1].push(rec.name);
                    recsugs.push(rec.name);
                }
                for (let alt of rec.alt_name) {
                    if ([`NGC${searchText}`, `IC${searchText}`, `Cr${searchText}`].includes(alt)) {
                        suggestions1[0].push(rec.name);
                        suggestions1[1].push(rec.name);
                        recsugs.push(alt);
                    }
                }
            }
        }
        //NGC, ICをつけてそれらになるとき
        if (!isNaN(searchText)) {
            if (1 <= parseInt(searchText) && parseInt(searchText) <= 7840 && !recsugs.includes(`NGC${searchText}`) && linkExist(`NGC${searchText}`)) {
                suggestions1[0].push(`NGC${searchText}`);
                suggestions1[1].push(`NGC${searchText}`);
            }
            if (1 <= parseInt(searchText) && parseInt(searchText) <= 5386 && !recsugs.includes(`IC${searchText}`) && linkExist(`IC${searchText}`)) {
                suggestions1[0].push(`IC${searchText}`);
                suggestions1[1].push(`IC${searchText}`);
            }
        } else if (searchText.startsWith('NGC') && !recsugs.includes(searchText) && !isNaN(searchText.substr(3)) && 1 <= parseInt(searchText.substr(3)) && parseInt(searchText.substr(3)) <= 7840 && linkExist(searchText)) {
            suggestions1[0].push(searchText);
            suggestions1[1].push(searchText);
        } else if (searchText.startsWith('IC') && !recsugs.includes(searchText) && !isNaN(searchText.substr(2)) && 1 <= parseInt(searchText.substr(2)) && parseInt(searchText.substr(2)) <= 5386 && linkExist(searchText)) {
            suggestions1[0].push(searchText);
            suggestions1[1].push(searchText);
        }
        //M, N, I以外から始まり数字でないとき
        if (isNaN(searchText) && !["M", "N", "I"].includes(searchText[0])){
            for (m of messier) {
                for (alt of m.alt_name) {
                    if (toUpperCaseOrKatakana(alt).includes(searchText)) {
                        if (toUpperCaseOrKatakana(alt).startsWith(searchText)) {
                            suggestions1[0].push(m.name);
                            suggestions1[1].push(m.name);
                        } else {
                            suggestions2[0].push(m.name);
                            suggestions2[1].push(m.name);
                        }
                    }
                }
            }
        }
    }

    document.getElementById('suggestionButtonContainer').innerHTML = '';
    for (let i=0; i<suggestions1[0].length; i++) {
        const button = document.createElement('button');
        button.className = 'suggestionButton';
        button.textContent = suggestions1[0][i];
        button.addEventListener('click', function() {
            link(suggestions1[1][i]);
            document.getElementById('searchInput').value = '';
            closeSearch();
        });
        document.getElementById('suggestionButtonContainer').appendChild(button);
    }
    for (let i=0; i<suggestions2[0].length; i++) {
        const button = document.createElement('button');
        button.className = 'suggestionButton';
        button.textContent = suggestions2[0][i];
        button.addEventListener('click', function() {
            link(suggestions2[1][i]);
            document.getElementById('searchInput').value = '';
            closeSearch();
        });
        document.getElementById('suggestionButtonContainer').appendChild(button);
    }
});

function toUpperCaseOrKatakana(str) {
    if (str == null) {
        console.log('Invalid input:', str);
    }
    return str.replace(/[\u3041-\u309F]|[a-z]/g, function(char) {
        // アルファベットの場合は大文字に変換
        if (char >= 'a' && char <= 'z') {
            return char.toUpperCase();
        }
        // ひらがなの場合はカタカナに変換
        else if (char >= '\u3041' && char <= '\u309F') {
            return String.fromCharCode(char.charCodeAt(0) + 0x60);
        }
        // その他の文字はそのまま返す
        return char;
    });
}

let trackPlanet = '';
function showObjectInfo(x, y) {
    if (!document.getElementById('objectInfoCheck').checked) {
        return;
    }
    const wikiSpecial = [[1, 8, 16, 17, 20, 27, 31, 33, 42, 44, 45, 51, 57, 64, 97, 104], ["かに星雲", "干潟星雲", "わし星雲", "オメガ星雲", "三裂星雲", "亜鈴状星雲", "アンドロメダ銀河", "さんかく座銀河", "オリオン大星雲", "プレセペ星団", "プレアデス星団", "子持ち銀河", "環状星雲", "黒眼銀河", "ふくろう星雲", "ソンブレロ銀河"]]
    let nearest = null;
    let nearestDistance = Math.max(canvas.width, canvas.height);
    for (i=0; i<infoList.length; i++) {
        let distance = Math.sqrt(Math.pow(x - infoList[i][1], 2) + Math.pow(y - infoList[i][2], 2));
        if (distance < nearestDistance && distance < Math.min(canvas.width, canvas.height) / 15) {
            nearest = infoList[i];
            nearestDistance = distance;
        }
    }
    if (nearest != null) {
        document.getElementById('objectInfo').style.visibility = 'visible';
        document.getElementById('objectInfoName').innerHTML = nearest[0];

        let found = false;
        document.getElementById('objectInfoImage').innerHTML = "";
        for (let ext of ["jpg", "JPG"]) {
            const img = new Image();
            img.onload = function() {
                document.getElementById('objectInfoImage').appendChild(img);
                found = true;
            };
            img.onerror = function() {
                console.log(`画像が見つかりません: ${ext}`);
            };
            img.src = `https://peteworden.github.io/Soleil/chartImage/${nearest[0].replace(/\s+/g, '')}.${ext}`;
            if (found) {
                break;
            }
        }

        let infoText = '';
        if (JPNplanets.includes(nearest[0])) {
            trackPlanet = nearest[0];
            let nearestCoord = solarSystemBodies[JPNplanets.indexOf(nearest[0])];
            let raHM = radeg2hm(nearestCoord.ra);
            let decDM = decdeg2dm(nearestCoord.dec);
            infoText += `RA: ${raHM[0]}h ${raHM[1].toFixed(1)}m Dec: ${decDM[0]}° ${decDM[1].toFixed()}' (視位置)`;
            let [raJ2000, decJ2000] = apparentToJ2000(nearestCoord.ra, nearestCoord.dec, showingJD);
            raHM = radeg2hm(raJ2000);
            decDM = decdeg2dm(decJ2000);
            infoText += `<br>RA: ${raHM[0]}h ${raHM[1].toFixed(1)}m Dec: ${decDM[0]}° ${decDM[1].toFixed()}' (J2000.0)`;

            if (nearest[0] == '月') {
                infoText += `<br>距離: ${(nearestCoord.dist/10000).toFixed(1)}万km`;
                infoText += ` （光の速さで${(nearestCoord.dist/299792.458).toFixed(2)}秒）`
            } else {
                infoText += `<br>距離: ${nearestCoord.dist.toFixed(2)}au`;
                light_minutes = nearestCoord.dist * 149597870700 / 299792458 / 60;
                if (light_minutes < 60) {
                    infoText += ` （光の速さで${light_minutes.toFixed(1)}分）`;
                } else if (light_minutes < 1440) {
                    infoText += ` （光の速さで${(light_minutes/60).toFixed(1)}時間）`;
                } else {
                    infoText += ` （光の速さで${(light_minutes/1440).toFixed(1)}日）`;
                }
            }
            if (nearest[0] == '木星') {
                infoText += '<br>ガリレオ衛星（I:イオ、E:エウロパ、G:ガニメデ、C:カリスト）の位置は概略です。';
                if (online) {
                    infoText += `<a href="https://www.ncsm.city.nagoya.jp/astro/jupiter/">名古屋市科学館のサイト</a>がより正確でしょう。`;
                }
            }
            document.getElementById('planetTrack').style.display = 'inline-block';
        } else if (nearest[0][0] == 'M') {
            if (messier[parseInt(nearest[0].slice(1))-1].description.length > 0) {
                infoText = messier[parseInt(nearest[0].slice(1))-1].description;
            } else {
                infoText = 'no description';
            }
            if (online) {
                if (wikiSpecial[0].includes(parseInt(nearest[0].slice(1)))) {
                    infoText += `<br><a href="https://ja.wikipedia.org/wiki/${wikiSpecial[1][wikiSpecial[0].indexOf(parseInt(nearest[0].slice(1)))]}">Wikipedia</a>`;
                } else {
                    infoText += `<br><a href="https://ja.wikipedia.org/wiki/M${nearest[0].slice(1)}_(天体)">Wikipedia</a>`;
                }
            }
        } else if (nearest[0].endsWith('座')) {
            for (i=0; i<89; i++) {
                if (constellations[i].JPNname + '座' == nearest[0]) {
                    let constellation = constellations[i];
                    infoText += `<br>ラテン語名：${constellation.IAUname}<br>略称：${constellation.abbr}<br>`
                }
            }
        } else {
            for (let rec of recs) {
                if (rec.name == nearest[0]) {
                    if (rec.description.length > 0) {
                        infoText = rec.description;
                    } else {
                        infoText = 'no description';
                    }
                    if (online) {
                        if (rec.wiki == null) {
                            infoText += `<br><a href="https://ja.wikipedia.org/wiki/${rec.name}">Wikipedia</a>`;
                        } else if (rec.wiki.startsWith("http")){
                            infoText += `<br><a href="${rec.wiki}">${rec.wiki}</a>`
                        } else {
                            infoText += `<br><a href="https://ja.wikipedia.org/wiki/${rec.wiki}">Wikipedia</a>`;
                        }
                    }
                }
            }
        }
        document.getElementById('objectInfoText').innerHTML = infoText;
    }
}

const trackTimeCheckboxes = document.querySelectorAll('.planet-track-time-checkbox');


let timeSliderValue = 0;

let date = new Date();
const localDate = new Date(date - date.getTimezoneOffset() * 60000);
localDate.setSeconds(null);
localDate.setMilliseconds(null);
localDate.toISOString().slice(0, -1);
document.getElementById("dtl").value = localDate.toISOString().slice(0, -1);
document.getElementById("dtl").addEventListener("change", ondtlchange);
function ondtlchange(event) {
    let ymdhm = document.getElementById("dtl").value.split('T');
    let ymd = ymdhm[0].split('-');
    let hm = ymdhm[1].split(':');
    setYMDHM(ymd[0], parseInt(ymd[1]).toString(), parseInt(ymd[2]).toString(), parseInt(hm[0]).toString(), parseFloat(hm[1]).toString());
    realtimeOff();
}

yearTextElem.addEventListener('input', realtimeOff);
monthTextElem.addEventListener('input', realtimeOff);
dateTextElem.addEventListener('input', realtimeOff);
hourTextElem.addEventListener('input', realtimeOff);
minuteTextElem.addEventListener('input', realtimeOff);
document.querySelectorAll('input[name="realtime"]').forEach(radio => {
    radio.addEventListener('change', (event) => {
        if (event.target.value != 'off') {
            now();
        }
    });
});

function now() {
    let ymdhm = new Date();
    let [y, m, d, h, mi] = [ymdhm.getFullYear(), ymdhm.getMonth()+1, ymdhm.getDate(), ymdhm.getHours(), ymdhm.getMinutes()];
    setYMDHM(y, m, d, h, mi);
    showingJD = YMDHM_to_JD(y, m, d, h, mi);
}

function setYMDHM(y, m, d, h, mi) {
    yearTextElem.value = y;
    monthTextElem.value = m;
    dateTextElem.value = d;
    hourTextElem.value = h;
    if (mi == null) {
        hourTextElem.value = Math.floor(h);
        minuteTextElem.value = Math.round((h - Math.floor(h)) * 60);
    } else {
        minuteTextElem.value = mi;
    }
}

// function here() {
//     function success(position) {
//         const latitude = Math.round(position.coords.latitude*100)/100;
//         const longitude = Math.round(position.coords.longitude*100)/100;
//         if (latitude < 0) {
//             document.getElementById('NSCombo').options[1].selected = true;
//         } else {
//             document.getElementById('NSCombo').options[0].selected = true;
//         }
//         document.getElementById('lat').value = Math.abs(latitude);
//         if (longitude < 0) {
//             document.getElementById('EWCombo').options[1].selected = true;
//         } else {
//             document.getElementById('EWCombo').options[0].selected = true;
//         }
//         document.getElementById('lon').value = Math.abs(longitude);
//     }
//     if (!navigator.geolocation) {
//         alert("お使いのブラウザは位置情報に対応していません");
//     } else {
//         navigator.geolocation.getCurrentPosition(success, () => {alert("位置情報を取得できません")});
//     }
// }

aovSliderElem.addEventListener('input', function() {
    show_main();
})

timeSliderElem.addEventListener('input', function(){
    showingJD += (timeSliderElem.value - timeSliderValue) / 1440;
    timeSliderValue = timeSliderElem.value;
    let [y, m, d, h, mi] = JD_to_YMDHM(showingJD);
    setYMDHM(y, m, d, h, mi);
    realtimeOff();
    calculation(showingJD);
    show_main();
});

let startX, startY, preX, preY, moveX, moveY
let dist_detect = Math.round(canvas.width / 200); // distはスワイプを感知する最低距離（ピクセル単位）
let baseDistance = 0;
let movedDistance = 0;
let distance = 0;
let pinchFlag = false;
let dragFlag = false;

// タッチ開始
function ontouchstart(e) {
    // e.preventDefault();
    if (e.touches.length === 1) {
        pinchFlag = false;
        dragFlag = false;
        startX = e.touches[0].pageX;
        startY = e.touches[0].pageY;
        preX = startX;
        preY = startY;
    }
};

// スワイプ中またはピンチイン・ピンチアウト中
function ontouchmove(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
        if (!pinchFlag) {
            dragFlag = true;
            moveX = e.touches[0].pageX;
            moveY = e.touches[0].pageY;
            distance = Math.sqrt((moveX-preX)*(moveX-preX) + (moveY-preY)*(moveY-preY));
            if (distance > dist_detect) {
                if (mode == 'AEP') {
                    let prescrRA = -rgEW * (preX - canvas.offsetLeft - canvas.width  / 2) / (canvas.width  / 2);
                    let prescrDec = -rgNS * (preY - canvas.offsetTop - canvas.height / 2) / (canvas.height / 2);
                    let [preRA, preDec] = scr2RADec(prescrRA, prescrDec);
                    let movescrRA = -rgEW * (moveX - canvas.offsetLeft - canvas.width  / 2) / (canvas.width  / 2);
                    let movescrDec = -rgNS * (moveY - canvas.offsetTop - canvas.height / 2) / (canvas.height / 2);
                    let [moveRA, moveDec] = scr2RADec(movescrRA, movescrDec);
                    cenRA = ((cenRA - moveRA + preRA) % 360 + 360) % 360;
                    cenDec = Math.min(Math.max(cenDec - moveDec + preDec, -90), 90);
                    [cenAzm, cenAlt] = RADec2Ah(cenRA, cenDec, theta);
                } else if (mode == 'EtP') {
                    cenRA  = ((cenRA  + 2 * rgEW * (moveX - preX) / canvas.width) % 360 + 360) % 360;
                    cenDec = Math.min(Math.max(-90, cenDec + 2 * rgNS * (moveY - preY) / canvas.height), 90);
                    [cenAzm, cenAlt] = RADec2Ah(cenRA, cenDec, theta);
                } else if (mode == 'view') {
                    let prescrRA = -rgEW * (preX - canvas.offsetLeft - canvas.width  / 2) / (canvas.width  / 2);
                    let prescrDec = -rgNS* (preY - canvas.offsetTop - canvas.height / 2) / (canvas.height / 2);
                    let [preAzm, preAlt] = SHtoAh(prescrRA, prescrDec);
                    let movescrRA = -rgEW * (moveX - canvas.offsetLeft - canvas.width  / 2) / (canvas.width  / 2);
                    let movescrDec = -rgNS * (moveY - canvas.offsetTop - canvas.height / 2) / (canvas.height / 2);
                    let [moveAzm, moveAlt] = SHtoAh(movescrRA, movescrDec);
                    cenAzm = ((cenAzm - moveAzm + preAzm) % 360 + 360) % 360;
                    cenAlt = Math.min(Math.max(cenAlt - moveAlt + preAlt, -90), 90);
                    [cenRA, cenDec] = Ah2RADec(cenAzm, cenAlt, theta);
                }
                show_main();
                preX = moveX;
                preY = moveY;
            }
        }
    } else {
        dragFlag = false;
        pinchFlag = true;
        let x1 = e.touches[0].pageX;
        let y1 = e.touches[0].pageY;
        let x2 = e.touches[1].pageX;
        let y2 = e.touches[1].pageY;
        distance = Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
        if (baseDistance) {
            movedDistance = distance;
            let x3 = (x1 + x2) / 2 - canvas.offsetLeft - canvas.width / 2;
            let y3 = (y1 + y2) / 2 - canvas.offsetTop - canvas.height / 2;
            let scale = movedDistance / baseDistance;
            if (scale && scale != Infinity) {
                if (canvas.width < canvas.height) {
                    scale = Math.max(Math.min(scale, rgEW/minrg), rgNS/maxrg);
                } else {
                    scale = Math.max(Math.min(scale, rgNS/minrg), rgEW/maxrg);
                }
                rgNS /= scale;
                rgEW /= scale;
                if (mode == 'AEP') {
                    let pinchscrRA  = -rgEW * x3 / (canvas.width  / 2);
                    let pinchscrDec = -rgNS * y3 / (canvas.height / 2);
                    [cenRA, cenDec] = scr2RADec(pinchscrRA * (1 - 1 / scale), pinchscrDec * (1 - 1 / scale));
                    [cenAzm, cenAlt] = RADec2Ah(cenRA, cenDec, theta);
                } else if (mode == 'EtP') {
                    let pinchRA  = cenRA  - rgEW * x3 / (canvas.width  / 2);
                    let pinchDec = cenDec - rgNS * y3 / (canvas.height / 2);
                    cenRA  = (pinchRA  + (cenRA  - pinchRA ) / scale) % 360;
                    cenDec = Math.min(Math.max(-90, pinchDec + (cenDec - pinchDec) / scale), 90);
                    [cenAzm, cenAlt] = RADec2Ah(cenRA, cenDec, theta);
                } else if (mode == 'view') {
                    let pinchscrRA  = -rgEW * x3 / (canvas.width  / 2);
                    let pinchscrDec = -rgNS * y3 / (canvas.height / 2);
                    [cenAzm, cenAlt] = SHtoAh(pinchscrRA * (1 - 1 / scale), pinchscrDec * (1 - 1 / scale));
                    [cenRA, cenDec] = Ah2RADec(cenAzm, cenAlt, theta);
                }
                document.getElementById('arVideo').style.height = `${Math.round(100*videoHeight/2/rgNS)}%`;
                rgtext = `視野(左右):${(rgEW * 2).toFixed(1)}°`;
                magLim = determinMagLim(magkey1, magkey2);
                zerosize = determinZerosize();
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
    if (dragFlag) {
        setUrlAndLocalStorage('RA', cenRA.toFixed(2));
        setUrlAndLocalStorage('Dec', cenDec.toFixed(2));
        setUrlAndLocalStorage('azm', cenAzm.toFixed(2));
        setUrlAndLocalStorage('alt', cenAlt.toFixed(2));
        setUrlAndLocalStorage('area', (2*rgEW).toFixed(2));
        history.replaceState('', '', url.href);
    }
    if (e.touches.length.toString() == '0' && !pinchFlag && (!dragFlag || (dragFlag && Math.sqrt(Math.pow(moveX-startX, 2) + Math.pow(moveY-startY, 2)) < Math.min(canvas.width, canvas.height) / 10))) {
        showObjectInfo(preX - canvas.offsetLeft, preY - canvas.offsetTop);
    }
    if (e.touches.length === 0) {
        dragFlag = false;
        pinchFlag = false;
    }
    baseDistance = 0;
};

function ontouchcancel(e) {
    if (dragFlag) {
        setUrlAndLocalStorage('RA', cenRA.toFixed(2));
        setUrlAndLocalStorage('Dec', cenDec.toFixed(2));
        setUrlAndLocalStorage('azm', cenAzm.toFixed(2));
        setUrlAndLocalStorage('alt', cenAlt.toFixed(2));
        setUrlAndLocalStorage('area', (2*rgEW).toFixed(2));
        history.replaceState('', '', url.href);
    }
    baseDistance = 0;
};

function onmousedown(e){
    dragFlag = false;
    preX = e.pageX;
    preY = e.pageY;
    canvas.addEventListener("mousemove", onmousemove);
}

function onmousemove(e) {
    dragFlag = true;
    moveX = e.pageX;
    moveY = e.pageY;
    if ((moveX-preX)*(moveX-preX) + (moveY-preY)*(moveY-preY) > dist_detect*dist_detect) {
        if (mode == 'AEP') {
            let prescrRA = -rgEW * (preX - canvas.offsetLeft - canvas.width  / 2) / (canvas.width  / 2);
            let prescrDec = -rgNS* (preY - canvas.offsetTop - canvas.height / 2) / (canvas.height / 2);
            let [preRA, preDec] = scr2RADec(prescrRA, prescrDec);
            let movescrRA = -rgEW * (moveX - canvas.offsetLeft - canvas.width  / 2) / (canvas.width  / 2);
            let movescrDec = -rgNS * (moveY - canvas.offsetTop - canvas.height / 2) / (canvas.height / 2);
            let [moveRA, moveDec] = scr2RADec(movescrRA, movescrDec);
            cenRA = ((cenRA - moveRA + preRA) % 360 + 360) % 360;
            cenDec = Math.min(Math.max(cenDec - moveDec + preDec, -90), 90);
            [cenAzm, cenAlt] = RADec2Ah(cenRA, cenDec, theta);
        } else if (mode == 'EtP') {
            cenRA  = ((cenRA  + 2 * rgEW * (moveX - preX) / canvas.width ) % 360 + 360) % 360;
            cenDec =  Math.min(Math.max(cenDec + 2 * rgNS * (moveY - preY) / canvas.height, -90), 90);
            [cenAzm, cenAlt] = RADec2Ah(cenRA, cenDec, theta);
        } else if (mode == 'view') {
            let prescrRA = -rgEW * (preX - canvas.offsetLeft - canvas.width  / 2) / (canvas.width  / 2);
            let prescrDec = -rgNS* (preY - canvas.offsetTop - canvas.height / 2) / (canvas.height / 2);
            let [preAzm, preAlt] = SHtoAh(prescrRA, prescrDec);
            let movescrRA = -rgEW * (moveX - canvas.offsetLeft - canvas.width  / 2) / (canvas.width  / 2);
            let movescrDec = -rgNS * (moveY - canvas.offsetTop - canvas.height / 2) / (canvas.height / 2);
            let [moveAzm, moveAlt] = SHtoAh(movescrRA, movescrDec);
            cenAzm = ((cenAzm - moveAzm + preAzm) % 360 + 360) % 360;
            cenAlt = Math.min(Math.max(cenAlt - moveAlt + preAlt, -90), 90);
            [cenRA, cenDec] = Ah2RADec(cenAzm, cenAlt, theta);
        }
        show_main();
        preX = moveX;
        preY = moveY;
    }
}

function onmouseup(e){
    canvas.removeEventListener("mousemove", onmousemove);
    if (dragFlag) {
        setUrlAndLocalStorage('RA', cenRA.toFixed(2));
        setUrlAndLocalStorage('Dec', cenDec.toFixed(2));
        setUrlAndLocalStorage('azm', cenAzm.toFixed(2));
        setUrlAndLocalStorage('alt', cenAlt.toFixed(2));
        setUrlAndLocalStorage('area', (2*rgEW).toFixed(2));
        history.replaceState('', '', url.href);
        canvas.removeEventListener("mousemove", onmousemove);
    } else {
        showObjectInfo(preX - canvas.offsetLeft, preY - canvas.offsetTop);
    }
}

function onmouseout(e){
    canvas.removeEventListener("mousemove", onmousemove);
    if (dragFlag) {
        setUrlAndLocalStorage('RA', cenRA.toFixed(2));
        setUrlAndLocalStorage('Dec', cenDec.toFixed(2));
        setUrlAndLocalStorage('azm', cenAzm.toFixed(2));
        setUrlAndLocalStorage('alt', cenAlt.toFixed(2));
        setUrlAndLocalStorage('area', (2*rgEW).toFixed(2));
        history.replaceState('', '', url.href);
        canvas.removeEventListener("mousemove", onmousemove);
    }
}

function onwheel(event) {
    event.preventDefault();
    let x3 = event.pageX - canvas.offsetLeft - canvas.width / 2;
    let y3 = event.pageY - canvas.offsetTop - canvas.height / 2;
    let scale = 1 - event.deltaY * 0.0005;
    if (scale && scale != Infinity) {
        if (canvas.width < canvas.height) {
            scale = Math.max(Math.min(scale, rgEW/minrg), rgNS/maxrg);
        } else {
            scale = Math.max(Math.min(scale, rgNS/minrg), rgEW/maxrg);
        }
        rgNS /= scale;
        rgEW /= scale;
        if (mode == 'AEP') {
            let pinchscrRA  = -rgEW * x3 / (canvas.width  / 2);
            let pinchscrDec = -rgNS * y3 / (canvas.height / 2);
            [cenRA, cenDec] = scr2RADec(pinchscrRA * (1 - 1 / scale), pinchscrDec * (1 - 1 / scale));
            [cenAzm, cenAlt] = RADec2Ah(cenRA, cenDec, theta);
        } else if (mode == 'EtP') {
            let pinchRA  = cenRA  - rgEW * x3 / (canvas.width  / 2);
            let pinchDec = cenDec - rgNS * y3 / (canvas.height / 2);
            cenRA  = (pinchRA  + (cenRA  - pinchRA ) / scale) % 360;
            cenDec = Math.min(Math.max(-90, pinchDec + (cenDec - pinchDec) / scale), 90);
            [cenAzm, cenAlt] = RADec2Ah(cenRA, cenDec, theta);
        } else if (mode == 'view') {
            let pinchscrRA  = -rgEW * x3 / (canvas.width  / 2);
            let pinchscrDec = -rgNS * y3 / (canvas.height / 2);
            [cenAzm, cenAlt] = SHtoAh(pinchscrRA * (1 - 1 / scale), pinchscrDec * (1 - 1 / scale));
            [cenRA, cenDec] = Ah2RADec(cenAzm, cenAlt, theta);
        }
        document.getElementById('arVideo').style.height = `${Math.round(100*videoHeight/2/rgNS)}%`;
        rgtext = `視野(左右):${(rgEW * 2).toFixed(1)}°`;
        magLim = determinMagLim(magkey1, magkey2);
        zerosize = determinZerosize();
        show_main();
        baseDistance = distance;

        setUrlAndLocalStorage('RA', cenRA.toFixed(2));
        setUrlAndLocalStorage('Dec', cenDec.toFixed(2));
        setUrlAndLocalStorage('azm', cenAzm.toFixed(2));
        setUrlAndLocalStorage('alt', cenAlt.toFixed(2));
        setUrlAndLocalStorage('area', (2*rgEW).toFixed(2));
        history.replaceState('', '', url.href);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadFiles();
    checkURL();
});

function show_initial(){
    function ready() {
        newSetting();
        canvas.addEventListener("touchstart", ontouchstart);
        canvas.addEventListener("touchmove", ontouchmove);
        canvas.addEventListener('touchend', ontouchend);
        canvas.addEventListener('touchcancel', ontouchcancel);
        canvas.addEventListener('mousedown', onmousedown);
        canvas.addEventListener('mouseup', onmouseup);
        canvas.addEventListener('mouseout', onmouseout);
        canvas.addEventListener('wheel', onwheel);
        document.getElementById("settingBtn").removeAttribute("disabled");
        document.getElementById("descriptionBtn").removeAttribute("disabled");
        document.getElementById('welcomeImage').style.display = 'none';
        show_main();
    }
    if (xhrimpcheck == 3 && defaultcheck >= 10) {
        if (xhrcheck == 15) {
            document.getElementById('loadingtext').style.display = 'none';
            ready();
        } else {
            ready();
        }
    }
}

//位置推算とURLの書き換え
function calculation(JD) {
    let x, y, z;
    let X, Y, Z;
    theta = siderealTime(JD, lon_obs);

    [X, Y, Z] = calc(planets[Obs_num], JD); // J2000.0
    let [ra, dec, dist] = xyz_to_RADec(-X, -Y, -Z);
    [ra, dec] = J2000toApparent(ra, dec, JD);
    solarSystemBodies[0] = {x: X, y: Y, z: Z, ra: ra, dec: dec, dist: dist, mag: 100};

    for (i=1; i<planets.length; i++) {
        let planet = planets[i];
        if (i == 9) {
            [x, y, z] = calc(Earth, JD);
            [x, y, z, ra, dec, dist, Ms, ws, lon_moon, lat_moon] = calc(Moon, JD); // xyzは太陽基準
            [ra, dec] = J2000toApparent(ra, dec, JD);
            solarSystemBodies[9] = {x: x, y: y, z: z, ra: ra, dec: dec, dist: dist, mag: 100};
        } else {
            [x, y, z] = calc(planet, JD);
            [ra, dec, dist] = xyz_to_RADec(x-X, y-Y, z-Z);
            [ra, dec] = J2000toApparent(ra, dec, JD);
            solarSystemBodies[i] = {x: x, y: y, z: z, ra: ra, dec: dec, dist: dist, mag: 100}
        }
    }

    //明るさを計算
    const es2 = X**2 + Y**2 + Z**2;
    let ps2, V;
    for (n=0; n<planets.length; n++) {
        x = solarSystemBodies[n].x;
        y = solarSystemBodies[n].y;
        z = solarSystemBodies[n].z;
        dist = solarSystemBodies[n].dist;
        ps2 = 1;
        let i = 0;
        V = 10;
        if (n != Obs_num){
            if (n == 0) {
                solarSystemBodies[0].mag = -26.7;
            }
            else if (n == 1) {
                ps2 = x**2 + y**2 + z**2;
                if (Obs_num != 0) {
                    i = Math.acos((ps2 + dist**2 - es2) / (2 * dist * Math.sqrt(ps2))) * rad2deg;
                } else {
                    i = 0;
                }
                solarSystemBodies[1].mag = -0.613 + 0.06328*i - 0.0016336 * i**2 + 0.000033644 * i**3 - 3.4565e-7 * i**4 +1.6893e-9 * i**5 - 3.0334e-12 * i**6+ 5 * Math.log10(dist * Math.sqrt(ps2));
            }
            else if (n == 2) {
                ps2 = x**2 + y**2 + z**2;
                if (Obs_num != 0) {
                    i = Math.acos((ps2 + dist**2 - es2) / (2 * dist * Math.sqrt(ps2))) * 180/ pi;
                } else {
                    i = 0;
                }
                if (i <= 163.7) {
                    V = -4.384 - 0.001044 * i + 0.0003687 * i**2 - 2.814e-6 * i**3 + 8.938e-9 * i**4 + 5 * Math.log10(dist * Math.sqrt(ps2));
                } else {
                    V = -4.384 + 240.44228 - 2.81914 * i + 0.00839034 * i**2 + 5 * Math.log10(dist * Math.sqrt(ps2));
                }
                solarSystemBodies[2].mag = V;
            }
            else if (n == 3) {
                solarSystemBodies[3].mag = 1;
            }
            else if (n == 4) {
                ps2 = x**2 + y**2 + z**2;
                if (Obs_num != 0) {
                    i = Math.acos((ps2 + dist**2 - es2) / (2 * dist * Math.sqrt(ps2))) * rad2deg;
                } else {
                    i = 0;
                }
                if (i<= 50) {
                    V = -1.601 + 0.002267 * i - 0.0001302 * i**2 + 5 * Math.log10(dist * Math.sqrt(ps2));
                } else if (50 < i && i <= 120) {
                    V = -1.601 + 1.234 - 0.02573 * i + 0.0003445 * i**2 + 5 * Math.log10(dist * Math.sqrt(ps2));
                } else {
                    V = 1;
                }
                solarSystemBodies[4].mag = V;
            }
            else if (n == 5) {
                ps2 = x**2 + y**2 + z**2;
                if (Obs_num != 0) {
                    i = Math.acos((ps2 + dist**2 - es2) / (2 * dist * Math.sqrt(ps2))) * rad2deg;
                } else {
                    i = 0;
                }
                if (i <= 12) {
                    V = -9.395 - 0.00037 * i + 0.000616 * i**2 + 5 * Math.log10(dist * Math.sqrt(ps2));
                } else {
                    V = -9.395 - 0.033 - 2.5*Math.log10(1 - 1.507*(i/180) - 0.363*(i/180)**2 - 0.062*(i/180)**3 + 2.809*(i/180)**4 - 1.876*(i/180)**5) + 5 * Math.log10(dist * Math.sqrt(ps2));
                }
                solarSystemBodies[5].mag = V;
            }
            else if (n == 6) {
                ps2 = x**2 + y**2 + z**2;
                if (Obs_num != 0) {
                    i = Math.acos((ps2 + dist**2 - es2) / (2 * dist * Math.sqrt(ps2))) * 180/ pi;
                } else {
                    i = 0;
                }
                if (i <= 6.5) {
                    V = -8.914 + 1.825*sin(15*deg2rad) + 0.026 * i - 0.378*sin(15*deg2rad) + Math.exp(-2.25*i) + 5 * Math.log10(dist * Math.sqrt(ps2)); //勝手にリングの傾きβ=15°とした
                } else if (6 < i && i < 150) {
                    V = -8.914 + 0.026 + 0.0002446 * i + 0.0002672 * i**2 - 1.505e-6 * i**3 + 4.767e-9 * i**4 + 5 * Math.log10(dist * Math.sqrt(ps2));
                } else {
                    V = 0.6;
                }
                solarSystemBodies[6].mag = V;
            }
            else if (n == 7) {
                ps2 = x**2 + y**2 + z**2;
                if (Obs_num != 0) {
                    i = Math.acos((ps2 + dist**2 - es2) / (2 * dist * Math.sqrt(ps2))) * 180/ pi;
                } else {
                    i = 0;
                }
                if (i < 3.1) {
                    V = -7.110 + 0.00009617 * i**2 + 0.0001045 * i**2+ 5 * Math.log10(dist * Math.sqrt(ps2));
                } else {
                    V = 5.6;
                }
                solarSystemBodies[7].mag = V;
            }
            else if (n == 8) {
                ps2 = x**2 + y**2 + z**2;
                if (Obs_num != 0) {
                    i = Math.acos((ps2 + dist**2 - es2) / (2 * dist * Math.sqrt(ps2))) * rad2deg;
                } else {
                    i = 0;
                }
                if (i < 133) {
                    V = -7.00 + 0.007944 * i**3 + 0.00009617 * i**2+ 5 * Math.log10(dist * Math.sqrt(ps2));
                } else {
                    V = 7.8;
                }
                solarSystemBodies[8].mag = V;
            }
            else if (planets[n].length == 14 && planets[n][13] != 100.0){ //ちゃんとしたH,GがPlanetに入っているとき
                let planet = planets[n];
                let H = planet[12];
                let G = planet[13];
                ps2 = x**2 + y**2 + z**2;
                if (Obs_num != 0) {
                    a = Math.acos((ps2 + dist**2 - es2) / (2 * dist * Math.sqrt(ps2)));
                } else {
                    a = 0;
                }
                let phi1 = Math.exp(-3.33 * (Math.tan(a/2))**0.63);
                let phi2 = Math.exp(-1.87 * (Math.tan(a/2))**1.22);
                solarSystemBodies[n].mag = H - 2.5 * Math.log10((1-G) * phi1 + G * phi2) + 5 * Math.log10(dist * Math.sqrt(ps2));
            }
            else{solarSystemBodies[n].mag = 100}  //n=9（月）を含む
        }
        else{ //観測地自体
            solarSystemBodies[n].mag = 0;
        }
    }
}

function calc(planet, JD) {
    if (planet == Sun) {
        return [0, 0, 0];
    } else if (planet == Moon) {
        let [x, y, z] = cal_Ellipse(Earth, JD);
        let Xe, Ye, Ze, ra, dec, dist, Ms, ws, lon_moon, lat_moon;
        [Xe, Ye, Ze, ra, dec, dist, Ms, ws, lon_moon, lat_moon] = calculate_Moon(JD, lat_obs, theta);
        return [x+Xe, y+Ye, z+Ze, ra, dec, dist, Ms, ws, lon_moon, lat_moon];
    } else {
        let e = planet[2];
        if ([Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune].includes(planet)) {
            return cal_planet(planet, JD);
        } else if (e <= 0.99) {
            return cal_Ellipse(planet, JD);
        } else {
            return cal_Parabola(planet, JD);
        }
    }

    function cal_planet(planet, JD) {
        let t = (JD - planet[0]) / 36525;
        let a = planet[1] + planet[7] * t;
        let e = planet[2] + planet[8] * t;
        let incl      = (planet[3] + planet[9]  * t) * deg2rad;
        let mean_long = (planet[4] + planet[10] * t) * deg2rad;
        let long_peri = (planet[5] + planet[11] * t) * deg2rad;
        let node      = (planet[6] + planet[12] * t) * deg2rad;
        let peri = long_peri - node;
        let M = mean_long - long_peri;
        //なぜか精度が落ちる。2020付近ではだめ？
        // if ([Jupiter, Saturn, Uranus, Neptune].includes(planet)) {
        //     M += (planet[13] * t*t + planet[14] * cos(planet[16] * t) + planet[15] * sin(planet[16] * t)) * deg2rad;
        // }
        let E = M + e * sin(M);
        if (Math.abs(E - M) > 0.00000001){
            let newE = M + e * sin(E);
            while (Math.abs(newE - E) > 0.00000001){
                E = newE;
                newE = M + e * sin(E);
            }
            E = newE;
        }

        let cE_e = cos(E) - e;
        let sE = sin(E);
        let Ax = a *                     ( cos(peri)*cos(node) - sin(peri)*cos(incl)*sin(node));
        let Bx = a * Math.sqrt(1-e**2) * (-sin(peri)*cos(node) - cos(peri)*cos(incl)*sin(node));
        let Ay = a *                     ( sin(peri)*cos(incl)*cos(node)*cose + cos(peri)*sin(node)*cose - sin(peri)*sin(incl)*sine);
        let By = a * Math.sqrt(1-e**2) * ( cos(peri)*cos(incl)*cos(node)*cose - sin(peri)*sin(node)*cose - cos(peri)*sin(incl)*sine);
        let Az = a *                     ( sin(peri)*cos(incl)*cos(node)*sine + cos(peri)*sin(node)*sine + sin(peri)*sin(incl)*cose);
        let Bz = a * Math.sqrt(1-e**2) * ( cos(peri)*cos(incl)*cos(node)*sine - sin(peri)*sin(node)*sine + cos(peri)*sin(incl)*cose);

        let x = Ax * cE_e + Bx * sE;
        let y = Ay * cE_e + By * sE;
        let z = Az * cE_e + Bz * sE;
        return [x, y, z];
    }
    
    function cal_Ellipse(planet, JD) {
        let T = planet[0];
        let a = planet[1] + planet[7] * (JD - T) / 36525;
        let e = planet[2] + planet[8] * (JD - T) / 36525;
        let peri = (planet[3] + planet[9] * (JD - T) / 36525) * deg2rad; //ω
        let i = (planet[4] + planet[10] * (JD - T) / 36525) * deg2rad;
        let node = (planet[5] + planet[11] * (JD - T) / 36525) * deg2rad; //Ω
        let M0 = planet[6] * deg2rad;

        let Ax = a *                     ( cos(peri)*cos(node) - sin(peri)*cos(i)*sin(node));
        let Bx = a * Math.sqrt(1-e**2) * (-sin(peri)*cos(node) - cos(peri)*cos(i)*sin(node));
        let Ay = a *                     ( sin(peri)*cos(i)*cos(node)*cose + cos(peri)*sin(node)*cose - sin(peri)*sin(i)*sine);
        let By = a * Math.sqrt(1-e**2) * ( cos(peri)*cos(i)*cos(node)*cose - sin(peri)*sin(node)*cose - cos(peri)*sin(i)*sine);
        let Az = a *                     ( sin(peri)*cos(i)*cos(node)*sine + cos(peri)*sin(node)*sine + sin(peri)*sin(i)*cose);
        let Bz = a * Math.sqrt(1-e**2) * ( cos(peri)*cos(i)*cos(node)*sine - sin(peri)*sin(node)*sine + cos(peri)*sin(i)*cose);
        let n = 0.01720209895 * Math.pow(a, -1.5); //平均日日運動(rad)
        let M = (M0 + n * (JD - T)) % (2 * pi);
        let E = M + e * sin(M);
        if (Math.abs(E - M) > 0.00000001){
            let newE = M + e * sin(E);
            while (Math.abs(newE - E) > 0.00000001){
                E = newE;
                newE = M + e * sin(E);
            }
            E = newE;
        }

        let cE_e = cos(E) - e;
        let sE = sin(E);

        let x = Ax * cE_e + Bx * sE;
        let y = Ay * cE_e + By * sE;
        let z = Az * cE_e + Bz * sE;

        return [x, y, z];
    }

    function calculate_Moon(JD, lat_obs, theta) {
        let d = JD - 2451543.5;
        let Ms = (356.0470 + 0.9856002585 * d) % 360 * deg2rad;
        let Mm = (115.3654 + 13.0649929509 * d) % 360 * deg2rad;
        let Nm = (125.1228 - 0.0529538083 * d) % 360 * deg2rad;
        let ws = (282.9404 + 0.0000470935 * d) * deg2rad;
        let wm = (318.0634 + 0.1643573223 * d) % 360 * deg2rad;
        let e = 0.054900;
        let a = 60.2666;
        let i = 5.1454 * deg2rad;
        let D = Mm + wm + Nm - Ms - ws;
        let F = Mm + wm;

        let E = Mm + e * sin(Mm);
        if (Math.abs(E - Mm) > 0.0000001) {
            let newE = Mm + e * sin(E);
            while (Math.abs(newE - E) > 0.0000001){
                E = newE;
                newE = Mm + e * sin(E);
            }
            E = newE;
        }
        let xv = a * (cos(E) - e);
        let yv = a * Math.sqrt(1 - e**2) * sin(E);

        let v = Math.atan2(yv, xv);
        let dist = Math.sqrt(xv**2 + yv**2);

        let xh = dist * (cos(Nm) * cos(v+wm) - sin(Nm) * sin(v+wm) * cos(i));
        let yh = dist * (sin(Nm) * cos(v+wm) + cos(Nm) * sin(v+wm) * cos(i));
        let zh = dist * sin(v+wm) * sin(i);

        let lon_moon = Math.atan2(yh, xh);
        let lat_moon = Math.atan2(zh, Math.sqrt(xh**2 + yh**2));

        lon_moon +=(- 1.274*sin(Mm - 2*D)
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
                    + 0.011*sin(Mm - 4*D))* deg2rad; //rad
        lat_moon += (- 0.173*sin(F - 2*D)
                    - 0.055*sin(Mm - F - 2*D)
                    - 0.046*sin(Mm + F - 2*D)
                    + 0.033*sin(F + 2*D)
                    + 0.017*sin(2*Mm + F)) * deg2rad; //rad
        dist += -0.58*cos(Mm - 2*D) - 0.46*cos(2*D); //地球半径

        lon_moon -= 0.0002437 * (JD - 2451545.0) / 365.25; //lon, latはJ2000.0

        let Xe = cos(lat_moon) * cos(lon_moon)                             * dist * 6378.14 / 1.49598e8; //au
        let Ye = (-sin(lat_moon) * sine + cos(lat_moon) * sin(lon_moon) * cose) * dist * 6378.14 / 1.49598e8; //au
        let Ze = (sin(lat_moon) * cose + cos(lat_moon) * sin(lon_moon) * sine)  * dist * 6378.14 / 1.49598e8; //au

        let xe = Xe - cos(lat_obs) * cos(theta) * 6378.14 / 1.49598e8; //au
        let ye = Ye - cos(lat_obs) * sin(theta) * 6378.14 / 1.49598e8; //au
        let ze = Ze - sin(lat_obs)              * 6378.14 / 1.49598e8; //au
        let RA = (Math.atan2(ye, xe) * rad2deg + 360) % 360; //deg
        let Dec = Math.atan2(ze, Math.sqrt(xe**2 + ye**2)) * rad2deg; //deg

        dist *= 6378.14;

        return [Xe, Ye, Ze, RA, Dec, dist, Ms, ws, lon_moon, lat_moon] //au, au, au, deg, deg, km, rad瞬時, rad瞬時, radJ2000.0, radJ2000.0
    }

    function cal_Parabola(planet, JD) {
        let tp = planet[0];
        let q = planet[1];
        let peri = planet[3] * deg2rad; //ω
        let i = planet[4] * deg2rad;
        let node = planet[5] * deg2rad; //Ω

        let Ax =     q * ( cos(peri)*cos(node) - sin(peri)*cos(i)*sin(node));
        let Bx = 2 * q * (-sin(peri)*cos(node) - cos(peri)*cos(i)*sin(node));
        let Ay =     q * ( sin(peri)*cos(i)*cos(node)*cose + cos(peri)*sin(node)*cose - sin(peri)*sin(i)*sine);
        let By = 2 * q * ( cos(peri)*cos(i)*cos(node)*cose - sin(peri)*sin(node)*cose - cos(peri)*sin(i)*sine);
        let Az =     q * ( sin(peri)*cos(i)*cos(node)*sine + cos(peri)*sin(node)*sine + sin(peri)*sin(i)*cose);
        let Bz = 2 * q * ( cos(peri)*cos(i)*cos(node)*sine - sin(peri)*sin(node)*sine + cos(peri)*sin(i)*cose);

        let b = Math.atan(54.80779386 * Math.pow(q, 1.5) / (JD - tp));
        let g;
        if (Math.tan(b/2) >= 0) {
            g = Math.atan(Math.pow(Math.tan(b/2), 1/3));
        } else {
            g = -Math.atan(Math.pow(-Math.tan(b/2), 1/3));
        }
        let tanv2 = 2 / Math.tan(2*g);

        let x = Ax * (1 - tanv2**2) + Bx * tanv2;
        let y = Ay * (1 - tanv2**2) + By * tanv2;
        let z = Az * (1 - tanv2**2) + Bz * tanv2;

        return [x, y, z];
    }
}

function riseSetTime(planet, JD, timezone=9) {
    if (planet == Sun) {
        1;
    }
}

function show_main(){
    ctx.clearRect(0, 0, canvas.width,canvas.height);
    ctx.fillStyle = skycolor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let x, y;
    let ra, dec, mag;
    let scrRA, scrDec;
    let inFlag = false;
    infoList = [];

    const JD = showingJD;
    let theta = siderealTime(JD, lon_obs);
    if (['live', 'ar'].includes(mode)) {
        [cenAzm, cenAlt] = screen2liveAh(0, 0);
    }
    if (['AEP', 'EtP'].includes(mode)) {
        [cenAzm, cenAlt] = RADec2Ah(cenRA, cenDec, theta);
    } else if (['view', 'live', 'ar'].includes(mode)) {
        [cenRA, cenDec] = Ah2RADec(cenAzm, cenAlt, theta);
    }
    const [cenRaJ2000, cenDecJ2000] = apparentToJ2000(cenRA, cenDec, JD);

    let Astr = "";
    let hstr = "";
    if (ObsPlanet == "地球") {
        let [A, h] = RADec2Ah(cenRA, cenDec, theta);
        const direcs = ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東', '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西', '北'];
        let direc = direcs[Math.floor((A + 11.25) / 22.5)];
        Astr = `方位角 ${A.toFixed(1)}°(${direc}) `;
        hstr = `高度 ${h.toFixed(1)}° `;
        if (moving) {
            hstr += ' wait...';
        }
    }

    if (mode == 'view' && document.getElementById('gridCheck').checked) {
        drawGrid();
    }

    if (['view', 'live', 'ar'].includes(mode) && document.getElementById('demCheck').checked && document.getElementById('demFileInput').files.length > 0) {
        const fileNames = Array.from(document.getElementById('demFileInput').files).map(file => file.name);
        if (demFileName == '' || dem != null || demAngle != null || (demFileName != '' && fileNames[0] != demFileName)) {
            const demReader = new FileReader();
            demReader.onload = function(e) {
                dem = e.target.result.split(',').map(Number);
                if (dem.length == 257*257) {
                    demAngle = [...Array(257*257)].map(() => Array(3).fill(0));
                    obsHeight = dem[257*128+128];
                    for (i=0; i<257; i++) {
                        for (j=0; j<257; j++) {
                            let demDist = Math.sqrt((j-128)*(j-128)+(128-i)*(128-i));
                            if (demDist > 1){
                                demAngle[257*i+j][0] = (Math.atan2(j-128, 128-i) * rad2deg + 360) % 360;
                                demAngle[257*i+j][1] = Math.atan((dem[257*i+j]-obsHeight) * 257 / 100 / demDist) * rad2deg;
                                demAngle[257*i+j][2] = demDist;
                            }
                        }
                    }
                    demAngle.sort((a, b) => a[2] - b[2]);
                    drawDem(demAngle);
                }
            };
            demReader.onerror = function(e) {
                console.error("地形ファイルの読み込み中にエラーが発生しました", e);
            };
            demReader.readAsText(document.getElementById('demFileInput').files[0]);
        }

        drawDem(demAngle);
        function drawDem(demAngle) {
            if (Array.isArray(demAngle) && demAngle.length == 257*257 && Array.isArray(demAngle[0]) && demAngle[0].length == 3) {
                if (mode == 'view') {
                    ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
                    ctx.beginPath();
                    for (i=0; i<257*257; i++) {
                        [scrRA, scrDec] = RADec2scrview(...Ah2RADec(demAngle[i][0], demAngle[i][1], theta));
                        if (Math.abs(scrDec) < rgNS && Math.abs(scrRA) < rgEW) {
                            // drawFilledCircle (...coordSH(scrRA, scrDec), 1, c="rgba(0, 255, 0, 0.5)");
                            ctx.moveTo(...coordSH(scrRA, scrDec));
                            ctx.arc(...coordSH(scrRA, scrDec), 1, 0, 2*pi, false);
                        }
                    }
                    ctx.fill();
                } else if (['live', 'ar'].includes(mode)) {
                    ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
                    ctx.beginPath();
                    for (i=0; i<257*257; i++) {
                        [scrRA, scrDec] = Ah2scrlive(demAngle[i][0], demAngle[i][1]);
                        if (Math.abs(scrRA) < rgEW && Math.abs(scrDec) < rgNS) {
                            // drawFilledCircle(...coordSH(scrRA, scrDec), 1, c="rgba(0, 255, 0, 0.5)");
                            ctx.moveTo(...coordSH(scrRA, scrDec));
                            ctx.arc(...coordSH(scrRA, scrDec), 1, 0, 2*pi, false);
                        }
                    }
                    ctx.fill();
                }
            }
        }
    }

    if (document.getElementById('aovCheck').checked) {
        drawAov();
        if (document.getElementById('aovSliderDiv').style.display == 'none') {
            document.getElementById('aovSliderDiv').style.display = 'block';
        }
    }
    if (!document.getElementById('aovCheck').checked && document.getElementById('aovSliderDiv').style.display != 'none') {
        document.getElementById('aovSliderDiv').style.display = 'none';
    }

    if (document.getElementById('center').checked) {
        ctx.beginPath();
        ctx.strokeStyle = starColor;
        const centerReticleSize = Math.min(canvas.width, canvas.height) / 20;
        ctx.moveTo(canvas.width/2-centerReticleSize, canvas.height/2);
        ctx.lineTo(canvas.width/2+centerReticleSize, canvas.height/2);
        ctx.moveTo(canvas.width/2, canvas.height/2-centerReticleSize);
        ctx.lineTo(canvas.width/2, canvas.height/2+centerReticleSize);
        ctx.stroke();
    }

    //星座判定
    let centerConstellation = determineConstellation(cenRaJ2000, cenDecJ2000);

    //line //星座線
    if (document.getElementById('constLineCheck').checked && rgEW <= 0.5 * document.getElementById('constLineFrom').value) {
        ctx.strokeStyle = lineColor;
        ctx.beginPath();
        for (i=0; i<89; i++) {
            for (let line of constellations[i].lines) {
                let RA1 = line[0], Dec1 = line[1];
                let RA2 = line[2], Dec2 = line[3];
                [RA1, Dec1] = J2000toApparent(RA1, Dec1, JD);
                [RA2, Dec2] = J2000toApparent(RA2, Dec2, JD);
                if (mode == 'AEP') {
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
                } else if (mode == 'EtP') {
                    function whetherDrawLine (RA1, Dec1, RA2, Dec2, a) {
                        if (Math.min(RA1, RA2)+a < cenRA+rgEW && Math.max(RA1, RA2)+a > cenRA-rgEW) {
                            if (Math.min(Dec1, Dec2) < cenDec+rgNS && Math.max(Dec1, Dec2) > cenDec-rgNS) {
                                return true;
                            }
                        }
                        return false;
                    }
                    if (cenRA - rgEW < 0) {
                        if (whetherDrawLine (RA1, Dec1, RA2, Dec2,    0)) drawLines(RA1, Dec1, RA2, Dec2, 0);
                        if (whetherDrawLine (RA1, Dec1, RA2, Dec2, -360)) drawLines(RA1, Dec1, RA2, Dec2, -360);
                    } else if (cenRA + rgEW >= 360) {
                        if (whetherDrawLine (RA1, Dec1, RA2, Dec2,   0)) drawLines(RA1, Dec1, RA2, Dec2, 0);
                        if (whetherDrawLine (RA1, Dec1, RA2, Dec2, 360)) drawLines(RA1, Dec1, RA2, Dec2, 360);
                    } else {
                        if (whetherDrawLine (RA1, Dec1, RA2, Dec2, 0)) drawLines(RA1, Dec1, RA2, Dec2, 0);
                    }
                } else if (mode == 'view') {
                    let [RA1_view, Dec1_view] = RADec2scrview(RA1, Dec1);
                    let [RA2_view, Dec2_view] = RADec2scrview(RA2, Dec2);
                    if (Math.min(RA1_view, RA2_view) < rgEW && Math.max(RA1_view, RA2_view) > -rgEW) {
                        if (Math.min(Dec1_view, Dec2_view) < rgNS && Math.max(Dec1_view, Dec2_view) > -rgNS) {
                            if (Math.pow(RA2_view-RA1_view, 2) + Math.pow(Dec2_view-Dec1_view, 2) < 30*30) {
                                ctx.moveTo(...coordSH(RA1_view, Dec1_view));
                                ctx.lineTo(...coordSH(RA2_view, Dec2_view));
                            }
                        }
                    }
                } else if (['live', 'ar'].includes(mode)) {
                    let [scrRA1, scrDec1] = Ah2scrlive(...RADec2Ah(RA1, Dec1, theta));
                    let [scrRA2, scrDec2] = Ah2scrlive(...RADec2Ah(RA2, Dec2, theta));
                    if (Math.min(scrRA1, scrRA2) < rgEW && Math.max(scrRA1, scrRA2) > -rgEW) {
                        if (Math.min(scrDec1, scrDec2) < rgNS && Math.max(scrDec1, scrDec2) > -rgNS) {
                            if (Math.pow(scrRA2-scrRA1, 2) + Math.pow(scrDec2-scrDec1, 2) < 30*30) {
                                ctx.moveTo(...coordSH(scrRA1, scrDec1));
                                ctx.lineTo(...coordSH(scrRA2, scrDec2));
                            }
                        }
                    }
                }
            }
        }
        ctx.stroke();
    }

    //Gaia
    // messierに含まれない6.5等級より明るい星もあるので、magLim > 5で余裕を持たせる
    if (magLim > 5 && gaia100[0] != null && gaia100_help[0] != null) {
        let skyareas = [];
        if (mode == 'AEP') {
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
            if (magLim > 10 && gaia101_110[0] != null && gaia101_110_help[0] != null) {
                drawGaia(gaia101_110, gaia101_110_help, skyareas);
                if (magLim > 11 && gaia111_115[0] != null && gaia111_115_help[0] != null) {
                    drawGaia(gaia111_115, gaia111_115_help, skyareas);
                }
            }
        } else if (mode == 'EtP') { //正距円筒図法
            if (cenRA - rgEW < 0) {
                //skyareasは[[a, b]]のaの領域とbの領域を両方含む
                skyareas = [[SkyArea(0,              cenDec-rgNS), SkyArea(cenRA+rgEW, cenDec-rgNS)],
                            [SkyArea(cenRA-rgEW+360, cenDec-rgNS), SkyArea(359.9,      cenDec-rgNS)]];
                for (let i=1; i<=Math.floor(cenDec+rgNS)-Math.floor(cenDec-rgNS); i++) {
                    skyareas.push([skyareas[0][0]+360*i, skyareas[0][1]+360*i]);
                    skyareas.push([skyareas[1][0]+360*i, skyareas[1][1]+360*i]);
                }
            } else if (cenRA + rgEW >= 360) {
                skyareas = [[SkyArea(0,          cenDec-rgNS), SkyArea(cenRA+rgEW-360, cenDec-rgNS)],
                            [SkyArea(cenRA-rgEW, cenDec-rgNS), SkyArea(359.9,          cenDec-rgNS)]];
                for (let i=1; i<=Math.floor(cenDec+rgNS)-Math.floor(cenDec-rgNS); i++) {
                    skyareas.push([skyareas[0][0]+360*i, skyareas[0][1]+360*i]);
                    skyareas.push([skyareas[1][0]+360*i, skyareas[1][1]+360*i]);
                }
            } else {
                skyareas = [[SkyArea(cenRA-rgEW, cenDec-rgNS), SkyArea(cenRA+rgEW, cenDec-rgNS)]];
                for (let i=1; i<=Math.floor(cenDec+rgNS)-Math.floor(cenDec-rgNS); i++) {
                    skyareas.push([skyareas[0][0]+360*i, skyareas[0][1]+360*i]);
                }
            }
            drawGaia(gaia100, gaia100_help, skyareas);
            if (magLim > 10 && gaia101_110[0] != null && gaia101_110_help[0] != null) {
                drawGaia(gaia101_110, gaia101_110_help, skyareas);
                if (magLim > 11 && gaia111_115[0] != null && gaia111_115_help[0] != null) {
                    drawGaia(gaia111_115, gaia111_115_help, skyareas);
                }
            }
        } else if (mode == 'view') {
            let [scrRA_NP, scrDec_NP] = RADec2scrview(0, 90);
            let [scrRA_SP, scrDec_SP] = RADec2scrview(0, -90);
            if (Math.abs(scrRA_NP) < rgEW && Math.abs(scrDec_NP) < rgNS) {
                let minDec = Math.min(
                    Ah2RADec(...SHtoAh(rgEW, -rgNS), theta)[1],
                    Ah2RADec(...SHtoAh(-rgEW, -rgNS), theta)[1],
                    Ah2RADec(...SHtoAh(rgEW, rgNS), theta)[1],
                    Ah2RADec(...SHtoAh(-rgEW, rgNS), theta)[1]
                );
                skyareas = [[SkyArea(0, minDec), SkyArea(359.9, 89.9)]];
            } else if (Math.abs(scrRA_SP) < rgEW && Math.abs(scrDec_SP) < rgNS) {
                let maxDec = Math.max(
                    Ah2RADec(...SHtoAh(rgEW, -rgNS), theta)[1],
                    Ah2RADec(...SHtoAh(-rgEW, -rgNS), theta)[1],
                    Ah2RADec(...SHtoAh(rgEW, rgNS), theta)[1],
                    Ah2RADec(...SHtoAh(-rgEW, rgNS), theta)[1]
                );
                skyareas = [[SkyArea(0, -90), SkyArea(359.9, maxDec)]];
            } else {
                let RA_max = 0, RA_min = 360, Dec_max = -90, Dec_min = 90;
                let edgeRA = [];
                let edgeDec = [];
                for (j=0; j<=Math.ceil(3*rgEW); j++) {
                    for (i=0; i<=Math.ceil(3*rgNS); i++) {
                        if (i == 0 || i == Math.ceil(3*rgNS) || j == 0 || j == Math.ceil(3*rgEW)) {
                            [A, h] = SHtoAh((2*j/Math.ceil(3*rgEW)-1)*rgEW, (2*i/Math.ceil(3*rgNS)-1)*rgNS);
                            [ra, dec] = Ah2RADec(A, h, theta);
                            edgeRA.push(ra);
                            edgeDec.push(dec);
                        }
                    }
                }
                Dec_max = Math.max(...edgeDec);
                Dec_min = Math.min(...edgeDec);
                RA_max = Math.max(...edgeRA);
                RA_min = Math.min(...edgeRA);
                if (RA_max > 330 && RA_min < 30) {
                    RA_max = Math.max(...edgeRA.filter(function(value) {return value < (cenRA + 180) % 360;}));
                    RA_min = Math.min(...edgeRA.filter(function(value) {return value > (cenRA + 180) % 360;}));
                    skyareas = [[SkyArea(0, Dec_min), SkyArea(RA_max, Dec_min)], [SkyArea(RA_min, Dec_min), SkyArea(359.9, Dec_min)]]
                    for (let i=1; i<=Math.floor(Dec_max)-Math.floor(Dec_min); i++) {
                        skyareas.push([skyareas[0][0]+360*i, skyareas[0][1]+360*i]);
                        skyareas.push([skyareas[1][0]+360*i, skyareas[1][1]+360*i]);
                    }
                } else {
                    skyareas = [[SkyArea(RA_min, Dec_min), SkyArea(RA_max, Dec_min)]];
                    for (let i=1; i<=Math.floor(Dec_max)-Math.floor(Dec_min); i++) {
                        skyareas.push([skyareas[0][0]+360*i, skyareas[0][1]+360*i]);
                    }
                }
            }
            drawGaia(gaia100, gaia100_help, skyareas);
            if (magLim > 10 && gaia101_110[0] != null && gaia101_110_help[0] != null) {
                drawGaia(gaia101_110, gaia101_110_help, skyareas);
                if (magLim > 11 && gaia111_115[0] != null && gaia111_115_help[0] != null) {
                    drawGaia(gaia111_115, gaia111_115_help, skyareas);
                }
            }
        }
    }

    if (starNames.length > 0 && !starNameElem[0].checked) {
        writeStarNames();
    }

    //HIP
    ctx.fillStyle = starColor;
    function drawHIPstar(x, y, mag, c) {
        drawFilledCircle(x, y, size(mag), c);
        //回折による光の筋みたいなのを作りたい
    }
    var hips_magfilter = hips.filter(hip => hip.mag <= magLim);
    for (i=0; i<hips_magfilter.length; i++){
        let hip = hips_magfilter[i];
        // [x, y, inFlag] = xyIfInCanvas(hip.ra, hip.dec);
        [x, y, inFlag] = xyIfInCanvas(...J2000toApparent(hip.ra, hip.dec, JD));
        if (inFlag) drawHIPstar(x, y, hip.mag, bv2color(hip.bv));
    }

    // 星座名
    ctx.font = '16px serif';
    if (document.getElementById('constNameCheck').checked && rgEW <= 0.5 * document.getElementById('constNameFrom').value) {
        ctx.fillStyle = textColor;
        for (i=0; i<89; i++){
            ra = +constellations[i].ra;
            dec = +constellations[i].dec;
            [x, y, inFlag] = xyIfInCanvas(ra, dec);
            if (inFlag) {
                let constName = constellations[i].JPNname;
                ctx.fillText(constName, x-40, y-10);
                infoList.push([constName + '座', x, y]);
            }
        }
    }

    ctx.font = '16px serif';
    ctx.strokeStyle = objectColor;
    ctx.fillStyle = objectColor;

    if (BSCRAary[BSCnum] != 0 && document.getElementById('BayerFSCheck').checked && BayerNums.length != 0) {
        writeBayer();
    }

    if (messier.length > 0 && document.getElementById('MessierCheck').checked && rgEW <= 0.5 * document.getElementById('MessierFrom').value) {
        drawMessier();
    }

    if (recs.length > 0 && document.getElementById('recsCheck').checked && rgEW <= 0.5 * document.getElementById('recsFrom').value) {
        drawRecs();
    }

    if (NGC.length > 0 && document.getElementById('allNGCCheck').checked && rgEW <= 0.5 * document.getElementById('allNGCFrom').value && NGC.length != 0) {
        drawNGC();
    }

    //5030"/yr

    //惑星、惑星の名前
    ctx.font = '20px serif';
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'left';

    if (document.getElementById('planetCheck').checked) {
        for (i=0; i<JPNplanets.length; i++){
            [x, y, inFlag] = xyIfInCanvas(solarSystemBodies[i].ra, solarSystemBodies[i].dec);
            // 枠内に入っていて
            if (i != Obs_num && inFlag) {
                if (i == 0){ // 太陽
                    let r = Math.max(canvas.width * (0.267 / solarSystemBodies[0].dist) / rgEW / 2, 13);
                    drawFilledCircle(x, y, r, yellowColor);
                    if (document.getElementById('planetNameCheck').checked && rgEW <= 0.5 * document.getElementById('planetNameFrom').value) {
                        ctx.fillStyle = specialObjectNameColor;
                        ctx.fillText(JPNplanets[i], x+Math.max(0.8*r, 10), y-Math.max(0.8*r, 10));
                    }
                    infoList.push([JPNplanets[i], x, y]);
                } else if (i == 9) { // 月(地球から見たときだけ)
                    if (Obs_num == 3) {
                        let r = drawMoon();
                        if (document.getElementById('planetNameCheck').checked && rgEW <= 0.5 * document.getElementById('planetNameFrom').value) {
                            ctx.fillStyle = specialObjectNameColor;
                            ctx.fillText(JPNplanets[i], x+Math.max(0.8*r, 10), y-Math.max(0.8*r, 10));
                        }
                        infoList.push(['月', x, y]);
                    }
                } else if (i != 9 && i != 5) {// 太陽と月と木星以外
                    mag = solarSystemBodies[i].mag;
                    drawFilledCircle(x, y, Math.max(size(mag), 0.5), '#F33');
                    if (document.getElementById('planetNameCheck').checked && rgEW <= 0.5 * document.getElementById('planetNameFrom').value) {
                        ctx.fillStyle = specialObjectNameColor;
                        ctx.fillText(JPNplanets[i], x, y);
                    }
                    infoList.push([JPNplanets[i], x, y]);
                } else if (i == 5) {
                    mag = solarSystemBodies[i].mag;
                    if (Math.min(rgEW, rgNS) < 2){
                        drawFilledCircle(x, y, canvas.width*(0.027/solarSystemBodies[5].dist)/rgEW/2, '#FEECD2');
                        ctx.font = '15px serif';
                        if (document.getElementById('planetNameCheck').checked && rgEW <= 0.5 * document.getElementById('planetNameFrom').value) {
                            ctx.fillStyle = specialObjectNameColor;
                            ctx.fillText('木星', x, y);
                        }
                        infoList.push([JPNplanets[i], x, y]);
                        function doubleSin(A1, T1, phi1, A2, T2, phi2, C) {
                            return A1 * sin(2 * pi * (JD - 2460700) / T1 + phi1) + A2 * sin(2 * pi * (JD - 2460700) / T2 + phi2) + C;
                        }
                        let io = [
                            [2.81902066e-03, 1.76913779e+00, 8.65841524e-01, 1.74598769e-05, 4.86827421e+02, 2.66915800e+00, -2.18722549e-07],
                            [2.81749741e-03, 1.76913780e+00, -7.05455552e-01, 1.74491534e-05, 4.86856291e+02, 4.24131033e+00, 8.18597552e-08],
                            [0.00010859262101371663, 1.769140962458129, -0.3257986471267499, 0, 1, 0, -1.3007560448464165e-07]
                        ];
                        let europa = [
                            [4.48458800e-03, 3.55118035e+00, -9.02192463e-01, 6.26054071e-05, 4.86569848e+02, -4.74084307e-01, -8.69788604e-07],
                            [4.48339424e-03, 3.55118004e+00, -2.47369227e+00, 6.26447647e-05, 4.87167668e+02, 1.10308902e+00, 2.64572475e-07],
                            [1.68287262e-04, 3.55119272e+00, -1.87783527e+00, 0, 1, 0, 4.81407414e-07]
                        ]
                        let ganymede = [
                            [7.15463873e-03, 7.15455397e+00, 2.92727313e+00, 6.59854992e-06, 4.78597640e+02, 2.60102925e+00, -2.00450346e-05],
                            [7.15015296e-03, 7.15455414e+00, 1.35593375e+00, 6.52410267e-06, 4.95415244e+02, -1.96356203e+00, 8.13836093e-06],
                            [2.92016360e-04, 7.15446463e+00, 1.71476937e+00, 0, 1, 0, -3.35154035e-08]
                        ]
                        let callisto = [
                            [1.25841245e-02, 1.66890172e+01, 2.15602328e-01, 4.53197520e-05, 8.34464401e+00, -1.31205372e+00, -1.33895795e-04],
                            [1.25786592e-02, 1.66890142e+01, -1.35561583e+00, 4.53041567e-05, 8.34463367e+00, -2.88356795e+00, -2.38334693e-05],
                            [4.28550326e-04, 1.66890365e+01, -9.48956811e-01, 0, 1, 0, -2.54730259e-06]
                        ]
                        
                        let jupiterXYZ = [solarSystemBodies[5].x, solarSystemBodies[5].y, solarSystemBodies[5].z];
                        let hereXYZ = [solarSystemBodies[Obs_num].x, solarSystemBodies[Obs_num].y, solarSystemBodies[Obs_num].z]
                        let jupiter_ecl = Rx([jupiterXYZ[0]-hereXYZ[0], jupiterXYZ[1]-hereXYZ[1], jupiterXYZ[2]-hereXYZ[2]], -eps);

                        let galileo = [io, europa, ganymede, callisto];
                        let galileoNames = ['I', 'E', 'G', 'C'];
                        let galileo_ecl = [0, 0, 0];
                        let galileo_equ = [0, 0, 0];
                        let galileo_radecdist = [0, 0, 0];
                        for (let j = 0; j < 4; j++) {
                            galileo_ecl = [doubleSin(...galileo[j][0]), doubleSin(...galileo[j][1]), doubleSin(...galileo[j][2])]
                            galileo_equ = Rx([jupiter_ecl[0]+galileo_ecl[0], jupiter_ecl[1]+galileo_ecl[1], jupiter_ecl[2]+galileo_ecl[2]], eps);
                            galileo_radecdist = xyz_to_RADec(...galileo_equ);
                            [x, y, inFlag] = xyIfInCanvas(galileo_radecdist[0], galileo_radecdist[1]);
                            drawFilledCircle(x, y, 1, '#F33');
                            if (document.getElementById('planetNameCheck').checked && rgEW <= 0.5 * document.getElementById('planetNameFrom').value) {
                                ctx.fillStyle = specialObjectNameColor;
                                ctx.fillText(galileoNames[j], x, y);
                            }
                        }
                        ctx.font = '20px serif';
                    } else {
                        drawFilledCircle(x, y, Math.max(size(mag), 0.5), '#F33');
                        if (document.getElementById('planetNameCheck').checked && rgEW <= 0.5 * document.getElementById('planetNameFrom').value) {
                            ctx.fillStyle = specialObjectNameColor;
                            ctx.fillText(JPNplanets[i], x, y);
                        }
                        infoList.push([JPNplanets[i], x, y]);
                    }
                }
            }
        }

        if (document.getElementById('planetTrackCheck').checked) {
            let trackJD = JD;
            let trackSpan = parseFloat(document.getElementById('trackSpan').value);
            if (document.getElementById('trackUnit').value == '時間') {
                trackSpan /= 24.0;
            }
            let trackDuration = parseFloat(document.getElementById('trackDuration').value);
            let trackElem = planets[JPNplanets.indexOf(trackPlanet)]
            let k = 0;
            while (trackJD - trackSpan >= showingJD - trackDuration) {
                trackJD -= trackSpan;
                k--;
                drawPlanetMotion(trackElem, trackJD, k);
            }
            trackJD = JD;
            while (trackJD + trackSpan <= showingJD + trackDuration) {
                trackJD += trackSpan;
                k++;
                drawPlanetMotion(trackElem, trackJD, k);
            }
        }
    }

    if (Math.min(rgNS, rgEW) <= 2.5) {
        [x, y, inFlag] = xyIfInCanvas(...J2000toApparent(0, 90, JD));
        if (inFlag) {
            drawObjects('2000年初', x, y, 1);
        }
        [x, y, inFlag] = xyIfInCanvas(0, 90);
        if (inFlag) {
            drawObjects('現在', x, y, 1);
        }
    }

    // let cenRA_hm = radeg2hm(cenRA);
    // let cenDec_dm = decdeg2dm(cenDec);
    // let J2000Text = `赤経 ${cenRA_hm[0]}h ${cenRA_hm[1].toFixed(1)}m `;
    // if (cenDec >= 0) {
    //     J2000Text += `赤緯 +${cenDec_dm[0]}° ${cenDec_dm[1].toFixed()}' (J2000.0) `;
    // } else {
    //     J2000Text += `赤緯 ${cenDec_dm[0]}° ${cenDec_dm[1].toFixed()}' (J2000.0) `;
    // }

    // let [cenRaApp, cenDecApp] = J2000toApparent(cenRA, cenDec, JD);
    // cenRA_hm = radeg2hm(cenRaApp);
    // cenDec_dm = decdeg2dm(cenDecApp);
    // let apparentText = `赤経 ${cenRA_hm[0]}h ${cenRA_hm[1].toFixed(1)}m `;
    // if (cenDec >= 0) {
    //     apparentText += `赤緯 +${cenDec_dm[0]}° ${cenDec_dm[1].toFixed()}' (視位置) `;
    // } else {
    //     apparentText += `赤緯 ${cenDec_dm[0]}° ${cenDec_dm[1].toFixed()}' (視位置) `;
    // }

    // document.getElementById("coordtext").style.color = textColor;
    // if (coordinateSystemElem.value == '視位置') {
    //     document.getElementById("coordtext").innerHTML = `${centerConstellation} ${rgtext} ${magLimtext}<br>${apparentText}<br>${Astr}${hstr}`;
    // } else if (coordinateSystemElem.value == 'J2000.0') {
    //     document.getElementById("coordtext").innerHTML = `${centerConstellation} ${rgtext} ${magLimtext}<br>${J2000Text}<br>${Astr}${hstr}`;
    // } else {
    //     document.getElementById("coordtext").innerHTML = `${centerConstellation} ${rgtext} ${magLimtext}<br>${apparentText}<br>${J2000Text}<br>${Astr}${hstr}`;
    // }

    let cenRA_hm = radeg2hm(cenRA);
    let cenDec_dm = decdeg2dm(cenDec);
    let apparentText = `赤経 ${cenRA_hm[0]}h ${cenRA_hm[1].toFixed(1)}m `;
    if (cenDec >= 0) {
        apparentText += `赤緯 +${cenDec_dm[0]}° ${cenDec_dm[1].toFixed()}' (視位置) `;
    } else {
        apparentText += `赤緯 ${cenDec_dm[0]}° ${cenDec_dm[1].toFixed()}' (視位置) `;
    }

    cenRA_hm = radeg2hm(cenRaJ2000);
    cenDec_dm = decdeg2dm(cenDecJ2000);
    let J2000Text = `赤経 ${cenRA_hm[0]}h ${cenRA_hm[1].toFixed(1)}m `;
    if (cenDec >= 0) {
        J2000Text += `赤緯 +${cenDec_dm[0]}° ${cenDec_dm[1].toFixed()}' (J2000.0) `;
    } else {
        J2000Text += `赤緯 ${cenDec_dm[0]}° ${cenDec_dm[1].toFixed()}' (J2000.0) `;
    }


    document.getElementById("coordtext").style.color = textColor;
    if (coordinateSystemElem.value == '視位置') {
        document.getElementById("coordtext").innerHTML = `${centerConstellation} ${rgtext} ${magLimtext}<br>${apparentText}<br>${Astr}${hstr}`;
    } else if (coordinateSystemElem.value == 'J2000.0') {
        document.getElementById("coordtext").innerHTML = `${centerConstellation} ${rgtext} ${magLimtext}<br>${J2000Text}<br>${Astr}${hstr}`;
    } else {
        document.getElementById("coordtext").innerHTML = `${centerConstellation} ${rgtext} ${magLimtext}<br>${apparentText}<br>${J2000Text}<br>${Astr}${hstr}`;
    }

    function SkyArea(RA, Dec) { //(RA, Dec)はHelperで↓行目（0始まり）の行数からのブロックに入ってる
        return parseInt(360 * Math.floor(Dec + 90) + Math.floor(RA));
    }

    // 座標変換

    function RApos(RA) {
        return (RA + 540 - cenRA) % 360 - 180;
    }

    function coord(RA, Dec) {
        let x = canvas.width * (0.5 - RApos(RA) / rgEW * 0.5);
        let y = canvas.height * (0.5 - (Dec - cenDec) / rgNS * 0.5);
        return [x, y];
    }

    function xy2scr(x, y) {
        let scrRA = rgEW * (1 - 2 * x / canvas.width);
        let scrDec = rgNS * (1 - 2 * y / canvas.height);
        return [scrRA, scrDec];
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

    function RADec2scrview (RA, Dec) {
        let t = theta - RA * deg2rad;
        Dec *= deg2rad;
        let [x, y, z] = Ry(Rz(Ry([-cos(t)*cos(Dec), sin(t)*cos(Dec), sin(Dec)], pi/2-lat_obs), cenAzm*deg2rad), cenAlt*deg2rad-pi/2);
        if (z >= 1) {
            return [0, 0];
        } else {
            let b = Math.acos(z) * rad2deg;
            let isr = b * Math.pow(x**2 + y**2, -0.5);
            let scrRA = y * isr;
            let scrDec = -x * isr;
            return [scrRA, scrDec];
        }
    }

    function Ah2scrlive (A, h) {
        A = (A - loadAzm - 90) * deg2rad;
        h *= deg2rad;
        let [x, y, z] = Ry(Rx(Rz([cos(A)*cos(h), -sin(A)*cos(h), sin(h)], -dev[0]), -dev[1]), -dev[2]);
        if (-z >= 1) {
            return [0, 0];
        } else {
            let b = Math.acos(-z) * rad2deg;
            let scrRA = -b * x * Math.pow(x**2 + y**2, -0.5);
            let scrDec = b * y * Math.pow(x**2 + y**2, -0.5);
            return [scrRA, scrDec];
        }
    }

    function coordSH (scrRA, scrDec) {
        let x = canvas.width * (0.5 - scrRA / rgEW * 0.5);
        let y = canvas.height * (0.5 - scrDec / rgNS * 0.5);
        return [x, y];
    }

    function xyIfInCanvas(ra, dec) {
        let scrRA, scrDec;
        let x, y;
        let inFlag = false;
        if (mode == 'AEP') {
            [scrRA, scrDec] = RADec2scrAEP(ra, dec);
            if (Math.abs(scrRA) < rgEW && Math.abs(scrDec) < rgNS) {
                [x, y] = coordSH(scrRA, scrDec);
                inFlag = true;
            }
        } else if (mode == 'EtP') {
            if (Math.abs(RApos(ra)) < rgEW && Math.abs(dec-cenDec) < rgNS) {
                [x, y] = coord(ra, dec);
                inFlag = true;
            }
        } else if (mode == 'view') {
            [scrRA, scrDec] = RADec2scrview(ra, dec, theta);
            if (Math.abs(scrRA) < rgEW && Math.abs(scrDec) < rgNS) {
                [x, y] = coordSH(scrRA, scrDec);
                inFlag = true;
            }
        } else if (['live', 'ar'].includes(mode)) {
            let [A, h] = RADec2Ah(ra, dec, theta);
            [scrRA, scrDec] = Ah2scrlive(A, h);
            if (Math.abs(scrRA) < rgEW && Math.abs(scrDec) < rgNS) {
                [x, y] = coordSH(scrRA, scrDec);
                inFlag = true;
            }
        }
        return [x, y, inFlag];
    }

    // 星の大きさなど

    function size(mag) {
        if (mag > magLim) {
            return zerosize / (magLim + 1);
        } else {
            return zerosize / (magLim + 1) + zerosize * (magLim / (magLim + 1)) * Math.pow((magLim - mag) / magLim, 1.3);
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
        for (let i=0; i<boundary.length; i++) {
            const {num, ra1, dec1, ra2, dec2} = boundary[i];
            if (Math.min(dec1, dec2) <= cenDec*1000 && cenDec*1000 < Math.max(dec1, dec2)) {
                if (cenRA*1000 >= (cenDec*1000-dec1) * (ra2-ra1) / (dec2-dec1) + ra1) {
                    a[num-1] = (a[num-1] + 1) % 2;
                }
            }
        }

        let centerConstellation = "";
        for (let i=0; i<89; i++) {
            if (a[i] == 1) {
                centerConstellation = constellations[i].JPNname + "座  ";
                break;
            }
        }
        if (centerConstellation == "") {
            centerConstellation = cenDec > 0 ? "こぐま座  " : "はちぶんぎ座  ";
        }
        return centerConstellation;
    }

    // 描画

    function drawLines (RA1, Dec1, RA2, Dec2, a) {
        ctx.moveTo(...coord(RA1+a, Dec1));
        ctx.lineTo(...coord(RA2+a, Dec2));
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
                [ra, dec] = J2000toApparent(ra, dec, JD);
                let [x, y, inFlag] = xyIfInCanvas(ra, dec);
                if (inFlag) {
                    ctx.moveTo(x, y);
                    ctx.arc(x, y, size(mag), 0, 2 * pi, false);
                }
            }
        }
        ctx.fill();
    }

    function writeBayer () {
        ctx.strokeStyle = objectColor;
        ctx.fillStyle = objectColor;
        const Greeks = ['Alp', 'Bet', 'Gam', 'Del', 'Eps', 'Zet', 'Eta', 'The', 'Iot', 'Kap', 'Lam', 'Mu', 'Nu', 'Xi', 'Omc', 'Pi', 'Rho', 'Sig', 'Tau', 'Ups', 'Phi', 'Chi', 'Psi', 'Ome'];
        const GreekLetters = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω'];
        for (i=0; i<BSCnum; i++){
            let ra = BSCRAary[i];
            let dec = BSCDecary[i];
            let name;
            if (Bayers[i] != '') {
                name = GreekLetters[Greeks.indexOf(Bayers[i])];
                if (BayerNums[i] != '') name += BayerNums[i];
                if (FSs[i] != '') name += '(' + FSs[i] + ')';
            } else {
                name = FSs[i];
            }
            [x, y, inFlag] = xyIfInCanvas(...J2000toApparent(ra, dec, JD));
            if (inFlag) {
                drawObjects(name, x, y, 0);
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
            [ra, dec] = J2000toApparent(ra, dec, JD);
            [x, y, inFlag] = xyIfInCanvas(ra, dec);
            if (inFlag) {
                func(i, name, x, y);
            }
        }
    }

    function writeStarNames () {
        const tier_range = [180, 90, 60, 40, 30, 30];
        let tierLimit = 3;
        if (starNameElem[1].checked) {
            tierLimit = 1;
        } else if (starNameElem[2].checked) {
            tierLimit = 2;
        }
        ctx.strokeStyle = textColor;
        ctx.fillStyle = textColor;
        for (i=0; i<starNames.length; i++){
            let d = starNames[i];
            let tier = d.tier; //概ね等級-1
            if (tierLimit == 1 && tier > 0) continue;
            if (tierLimit == 2 && tier > 1) continue;
            if (2*Math.max(rgNS, rgEW) > tier_range[tier-1]) continue;
            [x, y, inFlag] = xyIfInCanvas(...J2000toApparent(d.ra, d.dec, JD));
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

    function drawNGC () {
        ctx.strokeStyle = objectColor;
        ctx.fillStyle = objectColor;
        const drawRecFlag = (recs.length > 0 && document.getElementById('recsCheck').checked);
        for (i=0; i<NGC.length; i+=5){
            let [x, y, inFlag] = xyIfInCanvas(...J2000toApparent(+NGC[i+1], +NGC[i+2], JD));
            if (inFlag) drawObjects(NGC[i], x, y, NGC[i+4]);
        }
    }

    function drawMoon () {
        let rs = solarSystemBodies[0].ra * deg2rad;
        let ds = solarSystemBodies[0].dec * deg2rad;
        let rm = solarSystemBodies[9].ra * deg2rad;
        let dm = solarSystemBodies[9].dec * deg2rad;
        let r = Math.max(canvas.width * (0.259 / (solarSystemBodies[9].dist / 384400)) / rgEW * 0.5, 13);
        let lon_sun = Ms + 0.017 * sin(Ms + 0.017 * sin(Ms)) + ws;
        let k = (1 - cos(lon_sun-lon_moon) * cos(lat_moon)) / 2;
        let P, RA1, Dec1, A1, h1, scrRA1, scrDec1, x1, y1

        //Pは赤経の負方向（右）から月を時計回りに見て黄色から黒になるところの角度
        if (mode == 'AEP') {
            P = Math.atan2(cos(ds)*sin(rm-rs), -sin(dm)*cos(ds)*cos(rm-rs)+cos(dm)*sin(ds));
            RA1 = (rm - 0.2*cos(P) / cos(dm)) * rad2deg;
            Dec1 = (dm - 0.2*sin(P)) * rad2deg;
            [scrRA1, scrDec1] = RADec2scrAEP(RA1, Dec1);
            [x1, y1] = coordSH(scrRA1, scrDec1);
            P = Math.atan2(y1-y, x1-x);
        } else if (mode == 'EtP') {
            P = Math.atan2(cos(ds)*sin(rm-rs), -sin(dm)*cos(ds)*cos(rm-rs)+cos(dm)*sin(ds));
        } else if (mode == 'view') {
            P = Math.atan2(cos(ds)*sin(rm-rs), -sin(dm)*cos(ds)*cos(rm-rs)+cos(dm)*sin(ds));
            RA1 = (rm - 0.2*cos(P) / cos(dm)) * rad2deg;
            Dec1 = (dm - 0.2*sin(P)) * rad2deg;
            [scrRA1, scrDec1] = RADec2scrview(RA1, Dec1);
            [x1, y1] = coordSH(scrRA1, scrDec1);
            P = Math.atan2(y1-y, x1-x);
        } else if (['live', 'ar'].includes(mode)) {
            P = Math.atan2(cos(ds)*sin(rm-rs), -sin(dm)*cos(ds)*cos(rm-rs)+cos(dm)*sin(ds));
            RA1 = (rm - 0.2*cos(P) / cos(dm)) * rad2deg;
            Dec1 = (dm - 0.2*sin(P)) * rad2deg;
            [A1, h1] = RADec2Ah(RA1, Dec1, theta);
            [scrRA1, scrDec1] = Ah2scrlive(A1, h1);
            [x1, y1] = coordSH(scrRA1, scrDec1);
            P = Math.atan2(y1-y, x1-x);
        }

        ctx.beginPath();
        if (k < 0.5) {
            drawFilledCircle(x, y, r, yellowColor);
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(x, y, r, P, P+pi);
            ctx.ellipse(x, y, r, r*(1-2*k), P-pi, 0, pi);
            ctx.fill();
        } else {
            drawFilledCircle(x, y, r, '#333');
            ctx.fillStyle = yellowColor;
            ctx.beginPath();
            ctx.arc(x, y, r, P-pi, P);
            ctx.ellipse(x, y, r, r*(2*k-1), P, 0, pi);
            ctx.fill();
        }
        return r;
    }

    function drawPlanetMotion(trackElem, trackJD, k) {
        let [X, Y, Z] = calc(planets[Obs_num], trackJD);
        let [x, y, z] = calc(trackElem, trackJD);
        let [ra, dec, dist] = xyz_to_RADec(x-X, y-Y, z-Z);
        [x, y, inFlag] = xyIfInCanvas(ra, dec);
        if (inFlag) {
            if (!(trackPlanet == '月' && ObsPlanet != '地球')) {
                ctx.strokeStyle = 'lightgreen'
                ctx.beginPath();
                ctx.moveTo(x-3, y-3);
                ctx.lineTo(x+3, y+3);
                ctx.moveTo(x-3, y+3);
                ctx.lineTo(x+3, y-3);
                ctx.stroke();
                if (document.getElementById('planetTrackTimeCheck').checked && k % document.getElementById('trackTextSpan').value == 0) {
                    let trackDateType = '';
                    for (i=0; i<trackDateElem.length; i++) {
                        if (trackDateElem[i].checked) {
                            trackDateType = trackDateElem[i].value;
                        }
                    }
                    let ymdhm = JD_to_YMDHM(trackJD);
                    let trackDateText = '';
                    ctx.font = '16px serif'
                    if (trackDateType == 'ymd') {
                        trackDateText = `${ymdhm[0]}/${ymdhm[1]}/${ymdhm[2]}`;
                    } else if (trackDateType == 'ymdh') {
                        trackDateText =`${ymdhm[0]}/${ymdhm[1]}/${ymdhm[2]} ${Math.round(ymdhm[3]+ymdhm[4]/60)}時`;
                    } else if (trackDateType == 'ymdhi') {
                        trackDateText = `${ymdhm[0]}/${ymdhm[1]}/${ymdhm[2]} ${ymdhm[3]}:${ymdhm[4]}`;
                    } else if (trackDateType == 'md') {
                        trackDateText = `${ymdhm[1]}/${ymdhm[2]}`;
                    } else if (trackDateType == 'mdh') {
                        trackDateText = `${ymdhm[1]}/${ymdhm[2]} ${Math.round(ymdhm[3]+ymdhm[4]/60)}時`;
                    } else if (trackDateType == 'mdhi') {
                        trackDateText = `${ymdhm[1]}/${ymdhm[2]} ${ymdhm[3]}:${ymdhm[4]}`;
                    } else if (trackDateType == 'd') {
                        trackDateText = `${ymdhm[2]}日`;
                    } else if (trackDateType == 'dh') {
                        trackDateText = `${ymdhm[2]}日 ${Math.round(ymdhm[3]+ymdhm[4]/60)}時`;
                    } else if (trackDateType == 'dhi') {
                        trackDateText = `${ymdhm[2]}日 ${ymdhm[3]}:${ymdhm[4]}`;
                    } else if (trackDateType == 'hi') {
                        trackDateText = `${ymdhm[3]}:${ymdhm[4]}`;
                    }
                    ctx.fillText(trackDateText, x+5, y-5);
                }
            }
        }
    }

    function drawGrid() {
        let minAlt = Math.max(-90, Math.min(SHtoAh(rgEW, -rgNS)[1], cenAlt-rgNS));
        let maxAlt = Math.min( 90, Math.max(SHtoAh(rgEW,  rgNS)[1], cenAlt+rgNS));

        let altGridCalcIv = Math.min(rgEW, rgNS) / 20;
        let azmGridCalcIv = Math.min(altGridCalcIv / Math.max(cos(cenAlt*deg2rad), 0.1), 8);
        let gridIvChoices = [0.5, 1, 2, 5, 10, 30, 45];
        ctx.strokeStyle = 'gray';

        let altGridIv = 45;
        for (i=0; i<gridIvChoices.length; i++) {
            if (gridIvChoices[i] > Math.min(rgNS, rgEW) / 3) {
                altGridIv = gridIvChoices[i];
                break;
            }
        }
        let azmGridIv = 45;
        for (i=0; i<gridIvChoices.length; i++) {
            if (gridIvChoices[i] > altGridIv / cos(cenAlt*deg2rad)) {
                azmGridIv = gridIvChoices[i];
                break;
            }
        }

        let A, h, scrRA0, scrDec0, scrRA1, scrDec1
        if (maxAlt == 90) {
            for (i=Math.floor(minAlt/altGridIv); i<Math.ceil(90/altGridIv); i++) {
                h = i * altGridIv;
                if (h == 0) {
                    ctx.lineWidth = 3;
                } else {
                    ctx.lineWidth = 1;
                }
                ctx.beginPath();
                for (j=0; j<360/azmGridCalcIv+1; j++) {
                    A = j * azmGridCalcIv;
                    [scrRA0, scrDec0] = drawAzmAltLine (A, h, scrRA0, scrDec0);
                }
                ctx.stroke();
            }
            ctx.lineWidth = 1;
            for (i=0; i<Math.ceil(360/azmGridIv); i++) {
                A = i * azmGridIv;
                for (j=0; j<Math.ceil(90/altGridCalcIv)-Math.floor(minAlt/altGridCalcIv)+1; j++) {
                    h = (Math.floor(minAlt/altGridCalcIv) + j) * altGridCalcIv;
                    [scrRA0, scrDec0] = drawAzmAltLine (A, h, scrRA0, scrDec0);
                }
                ctx.stroke();
            }
        } else if (minAlt == -90) {
            for (i=Math.floor(-90/altGridIv); i<Math.ceil(maxAlt/altGridIv); i++) {
                h = i * altGridIv;
                if (h == 0) {
                    ctx.lineWidth = 3;
                } else {
                    ctx.lineWidth = 1;
                }
                ctx.beginPath();
                for (j=0; j<360/azmGridCalcIv+1; j++) {
                    A = j * azmGridCalcIv;
                    [scrRA0, scrDec0] = drawAzmAltLine (A, h, scrRA0, scrDec0);
                }
                ctx.stroke();
            }
            ctx.lineWidth = 1;
            for (i=0; i<Math.ceil(360/azmGridIv); i++) {
                A = i * azmGridIv;
                for (j=0; j<Math.ceil((maxAlt+90)/altGridCalcIv)+1; j++) {
                    h = -90 + j * altGridCalcIv;
                    [scrRA0, scrDec0] = drawAzmAltLine (A, h, scrRA0, scrDec0);
                }
                ctx.stroke();
            }
        } else {
            let azmRange = Math.max((SHtoAh(-rgEW,  rgNS)[0] - cenAzm + 360) % 360,
                                    (SHtoAh(-rgEW,     0)[0] - cenAzm + 360) % 360,
                                    (SHtoAh(-rgEW, -rgNS)[0] - cenAzm + 360) % 360);

            for (i=Math.floor(minAlt/altGridIv); i<Math.ceil(maxAlt/altGridIv); i++) {
                h = i * altGridIv;
                if (h == 0) {
                    ctx.lineWidth = 3;
                } else {
                    ctx.lineWidth = 1;
                }
                ctx.beginPath();
                for (j=0; j<2*azmRange/azmGridCalcIv+1; j++) {
                    A = cenAzm - azmRange + j * azmGridCalcIv;
                    [scrRA0, scrDec0] = drawAzmAltLine (A, h, scrRA0, scrDec0);
                }
                ctx.stroke();
            }
            ctx.lineWidth = 1;
            if (cenAzm - azmRange < 0) {
                for (i=0; i<Math.ceil((cenAzm+azmRange)/azmGridIv); i++) {
                    A = i * azmGridIv;
                    for (j=0; j<Math.ceil(maxAlt/altGridCalcIv)-Math.floor(minAlt/altGridCalcIv)+1; j++) {
                        h = (Math.floor(minAlt/altGridCalcIv) + j) * altGridCalcIv;
                        [scrRA0, scrDec0] = drawAzmAltLine (A, h, scrRA0, scrDec0);
                    }
                    ctx.stroke();
                }
                for (i=Math.floor((cenAzm-azmRange+360)/azmGridIv); i<Math.ceil(360/azmGridIv); i++) {
                    A = i * azmGridIv;
                    for (j=0; j<Math.ceil(maxAlt/altGridCalcIv)-Math.floor(minAlt/altGridCalcIv)+1; j++) {
                        h = (Math.floor(minAlt/altGridCalcIv) + j) * altGridCalcIv;
                        [scrRA0, scrDec0] = drawAzmAltLine (A, h, scrRA0, scrDec0);
                    }
                    ctx.stroke();
                }
            } else if (cenAzm + azmRange > 360) {
                for (i=0; i<Math.ceil((cenAzm+azmRange)/azmGridIv); i++) {
                    A = i * azmGridIv;
                    for (j=0; j<Math.ceil(maxAlt/altGridCalcIv)-Math.floor(minAlt/altGridCalcIv)+1; j++) {
                        h = (Math.floor(minAlt/altGridCalcIv) + j) * altGridCalcIv;
                        [scrRA0, scrDec0] = drawAzmAltLine (A, h, scrRA0, scrDec0);
                    }
                    ctx.stroke();
                }
                for (i=Math.floor((cenAzm-azmRange)/azmGridIv); i<Math.ceil(360/azmGridIv); i++) {
                    A = i * azmGridIv;
                    for (j=0; j<Math.ceil(maxAlt/altGridCalcIv)-Math.floor(minAlt/altGridCalcIv)+1; j++) {
                        h = (Math.floor(minAlt/altGridCalcIv) + j) * altGridCalcIv;
                        [scrRA0, scrDec0] = drawAzmAltLine (A, h, scrRA0, scrDec0);
                    }
                    ctx.stroke();
                }
            } else {
                for (i=Math.floor((cenAzm-azmRange)/azmGridIv); i<Math.ceil((cenAzm+azmRange)/azmGridIv); i++) {
                    A = i * azmGridIv;
                    for (j=0; j<Math.ceil(maxAlt/altGridCalcIv)-Math.floor(minAlt/altGridCalcIv)+1; j++) {
                        h = (Math.floor(minAlt/altGridCalcIv) + j) * altGridCalcIv;
                        [scrRA0, scrDec0] = drawAzmAltLine (A, h, scrRA0, scrDec0);
                    }
                    ctx.stroke();
                }
            }
        }
        ctx.stroke();

        function drawAzmAltLine (A, h, scrRA0, scrDec0) {
            [scrRA1, scrDec1] = RADec2scrview(...Ah2RADec(A, h, theta));
            if (j>0 && ((Math.abs(scrRA0)<rgEW && Math.abs(scrDec0)<rgNS) || (Math.abs(scrRA1)<rgEW && Math.abs(scrDec1)<rgNS))) {
                let [x1, y1] = coordSH(scrRA0, scrDec0);
                let [x2, y2] = coordSH(scrRA1, scrDec1);
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
            }
            [scrRA0, scrDec0] = [scrRA1, scrDec1];
            return [scrRA0, scrDec0];
        }
    }

    function drawAov() {
        let aovs = [['85-cmos', 3.34, 2.27], ['128-cmos', 1.36, 0.91]];
        if (document.getElementById('aovCheck').checked && ['AEP', 'view'].includes(mode)) {
            let aovLabel = '';
            for (i=0; i<document.getElementsByName('aov').length; i++){
                if (document.getElementsByName('aov').item(i).checked){
                    aovLabel = document.getElementsByName('aov').item(i).value;
                }
            }
            for (let aov of aovs) {
                if (aovLabel == aov[0]) {
                    let aovRotation = aovSliderElem.value * deg2rad;
                    let w1 =  aov[1] * cos(aovRotation) + aov[2] * sin(aovRotation);
                    let w2 =  aov[1] * cos(aovRotation) - aov[2] * sin(aovRotation);
                    let h1 = -aov[1] * sin(aovRotation) + aov[2] * cos(aovRotation);
                    let h2 = -aov[1] * sin(aovRotation) - aov[2] * cos(aovRotation);
                    ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
                    ctx.strokeStyle = 'orange';
                    ctx.beginPath();
                    ctx.moveTo(canvas.width*(1.0-w1/2.0/rgEW)/2.0, canvas.height*(1.0-h1/2.0/rgNS)/2.0);
                    ctx.lineTo(canvas.width*(1.0+w2/2.0/rgEW)/2.0, canvas.height*(1.0+h2/2.0/rgNS)/2.0);
                    ctx.lineTo(canvas.width*(1.0+w1/2.0/rgEW)/2.0, canvas.height*(1.0+h1/2.0/rgNS)/2.0);
                    ctx.lineTo(canvas.width*(1.0-w2/2.0/rgEW)/2.0, canvas.height*(1.0-h2/2.0/rgNS)/2.0);
                    ctx.lineTo(canvas.width*(1.0-w1/2.0/rgEW)/2.0, canvas.height*(1.0-h1/2.0/rgNS)/2.0);
                    ctx.fill();
                    ctx.stroke();
                }
            }
        }
    }
}

// 基本関数

function sin(a){return Math.sin(a)}
function cos(a){return Math.cos(a)}

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

// 角度の単位変換

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

function radeg2hm(ra_deg) {
    let h = Math.floor(ra_deg / 15);
    let m = Math.round((ra_deg - 15 * Math.floor(ra_deg / 15)) * 40);
    if (m == 600) {
        m = 0.0;
        if (h == 23) {
            h = 0;
        } else {
            h += 1;
        }
    } else {
        m = m / 10;
    }
    return [h, m]
}

function decdeg2dm(dec_deg) {
    let d, m;
    if (dec_deg >= 0) {
        d = Math.floor(dec_deg);
        m = Math.round((dec_deg - d) * 60);
        if (m == 60) {
            m = 0;
            d += 1;
        }
    } else {
        d = Math.floor(-dec_deg);
        m = Math.round((-dec_deg - d) * 60);
        d *= -1;
        if (m == 60) {
            m = 0;
            d -= 1;
        }
    }
    return [d, m];
}

function siderealTime(JD_TT, lon_obs) {
    let t = (JD_TT - 2451545.0) / 36525;
    let ans = ((24110.54841 + 8640184.812866*t + 0.093104*t**2 - 0.0000062*t**3)/86400 % 1 + 1.00273781 * ((JD_TT-0.0008-2451544.5)%1)) * 2*pi + lon_obs - 0.0203; //rad
    // https://aa.usno.navy.mil/faq/GAST
    const JD_UT = JD_TT - 0.0008;
    const h = 24 * ((JD_UT + 0.5) % 1);
    const d_UT = JD_UT - h / 24 - 2451545.0;
    ans = ((6.697375 + (0.065707485828 * d_UT) % 24 + 1.0027379 * h + 0.0854103 * t + 0.0000258 * t*t) % 24) * 15 * deg2rad + lon_obs;
    return ans;
}

// 座標変換
function J2000toApparent(raJ2000, decJ2000, JD) {
    const t = (JD - 2451545.0) / 36525;
    let xyz = radecToXYZ(raJ2000, decJ2000, 1);
    const precession = 5029 / 3600 * t * deg2rad;
    xyz = Rx(Rz(Rx(xyz, -eps), precession), eps);
    const apparent = xyz_to_RADec(xyz[0], xyz[1], xyz[2]);
    return [apparent[0], apparent[1]]; //deg
}

function apparentToJ2000(raApp, decApp, JD) {
    const t = (JD - 2451545.0) / 36525;
    let xyz = radecToXYZ(raApp, decApp, 1);
    const precession = 5029 / 3600 * t * deg2rad;
    xyz = Rx(Rz(Rx(xyz, -eps), -precession), eps);
    const J2000 = xyz_to_RADec(xyz[0], xyz[1], xyz[2]);
    return [J2000[0], J2000[1]]; //deg
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

function screen2liveAh (scrRA, scrDec) {
    let scrTheta = Math.atan2(scrDec, -scrRA); //画面上で普通に極座標
    let r = Math.sqrt(scrRA*scrRA + scrDec*scrDec) * deg2rad;
    let [x, y, z] = Rz(Rx(Ry([sin(r)*cos(scrTheta), sin(r)*sin(scrTheta), -cos(r)], dev[2]), dev[1]), dev[0]);
    let h = Math.asin(z) * rad2deg;
    let A = ((Math.atan2(-y, x) * rad2deg + loadAzm + 90) % 360 + 360) % 360;
    return [A, h];
}

function xyz_to_RADec(x, y, z) { //deg
    let dist = Math.sqrt(x*x + y*y + z*z);
    let ra, dec;
    if (dist  < 0.00000001){
        ra = 0;
        dec = 200;
    } else {
        ra = (Math.atan2(y, x) * rad2deg + 360) % 360; //deg
        dec = Math.atan(z / Math.sqrt(x*x + y*y)) * rad2deg; //deg
    }
    return [ra, dec, dist];
}

function radecToXYZ(ra, dec, dist) { //deg
    let x = dist * cos(dec*deg2rad) * cos(ra*deg2rad);
    let y = dist * cos(dec*deg2rad) * sin(ra*deg2rad);
    let z = dist * sin(dec*deg2rad);
    return [x, y, z];
}

// 時間の変換 基本的にYMDHMはJST, JDはTT

function JD_to_YMDHM(JD) { //TT-->JST として変換　TT-->TTのときはJDに-0.3742しておく
    let jd = JD + 0.375 - 0.0008 + 1/2880; //最後の項はhh:mm:30~hh:(mm+1):00をhh:(mm+1)にするため
    let A = Math.floor(jd + 68569.5);
    let B = Math.floor(A / 36524.25);
    let C = A - Math.floor(36524.25 * B + 0.75);
    let E = Math.floor((C + 1) / 365.25025);
    let F = C - Math.floor(365.25 * E) + 31;
    let G = Math.floor(F / 30.59);
    let D = F - Math.floor(30.59 * G);
    let H = Math.floor(G / 11);
    let M = G - 12 * H + 2;
    let Y = 100 * (B - 49) + E + H;
    let Hr = Math.floor((jd + 0.5 - Math.floor(jd + 0.5)) * 24);
    let Mi = Math.floor((jd + 0.5 - Math.floor(jd + 0.5)) * 1440 - Hr * 60);
    if (M == 12 && D == 32) {
        Y += 1;
        M = 1;
        D = 1;
    }
    return [Y, M, D, Hr, Mi];
}

function YMDHM_to_JD(Y, M, D, H, Mi){
    if (M <= 2) {
        M += 12;
        Y--;
    }
    let ans = Math.floor(365.25*Y) + Math.floor(Y/400) - Math.floor(Y/100) + Math.floor(30.59*(M-2)) + D + H/24 + Mi/1440 + 1721088.5 + 0.0008 - 0.375;
    return ans;
}


function determinMagLim(a, b) {
    let magLim = Math.min(Math.max(a - b * Math.log(Math.min(rgEW, rgNS)), 5), magLimLim);
    magLimtext = `~${magLim.toFixed(1)}等級`;
    return magLim;
}

function determinZerosize() {
    return 13 - 2.4 * Math.log(Math.min(rgEW, rgNS) + 3);
}

// 入力や変数をもとにURLとlocalStorageを修正し、観測地についての変数を設定し、showingDataを設定し、showingJDを計算する
function newSetting() {
    ObsPlanet = document.getElementById("observer").value;
    Obs_num = JPNplanets.indexOf(ObsPlanet);

    // 視点
    if (ObsPlanet == '地球') {
        if (loaded.includes("additional_objects") && url.searchParams.has('observer')) {
            url.searchParams.delete('observer');
            localStorage.setItem('observer_planet', 'Earth');
        }
    } else {
        url.searchParams.set('observer', ENGplanets[Obs_num].split(' ').join('').split('/').join(''));
        localStorage.setItem('observer_planet', ENGplanets[Obs_num].split(' ').join('').split('/').join(''));
    }

    for (let i=0; i<zuhoElem.length; i++) {
        if (zuhoElem[i].checked) {
            mode = zuhoElem[i].value;
            setUrlAndLocalStorage('mode', mode);
            break;
        }
    }
    turnOnOffLiveMode(mode);

    setUrlAndLocalStorage('magkey', document.getElementById('magLimitSlider').value);
    if (['live', 'ar'].includes(mode)) {
        magLimLim = 6.5;
    } else {
        magLimLim = 11.5;
    }
    magLim = determinMagLim(magkey1, magkey2);
    zerosize = determinZerosize();

    if (document.getElementById("NSCombo").value == '北緯') {
        lat_obs = document.getElementById('lat').value * deg2rad;
        lattext = document.getElementById('lat').value + "°N";
        if (document.getElementById('lat').value == '35') {
            if (url.searchParams.has('lat')) {
                url.searchParams.delete('lat');
            }
            localStorage.setItem('lat', '35');
        } else {
            setUrlAndLocalStorage('lat', document.getElementById('lat').value);
        }
    } else {
        lat_obs = -document.getElementById('lat').value * deg2rad;
        lattext = document.getElementById('lat').value + "°S";
        setUrlAndLocalStorage('lat', -document.getElementById('lat').value);
    }

    if (document.getElementById("EWCombo").value == '東経') {
        lon_obs = document.getElementById('lon').value * deg2rad;
        lontext = document.getElementById('lon').value + "°E";
        if (document.getElementById('lon').value == '135') {
            if (url.searchParams.has('lon')) {
                url.searchParams.delete('lon');
            }
            localStorage.setItem('lon', '135');
        } else {
            setUrlAndLocalStorage('lon', document.getElementById('lon').value);
        }
    } else {
        lon_obs = -document.getElementById('lon').value * deg2rad;
        lontext = document.getElementById('lon').value + "°W";
        setUrlAndLocalStorage('lon', -document.getElementById('lon').value);
    }

    localStorage.setItem('observationSite', document.getElementById('observation-site-select').value);

    setRealtime(); //timeのURL, localStorageもやる
    timeSliderElem.value = 0;
    timeSliderValue = 0;

    //history.replaceState('', '', url.href);

    calculation(showingJD);
}

function setUrlAndLocalStorage(key, value) {
    url.searchParams.set(key, value);
    localStorage.setItem(key, value);
}

// リアルタイム
function setRealtime() {
    let ymdhm = new Date();
    document.getElementById('showingData').style.color = textColor;
    let realtimeelemValue = realtimeElem.value;
    if (realtimeelemValue == 'オフ') {
        timeSliderElem.style.visibility = 'visible';
        let y = parseInt(yearTextElem.value);
        let m = parseInt(monthTextElem.value);
        let d = parseInt(dateTextElem.value);
        let h = parseInt(hourTextElem.value);
        let mi = parseFloat(minuteTextElem.value);
        document.getElementById('showingData').innerHTML = `${y}/${m}/${d} ${h}:${mi.toString().padStart(2, '0')} (JST) ${lattext} ${lontext}`;
        showingJD = YMDHM_to_JD(y, m, d, h, mi);
        if (intervalId !== null) {
            clearInterval(intervalId);
            intervalId = null;
        }
        setUrlAndLocalStorage('time', `${y}-${m}-${d}-${h}-${mi}`);
        localStorage.setItem('realtime', 'off');
    } else if (realtimeelemValue == '赤道座標固定') {
        timeSliderElem.style.visibility = 'hidden';
        let [y, m, d, h, mi] = [ymdhm.getFullYear(), ymdhm.getMonth()+1, ymdhm.getDate(), ymdhm.getHours(), parseFloat((ymdhm.getMinutes()+ymdhm.getSeconds()/60).toFixed(1))];
        document.getElementById('showingData').innerHTML = `${y}/${m}/${d} ${h}:${mi.toString().padStart(2, '0')} (JST) ${lattext} ${lontext}`;
        showingJD = YMDHM_to_JD(y, m, d, h, mi);
        if (intervalId !== null) {
            clearInterval(intervalId);
            intervalId = null;
        }
        intervalId = setInterval(realtimeRadec, 500);
        setYMDHM(y, m, d, h, mi);
        setUrlAndLocalStorage('time', `${y}-${m}-${d}-${h}-${mi}`);
        localStorage.setItem('realtime', 'radec');
    } else if (realtimeelemValue == '高度方位固定') {
        timeSliderElem.style.visibility = 'hidden';
        let [y, m, d, h, mi] = [ymdhm.getFullYear(), ymdhm.getMonth()+1, ymdhm.getDate(), ymdhm.getHours(), parseFloat((ymdhm.getMinutes()+ymdhm.getSeconds()/60).toFixed(1))];
        document.getElementById('showingData').innerHTML = `${y}/${m}/${d} ${h}:${mi.toString().padStart(2, '0')} (JST) ${lattext} ${lontext}`;
        showingJD = YMDHM_to_JD(y, m, d, h, mi);
        if (intervalId !== null) {
            clearInterval(intervalId);
            intervalId = null;
        }
        intervalId = setInterval(realtimeAzmalt, 500);
        setYMDHM(y, m, d, h, mi);
        setUrlAndLocalStorage('time', `${y}-${m}-${d}-${h}-${mi}`);
        localStorage.setItem('realtime', 'azmalt');
    }
    history.replaceState('', '', url.href);
}

function realtimeOff() {
    realtimeElem.value = 'オフ';
    timeSliderElem.style.visibility = 'visible';
    let y = parseInt(yearTextElem.value);
    let m = parseInt(monthTextElem.value);
    let d = parseInt(dateTextElem.value);
    let h = parseInt(hourTextElem.value);
    let mi = parseFloat(minuteTextElem.value);
    document.getElementById('showingData').innerHTML = `${y}/${m}/${d} ${h}:${mi.toString().padStart(2, '0')} (JST) ${lattext} ${lontext}`;
    showingJD = YMDHM_to_JD(y, m, d, h, mi);
    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }
    setUrlAndLocalStorage('time', `${y}-${m}-${d}-${h}-${mi}`);
    localStorage.setItem('realtime', 'off');
}

function realtimeRadec() {
    let ymdhm = new Date();
    if (ymdhm.getSeconds() % 6 == 0 && ymdhm.getMilliseconds() < 500) {
        let [y, m, d, h, mi] = [ymdhm.getFullYear(), ymdhm.getMonth()+1, ymdhm.getDate(), ymdhm.getHours(), (ymdhm.getMinutes()+ymdhm.getSeconds()/60).toFixed(1)];
        document.getElementById('showingData').style.color = textColor;
        document.getElementById('showingData').innerHTML = `${y}/${m}/${d} ${h}:${mi.padStart(2, '0')} (JST) ${lattext} ${lontext}`;
        setUrlAndLocalStorage('time', `${y}-${m}-${d}-${h}-${mi}`);
        localStorage.setItem('realtime', 'radec');
        history.replaceState('', '', url.href);
        setYMDHM(y, m, d, h, mi);
        showingJD = YMDHM_to_JD(y, m, d, h, mi);
        calculation(showingJD);
        [cenAzm, cenAlt] = RADec2Ah(cenRA, cenDec, siderealTime(showingJD, lon_obs));
        show_main();
    }
}

function realtimeAzmalt() {
    let ymdhm = new Date();
    if (ymdhm.getSeconds() % 6 == 0 && ymdhm.getMilliseconds() < 500) {
        let [y, m, d, h, mi] = [ymdhm.getFullYear(), ymdhm.getMonth()+1, ymdhm.getDate(), ymdhm.getHours(), (ymdhm.getMinutes()+ymdhm.getSeconds()/60).toFixed(1)];
        document.getElementById('showingData').style.color = textColor;
        document.getElementById('showingData').innerHTML = `${y}/${m}/${d} ${h}:${mi.padStart(2, '0')} (JST) ${lattext} ${lontext}`;
        setUrlAndLocalStorage('time', `${y}-${m}-${d}-${h}-${mi}`);
        localStorage.setItem('realtime', 'azmalt');
        history.replaceState('', '', url.href);
        setYMDHM(y, m, d, h, mi);
        showingJD = YMDHM_to_JD(y, m, d, h, mi);
        calculation(showingJD);
        [cenRA, cenDec] = Ah2RADec(cenAzm, cenAlt, siderealTime(showingJD, lon_obs));
        show_main();
    }
}

function filterData(data, ranges) {
    return data.filter(row => {
        const ra = +row[0];
        if (ra >= ranges.raRange[0] && ra <= ranges.raRange[1]) {
            const dec = +row[1];
            if(dec >= ranges.decRange[0] && dec <= ranges.decRange[1]) {
                const mag = +row[2];
                if (mag >= ranges.magRange[0] && mag <= ranges.magRange[1]) {
                    return true;
                }
                return false;
            }
            return false;
        }
        return false;
    });
}


async function loadFiles() {
    // 決めるもの
    // hips
    // BSCRAary, BSCDecary, FSs, Bayers, BayerNums
    // ENGplanets, JPNplanets, planets, document.getElementById('observer')
    // hip_65, constellations, ...

    async function xhrHIP(data) {
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
    async function xhrBSC(data) {
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

    //追加天体
    async function xhrExtra(data) {
        const extra = data.split('\n');
        for (let i=0; i<extra.length; i++) {
            if (extra[i].length == 0) {
                break;
            }
            let extraLine = extra[i].split(' ');
            let name = extraLine[1];
            let shortName = name;
            for (let j=2; j<parseInt(extraLine[0])+1; j++) {
                if (extraLine[j][0] != '(') {
                    name += ' ' + extraLine[j];
                } else {
                    break;
                }
            }
            for (let j=2; j<parseInt(extraLine[0])+1; j++) {
                name += ' ' + extraLine[j];
            }
            ENGplanets.push(name);
            JPNplanets.push(name);

            let New;
            if (online && isElectron) {
                try {
                    const result = await window.electronAPI.fetchAsteroidData(shortName);
                    if (data.includes('code')) {
                        offlineAdd();
                    } else if (result.object) {
                        const elements = data.orbit.elements;
                        const e = +elements[0].value;
                        let epoch;
                        if (e <= 0.99) {
                            epoch = data.orbit.epoch;
                        } else {
                            epoch = elements[7].epoch;
                        }
                        const [y, m, d, h] = JD_to_YMDHM(epoch-0.3742);
                        let elems;
                        if (e <= 0.999) {
                            const a = +elements[1].value;
                            const peri = +elements[5].value;
                            const incl = +elements[3].value;
                            const node = +elements[4].value;
                            const m0 = +elements[6].value;
                            if (data.phys_par != null) {
                                let G = 0.15;
                                let H = 0;
                                H_flag = false;
                                for (let par of data.phys_par) {
                                    if (par.name == 'H') {
                                        H = par.value;
                                        H_flag = true;
                                    } else if (par.name == 'G') {
                                        G = par.value;
                                    }
                                }
                                if (H_flag) {
                                    elems = [a, e, peri, incl, node, m0, H, G];
                                } else {
                                    elems = [a, e, peri, incl, node, m0, 0, 100];
                                }
                            } else {
                                elems = [a, e, peri, incl, node, m0, 0, 100];
                            }
                        } else {
                            const q = +elements[2].value;
                            const peri = +elements[5].value;
                            const incl = +elements[3].value;
                            const node = +elements[4].value;
                            elems = [q, e, peri, incl, node, 0, 0, 100];
                        }
                        New = [epoch, elem[0], elem[1], elem[2], elem[3], elem[4], elem[5], 0, 0, 0, 0, 0, elem[6], elem[7], y, m, d, h];
                    } else {
                        offlineAdd();
                    }
                } catch (error) {
                    offlineAdd();
                }
            } else {
                offlineAdd();
            }
            function offlineAdd() {
                New = [];
                for (let j=parseInt(extraLine[0])+1; j<extraLine.length-4; j++) {
                    New.push(parseFloat(extraLine[j]));
                }
            }
            planets.push(New);

            const option1 = document.createElement('option');
            option1.innerHTML = name;
            document.getElementById('observer').appendChild(option1);
        }

        if (url.searchParams.has('observer')) {
            for (let j=0; j<ENGplanets.length; j++) {
                if (url.searchParams.get('observer') == ENGplanets[j].split(' ').join('').split('/').join('')) {
                    document.getElementById("observer").value = JPNplanets[j];
                    break;
                }
            }
            defaultcheck++;
            show_initial();
        } else if (localStorage.getItem('observer_planet') != null && localStorage.getItem('observer_planet') != 'Earth') {
            for (let j=0; j<ENGplanets.length; j++) {
                if (localStorage.getItem('observer_planet') == ENGplanets[j].split(' ').join('').split('/').join('')) {
                    document.getElementById("observer").value = JPNplanets[j];
                    break;
                }
            }
            defaultcheck++;
            show_initial();
        } else {
            defaultcheck++;
            show_initial();
        }
    }
    if (online) {
        const t0 = performance.now();
        async function loadFile(filename, func, impflag=false) {
            try {
                const url_load = `https://peteworden.github.io/Soleil/data/${filename}.txt`;
                const response = await fetch(url_load);
                if (!response.ok) {
                    throw new Error(`Failed to load ${filename}: ${response.statusText}`);
                }
                const data = await response.text();
                func(data);
                xhrcheck++;
                if (impflag) xhrimpcheck++;
                loaded.push(filename);
                console.log(`${xhrcheck} ${defaultcheck} ${filename}.txt ${impflag}`);
                console.log(performance.now() - t0);
                show_initial();
            } catch (error) {
                console.error(`Error loading file ${filename}:`, error);
            }
        }

        async function loadJsonData(filename, func, impflag=false) {
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
                console.log(`${xhrcheck} ${defaultcheck} ${filename}.json ${impflag}`);
                console.log(performance.now() - t0);
                show_initial();
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });
        }
        
        async function loadCsvData(filename, func, impflag=false) {
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
                console.log(`${xhrcheck} ${defaultcheck} ${filename}.csv ${impflag}`);
                console.log(performance.now() - t0);
                show_initial();
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });
        }

        async function loadGaiaBinData(filename, impflag=false) {
            const response = await fetch(`https://peteworden.github.io/Soleil/data/gaia_${filename}.bin`);
            const buffer = await response.arrayBuffer();
            const view = new DataView(buffer);
            let index = 0;
            const bufferByteLength = buffer.byteLength;
            for (let i = 0; i < bufferByteLength; i += 6) {
                const ra = (view.getUint8(i) << 16) | (view.getUint8(i + 1) << 8) | view.getUint8(i + 2);
                const decMag = (view.getUint8(i + 3) << 16) | (view.getUint8(i + 4) << 8) | view.getUint8(i + 5);
                const decPart = Math.floor(decMag / 10);
                const dec = decPart - 90000;
                if (filename == '101-110') {
                    const mag = decMag - 10 * decPart + 101;
                    gaia101_110[index] = [ra, dec, mag];
                } else if (filename == '111-115') {
                    const mag = decMag - 10 * decPart + 111;
                    gaia111_115[index] = [ra, dec, mag];
                }
                index++;
            }
            xhrcheck++;
            if (impflag) xhrimpcheck++;
            loaded.push(filename)
            console.log(`${xhrcheck} ${defaultcheck} ${filename}.bin ${impflag}`);
            console.log(performance.now() - t0);
            show_initial();
        }
        async function loadConstellationBoundariesBinData(filename='constellation_boundaries', impflag=false) {
            const response = await fetch(`https://peteworden.github.io/Soleil/data/${filename}.bin`);
            const buffer = await response.arrayBuffer();
            const view = new DataView(buffer);
            const bufferByteLength = buffer.byteLength;
            boundary = Array(Math.floor(bufferByteLength/12));
            let index = 0;
            for (let i = 0; i < bufferByteLength; i += 12) {
                const ra1 = (view.getUint8(i) << 16) | (view.getUint8(i + 1) << 8) | view.getUint8(i + 2);
                const dec1 = ((view.getUint8(i + 3) << 13) | (view.getUint8(i + 4) << 5) | (view.getUint8(i + 5) >> 3)) - 90000;
                const ra2 = (view.getUint8(i + 6) << 16) | (view.getUint8(i + 7) << 8) | view.getUint8(i + 8);
                const dec2 = ((view.getUint8(i + 9) << 12) | (view.getUint8(i + 10) << 4) | (view.getUint8(i + 11) >> 4)) - 90000;
                const num = (view.getUint8(i + 5) & 0x07) + (view.getUint8(i + 11) & 0x0F) * 8;
                boundary[index] = { num, ra1, dec1, ra2, dec2};
                index++;
            }
            xhrcheck++;
            if (impflag) xhrimpcheck++;
            loaded.push(filename)
            console.log(`${xhrcheck} ${defaultcheck} ${filename}.bin ${impflag}`);
            console.log(performance.now() - t0);
            show_initial();
        }

        // デバッグ用。テキストファイル専用。getfileに関連するjsの2行をコメントアウトする。
        // 公開時コメントアウトの解除を忘れないように！
        // 例
        // document.getElementById('getFile').addEventListener('change', function(event) {
        //     loadFileForDebug(event, 'localhip', xhrHIP, true)
        // })
        async function loadFileForDebug(event, filename, func, impflag=false) {
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
        async function loadCSVForDebug(event, filename,func, impflag=false) {
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
        await loadFile("hip_65", xhrHIP, true);

        await loadJsonData('constellation', (data) => {
            constellations = data;
        }, true);

        //星座境界線
        // await loadFile("constellation_boundaries", (data) => {
        //     boundary = data.split(',').map(Number);
        // }, true);
        await loadConstellationBoundariesBinData('constellation_boundaries', true);
        
        //追加天体
        await loadFile("additional_objects", xhrExtra);

        await loadJsonData('messier', (data) => {
            messier = data;
        });

        await loadJsonData('rec', (data) => {
            recs = data;
        });

        //gaia offlineはまだ
        await loadCsvData('gaia_-100', (data) => {
            gaia100 = data;
        });
        await loadFile("gaia_-100_helper", (data) => {
            gaia100_help = data.split(',').map(Number);
        });

        await loadJsonData('starnames', (data) => {
            starNames = data;
        });

        await loadGaiaBinData("101-110");
        // await loadCsvData('gaia_101-110', (data) => {
        //     gaia101_110 = data;
        // });
        await loadFile("gaia_101-110_helper", (data) => {
            gaia101_110_help = data.split(',').map(Number);
        });
        // await loadCsvData('gaia_111-115', (data) => {
        //     gaia111_115 = data;
        // });
        await loadGaiaBinData("111-115");
        await loadFile("gaia_111-115_helper", (data) => {
            gaia111_115_help = data.split(',').map(Number);
        });

        await loadGaiaBinData("111-115");
        await loadFile("gaia_111-115_helper", (data) => {
            gaia111_115_help = data.split(',').map(Number);
        });

        //Bayer
        await loadFile("brights", xhrBSC);

        // NGC天体とIC天体
        await loadFile("ngc", (data) => {
            NGC = data.split(',');
        });
    } else {
        document.getElementById('getFile').addEventListener('change', function () {
            let fr = new FileReader();
            fr.onload = function () {
                const content = fr.result.split('||||');
                for (let i=0; i<13; i++) {
                    fn = content[i].split('::::')[0];
                    let data = content[i].split('::::')[1];
                    if (fn == 'hip_65') {xhrHIP(data); xhrimpcheck++;}
                    // if (fn === 'tycho2_100') Tycho = data.split(',').map(Number);
                    // if (fn == 'tycho2_100_helper') Help = data.split(',').map(Number);
                    // if (fn == 'tycho2_100-110_helper') Tycho1011 = data.split(',').map(Number);
                    // if (fn == 'tycho2_100-110_helper') Help1011 = data.split(',').map(Number);
                    if (fn == 'brights') xhrBSC(data);
                    if (fn == 'starname') {starNames = JSON.parse(data); xhrimpcheck++;}
                    if (fn == 'messier') {messier = JSON.parse(data); xhrimpcheck++;}
                    if (fn == 'rec') recs = JSON.parse(data);
                    if (fn == 'ngc') NGC = data.split(',');
                    if (fn == 'constellation') {constellations = JSON.parse(data); xhrimpcheck++;}
                    if (fn == 'constellation_boundaries') {boundary = data.split(',').map(Number); xhrimpcheck++;}
                    if (fn == 'additional_objects') xhrExtra(data);
                    xhrcheck++;
                    show_initial();
                }
            }
            fr.readAsText(this.files[0]);
        });
    }
}


function checkURL() {
    //URLのクエリパラメータを調べ、変数に代入し、HTMLのinputの値を書き換える
    //優先順位はURL>localStorage>default
    //checkURL->show_initial->newSetting<-ここで一部の変数の内容をURLとlocalStorageに書き込むので、それらはcheckURLでurlやlocalStorageまで書き換える必要はない。
    //ra, dec, azm, altはここで書き換える必要あり。
    if (url.searchParams.has('RA') && !isNaN(url.searchParams.get('RA'))) {
        cenRA = +url.searchParams.get('RA');
        localStorage.setItem('RA', cenRA);
        defaultcheck++;
        show_initial();
    } else if (localStorage.getItem('RA') != null && !isNaN(localStorage.getItem('RA'))) {
        cenRA = +localStorage.getItem('RA');
        url.searchParams.set('RA', cenRA);
        defaultcheck++;
        show_initial();
    } else {
        setUrlAndLocalStorage('RA', cenRA);
        defaultcheck++;
        show_initial();
    }

    if (url.searchParams.has('Dec') && !isNaN(url.searchParams.get('Dec'))) {
        cenDec = +url.searchParams.get('Dec');
        localStorage.setItem('Dec', cenDec);
        defaultcheck++;
        show_initial();
    } else if (localStorage.getItem('Dec') != null && !isNaN(localStorage.getItem('Dec'))) {
        cenDec = +localStorage.getItem('Dec');
        url.searchParams.set('Dec', cenDec);
        defaultcheck++;
        show_initial();
    } else {
        setUrlAndLocalStorage('Dec', cenDec);
        defaultcheck++;
        show_initial();
    }

    if (url.searchParams.has('azm') && !isNaN(url.searchParams.get('azm'))) {
        cenAzm = +url.searchParams.get('azm');
        localStorage.setItem('azm', cenAzm);
        defaultcheck++;
        show_initial();
    } else if (localStorage.getItem('azm') != null && !isNaN(localStorage.getItem('azm'))) {
        cenAzm = +localStorage.getItem('azm');
        url.searchParams.set('azm', cenAzm);
        defaultcheck++;
        show_initial();
    } else {
        setUrlAndLocalStorage('azm', cenAzm);
        defaultcheck++;
        show_initial();
    }

    if (url.searchParams.has('alt') && !isNaN(url.searchParams.get('alt'))) {
        cenAlt = +url.searchParams.get('alt');
        localStorage.setItem('alt', cenAlt);
        defaultcheck++;
        show_initial();
    } else if (localStorage.getItem('alt') != null && !isNaN(localStorage.getItem('alt'))) {
        cenAlt = +localStorage.getItem('alt');
        url.searchParams.set('alt', cenAlt);
        defaultcheck++;
        show_initial();
    } else {
        setUrlAndLocalStorage('alt', cenAlt);
        defaultcheck++;
        show_initial();
    }

    if (url.searchParams.has('time')) {
        let [y, m, d, h, mi] = url.searchParams.get('time').split('-');
        setYMDHM(y, m, d, h, mi);
        showingJD = YMDHM_to_JD(y, m, d, h, mi);
        realtimeOff();
        defaultcheck++;
        show_initial();
    } else if (localStorage.getItem('realtime') != null) {
        if (localStorage.getItem('realtime') == 'radec') {
            realtimeElem.value = '赤道座標固定';
        } else if (localStorage.getItem('realtime') == 'off') {
            realtimeElem.value = 'オフ';
        }
        defaultcheck++;
        show_initial();
    } else {
        now();
        // now()の中身は以下
        // let ymdhm = new Date();
        // let [y, m, d, h, mi] = [ymdhm.getFullYear(), ymdhm.getMonth()+1, ymdhm.getDate(), ymdhm.getHours(), ymdhm.getMinutes()];
        // setYMDHM(y, m, d, h, mi);
        // showingJD = YMDHM_to_JD(y, m, d, h, mi);
        defaultcheck++;
        show_initial();
    }

    if (url.searchParams.has('mode') && ['AEP', 'EtP', 'view', 'live', 'ar'].includes(url.searchParams.get('mode'))) {
        mode = url.searchParams.get('mode');
        for (let i=0; i<zuhoElem.length; i++) {
            if (zuhoElem[i].value == mode) {
                zuhoElem[i].checked = true;
                break;
            }
        }
        turnOnOffLiveMode(mode);
        defaultcheck++;
        show_initial();
    } else {
        for (let i=0; i<zuhoElem.length; i++) {
            if (zuhoElem[i].checked) {
                mode = zuhoElem[i].value;
                url.searchParams.set('mode', mode);
            }
        }
        turnOnOffLiveMode(mode);
        defaultcheck++;
        show_initial();
    }

    if (url.searchParams.has('area') && !isNaN(url.searchParams.get('area'))) {
        rgEW = parseFloat(url.searchParams.get('area')) / 2.0;
        rgNS = rgEW * canvas.height / canvas.width;
        rgtext = `左右:${(rgEW * 2).toFixed(1)}°`;
        if (['live', 'ar'].includes(mode)) {
            magLimLim = 6.5;
        } else {
            magLimLim = 11.5;
        }
        magLim = determinMagLim(magkey1, magkey2);
        zerosize = determinZerosize();
        defaultcheck++;
        show_initial();
    } else {
        url.searchParams.set('area', (2*rgEW).toFixed(2));
        defaultcheck++;
        show_initial();
    }

    if (url.searchParams.has('magkey') && !isNaN(url.searchParams.get('magkey'))) {
        magkey1 = parseFloat(url.searchParams.get('magkey'));
        document.getElementById('magLimitSlider').value = magkey1;
        magLim = determinMagLim(magkey1, magkey2);
        zerosize = determinZerosize();
        defaultcheck++;
        show_initial();
    } else {
        defaultcheck++;
        show_initial();
    }

    if ((url.searchParams.has('lat') && !isNaN(url.searchParams.get('lat'))) || (url.searchParams.has('lon') && !isNaN(url.searchParams.get('lon')))) {
        setObservationSite(+url.searchParams.get('lat'), +url.searchParams.get('lon'));
        if (+url.searchParams.get('lat') != null && +url.searchParams.get('lon') != null) {
            for (let observationSite in observationSites) {
                if (observationSites[observationSite][0] = +url.searchParams.get('lat'), +url.searchParams.get('lon') && observationSites[observationSite][1] == +url.searchParams.get('lon')) {
                    document.getElementById('observation-site-select').value = observationSite;
                    break;
                }
            }
        }
        defaultcheck += 2;
        show_initial();
    } else if (localStorage.getItem('observationSite') != null && observationSites[localStorage.getItem('observationSite')] != null) {
        const observationSite = localStorage.getItem('observationSite');
        setObservationSite(...observationSites[observationSite]);
        document.getElementById('observation-site-select').value = observationSite;
        defaultcheck += 2;
        show_initial();
    } else {
        setObservationSite(+localStorage.getItem('lat'), +localStorage.getItem('lon'));
        defaultcheck += 2;
        show_initial();
    }

    if (localStorage.getItem('lastVisit') != null) {
        lastVisitDate = new Date(localStorage.getItem('lastVisit'));
        const currentDate = new Date();
        localStorage.setItem('lastVisit', currentDate.toISOString());
    } else {
        lastVisitDate = new Date();
        localStorage.setItem('lastVisit', lastVisitDate.toISOString());
        let month = lastVisitDate.getMonth();
        if (month === 0) {
            lastVisitDate.setFullYear(lastVisitDate.getFullYear() - 1);
            lastVisitDate.setMonth(11);
        } else {
            lastVisitDate.setMonth(month - 1);
        }
    }
    showNews(lastVisitDate);
}

// デバイスの向きに応じた表示

function turnOnOffLiveMode (mode) {
    if (['live', 'ar'].includes(mode)) {
        if (os == 'iphone') {
            window.addEventListener("deviceorientation", deviceOrientation, true);
        } else if (os == "android") {
            window.addEventListener("deviceorientationabsolute", deviceOrientation, true);
        }
    } else {
        if (os == 'iphone') {
            window.removeEventListener("deviceorientation", deviceOrientation, true);
        } else if (os == "android") {
            window.removeEventListener("deviceorientationabsolute", deviceOrientation, true);
        }
    }
    if (mode == 'ar' && !videoOn) {
        skycolor = "rgba(" + [0, 0, 1, 0.1] + ")";
        let constraints = { audio: false, video: { facingMode: "environment" } };
        navigator.mediaDevices.getUserMedia(constraints)
        .then(
            function(stream) {
                let video = document.getElementById('arVideo');
                video.srcObject = stream;
                video.onloadedmetadata = function(e) {
                    video.play();
                };
                document.body.appendChild(video);
                setPicsFor360();
            }
        )
        videoOn = true;
    } else if (mode != 'ar' && videoOn) {
        skycolor = '#001';
        let constraints = { audio: false, video: { facingMode: "environment" } };
        navigator.mediaDevices.getUserMedia( constraints )
        .then(
            function( stream ) {
                let video = document.getElementById('arVideo');
                video.srcObject = stream;
                video.onloadedmetadata = function( e ) {
                    stream.getVideoTracks()[0].stop();
                };
            }
        )
        videoOn = false;
    }
}

function deviceOrientation(event) {
    if (os == 'iphone' && loadAzm == 0) {
        loadAzm = event.webkitCompassHeading;
    }
    let orientationTime2 = Date.now();
    if (orientationTime2 - orientationTime1 > 100) {
        orientationTime1 = orientationTime2;
        let eventAngle = [event.alpha, event.beta, event.gamma];
        let devArray = [[], [], []];
        if (Math.max(Math.abs(dev[0]-eventAngle[0]), Math.abs(dev[1]-eventAngle[1]), Math.abs(dev[2]-eventAngle[2])) < 10) {
            if (devArray[0].length > 2) {
                devArray = devArray.map((val, index) => val.unshift(eventAngle[index]*deg2rad));
                moving = (Math.abs(devArray[0].reduce((acc, val) => acc + val, 0) / 3 - dev[0]) > 0.2);
                dev = devArray.map(arr => arr.reduce((acc, val) => acc + val, 0) / 3);
            } else {
                devArray = devArray.map((val, index) => val.unshift(eventAngle[index]*deg2rad));
                dev = devArray.map(arr => arr.reduce((acc, val) => acc + val, 0) / devArray[0].length);
            }
        } else {
            dev = eventAngle.map(val => val * deg2rad);
            devArray = [[dev[0]], [dev[1]], [dev[2]]];
        }

        // if (Math.max(Math.abs(dev_a-event.alpha), Math.abs(dev_b-event.beta), Math.abs(dev_c-event.gamma)) < 10) {
        //     if (dev_a_array.length > 2) {
        //         dev_a_sum += event.alpha*deg2rad - dev_a_array.pop();
        //         dev_b_sum += event.beta*deg2rad - dev_b_array.pop();
        //         dev_c_sum += event.gamma*deg2rad - dev_c_array.pop();
        //         dev_a_array.unshift(event.alpha*deg2rad);
        //         dev_b_array.unshift(event.beta*deg2rad);
        //         dev_c_array.unshift(event.gamma*deg2rad);
        //         moving = (Math.abs(dev_a_sum / 3 - dev_a) > 0.2);
        //         dev_a = dev_a_sum / 3;
        //         dev_b = dev_b_sum / 3;
        //         dev_c = dev_c_sum / 3;
        //     } else {
        //         dev_a_sum += event.alpha*deg2rad;
        //         dev_b_sum += event.beta*deg2rad;
        //         dev_c_sum += event.gamma*deg2rad;
        //         dev_a_array.unshift(event.alpha*deg2rad);
        //         dev_b_array.unshift(event.beta*deg2rad);
        //         dev_c_array.unshift(event.gamma*deg2rad);
        //         dev_a = dev_a_sum / dev_a_array.length;
        //         dev_b = dev_b_sum / dev_b_array.length;
        //         dev_c = dev_c_sum / dev_c_array.length;
        //     }
        // } else {
        //     dev_a = event.alpha*deg2rad;
        //     dev_b = event.beta*deg2rad;
        //     dev_c = event.gamma*deg2rad;
        //     dev_a_sum = dev_a + 0;
        //     dev_b_sum = dev_b + 0;
        //     dev_c_sum = dev_c + 0;
        //     dev_a_array = [dev_a];
        //     dev_b_array = [dev_b];
        //     dev_c_array = [dev_c];
        // }
        show_initial();
    }
}


function showNews(lastVisit) {
    const newsText = document.getElementById('newsText');
    newsText.innerHTML = '';
    let newsDate = '';
    let newsDiv, newsTextList;
    for (let i = 0; i < news.length; i++) {
        let newsTime = new Date(news[i].time);
        if (newsTime > lastVisit) {
            if (news[i].time.split('T')[0] == newsDate) {
                news[i].text.forEach(text => {
                    const listItem = document.createElement('li');
                    listItem.textContent = text;
                    newsTextList.appendChild(listItem);
                });
            } else {
                if (newsDiv) {
                    newsDiv.appendChild(newsTextList);
                    newsText.appendChild(newsDiv);
                }
                newsDiv = document.createElement('div'); // 年月日と内容
                newsDate = news[i].time.split('T')[0];
                let newsDateElem = document.createElement('p')
                newsDateElem.textContent = `${newsDate}`;
                newsDiv.appendChild(newsDateElem);
                newsTextList = document.createElement('ul');
                news[i].text.forEach(text => {
                    const listItem = document.createElement('li');
                    listItem.textContent = text;
                    newsTextList.appendChild(listItem);
                });
            }
        }
    }
    if (newsDiv) {
        newsDiv.appendChild(newsTextList);
        newsText.appendChild(newsDiv);
        document.getElementById('news').style.visibility = 'visible';
    }
}

//ボタンを押したとき

function darkerFunc() {
    if (darker) { //明るくする
        darker = false;
        starColor = '#FFF';
        yellowColor = 'yellow';
        objectColor = 'orange';
        lineColor = 'red';
        textColor = 'white';
        specialObjectNameColor = '#FF8';
        document.getElementById('darkerbtntext').innerHTML = 'dark';
    } else { //暗くする
        darker = true;
        starColor = '#C66';
        yellowColor = '#550';
        objectColor = '#D55';
        lineColor = '#700';
        textColor = '#A53';
        specialObjectNameColor = '#AA5';
        document.getElementById('darkerbtntext').innerHTML = 'bright';
    }
    newSetting();
    show_main();
}

function showSetting() {
    document.getElementById("descriptionBtn").setAttribute("disabled", true);
    document.getElementById('setting').style.visibility = "visible";
    if (os == 'iphone' && !orientationPermittion) {
        for (i=0; i<permitBtns.length; i++) {
            permitBtns[i].style.visibility = 'visible'
        }
    }
}

function finishSetting() {
    newSetting();
    show_main();
    document.getElementById("descriptionBtn").removeAttribute("disabled");
    document.getElementById('setting').style.visibility = "hidden";
    for (i=0; i<permitBtns.length; i++) {
        permitBtns[i].style.visibility = "hidden";
    }
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

document.getElementById('copyButton').addEventListener('click', function() {
    const url = document.getElementById('bookmarkUrl').innerText;
    navigator.clipboard.writeText(url).then(function() {
        const message = document.getElementById('copyMessage');
        message.classList.add('show');
        setTimeout(function() {
            message.classList.remove('show');
        }, 2000);
    }, function(err) {
        console.error('URLのコピーに失敗しました', err);
    });
});

function fullScreenFunc() {
    let elem = document.documentElement;
    elem
    .requestFullscreen({ navigationUI: "show" })
    .then(() => {
        setCanvas(true);
        show_main();
        document.getElementById('fullScreenBtn').style.visibility = "hidden";
        document.getElementById('exitFullScreenBtn').style.visibility = "visible";
    })
    .catch((err) => {
        alert(
            `An error occurred while trying to switch into fullscreen mode: ${err.message} (${err.name})`,
        );
    });
}

function exitFullScreenFunc() {
    document.exitFullscreen();
    setCanvas(false);
    show_main();
    document.getElementById('fullScreenBtn').style.visibility = "visible";
    document.getElementById('exitFullScreenBtn').style.visibility = "hidden";
}

function openSearch() {
    document.getElementById('searchDiv').style.visibility = "visible";
    document.getElementById('suggestionButtonContainer').innerHTML = '';
}

function closeSearch() {
    document.getElementById('searchDiv').style.visibility = "hidden";
}

function closeNews() {
    document.getElementById('news').style.visibility = "hidden";
}

function closeQR() {
    document.getElementById('qrwin').style.visibility = "hidden";
}

function closeObjectInfo() {
    document.getElementById('objectInfo').style.visibility = 'hidden';
    document.getElementById('planetTrack').style.display = 'none';
    show_main();
}

document.getElementById('planetTrackCheck').addEventListener('input', () => {
    if (document.getElementById('planetTrackCheck').checked) {
        document.getElementById('planetTrackTimeCheck').disabled = false;
    } else {
        document.getElementById('planetTrackTimeCheck').disabled = true;
    }
});

document.getElementById('NSCombo').addEventListener('change', function() {
    document.getElementById('observation-site-select').value = '--';
});
document.getElementById('lat').addEventListener('input', function() {
    document.getElementById('observation-site-select').value = '--';
});
document.getElementById('EWCombo').addEventListener('change', function() {
    document.getElementById('observation-site-select').value = '--';
});
document.getElementById('lon').addEventListener('input', function() {
    document.getElementById('observation-site-select').value = '--';
});

let lat_map, lon_map;
let currentMarker = null;
document.getElementById('observation-site-select').addEventListener('change', function() {
    const observationSite = document.getElementById('observation-site-select').value;
    if (observationSites[observationSite] != null) {
        setObservationSite(...observationSites[observationSite]);
    } else if (observationSite == '現在地') {
        function success(position) {
            const hereCoord = position.coords;
            setObservationSite(hereCoord.latitude, hereCoord.longitude);
        }
        if (!navigator.geolocation) {
            alert("お使いのブラウザは位置情報に対応していません");
        } else {
            navigator.geolocation.getCurrentPosition(success, () => {alert("位置情報を取得できません")});
        }
    } else if (observationSite == '地図上で選択') {
        document.getElementById('observation-site-map-div').style.visibility = 'visible';
        const map = L.map('observation-site-map').setView([lat_obs*rad2deg, lon_obs*rad2deg], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        currentMarker = L.marker([lat_obs*rad2deg, lon_obs*rad2deg]).addTo(map);

        map.on('click', (e) => {
            lat_map = e.latlng.lat;
            lon_map = e.latlng.lng;
            if (currentMarker) {
                map.removeLayer(currentMarker);
            }
            currentMarker = L.marker([lat_map, lon_map]).addTo(map);
            document.getElementById('observation-site-select').value = '--';
        });
    }
});
function closeObservationSiteMap() {
    document.getElementById('observation-site-map-div').style.visibility = 'hidden';
    setObservationSite(lat_map, lon_map);
}

function closeCustomizeObjects() {
    document.getElementById('customizeObjects').style.visibility = 'hidden';
}

// preload.js、main.jsと関係
document.getElementById('writeButton').addEventListener('click', async () => {
    const text = document.getElementById('coordtext').value;
    const result = await window.fileAPI.writeTestFile(text);
    console.log(result);
});

document.getElementById('readButton').addEventListener('click', async () => {
    const content = await window.fileAPI.readTestFile();
    console.log('読み込み内容:', content);
});

function show_JD_plus1(){
    showingJD++;
    setYMDHM(...JD_to_YMDHM(showingJD));
    realtimeOff();
}

function show_JD_minus1(){
    showingJD--;
    setYMDHM(...JD_to_YMDHM(showingJD));
    realtimeOff();
}

function setObservationSite(lat_deg=35, lon_deg=135) {
    lat_obs = lat_deg * deg2rad;
    lon_obs = lon_deg * deg2rad;
    lat_deg = Math.round(lat_deg * 100) / 100;
    lon_deg = Math.round(lon_deg * 100) / 100;
    document.getElementById("NSCombo").value = lat_deg >= 0 ? '北緯' : '南緯';
    document.getElementById('lat').value = Math.abs(lat_deg).toFixed(2);
    document.getElementById("EWCombo").value = lon_deg >= 0 ? '東経' : '西経';
    document.getElementById('lon').value = Math.abs(lon_deg).toFixed(2);
}

document.body.appendChild(canvas);