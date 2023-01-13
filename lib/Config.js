const { load, update } = require('./file')

class Config {
    constructor(file) {
        this._f = file
        this._data = load(file)
    }
    getData() {
        return JSON.parse(JSON.stringify(this._data))
    }
    reload(file = this._f) {
        this._data = load(file)
        return this.getData()
    }
    update(data) {
        let up = update(this._f, data)
        if (!up) {
            return false
        }
        this._data = data
        return this.getData()
    }
}

module.exports = {
    Config
}