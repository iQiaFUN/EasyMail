//LiteLoaderScript Dev Helper
/// <reference path="e:\Dev/dts/llaids/src/index.d.ts"/> 
const fse = require('fs-extra')
const {
    DIR,
    TMP_DIR,
    CONFIG,
    DATA,
    EMAIL_CONFIG,
    EMAIL_DATA,
    DEMO_HTML,
    DEMO_TEXT,
    RA
} = require('./constants')

function init() {
    try {
        fse.ensureDirSync(DIR);
        logger.info("初始化配置目录成功");
        initFile(CONFIG);
        initFile(EMAIL_CONFIG)
        initFile(DATA);
        initFile(EMAIL_DATA);
        initFile(DEMO_HTML)
        initFile(DEMO_TEXT)
        initFile(RA)
    } catch (err) {
        logger.debug(err);
        logger.warn('初始化配置失败');
    }
}

function initFile(file) {
    try {
        let exists = fse.pathExistsSync(`${DIR}/${file}`);
        if (!exists) {
            fse.copyFileSync(`${TMP_DIR}/${file}`, `${DIR}/${file}`);
            logger.info(`初始化${file}成功`);
        } else {
            logger.info(`检测到${file}`);
        }
    } catch (err) {
        logger.warn(err);
        logger.warn(`${file} 初始化失败`);
    }
}

module.exports = {
    init,
    initFile
}