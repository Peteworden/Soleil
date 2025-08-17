import { MessierObject } from "../models/CelestialObject.js";
import { CoordinateConverter } from "../utils/coordinates.js";
import { DataStore } from "../models/DataStore.js";
import { AstronomicalCalculator } from "../utils/calculations.js";
import { Asteroid, Comet, SolarSystemDataManager } from "../models/SolarSystemObjects.js";
import { ObjectInfoController } from "./ObjectInfoController.js";
export class UserObjectController {
    static init() {
        const openUserObjectManage = document.getElementById('openUserObjectManage');
        //トップ画面
        const userObjectManage = document.getElementById('userObject-manage');
        const backToUserObjectManage = document.getElementsByClassName('back-to-userObject-manage');
        const closeUserObjectManage = document.getElementById('userObject-close-manage');
        const finishManageButton = document.getElementById('userObject-finish-manage');
        // 新規天体の情報を入力するページへ行くボタン
        const newUserObjectRecButton = document.getElementById('userObject-rec-button');
        const newUserObjectEllipticButton = document.getElementById('userObject-elliptic-button');
        const newUserObjectParabolicButton = document.getElementById('userObject-parabolic-button');
        const newUserObjectHyperbolicButton = document.getElementById('userObject-hyperbolic-button');
        const userObjectRec = document.getElementById('userObject-rec');
        const userObjectElliptic = document.getElementById('userObject-elliptic');
        const userObjectParabolic = document.getElementById('userObject-parabolic');
        const userObjectHyperbolic = document.getElementById('userObject-hyperbolic');
        const saveObjectRecButton = document.getElementById('userObject-rec-add-button');
        const saveObjectEllipticButton = document.getElementById('userObject-elliptic-add-button');
        const saveObjectParabolicButton = document.getElementById('userObject-parabolic-add-button');
        const saveObjectHyperbolicButton = document.getElementById('userObject-hyperbolic-add-button');
        //トップ画面
        if (userObjectManage) {
            this.setManagement();
        }
        if (openUserObjectManage && userObjectManage) {
            openUserObjectManage.addEventListener('click', () => {
                this.objectId = -1;
                userObjectManage.style.display = 'block';
            });
        }
        if (closeUserObjectManage && userObjectManage) {
            closeUserObjectManage.addEventListener('click', () => {
                this.objectId = -1;
                userObjectManage.style.display = 'none';
            });
        }
        if (finishManageButton && userObjectManage) {
            finishManageButton.addEventListener('click', () => {
                this.objectId = -1;
                userObjectManage.style.display = 'none';
            });
        }
        //追加ページへ移動
        if (newUserObjectRecButton && userObjectRec && userObjectManage) {
            newUserObjectRecButton.addEventListener('click', () => {
                this.clearRecForm();
                this.objectId = -1;
                userObjectManage.style.display = 'none';
                userObjectRec.style.display = 'block';
            });
        }
        if (newUserObjectEllipticButton && userObjectElliptic && userObjectManage) {
            newUserObjectEllipticButton.addEventListener('click', () => {
                this.clearEllipticForm();
                this.objectId = -1;
                userObjectManage.style.display = 'none';
                userObjectElliptic.style.display = 'block';
            });
        }
        if (newUserObjectParabolicButton && userObjectParabolic && userObjectManage) {
            newUserObjectParabolicButton.addEventListener('click', () => {
                this.clearParabolicForm();
                this.objectId = -1;
                userObjectParabolic.style.display = 'block';
                userObjectManage.style.display = 'none';
            });
        }
        if (newUserObjectHyperbolicButton && userObjectHyperbolic && userObjectManage) {
            newUserObjectHyperbolicButton.addEventListener('click', () => {
                this.clearHyperbolicForm();
                this.objectId = -1;
                userObjectHyperbolic.style.display = 'block';
                userObjectManage.style.display = 'none';
            });
        }
        if (backToUserObjectManage && userObjectRec && userObjectElliptic && userObjectParabolic && userObjectHyperbolic && userObjectManage) {
            Array.from(backToUserObjectManage).forEach((element) => {
                element.addEventListener('click', () => {
                    this.objectId = -1;
                    userObjectManage.style.display = 'block';
                    userObjectRec.style.display = 'none';
                    userObjectElliptic.style.display = 'none';
                    userObjectParabolic.style.display = 'none';
                    userObjectHyperbolic.style.display = 'none';
                });
            });
        }
        // 保存（追加、編集）
        if (saveObjectRecButton) {
            saveObjectRecButton.addEventListener('click', () => {
                this.saveRecObject();
            });
        }
        if (saveObjectEllipticButton) {
            saveObjectEllipticButton.addEventListener('click', () => {
                this.saveEllipticObject();
            });
        }
        if (saveObjectParabolicButton) {
            saveObjectParabolicButton.addEventListener('click', () => {
                this.saveParabolicObject();
            });
        }
        if (saveObjectHyperbolicButton) {
            saveObjectHyperbolicButton.addEventListener('click', () => {
                this.saveHyperbolicObject();
            });
        }
    }
    // LocalStorageをもとに表を作成する
    static setManagement() {
        const userObjectRecItems = document.getElementById('userObject-rec-items');
        const userObjectSolarSystemItems = document.getElementById('userObject-solarSystem-items');
        if (!userObjectRecItems || !userObjectSolarSystemItems)
            return;
        // 既存の内容をクリア
        userObjectRecItems.innerHTML = '';
        userObjectSolarSystemItems.innerHTML = '';
        const localUserObjectData = localStorage.getItem('userObject');
        if (!localUserObjectData)
            return;
        const userObjectData = JSON.parse(localUserObjectData);
        if (!userObjectData)
            return;
        const nameWidth = 100;
        const typeWidth = 60;
        const raWidth = 80;
        const decWidth = 80;
        const editButtonWidth = 100;
        const deleteButtonWidth = 60;
        const userObjectManageItems = document.getElementsByClassName("userObject-manage-items");
        for (const item of userObjectManageItems) {
            item.style.minWidth = `${nameWidth + typeWidth + raWidth + decWidth + editButtonWidth + deleteButtonWidth}px`;
        }
        // 星雲・星団
        const userRecs = userObjectData.userRecs;
        if (userRecs && userRecs.length > 0) {
            // ヘッダー行を追加
            const headerRow = document.createElement('tr');
            headerRow.innerHTML = `
                <th width="${nameWidth}px">名前</th>
                <th width="${typeWidth}px">種類</th>
                <th width="${raWidth}px">赤経(J2000.0)</th>
                <th width="${decWidth}px">赤緯(J2000.0)</th>
                <th width="${editButtonWidth}px"></th>
                <th width="${deleteButtonWidth}px"></th>
            `;
            userObjectRecItems.appendChild(headerRow);
            // データ行を追加
            for (const userRecItem of userRecs) {
                const userRecId = userRecItem.id;
                const userRec = userRecItem.content;
                const userRecElement = document.createElement('tr');
                userRecElement.className = 'userObject-manage-item';
                // プロパティに直接アクセス
                const ra = this.coordinateConverter.radeg2hm(userRec.coordinates.ra);
                const dec = this.coordinateConverter.decdeg2dm(userRec.coordinates.dec);
                userRecElement.innerHTML = `
                    <td width="${nameWidth}px">${userRec.name}</td>
                    <td width="${typeWidth}px">${ObjectInfoController.getObjectClassDescription(userRec.type || '?')}</td>
                    <td width="${raWidth}px">${ra[0]}h ${ra[1].toFixed(1)}m</td>
                    <td width="${decWidth}px">${dec[0]}${dec[1]}° ${dec[2]}'</td>
                    <td width="${editButtonWidth}px"><button class="userObject-item-edit" type="button">詳細・編集</button></td>
                    <td width="${deleteButtonWidth}px"><button class="userObject-item-delete" type="button">削除</button></td>
                `;
                // HTML挿入後にイベントリスナーを設定
                const editButton = userRecElement.querySelector('.userObject-item-edit');
                const deleteButton = userRecElement.querySelector('.userObject-item-delete');
                if (editButton) {
                    editButton.addEventListener('click', () => {
                        this.editUserRecObject(userRecId, userRec);
                    });
                }
                if (deleteButton) {
                    deleteButton.addEventListener('click', () => {
                        this.confirmDeleteUserObject('rec', userRecId, userRec.name);
                    });
                }
                userObjectRecItems.appendChild(userRecElement);
            }
        }
        else {
            // データがない場合
            const noDataRow = document.createElement('tr');
            noDataRow.innerHTML = '<td colspan="5">お気に入り天体がありません</td>';
            userObjectRecItems.appendChild(noDataRow);
        }
        // 太陽系天体の処理
        const userSolarSystem = userObjectData.userSolarSystem;
        if (userSolarSystem && userSolarSystem.length > 0) {
            // ヘッダー行を追加
            const solarSystemHeaderRow = document.createElement('tr');
            solarSystemHeaderRow.innerHTML = `
                <th width="${nameWidth}px">名前</th>
                <th width="${typeWidth}px">種類</th>
                <th width="${editButtonWidth}px"></th>
                <th width="${deleteButtonWidth}px"></th>
            `;
            userObjectSolarSystemItems.appendChild(solarSystemHeaderRow);
            // データ行を追加
            for (const userSolarSystemItem of userSolarSystem) {
                const userSolarSystemId = userSolarSystemItem.id;
                const userSolarSystemObject = userSolarSystemItem.content;
                const userSolarSystemElement = document.createElement('tr');
                userSolarSystemElement.className = 'userObject-manage-item';
                userSolarSystemElement.innerHTML = `
                    <td width="${nameWidth}px">${userSolarSystemObject.jpnName}</td>
                    <td width="${typeWidth}px">${userSolarSystemObject.type == 'asteroid' ? '小惑星' : '彗星'}</td>
                    <td width="${editButtonWidth}px"><button class="userObject-item-edit" type="button">詳細・編集</button></td>
                    <td width="${deleteButtonWidth}px"><button class="userObject-item-delete" type="button">削除</button></td>
                `;
                // HTML挿入後にイベントリスナーを設定
                const editButton = userSolarSystemElement.querySelector('.userObject-item-edit');
                const deleteButton = userSolarSystemElement.querySelector('.userObject-item-delete');
                if (editButton) {
                    editButton.addEventListener('click', () => {
                        this.editUserSolarSystemObject(userSolarSystemId, userSolarSystemObject);
                    });
                }
                if (deleteButton) {
                    deleteButton.addEventListener('click', () => {
                        this.confirmDeleteUserObject('solarSystem', userSolarSystemId, userSolarSystemObject.jpnName);
                    });
                }
                userObjectSolarSystemItems.appendChild(userSolarSystemElement);
            }
        }
        else {
            // データがない場合
            const noDataRow = document.createElement('tr');
            noDataRow.innerHTML = '<td colspan="5">お気に入り天体がありません</td>';
            userObjectSolarSystemItems.appendChild(noDataRow);
        }
    }
    static saveRecObject() {
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
            const previousName = this.deleteUserObject('rec', this.objectId);
            this.saveObject(this.objectId, recObject);
            DataStore.updateRecObjectAndRender(previousName, recObject);
            this.objectId = -1;
            this.setManagement();
            const userObjectRec = document.getElementById('userObject-rec');
            if (userObjectRec) {
                userObjectRec.style.display = 'none';
            }
            const userObjectManage = document.getElementById('userObject-manage');
            if (userObjectManage) {
                userObjectManage.style.display = 'block';
            }
            // フォームを白紙に
            this.clearRecForm();
        }
    }
    static saveEllipticObject() {
        const typeSelect = document.getElementById('userObject-elliptic-type');
        const jpnNameInput = document.getElementById('userObject-elliptic-jpnName');
        const hiraganaNameInput = document.getElementById('userObject-elliptic-hiraganaName');
        const engNameInput = document.getElementById('userObject-elliptic-engName');
        const epochTypeSelect = document.getElementById('userObject-elliptic-epochType');
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
                    if (isNaN(epoch)) {
                        this.showError('epoch', epochYmdInput, '元期はYYYY-MM-DD(.dd)の形式で入力してください');
                        return;
                    }
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
                    if (isNaN(epoch)) {
                        this.showError('epoch', epochJdInput, '元期を入力または修正してください');
                        return;
                    }
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
                if (hInput.value.length === 0) {
                    h = 100.0;
                }
                this.clearError('h', hInput);
            }
            let g = parseFloat(gInput.value);
            if (gInput.value.length > 0 && isNaN(g)) {
                this.showError('g', gInput, '位相係数を入力または修正してください');
                return;
            }
            else {
                if (gInput.value.length === 0) {
                    g = 0.15;
                }
                this.clearError('g', gInput);
            }
            const ellipticObjectJson = {
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
            };
            const previousName = this.deleteUserObject('solarSystem', this.objectId);
            if (type === 'asteroid') {
                const ellipticObject = new Asteroid(ellipticObjectJson);
                this.saveObject(this.objectId, ellipticObject);
                SolarSystemDataManager.updateObjectAndRender(previousName, ellipticObject);
            }
            else {
                const ellipticObject = new Comet(ellipticObjectJson);
                this.saveObject(this.objectId, ellipticObject);
                SolarSystemDataManager.updateObjectAndRender(previousName, ellipticObject);
            }
            this.objectId = -1;
            this.setManagement();
            const userObjectElliptic = document.getElementById('userObject-elliptic');
            if (userObjectElliptic) {
                userObjectElliptic.style.display = 'none';
            }
            const userObjectManage = document.getElementById('userObject-manage');
            if (userObjectManage) {
                userObjectManage.style.display = 'block';
            }
            // フォームを白紙に
            this.clearEllipticForm();
        }
    }
    static saveParabolicObject() {
        const jpnNameInput = document.getElementById('userObject-parabolic-jpnName');
        const hiraganaNameInput = document.getElementById('userObject-parabolic-hiraganaName');
        const engNameInput = document.getElementById('userObject-parabolic-engName');
        const epochTypeSelect = document.getElementById('userObject-parabolic-epochType');
        const epochYmdInput = document.getElementById('userObject-parabolic-ymd');
        const epochJdInput = document.getElementById('userObject-parabolic-jd');
        const qInput = document.getElementById('userObject-parabolic-q');
        const iInput = document.getElementById('userObject-parabolic-i');
        const nodeInput = document.getElementById('userObject-parabolic-node');
        const periInput = document.getElementById('userObject-parabolic-peri');
        if (jpnNameInput && hiraganaNameInput && engNameInput && epochTypeSelect && epochYmdInput && epochJdInput && qInput && iInput && nodeInput && periInput) {
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
            const q = parseFloat(qInput.value);
            if (isNaN(q) || q <= 0) {
                this.showError('q', qInput, '近日点距離を入力または修正してください');
                return;
            }
            else {
                this.clearError('q', qInput);
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
            const hyperbolicObject = new Comet({
                jpnName: jpnName,
                hiraganaName: hiraganaName,
                engName: engName,
                type: 'comet',
                xyz: { x: 0, y: 0, z: 0 },
                raDec: { ra: 0, dec: 0 },
                distance: 0,
                magnitude: 0,
                orbit: {
                    t0: epoch,
                    q: q,
                    e: 1,
                    incl: i,
                    node: node,
                    peri: peri,
                    H: 100.0,
                    G: 0.15
                }
            });
            const previousName = this.deleteUserObject('solarSystem', this.objectId);
            this.saveObject(this.objectId, hyperbolicObject);
            SolarSystemDataManager.updateObjectAndRender(previousName, hyperbolicObject);
            this.objectId = -1;
            this.setManagement();
            const userObjectParabolic = document.getElementById('userObject-parabolic');
            if (userObjectParabolic) {
                userObjectParabolic.style.display = 'none';
            }
            const userObjectManage = document.getElementById('userObject-manage');
            if (userObjectManage) {
                userObjectManage.style.display = 'block';
            }
            this.clearHyperbolicForm();
        }
    }
    static saveHyperbolicObject() {
        const jpnNameInput = document.getElementById('userObject-hyperbolic-jpnName');
        const hiraganaNameInput = document.getElementById('userObject-hyperbolic-hiraganaName');
        const engNameInput = document.getElementById('userObject-hyperbolic-engName');
        const epochTypeSelect = document.getElementById('userObject-hyperbolic-epochType');
        const epochYmdInput = document.getElementById('userObject-hyperbolic-ymd');
        const epochJdInput = document.getElementById('userObject-hyperbolic-jd');
        const qInput = document.getElementById('userObject-hyperbolic-q');
        const eInput = document.getElementById('userObject-hyperbolic-e');
        const iInput = document.getElementById('userObject-hyperbolic-i');
        const nodeInput = document.getElementById('userObject-hyperbolic-node');
        const periInput = document.getElementById('userObject-hyperbolic-peri');
        if (jpnNameInput && hiraganaNameInput && engNameInput && epochTypeSelect && epochYmdInput && epochJdInput && qInput && eInput && iInput && nodeInput && periInput) {
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
            const q = parseFloat(qInput.value);
            if (isNaN(q) || q <= 0) {
                this.showError('q', qInput, '近日点距離を入力または修正してください');
                return;
            }
            else {
                this.clearError('q', qInput);
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
            const hyperbolicObject = new Comet({
                jpnName: jpnName,
                hiraganaName: hiraganaName,
                engName: engName,
                type: 'comet',
                xyz: { x: 0, y: 0, z: 0 },
                raDec: { ra: 0, dec: 0 },
                distance: 0,
                magnitude: 0,
                orbit: {
                    t0: epoch,
                    q: q,
                    e: e,
                    incl: i,
                    node: node,
                    peri: peri,
                    H: 100.0,
                    G: 0.15
                }
            });
            const previousName = this.deleteUserObject('solarSystem', this.objectId);
            this.saveObject(this.objectId, hyperbolicObject);
            SolarSystemDataManager.updateObjectAndRender(previousName, hyperbolicObject);
            this.objectId = -1;
            this.setManagement();
            const userObjectHyperbolic = document.getElementById('userObject-hyperbolic');
            if (userObjectHyperbolic) {
                userObjectHyperbolic.style.display = 'none';
            }
            const userObjectManage = document.getElementById('userObject-manage');
            if (userObjectManage) {
                userObjectManage.style.display = 'block';
            }
            this.clearHyperbolicForm();
        }
    }
    // 記録していた内容を書き込む
    static editUserRecObject(userRecId, userRec) {
        const userObjectManage = document.getElementById('userObject-manage');
        if (userObjectManage)
            userObjectManage.style.display = 'none';
        const userObjectRec = document.getElementById('userObject-rec');
        if (!userObjectRec)
            return;
        this.clearRecForm();
        const ra = this.coordinateConverter.radeg2hm(userRec.coordinates.ra);
        const dec = this.coordinateConverter.decdeg2dm(userRec.coordinates.dec);
        const fieldMappings = {
            'userObject-rec-name': userRec.name,
            'userObject-rec-altname': userRec.alt_name.join(','),
            'userObject-rec-type': userRec.type,
            'userObject-rec-ra': ra[0] + ' ' + ra[1].toFixed(1),
            'userObject-rec-dec': dec[0] + dec[1] + ' ' + dec[2],
            'userObject-rec-mag': (userRec.magnitude == 100) ? '' : userRec.magnitude,
            'userObject-rec-description': userRec.description || '',
        };
        for (const [id, value] of Object.entries(fieldMappings)) {
            const element = document.getElementById(id);
            if (element && value !== undefined) {
                element.value = String(value);
            }
        }
        this.clearAllErrors();
        const nameInput = document.getElementById('userObject-rec-name');
        if (nameInput) {
            nameInput.focus();
            nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        this.objectId = userRecId;
        userObjectRec.style.display = 'block';
    }
    static editUserSolarSystemObject(userObjectId, userObject) {
        const userObjectManage = document.getElementById('userObject-manage');
        if (userObjectManage)
            userObjectManage.style.display = 'none';
        const userObjectElliptic = document.getElementById('userObject-elliptic');
        const userObjectParabolic = document.getElementById('userObject-parabolic');
        const userObjectHyperbolic = document.getElementById('userObject-hyperbolic');
        if (!userObjectElliptic || !userObjectParabolic || !userObjectHyperbolic)
            return;
        this.clearEllipticForm();
        this.clearParabolicForm();
        this.clearHyperbolicForm();
        console.log(userObject);
        const orbit_ymdhms = AstronomicalCalculator.calculateYmdhmsFromJd(userObject.orbit.t0);
        const orbit_ymd = `${orbit_ymdhms.year}-${orbit_ymdhms.month}-${(orbit_ymdhms.day + orbit_ymdhms.hour / 24 + orbit_ymdhms.minute / 1440).toFixed(2)}`;
        const orbitType = userObject.orbit.e < 0.99999999 ? 'elliptic' : (userObject.orbit.e < 1.00000001 ? 'parabolic' : 'hyperbolic');
        let fieldMappings = {
            [`userObject-${orbitType}-type`]: userObject.type,
            [`userObject-${orbitType}-jpnName`]: userObject.jpnName,
            [`userObject-${orbitType}-hiraganaName`]: userObject.hiraganaName,
            [`userObject-${orbitType}-engName`]: userObject.engName,
            [`userObject-${orbitType}-epochType`]: 'ymd',
            [`userObject-${orbitType}-ymd`]: orbit_ymd,
            [`userObject-${orbitType}-jd`]: userObject.orbit.t0,
            [`userObject-${orbitType}-i`]: userObject.orbit.incl,
            [`userObject-${orbitType}-node`]: userObject.orbit.node,
            [`userObject-${orbitType}-peri`]: userObject.orbit.peri,
        };
        if (orbitType === 'elliptic') {
            const orbit = userObject.orbit;
            fieldMappings['userObject-elliptic-a'] = orbit.a;
            fieldMappings['userObject-elliptic-e'] = orbit.e;
            fieldMappings['userObject-elliptic-m0'] = orbit.m0;
            fieldMappings['userObject-elliptic-h'] = (orbit.H == 100.0 || orbit.H == undefined) ? '' : orbit.H.toString();
            fieldMappings['userObject-elliptic-g'] = orbit.G || 0.15;
        }
        else if (orbitType === 'parabolic') {
            const orbit = userObject.orbit;
            fieldMappings['userObject-parabolic-q'] = orbit.q;
            fieldMappings['userObject-parabolic-e'] = orbit.e;
        }
        else if (orbitType === 'hyperbolic') {
            const orbit = userObject.orbit;
            fieldMappings['userObject-hyperbolic-q'] = orbit.q;
            fieldMappings['userObject-hyperbolic-e'] = orbit.e;
        }
        for (const [id, value] of Object.entries(fieldMappings)) {
            const element = document.getElementById(id);
            if (element && value !== undefined) {
                element.value = String(value);
            }
        }
        this.clearAllErrors();
        const nameInput = document.getElementById(`userObject-${orbitType}-jpnName`);
        if (nameInput) {
            nameInput.focus();
            nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        this.objectId = userObjectId;
        if (orbitType === 'elliptic') {
            userObjectElliptic.style.display = 'block';
        }
        else if (orbitType === 'parabolic') {
            userObjectParabolic.style.display = 'block';
        }
        else if (orbitType === 'hyperbolic') {
            userObjectHyperbolic.style.display = 'block';
        }
    }
    //削除ボタンが押されたら一旦確認の画面を出す
    static confirmDeleteUserObject(type, id, name) {
        // モーダルオーバーレイ
        const confirmDeleteDiv = document.createElement('div');
        confirmDeleteDiv.id = 'confirmDeleteDiv';
        confirmDeleteDiv.style.position = 'fixed';
        confirmDeleteDiv.style.top = '0';
        confirmDeleteDiv.style.left = '0';
        confirmDeleteDiv.style.width = '100%';
        confirmDeleteDiv.style.height = '100%';
        confirmDeleteDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        confirmDeleteDiv.style.zIndex = '120';
        confirmDeleteDiv.style.display = 'flex';
        confirmDeleteDiv.style.alignItems = 'center';
        confirmDeleteDiv.style.justifyContent = 'center';
        document.body.appendChild(confirmDeleteDiv);
        // モーダルコンテナ
        const modalContainer = document.createElement('div');
        modalContainer.style.backgroundColor = '#1e293b';
        modalContainer.style.border = '2px solid #b3c9ed';
        modalContainer.style.borderRadius = '12px';
        modalContainer.style.padding = '30px';
        modalContainer.style.maxWidth = '400px';
        modalContainer.style.width = '90%';
        modalContainer.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.5)';
        modalContainer.style.textAlign = 'center';
        modalContainer.style.position = 'relative';
        confirmDeleteDiv.appendChild(modalContainer);
        // 警告アイコン
        const warningIcon = document.createElement('div');
        warningIcon.innerHTML = '⚠️';
        warningIcon.style.fontSize = '48px';
        warningIcon.style.marginBottom = '20px';
        modalContainer.appendChild(warningIcon);
        // 確認テキスト
        const confirmDeleteText = document.createElement('div');
        confirmDeleteText.id = 'confirmDeleteText';
        confirmDeleteText.style.color = '#e2e8f0';
        confirmDeleteText.style.fontSize = '18px';
        confirmDeleteText.style.fontWeight = 'bold';
        confirmDeleteText.style.marginBottom = '30px';
        confirmDeleteText.style.lineHeight = '1.5';
        confirmDeleteText.textContent = `${name}を削除しますか？`;
        modalContainer.appendChild(confirmDeleteText);
        // ボタンコンテナ
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '15px';
        buttonContainer.style.justifyContent = 'center';
        modalContainer.appendChild(buttonContainer);
        // キャンセルボタン
        const confirmDeleteCancelButton = document.createElement('button');
        confirmDeleteCancelButton.id = 'confirmDeleteCancelButton';
        confirmDeleteCancelButton.textContent = 'キャンセル';
        confirmDeleteCancelButton.style.padding = '12px 24px';
        confirmDeleteCancelButton.style.fontSize = '16px';
        confirmDeleteCancelButton.style.fontWeight = 'bold';
        confirmDeleteCancelButton.style.border = '2px solid #64748b';
        confirmDeleteCancelButton.style.borderRadius = '8px';
        confirmDeleteCancelButton.style.backgroundColor = 'transparent';
        confirmDeleteCancelButton.style.color = '#64748b';
        confirmDeleteCancelButton.style.cursor = 'pointer';
        confirmDeleteCancelButton.style.transition = 'all 0.3s ease';
        confirmDeleteCancelButton.style.minWidth = '100px';
        buttonContainer.appendChild(confirmDeleteCancelButton);
        // 削除ボタン
        const confirmDeleteButton = document.createElement('button');
        confirmDeleteButton.id = 'confirmDeleteButton';
        confirmDeleteButton.textContent = '削除';
        confirmDeleteButton.style.padding = '12px 24px';
        confirmDeleteButton.style.fontSize = '16px';
        confirmDeleteButton.style.fontWeight = 'bold';
        confirmDeleteButton.style.border = '2px solid #ef4444';
        confirmDeleteButton.style.borderRadius = '8px';
        confirmDeleteButton.style.backgroundColor = '#ef4444';
        confirmDeleteButton.style.color = 'white';
        confirmDeleteButton.style.cursor = 'pointer';
        confirmDeleteButton.style.transition = 'all 0.3s ease';
        confirmDeleteButton.style.minWidth = '100px';
        buttonContainer.appendChild(confirmDeleteButton);
        // ホバー効果
        confirmDeleteCancelButton.addEventListener('mouseenter', () => {
            confirmDeleteCancelButton.style.backgroundColor = '#64748b';
            confirmDeleteCancelButton.style.color = 'white';
        });
        confirmDeleteCancelButton.addEventListener('mouseleave', () => {
            confirmDeleteCancelButton.style.backgroundColor = 'transparent';
            confirmDeleteCancelButton.style.color = '#64748b';
        });
        confirmDeleteButton.addEventListener('mouseenter', () => {
            confirmDeleteButton.style.backgroundColor = '#dc2626';
            confirmDeleteButton.style.borderColor = '#dc2626';
        });
        confirmDeleteButton.addEventListener('mouseleave', () => {
            confirmDeleteButton.style.backgroundColor = '#ef4444';
            confirmDeleteButton.style.borderColor = '#ef4444';
        });
        // イベントリスナー
        confirmDeleteButton.addEventListener('click', () => {
            this.deleteUserObject(type, id);
            this.setManagement();
            confirmDeleteDiv.remove();
        });
        confirmDeleteCancelButton.addEventListener('click', () => {
            confirmDeleteDiv.remove();
        });
        // ESCキーでキャンセル
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                confirmDeleteDiv.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        // オーバーレイクリックでキャンセル
        confirmDeleteDiv.addEventListener('click', (event) => {
            if (event.target === confirmDeleteDiv) {
                confirmDeleteDiv.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        });
    }
    // 本当に削除する
    static deleteUserObject(type, userObjectId) {
        const savedUserObjectData = localStorage.getItem('userObject');
        let ans = '';
        if (savedUserObjectData) {
            const savedUserObjects = JSON.parse(savedUserObjectData);
            if (type === 'rec') {
                const previousObject = savedUserObjects.userRecs.find(obj => obj.id === userObjectId);
                if (previousObject) {
                    ans = previousObject.content.name;
                }
                savedUserObjects.userRecs = savedUserObjects.userRecs.filter(obj => obj.id !== userObjectId);
            }
            else if (type === 'solarSystem') {
                const previousObject = savedUserObjects.userSolarSystem.find(obj => obj.id === userObjectId);
                if (previousObject) {
                    ans = previousObject.content.jpnName;
                }
                savedUserObjects.userSolarSystem = savedUserObjects.userSolarSystem.filter(obj => obj.id !== userObjectId);
            }
            else {
                return '';
            }
            localStorage.setItem('userObject', JSON.stringify(savedUserObjects));
        }
        return ans;
    }
    static errorDiv(id, message, input) {
        const errorDiv = document.createElement('div');
        errorDiv.id = id;
        errorDiv.className = 'userObject-error-message';
        errorDiv.style.color = 'red';
        errorDiv.style.fontSize = '12px';
        errorDiv.style.marginTop = '5px';
        errorDiv.style.width = '100px';
        errorDiv.style.minWidth = '100px';
        errorDiv.style.flexShrink = '0';
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
    static removeAllErrorDivs() {
        const errorDivs = document.getElementsByClassName('userObject-error-message');
        for (const errorDiv of errorDivs) {
            if (errorDiv instanceof HTMLElement) {
                errorDiv.remove();
            }
        }
    }
    static clearAllErrors() {
        this.removeAllErrorDivs();
    }
    // フォームをクリアするメソッド
    static clearForm(inputs) {
        for (const input of inputs) {
            if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
                input.value = '';
            }
        }
        this.clearAllErrors();
    }
    static clearRecForm() {
        // userObject-rec内のすべてのinput要素を取得してクリア
        const recForm = document.getElementById('userObject-rec');
        if (recForm) {
            const inputs = recForm.querySelectorAll('input, textarea, select');
            for (const input of inputs) {
                if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
                    input.value = '';
                }
                else if (input instanceof HTMLSelectElement) {
                    // selectの場合は最初のoptionを選択
                    if (input.options.length > 0) {
                        input.selectedIndex = 0;
                    }
                }
                input.style.border = '';
            }
        }
        this.clearAllErrors();
    }
    static clearEllipticForm() {
        // userObject-elliptic内のすべてのinput要素を取得してクリア
        const ellipticForm = document.getElementById('userObject-elliptic');
        if (ellipticForm) {
            const inputs = ellipticForm.querySelectorAll('input, textarea, select');
            for (const input of inputs) {
                if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
                    input.value = '';
                }
                else if (input instanceof HTMLSelectElement) {
                    // selectの場合は最初のoptionを選択
                    if (input.options.length > 0) {
                        input.selectedIndex = 0;
                    }
                }
            }
        }
        this.clearAllErrors();
    }
    static clearParabolicForm() {
        // userObject-parabolic内のすべてのinput要素を取得してクリア
        const parabolicForm = document.getElementById('userObject-parabolic');
        if (parabolicForm) {
            const inputs = parabolicForm.querySelectorAll('input, textarea, select');
            for (const input of inputs) {
                if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
                    input.value = '';
                }
                else if (input instanceof HTMLSelectElement) {
                    // selectの場合は最初のoptionを選択
                    if (input.options.length > 0) {
                        input.selectedIndex = 0;
                    }
                }
            }
        }
        this.clearAllErrors();
    }
    static clearHyperbolicForm() {
        // userObject-hyperbolic内のすべてのinput要素を取得してクリア
        const hyperbolicForm = document.getElementById('userObject-hyperbolic');
        if (hyperbolicForm) {
            const inputs = hyperbolicForm.querySelectorAll('input, textarea, select');
            for (const input of inputs) {
                if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
                    input.value = '';
                }
                else if (input instanceof HTMLSelectElement) {
                    // selectの場合は最初のoptionを選択
                    if (input.options.length > 0) {
                        input.selectedIndex = 0;
                    }
                }
            }
        }
        this.clearAllErrors();
    }
    //localstorageに保存する
    //["userRecs": {id:content:MessierObject, ...}, "userSolarSystem": {id:content:SolarSystemObjectBase, ...}, ...]]
    // id=-1は新規追加
    static saveObject(id, object) {
        const savedUserObjectData = localStorage.getItem('userObject');
        let ans = '';
        if (savedUserObjectData) {
            const savedUserObjects = JSON.parse(savedUserObjectData);
            if (object instanceof MessierObject) {
                // 最初のrec
                if (savedUserObjects.userRecs.length === 0) {
                    savedUserObjects.userRecs.push({ id: 0, content: object });
                }
                else {
                    const previousObject = savedUserObjects.userRecs.find(obj => obj.id === id);
                    if (previousObject) {
                        const previousName = previousObject.content.getName();
                        previousObject.content = object;
                        ans = previousName;
                    }
                    else { // ないはず
                        const biggestId = Math.max(...savedUserObjects.userRecs.map(obj => obj.id));
                        savedUserObjects.userRecs.push({ id: biggestId + 1, content: object });
                        console.log("userRecs was empty but id was not -1");
                    }
                }
            }
            else {
                if (savedUserObjects.userSolarSystem.length === 0) {
                    savedUserObjects.userSolarSystem.push({ id: 0, content: object });
                }
                else {
                    const previousObject = savedUserObjects.userSolarSystem.find(obj => obj.id === id);
                    if (previousObject) {
                        const previousName = previousObject.content.jpnName;
                        previousObject.content = object;
                        ans = previousName;
                    }
                    else {
                        const biggestId = Math.max(...savedUserObjects.userSolarSystem.map(obj => obj.id));
                        savedUserObjects.userSolarSystem.push({ id: biggestId + 1, content: object });
                    }
                }
            }
            localStorage.setItem('userObject', JSON.stringify(savedUserObjects));
        }
        else {
            if (object instanceof MessierObject) {
                const savedUserObjects = { userRecs: [{ id: 0, content: object }], userSolarSystem: [] };
                localStorage.setItem('userObject', JSON.stringify(savedUserObjects));
            }
            else {
                const savedUserObjects = { userRecs: [], userSolarSystem: [{ id: 0, content: object }] };
                localStorage.setItem('userObject', JSON.stringify(savedUserObjects));
            }
        }
        console.log("savedUserObjectData", localStorage.getItem('userObject'));
        return ans;
    }
}
UserObjectController.coordinateConverter = new CoordinateConverter();
UserObjectController.objectId = -1; // -1は新規追加, 基本は-1にする
//# sourceMappingURL=UserObjectController.js.map