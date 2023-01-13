function getNow() {//获取当前时间戳
    return new Date().getTime();
}

function randomCode(length) {//随机数
    let code = '';
    for (let index = 0; index < length; index++) {
        let random = Math.floor(Math.random() * 9);
        code += random;
    }
    return code;
}

module.exports ={
    getNow,
    randomCode
}