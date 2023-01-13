const { getNow } = require('./tools')
const { load, insertData, updateData } = require('./file')
const { DATA } = require('./constants')

class Player {
    constructor(mcPlayer, {
        email = null,
        state = 0,
        password,
        expired_at = getNow(),
        register_ip,
        register_at = getNow()
    }) {
        this.xuid = mcPlayer.xuid;
        this.uuid = mcPlayer.uuid;
        this.email = email;
        this.state = state;
        this.password = password;
        this.expired_at = expired_at;
        this.register_ip = register_ip;
        this.register_at = register_at;
    }
    add() {
        let [index, data] = existPlayerByXuid(this.xuid)
        if (!data) return null
        if (index !== null) return false
        return insertData(DATA, this)
    }
    _save() {
        let [index, data] = existPlayerByXuid(this.xuid)
        if (!data) return null
        if (index === null) return false
        return updateData(DATA, index, this)
    }
    chgPassword(password) {
        this.password = password
        return this._save()
    }
    chgExp(exp = 7 * 24 * 60 * 60 * 1000) {
        this.expired_at = getNow() + exp
        return this._save()
    }
    chgState(state) {
        this.state = state
        return this._save()

    }
    chgEmail(email) {
        this.email = email
        return this._save()
    }
    verify(password) {
        if (password !== this.password) return false
        return true
    }
}

function getPlayer(pl) {
    let [index, data] = existPlayer(pl);
    if (!data) return null
    if (index === null) return null
    let { email, state, password, expired_at, register_at, register_ip } = data
    return new Player(pl, {
        email,
        state,
        password,
        expired_at,
        register_ip,
        register_at
    })
}
function existPlayer(pl) {
    //玩家是否存在
    let playerData = load(DATA);
    if (playerData === null) return [null, null];

    let index = playerData.findIndex((item) => {
        let xuidExists = item.xuid === pl.xuid;
        let uuidExists = item.uuid === pl.uniqueId;
        return xuidExists || uuidExists;
    })
    return index >= 0 ? [index, playerData[index]] : [null, playerData];
}

function existPlayerByXuid(xuid) {
    //玩家是否存在
    let playerData = load(DATA);
    if (playerData === null) return [null, null];

    let index = playerData.findIndex((item) => {
        let xuidExists = item.xuid === xuid;
        return xuidExists;
    })
    return index >= 0 ? [index, playerData[index]] : [null, playerData];
}

module.exports = {
    Player,
    getPlayer,
    existPlayer,
    existPlayerByXuid
}