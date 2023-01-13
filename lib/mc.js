//LiteLoaderScript Dev Helper
/// <reference path="e:\Dev/dts/llaids/src/index.d.ts"/> 

const { Player, existPlayer, getPlayer } = require('./Player')
const { CONFIG } = require('./constants')
const { getNow, randomCode } = require('./tools')
const md5 = require('md5')
const {
    getRegisterGUI,
    getVerifyEmailGUI,
    getLoginGUI,
    getRA
} = require('./GUI');
const { getEmailCode } = require('./EmailCode');
const { getEmailConfig, getSendOptions, sendMail } = require('./email');
const { Config } = require('./Config')
const { read } = require('./file')

let cfg = new Config(CONFIG)
cfgData = cfg.getData()

function onJoin(pl) {
    //加载玩家数据
    //if (!cfgData.enable) return
    let [index, data] = existPlayer(pl);
    if (data === null) {
        //加载失败
        logger.warn('用户数据加载失败');
        pl.kick("用户数据加载失败，请联系管理员处理");
        return false;
    }
    if (index === null) {
        //玩家数据不存在，进行注册
        onRegisterAgreement(pl);
    } else {
        let plData = data
        switch (plData.state) {
            case 0:
                //玩家已注册，未验证
                onVerifyEmail(plData.email, pl);
                break;
            case 1:
                //玩家已注册成功,判断登录状态
                if (plData.expired_at <= getNow()) {
                    //登录状态已过期，重新登录
                    onLogin(pl);
                } else {
                    //玩家已登录，返回登录成功.
                    onLoginSuccess(pl);
                }
                break;
            case 2:
            //玩家被加入黑名单
            default:
                //其它情况,暂时同2，后续会增加其他状态
                onBlackList(pl);
        }
    }
}

function onRegisterAgreement(pl) {
    //onRegister(pl)
    let RA = read(cfgData.RA)
    if (RA === null) RA = "注册协议加载失败，请联系管理员"
    let gui = getRA(RA)
    pl.sendForm(gui, (player, id) => {
        if (id == null) {
            player.kick('请同意注册协议后进入');
        } else {
            switch (id) {
                case 0:
                    player.kick('请同意注册协议后进入')
                    break
                case 1:
                    onRegister(player)
                    break
                default:
                    player.kick('请同意注册协议后进入')
            }
        }
    })
}

function onRegister(pl) {
    let gui = getRegisterGUI(cfgData.email)
    pl.sendForm(gui, (player, data) => {
        if (data == null) {
            player.kick('请进行注册')
        } else {
            let verifyData = verifyRegisterData(data)
            if (!verifyData) return onRegisterDataError(player)
            let { email, password } = verifyData
            if (cfgData.email) {
                //检查邮箱配置文件
                let emailCfg = getEmailConfig()
                if (!emailCfg) {
                    //检测配置文件是否已修改
                    return pl.kick('配置文件未加载或加载失败，前联系管理员')
                }
                //配置发信内容
                let code = randomCode(emailCfg.code.length)
                let mailOptions = getSendOptions(emailCfg, code, email)
                if (!mailOptions) return pl.kick('配置文件未加载或加载失败，前联系管理员')

                //发送邮件
                sendMail(emailCfg, code, mailOptions).then(res => {
                    if (!res) {
                        player.kick("邮件发送失败,请检查邮箱格式或联系管理员")
                    } else {
                        registerPlayer(player, password, email)
                    }
                }).catch(err => {
                    logger.warn(err)
                })
            } else {
                registerPlayer(player, password)
            }

        }
    })
}

function verifyRegisterData(data) {
    //logger.info(data)
    if (data[0] !== data[1]) return false
    let password = md5(data[1]);//密码加密
    let email = data[2];
    return {
        password, email
    }
}

function onRegisterDataError(pl) {
    onRegister(pl)
}

function registerPlayer(pl, password, email = null) {
    //logger.info('registerPlayer')
    let register_ip = pl.getDevice().ip

    let player = new Player(pl, { email, password, register_ip })
    let add = player.add()
    if (add === false) {
        return pl.kick(`数据添加失败，请重新注册或联系管理员`)
    }
    onVerifyEmail(email, pl)
}

function onLogin(pl) {
    let gui = getLoginGUI()
    pl.sendForm(gui, (player, data) => {
        if (data == null) {
            player.kick('请输入密码')
        } else {
            let pwd = md5(data[0])
            let tmpPlayer = getPlayer(player)
            if (!tmpPlayer) return player.kick('玩家数据加载失败,请联系管理员处理')
            let verify = tmpPlayer.verify(pwd)
            if (!verify) {
                onLoginError(player)
            } else {
                if (data[1]) {
                    tmpPlayer.chgExp()
                }
                onLoginSuccess(player)
            }
        }
    })
}

function onVerifyEmail(email, pl) {
    if (email === null) {
        let p = getPlayer(pl)
        if (!p) return pl.kick('玩家数据加载失败,请联系管理员处理')
        let updatePlayer = p.chgState()
        if (updatePlayer) {
            onLoginSuccess(pl)
        } else {
            logger.warn("")
        }
    }
    let gui = getVerifyEmailGUI()
    pl.sendForm(gui, (player, data) => {
        if (data == null) {
            player.kick('请输入验证码')
        } else {
            let ec = getEmailCode(email)
            if (ec === null) return player.kick()
            if (!ec.verify(data[0])) {
                return onCodeError(email, player)
            }
            let p = getPlayer(pl)
            if (!p) return player.kick()
            let updatePlayer = p.chgState(1)
            let updateEmail = ec.chgState()
            if (updateEmail && updatePlayer) {
                return onLoginSuccess(player)
            } else {
                logger.warn("")
            }
        }
    })
}

function onBlackList(pl) {
    pl.kick()
}

function onLoginSuccess(pl) {
    let gui = mc.newSimpleForm();
    gui.setTitle('登录成功');
    gui.setContent('登录成功');
    gui.addButton('确定');
    pl.sendForm(gui, (player, id) => { })
}

function onLoginError(pl) {
    onLogin(pl)
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




module.exports = {
    onJoin
}