//LiteLoaderScript Dev Helper
/// <reference path="e:\Dev/dts/llaids/src/index.d.ts"/> 

//注册LL插件
ll.registerPlugin(
    /* name */ "EasyMail",
    /* introduction */ "",
    /* version */[0, 0, 1],
    /* otherInformation */ {}
);

//设置logger前缀
logger.setTitle("EasyMail")

//初始化
const { init } = require('./lib/init')
init()
const { onJoin } = require('./lib/mc')

mc.listen('onJoin', onJoin)