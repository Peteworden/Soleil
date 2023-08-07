const canvas = document.createElement('canvas');
  
canvas.width = 1100;
canvas.height = 500;

const ctx = canvas.getContext('2d');

const rgW = 30;
const rgN = 2.5;

const maglimW = 6.5;
const maglimN = 10;

const zerosizeW = 5;
const zerosizeN = 10;

var xhrcheck = 0;

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
var extra = [];
var extraurl = "https://peteworden.github.io/Soleil/ExtraPlanet.txt";
var xhrX = new XMLHttpRequest();

xhrX.open('GET', extraurl);
xhrX.send();
xhrX.onreadystatechange = function() {
    if(xhrX.readyState === 4 && xhrX.status === 200) {
        extra = xhrX.responseText.split(' ');
        console.log("extra ready");
        xhrcheck++;
        show_initial();
    }
}

/*
//SBDL
var fromSBDL = [];
var sbdlurl = 'https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=' + '31416' + '&full-prec=true&phys-par=true'
var xhrsbdl = new XMLHttpRequest();

xhrsbdl.open('GET', sbdlurl);
xhrsbdl.send();
xhrsbdl.onreadystatechange = function() {
    if(xhrsbdl.readyState === 4 && xhrsbdl.status === 200) {
        sbdl = xhrsbdl.responseText.split(' ');
        console.log("sbdl ready");
        xhrcheck++;
        show_initial();
    }
}
*/

var shiftRA = 0;
var shiftDec = 0;
var showingJD = 0;

function now() {
    var ymdhm = new Date();
    var [y, m, d, h] = [ymdhm.getFullYear(), ymdhm.getMonth()+1, ymdhm.getDate(), ymdhm.getHours()+Math.round(ymdhm.getMinutes()*10/60)/10];
    document.getElementById('yearText').value = y;
    document.getElementById('monthText').value = m;
    document.getElementById('dateText').value = d;
    document.getElementById('hourText').value = h;
    showingJD = YMDH_to_JD(y, m, d, h);
    show_main(showingJD);
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
    D = F - Math.floor(30.59 * G);
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
    if (xhrcheck == 7){
        show();
    }
}

function show() {
    let year = parseInt(document.getElementById('yearText').value);
    let month = parseInt(document.getElementById('monthText').value);
    let date = parseInt(document.getElementById('dateText').value);
    let hour = parseFloat(document.getElementById('hourText').value);
    showingJD = YMDH_to_JD(year, month, date, hour);
    show_main(showingJD);
}

function show_JD_plus1(){
    showingJD += 1;
    var [Y, M, D, H] = JD_to_YMDH(showingJD);
    document.getElementById('yearText').value = Y;
    document.getElementById('monthText').value = M;
    document.getElementById('dateText').value = D;
    document.getElementById('hourText').value = H;
    console.log("check236");
    show_main(showingJD);
}

function show_JD_minus1(){
    showingJD -= 1;
    var [Y, M, D, H] = JD_to_YMDH(showingJD);
    document.getElementById('yearText').value = Y;
    document.getElementById('monthText').value = M;
    document.getElementById('dateText').value = D;
    document.getElementById('hourText').value = H;
    show_main(showingJD);
}

function show_RA_plus2() {
    shiftRA += 2;
    show_main(showingJD);
}

function show_RA_minus2() {
    shiftRA -= 2;
    show_main(showingJD);
}

function show_Dec_plus2() {
    shiftDec += 2;
    show_main(showingJD);
}

function show_Dec_minus2() {
    shiftDec -= 2;
    show_main(showingJD);
}

function viewreset() {
    shiftRA = 0;
    shiftDec = 0;
    show_main(showingJD);
}

function show_main(JD){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#003';
    ctx.fillRect(0, 0, canvas.height, canvas.height);
    
    const eps = 0.4090926; //黄道傾斜角
    const sine = sin(eps);
    const cose = cos(eps);
    pi = Math.PI;

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
    const JPNplanets = ['太陽',  '水星', '金星', '地球', '火星',  '木星', '土星', '天王星', '海王星', '月', 'Ceres', 'Vesta'];

    const OriginalNumOfPlanets = planets.length;

    // 視点
    const ObsPlanet = document.getElementById("viewpoint").value;
    const Obs_num = JPNplanets.indexOf(ObsPlanet);

    // 観測対象
    var Name = document.getElementById("object").value;
    var Selected_number = JPNplanets.indexOf(Name);

    if (extra.length != 0) {
        var name = extra[1];
        for (var i=2; i<parseInt(extra[0])+1; i++) {
            name += ' ' + extra[i];
        }
        console.log(name);
        JPNplanets.push(name);
        var New = [];
        for (var i=parseInt(extra[0])+1; i<extra.length-4; i++) {
            New.push(parseFloat(extra[i]));
        }
        planets.push(New);
    }

    if (Obs_num == Selected_number) {
        if (Obs_num != 3) {
            alert("観測地点と対象天体は別にしてください。\n代わりに地球を表示します。");
            Name = "地球";
            Selected_number = 3;
            document.getElementById("object").options[3].selected = true;
        }
        else {
            alert("観測地点と対象天体は別にしてください。\n代わりに月を表示します。");
            Name = "月";
            Selected_number = 9;
            document.getElementById("object").options[9].selected = true;
        }
    }
    if (Obs_num != 3 && Obs_num != 9 && Name == "月") {
        Name = "地球";
        Selected_number = 3;
        alert("代わりに地球を表示します");
        document.getElementById("object").options[3].selected = true;
    }

    var lat_obs = parseInt(document.getElementById('lat').value) * pi/180;
    var lon_obs = parseInt(document.getElementById('lon').value) * pi/180;
    if (document.getElementById("NSCombo").value == '南緯') {lat_obs *= -1}
    if (document.getElementById("EWCombo").value == '西経') {lon_obs *= -1}
    var t = (JD - 2451545.0) / 36525;
    var theta = ((24110.54841 + 8640184.812866*t + 0.093104*t**2 - 0.0000062*t**3)/86400 % 1 + 1.00273781 * ((JD-2451544.5)%1)) * 2*pi + lon_obs //rad

    var Xlist = new Array(20);
    var Ylist = new Array(20);
    var Zlist = new Array(20);
    var RAlist = new Array(20);
    var Declist = new Array(20);
    var Distlist = new Array(20);
    var Vlist = new Array(20);

    var [X, Y, Z] = calc(planets[Obs_num], JD);
    var [RA_Sun, Dec_Sun, dist] = xyz_to_RADec(-X, -Y, -Z);
    Xlist[0] = X;
    Ylist[0] = Y;
    Zlist[0] = Z;
    RAlist[0] = RA_Sun;
    Declist[0] = Dec_Sun;
    Distlist[0] = dist;
    console.log("check368", planets.length);

    for (i=1; i<planets.length; i++) {
        var planet = planets[i];
        if (i == 12) {console.log(planet)}
        if (i == 9) {
            var [x, y, z] = calc(Earth, JD);
            var [Xe, Ye, Ze, RA_Moon, Dec_Moon, dist_Moon, Ms, ws, lon, lat] = calculate_Moon(JD, lat_obs, theta);
            Xlist[9] = x+Xe;
            Ylist[9] = y+Ye;
            Zlist[9] = z+Ze;
            RAlist[9] = RA_Moon;
            Declist[9] = Dec_Moon;
            Distlist[9] = dist_Moon;
            console.log("9 OK");
        } else {
            var [x, y, z] = calc(planet, JD);
            if (i==12) {console.log(384)};
            var [RA, Dec, dist] = xyz_to_RADec(x-X, y-Y, z-Z);
            if (i==12) {console.log(386)};
            Xlist[i] = x;
            Ylist[i] = y;
            Zlist[i] = z;
            RAlist[i] = RA;
            Declist[i] = Dec;
            Distlist[i] = dist;
            console.log(i, "OK");
        }
    }

    console.log("check393");

    var RA = RAlist[Selected_number];
    var Dec = Declist[Selected_number];

    var Astr = "";
    var hstr = "";
    if (ObsPlanet == "地球") {
        var Dec_rad = Dec * pi/180;
        var RA_rad = RA * pi/180;
        var A = (Math.atan2(-cos(Dec_rad)*sin(theta-RA_rad), sin(Dec_rad)*cos(lat_obs)-cos(Dec_rad)*sin(lat_obs)*cos(theta-RA_rad)) * 180/pi + 360) % 360;
        const direcs = ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東', '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西', '北'];
        var direc = direcs[Math.floor((A + 11.25) / 22.5)];
        var h = Math.asin(sin(Dec_rad)*sin(lat_obs) + cos(Dec_rad)*cos(lat_obs)*cos(theta-RA_rad)) * 180/pi;
        Astr = '方位角  ' + Math.round(A*10)/10 + '°(' + direc + ')   ';
        hstr = '高度  ' + Math.round(h*10)/10 + '°  ';
    }

    //星座判定
    var RA = RAlist[Selected_number];
    var Dec = Declist[Selected_number];
    var A = Array(89).fill(0);
    const num_of_boundary = boundary.length / 5;
    for (var i=0; i<num_of_boundary; i++) {
        var Dec1 = parseFloat(boundary[5*i+2]);
        var Dec2 = parseFloat(boundary[5*i+4]);
        if (Math.min(Dec1, Dec2) <= Dec && Dec < Math.max(Dec1, Dec2)) {
            var RA1 = parseFloat(boundary[5*i+1]);
            var RA2 = parseFloat(boundary[5*i+3]);
            if (RA >= (Dec-Dec1) * (RA2-RA1) / (Dec2-Dec1) + RA1) {
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

    var cenRA = RA + shiftRA;
    var cenDec = Dec + shiftDec;

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

    //星座線
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    const num_of_lines = lines.length / 5;
    for (var i=0; i<num_of_lines; i++) {
        var RA1 = parseFloat(lines[5*i+1]);
        var Dec1 = parseFloat(lines[5*i+2]);
        var RA2 = parseFloat(lines[5*i+3]);
        var Dec2 = parseFloat(lines[5*i+4]);
        if (cenRA - rgW < 0) {
            if (Math.min(RA1, RA2) < cenRA+rgW && Math.max(RA1, RA2) > cenRA-rgW) {
                if (Math.min(Dec1, Dec2) < cenDec+rgW && Math.max(Dec1, Dec2) > cenDec-rgW) {
                    var [x1, y1] = coordW(RA1, Dec1);
                    var [x2, y2] = coordW(RA2, Dec2);
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                }
            }
            if (Math.min(RA1, RA2)-360 < cenRA+rgW && Math.max(RA1, RA2)-360 > cenRA-rgW) {
                if (Math.min(Dec1, Dec2) < cenDec+rgW && Math.max(Dec1, Dec2) > cenDec-rgW) {
                    var [x1, y1] = coordW(RA1-360, Dec1);
                    var [x2, y2] = coordW(RA2-360, Dec2);
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                }
            }
        } else if (cenRA + rgW >= 360) {
            if (Math.min(RA1, RA2) < cenRA+rgW && Math.max(RA1, RA2) > cenRA-rgW) {
                if (Math.min(Dec1, Dec2) < cenDec+rgW && Math.max(Dec1, Dec2) > cenDec-rgW) {
                    var [x1, y1] = coordW(RA1, Dec1);
                    var [x2, y2] = coordW(RA2, Dec2);
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                }
            }
            if (Math.min(RA1, RA2)+360 < cenRA+rgW && Math.max(RA1, RA2)+360 > cenRA-rgW) {
                if (Math.min(Dec1, Dec2) < cenDec+rgW && Math.max(Dec1, Dec2) > cenDec-rgW) {
                    var [x1, y1] = coordW(RA1+360, Dec1);
                    var [x2, y2] = coordW(RA2+360, Dec2);
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                }
            }
        } else {
            if (Math.min(RA1, RA2) < cenRA+rgW && Math.max(RA1, RA2) > cenRA-rgW) {
                if (Math.min(Dec1, Dec2) < cenDec+rgW && Math.max(Dec1, Dec2) > cenDec-rgW) {
                    var [x1, y1] = coordW(RA1, Dec1);
                    var [x2, y2] = coordW(RA2, Dec2);
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                }
            }
        }
    }
    ctx.stroke();

   //分断
    ctx.fillStyle = '#FFF';
    ctx.fillRect(canvas.height, 0, Math.max(canvas.width-canvas.height, canvas.height), canvas.height);
    ctx.fillStyle = '#003';
    ctx.fillRect(canvas.width-canvas.height, 0, canvas.height, canvas.height);

    //HIP
    ctx.fillStyle = 'white';
    for (i=0; i<num_of_stars; i++){
        var RA = HIPRAary[i];
        var Dec = HIPDecary[i];
        var mag = HIPmagary[i];
        if (Math.abs(RApos(RA)) < rgW && Math.abs(Dec-cenDec) < rgW) {
            if (mag < maglimW) {
                var [x, y] = coordW(RA, Dec);
                ctx.beginPath();
                ctx.arc(x, y, sizeW(mag), 0, 2 * pi, false);
                ctx.fill();
            }
            if (Math.abs(RApos(RA)) < rgN && Math.abs(Dec-cenDec) < rgN && mag < maglimN) {
                var [x, y] = coordN(RA, Dec);
                ctx.beginPath();
                ctx.arc(x, y, sizeN(mag), 0, 2 * pi, false);
                ctx.fill();
            }
        }
    }

    //Tycho
    if (cenRA - rgN < 0) {
        //skyareasは[[a, b]]のaの領域とbの領域を両方含む
        var skyareas = [[SkyArea(0,             cenDec-rgN), SkyArea(cenRA+rgN, cenDec-rgN)],
                        [SkyArea(cenRA-rgN+360, cenDec-rgN), SkyArea(359.9,     cenDec-rgN)]];
        if (Math.floor((cenDec+rgN)/10) > Math.floor((cenDec-rgN)/10)){
            skyareas.push([skyareas[0][0]+360, skyareas[0][1]+360]);
            skyareas.push([skyareas[1][0]+360, skyareas[1][1]+360]);
        }
        DrawStars(skyareas);
    } else if (cenRA + rgN >= 360) {
        var skyareas = [[SkyArea(0,         cenDec-rgN), SkyArea(cenRA+rgN-360, cenDec-rgN)],
                        [SkyArea(cenRA-rgN, cenDec-rgN), SkyArea(359.9,         cenDec-rgN)]];
        if (Math.floor((cenDec+rgN)/10) > Math.floor((cenDec-rgN)/10)){
            skyareas.push([skyareas[0][0]+360, skyareas[0][1]+360]);
            skyareas.push([skyareas[1][0]+360, skyareas[1][1]+360]);
        }
        DrawStars(skyareas);
    } else {
        var skyareas = [[SkyArea(cenRA-rgN, cenDec-rgN), SkyArea(cenRA+rgN, cenDec-rgN)]];
        if (Math.floor((cenDec+rgN)/10) > Math.floor((cenDec-rgN)/10)){
            skyareas.push([skyareas[0][0]+360, skyareas[0][1]+360]);
        }
        DrawStars(skyareas);
    }

    //惑星、惑星の名前
    ctx.font = '20px serif';
    ctx.textBaseline = 'bottom';
	ctx.textAlign = 'left';

    for (i=0; i<planets.length; i++){
        // 枠内に入っていて
        if (i != Obs_num && Math.abs(RApos(RAlist[i])) < rgW && Math.abs(Declist[i]-cenDec) < rgW) {
            var [x, y] = coordW(RAlist[i], Declist[i]);
            if (i == 0){ // 太陽
                ctx.fillStyle = 'yellow';
                ctx.beginPath();
                ctx.arc(x, y, 13, 0, 2 * pi, false);
                ctx.fill();
                ctx.fillStyle = '#FF8';
                ctx.fillText(JPNplanets[i], x+10, y-10);
            } else if (i == 9) { // 月(地球から見たときだけ)
                if (Obs_num == 3) {
                    var rs = RA_Sun * pi/180;
                    var ds = Dec_Sun * pi/180;
                    var rm = RA_Moon * pi/180;
                    var dm = Dec_Moon * pi/180;
                    var lons = Ms + 0.017 * sin(Ms + 0.017 * sin(Ms)) + ws;
                    k = (1 - cos(lons-lon) * cos(lat)) / 2;
                    P = pi - Math.atan2(cos(ds) * sin(rm-rs), -sin(dm) * cos(ds) * cos(rm-rs) + cos(dm) * sin(ds));

                    ctx.beginPath();
                    if (k < 0.5) {
                        ctx.fillStyle = 'yellow';
                        ctx.arc(x, y, 16, 0, 2*pi, false);
                        ctx.fill();
                        ctx.fillStyle = '#333';
                        ctx.beginPath();
                        ctx.arc(x, y, 16, pi-P, 2*pi-P);
                        ctx.ellipse(x, y, 16, 16*(1-2*k), -P, 0, pi);
                        ctx.fill()
                    } else {
                        ctx.fillStyle = '#333';
                        ctx.arc(x, y, 16, 0, 2*pi, false);
                        ctx.fill();
                        ctx.fillStyle = 'yellow';
                        ctx.beginPath();
                        ctx.arc(x, y, 16, -P, pi-P);
                        ctx.ellipse(x, y, 16, 16*(2*k-1), pi-P, 0, pi);
                        ctx.fill()
                    }

                    ctx.fillStyle = '#FF8';
                    ctx.fillText(JPNplanets[i], x+10, y-10);
                }
            } else if (i != 9) {// 太陽と月以外
                var mag = Vlist[i];
                ctx.fillStyle = '#F33'
                ctx.beginPath();
                ctx.arc(x, y, Math.max(sizeW(mag), 0.5), 0, 2 * pi, false);
                ctx.fill();
                ctx.fillStyle = '#FF8';
                ctx.fillText(JPNplanets[i], x, y);
            }

            if (i != Obs_num && Math.abs(RApos(RAlist[i])) < rgN && Math.abs(Declist[i]-cenDec) < rgN) {
                var [x, y] = coordN(RAlist[i], Declist[i]);
                if (i == 0){
                    var  R = canvas.height * (Math.max(0.267 / Distlist[0], 0.1)) / rgN / 2;
                    ctx.fillStyle = 'yellow';
                    ctx.beginPath();
                    ctx.arc(x, y, R, 0, 2 * pi, false);
                    ctx.fill();
                    ctx.fillStyle = '#FF8';
                    ctx.fillText(JPNplanets[i], x+0.8*R, y-0.8*R);
                }
                else if (i == 9) {
                    if (Obs_num == 3) {
                        var r = canvas.height * (0.259 / (dist_Moon / 384400)) / rgN / 2;
                        ctx.beginPath();
                        if (k < 0.5) {
                            ctx.fillStyle = 'yellow';
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
                            ctx.fillStyle = 'yellow';
                            ctx.beginPath();
                            ctx.arc(x, y, r, -P, pi-P);
                            ctx.ellipse(x, y, r, r*(2*k-1), pi-P, 0, pi);
                            ctx.fill()
                        }

                        ctx.fillStyle = '#FF8';
                        ctx.fillText(JPNplanets[i], x+0.8*r, y-0.8*r);
                    }
                } else if (i != 9) {
                    var mag = Vlist[i];
                    ctx.fillStyle = '#F33'
                    ctx.beginPath();
                    ctx.arc(x, y, Math.max(sizeN(mag), 0.5), 0, 2 * pi, false);
                    ctx.fill();
                    ctx.fillStyle = '#FF8';
                    ctx.fillText(JPNplanets[i], x, y);
                }
            }
        }
    }
    
    var zengo = document.getElementsByName("zengo");
    if (zengo[1].checked && Selected_number != 9 && Selected_number != 0){
        ctx.fillStyle = '#3F3'
        var planet = planets[Selected_number];
        
        var interval1 = parseFloat(document.getElementById("zengo11").value);
        var zengorange1 = parseFloat(document.getElementById("zengo12").value);
        for (var i=1; i<=parseInt(zengorange1/interval1); i++){
            JD = showingJD + i * interval1;
            var [X, Y, Z] = calc(planets[Obs_num], JD);
            var [x, y, z] = calc(planet, JD);
            var [RA, Dec, dist] = xyz_to_RADec(x-X, y-Y, z-Z);
            if (Math.abs(RApos(RA)) < rgW && Math.abs(Dec-cenDec) < rgW) {
                var [x, y] = coordW(RA, Dec);
                ctx.beginPath();
                ctx.arc(x, y, Math.max(sizeW(maglimW), 0.5), 0, 2 * pi, false);
                ctx.fill();
            }

            JD = showingJD - i * interval1;
            var [X, Y, Z] = calc(planets[Obs_num], JD);
            var [x, y, z] = calc(planet, JD);
            var [RA, Dec, dist] = xyz_to_RADec(x-X, y-Y, z-Z);
            if (Math.abs(RApos(RA)) < rgW && Math.abs(Dec-cenDec) < rgW) {
                var [x, y] = coordW(RA, Dec);
                ctx.beginPath();
                ctx.arc(x, y, Math.max(sizeW(maglimW), 0.5), 0, 2 * pi, false);
                ctx.fill();
            }
        }

        var interval2 = parseFloat(document.getElementById("zengo21").value);
        var zengorange2 = parseFloat(document.getElementById("zengo22").value);
        for (var i=1; i<=parseInt(zengorange2/interval2); i++){
            JD = showingJD + i * interval2;
            var [X, Y, Z] = calc(planets[Obs_num], JD);
            var [x, y, z] = calc(planet, JD);
            var [RA, Dec, dist] = xyz_to_RADec(x-X, y-Y, z-Z);
            if (Math.abs(RApos(RA)) < rgN && Math.abs(Dec-cenDec) < rgN) {
                var [x, y] = coordN(RA, Dec);
                ctx.beginPath();
                ctx.arc(x, y, Math.max(sizeN(maglimN), 0.5), 0, 2 * pi, false);
                ctx.fill();
            }
            JD = showingJD - i * interval2;
            var [X, Y, Z] = calc(planets[Obs_num], JD);
            var [x, y, z] = calc(planet, JD);
            var [RA, Dec, dist] = xyz_to_RADec(x-X, y-Y, z-Z);
            if (Math.abs(RApos(RA)) < rgN && Math.abs(Dec-cenDec) < rgN) {
                var [x, y] = coordN(RA, Dec);
                ctx.beginPath();
                ctx.arc(x, y, Math.max(sizeN(maglimN), 0.5), 0, 2 * pi, false);
                ctx.fill();
            }
        }

    }

    var RA = RAlist[Selected_number];
    var RAtext = "赤経 " + Math.floor(RA/15) + "h " + Math.round((RA-15*Math.floor(RA/15))*4*10)/10 + "m  ";
    
    var Dec = Declist[Selected_number];
    if (Dec >= 0) {
        var Dectext = "赤緯 +" + Math.floor(Dec) + "° " + Math.round((Dec-Math.floor(Dec))*60) + "'(J2000.0)  ";
    } else {
        var Dectext = "赤緯 -" + Math.floor(-Dec) + "° " + Math.round((-Dec-Math.floor(-Dec))*60) + "'(J2000.0)  ";
    }

    if (Selected_number == 9) {
        var Disttext = "距離 " + Math.round(Distlist[Selected_number]/1000)/10 + "万km  ";
    } else {
        var Disttext = "距離 " + Math.round(Distlist[Selected_number]*100)/100 + "au  ";
    }

    var Vtext = ""
    if (Vlist[Selected_number] != 100) {
        var Vtext = Math.round(Vlist[Selected_number]*10)/10 + "等級  ";
    }

    
    
    var coordtext = constellation + "__" + RAtext + Dectext + "__" + Disttext + "__" + Vtext + "__" + Astr + hstr;
    document.getElementById("coordtext").innerHTML = coordtext;


    function sin(a){return Math.sin(a)}
    function cos(a){return Math.cos(a)}

    function YMDH_to_JD(Y, M, D, H){
        if (M <= 2) {
            M += 12;
            Y--;
        }
        var JD = Math.floor(365.25*Y) + Math.floor(Y/400) - Math.floor(Y/100) + Math.floor(30.59*(M-2)) + D + H/24 + 1721088.5 + 0.0008 - 0.375;
        return JD;
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

    function SkyArea(RA, Dec) { //(RA, Dec)はHelper2ndで↓行目（0始まり）の行数からのブロックに入ってる
        return parseInt(360 * Math.floor(Dec / 10 + 9) + Math.floor(RA));
    }

    function RApos(RA) {
        return (RA + 540 - cenRA) % 360 - 180; //PythonでのadjustRA(RA)-piccenRAに相当
    }

    function coordW (RA, Dec) {
        var x = canvas.height * (0.5 - RApos(RA) / rgW / 2);
        var y = canvas.height * (0.5 - (Dec - cenDec) / rgW / 2);
        return [x, y];
    }

    function coordN (RA, Dec) {
        var x = canvas.width - canvas.height * (RApos(RA) / rgN / 2 + 0.5);
        var y = canvas.height * (0.5 - (Dec - cenDec) / rgN / 2);
        return [x, y];
    }

    function sizeW (mag) {
        if (mag > maglimW) {
            return zerosizeW / (maglimW + 1);
        } else {
            return zerosizeW * (maglimW + 1 - mag) / (maglimW + 1);
        }
    }

    function sizeN (mag) {
        if (mag > maglimN) {
            return zerosizeN / (maglimN + 1);
        } else {
            return zerosizeN * (maglimN + 1 - mag) / (maglimN + 1);
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
                if (Math.abs(Dec-cenDec) < rgN && Math.abs(RApos(RA)) < rgN && mag < 10) {
                    var [x, y] = coordN(RA, Dec);
                    ctx.beginPath();
                    ctx.arc(x, y, sizeN(mag), 0, 2 * pi, false);
                    ctx.fill();
                }
            }
        }
    }

    function calc(planet, JD) {
        if (planet == Sun) {
            return [0, 0, 0]
        } else if (planet == Moon) {
            var [x, y, z] = cal_Ellipse(Earth, JD)
            var [Xe, Ye, Ze, RA, Dec, dist, Ms, ws, lon, lat] = calculate_Moon(JD, lat_obs, theta)
            return [x+Xe, y+Ye, z+Ze]
        } else {
            return cal_Ellipse(planet, JD)
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
}

async function search () {
    var url = "https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=" + document.getElementById('addname').value + "&full-prec=true&phys-par=true";
    var xhr = new XMLHttpRequest();

    const res = await fetch(url);
    console.log(res)

    /*xhr.open('GET', url, true);
    xhr.responseType = 'json';
    console.log(url);
    xhr.onload = function () {
        var res = this.response;
        console.log(res);
    };
    xhr.send();*/

    function addplenet () {
        var Name = document.getElementById('addname').value;

        var x_eles = [];
        var s_time = [];

        for (var i=0; i<6; i++) {
            s_eles.push(document.getElementById('ele' + String(i)).value);
        }
    }

}

document.body.appendChild(canvas);