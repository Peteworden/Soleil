//2023/10/21 ~
// 入力をURLに反映するのは手を離したときとセッティングを終えたとき
// URLを表示に反映するのは最初のみ

const online = navigator.onLine;

//星などの色を変える
var darker = false;
var skycolor = '#001';
var starColor = '#FFF';
var yellowColor = 'yellow';
var objectColor = 'orange';
var specialObjectNameColor = '#FF8';
var lineColor = 'red';
var textColor = 'white';

const pi = Math.PI;
const eps = 0.4090926; //黄道傾斜角
const sine = sin(eps);
const cose = cos(eps);
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

document.getElementById('welcomeImage').style.visibility = "hidden";
if (online) {
    document.getElementById('fileBtn').style.visibility = "hidden";
    document.getElementById('getFile').style.visibility = "hidden";
} else {
    alert('offline version\nSelect allInOne.txt from the file button')
}

document.getElementById('setting').style.visibility = "hidden";
document.getElementById('exitFullScreenBtn').style.visibility = "hidden";
document.getElementById('description').style.visibility = "hidden";
document.getElementById('setPicsFor360Div').style.visibility = "hidden";
document.getElementById('demDescriptionDiv').style.visibility = "hidden";
document.getElementById('searchDiv').style.visibility = "hidden";
document.getElementById('objectInfo').style.visibility = "hidden";

document.getElementById('darkerbtntext').innerHTML = 'dark';

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
    if (xhrcheck != null && defaultcheck != null && xhrcheck >= 10 && defaultcheck == 11) {
        show_main();
    }
}
setCanvas(false);

var cenRA = 270;
var cenDec = -25;
var cenAzm = 180;
var cenAlt = 60;
var dev_a = 180 * pi/180;
var dev_b = 120 * pi/180;
var dev_c = 0 * pi/180;
var dev_a_array = new Array(), dev_b_array = new Array(), dev_c_array = new Array(), dev_a_sum=0, dev_b_sum=0, dev_c_sum=0;

if (canvas.width < canvas.height) {
    var rgEW = 20;
    var rgNS = rgEW * canvas.height / canvas.width;
    document.getElementById('constNameFrom').value = "90";
    document.getElementById('MessierFrom').value = "60";
    document.getElementById('recsFrom').value = "50";
} else {
    var rgNS = 20;
    var rgEW = rgNS * canvas.width / canvas.height;
    document.getElementById('constNameFrom').value = "180";
    document.getElementById('MessierFrom').value = "180";
    document.getElementById('recsFrom').value = "120";
}

const minrg = 0.3;
const maxrg = 90;

var rgtext = `視野(左右):${(rgEW * 2).toFixed(1)}°`;

var magLimtext;
var magLimLim = 11;
var magkey1 = 11.0, magkey2 = 1.8;//key1は10~13
function find_magLim(a, b) {
    var magLim = Math.min(Math.max(a - b * Math.log(Math.min(rgEW, rgNS)), 5), magLimLim);
    magLimtext = `~${magLim.toFixed(1)}等級`;
    return magLim;
}
var magLim = find_magLim(magkey1, magkey2);

function find_zerosize() {
    return 13 - 2.4 * Math.log(Math.min(rgEW, rgNS) + 3);
}
var zerosize = find_zerosize();

document.getElementById('magLimitSlider').addEventListener('change', function(){
	magkey1 = document.getElementById('magLimitSlider').value;
    magLim = find_magLim(magkey1, magkey2);
    zerosize = find_zerosize();
});

var os, orientationPermittion=true, loadAzm=0;
var orientationTime1 = Date.now();
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
var moving = false;

let picsFor360 = 5;
let videoHeight = 1;
let videoWidth = 1;

let videoOn = false;
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
        var constraints = { audio: false, video: { facingMode: "environment" } };
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
        var constraints = { audio: false, video: { facingMode: "environment" } };
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

var mode;
//AEP(正距方位図法), EtP(正距円筒図法), view(プラネタリウム), live(実際の傾き), ar

var showingJD = 0;
var ObsPlanet, Obs_num, lat_obs, lon_obs, lattext, lontext, theta;

var xhrcheck = 0;
var defaultcheck = 0;

var HIPRAary = Array(1);
var HIPDecary = Array(1);
var HIPmagary = Array(1);
var HIPbvary = Array(1);
var Tycho = [];
var Help = [];
var Tycho1011 = [];
var Help1011 = [];
var BSCnum = 0;
var BSCRAary = Array(1);
var BSCDecary = Array(1);
var FSs = Array(1);
var Bayers = Array(1);
var BayerNums = Array(1);
var starNames;
var messier;
var recs;
var NGC = [];
var CLnames = [];
var constPos = [];
var lines = [];
var boundary = [];

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

const planets    = [Sun, Marcury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, Moon, Ceres, Vesta];
const OriginalNumOfPlanets = planets.length;

var ENGplanets = ['Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Moon', 'Ceres', 'Vesta'];
var JPNplanets = ['太陽', '水星', '金星', '地球', '火星', '木星', '土星', '天王星', '海王星', '月', 'Ceres', 'Vesta'];

var RAlist = new Array(20);
var Declist = new Array(20);
var Distlist = new Array(20);
var Vlist = new Array(20);
var Ms, ws, lon_moon, lat_moon, dist_Moon, dist_Sun;
let infoList = []; //[[name, scrRA, scrDec], [,,], ...]

var extra = [];

let intervalId = null;

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
        for (i=0; i<NGC.length/5; i++) {
            if (NGC[5*i] == obj) {
                linkExist = true;
                break;
            }
        }
    }
    return linkExist;
}

function link(obj) {
    if (!obj) {
        console.error('Invalid input:', obj);
        return;
    }
    let frag = false;
    for (i=0; i<recs.length; i++) {
        if (recs[i].name == obj) {
            cenRA = rahm2deg(recs[i].ra);
            cenDec = decdm2deg(recs[i].dec);
            frag = true;
            break;
        }
    }
    if (!frag) {
        if (obj[0] == 'M' && isNaN(obj.substr(1)) == false) { //メシエ
            for (i=0; i<messier.length; i++) {
                if (messier[i].name == obj) {
                    cenRA = rahm2deg(messier[i].ra);
                    cenDec = decdm2deg(messier[i].dec);
                    break;
                }
            }
        } else if ((obj.startsWith('NGC') && isNaN(obj.substr(3)) == false) || (obj.startsWith('IC') && isNaN(obj.substr(2)) == false)) {
            for (i=0; i<NGC.length/5; i++) {
                if (NGC[5*i] == obj) {
                    cenRA = parseFloat(NGC[5*i+1]);
                    cenDec = parseFloat(NGC[5*i+2]);
                    break;
                }
            }
        } else if (obj.slice(-1) == '座') {
            for (i=0; i<89; i++){
                if (obj == CLnames[i] + '座') {
                    cenRA = parseFloat(constPos[2*i]);
                    cenDec = parseFloat(constPos[2*i+1]);
                    break;
                }
            }
        }
    }
    url.searchParams.set('RA', cenRA.toFixed(2));
    url.searchParams.set('Dec', cenDec.toFixed(2));
    localStorage.setItem('RA', cenRA.toFixed(2));
    localStorage.setItem('Dec', cenDec.toFixed(2));
    [cenAzm, cenAlt] = RADec2Ah(cenRA, cenDec, theta);
    url.searchParams.set('azm', cenAzm.toFixed(2));
    url.searchParams.set('alt', cenAlt.toFixed(2));
    localStorage.setItem('azm', cenAzm.toFixed(2));
    localStorage.setItem('alt', cenAlt.toFixed(2));
    history.replaceState('', '', url.href);
    document.getElementById("settingBtn").removeAttribute("disabled");
    document.getElementById('description').style.visibility = "hidden";
    show_main();
}

function openSearch() {
    document.getElementById('searchDiv').style.visibility = "visible";
    document.getElementById('suggestionButtonContainer').innerHTML = '';
}

function closeSearch() {
    document.getElementById('searchDiv').style.visibility = "hidden";
}

document.getElementById('searchInput').addEventListener('input', function() {
    let searchText = hiraganaToKatakana(document.getElementById('searchInput').value.toUpperCase());
    let suggestions1 = [[], []];
    let suggestions2 = [[], []];
    let recsugs = [];
    if (searchText.length == 0) {
        suggestions1 = [[], []];
        suggestions2 = [[], []];
    } else if (searchText.length == 1) { //1文字
        if (isNaN(searchText) && !["M", "N", "I"].includes(searchText)) {
            for (let constName of CLnames) {
                if (constName.length != 0 && hiraganaToKatakana(constName[0]) == searchText) {
                    suggestions1[0].push(`${constName}座`);
                    suggestions1[1].push(`${constName}座`);
                }
            }
        }
        if (!isNaN(searchText) && 1 <= parseInt(searchText) <= 110 && linkExist(`M${searchText}`)) {
            suggestions1[0].push(`M${searchText}`);
            suggestions1[1].push(`M${searchText}`);
        }
        if (isNaN(searchText)) {
            for (let rec of recs) {
                if (hiraganaToKatakana(rec.name[0]) == searchText) {
                    suggestions1[0].push(rec.name);
                    suggestions1[1].push(rec.name);
                }
                for (let alt of rec.alt_name) {
                    if (hiraganaToKatakana(alt[0].toUpperCase()) == searchText) {
                        suggestions1[0].push(`${rec.name}(${alt})`);
                        suggestions1[1].push(rec.name);
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
                        suggestions1[0].push(`${rec.name}(${alt})`);
                        suggestions1[1].push(rec.name);
                        recsugs.push(alt);
                    }
                }
            }
        }
        if (!isNaN(searchText)) {
            if (1 <= parseInt(searchText) <= 7840 && !recsugs.includes(`NGC${searchText}`) && linkExist(`NGC${searchText}`)) {
                suggestions1[0].push(`NGC${searchText}`);
                suggestions1[1].push(`NGC${searchText}`);
            }
            if (1 <= parseInt(searchText) <= 5386 && !recsugs.includes(`IC${searchText}`) && linkExist(`IC${searchText}`)) {
                suggestions1[0].push(`IC${searchText}`);
                suggestions1[1].push(`IC${searchText}`);
            }
        } else if (!["M", "N", "I"].includes(searchText)){
            for (m of messier) {
                for (alt of m.alt_name) {
                    if (alt.length > 0 && hiraganaToKatakana(alt[0]) == searchText) {
                        suggestions1[0].push(m.name);
                        suggestions1[1].push(m.name);
                    }
                }
            }
        }
    } else {
        suggestions1 = [[], []];
        suggestions2 = [[], []];
        //星座
        if (isNaN(searchText) && !["M", "N", "I"].includes(searchText)) {
            for (let constName of CLnames) {
                if ((hiraganaToKatakana(constName)+'座').includes(searchText)) {
                    if (hiraganaToKatakana(constName+'座').startsWith(searchText)) {
                        suggestions1[0].push(`${constName}座`);
                        suggestions1[1].push(`${constName}座`);
                    } else {
                        suggestions2[0].push(`${constName}座`);
                        suggestions2[1].push(`${constName}座`);
                    }
                }
            }
        }
        //Mをつけてメシエになるとき
        if (!isNaN(searchText) && 1 <= parseInt(searchText) <= 110 && linkExist(`M${searchText}`)) {
            suggestions1[0].push(`M${searchText}`);
            suggestions1[1].push(`M${searchText}`);
        }
        //そのままでメシエになるとき
        if (searchText[0] == 'M' && !isNaN(searchText.substr(1)) && 1 <= parseInt(searchText.substr(1)) <= 110 && linkExist(searchText)) {
            suggestions1[0].push(searchText.toUpperCase());
            suggestions1[1].push(searchText.toUpperCase());
        }
        if (isNaN(searchText)) {
            for (let rec of recs) {
                if (hiraganaToKatakana(rec.name).startsWith(searchText)) {
                    suggestions1[0].push(rec.name);
                    suggestions1[1].push(rec.name);
                } else if (hiraganaToKatakana(rec.name).includes(searchText)) {
                    suggestions2[0].push(rec.name);
                    suggestions2[1].push(rec.name);
                }
                for (let alt of rec.alt_name) {
                    if (hiraganaToKatakana(alt.toUpperCase()).startsWith(searchText)) {
                        suggestions1[0].push(rec.name);
                        suggestions1[1].push(rec.name);
                    } else if (hiraganaToKatakana(alt.toUpperCase()).includes(searchText)) {
                        suggestions2[0].push(rec.name);
                        suggestions2[1].push(rec.name);
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
            if (1 <= parseInt(searchText) <= 7840 && !recsugs.includes(`NGC${searchText}`) && linkExist(`NGC${searchText}`)) {
                suggestions1[0].push(`NGC${searchText}`);
                suggestions1[1].push(`NGC${searchText}`);
            }
            if (1 <= parseInt(searchText) <= 5386 && !recsugs.includes(`IC${searchText}`) && linkExist(`IC${searchText}`)) {
                suggestions1[0].push(`IC${searchText}`);
                suggestions1[1].push(`IC${searchText}`);
            }
        } else if (searchText.startsWith('NGC') && !recsugs.includes(searchText) && !isNaN(searchText.substr(3)) && 1 <= parseInt(searchText.substr(3)) <= 7840 && linkExist(searchText)) {
            suggestions1[0].push(searchText);
            suggestions1[1].push(searchText);
        } else if (searchText.startsWith('IC') && !recsugs.includes(searchText) && !isNaN(searchText.substr(2)) && 1 <= parseInt(searchText.substr(2)) <= 5386 && linkExist(searchText)) {
            suggestions1[0].push(searchText);
            suggestions1[1].push(searchText);
        }
        //数字ではないがM, N, I始まりではないとき
        if (isNaN(searchText) && !["M", "N", "I"].includes(searchText[0])){
            for (m of messier) {
                for (alt of m.alt_name) {
                    if (hiraganaToKatakana(alt).includes(searchText)) {
                        if (hiraganaToKatakana(alt).startsWith(searchText)) {
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

function hiraganaToKatakana(str) {
    return str.replace(/[\u3041-\u309F]/g, function(char) {
        return String.fromCharCode(char.charCodeAt(0) + 0x60);
    });
}

function closeObjectInfo() {
    document.getElementById('objectInfo').style.visibility = 'hidden';
    document.getElementById('planetTrack').style.display = 'none';
    show_main();
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
                //console.log(`画像が見つかりません: ${ext}`);
            };
            img.src = `https://peteworden.github.io/Soleil/chartImage/${nearest[0].replace(/\s+/g, '')}.${ext}`;
            if (found) {
                break;
            }
        }

        document.getElementById('objectInfoText').innerHTML = '';
        if (JPNplanets.includes(nearest[0])) {
            trackPlanet = nearest[0];
            document.getElementById('planetTrack').style.display = 'inline-block';
            document.getElementById('objectInfoText').innerHTML +=  `<a href="https://peteworden.github.io/Soleil/SoleilWeb.html?time=${yearTextElem.value}-${monthTextElem.value}-${dateTextElem.value}-${hourTextElem.value}-${Math.floor(minuteTextElem.value/6.0)}&target=${ENGplanets[JPNplanets.indexOf(nearest[0])].split(' ').join('').split('/').join('')}&dark=1">Soleil Webでくわしく見る</a>`;
        } else if (nearest[0][0] == 'M') {
            if (messier[parseInt(nearest[0].slice(1))-1].description.length > 0) {
                document.getElementById('objectInfoText').innerHTML = messier[parseInt(nearest[0].slice(1))-1].description;
            } else {
                document.getElementById('objectInfoText').innerHTML = 'no description';
            }
            if (wikiSpecial[0].includes(parseInt(nearest[0].slice(1)))) {
                document.getElementById('objectInfoText').innerHTML += `<br><a href="https://ja.wikipedia.org/wiki/${wikiSpecial[1][wikiSpecial[0].indexOf(parseInt(nearest[0].slice(1)))]}">Wikipedia</a>`;
            } else {
                document.getElementById('objectInfoText').innerHTML += `<br><a href="https://ja.wikipedia.org/wiki/M${nearest[0].slice(1)}_(天体)">Wikipedia</a>`;
            }
        } else {
            for (let rec of recs) {
                if (rec.name == nearest[0]) {
                    if (rec.description.length > 0) {
                        document.getElementById('objectInfoText').innerHTML = rec.description;
                    } else {
                        document.getElementById('objectInfoText').innerHTML = 'no description';
                    }
                    if (rec.wiki == null) {
                        document.getElementById('objectInfoText').innerHTML += `<br><a href="https://ja.wikipedia.org/wiki/${rec.name}">Wikipedia</a>`;
                    } else if (rec.wiki.startsWith("http")){
                        document.getElementById('objectInfoText').innerHTML += `<br><a href="${rec.wiki}">${rec.wiki}</a>`
                    } else {
                        document.getElementById('objectInfoText').innerHTML += `<br><a href="https://ja.wikipedia.org/wiki/${rec.wiki}">Wikipedia</a>`;
                    }
                }
            }
        }
    }
}

const trackTimeCheckboxes = document.querySelectorAll('.planet-track-time-checkbox');

document.getElementById('planetTrackCheck').addEventListener('input', () => {
    if (document.getElementById('planetTrackCheck').checked) {
        document.getElementById('planetTrackTimeCheck').disabled = false;
    } else {
        document.getElementById('planetTrackTimeCheck').disabled = true;
    }
});


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
    var ymdhm = new Date();
    var [y, m, d, h, mi] = [ymdhm.getFullYear(), ymdhm.getMonth()+1, ymdhm.getDate(), ymdhm.getHours(), ymdhm.getMinutes()];
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

//基本的にYMDHMはJST, JDはTT

function JD_to_YMDHM(JD) { //TT-->JST として変換　TT-->TTのときはJDに-0.3742しておく
    var JD = JD + 0.375 - 0.0008 + 1/2880; //最後の項はhh:mm:30~hh:(mm+1):00をhh:(mm+1)にするため
    var A = Math.floor(JD + 68569.5);
    var B = Math.floor(A / 36524.25);
    var C = A - Math.floor(36524.25 * B + 0.75);
    var E = Math.floor((C + 1) / 365.25025);
    var F = C - Math.floor(365.25 * E) + 31;
    var G = Math.floor(F / 30.59);
    var D = F - Math.floor(30.59 * G);
    var H = Math.floor(G / 11);
    var M = G - 12 * H + 2;
    var Y = 100 * (B - 49) + E + H;
    var Hr = Math.floor((JD + 0.5 - Math.floor(JD + 0.5)) * 24);
    var Mi = Math.floor((JD + 0.5 - Math.floor(JD + 0.5)) * 1440 - Hr * 60);
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
    var JD = Math.floor(365.25*Y) + Math.floor(Y/400) - Math.floor(Y/100) + Math.floor(30.59*(M-2)) + D + H/24 + Mi/1440 + 1721088.5 + 0.0008 - 0.375;
    return JD;
}

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
    var [y, m, d, h, mi] = JD_to_YMDHM(showingJD);
    setYMDHM(y, m, d, h, mi);
    realtimeOff();
}

function show_JD_minus1(){
    showingJD -= 1;
    var [y, m, d, h, mi] = JD_to_YMDHM(showingJD);
    setYMDHM(y, m, d, h, mi);
    realtimeOff();
}

function here() {
    function success(position) {
        const latitude = Math.round(position.coords.latitude*100)/100;
        const longitude = Math.round(position.coords.longitude*100)/100;
        if (latitude < 0) {
            document.getElementById('NSCombo').options[1].selected = true;
        } else {
            document.getElementById('NSCombo').options[0].selected = true;
        }
        document.getElementById('lat').value = Math.abs(latitude);
        if (longitude < 0) {
            document.getElementById('EWCombo').options[1].selected = true;
        } else {
            document.getElementById('EWCombo').options[0].selected = true;
        }
        document.getElementById('lon').value = Math.abs(longitude);
    }
    if (!navigator.geolocation) {
        alert("お使いのブラウザは位置情報に対応していません");
    } else {
        navigator.geolocation.getCurrentPosition(success, () => {alert("位置情報を取得できません")});
    }
}

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

var startX, startY, preX, preY, moveX, moveY, dist_detect = Math.round(canvas.width / 200); // distはスワイプを感知する最低距離（ピクセル単位）
var baseDistance = 0;
var movedDistance = 0;
var distance = 0;
var pinchFrag = false;
let dragFrag = false;

// タッチ開始
function ontouchstart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
        pinchFrag = false;
        dragFrag = false;
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
        if (!pinchFrag) {
            dragFrag = true;
            moveX = e.touches[0].pageX;
            moveY = e.touches[0].pageY;
            distance = Math.sqrt((moveX-preX)*(moveX-preX) + (moveY-preY)*(moveY-preY));
            if (distance > dist_detect) {
                if (mode == 'AEP') {
                    var prescrRA = -rgEW * (preX - canvas.offsetLeft - canvas.width  / 2) / (canvas.width  / 2);
                    var prescrDec = -rgNS * (preY - canvas.offsetTop - canvas.height / 2) / (canvas.height / 2);
                    var [preRA, preDec] = scr2RADec(prescrRA, prescrDec);
                    var movescrRA = -rgEW * (moveX - canvas.offsetLeft - canvas.width  / 2) / (canvas.width  / 2);
                    var movescrDec = -rgNS * (moveY - canvas.offsetTop - canvas.height / 2) / (canvas.height / 2);
                    var [moveRA, moveDec] = scr2RADec(movescrRA, movescrDec);
                    cenRA = ((cenRA - moveRA + preRA) % 360 + 360) % 360;
                    cenDec = Math.min(Math.max(cenDec - moveDec + preDec, -90), 90);
                    [cenAzm, cenAlt] = RADec2Ah(cenRA, cenDec, theta);
                } else if (mode == 'EtP') {
                    cenRA  = ((cenRA  + 2 * rgEW * (moveX - preX) / canvas.width) % 360 + 360) % 360;
                    cenDec = Math.min(Math.max(-90, cenDec + 2 * rgNS * (moveY - preY) / canvas.height), 90);
                    [cenAzm, cenAlt] = RADec2Ah(cenRA, cenDec, theta);
                } else if (mode == 'view') {
                    var prescrRA = -rgEW * (preX - canvas.offsetLeft - canvas.width  / 2) / (canvas.width  / 2);
                    var prescrDec = -rgNS* (preY - canvas.offsetTop - canvas.height / 2) / (canvas.height / 2);
                    var [preAzm, preAlt] = SHtoAh(prescrRA, prescrDec);
                    var movescrRA = -rgEW * (moveX - canvas.offsetLeft - canvas.width  / 2) / (canvas.width  / 2);
                    var movescrDec = -rgNS * (moveY - canvas.offsetTop - canvas.height / 2) / (canvas.height / 2);
                    var [moveAzm, moveAlt] = SHtoAh(movescrRA, movescrDec);
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
        dragFrag = false;
        pinchFrag = true;
        var x1 = e.touches[0].pageX ;
        var y1 = e.touches[0].pageY ;
        var x2 = e.touches[1].pageX ;
        var y2 = e.touches[1].pageY ;
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
                if (mode == 'AEP') {
                    var pinchscrRA  = -rgEW * x3 / (canvas.width  / 2);
                    var pinchscrDec = -rgNS * y3 / (canvas.height / 2);
                    [cenRA, cenDec] = scr2RADec(pinchscrRA * (1 - 1 / scale), pinchscrDec * (1 - 1 / scale));
                    [cenAzm, cenAlt] = RADec2Ah(cenRA, cenDec, theta);
                } else if (mode == 'EtP') {
                    var pinchRA  = cenRA  - rgEW * x3 / (canvas.width  / 2);
                    var pinchDec = cenDec - rgNS * y3 / (canvas.height / 2);
                    cenRA  = (pinchRA  + (cenRA  - pinchRA ) / scale) % 360;
                    cenDec = Math.min(Math.max(-90, pinchDec + (cenDec - pinchDec) / scale), 90);
                    [cenAzm, cenAlt] = RADec2Ah(cenRA, cenDec, theta);
                } else if (mode == 'view') {
                    var pinchscrRA  = -rgEW * x3 / (canvas.width  / 2);
                    var pinchscrDec = -rgNS * y3 / (canvas.height / 2);
                    [cenAzm, cenAlt] = SHtoAh(pinchscrRA * (1 - 1 / scale), pinchscrDec * (1 - 1 / scale));
                    [cenRA, cenDec] = Ah2RADec(cenAzm, cenAlt, theta);
                }
                document.getElementById('arVideo').style.height = `${Math.round(100*videoHeight/2/rgNS)}%`;
                rgtext = `視野(左右):${(rgEW * 2).toFixed(1)}°`;
                magLim = find_magLim(magkey1, magkey2);
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
    if (dragFrag) {
        url.searchParams.set('RA', cenRA.toFixed(2));
        url.searchParams.set('Dec', cenDec.toFixed(2));
        url.searchParams.set('azm', cenAzm.toFixed(2));
        url.searchParams.set('alt', cenAlt.toFixed(2));
        url.searchParams.set('area', (2*rgEW).toFixed(2));
        history.replaceState('', '', url.href);

        localStorage.setItem('RA', cenRA.toFixed(2));
        localStorage.setItem('Dec', cenDec.toFixed(2));
        localStorage.setItem('azm', cenAzm.toFixed(2));
        localStorage.setItem('alt', cenAlt.toFixed(2));
        localStorage.setItem('area', (2*rgEW).toFixed(2));
    }
    if (e.touches.length.toString() == '0' && !pinchFrag && (!dragFrag || (dragFrag && Math.sqrt(Math.pow(moveX-startX, 2) + Math.pow(moveY-startY, 2)) < Math.min(canvas.width, canvas.height) / 10))) {
        showObjectInfo(preX - canvas.offsetLeft, preY - canvas.offsetTop);
    }
    if (e.touches.length === 0) {
        dragFrag = false;
        pinchFrag = false;
    }
    baseDistance = 0;
};

function ontouchcancel(e) {
    if (dragFrag) {
        url.searchParams.set('RA', cenRA.toFixed(2));
        url.searchParams.set('Dec', cenDec.toFixed(2));
        url.searchParams.set('azm', cenAzm.toFixed(2));
        url.searchParams.set('alt', cenAlt.toFixed(2));
        url.searchParams.set('area', (2*rgEW).toFixed(2));
        history.replaceState('', '', url.href);

        localStorage.setItem('RA', cenRA.toFixed(2));
        localStorage.setItem('Dec', cenDec.toFixed(2));
        localStorage.setItem('azm', cenAzm.toFixed(2));
        localStorage.setItem('alt', cenAlt.toFixed(2));
        localStorage.setItem('area', (2*rgEW).toFixed(2));
    }
    baseDistance = 0;
};

function onmousedown(e){
    dragFrag = false;
    preX = e.pageX;
    preY = e.pageY;
    canvas.addEventListener("mousemove", onmousemove);
}

function onmousemove(e) {
    dragFrag = true;
    moveX = e.pageX;
    moveY = e.pageY;
    if ((moveX-preX)*(moveX-preX) + (moveY-preY)*(moveY-preY) > dist_detect*dist_detect) {
        if (mode == 'AEP') {
            var prescrRA = -rgEW * (preX - canvas.offsetLeft - canvas.width  / 2) / (canvas.width  / 2);
            var prescrDec = -rgNS* (preY - canvas.offsetTop - canvas.height / 2) / (canvas.height / 2);
            var [preRA, preDec] = scr2RADec(prescrRA, prescrDec);
            var movescrRA = -rgEW * (moveX - canvas.offsetLeft - canvas.width  / 2) / (canvas.width  / 2);
            var movescrDec = -rgNS * (moveY - canvas.offsetTop - canvas.height / 2) / (canvas.height / 2);
            var [moveRA, moveDec] = scr2RADec(movescrRA, movescrDec);
            cenRA = ((cenRA - moveRA + preRA) % 360 + 360) % 360;
            cenDec = Math.min(Math.max(cenDec - moveDec + preDec, -90), 90);
            [cenAzm, cenAlt] = RADec2Ah(cenRA, cenDec, theta);
        } else if (mode == 'EtP') {
            cenRA  = ((cenRA  + 2 * rgEW * (moveX - preX) / canvas.width ) % 360 + 360) % 360;
            cenDec =  Math.min(Math.max(cenDec + 2 * rgNS * (moveY - preY) / canvas.height, -90), 90);
            [cenAzm, cenAlt] = RADec2Ah(cenRA, cenDec, theta);
        } else if (mode == 'view') {
            var prescrRA = -rgEW * (preX - canvas.offsetLeft - canvas.width  / 2) / (canvas.width  / 2);
            var prescrDec = -rgNS* (preY - canvas.offsetTop - canvas.height / 2) / (canvas.height / 2);
            var [preAzm, preAlt] = SHtoAh(prescrRA, prescrDec);
            var movescrRA = -rgEW * (moveX - canvas.offsetLeft - canvas.width  / 2) / (canvas.width  / 2);
            var movescrDec = -rgNS * (moveY - canvas.offsetTop - canvas.height / 2) / (canvas.height / 2);
            var [moveAzm, moveAlt] = SHtoAh(movescrRA, movescrDec);
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
    if (dragFrag) {
        url.searchParams.set('RA', cenRA.toFixed(2));
        url.searchParams.set('Dec', cenDec.toFixed(2));
        url.searchParams.set('azm', cenAzm.toFixed(2));
        url.searchParams.set('alt', cenAlt.toFixed(2));
        url.searchParams.set('area', (2*rgEW).toFixed(2));
        history.replaceState('', '', url.href);

        localStorage.setItem('RA', cenRA.toFixed(2));
        localStorage.setItem('Dec', cenDec.toFixed(2));
        localStorage.setItem('azm', cenAzm.toFixed(2));
        localStorage.setItem('alt', cenAlt.toFixed(2));
        localStorage.setItem('area', (2*rgEW).toFixed(2));

        canvas.removeEventListener("mousemove", onmousemove);
    } else {
        showObjectInfo(preX - canvas.offsetLeft, preY - canvas.offsetTop);
    }
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
        if (mode == 'AEP') {
            var pinchscrRA  = -rgEW * x3 / (canvas.width  / 2);
            var pinchscrDec = -rgNS * y3 / (canvas.height / 2);
            [cenRA, cenDec] = scr2RADec(pinchscrRA * (1 - 1 / scale), pinchscrDec * (1 - 1 / scale));
            [cenAzm, cenAlt] = RADec2Ah(cenRA, cenDec, theta);
        } else if (mode == 'EtP') {
            var pinchRA  = cenRA  - rgEW * x3 / (canvas.width  / 2);
            var pinchDec = cenDec - rgNS * y3 / (canvas.height / 2);
            cenRA  = (pinchRA  + (cenRA  - pinchRA ) / scale) % 360;
            cenDec = Math.min(Math.max(-90, pinchDec + (cenDec - pinchDec) / scale), 90);
            [cenAzm, cenAlt] = RADec2Ah(cenRA, cenDec, theta);
        } else if (mode == 'view') {
            var pinchscrRA  = -rgEW * x3 / (canvas.width  / 2);
            var pinchscrDec = -rgNS * y3 / (canvas.height / 2);
            [cenAzm, cenAlt] = SHtoAh(pinchscrRA * (1 - 1 / scale), pinchscrDec * (1 - 1 / scale));
            [cenRA, cenDec] = Ah2RADec(cenAzm, cenAlt, theta);
        }
        document.getElementById('arVideo').style.height = `${Math.round(100*videoHeight/2/rgNS)}%`;
        rgtext = `視野(左右):${(rgEW * 2).toFixed(1)}°`;
        magLim = find_magLim(magkey1, magkey2);
        zerosize = find_zerosize();
        show_main();
        baseDistance = distance;

        url.searchParams.set('RA', cenRA.toFixed(2));
        url.searchParams.set('Dec', cenDec.toFixed(2));
        url.searchParams.set('azm', cenAzm.toFixed(2));
        url.searchParams.set('alt', cenAlt.toFixed(2));
        url.searchParams.set('area', (2*rgEW).toFixed(2));
        history.replaceState('', '', url.href);

        localStorage.setItem('RA', cenRA.toFixed(2));
        localStorage.setItem('Dec', cenDec.toFixed(2));
        localStorage.setItem('azm', cenAzm.toFixed(2));
        localStorage.setItem('alt', cenAlt.toFixed(2));
        localStorage.setItem('area', (2*rgEW).toFixed(2));
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadFiles();
    checkURL();
});

function show_initial(){
    if (xhrcheck == 15 && defaultcheck ==11) {
        canvas.addEventListener("touchstart", ontouchstart);
        canvas.addEventListener("touchmove", ontouchmove);
        canvas.addEventListener('touchend', ontouchend);
        canvas.addEventListener('touchcancel', ontouchcancel);
        canvas.addEventListener('mousedown', onmousedown);
        canvas.addEventListener('mouseup', onmouseup);
        canvas.addEventListener('wheel', onwheel);
        newSetting();
        document.getElementById('welcomeImage').style.display = 'none';
        show_main();
    }
}

//位置推算とURLの書き換え
function calculation(JD, useFunc=false, func=function(){}, funcargs=[]) {
    var t = (JD - 2451545.0) / 36525;
    theta = ((24110.54841 + 8640184.812866*t + 0.093104*t**2 - 0.0000062*t**3)/86400 % 1 + 1.00273781 * ((JD-2451544.5)%1)) * 2*pi + lon_obs //rad

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
        } else {
            var [x, y, z] = calc(planet, JD);
            var [RA, Dec, dist] = xyz_to_RADec(x-X, y-Y, z-Z);
            Xlist[i] = x;
            Ylist[i] = y;
            Zlist[i] = z;
            RAlist[i] = RA;
            Declist[i] = Dec;
            Distlist[i] = dist;
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

function show_main(){
    ctx.clearRect(0, 0, canvas.width,canvas.height);
    ctx.fillStyle = skycolor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var x, y, scrRA, scrDec;
    infoList = [];

    var JD = showingJD;

    var t = (JD - 2451545.0) / 36525;
    theta = ((24110.54841 + 8640184.812866*t + 0.093104*t**2 - 0.0000062*t**3)/86400 % 1 + 1.00273781 * ((JD-2451544.5)%1)) * 2*pi + lon_obs //rad

    if (['live', 'ar'].includes(mode)) {
        [cenAzm, cenAlt] = screen2liveAh(0, 0);
    }
    if (['AEP', 'EtP'].includes(mode)) {
        [cenAzm, cenAlt] = RADec2Ah(cenRA, cenDec, theta);
    } else if (['view', 'live', 'ar'].includes(mode)) {
        [cenRA, cenDec] = Ah2RADec(cenAzm, cenAlt, theta);
    }

    var Astr = "";
    var hstr = "";
    if (ObsPlanet == "地球") {
        var [A, h] = RADec2Ah(cenRA, cenDec, theta);
        const direcs = ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東', '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西', '北'];
        var direc = direcs[Math.floor((A + 11.25) / 22.5)];
        Astr = `方位角 ${A.toFixed(1)}°(${direc}) `;
        hstr = `高度 ${h.toFixed(1)}° `;
        if (moving) {
            hstr += ' wait...';
        }
    }

    if (['view', 'live', 'ar'].includes(mode) && document.getElementById('demCheck').checked && document.getElementById('demFileInput').files.length > 0) {
        const demReader = new FileReader();
        demReader.onload = function(e) {
            const dem = e.target.result.split(',').map(item => parseFloat(item));
            if (dem.length == 257*257) {
                const demAngle = [...Array(257*257)].map(() => Array(3).fill(0));
                obsHeight = dem[257*128+128];
                for (i=0; i<257; i++) {
                    for (j=0; j<257; j++) {
                        let demDist = Math.sqrt((j-128)*(j-128)+(128-i)*(128-i));
                        if (demDist > 1){
                            demAngle[257*i+j][0] = (Math.atan2(j-128, 128-i) * 180/pi + 360) % 360;
                            demAngle[257*i+j][1] = Math.atan((dem[257*i+j]-obsHeight) * 257 / 100 / demDist) * 180/pi;
                            demAngle[257*i+j][2] = demDist;
                        }
                    }
                }
                demAngle.sort((a, b) => a[2] - b[2]);
                if (mode == 'view') {
                    for (i=0; i<257*257; i++) {
                        var [scrRA, scrDec] = RADec2scrview(...Ah2RADec(demAngle[i][0], demAngle[i][1], theta));
                        if (Math.abs(scrDec) < rgNS && Math.abs(scrRA) < rgEW) {
                            drawFilledCircle (...coordSH(scrRA, scrDec), 1, c="rgba(0, 255, 0, 0.5)");
                        }
                    }
                } else if (['live', 'ar'].includes(mode)) {
                    for (i=0; i<257*257; i++) {
                        var [scrRA, scrDec] = Ah2scrlive(demAngle[i][0], demAngle[i][1]);
                        if (Math.abs(scrRA) < rgEW && Math.abs(scrDec) < rgNS) {
                            drawFilledCircle(...coordSH(scrRA, scrDec), 1, c="rgba(0, 255, 0, 0.5)");
                        }
                    }
                }
            }
        };
        demReader.readAsText(document.getElementById('demFileInput').files[0]);
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

    //星座線
    if (document.getElementById('constLineCheck').checked && rgEW <= 0.5 * document.getElementById('constLineFrom').value) {
        ctx.strokeStyle = lineColor;
        ctx.beginPath();
        const num_of_lines = lines.length / 5;
        for (var i=0; i<num_of_lines; i++) {
            var RA1 = parseFloat(lines[5*i+1]);
            var Dec1 = parseFloat(lines[5*i+2]);
            var RA2 = parseFloat(lines[5*i+3]);
            var Dec2 = parseFloat(lines[5*i+4]);
            if (mode == 'AEP') {
                var [RA1_SH, Dec1_SH] = RADec2scrAEP(RA1, Dec1);
                var [RA2_SH, Dec2_SH] = RADec2scrAEP(RA2, Dec2);
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
            } else if (mode == 'view') {
                var [RA1_view, Dec1_view] = RADec2scrview(RA1, Dec1);
                var [RA2_view, Dec2_view] = RADec2scrview(RA2, Dec2);
                if (Math.min(RA1_view, RA2_view) < rgEW && Math.max(RA1_view, RA2_view) > -rgEW) {
                    if (Math.min(Dec1_view, Dec2_view) < rgNS && Math.max(Dec1_view, Dec2_view) > -rgNS) {
                        if (Math.pow(RA2_view-RA1_view, 2) + Math.pow(Dec2_view-Dec1_view, 2) < 30*30) {
                            ctx.moveTo(...coordSH(RA1_view, Dec1_view));
                            ctx.lineTo(...coordSH(RA2_view, Dec2_view));
                        }
                    }
                }
            } else if (['live', 'ar'].includes(mode)) {
                var [scrRA1, scrDec1] = Ah2scrlive(...RADec2Ah(RA1, Dec1, theta));
                var [scrRA2, scrDec2] = Ah2scrlive(...RADec2Ah(RA2, Dec2, theta));
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
        ctx.stroke();
    }

    //Tycho
    if (mode == 'AEP') {
        var skyareas = [];
        if (magLim > 6.5) {
            var minDec = Math.max(-90, Math.min(scr2RADec(rgEW, -rgNS)[1], cenDec-rgNS));
            var maxDec = Math.min( 90, Math.max(scr2RADec(rgEW,  rgNS)[1], cenDec+rgNS));

            if (minDec == -90) {
                skyareas = [[SkyArea(0, -90), SkyArea(359.9, maxDec)]];
            } else if (maxDec == 90) {
                skyareas = [[SkyArea(0, minDec), SkyArea(359.9, 89.9)]];
            } else {
                var RArange1 = (scr2RADec(rgEW,  rgNS)[0] - cenRA + 360) % 360;
                var RArange2 = (scr2RADec(rgEW,     0)[0] - cenRA + 360) % 360;
                var RArange3 = (scr2RADec(rgEW, -rgNS)[0] - cenRA + 360) % 360;
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
            drawStars(skyareas);
            if (magLim > 10) {
                drawStars1011(skyareas);
            }
        }
    } else if (mode == 'EtP') { //正距円筒図法
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
            drawStars(skyareas);
            if (magLim > 10) {
                drawStars1011(skyareas);
            }
        }
    } else if (mode == 'view') {
        var skyareas = [];
        if (magLim > 6.5) {
            skyareas = [];
            var [scrRA_NP, scrDec_NP] = RADec2scrview(0, 90);
            var [scrRA_SP, scrDec_SP] = RADec2scrview(0, -90);
            if (Math.abs(scrRA_NP) < rgEW && Math.abs(scrDec_NP) < rgNS) {
                var minDec = Math.min(
                    Ah2RADec(...SHtoAh(rgEW, -rgNS), theta)[1],
                    Ah2RADec(...SHtoAh(-rgEW, -rgNS), theta)[1],
                    Ah2RADec(...SHtoAh(rgEW, rgNS), theta)[1],
                    Ah2RADec(...SHtoAh(-rgEW, rgNS), theta)[1]
                );
                skyareas = [[SkyArea(0, minDec), SkyArea(359.9, 89.9)]];
            } else if (Math.abs(scrRA_SP) < rgEW && Math.abs(scrDec_SP) < rgNS) {
                var maxDec = Math.max(
                    Ah2RADec(...SHtoAh(rgEW, -rgNS), theta)[1],
                    Ah2RADec(...SHtoAh(-rgEW, -rgNS), theta)[1],
                    Ah2RADec(...SHtoAh(rgEW, rgNS), theta)[1],
                    Ah2RADec(...SHtoAh(-rgEW, rgNS), theta)[1]
                );
                skyareas = [[SkyArea(0, -90), SkyArea(359.9, maxDec)]];
            } else {
                var RA_max = 0, RA_min = 360, Dec_max = -90, Dec_min = 90;
                let edgeRA = [];
                let edgeDec = [];
                for (j=0; j<=Math.ceil(3*rgEW); j++) {
                    for (i=0; i<=Math.ceil(3*rgNS); i++) {
                        if (0 < i && i < Math.ceil(3*rgNS) && 0 < j && j < Math.ceil(3*rgEW)) {
                            continue;
                        }
                        [A, h] = SHtoAh((2*j/Math.ceil(3*rgEW)-1)*rgEW, (2*i/Math.ceil(3*rgNS)-1)*rgNS);
                        [RA, Dec] = Ah2RADec(A, h, theta);
                        edgeRA.push(RA);
                        edgeDec.push(Dec);
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
                    for (var i=1; i<=Math.floor(Dec_max)-Math.floor(Dec_min); i++) {
                        skyareas.push([skyareas[0][0]+360*i, skyareas[0][1]+360*i]);
                        skyareas.push([skyareas[1][0]+360*i, skyareas[1][1]+360*i]);
                    }
                } else {
                    skyareas = [[SkyArea(RA_min, Dec_min), SkyArea(RA_max, Dec_min)]];
                    for (var i=1; i<=Math.floor(Dec_max)-Math.floor(Dec_min); i++) {
                        skyareas.push([skyareas[0][0]+360*i, skyareas[0][1]+360*i]);
                    }
                }
            }
            drawStars(skyareas);
            if (magLim > 10) {
                drawStars1011(skyareas);
            }
        }
    }

    if (document.getElementById('starNameCheck').checked && rgEW <= 0.5 * document.getElementById('starNameFrom').value) {
        writeStarNames();
    }

    //HIP
    ctx.fillStyle = starColor;
    function drawHIPstar(x, y, mag, c) {
        drawFilledCircle(x, y, size(mag), c);
        //回折による光の筋みたいなのを作りたい
    }
    for (i=0; i<HIPRAary.length; i++){
        var RA = HIPRAary[i];
        var Dec = HIPDecary[i];
        var mag = HIPmagary[i];
        let c = bv2color(HIPbvary[i]);
        if (mag > magLim) {
            continue;
        }
        if (mode == 'AEP') {
            [scrRA, scrDec] = RADec2scrAEP(RA, Dec);
            if (Math.abs(scrRA) < rgEW && Math.abs(scrDec) < rgNS) {
                drawHIPstar(...coordSH(scrRA, scrDec), mag, c)
            }
        } else if (mode == 'EtP') {
            if (Math.abs(RApos(RA)) < rgEW && Math.abs(Dec-cenDec) < rgNS) {
                drawHIPstar(...coord(RA, Dec), mag, c);
            }
        } else if (mode == 'view') {
            var [scrRA, scrDec] = RADec2scrview(RA, Dec, theta);
            if (Math.abs(scrRA) < rgEW && Math.abs(scrDec) < rgNS) {
                drawHIPstar(...coordSH(scrRA, scrDec), mag, c);
            }
        } else if (['live', 'ar'].includes(mode)) {
            var [A, h] = RADec2Ah(RA, Dec, theta);
            [scrRA, scrDec] = Ah2scrlive(A, h);
            if (Math.abs(scrRA) < rgEW && Math.abs(scrDec) < rgNS) {
                drawHIPstar(...coordSH(scrRA, scrDec), mag, c);
            }
        }
    }

    // 星座名
    ctx.font = '20px times new roman';
    if (document.getElementById('constNameCheck').checked && rgEW <= 0.5 * document.getElementById('constNameFrom').value) {
        ctx.fillStyle = textColor;
        for (i=0; i<89; i++){
            var RA = parseFloat(constPos[2*i]);
            var Dec = parseFloat(constPos[2*i+1]);
            var constName = CLnames[i];
            if (mode == 'AEP') {
                [scrRA, scrDec] = RADec2scrAEP(RA, Dec);
                if (Math.abs(scrRA) < rgEW && Math.abs(scrDec) < rgNS) {
                    [x, y] = coordSH(scrRA, scrDec);
                    ctx.fillText(constName, x-40, y-10);
                    infoList.push([constName + '座', x, y]);
                }
            } else if (mode == 'EtP') {
                if (Math.abs(RApos(RA)) < rgEW && Math.abs(Dec-cenDec) < rgNS) {
                    [x, y] = coord(RA, Dec);
                    ctx.fillText(constName, x-40, y-10);
                    infoList.push([constName + '座', x, y]);
                }
            } else if (mode == 'view') {
                [scrRA, scrDec] = RADec2scrview(RA, Dec);
                if (Math.abs(scrRA) < rgEW && Math.abs(scrDec) < rgNS) {
                    [x, y] = coordSH(scrRA, scrDec);
                    ctx.fillText(constName, x-40, y-10);
                    infoList.push([constName + '座', x, y]);
                }
            } else if (['live', 'ar'].includes(mode)) {
                var [A, h] = RADec2Ah(RA, Dec, theta);
                [scrRA, scrDec] = Ah2scrlive(A, h);
                if (Math.abs(scrRA) < rgEW && Math.abs(scrDec) < rgNS) {
                    [x, y] = coordSH(scrRA, scrDec);
                    ctx.fillText(constName, x-40, y-10);
                    infoList.push([constName + '座', x, y]);
                }
            }
        }
    }

    ctx.font = '16px serif';
    ctx.strokeStyle = objectColor;
    ctx.fillStyle = objectColor;

    if (document.getElementById('BayerFSCheck').checked) {
        writeBayer();
    }

    if (document.getElementById('MessierCheck').checked && rgEW <= 0.5 * document.getElementById('MessierFrom').value) {
        drawMessier();
    }

    if (document.getElementById('recsCheck').checked && rgEW <= 0.5 * document.getElementById('recsFrom').value) {
        drawRecs();
    }

    // メシエ以外
    if (document.getElementById('allNGCCheck').checked && rgEW <= 0.5 * document.getElementById('allNGCFrom').value) {
        drawNGC();
    }

    //5030"/yr

    //惑星、惑星の名前
    ctx.font = '20px serif';
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'left';

    if (document.getElementById('planetCheck').checked) {
        for (i=0; i<JPNplanets.length; i++){
            if (mode == 'AEP') {
                [x, y] = coordSH(...RADec2scrAEP(RAlist[i], Declist[i]));
            } else if (mode == 'EtP') {
                [x, y] = coord(RAlist[i], Declist[i]);
            } else if (mode == 'view') {
                [x, y] = coordSH(...RADec2scrview(RAlist[i], Declist[i]));
            } else if (['live', 'ar'].includes(mode)) {
                [x, y] = coordSH(...Ah2scrlive(...RADec2Ah(RAlist[i], Declist[i], theta)));
            }
            // 枠内に入っていて
            if (i != Obs_num && 0 < x < canvas.width && 0 < y < canvas.height) {
                if (i == 0){ // 太陽
                    var r = Math.max(canvas.width * (0.267 / dist_Sun) / rgEW / 2, 13);
                    drawFilledCircle(x, y, r, yellowColor);
                    if (document.getElementById('planetNameCheck').checked && rgEW <= 0.5 * document.getElementById('planetNameFrom').value) {
                        ctx.fillStyle = specialObjectNameColor;
                        ctx.fillText(JPNplanets[i], x+Math.max(0.8*r, 10), y-Math.max(0.8*r, 10));
                    }
                    infoList.push([JPNplanets[i], x, y]);
                } else if (i == 9) { // 月(地球から見たときだけ)
                    if (Obs_num == 3) {
                        var r = drawMoon();
                        if (document.getElementById('planetNameCheck').checked && rgEW <= 0.5 * document.getElementById('planetNameFrom').value) {
                            ctx.fillStyle = specialObjectNameColor;
                            ctx.fillText(JPNplanets[i], x+Math.max(0.8*r, 10), y-Math.max(0.8*r, 10));
                        }
                        infoList.push(['月', x, y]);
                    }
                } else if (i != 9) {// 太陽と月以外
                    var mag = Vlist[i];
                    drawFilledCircle(x, y, Math.max(size(mag), 0.5), '#F33');
                    if (document.getElementById('planetNameCheck').checked && rgEW <= 0.5 * document.getElementById('planetNameFrom').value) {
                        ctx.fillStyle = specialObjectNameColor;
                        ctx.fillText(JPNplanets[i], x, y);
                    }
                    infoList.push([JPNplanets[i], x, y]);
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
            function drawPlanetMotion(trackJD) {
                let [X, Y, Z] = calc(planets[Obs_num], trackJD);
                let [x, y, z] = calc(trackElem, trackJD);
                let [ra, dec, dist] = xyz_to_RADec(x-X, y-Y, z-Z);
                if (mode == 'AEP') {
                    [x, y] = coordSH(...RADec2scrAEP(ra, dec));
                } else if (mode == 'EtP') {
                    [x, y] = coord(ra, dec);
                } else if (mode == 'view') {
                    [x, y] = coordSH(...RADec2scrview(ra, dec));
                } else if (['live', 'ar'].includes(mode)) {
                    [x, y] = coordSH(...Ah2scrlive(...RADec2Ah(ra, dec, theta)));
                }
                // 枠内に入っていて
                if (0 < x && x < canvas.width && 0 < y && y < canvas.height) {
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
            let k = 0;
            while (trackJD - trackSpan >= showingJD - trackDuration) {
                trackJD -= trackSpan;
                k--;
                drawPlanetMotion(trackJD, k);
            }
            trackJD = JD;
            while (trackJD + trackSpan <= showingJD + trackDuration) {
                trackJD += trackSpan;
                k++;
                drawPlanetMotion(trackJD, k);
            }
        }
    }

    if (mode == 'view' && document.getElementById('gridCheck').checked) {
        var minAlt = Math.max(-90, Math.min(SHtoAh(rgEW, -rgNS)[1], cenAlt-rgNS));
        var maxAlt = Math.min( 90, Math.max(SHtoAh(rgEW,  rgNS)[1], cenAlt+rgNS));

        var altGridCalcIv = Math.min(rgEW, rgNS) / 20;
        var azmGridCalcIv = Math.min(altGridCalcIv / Math.max(cos(cenAlt*pi/180), 0.1), 8);
        var gridIvChoices = [0.5, 1, 2, 5, 10, 30, 45];
        ctx.strokeStyle = 'gray';

        var altGridIv = 45;
        for (i=0; i<gridIvChoices.length; i++) {
            if (gridIvChoices[i] > Math.min(rgNS, rgEW) / 3) {
                altGridIv = gridIvChoices[i];
                break;
            }
        }
        var azmGridIv = 45;
        for (i=0; i<gridIvChoices.length; i++) {
            if (gridIvChoices[i] > altGridIv / cos(cenAlt*pi/180)) {
                azmGridIv = gridIvChoices[i];
                break;
            }
        }

        var A, h, scrRA0, scrDec0, scrRA1, scrDec1, drawnFrag=false;
        function drawAzmAltLine (A, h, scrRA0, scrDec0) {
            [scrRA1, scrDec1] = RADec2scrview(...Ah2RADec(A, h, theta));
            if (j>0 && ((Math.abs(scrRA0)<rgEW && Math.abs(scrDec0)<rgNS) || (Math.abs(scrRA1)<rgEW && Math.abs(scrDec1)<rgNS))) {
                var [x1, y1] = coordSH(scrRA0, scrDec0);
                var [x2, y2] = coordSH(scrRA1, scrDec1);
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
            }
            [scrRA0, scrDec0] = [scrRA1, scrDec1];
            return [scrRA0, scrDec0];
        }
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
            var azmRange1 = (SHtoAh(-rgEW,  rgNS)[0] - cenAzm + 360) % 360;
            var azmRange2 = (SHtoAh(-rgEW,     0)[0] - cenAzm + 360) % 360;
            var azmRange3 = (SHtoAh(-rgEW, -rgNS)[0] - cenAzm + 360) % 360;
            var azmRange = Math.max(azmRange1, azmRange2, azmRange3);

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
    }

    var RAtext = `赤経 ${Math.floor(cenRA/15)}h ${((cenRA-15*Math.floor(cenRA/15))*4).toFixed(1)}m `;
    if (cenDec >= 0) {
        var Dectext = `赤緯 +${Math.floor(cenDec)}° ${Math.round((cenDec-Math.floor(cenDec))*60)}' (J2000.0) `;
    } else {
        var Dectext = `赤緯 -${Math.floor(-cenDec)}° ${Math.round((-cenDec-Math.floor(-cenDec))*60)}' (J2000.0) `;
    }

    var coordtext = `${constellation}　${rgtext}　${magLimtext}<br>${RAtext}${Dectext}<br>${Astr}${hstr}`;
    document.getElementById("coordtext").style.color = textColor;
    document.getElementById("coordtext").innerHTML = coordtext;

    function SkyArea(RA, Dec) { //(RA, Dec)はHelper2ndで↓行目（0始まり）の行数からのブロックに入ってる
        return parseInt(360 * Math.floor(Dec + 90) + Math.floor(RA));
    }

    function RApos(RA) {
        return (RA + 540 - cenRA) % 360 - 180;
    }

    function coord(RA, Dec) {
        var x = canvas.width * (0.5 - RApos(RA) / rgEW / 2);
        var y = canvas.height * (0.5 - (Dec - cenDec) / rgNS / 2);
        return [x, y];
    }

    function xy2scr(x, y) {
        var scrRA = rgEW * (1 - 2 * x / canvas.width);
        var scrDec = rgNS * (1 - 2 * y / canvas.height);
        return [scrRA, scrDec];
    }

    function RADec2scrAEP (RA, Dec) { //deg
        if (RA == cenRA && Dec == cenDec) {
            var scrRA = 0;
            var scrDec = 0;
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
            var scrRA = r * sin(thetaSH);
            var scrDec = - r * cos(thetaSH);
        }
        return [scrRA, scrDec];
    }

    function RADec2scrview (RA, Dec) {
        var t = theta - RA * pi/180;
        Dec *= pi/180;
        var [x, y, z] = Ry(Rz(Ry([-cos(t)*cos(Dec), sin(t)*cos(Dec), sin(Dec)], pi/2-lat_obs), cenAzm*pi/180), cenAlt*pi/180-pi/2);
        var b = Math.acos(z) * 180/pi;
        //var a = Math.atan2(y, x);
        var isr = b / Math.sqrt(x ** 2 + y ** 2);
        var scrRA = y * isr;
        var scrDec = -x * isr;
        return [scrRA, scrDec];
    }

    function Ah2scrlive (A, h) {
        A = (A - loadAzm - 90) * pi / 180;
        h *= pi/180;
        var [x, y, z] = Ry(Rx(Rz([cos(A)*cos(h), -sin(A)*cos(h), sin(h)], -dev_a), -dev_b), -dev_c);
        var b = Math.acos(-z) * 180/pi;
        //var a = Math.atan2(y, x);
        var scrRA = -b * x / Math.sqrt(x ** 2 + y ** 2);
        var scrDec = b * y / Math.sqrt(x ** 2 + y ** 2);
        return [scrRA, scrDec];
    }

    function scr2RADec (scrRA, scrDec) { //deg 画面中心を原点とし、各軸の向きはいつも通り
        if (scrRA == 0 && scrDec == 0) {
            var RA = cenRA;
            var Dec = cenDec;
        } else {
            var thetaSH = Math.atan2(scrRA, -scrDec);
            var r = Math.sqrt(scrRA*scrRA + scrDec*scrDec) * pi / 180;
            var cenDec_rad = cenDec * pi/180;

            var a =  sin(cenDec_rad)*sin(r)*cos(thetaSH) + cos(cenDec_rad)*cos(r);
            var b =                  sin(r)*sin(thetaSH);
            var c = -cos(cenDec_rad)*sin(r)*cos(thetaSH) + sin(cenDec_rad)*cos(r);

            var Dec = Math.asin(c) * 180/pi;
            var RA = ((Math.atan2(b, a) * 180/pi + cenRA) % 360 + 360) % 360;
        }
        return [RA, Dec];
    }

    function SHtoAh (scrRA, scrDec) { //deg 画面中心を原点とし、各軸の向きはいつも通り
        if (scrRA == 0 && scrDec == 0) {
            var A = cenAzm;
            var h = cenAlt;
        } else {
            var thetaSH = Math.atan2(scrRA, -scrDec); //地球から見て下から始めて時計回り
            var r = Math.sqrt(scrRA*scrRA + scrDec*scrDec) * pi / 180;

            var cenAzm_rad = cenAzm * pi/180;
            var cenAlt_rad = cenAlt * pi/180;
            var [x, y, z] = Rz(Ry([sin(r)*cos(thetaSH), sin(r)*sin(thetaSH), cos(r)], pi/2-cenAlt_rad), -cenAzm_rad);

            var h = Math.asin(z) * 180/pi;
            var A = ((Math.atan2(-y, x) * 180/pi) % 360 + 360) % 360;
        }
        return [A, h];
    }

    function coordSH (scrRA, scrDec) {
        var x = canvas.width * (0.5 - scrRA / rgEW / 2);
        var y = canvas.height * (0.5 - scrDec / rgNS / 2);
        return [x, y];
    }

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

    function size(mag) {
        if (mag > magLim) {
            return zerosize / (magLim + 1);
        } else {
            return zerosize * (magLim + 1 - mag) / (magLim + 1);
        }
    }

    function bv2color(bv) {
        let c;
        if (darker) {
            c = starColor;
        } else if (bv == 'nodata') {
            c = starColor;
        } else {
            bv = parseFloat(bv);
            if (bv > 1.4) {
                c = '#ff9999';
            } else if (bv > 0.8) {
                c = '#ffcc99';
            } else if (bv > 0.6) {
                c = '#ffffcc';
            } else if (bv > 0) {
                c = starColor;
            } else if (bv > -0.33) {
                c = '#ccffff';
            }
        }
        return c;
    }
    function drawStars (skyareas) {
        for (var arearange of skyareas) {
            var st = parseInt(Help[arearange[0]]);
            var fi = parseInt(Help[arearange[1]+1]);
            for (i=st; i<fi; i++) {
                var RA = parseFloat(Tycho[3*(i-1)]);
                var Dec = parseFloat(Tycho[3*(i-1)+1]);
                var mag = parseFloat(Tycho[3*(i-1)+2]);
                if (mag >= magLim) {
                    continue;
                }
                if (mode == 'AEP') {
                    var [scrRA, scrDec] = RADec2scrAEP(RA, Dec);
                    if (Math.abs(scrDec) < rgNS && Math.abs(scrRA) < rgEW) {
                        drawFilledCircle (...coordSH(scrRA, scrDec), size(mag));
                    }
                } else if (mode == 'EtP') {
                    if (Math.abs(Dec-cenDec) < rgNS && Math.abs(RApos(RA)) < rgEW) {
                        var [x, y] = coord(RA, Dec);
                        drawFilledCircle (...coord(RA, Dec), size(mag));
                    }
                } else if (mode == 'view') {
                    var [scrRA, scrDec] = RADec2scrview(RA, Dec);
                    if (Math.abs(scrDec) < rgNS && Math.abs(scrRA) < rgEW) {
                        drawFilledCircle (...coordSH(scrRA, scrDec), size(mag));
                    }
                } else if (['live', 'ar'].includes(mode)) {
                    var [A, h] = RADec2Ah(RA, Dec, theta);
                    var [scrRA, scrDec] = Ah2scrlive(A, h);
                    if (Math.abs(scrRA) < rgEW && Math.abs(scrDec) < rgNS) {
                        drawFilledCircle(...coordSH(scrRA, scrDec), size(mag));
                    }
                }
            }
        }
    }

    function drawStars1011 (skyareas) {
        for (var arearange of skyareas) {
            var st = parseInt(Help1011[arearange[0]]);
            var fi = parseInt(Help1011[arearange[1]+1]);
            for (i=st; i<fi; i++) {
                var RA = parseFloat(Tycho1011[3*(i-1)]);
                var Dec = parseFloat(Tycho1011[3*(i-1)+1]);
                var mag = parseFloat(Tycho1011[3*(i-1)+2]);
                if (mag >= magLim) {
                    continue;
                }
                if (mode == 'AEP') {
                    var [scrRA, scrDec] = RADec2scrAEP(RA, Dec);
                    if (Math.abs(scrDec) < rgNS && Math.abs(scrRA) < rgEW) {
                        drawFilledCircle(...coordSH(scrRA, scrDec), size(mag));
                    }
                } else if (mode == 'EtP') {
                    if (Math.abs(Dec-cenDec) < rgNS && Math.abs(RApos(RA)) < rgEW) {
                        drawFilledCircle(...coord(RA, Dec), size(mag));
                    }
                } else if (mode == 'view') {
                    var [scrRA, scrDec] = RADec2scrview(RA, Dec);
                    if (Math.abs(scrDec) < rgNS && Math.abs(scrRA) < rgEW) {
                        var [x, y] = coordSH(scrRA, scrDec);
                        drawFilledCircle(...coordSH(scrRA, scrDec), size(mag));
                    }
                } else if (['live', 'ar'].includes(mode)) {
                    var [A, h] = RADec2Ah(RA, Dec, theta);
                    var [scrRA, scrDec] = Ah2scrlive(A, h);
                    if (Math.abs(scrRA) < rgEW && Math.abs(scrDec) < rgNS) {
                        drawFilledCircle(...coordSH(scrRA, scrDec), size(mag));
                    }
                }
            }
        }
    }

    function writeBayer () {
        ctx.strokeStyle = objectColor;
        ctx.fillStyle = objectColor;
        for (i=0; i<BSCnum; i++){
            var RA = BSCRAary[i];
            var Dec = BSCDecary[i];
            const Greeks = ['Alp', 'Bet', 'Gam', 'Del', 'Eps', 'Zet', 'Eta', 'The', 'Iot', 'Kap', 'Lam', 'Mu', 'Nu', 'Xi', 'Omc', 'Pi', 'Rho', 'Sig', 'Tau', 'Ups', 'Phi', 'Chi', 'Psi', 'Ome'];
            const GreekLetters = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω'];
            if (Bayers[i] != '') {
                var name = GreekLetters[Greeks.indexOf(Bayers[i])];
                if (BayerNums[i] != '') {
                    name += BayerNums[i];
                }
                if (FSs[i] != '') {
                    name += '(' + FSs[i] + ')';
                }
            } else {
                var name = FSs[i];
            }
            if (mode == 'AEP') {
                var [scrRA, scrDec] = RADec2scrAEP(RA, Dec);
                if (Math.abs(scrRA) < rgEW && Math.abs(scrDec) < rgNS) {
                    drawObjects(name, ...coordSH(scrRA, scrDec), 0);
                }
            } else if (mode == 'EtP') {
                if (Math.abs(RApos(RA)) < rgEW && Math.abs(Dec-cenDec) < rgNS) {
                    drawObjects(name, ...coord(RA, Dec), 0);
                }
            } else if (mode == 'view') {
                var [scrRA, scrDec] = RADec2scrview(RA, Dec);
                if (Math.abs(scrRA) < rgEW && Math.abs(scrDec) < rgNS) {
                    drawObjects(name, ...coordSH(scrRA, scrDec), 0);
                }
            } else if (['live', 'ar'].includes(mode)) {
                var [A, h] = RADec2Ah(RA, Dec, theta);
                var [scrRA, scrDec] = Ah2scrlive(A, h);
                if (Math.abs(scrRA) < rgEW && Math.abs(scrDec) < rgNS) {
                    drawObjects(name, ...coordSH(scrRA, scrDec), 0);
                }
            }
        }
    }

    function drawJsonObjects (data, func, color=objectColor) {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        for (i=0; i<data.length; i++){
            var name = data[i].name;
            if (name == '') {
                continue;
            }
            var RA = rahm2deg(data[i].ra);
            var Dec = decdm2deg(data[i].dec);
            if (mode == 'AEP') {
                var [scrRA, scrDec] = RADec2scrAEP(RA, Dec);
                if (Math.abs(scrRA) < rgEW && Math.abs(scrDec) < rgNS) {
                    var [x, y] = coordSH(scrRA, scrDec);
                    func(i, name, x, y);
                }
            } else if (mode == 'EtP') {
                if (Math.abs(RApos(RA)) < rgEW && Math.abs(Dec-cenDec) < rgNS) {
                    var [x, y] = coord(RA, Dec);
                    func(i, name, x, y);
                }
            } else if (mode == 'view') {
                var [scrRA, scrDec] = RADec2scrview(RA, Dec);
                if (Math.abs(scrRA) < rgEW && Math.abs(scrDec) < rgNS) {
                    var [x, y] = coordSH(scrRA, scrDec);
                    func(i, name, x, y);
                }
            } else if (['live', 'ar'].includes(mode)) {
                var [A, h] = RADec2Ah(RA, Dec, theta);
                var [scrRA, scrDec] = Ah2scrlive(A, h);
                if (Math.abs(scrRA) < rgEW && Math.abs(scrDec) < rgNS) {
                    var [x, y] = coordSH(scrRA, scrDec);
                    func(i, name, x, y);
                }
            }
        }
    }

    function writeStarNames () {
        const tier_range = [180, 90, 60, 40];
        drawJsonObjects(
            starNames,
            function(i, name, x, y) {
                if (2*Math.max(rgNS, rgEW) <= tier_range[starNames[i].tier-1]) {
                    drawObjects(name, x, y+15, 0, fontsize=20);
                }
            },
            textColor
        );
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
        for (i=0; i<NGC.length/5; i++){
            var name = NGC[5*i];
            var RA = parseFloat(NGC[5*i+1]);
            var Dec = parseFloat(NGC[5*i+2]);
            var type = NGC[5*i+4];
            if (mode == 'AEP') {
                var [scrRA, scrDec] = RADec2scrAEP(RA, Dec);
                if (Math.abs(scrDec) < rgNS && Math.abs(scrRA) < rgEW) {
                    var [x, y] = coordSH(scrRA, scrDec);
                    drawObjects(name, x, y, type);
                }
            } else if (mode == 'EtP') {
                if (Math.abs(Dec-cenDec) < rgNS && Math.abs(RApos(RA)) < rgEW) {
                    var [x, y] = coord(RA, Dec);
                    drawObjects(name, x, y, type);
                }
            } else if (mode == 'view') {
                var [scrRA, scrDec] = RADec2scrview(RA, Dec);
                if (Math.abs(scrDec) < rgNS && Math.abs(scrRA) < rgEW) {
                    var [x, y] = coordSH(scrRA, scrDec);
                    drawObjects(name, x, y, type);
                }
            } else if (['live', 'ar'].includes(mode)) {
                var [A, h] = RADec2Ah(RA, Dec, theta);
                var [scrRA, scrDec] = Ah2scrlive(A, h);
                if (Math.abs(scrRA) < rgEW && Math.abs(scrDec) < rgNS) {
                    var [x, y] = coordSH(scrRA, scrDec);
                    drawObjects(name, x, y, type);
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

    function drawMoon () {
        var rs = RAlist[0] * pi/180;
        var ds = Declist[0] * pi/180;
        var rm = RAlist[9] * pi/180;
        var dm = Declist[9] * pi/180;
        var r = Math.max(canvas.width * (0.259 / (dist_Moon / 384400)) / rgEW / 2, 13);
        var lon_sun = Ms + 0.017 * sin(Ms + 0.017 * sin(Ms)) + ws;
        var k = (1 - cos(lon_sun-lon_moon) * cos(lat_moon)) / 2;

        //Pは赤経の負方向（右）から月を時計回りに見て黄色から黒になるところの角度
        if (mode == 'AEP') {
            var P = Math.atan2(cos(ds)*sin(rm-rs), -sin(dm)*cos(ds)*cos(rm-rs)+cos(dm)*sin(ds));
            var RA1 = (rm - 0.2*cos(P) / cos(dm)) * 180 / pi;
            var Dec1 = (dm - 0.2*sin(P)) * 180 / pi;
            var [scrRA1, scrDec1] = RADec2scrAEP(RA1, Dec1);
            var [x1, y1] = coordSH(scrRA1, scrDec1);
            P = Math.atan2(y1-y, x1-x);
        } else if (mode == 'EtP') {
            var P = Math.atan2(cos(ds)*sin(rm-rs), -sin(dm)*cos(ds)*cos(rm-rs)+cos(dm)*sin(ds));
        } else if (mode == 'view') {
            var P = Math.atan2(cos(ds)*sin(rm-rs), -sin(dm)*cos(ds)*cos(rm-rs)+cos(dm)*sin(ds));
            var RA1 = (rm - 0.2*cos(P) / cos(dm)) * 180 / pi;
            var Dec1 = (dm - 0.2*sin(P)) * 180 / pi;
            var [scrRA1, scrDec1] = RADec2scrview(RA1, Dec1);
            var [x1, y1] = coordSH(scrRA1, scrDec1);
            P = Math.atan2(y1-y, x1-x);
        } else if (['live', 'ar'].includes(mode)) {
            var P = Math.atan2(cos(ds)*sin(rm-rs), -sin(dm)*cos(ds)*cos(rm-rs)+cos(dm)*sin(ds));
            var RA1 = (rm - 0.2*cos(P) / cos(dm)) * 180 / pi;
            var Dec1 = (dm - 0.2*sin(P)) * 180 / pi;
            var [A1, h1] = RADec2Ah(RA1, Dec1, theta);
            var [scrRA1, scrDec1] = Ah2scrlive(A1, h1);
            var [x1, y1] = coordSH(scrRA1, scrDec1);
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

    function drawAov() {
        let aovs = [['85-cmos', 1.80, 1.24], ['128-cmos', 1.36, 0.91]];
        if (document.getElementById('aovCheck').checked && ['AEP', 'view'].includes(mode)) {
            let aovLabel = '';
            for (i=0; i<document.getElementsByName('aov').length; i++){
                if (document.getElementsByName('aov').item(i).checked){
                    aovLabel = document.getElementsByName('aov').item(i).value;
                }
            }
            for (var aov of aovs) {
                if (aovLabel == aov[0]) {
                    let aovRotation = aovSliderElem.value * pi / 180;
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

function rahm2deg(rahmtext) {
    let rahm = rahmtext.split(' ').map(parseFloat);
    return rahm[0] * 15 + rahm[1] / 4;
}

function decdm2deg(decdmtext) {
    let decdm = decdmtext.split(' ').map(parseFloat);
    let dec = Math.abs(decdm[0]) + decdm[1] / 60;
    if (decdmtext[0] == '-') {
        dec *= -1;
    }
    return dec;
}

function RADec2Ah (RA, Dec, theta) { //deg
    RA *= pi/180;
    Dec *= pi/180;
    var [x, y, z] = Ry([sin(Dec), cos(Dec)*sin(theta-RA), cos(Dec)*cos(theta-RA)], -lat_obs);
    var A = (Math.atan2(-y, x) * 180/pi + 360) % 360;
    var h = Math.asin(z) * 180/pi;
    return [A, h]; //deg
}

function Ah2RADec (A, h, theta) {
    A *= pi/180;
    h *= pi/180;
    var [x, y, z] = Ry([cos(h)*cos(A), -cos(h)*sin(A), sin(h)], lat_obs);
    var RA = ((theta - Math.atan2(y, z)) * 180/pi + 360) % 360;
    var Dec = Math.asin(x) * 180/pi;
    return [RA, Dec]; //deg
}

function scr2RADec (scrRA, scrDec) { //deg 画面中心を原点とし、各軸の向きはいつも通り
    if (scrRA == 0 && scrDec == 0) {
        var RA = cenRA;
        var Dec = cenDec;
    } else {
        var thetaSH = Math.atan2(scrRA, -scrDec);
        var r = Math.sqrt(scrRA*scrRA + scrDec*scrDec) * pi / 180;
        var cenDec_rad = cenDec * pi/180;

        var a =  sin(cenDec_rad)*sin(r)*cos(thetaSH) + cos(cenDec_rad)*cos(r);
        var b =                  sin(r)*sin(thetaSH);
        var c = -cos(cenDec_rad)*sin(r)*cos(thetaSH) + sin(cenDec_rad)*cos(r);

        var Dec = Math.asin(c) * 180/pi;
        var RA = ((Math.atan2(b, a) * 180/pi + cenRA) % 360 + 360) % 360;
    }
    return [RA, Dec];
}

function SHtoAh (scrRA, scrDec) { //deg 画面中心を原点とし、各軸の向きはいつも通り
    if (scrRA == 0 && scrDec == 0) {
        var A = cenAzm;
        var h = cenAlt;
    } else {
        var thetaSH = Math.atan2(scrRA, -scrDec); //地球から見て下から始めて時計回り
        var r = Math.sqrt(scrRA*scrRA + scrDec*scrDec) * pi / 180;

        var cenAzm_rad = cenAzm * pi/180;
        var cenAlt_rad = cenAlt * pi/180;
        var [x, y, z] = Rz(Ry([sin(r)*cos(thetaSH), sin(r)*sin(thetaSH), cos(r)], pi/2-cenAlt_rad), -cenAzm_rad);

        var h = Math.asin(z) * 180/pi;
        var A = (Math.atan2(-y, x) * 180/pi % 360 + 360) % 360;
    }
    return [A, h];
}

function screen2liveAh (scrRA, scrDec) {
    var scrTheta = Math.atan2(scrDec, -scrRA); //画面上で普通に極座標
    var r = Math.sqrt(scrRA*scrRA + scrDec*scrDec) * pi / 180;
    var [x, y, z] = Rz(Rx(Ry([sin(r)*cos(scrTheta), sin(r)*sin(scrTheta), -cos(r)], dev_c), dev_b), dev_a);
    var h = Math.asin(z) * 180/pi;
    var A = ((Math.atan2(-y, x) * 180/pi + loadAzm + 90) % 360 + 360) % 360;
    return [A, h];
}

function sin(a){return Math.sin(a)}
function cos(a){return Math.cos(a)}

function Rx([x, y, z], a) {
    return [x, cos(a)*y-sin(a)*z, sin(a)*y+cos(a)*z];
}

function Ry ([x, y, z], a) {
    return [cos(a)*x+sin(a)*z, y, -sin(a)*x+cos(a)*z];
}

function Rz ([x, y, z], a) {
    return [cos(a)*x-sin(a)*y, sin(a)*x+cos(a)*y, z];
}

//入力や変数をもとにURLとlocalStorageを修正し、観測地についての変数を設定し、showingDataを設定し、showingJDを計算する
function newSetting() {
    ObsPlanet = document.getElementById("observer").value;
    Obs_num = JPNplanets.indexOf(ObsPlanet);

    // 視点
    if (ObsPlanet == '地球') {
        if (url.searchParams.has('observer')) {
            url.searchParams.delete('observer');
        }
        localStorage.setItem('observer_planet', 'Earth');
    } else {
        url.searchParams.set('observer', ENGplanets[Obs_num].split(' ').join('').split('/').join(''));
        localStorage.setItem('observer_planet', ENGplanets[Obs_num].split(' ').join('').split('/').join(''));
    }

    for (var i=0; i<zuhoElem.length; i++) {
        if (zuhoElem[i].checked) {
            mode = zuhoElem[i].value;
            url.searchParams.set('mode', mode);
            localStorage.setItem('mode', mode);
            break;
        }
    }
    turnOnOffLiveMode(mode);

    url.searchParams.set('magkey', document.getElementById('magLimitSlider').value);
    localStorage.setItem('magkey', document.getElementById('magLimitSlider').value);
    if (['live', 'ar'].includes(mode)) {
        magLimLim = 6.5;
    } else {
        magLimLim = 11;
    }
    magLim = find_magLim(magkey1, magkey2);
    zerosize = find_zerosize();

    if (document.getElementById("NSCombo").value == '北緯') {
        lat_obs = document.getElementById('lat').value * pi/180;
        lattext = document.getElementById('lat').value + "°N";
        if (document.getElementById('lat').value == '35') {
            if (url.searchParams.has('lat')) {
                url.searchParams.delete('lat');
            }
            localStorage.setItem('lat', '35');
        } else {
            url.searchParams.set('lat', document.getElementById('lat').value);
            localStorage.setItem('lat', document.getElementById('lat').value);
        }
    } else {
        lat_obs = -document.getElementById('lat').value * pi/180;
        lattext = document.getElementById('lat').value + "°S";
        url.searchParams.set('lat', -document.getElementById('lat').value);
        localStorage.setItem('lat', -document.getElementById('lat').value);
    }

    if (document.getElementById("EWCombo").value == '東経') {
        lon_obs = document.getElementById('lon').value * Math.PI/180;
        lontext = document.getElementById('lon').value + "°E";
        if (document.getElementById('lon').value == '135') {
            if (url.searchParams.has('lon')) {
                url.searchParams.delete('lon');
            }
            localStorage.setItem('lon', '135');
        } else {
            url.searchParams.set('lon', document.getElementById('lon').value);
            localStorage.setItem('lon', document.getElementById('lon').value);
        }
    } else {
        lon_obs = -document.getElementById('lon').value * Math.PI/180;
        lontext = document.getElementById('lon').value + "°W";
        url.searchParams.set('lon', -document.getElementById('lon').value);
        localStorage.setItem('lon', -document.getElementById('lon').value);
    }

    setRealtime(); //timeのURL, localStorageもやる
    timeSliderElem.value = 0;
    timeSliderValue = 0;

    //history.replaceState('', '', url.href);

    calculation(showingJD);
}

function setRealtime() {
    var ymdhm = new Date();
    document.getElementById('showingData').style.color = textColor;
    if (realtimeElem[0].checked) {
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
        url.searchParams.set('time', `${y}-${m}-${d}-${h}-${mi}`);
        localStorage.setItem('time', `${y}-${m}-${d}-${h}-${mi}`);
    } else if (realtimeElem[1].checked) {
        timeSliderElem.style.visibility = 'hidden';
        var [y, m, d, h, mi] = [ymdhm.getFullYear(), ymdhm.getMonth()+1, ymdhm.getDate(), ymdhm.getHours(), parseFloat((ymdhm.getMinutes()+ymdhm.getSeconds()/60).toFixed(1))];
        document.getElementById('showingData').innerHTML = `${y}/${m}/${d} ${h}:${mi.toString().padStart(2, '0')} (JST) ${lattext} ${lontext}`;
        showingJD = YMDHM_to_JD(y, m, d, h, mi);
        if (intervalId !== null) {
            clearInterval(intervalId);
            intervalId = null;
        }
        intervalId = setInterval(realtimeRadec, 500);
        setYMDHM(y, m, d, h, mi);
        url.searchParams.set('time', `${y}-${m}-${d}-${h}-${mi}`);
        localStorage.setItem('time', `${y}-${m}-${d}-${h}-${mi}`);
    } else if (realtimeElem[2].checked) {
        timeSliderElem.style.visibility = 'hidden';
        var [y, m, d, h, mi] = [ymdhm.getFullYear(), ymdhm.getMonth()+1, ymdhm.getDate(), ymdhm.getHours(), parseFloat((ymdhm.getMinutes()+ymdhm.getSeconds()/60).toFixed(1))];
        document.getElementById('showingData').innerHTML = `${y}/${m}/${d} ${h}:${mi.toString().padStart(2, '0')} (JST) ${lattext} ${lontext}`;
        showingJD = YMDHM_to_JD(y, m, d, h, mi);
        if (intervalId !== null) {
            clearInterval(intervalId);
            intervalId = null;
        }
        intervalId = setInterval(realtimeAzmalt, 500);
        setYMDHM(y, m, d, h, mi);
        url.searchParams.set('time', `${y}-${m}-${d}-${h}-${mi}`);
        localStorage.setItem('time', `${y}-${m}-${d}-${h}-${mi}`);
    }
    history.replaceState('', '', url.href);
}

function realtimeOff() {
    realtimeElem[1].checked = false;
    realtimeElem[2].checked = false;
    realtimeElem[0].checked = true;
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
    url.searchParams.set('time', `${y}-${m}-${d}-${h}-${mi}`);
    localStorage.setItem('time', `${y}-${m}-${d}-${h}-${mi}`);
}

function realtimeRadec() {
    var ymdhm = new Date();
    if (ymdhm.getSeconds() % 6 == 0 && ymdhm.getMilliseconds() < 500) {
        var [y, m, d, h, mi] = [ymdhm.getFullYear(), ymdhm.getMonth()+1, ymdhm.getDate(), ymdhm.getHours(), (ymdhm.getMinutes()+ymdhm.getSeconds()/60).toFixed(1)];
        document.getElementById('showingData').style.color = textColor;
        document.getElementById('showingData').innerHTML = `${y}/${m}/${d} ${h}:${mi.padStart(2, '0')} (JST) ${lattext} ${lontext}`;
        url.searchParams.set('time', `${y}-${m}-${d}-${h}-${mi}`);
        localStorage.setItem('time', `${y}-${m}-${d}-${h}-${mi}`);
        history.replaceState('', '', url.href);
        setYMDHM(y, m, d, h, mi);
        showingJD = YMDHM_to_JD(y, m, d, h, mi);
        calculation(showingJD);
        [cenAzm, cenAlt] = RADec2Ah(cenRA, cenDec, theta);
        show_main();
    }
}

function realtimeAzmalt() {
    var ymdhm = new Date();
    if (ymdhm.getSeconds() % 6 == 0 && ymdhm.getMilliseconds() < 500) {
        var [y, m, d, h, mi] = [ymdhm.getFullYear(), ymdhm.getMonth()+1, ymdhm.getDate(), ymdhm.getHours(), (ymdhm.getMinutes()+ymdhm.getSeconds()/60).toFixed(1)];
        document.getElementById('showingData').style.color = textColor;
        document.getElementById('showingData').innerHTML = `${y}/${m}/${d} ${h}:${mi.padStart(2, '0')} (JST) ${lattext} ${lontext}`;
        url.searchParams.set('time', `${y}-${m}-${d}-${h}-${mi}`);
        localStorage.setItem('time', `${y}-${m}-${d}-${h}-${mi}`);
        history.replaceState('', '', url.href);
        setYMDHM(y, m, d, h, mi);
        showingJD = YMDHM_to_JD(y, m, d, h, mi);
        calculation(showingJD);
        [cenRA, cenDec] = Ah2RADec(cenAzm, cenAlt, theta);
        show_main();
    }
}

function loadFiles() {
    function xhrHIP(data) {
        const DataAry = data.split(',');
        var num_of_stars = DataAry.length / 4;
        HIPRAary = Array(num_of_stars);
        HIPDecary = Array(num_of_stars);
        HIPmagary = Array(num_of_stars);
        HIPbvary = Array(num_of_stars);
        for (i=0; i<num_of_stars; i++){
            HIPRAary[i] = parseFloat(DataAry[4*i]);
            HIPDecary[i] = parseFloat(DataAry[4*i+1]);
            HIPmagary[i] = parseFloat(DataAry[4*i+2]);
            HIPbvary[i] = DataAry[4*i+3];
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
            BSCRAary[i] = parseFloat(BSC[6*i]);
            BSCDecary[i] = parseFloat(BSC[6*i+1]);
            FSs[i] = BSC[6*i+2];
            Bayers[i] = BSC[6*i+3];
            BayerNums[i] = BSC[6*i+4];
        }
    }

    //追加天体
    function xhrExtra(data) {
        extra = data.split('\n');
        for (var i=0; i<extra.length; i++) {
            if (extra[i].length == 0) {
                break;
            }
            var extraLine = extra[i].split(' ');
            var name = extraLine[1];
            for (var j=2; j<parseInt(extraLine[0])+1; j++) {
                name += ' ' + extraLine[j];
            }
            ENGplanets.push(name);
            JPNplanets.push(name);

            var New = [];
            for (var j=parseInt(extraLine[0])+1; j<extraLine.length-4; j++) {
                New.push(parseFloat(extraLine[j]));
            }
            planets.push(New);

            const option1 = document.createElement('option');
            option1.innerHTML = name;
            document.getElementById('observer').appendChild(option1);
        }

        if (url.searchParams.has('observer')) {
            for (var j=0; j<ENGplanets.length; j++) {
                if (url.searchParams.get('observer') == ENGplanets[j].split(' ').join('').split('/').join('')) {
                    document.getElementById("observer").value = JPNplanets[j];
                    break;
                }
            }
            defaultcheck++;
        } else if (localStorage.getItem('observer_planet') != null && localStorage.getItem('observer_planet') != 'Earth') {
            for (var j=0; j<ENGplanets.length; j++) {
                if (localStorage.getItem('observer_planet') == ENGplanets[j].split(' ').join('').split('/').join('')) {
                    document.getElementById("observer").value = JPNplanets[j];
                    break;
                }
            }
            defaultcheck++;
        } else {
            defaultcheck++;
        }
    }
    if (online) {
        function loadFile(filename, func) {
            var url_load = "https://peteworden.github.io/Soleil/data/" + filename + ".txt";
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url_load);
            xhr.send();
            xhr.onreadystatechange = function() {
                if(xhr.readyState === 4 && xhr.status === 200) {
                    func(xhr.responseText);
                    xhrcheck++;
                    console.log(`${xhrcheck} ${defaultcheck} ${filename}.txt is ready`);
                    show_initial();
                    return 0;
                }
            }
        }

        //HIP
        loadFile("hip_65", xhrHIP);

        //Tycho
        loadFile("tycho2_100", (data) => {
            Tycho = data.split(',');
        });

        //Tycho helper
        loadFile("tycho2_100_helper", (data) => {
            Help = data.split(',');
        });

        //Tycho 10~11 mag
        loadFile("tycho2_100-110", (data) => {
            Tycho1011 = data.split(',');
        });

        //Tycho helper 10~11 mag
        loadFile("tycho2_100-110_helper", (data) => {
            Help1011 = data.split(',');
        });

        //Bayer
        loadFile("brights", xhrBSC);

        //Messier
        function fetchJsonData(filename, func) {
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
                console.log(`${xhrcheck} ${defaultcheck} ${filename}.json is ready`);
                show_initial();
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });
        }

        fetchJsonData('starname', (data) => {
            starNames = data;
        })

        fetchJsonData('messier', (data) => {
            messier = data;
        });

        fetchJsonData('rec', (data) => {
            recs = data;
        });

        // NGC天体とIC天体
        loadFile("ngc", (data) => {
            NGC = data.split(',');
        });

        //星座名
        loadFile("constellation_names", (data) => {
            CLnames = data.split('\r\n');
        });

        //星座の位置
        loadFile("constellation_coordinates", (data) => {
            constPos = data.split(',');
        });

        //星座線
        loadFile("constellation_lines", (data) => {
            lines = data.split(',');
        });

        //星座境界線
        loadFile("constellation_boundaries", (data) => {
            boundary = data.split(',');
        });

        //追加天体
        loadFile("additional_objects", xhrExtra);
    } else {
        document.getElementById('getFile').addEventListener('change', function () {
            let fr = new FileReader();
            fr.onload = function () {
                const content = fr.result.split('||||');
                for (var i=0; i<15; i++) {
                    fn = content[i].split('::::')[0];
                    var data = content[i].split('::::')[1];
                    if (fn == 'hip_65') {xhrHIP(data);}
                    if (fn == 'tycho2_100') {Tycho = data.split(',');}
                    if (fn == 'tycho2_100_helper') {Help = data.split(',');}
                    if (fn == 'tycho2_100-110_helper') {Tycho1011 = data.split(',');}
                    if (fn == 'tycho2_100-110_helper') {Help1011 = data.split(',');}
                    if (fn == 'brights') {xhrBSC(data);}
                    if (fn == 'starname') {starNames = JSON.parse(data);}
                    if (fn == 'messier') {messier = JSON.parse(data);}
                    if (fn == 'rec') {recs = JSON.parse(data);}
                    if (fn == 'ngc') {NGC = data.split(',');}
                    if (fn == 'constellation_names') {CLnames = data.split('\r\n');}
                    if (fn == 'constellation_coordinates') {constPos = data.split(',');}
                    if (fn == 'constellation_lines') {lines = data.split(',');}
                    if (fn == 'constellation_boundaries') {boundary = data.split(',');}
                    if (fn == 'additional_objects') {xhrExtra(data);}
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
        cenRA = parseFloat(url.searchParams.get('RA'));
        localStorage.setItem('RA', cenRA);
        defaultcheck++;
        show_initial();
    } else if (localStorage.getItem('RA') != null) {
        cenRA = parseFloat(localStorage.getItem('RA'));
        url.searchParams.set('RA', cenRA);
        defaultcheck++;
        show_initial();
    } else {
        url.searchParams.set('RA', cenRA);
        localStorage.setItem('RA', cenRA);
        defaultcheck++;
        show_initial();
    }

    if (url.searchParams.has('Dec') && !isNaN(url.searchParams.get('Dec'))) {
        cenDec = parseFloat(url.searchParams.get('Dec'));
        localStorage.setItem('Dec', cenDec);
        defaultcheck++;
        show_initial();
    } else if (localStorage.getItem('Dec') != null) {
        cenDec = parseFloat(localStorage.getItem('Dec'));
        url.searchParams.set('Dec', cenDec);
        defaultcheck++;
        show_initial();
    } else {
        url.searchParams.set('Dec', cenDec);
        localStorage.setItem('Dec', cenDec);
        defaultcheck++;
        show_initial();
    }

    if (url.searchParams.has('azm') && !isNaN(url.searchParams.get('azm'))) {
        cenAzm = parseFloat(url.searchParams.get('azm'));
        localStorage.setItem('azm', cenAzm);
        defaultcheck++;
        show_initial();
    } else if (localStorage.getItem('azm') != null) {
        cenAzm = parseFloat(localStorage.getItem('azm'));
        url.searchParams.set('azm', cenAzm);
        defaultcheck++;
        show_initial();
    } else {
        url.searchParams.set('azm', cenAzm);
        localStorage.setItem('azm', cenAzm);
        defaultcheck++;
        show_initial();
    }

    if (url.searchParams.has('alt') && !isNaN(url.searchParams.get('alt'))) {
        cenAlt = parseFloat(url.searchParams.get('alt'));
        localStorage.setItem('alt', cenAlt);
        defaultcheck++;
        show_initial();
    } else if (localStorage.getItem('alt') != null) {
        cenAlt = parseFloat(localStorage.getItem('alt'));
        url.searchParams.set('alt', cenAlt);
        defaultcheck++;
        show_initial();
    } else {
        url.searchParams.set('alt', cenAlt);
        localStorage.setItem('alt', cenAlt);
        defaultcheck++;
        show_initial();
    }

    if (url.searchParams.has('time')) {
        var [y, m, d, h, mi] = url.searchParams.get('time').split('-');
        setYMDHM(y, m, d, h, mi);
        showingJD = YMDHM_to_JD(y, m, d, h, mi);
        realtimeOff();
        defaultcheck++;
        show_initial();
    } else if (localStorage.getItem('time') != null) {
        var [y, m, d, h, mi] = localStorage.getItem('time').split('-');
        setYMDHM(y, m, d, h, mi);
        showingJD = YMDHM_to_JD(y, m, d, h, mi);
        realtimeOff();
        defaultcheck++;
        show_initial();
    } else {
        now();
        defaultcheck++;
        show_initial();
    }

    if (url.searchParams.has('mode') && ['AEP', 'EtP', 'view', 'live', 'ar'].includes(url.searchParams.get('mode'))) {
        mode = url.searchParams.get('mode');
        for (var i=0; i<zuhoElem.length; i++) {
            if (zuhoElem[i].value == mode) {
                zuhoElem[i].checked = true;
                break;
            }
        }
        turnOnOffLiveMode(mode);
        defaultcheck++;
        show_initial();
    } else {
        for (var i=0; i<zuhoElem.length; i++) {
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
        rgtext = `視野(左右):${(rgEW * 2).toFixed(1)}°`;
        if (['live', 'ar'].includes(mode)) {
            magLimLim = 6.5;
        } else {
            magLimLim = 11;
        }
        magLim = find_magLim(magkey1, magkey2);
        zerosize = find_zerosize();
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
        magLim = find_magLim(magkey1, magkey2);
        zerosize = find_zerosize();
        defaultcheck++;
        show_initial();
    } else {
        defaultcheck++;
        show_initial();
    }

    if (url.searchParams.has('lat') && !isNaN(url.searchParams.get('lat'))) {
        var lat_obs = url.searchParams.get('lat') * pi/180;
        if (lat_obs >= 0) {
            document.getElementById("NSCombo").value = '北緯';
            document.getElementById('lat').value = url.searchParams.get('lat');
        } else {
            document.getElementById("NSCombo").value = '南緯';
            document.getElementById('lat').value = -url.searchParams.get('lat');
        }
        defaultcheck++;
        show_initial();
    } else {
        defaultcheck++;
        show_initial();
    }

    if (url.searchParams.has('lon') && !isNaN(url.searchParams.get('lon'))) {
        var lon_obs = url.searchParams.get('lon') * pi/180;
        if (lon_obs >= 0) {
            document.getElementById("EWCombo").value = '東経';
            document.getElementById('lon').value = url.searchParams.get('lon');
        } else {
            document.getElementById("EWCombo").value = '西経';
            document.getElementById('lon').value = -url.searchParams.get('lon');
        }
        defaultcheck++;
        show_initial();
    } else {
        defaultcheck++;
        show_initial();
    }
}


function deviceOrientation(event) {
    if (os == 'iphone' && loadAzm == 0) {
        loadAzm = event.webkitCompassHeading;
    }
    var orientationTime2 = Date.now();
    if (orientationTime2 - orientationTime1 > 100) {
        orientationTime1 = orientationTime2;
        if (Math.max(Math.abs(dev_a-event.alpha), Math.abs(dev_b-event.beta), Math.abs(dev_c-event.gamma)) < 10) {
            if (dev_a_array.length > 2) {
                dev_a_sum += event.alpha*pi/180 - dev_a_array.pop();
                dev_b_sum += event.beta*pi/180 - dev_b_array.pop();
                dev_c_sum += event.gamma*pi/180 - dev_c_array.pop();
                dev_a_array.unshift(event.alpha*pi/180);
                dev_b_array.unshift(event.beta*pi/180);
                dev_c_array.unshift(event.gamma*pi/180);
                moving = (Math.abs(dev_a_sum / 3 - dev_a) > 0.2);
                dev_a = dev_a_sum / 3;
                dev_b = dev_b_sum / 3;
                dev_c = dev_c_sum / 3;
            } else {
                dev_a_sum += event.alpha*pi/180;
                dev_b_sum += event.beta*pi/180;
                dev_c_sum += event.gamma*pi/180;
                dev_a_array.unshift(event.alpha*pi/180);
                dev_b_array.unshift(event.beta*pi/180);
                dev_c_array.unshift(event.gamma*pi/180);
                dev_a = dev_a_sum / dev_a_array.length;
                dev_b = dev_b_sum / dev_b_array.length;
                dev_c = dev_c_sum / dev_c_array.length;
            }
        } else {
            dev_a = event.alpha*pi/180;
            dev_b = event.beta*pi/180;
            dev_c = event.gamma*pi/180;
            dev_a_sum = dev_a + 0;
            dev_b_sum = dev_b + 0;
            dev_c_sum = dev_c + 0;
            dev_a_array = [dev_a];
            dev_b_array = [dev_b];
            dev_c_array = [dev_c];
        }
        show_initial();
    }
}

document.getElementById('title').addEventListener('click', (event) => {
    if (event.detail === 5) {
        window.location.href = 'chart_beta.html';
    }
})

document.body.appendChild(canvas);