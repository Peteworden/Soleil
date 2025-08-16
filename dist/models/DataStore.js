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
    static updateRecObject(name, updatedObject) {
        const index = this.recData.findIndex(obj => obj.getName() === name);
        if (index !== -1) {
            this.recData[index] = updatedObject;
            return true;
        }
        return false;
    }
    // レンダリング更新をトリガーするメソッド
    static triggerRenderUpdate() {
        if (window.renderAll) {
            window.renderAll();
        }
    }
    // メシエデータを更新してレンダリングをトリガーする
    static updateRecDataAndRender(data) {
        this.setRecData(data);
        this.triggerRenderUpdate();
    }
    static addRecObjectAndRender(object) {
        this.addRecObject(object);
        this.triggerRenderUpdate();
    }
    static removeRecObjectAndRender(name) {
        const result = this.removeRecObject(name);
        if (result) {
            this.triggerRenderUpdate();
        }
        return result;
    }
    static updateRecObjectAndRender(name, updatedObject) {
        const result = this.updateRecObject(name, updatedObject);
        if (result) {
            this.triggerRenderUpdate();
        }
        return result;
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