
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

canvas.width = window.innerWidth * 0.8;
canvas.height = window.innerHeight * 0.8;

var raArray = Array(0);
var decArray = Array(0);
var magArray = Array(0);
var dataNum = 0;

var ramax, ramin, decmax, decmin, magmax;
var a = document.getElementById('aSlider').value * 1;
var b = document.getElementById('bSlider').value * 1;

document.getElementById('getFile').addEventListener('change', function () {
    let fr = new FileReader();
    fr.onload = function () {
        const alldata = fr.result.split('\n');
        dataNum = alldata.length - 2;
        raArray = Array(dataNum);
        decArray = Array(dataNum);
        magArray = Array(dataNum);
        for (var i=0; i<dataNum; i++) {
            var data = alldata[i+1];
            var [ra, dec, mag] = data.split(',');
            raArray[i] = ra * 1;
            decArray[i] = dec * 1;
            magArray[i] = mag * 1;
        }
        ramax= raArray.reduce(aryMax);
        ramin = raArray.reduce(aryMin);
        decmax = decArray.reduce(aryMax);
        decmin = decArray.reduce(aryMin);
        magmax = magArray.reduce(aryMax);
        document.getElementById('magmaxSlider').max = magmax;
        document.getElementById('magmaxSlider').min = magmax - 6;
        document.getElementById('magmaxSlider').value = magmax;
        document.getElementById('raminSlider').min = ramin;
        document.getElementById('raminSlider').max = ramax;
        document.getElementById('raminSlider').step = (ramax - ramin) / 20;
        document.getElementById('raminSlider').value = ramin;
        document.getElementById('ramaxSlider').min = ramin;
        document.getElementById('ramaxSlider').max = ramax;
        document.getElementById('ramaxSlider').step = (ramax - ramin) / 20;
        document.getElementById('ramaxSlider').value = ramax;
        document.getElementById('decminSlider').min = decmin;
        document.getElementById('decminSlider').max = decmax;
        document.getElementById('decminSlider').value = decmin;
        document.getElementById('decminSlider').step = (decmax - decmin) / 20;
        document.getElementById('decmaxSlider').min = decmin;
        document.getElementById('decmaxSlider').max = decmax;
        document.getElementById('decmaxSlider').value = decmax;
        document.getElementById('decmaxSlider').step = (decmax - decmin) / 20;
        draw(ramax, ramin, decmax, decmin, magmax, 1.6, 0.2);
    }
    fr.readAsText(this.files[0]);
})

const aryMax = function (a, b) {return Math.max(a, b);}
const aryMin = function (a, b) {return Math.min(a, b);}

document.getElementById('magmaxSlider').addEventListener('input', function(){
    magmax = document.getElementById('magmaxSlider').value * 1;
    draw (ramax, ramin, decmax, decmin, magmax, a, b);
});
document.getElementById('raminSlider').addEventListener('input', function(){
    ramin = document.getElementById('raminSlider').value * 1;
    draw (ramax, ramin, decmax, decmin, magmax, a, b);
});
document.getElementById('ramaxSlider').addEventListener('input', function(){
    ramax = document.getElementById('ramaxSlider').value * 1;
    draw (ramax, ramin, decmax, decmin, magmax, a, b);
});
document.getElementById('decminSlider').addEventListener('input', function(){
    decmin = document.getElementById('decminSlider').value * 1;
    draw (ramax, ramin, decmax, decmin, magmax, a, b);
});
document.getElementById('decmaxSlider').addEventListener('input', function(){
    decmax = document.getElementById('decmaxSlider').value * 1;
    draw (ramax, ramin, decmax, decmin, magmax, a, b);
});
document.getElementById('aSlider').addEventListener('input', function(){
    a = document.getElementById('aSlider').value * 1;
    draw (ramax, ramin, decmax, decmin, magmax, a, b);
});
document.getElementById('bSlider').addEventListener('input', function(){
    b = document.getElementById('bSlider').value * 1;
    draw (ramax, ramin, decmax, decmin, magmax, a, b);
});

function draw (ramax, ramin, decmax, decmin, magmax, a, b) {
    document.getElementById('info').innerHTML = `R.A.:${Math.round(ramin*1000)/1000}~${Math.round(ramax*1000)/1000}deg, Dec:${Math.round(decmin*1000)/1000}~${Math.round(decmax*1000)/1000}deg, mag:~${Math.round(magmax*100)/100}mag`;
    canvas.width = canvas.height * (ramax - ramin) * Math.cos((decmin + decmax) * Math.PI / 180 / 2)/ (decmax - decmin);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    for (var i=0; i<dataNum; i++) {
        var [x, y] = radec2xy(raArray[i], decArray[i]);
        var size = mag2size(magArray[i], a, b);
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2*Math.PI, false);
        ctx.fill();
    };

    function radec2xy (RA, Dec) {
        return [canvas.width * (ramax - RA) / (ramax - ramin), canvas.height * (decmax - Dec) / (decmax - decmin)];
    }

    function mag2size (mag, a, b) {
        return Math.pow(magmax - mag, a) * b + 1;
    }
}

ctx.fillStyle = 'black'
var ra_demo = [-0.5, 0, 0.5, -1.5, 1.5, -1.5, 1.5];
var dec_demo = [0, 0, 0, 2, 2, -2, -2];
var mag_demo = [10, 10, 10, 10, 6, 6, 10];
document.getElementById('info').innerHTML = `R.A.:0~0deg, Dec:0~0deg, mag:~0mag`;
canvas.width = canvas.height;
ctx.clearRect(0,0,canvas.width,canvas.height);
ctx.fillStyle = 'black';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = 'white';
for (var i=0; i<7; i++) {
    var [x, y] = [canvas.width * ((3 - ra_demo[i]) / 6), canvas.height * (3 -dec_demo[i]) / 6];
    var size = Math.pow(15 - mag_demo[i], 1.6) * 0.2 + 1;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2*Math.PI, false);
    ctx.fill();
};

