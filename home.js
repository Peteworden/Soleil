const pi = Math.PI;

let canvas = document.createElement('canvas');
let ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let date = new Date();

let unit = Math.min(canvas.width, canvas.height) / 60;

function setCanvas(x, y) {
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#002';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height/2, unit, 0, 2 * pi, false);
    ctx.fill();
    ctx.fillStyle = '#77F';
    ctx.beginPath();
    ctx.arc(canvas.width/2+x, canvas.height/2-y, unit, 0, 2 * pi, false);
    ctx.fill();
}

let x, y, vx, vy, GM, dt, autoFrag=1;
function restart() {
    x = 20 * unit;
    y = 0;
    vx = 0;
    vy = 2*pi*x/15;
    autoFrag = 1;
}
restart();
GM = x*vy*vy;

let pre_x=1000000, pre_y=1000000, t0=date.getTime();
canvas.addEventListener("touchstart", ontouchstart);
canvas.addEventListener("touchend", ontouchend);
canvas.addEventListener("mousedown", onmousedown);
canvas.addEventListener("mouseup", onmouseup);

function ontouchstart(e) {
    if (e.touches.length == 1 && Math.pow(e.touches[0].pageX-canvas.offsetLeft-canvas.width/2-x, 2) + Math.pow(e.touches[0].pageY-canvas.offsetTop-canvas.height/2+y, 2) < 40*40) {
        e.preventdefault();
        autoFrag = 0;
        canvas.addEventListener("ontouchmove", ontouchmove);
    }
}

function ontouchmove(e) {
    var touches = e.changedTouches;
    for (let touch in e.changedTouches) {
        if (Math.pow(touch.pageX-canvas.offsetLeft-canvas.width/2-x, 2) + Math.pow(touch.pageY-canvas.offsetTop-canvas.height/2+y, 2) < 40*40) {
            e.preventdefault();
            pre_x = x;
            pre_y = y;
            x = e.pageX-canvas.offsetLeft-canvas.width/2;
            y = -(e.pageY-canvas.offsetTop-canvas.height/2);
            setCanvas(x, y);
            date = new Date();
            t0 = date.getTime();
        }
    }
}

function ontouchend(e) {
    date = new Date();
    vx = (x - pre_x) * 1000 / (date.getTime() - t0);
    vy = (y - pre_y) * 1000 / (date.getTime() - t0);
    autoFrag = 1;
    canvas.removeEventListener("touchmove", ontouchmove);
    movePlanet();
}

function onmousedown(e){
    if (Math.pow(e.pageX-canvas.offsetLeft-canvas.width/2-x, 2) + Math.pow(e.pageY-canvas.offsetTop-canvas.height/2+y, 2) < 40*40) {
        autoFrag = 0;
        canvas.addEventListener("mousemove", onmousemove);
    }
}

function onmousemove(e) {
    date = new Date();
    t0 = date.getTime();
    pre_x = x;
    pre_y = y;
    x = e.pageX-canvas.offsetLeft-canvas.width/2;
    y = -(e.pageY-canvas.offsetTop-canvas.height/2);
    setCanvas(x, y);
}

function onmouseup(e) {
    date = new Date();
    vx = (x - pre_x) * 1000 / (date.getTime() - t0);
    vy = (y - pre_y) * 1000 / (date.getTime() - t0);
    console.log(date.getTime() - t0);
    autoFrag = 1;
    canvas.removeEventListener("mousemove", onmousemove);
    movePlanet();
}

function movePlanet() {
    date = new Date();
    dt = (date.getTime() - t0) / 1000;
    t0 = date.getTime();
    vx += -GM * x / Math.pow(x*x + y*y, 1.5) * dt;
    vy += -GM * y / Math.pow(x*x + y*y, 1.5) * dt;
    x  += vx * dt;
    y  += vy * dt;
    if (Math.abs(x) > canvas.width/2 || Math.abs(y) > canvas.height/2) {
        restart();
    }
    setCanvas(x, y);
    if (autoFrag) {
        window.requestAnimationFrame(movePlanet);
    }
}

window.requestAnimationFrame(movePlanet);

document.body.appendChild(canvas);