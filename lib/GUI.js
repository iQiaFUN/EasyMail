//LiteLoaderScript Dev Helper
/// <reference path="e:\Dev/dts/llaids/src/index.d.ts"/> 

function getRA(RA) {
    let gui = mc.newSimpleForm()
    gui.setTitle('注册协议')
    gui.setContent(RA)
    gui.addButton('拒绝')
    gui.addButton('同意')
    return gui
}

function getRegisterGUI(email = true) {
    let gui = mc.newCustomForm();
    gui.setTitle('注册');
    //gui.addLabel('什么都没有');
    gui.addInput('密码', "请输入密码");
    gui.addInput('确认密码', "请再次输入密码");
    if (email) {
        gui.addInput('邮箱', "请输入邮箱");
    }
    return gui
}

function getVerifyEmailGUI() {
    let gui = mc.newCustomForm();
    gui.setTitle('验证邮箱');
    gui.addInput('验证码', "请输入验证码");
    return gui
}

function getResendEmailGUI() {
    let gui = mc.newSimpleForm();
    gui.setTitle('重新发送验证码');
    gui.setContent('验证码已过期或已失效，请重新发送验证码');
    gui.addButton('重新发送验证码');
    return gui
}

function getLoginGUI() {
    let gui = mc.newCustomForm();
    gui.setTitle('登录');
    gui.addInput('密码', "请输入密码");
    gui.addSwitch('7天免登录', false);
    gui.addButton('忘记密码')
    return gui
}

module.exports = {
    getRA,
    getRegisterGUI,
    getLoginGUI,
    getResendEmailGUI,
    getVerifyEmailGUI
}