//LiteLoaderScript Dev Helper
/// <reference path="e:\Dev/dts/llaids/src/index.d.ts"/> 

const nodemailer = require('nodemailer')
const { EmailCode, getEmailCode } = require('./EmailCode')
const { getNow } = require('./tools')
const { read } = require('./file')
const { Config } = require('./Config')
const { EMAIL_CONFIG } = require('./constants')
//发送邮件API nodemailer

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
            res({ err, info });
        });
    })
}

async function sendMail(config, code, options) {
    let { expire } = config.code
    let { err, info } = await sendMailAPI(config.transport, options);
    if (err === null) {
        //邮件发送成功
        let email = options.to
        logger.info(`${email}邮件发送成功`)
        let expired_at = getNow() + expire * 1000 * 60;
        let ec = getEmailCode(email)
        if (!ec) {
            ec = new EmailCode(email, code, expired_at)
            return ec.add()
        } else {
            return ec.chgCode(code, expire)
        }
    } else {
        logger.info('邮件发送失败');
        logger.debug(err);
        return false;
    }
}

function getSendOptions(config, code, email) {
    //let { host, port, user, pass, secure } = config.transport;
    let { expire } = config.code;
    let { type, subject, sender, text, html } = config.msg

    let options = {}
    if (type === 'html') {
        options = {
            from: sender,
            to: email,
            subject,
            text: null,
            html: formatMsg(html, code, expire)
        }
    } else {
        options = {
            from: sender,
            to: email,
            subject,
            text: formatMsg(text, code, expire),
            html: null
        }
    }
    if (options.text === null && options.html === null) return null
    return options
}

function getEmailConfig() {
    let emailCfg = new Config(EMAIL_CONFIG)
    let cfg = emailCfg.getData()
    //logger.info(cfg)
    if (!cfg) return false;
    let { host, port, user, pass } = cfg.transport;
    let { sender } = cfg.msg

    let existHost = host == "smtp.114514.com" || host == "" || !host;
    let existPort = port == "23333" || port == "" || !port;
    let existUser = user == "114514@114514.com" || user == "" || !user;
    let existPass = pass == "114514" || pass == "" || !pass;
    let existSender = sender == "114514@114514.com" || sender == "" || !sender;
    if (existHost || existPort || existUser || existPass || existSender) {
        logger.warn(`配置文件未修改`);
        return false;
    }
    return cfg;
}

function formatMsg(file, code, expire) {
    let msg = read(file)
    if (msg === null) return null
    msg = msg.replace("%CODE%", code)
    msg = msg.replace("%EXPIRE%", expire)
    return msg
}

module.exports = {
    sendMailAPI,
    getEmailConfig,
    getSendOptions,
    sendMail
}