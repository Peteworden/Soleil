
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

setCanvasSize (ramax, ramin, decmax, decmin);

var raArray = [-0.5, 0, 0.5, -1.5, 1.5, -1.5, 1.5];
var decArray = [0, 0, 0, 2, 2, -2, -2];
var magArray = [10, 10, 10, 10, 6, 6, 10];
var dataNum = 7;

var ramax=3, ramin=-3, decmax=3, decmin=-3, magmax=15;
var a = document.getElementById('aSlider').value * 1;
var b = document.getElementById('bSlider').value * 1;

var starColorElem = document.getElementsByName('starColor');
var backgroundColorElem = document.getElementsByName('backgroundColor');
var starColor, backgroundColor;
for (var i=0; i<starColorElem.length; i++) {
    if (starColorElem[i].checked) {
        starColor = starColorElem[i].value;
        break;
    }
}
for (var i=0; i<backgroundColorElem.length; i++) {
    if (backgroundColorElem[i].checked) {
        backgroundColor = backgroundColorElem[i].value;
        break;
    }
}
draw (ramax, ramin, decmax, decmin, magmax, a, b);

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
    if (ramin >= ramax) {
        ramin = ramax - document.getElementById('ramaxSlider').step;
        document.getElementById('raminSlider').value = ramin;
    } else {
        draw (ramax, ramin, decmax, decmin, magmax, a, b);
    }
});
document.getElementById('ramaxSlider').addEventListener('input', function(){
    ramax = document.getElementById('ramaxSlider').value * 1;
    if (ramax <= ramin) {
        ramax = ramin + document.getElementById('ramaxSlider').step;
        document.getElementById('ramaxSlider').value = ramax;
    } else {
        draw (ramax, ramin, decmax, decmin, magmax, a, b);
    }
});
document.getElementById('decminSlider').addEventListener('input', function(){
    decmin = document.getElementById('decminSlider').value * 1;
    if (decmin >= decmax) {
        decmin = decmax - document.getElementById('decmaxSlider').step;
        document.getElementById('decminSlider').value = decmin;
    } else {
        draw (ramax, ramin, decmax, decmin, magmax, a, b);
    }
});
document.getElementById('decmaxSlider').addEventListener('input', function(){
    decmax = document.getElementById('decmaxSlider').value * 1;
    if (decmax <= decmin) {
        decmax = decmin + document.getElementById('decmaxSlider').step;
        document.getElementById('decmaxSlider').value = decmax;
    } else {
        draw (ramax, ramin, decmax, decmin, magmax, a, b);
    }
});
document.getElementById('aSlider').addEventListener('input', function(){
    a = document.getElementById('aSlider').value * 1;
    draw (ramax, ramin, decmax, decmin, magmax, a, b);
});
document.getElementById('bSlider').addEventListener('input', function(){
    b = document.getElementById('bSlider').value * 1;
    draw (ramax, ramin, decmax, decmin, magmax, a, b);
});
starColorElem.forEach(function(e) {
    e.addEventListener("click", function() {
        for (var i=0; i<starColorElem.length; i++) {
            if (starColorElem[i].checked) {
                starColor = starColorElem[i].value;
                break;
            }
        }
        draw (ramax, ramin, decmax, decmin, magmax, a, b);
    });
});
backgroundColorElem.forEach(function(e) {
    e.addEventListener("click", function() {
        for (var i=0; i<backgroundColorElem.length; i++) {
            if (backgroundColorElem[i].checked) {
                backgroundColor = backgroundColorElem[i].value;
                break;
            }
        }
        draw (ramax, ramin, decmax, decmin, magmax, a, b);
    });
});

function saveImg(event) {
    let canvasUrl = canvas.toDataURL("image/jpeg", 0.5);
    console.log(canvasUrl);
    var racen = Math.round((ramin + ramax) * 500);
    var deccen = Math.round((decmin + decmax) * 500);
    const createEl = document.createElement('a');
    createEl.href = canvasUrl;
    createEl.download = `${racen}_${deccen}_${Math.round(magmax*100)}`;
    createEl.click();
    createEl.remove();
};

function draw (ramax, ramin, decmax, decmin, magmax, a, b) {
    document.getElementById('info').innerHTML = `R.A.:${Math.round(ramin*1000)/1000}~${Math.round(ramax*1000)/1000}deg, Dec:${Math.round(decmin*1000)/1000}~${Math.round(decmax*1000)/1000}deg, mag:~${Math.round(magmax*100)/100}mag`;
    setCanvasSize (ramax, ramin, decmax, decmin)
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = starColor;
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

function setCanvasSize (ramax, ramin, decmax, decmin) {
    if (window.innerWidth > window.innerHeight) {
        canvas.height = window.innerHeight * 0.8;
        canvas.width = canvas.height * (ramax - ramin) * Math.cos((decmin + decmax) * Math.PI / 180 / 2) / (decmax - decmin);
        if (canvas.width > window.innerWidth * 0.95) {
            canvas.height = canvas.height * window.innerWidth * 0.95 / canvas.width;
            canvas.width = window.innerWidth * 0.95;
        }
    } else {
        canvas.width = window.innerWidth * 0.9;
        canvas.height = canvas.width * (decmax - decmin) / (ramax - ramin) / Math.cos((decmin + decmax) * Math.PI / 180 / 2);
        if (canvas.height > window.innerHeight * 0.9) {
            canvas.width = canvas.width * window.innerHeight * 0.9 / canvas.height;
            canvas.height = window.innerHeight * 0.9;
        }
    }
    return [canvas.width, canvas.height];
}

