export class DataStore {
    // メシエデータ管理メソッド
    static getRecData() {
        return this.recData;
    }
    static setRecData(data) {
        this.recData = data;
    }
    static addRecObject(object) {
        this.recData.push(object);
    }
    static removeRecObject(name) {
        const index = this.recData.findIndex(obj => obj.getName() === name);
        if (index !== -1) {
            this.recData.splice(index, 1);
            return true;
        }
        return false;
    }
    static addRecObjectAndRender(object) {
        this.addRecObject(object);
        this.triggerRenderUpdate();
    }
    // nameには変更前の名前が入ることを想定している
    static updateRecObjectAndRender(name, object) {
        const index = this.recData.findIndex(obj => obj.getName() == name);
        if (name.length === 0 || index === -1) {
            this.recData.push(object);
        }
        else {
            this.recData[index] = object;
        }
        this.triggerRenderUpdate();
    }
    // レンダリング更新をトリガーするメソッド
    static triggerRenderUpdate() {
        if (window.renderAll) {
            window.renderAll();
        }
    }
}
DataStore.hipStars = [];
DataStore.gaia100Data = [];
DataStore.gaia101_110Data = [];
DataStore.gaia111_115Data = [];
DataStore.constellationData = [];
DataStore.messierData = [];
DataStore.recData = [];
DataStore.ngcData = [];
DataStore.starNames = [];
//# sourceMappingURL=DataStore.js.map