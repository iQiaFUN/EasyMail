const nodemailer = require('nodemailer');
const fse = require('fs-extra');
const md5 = require('md5');

//LiteLoaderScript Dev Helper
/// <reference path="d:/Dev/git/llse/dts/llaids/src/index.d.ts"/> 

ll.registerPlugin(
    /* name */ "",
    /* introduction */ "",
    /* version */[0, 0, 1],
    /* otherInformation */ {}
);

logger.setTitle("EasyMail");
const dir = "./plugins/EasyLogin";
const tmpDir = `./plugins/nodejs/EasyMail/tmp/`;
const configFile = "config.json";
const dataFile = "playerdata.json";
const CodeFile = "EmailCode.json";

init();

async function init() {
    try {
        await fse.ensureDir(dir);
        logger.info("初始化配置目录成功");
        await initFile(configFile);
        await initFile(dataFile);
        await initFile(CodeFile);
    } catch (err) {
        logger.debug(err);
        logger.warn('初始化配置失败');
    }
}
async function initFile(file) {
    try {
        let exists = await fse.pathExists(`${dir}/${file}`);
        if (!exists) {
            await fse.copy(`${tmpDir}${file}`, `${dir}/${file}`);
            logger.info(`初始化${file}成功`);
        } else {
            logger.info(`检测到${file}`);
        }
    } catch (err) {
        logger.debug(err);
        logger.warn(`${file} 初始化失败`);
    }
}
function load(file) {//加载数据
    try {
        return fse.readJSONSync(`${dir}/${file}`);
    } catch (err) {
        logger.debug(err);
        logger.warn(`${file}读取失败`);
        return null;
    }
}

async function insertData(file, data) {//添加数据
    let tmpdata = load(file);
    if (!tmpdata) return false;
    tmpdata.push(data);

    try {
        fse.writeJSONSync(`${dir}/${file}`, tmpdata);
        return true;
    } catch (err) {
        logger.debug(err);
        logger.warn(`${file}数据插入失败`);
        return false;
    }
}
function updateData(file, index, data) {
    let tmpdata = load(file);
    if (!tmpdata) return false;
    tmpdata[index] = data;
    try {
        fse.writeJSONSync(`${dir}/${file}`, tmpdata);
        return true;
    } catch (err) {
        logger.debug(err);
        logger.warn(`${file}数据修改失败`);
        return false;
    }
}
function isPlayerExists(pl) {//玩家是否存在
    let playerData = load(dataFile);
    if (playerData === null) return [null, null];

    let index = playerData.findIndex((item) => {
        let xuidExists = item.xuid === pl.xuid;
        let uuidExists = item.uuid === pl.uniqueId;
        return xuidExists || uuidExists;
    })
    return index >= 0 ? [index, playerData[index]] : [null, playerData];

}

function isEmailExists(email) {
    let tmpCode = load(CodeFile);
    if (tmpCode === null) return [null, null];
    let index = tmpCode.findIndex(item => {
        return item.email === email;
    })
    return index >= 0 ? [index, tmpCode[index]] : [null, tmpCode];
}



class EmailCode {
    constructor(email, code, expired_at, state = 0) {
        this.email = email;
        this.code = code;
        this.expired_at = expired_at;
        this.state = state;
    }
}

class Player {
    constructor({
        xuid,
        uuid,
        email,
        state,
        password,
        expired_at,
        register_ip,
        register_at
    }) {
        this.xuid = xuid;
        this.uuid = uuid;
        this.email = email;
        this.state = state;
        this.password = password;
        this.expired_at = expired_at;
        this.register_ip = register_ip;
        this.register_at = register_at;
    }
}

function getNow() {
    return new Date().getTime();
}
function sendMailAPI({ host, port, user, pass, secure = false }, {
    from,
    to,
    subject,
    text = null,
    html = null
}) {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host,
        port,
        secure, // true for 465, false for other ports
        auth: {
            user, // generated ethereal user
            pass, // generated ethereal password
        },
    });

    // send mail with defined transport object
    return new Promise((res, rej) => {
        transporter.sendMail({
            from,
            to,
            subject,
            text,
            html, // html body
        }, (err, info) => {
            //logger.warn(err, info)
            res({ err, info });
        });
    })

}

function randomCode(length) {
    let code = '';
    for (let index = 0; index < length; index++) {
        let random = Math.floor(Math.random() * 9);
        code += random;
    }
    return code;
}

function onJoin(pl) {
    let [index, data] = isPlayerExists(pl);
    if (data === null) {
        logger.warn('用户数据加载失败');
        pl.kick("用户数据加载失败，请联系管理员处理");
        return false;
    }
    if (index === null) {
        onRegister(pl);
    } else {
        let player = data;
        switch (player.state) {
            case 0:
                let email = player.email;
                onVerifyEmail(email, pl);
                break;
            case 1:
                if (player.expired_at < getNow()) {
                    onLogin(pl, data);
                } else {
                    onCodeSucces(pl);
                }
                break;
            case 2:
                onBlackList(pl);
                break;
            default:
                onBlackList(pl);
        }

    }
}

function onRegister(pl) {
    let gui = mc.newCustomForm();
    gui.setTitle('注册');
    gui.addLabel('什么都没有');
    gui.addInput('邮箱', "请输入邮箱");
    gui.addInput('密码', "请输入密码");
    pl.sendForm(gui, (player, data) => {
        if (data == null) {
            pl.kick('请输入邮箱和密码进行注册');
        } else {
            let password = md5(data[2]);
            let email = data[1];
            let tmpPlayer = new Player({
                xuid: player.xuid,
                uuid: player.uniqueId,
                email,
                password,
                state: 0,
                expired_at: getNow(),
                register_ip: player.getDevice().ip,
                register_at: getNow()
            })
            let [index, tmpdata] = isEmailExists(email);
            if (tmpdata === null) {
                player.kick('数据加载失败，请联系管理员处理');
                return false;
            }
            if (index !== null) {
                player.kick('此邮箱已被注册，请更换邮箱或联系管理员');
                return false;
            }
            let config = isChangeConfig()
            if (!config) {
                player.kick('配置文件未加载或加载失败，前联系管理员')
                return
            }
            sendMail(data[1], config).then(res => {
                logger.info(res)
                if (!res) {
                    player.kick("邮件发送失败,请检查邮箱格式或联系管理员");
                } else {
                    let insert = insertData(dataFile, tmpPlayer);
                    if (insert === false) player.kick(`数据添加失败，请重新注册或联系管理员`);
                    onVerifyEmail(email, player);
                }
            }).catch(err => {
                logger.debug(err);
                logger.warn('邮件发送失败');
            })

        }
    })

}

async function sendMail(email, config) {

    let { host, port, user, pass, secure, sender } = config;
    let { length, subject, msg, expire } = config.code;
    let code = randomCode(length);
    let text = msg.replace("%CODE", code);
    text = text.replace("%EXPIRE", expire);
    let { err, info } = await sendMailAPI({ host, port, user, pass, secure }, {
        from: sender,
        to: email,
        subject,
        text
    });
    if (err === null) {
        let expired_at = getNow() + expire * 1000 * 60;
        let tmp = new EmailCode(email, code, expired_at);
        let [index, data] = isEmailExists(email);
        if (data === null) return false;
        if (index === null) {
            return insertData(CodeFile, tmp);
        } else {
            return updateData(CodeFile, index, tmp);
        }
    } else {
        logger.info('邮件发送失败');
        logger.debug(err);
        return false;
    }

}

function isChangeConfig() {
    let cfg = load(configFile);
    if (!cfg) return false;
    let { host, port, user, pass, sender } = cfg;
    let existHost = host == "smtp.114514.com" || host == "" || !host;
    let existPort = port == "114514" || port == "" || !port;
    let existUser = user == "114514@114514.com" || user == "" || !user;
    let existPass = pass == "114514" || pass == "" || !pass;
    let existSender = sender == "114514@114514.com" || sender == "" || !sender;
    if (existHost || existPort || existUser || existPass || existSender) {
        logger.warn(`配置文件未修改`);
        return false;
    }
    return cfg;
}


function onVerifyEmail(email, player) {
    let gui = mc.newCustomForm();
    gui.setTitle('验证邮箱');
    gui.addInput('验证码', "请输入验证码");
    player.sendForm(gui, (pl, data) => {
        if (data == null) {
            pl.kick(`请输入验证码`);
        } else {
            let [index, tmpdata] = isEmailExists(email);
            if (tmpdata === null) {
                pl.kick("邮箱数据加载失败，请联系管理员处理");
                return false;
            }
            if (index === null) {
                pl.kick("邮箱不存在，请联系管理员处理");
                return false;
            } else {
                if (tmpdata.expired_at < getNow() || tmpdata.state === 1) {
                    resendMail(pl, email);
                    return false;
                }
                if (data[0] !== tmpdata.code) {
                    onCodeError(email, pl);
                    return false;
                } else {
                    tmpdata.state = 1;
                    let newemail = updateData(CodeFile, index, tmpdata);
                    let newPlayer = updatePlayerState(pl, 1);
                    if (newPlayer && newemail) {
                        onCodeSucces(pl);
                    } else {
                        logger.warn("验证数据更新失败");
                    }
                }
            }
        }
    })
}

function resendMail(pl, email) {
    let gui = mc.newSimpleForm();
    gui.setTitle('重新发送验证码');
    gui.setContent('验证码已过期或已失效，请重新发送验证码');
    gui.addButton('重新发送验证码');
    pl.sendForm(gui, (player, id) => {
        if (id == null) {
            player.kick("请进行邮箱验证");
        } else {
            let config = isChangeConfig()
            if (!config) {
                player.kick('配置文件未加载或加载失败，前联系管理员')
                return
            }
            sendMail(email, config).then(res => {
                if (!res) {
                    pl.kick("邮件发送失败,请检查邮箱格式或联系管理员");
                } else {
                    onVerifyEmail(email, player);
                }
            }).catch(err => {
                logger.debug(err);
                logger.warn('邮件发送失败');
            })
        }

    })

}

function onCodeSucces(pl) {
    let gui = mc.newSimpleForm();
    gui.setTitle('登录成功');
    gui.setContent('登录成功');
    gui.addButton('确定');
    pl.sendForm(gui, (player, id) => { })
}
function onCodeError(email, pl) {
    let gui = mc.newSimpleForm();
    gui.setTitle('验证码错误');
    gui.setContent('验证码错误,请重新进行验证');
    gui.addButton('重新验证');
    pl.sendForm(gui, (player, id) => {
        if (id == null) {
            player.kick("请进行邮箱验证");
        } else {
            onVerifyEmail(email, pl);
        }
    })
}

function updatePlayerState(pl, state) {
    let [index, pldata] = isPlayerExists(pl);
    if (pldata === null) {
        pl.kick('获取玩家数据失败');
        return false;
    }
    if (index === null) {
        pl.kick('玩家不存在');
        return false;
    } else {
        pldata.state = state;
        return updateData(dataFile, index, pldata);
    }
}

function onLogin(pl) {
    let gui = mc.newCustomForm();
    gui.setTitle('登录');
    gui.addInput('密码', "请输入密码");
    gui.addSwitch('7天免登录', false);
    pl.sendForm(gui, (player, data) => {
        if (data == null) {
            player.kick('请输入密码');
        } else {
            let [index, tmpdata] = isPlayerExists(player);
            let pwd = md5(data[0]);
            if (tmpdata == null) {
                player.kick('玩家数据加载失败,请联系管理员处理');
            } else {
                if (index == null) {
                    player.kick('玩家未注册或已被删除');
                    return;
                }
                if (pwd !== tmpdata.password) {
                    player.kick('密码错误!!!若忘记密码请联系管理员');
                } else {
                    if (data[1]) {
                        tmpdata.expired_at = getNow() + 7 * 24 * 60 * 60 * 1000;
                        updateData(dataFile, index, tmpdata);
                    }
                    onCodeSucces(pl);
                }
            }
        }
    })
}

function onBlackList(pl) {
    pl.kick('你已被加入黑名单,请联系管理员');
}

mc.listen('onJoin', onJoin);




