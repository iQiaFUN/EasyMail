const { load, insertData, updateData } = require('./file')
const { EMAIL_DATA } = require('./constants')
const { getNow } = require('./tools')

class EmailCode {
    constructor(email, code, expired_at, state = 0) {
        this.email = email;
        this.code = code;
        this.expired_at = expired_at;
        this.state = state;
    }
    add() {
        let [index, data] = isEmailExists(this.email)
        if (!data) return null
        if (index !== null) return false
        return insertData(EMAIL_DATA, this)
    }
    _save() {
        let [index, data] = isEmailExists(this.email)
        if (!data) return null
        if (index === null) return false
        return updateData(EMAIL_DATA, index, this)
    }
    chgCode(code, exp = 30 * 60 * 1000) {
        this.code = code
        this.state = 0
        this.expired_at = getNow() + exp
        return this._save()
    }
    chgState(state = 1) {
        this.state = state
        return this._save
    }
    verify(code) {
        if (this.state === 1) return false
        if (this.expired_at < getNow()) return false
        if (code !== this.code) return false
        return true
    }
}

function isEmailExists(email) {//邮箱是否已存在
    let tmpCode = load(EMAIL_DATA);
    if (tmpCode === null) return [null, null];
    let index = tmpCode.findIndex(item => {
        return item.email === email;
    })
    return index >= 0 ? [index, tmpCode[index]] : [null, tmpCode];
}
function getEmailCode(emailCode) {
    let [index, data] = isEmailExists(emailCode)
    if (!data) return null
    if (index === null) return null
    let { email, code, state, expired_at } = data
    return new EmailCode(email, code, expired_at, state)
}
module.exports = {
    EmailCode,
    isEmailExists,
    getEmailCode
}
