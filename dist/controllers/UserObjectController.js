import { MessierObject } from "../models/CelestialObject.js";
import { CoordinateConverter } from "../utils/coordinates.js";
import { DataStore } from "../models/DataStore.js";
import { AstronomicalCalculator } from "../utils/calculations.js";
import { Asteroid, Comet, SolarSystemDataManager, SolarSystemObjectBase } from "../models/SolarSystemObjects.js";
export class UserObjectController {
    static init() {
        const addObjectButton = document.getElementById('addObjectButton');
        const typeSelect = document.getElementById('addObject-typeSelect');
        const backToAddObjectTypeSelect = document.getElementsByClassName('back-to-select-add-object-type');
        const closeAddObjectTypeSelect = document.getElementById('close-addObject-typeSelect');
        const userObjectManageButton = document.getElementById('userObject-manage-button');
        const userObjectRecButton = document.getElementById('userObject-rec-button');
        const userObjectEllipticButton = document.getElementById('userObject-elliptic-button');
        const userObjectParabolicButton = document.getElementById('userObject-parabolic-button');
        const userObjectHyperbolicButton = document.getElementById('userObject-hyperbolic-button');
        const userObjectManage = document.getElementById('userObject-manage');
        const userObjectRec = document.getElementById('userObject-rec');
        const userObjectElliptic = document.getElementById('userObject-elliptic');
        const userObjectParabolic = document.getElementById('userObject-parabolic');
        const userObjectHyperbolic = document.getElementById('userObject-hyperbolic');
        const finishManageButton = document.getElementById('userObject-manage-finish-button');
        const addObjectRecButton = document.getElementById('userObject-rec-add-button');
        const addObjectEllipticButton = document.getElementById('userObject-elliptic-add-button');
        const addObjectParabolicButton = document.getElementById('userObject-parabolic-add-button');
        const addObjectHyperbolicButton = document.getElementById('userObject-hyperbolic-add-button');
        if (addObjectButton && typeSelect) {
            addObjectButton.addEventListener('click', () => {
                typeSelect.style.display = 'block';
            });
        }
        if (typeSelect && closeAddObjectTypeSelect) {
            closeAddObjectTypeSelect.addEventListener('click', () => {
                typeSelect.style.display = 'none';
            });
        }
        if (userObjectManageButton && userObjectManage && typeSelect) {
            userObjectManageButton.addEventListener('click', () => {
                userObjectManage.style.display = 'block';
                typeSelect.style.display = 'none';
            });
        }
        //追加ページへ移動
        if (userObjectRecButton && userObjectRec && typeSelect) {
            userObjectRecButton.addEventListener('click', () => {
                userObjectRec.style.display = 'block';
                typeSelect.style.display = 'none';
            });
        }
        if (userObjectEllipticButton && userObjectElliptic && typeSelect) {
            userObjectEllipticButton.addEventListener('click', () => {
                userObjectElliptic.style.display = 'block';
                typeSelect.style.display = 'none';
            });
        }
        if (userObjectParabolicButton && userObjectParabolic && typeSelect) {
            userObjectParabolicButton.addEventListener('click', () => {
                userObjectParabolic.style.display = 'block';
                typeSelect.style.display = 'none';
            });
        }
        if (userObjectHyperbolicButton && userObjectHyperbolic && typeSelect) {
            userObjectHyperbolicButton.addEventListener('click', () => {
                userObjectHyperbolic.style.display = 'block';
                typeSelect.style.display = 'none';
            });
        }
        if (backToAddObjectTypeSelect && typeSelect && userObjectRec && userObjectElliptic && userObjectParabolic && userObjectHyperbolic && userObjectManage) {
            Array.from(backToAddObjectTypeSelect).forEach((element) => {
                element.addEventListener('click', () => {
                    typeSelect.style.display = 'block';
                    userObjectManage.style.display = 'none';
                    userObjectRec.style.display = 'none';
                    userObjectElliptic.style.display = 'none';
                    userObjectParabolic.style.display = 'none';
                    userObjectHyperbolic.style.display = 'none';
                });
            });
        }
        //追加
        if (addObjectRecButton) {
            addObjectRecButton.addEventListener('click', () => {
                this.addRecObject();
            });
        }
        if (addObjectEllipticButton) {
            addObjectEllipticButton.addEventListener('click', () => {
                this.addEllipticObject();
            });
        }
        if (addObjectParabolicButton) {
            addObjectParabolicButton.addEventListener('click', () => {
                this.addParabolicObject();
            });
        }
        if (addObjectHyperbolicButton) {
            addObjectHyperbolicButton.addEventListener('click', () => {
                this.addHyperbolicObject();
            });
        }
    }
    static addRecObject() {
        const nameInput = document.getElementById('userObject-rec-name');
        const altnameInput = document.getElementById('userObject-rec-altname');
        const typeSelect = document.getElementById('userObject-rec-type');
        const raInput = document.getElementById('userObject-rec-ra');
        const decInput = document.getElementById('userObject-rec-dec');
        const magnitudeInput = document.getElementById('userObject-rec-mag');
        const descriptionInput = document.getElementById('userObject-rec-description');
        if (nameInput && altnameInput && typeSelect && raInput && decInput && magnitudeInput && descriptionInput) {
            const name = nameInput.value.trim();
            if (name.length === 0) {
                this.showError('name', nameInput, '天体名を入力してください');
                return;
            }
            else {
                this.clearError('name', nameInput);
            }
            const altnames = altnameInput.value.split(',');
            const type = typeSelect.value;
            const raText = raInput.value;
            const decText = decInput.value;
            let mag = parseFloat(magnitudeInput.value);
            const description = descriptionInput.value;
            console.log(name, altnames, type, raText, decText, mag, description);
            let ra;
            let dec;
            if (raText.includes(' ')) {
                ra = this.coordinateConverter.rahmToDeg(raText);
                dec = this.coordinateConverter.decdmToDeg(decText);
            }
            else {
                ra = parseFloat(raText);
                dec = parseFloat(decText);
            }
            if (isNaN(ra) || ra < 0 || ra > 360) {
                this.showError('ra', raInput, '赤経を入力または修正してください');
                return;
            }
            else {
                this.clearError('ra', raInput);
            }
            if (isNaN(dec) || dec < -90 || dec > 90) {
                this.showError('dec', decInput, '赤緯を入力または修正してください');
                return;
            }
            else {
                this.clearError('dec', decInput);
            }
            if (magnitudeInput.value.length > 0 && (isNaN(mag) || mag < -10 || mag > 30)) {
                this.showError('mag', magnitudeInput, '等級を修正してください');
                return;
            }
            else {
                if (magnitudeInput.value.length === 0) {
                    mag = 100.0;
                }
                this.clearError('mag', magnitudeInput);
            }
            // MessierObjectの作成（必要なプロパティを追加）
            const recObject = new MessierObject(name, altnames, { ra: ra, dec: dec }, mag, type, null, // image_url
            null, // image_credit
            null, // overlay
            description, null // wiki
            );
            // DataStoreに追加
            DataStore.addRecObjectAndRender(recObject);
            this.saveObject(recObject);
            const userObjectRec = document.getElementById('userObject-rec');
            if (userObjectRec) {
                userObjectRec.style.display = 'none';
            }
            const mainTypeSelect = document.getElementById('addObject-typeSelect');
            if (mainTypeSelect) {
                mainTypeSelect.style.display = 'none';
            }
            // フォームを白紙に
            this.clearForm([
                nameInput, altnameInput, typeSelect, raInput, decInput,
                magnitudeInput, descriptionInput
            ]);
        }
    }
    static addEllipticObject() {
        const typeSelect = document.getElementById('userObject-elliptic-type');
        const jpnNameInput = document.getElementById('userObject-elliptic-jpnName');
        const hiraganaNameInput = document.getElementById('userObject-elliptic-hiraganaName');
        const engNameInput = document.getElementById('userObject-elliptic-engName');
        const epochTypeSelect = document.getElementById('userObject-elliptic-type');
        const epochYmdInput = document.getElementById('userObject-elliptic-ymd');
        const epochJdInput = document.getElementById('userObject-elliptic-jd');
        const aInput = document.getElementById('userObject-elliptic-a');
        const eInput = document.getElementById('userObject-elliptic-e');
        const iInput = document.getElementById('userObject-elliptic-i');
        const nodeInput = document.getElementById('userObject-elliptic-node');
        const periInput = document.getElementById('userObject-elliptic-peri');
        const m0Input = document.getElementById('userObject-elliptic-m0');
        const hInput = document.getElementById('userObject-elliptic-h');
        const gInput = document.getElementById('userObject-elliptic-g');
        if (typeSelect && jpnNameInput && hiraganaNameInput && engNameInput && epochTypeSelect && epochYmdInput && epochJdInput && aInput && eInput && iInput && nodeInput && periInput && m0Input && hInput && gInput) {
            const type = typeSelect.value;
            const jpnName = jpnNameInput.value.trim();
            if (jpnName.length === 0) {
                this.showError('jpnName', jpnNameInput, '日本語名を入力してください');
                return;
            }
            else {
                this.clearError('jpnName', jpnNameInput);
            }
            let hiraganaName = hiraganaNameInput.value.trim();
            if (hiraganaName.length === 0) {
                hiraganaName = jpnName;
            }
            let engName = engNameInput.value.trim();
            if (engName.length === 0) {
                engName = jpnName;
            }
            const epochType = epochTypeSelect.value;
            let epoch;
            if (epochType === 'ymd') {
                try {
                    const epochYmd = epochYmdInput.value;
                    const epochYmdArray = epochYmd.split('-');
                    const year = parseInt(epochYmdArray[0]);
                    const month = parseInt(epochYmdArray[1]);
                    const day = parseFloat(epochYmdArray[2]);
                    epoch = AstronomicalCalculator.calculateJdFromYmdhms(year, month, day);
                    this.clearError('epoch', epochYmdInput);
                }
                catch (error) {
                    this.showError('epoch', epochYmdInput, '元期はYYYY-MM-DD(.dd)の形式で入力してください');
                    return;
                }
            }
            else {
                try {
                    epoch = parseFloat(epochJdInput.value);
                    this.clearError('epoch', epochJdInput);
                }
                catch (error) {
                    this.showError('epoch', epochJdInput, '元期を入力または修正してください');
                    return;
                }
            }
            const a = parseFloat(aInput.value);
            if (isNaN(a) || a <= 0) {
                this.showError('a', aInput, '軌道長半径を入力または修正してください');
                return;
            }
            else {
                this.clearError('a', aInput);
            }
            const e = parseFloat(eInput.value);
            if (isNaN(e) || e < 0 || e >= 1) {
                this.showError('e', eInput, '離心率を入力または修正してください');
                return;
            }
            else {
                this.clearError('e', eInput);
            }
            const i = parseFloat(iInput.value);
            if (isNaN(i) || i < 0 || i >= 180) {
                this.showError('i', iInput, '軌道傾斜角を入力または修正してください');
                return;
            }
            else {
                this.clearError('i', iInput);
            }
            const node = parseFloat(nodeInput.value);
            if (isNaN(node) || node < 0 || node >= 360) {
                this.showError('node', nodeInput, '昇交点黄経を入力または修正してください');
                return;
            }
            else {
                this.clearError('node', nodeInput);
            }
            const peri = parseFloat(periInput.value);
            if (isNaN(peri) || peri < 0 || peri >= 360) {
                this.showError('peri', periInput, '近日点引数を入力または修正してください');
                return;
            }
            else {
                this.clearError('peri', periInput);
            }
            const m0 = parseFloat(m0Input.value);
            if (isNaN(m0) || m0 < 0 || m0 >= 360) {
                this.showError('m0', m0Input, '元期の平均近点角を入力または修正してください');
                return;
            }
            else {
                this.clearError('m0', m0Input);
            }
            let h = parseFloat(hInput.value);
            if (hInput.value.length > 0 && isNaN(h)) {
                this.showError('h', hInput, '絶対等級を入力または修正してください');
                return;
            }
            else {
                h = 100.0;
                this.clearError('h', hInput);
            }
            let g = parseFloat(gInput.value);
            if (gInput.value.length > 0 && isNaN(g)) {
                this.showError('g', gInput, '位相係数を入力または修正してください');
                return;
            }
            else {
                g = 0.15;
                this.clearError('g', gInput);
            }
            let ellipticObject = new SolarSystemObjectBase({
                jpnName: jpnName,
                hiraganaName: hiraganaName,
                engName: engName,
                type: type,
                xyz: { x: 0, y: 0, z: 0 },
                raDec: { ra: 0, dec: 0 },
                distance: 0,
                magnitude: 0,
                orbit: {
                    t0: epoch,
                    a: a,
                    e: e,
                    incl: i,
                    node: node,
                    peri: peri,
                    m0: m0,
                    H: h,
                    G: g
                }
            });
            if (type === 'asteroid') {
                ellipticObject = new Asteroid(ellipticObject);
            }
            else {
                ellipticObject = new Comet(ellipticObject);
            }
            SolarSystemDataManager.addObjectAndRender(ellipticObject);
            this.saveObject(ellipticObject);
            const userObjectElliptic = document.getElementById('userObject-elliptic');
            if (userObjectElliptic) {
                userObjectElliptic.style.display = 'none';
            }
            const mainTypeSelect = document.getElementById('addObject-typeSelect');
            if (mainTypeSelect) {
                mainTypeSelect.style.display = 'none';
            }
            // フォームを白紙に
            this.clearForm([
                jpnNameInput, hiraganaNameInput, engNameInput, epochTypeSelect, epochYmdInput, epochJdInput,
                aInput, eInput, iInput, nodeInput, periInput, m0Input, hInput, gInput
            ]);
        }
    }
    static addParabolicObject() {
        console.log('addParabolicObject clicked');
    }
    static addHyperbolicObject() {
        console.log('addHyperbolicObject clicked');
    }
    static errorDiv(id, message, input) {
        const errorDiv = document.createElement('div');
        errorDiv.id = id;
        errorDiv.className = 'userObject-error-message';
        errorDiv.style.color = 'red';
        errorDiv.style.fontSize = '12px';
        errorDiv.style.marginTop = '5px';
        errorDiv.textContent = message;
        input.parentNode?.insertBefore(errorDiv, input.nextSibling);
        return errorDiv;
    }
    // エラーメッセージを表示するメソッド
    static showError(title, input, message) {
        // 既存のエラーメッセージを削除
        this.clearError(title, input);
        input.style.border = '2px solid red';
        // input.style.backgroundColor = '#ffebee';
        input.focus();
        // エラーメッセージ要素を作成
        this.errorDiv(`userObject-${title}-error`, message, input);
    }
    // エラー状態をクリアするメソッド
    static clearError(title, input) {
        // 枠の色を元に戻す
        input.style.border = '';
        // input.style.backgroundColor = '';
        // エラーメッセージを削除
        const errorDiv = document.getElementById(`userObject-${title}-error`);
        if (errorDiv) {
            errorDiv.remove();
        }
    }
    static clearAllErrors() {
        const errorDivs = document.getElementsByClassName('userObject-error-message');
        for (const errorDiv of errorDivs) {
            if (errorDiv instanceof HTMLElement) {
                errorDiv.remove();
            }
        }
    }
    // フォームをクリアするメソッド
    static clearForm(inputs) {
        for (const input of inputs) {
            input.value = '';
        }
        this.clearAllErrors();
    }
    //localstorageに保存する
    //["userRecs": [MessierObject], "userSolarSystem": [SolarSystemObjectBase], ...]
    static saveObject(object) {
        const savedUserObjectData = localStorage.getItem('userObject');
        if (savedUserObjectData) {
            const savedUserObjects = JSON.parse(savedUserObjectData);
            if (object instanceof MessierObject) {
                savedUserObjects.userRecs.push(object);
            }
            else {
                savedUserObjects.userSolarSystem.push(object);
            }
            localStorage.setItem('userObject', JSON.stringify(savedUserObjects));
        }
        else {
            if (object instanceof MessierObject) {
                const savedUserObjects = { userRecs: [object], userSolarSystem: [] };
                localStorage.setItem('userObject', JSON.stringify(savedUserObjects));
            }
            else {
                const savedUserObjects = { userRecs: [], userSolarSystem: [object] };
                localStorage.setItem('userObject', JSON.stringify(savedUserObjects));
            }
        }
    }
}
UserObjectController.coordinateConverter = new CoordinateConverter();
//# sourceMappingURL=UserObjectController.js.map