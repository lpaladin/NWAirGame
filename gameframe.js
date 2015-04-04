var gui = require('nw.gui');
var fs = require('fs');
var wnd = gui.Window.get();
var MessageType;
(function (MessageType) {
    MessageType[MessageType["Information"] = 0] = "Information";
    MessageType[MessageType["Warning"] = 1] = "Warning";
    MessageType[MessageType["Error"] = 2] = "Error";
})(MessageType || (MessageType = {}));
var GameFrame = (function () {
    function GameFrame() {
        this.stateData = {};
    }
    GameFrame.prototype.saveProgress = function () {
        fs.writeFileSync("progress.sav", this.stateData, { encoding: "utf8" });
        return true;
    };
    GameFrame.prototype.shakeWindow = function (amplitude) {
        var initial = { x: wnd.x, y: wnd.y };
        var timeline = new TimelineMax();
        for (var i = 0; i < 5; i++)
            timeline.to(wnd, 0.1, Helpers.shakeProperties(initial, amplitude + 11 - i * 2, {
                roundProps: "x,y",
                yoyo: true,
                ease: Sine.easeInOut
            }));
        timeline.to(wnd, 0.2, initial);
    };
    GameFrame.prototype.animPause = function () {
        (this.lastRoot = TimelineLite.exportRoot()).pause();
    };
    GameFrame.prototype.animResume = function () {
        if (!this.lastRoot)
            throw "你还没暂停呢……";
        this.lastRoot.resume();
        this.lastRoot = null;
    };
    GameFrame.prototype.changeSpeed = function (to) {
        TimelineLite.exportRoot().timeScale(to);
    };
    GameFrame.prototype.menuCall = function (type) {
        switch (type) {
            case "beginGame":
                this.pushMessage(0 /* Information */, "test");
                break;
            case "loadGame":
                this.showModal("对话框", "蛤", function (r) { return alert(r); });
                break;
            case "exit":
                this.showModal("退出", "你确定要退出游戏吗？未保存的进度将会丢失。", function (r) { return r && process.exit(); });
        }
    };
    GameFrame.prototype.pushMessage = function (type, msg) {
        var html;
        switch (type) {
            case 0 /* Information */:
                html = '<li class="msg-info"><span class="glyphicon' + ' glyphicon-info-sign"></span> ' + msg + '</li>';
                break;
            case 1 /* Warning */:
                this.shakeWindow(0);
                html = '<li class="msg-warning"><span class="glyphicon' + ' glyphicon-warning-sign"></span> ' + msg + '</li>';
                break;
            case 2 /* Error */:
                this.shakeWindow(5);
                html = '<li class="msg-error"><span class="glyphicon' + ' glyphicon-remove-sign"></span> ' + msg + '</li>';
                break;
        }
        html = $(html);
        ui.lstMessages.append(html);
        TweenMax.from(ui.lstMessages, 0.3, { y: html.height() });
        setTimeout(function () {
            html.fadeOut(function () { return html.remove(); });
        }, 2000);
    };
    GameFrame.prototype.showModal = function (title, content, callback) {
        if (this.modalCallback)
            throw "这不可能！为什么有对话框开着还会调用我？";
        this.modalCallback = callback;
        ui.dlgModal.find("header").text(title);
        ui.dlgModal.find(".message").text(content);
        ui.dlgModal.fadeIn();
        TweenMax.fromTo(ui.dlgModal.find(".dialog-body").center(), 0.5, {
            rotationX: 90,
            transformOrigin: "bottom center"
        }, {
            rotationX: 0
        });
    };
    GameFrame.prototype.onModalResult = function (result) {
        ui.dlgModal.fadeOut();
        if (this.modalCallback) {
            var tmp = this.modalCallback;
            this.modalCallback = null;
            tmp(result);
        }
    };
    return GameFrame;
})();
// 上面都是定义
var logic;
var frame;
var ui = {
    dGameMenu: null,
    gameDisplay: null,
    lstMessages: null,
    mnuMainMenu: null,
    dlgModal: null
};
function IntroAnimations() {
    var tl = new TimelineMax(), intro = $("#dIntro");
    tl.staggerFrom("#dSplash .animate-in-alt", 1, { scale: 0, opacity: 0, ease: Back.easeOut }, 0.5).staggerFrom("#dSplash .animate-in", 1, { y: "500%", rotation: Math.random() * 360, opacity: 0 }, 0.25, 0).add("after-splash", 3).to(intro, 1, { z: -100, rotationY: 90, ease: Expo.easeIn }, "after-splash").add("half-rotation").addCallback(function () {
        intro.find("div#dSplash").hide();
        intro.find("div#dTitle").show();
    }, "half-rotation").to(intro, 1, { z: 0, rotationY: 180, backgroundColor: "rgba(0, 0, 0, 0.5)", ease: Expo.easeOut }, "half-rotation").staggerFrom(ui.dGameMenu.find("li"), 0.5, { x: "200%", opacity: 0 }, 0.25);
}
$(document).ready(function () {
    _(CSSPlugin).defaultTransformPerspective = 600;
    logic = new GameLogicModel();
    frame = new GameFrame();
    for (var i in ui)
        ui[i] = $("#" + i);
    _$(ui.mnuMainMenu).find("li").click(function () {
        frame.menuCall(this.dataset["action"]);
    });
    _($(".dialog-body")).makeDraggable();
    process.on('uncaughtException', function (e) {
        frame.pushMessage(2 /* Error */, "错误：" + e);
        console.group("未捕获的异常：");
        if (!!e.message) {
            console.log(e.message);
        }
        if (!!e.stack) {
            console.log(e.stack);
        }
        console.log(e);
        console.groupEnd();
    });
    IntroAnimations();
}).keypress(function (e) {
    switch (e.keyCode) {
        case Helpers.KeyCodes.NUMPAD_0:
            if (wnd.isDevToolsOpen())
                wnd.closeDevTools();
            else
                wnd.showDevTools();
    }
});
//# sourceMappingURL=gameframe.js.map