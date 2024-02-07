

const numlist = [1, 31, 42, 45, 51];
var yetlist = Array.from(numlist);

//0:NASA 1:NAOJ
const imgnames = [
["hubble_crabnebula-jpg.jpg", 0, "M1 かに星雲 [超新星残骸]"], //1
["m31-mosaic-with-groundbased-image-jpg.jpg", 0, "M31 アンドロメダ銀河"], //31
["orion-nebula-xlarge_web-jpg.jpg", 0, "M42 オリオン大星雲"], //42
["m45-20211110-m.jpg", 1, "M45 すばる（プレアデス星団）"], //45
["m51-and-companion_0-jpg.jpg", 0, "M51 子持ち銀河"]] //51

const credits = ["クレジット：NASA", "クレジット：国立天文台"];

for (var i=0; i<numlist.length; i++) {
    var img = document.createElement('img');
    img.src = "images/" + imgnames[i][0];
}

var numIndex, preNumIndex=-1, finalNumIndex, timeoutId, k;

function next(event) {
    k = 0;
    document.getElementById("caption").innerHTML = "";

    clearTimeout(timeoutId);
    switchImage();

    var yetIndex = Math.floor(Math.random()*yetlist.length);
    var num = yetlist[yetIndex];
    finalNumIndex = numlist.indexOf(num);
    yetlist.splice(yetIndex, 1);
}

function switchImage() {
    document.getElementById('nextBtn').style.visibility = "hidden";
    if (k < 20) {
        if (k < 19) {
            do {
                numIndex = Math.floor(Math.random()*numlist.length);
                console.log(numIndex);
            } while (numIndex == preNumIndex)
        } else {
            do {
                numIndex = Math.floor(Math.random()*numlist.length);
                console.log(numIndex);
            } while (numIndex == preNumIndex || numIndex == finalNumIndex)
        }
        document.getElementById("image").src = "images/" + imgnames[numIndex][0];
        document.getElementById("credit").innerHTML = credits[imgnames[numIndex][1]];
        document.getElementById("number").innerHTML = numlist[numIndex];
        preNumIndex = numIndex;
        k++;
        timeoutId = setTimeout(switchImage, 100);
    } else if (k == 20) {
        document.getElementById("topText").innerHTML += " " + numlist[finalNumIndex];
        document.getElementById("image").src = "images/" + imgnames[finalNumIndex][0];
        document.getElementById("credit").innerHTML = credits[imgnames[finalNumIndex][1]];
        document.getElementById("number").innerHTML = numlist[finalNumIndex];
        document.getElementById("caption").innerHTML = imgnames[finalNumIndex][2];
        if (yetlist.length == 0) {
            document.getElementById("topText").innerHTML += "<br>" + "Ctrl+rでもう一度始める";
        } else {
            document.getElementById('nextBtn').style.visibility = "visible";
        }
        return;
    }
}
