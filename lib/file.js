//LiteLoaderScript Dev Helper
/// <reference path="e:\Dev/dts/llaids/src/index.d.ts"/> 
const fse = require('fs-extra')
const fs = require('fs')
const { DIR } = require('./constants')

function read(file, encoding = "utf-8") {
    try {
        return fs.readFileSync(`${DIR}/${file}`, { encoding })
    } catch (err) {
        logger.debug(err);
        logger.warn(`${file}读取失败`);
        return null;
    }
}

function load(file) {//加载数据
    try {
        return fse.readJSONSync(`${DIR}/${file}`);
    } catch (err) {
        logger.debug(err);
        logger.warn(`${file}读取失败`);
        return null;
    }
}

function insertData(file, data) {//添加数据
    let tmpData = load(file);
    if (!tmpData) return false;
    tmpData.push(data);

    return update(file, tmpData)
}

function updateData(file, index, data) {//更新数据
    let tmpData = load(file);
    if (!tmpData) return false;
    tmpData[index] = data;
    return update(file, tmpData)
}

function update(file, data) {
    try {
        fse.writeJSONSync(`${DIR}/${file}`, data);
        return true;
    } catch (err) {
        logger.debug(err);
        logger.warn(`${file}数据修改失败`);
        return false;
    }
}

module.exports = {
    read,
    load,
    update,
    insertData,
    updateData
}