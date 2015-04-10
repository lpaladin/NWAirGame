import gui = require('nw.gui');
import fs = require('fs');
import promise = require('typescript-deferred');
var wnd = gui.Window.get();

var mnuHex = new gui.Menu();

//#region 类型定义

/*
 * 当前游戏的状态信息。
 */
interface IStateData {
    gameMap: IGameMap
}

/*
 * 游戏不同界面间的切换定义。
 */
class UIScene {
    public constructor(
        private ele: JQuery,
        private fnEnter: (ele: JQuery, argu?) => TimelineMax,
        private fnExit: (ele: JQuery, argu?) => TimelineMax,
        private parallel: boolean) {

    }

    public asInitial(argu?): TimelineMax {
        return this.fnEnter(this.ele, argu);
    }

    public tweenTo(targetScene: UIScene, argu?): TimelineMax {
        ui.dAnimMask.show();
        if (this.parallel && targetScene.parallel &&
            !this.ele.is(targetScene.ele))
            return this.fnExit(this.ele, argu).add(targetScene.fnEnter(targetScene.ele, argu), 0)
                .call(() => ui.dAnimMask.hide());
        return this.fnExit(this.ele, argu).add(targetScene.fnEnter(targetScene.ele, argu))
            .call(() => ui.dAnimMask.hide())
    }
}

/*
 * 右下角弹出消息的类别。
 */
enum MessageType {
    Information, Warning, Error
}

/*
 * 游戏主框架。
 */
class GameFrame {
    private stateData: IStateData;
    private logicModules = {
        gameMap: <GameMap> null
    };
    private lastRoot: TimelineLite;
    private currentUIScene: UIScene;
    private static _init: boolean;

    public constructor() {
        if (GameFrame._init)
            throw "游戏框架被再次初始化！";
        GameFrame._init = true;

        this.stateData = {
            gameMap: null
        };
        mnuHex.append(new gui.MenuItem({
            label: "　兴建", icon: "/Images/Icon/112_Plus_Green_16x16_72.png",
            click: () => this.hexMenuCall(GameMapHexMenuActions.Build)
        }));
        mnuHex.append(new gui.MenuItem({
            label: "　升级", icon: "/Images/Icon/Gear.png",
            click: () => this.hexMenuCall(GameMapHexMenuActions.Upgrade)
        }));
        mnuHex.append(new gui.MenuItem({
            label: "　行使", icon: "/Images/Icon/1683_Lightbulb_16x16.png",
            click: () => this.hexMenuCall(GameMapHexMenuActions.ApplyPolicy)
        }));
        mnuHex.append(new gui.MenuItem({
            label: "　开采", icon: "/Images/Icon/Annotation_New.png",
            click: () => this.hexMenuCall(GameMapHexMenuActions.Exploit)
        }));
        mnuHex.append(new gui.MenuItem({
            label: "　毁灭", icon: "/Images/Icon/305_Close_16x16_72.png",
            click: () => this.hexMenuCall(GameMapHexMenuActions.Destroy)
        }));
        GameMapHex.callContextMenu = (x: number, y: number) =>
            mnuHex.popup(x, y);
        GameMapHex.setContextMenuEnabled = (type: GameMapHexMenuActions, to: boolean) =>
            mnuHex.items[type].enabled = to;
    }
    
    public loadProgress(id: string): boolean {
        this.pushMessage(MessageType.Information, "读取中，请稍候……");
        this.stateData = JSON.parse(fs.readFileSync("./UserData/save" + id + ".sav", "utf8"));
        this.logicModules.gameMap = new GameMap(this.stateData.gameMap);

        this.pushMessage(MessageType.Information, "进度读取成功。");
        ui.dlgLoadProgress.fadeOut();
        this.changeUIScene(uiScenes.sGameMain, { skipIntro: true })
            .call(() => this.inGame = true);
        return true;
    }

    private _realSave(id: string, callback?: Function): void {
        this.pushMessage(MessageType.Information, "保存中，请稍候……");
        wnd.capturePage((buffer) => {
            fs.writeFileSync("./UserData/save" + id + ".sav", JSON.stringify(this.stateData), { encoding: "utf8" });
            fs.writeFileSync("./UserData/save" + id + ".png", buffer, { encoding: "utf8" });
            this.pushMessage(MessageType.Information, "进度保存成功。");
            ui.dlgSaveProgress.fadeOut();
            if (callback)
                callback();
        }, {
                format: "png",
                datatype: "buffer"
            });
    }

    public saveProgress(id: string, callback?: Function): void {
        if (fs.existsSync("./UserData/save" + id + ".sav"))
            this.showModal("警告", "将会覆盖存档，你要继续吗？",(result) => {
                if (result)
                    this._realSave(id, callback);
            });
        else
            this._realSave(id, callback);
    }

    public shakeWindow(amplitude : number): void {
        var initial = { x: wnd.x, y: wnd.y };
        var timeline = new TimelineMax();
        for (var i = 0; i < 5; i++)
            timeline.to(wnd, 0.1, Helpers.shakeProperties(initial, amplitude + 11 - i * 2, {
                roundProps: "x,y",
                yoyo: true,
                ease: Sine.easeInOut
            }));
        timeline.to(wnd, 0.2, initial);
    }

    public animPause(): void {
        ui.dGameMain.addClass("paused");
        (this.lastRoot = TimelineLite.exportRoot()).pause();
    }

    public animResume(): void {
        if (!this.lastRoot)
            throw "你还没暂停呢……";
        this.lastRoot.resume();
        ui.dGameMain.removeClass("paused");
        this.lastRoot = null;
    }

    public changeSpeed(to: number): void {
        TimelineLite.exportRoot().timeScale(to);
    }

    public hexMenuCall(type: GameMapHexMenuActions): void {
        var currentHex = GameMapHex.selectedHex;
        switch (type) {
            case GameMapHexMenuActions.Build:
            case GameMapHexMenuActions.Destroy:

        }
    }

    public mainMenuCall(type: string): void {
        switch (type) {
            case "resumeGame":
                this.pausing = false;
                break;
            case "beginGame":
                this.initMap(10, 20);
                this.changeUIScene(uiScenes.sGameMain)
                    .call(() => this.inGame = true);
                break;
            case "loadGame":
                // 遍历存档文件夹
                var paths = fs.readdirSync("./UserData/");
                ui.lstLoadProgress.html("");
                for (var i = 0; i < paths.length; i++) {
                    var name = paths[i].match(/save([0-9]*)\.sav$/);
                    if (name)
                        ui.lstLoadProgress.append($(`
<li>
    <img src="UserData/save${ name[1] }.png?${ Math.random() }" />
    <div>
        <p class="title">存档${ name[1] }</p>
        <p>${ Helpers.dateToString(fs.statSync("./UserData/" + paths[i]).mtime) }</p>
    </div>
</li>`
                                ).data("id", name[1]));
                }
                this.showDialog(ui.dlgLoadProgress);
                break;
            case "about":
                this.changeUIScene(uiScenes.sCredits);
                break;
            case "test":
                this.loading = !this.loading;
                break;
            case "saveGame":
                // 遍历存档文件夹
                var paths = fs.readdirSync("./UserData/"), lastNum: string;
                ui.lstSaveProgress.html("");
                for (var i = 0; i < paths.length; i++) {
                    var name = paths[i].match(/save([0-9]*)\.sav$/);
                    if (name)
                        ui.lstSaveProgress.append($(`
<li>
    <img src="UserData/save${ name[1] }.png?${ Math.random() }" />
    <div>
        <p class="title">存档${ name[1] }</p>
        <p>${ Helpers.dateToString(fs.statSync("./UserData/" + paths[i]).mtime) }</p>
    </div>
</li>`
                            ).data("id", lastNum = name[1]));
                }
                ui.lstSaveProgress.append($(`
<li>
    <img src="/Images/bkg.jpg" />
    <div>
        <p class="title">新存档</p>
    </div>
</li>`
                    ).data("id", parseInt(lastNum) + 1));
                this.showDialog(ui.dlgSaveProgress);
                break;
            case "exit":
                this.showModal("退出", "你确定要退出游戏吗？未保存的进度将会丢失。", (r) => r && wnd.close(true));
        }
    }

    public initMap(height: number, width: number): void {
        this.logicModules.gameMap = GameMap.fromParameters(height, width);
        this.stateData.gameMap = this.logicModules.gameMap.data;
    }

    public pushMessage(type: MessageType, msg: string) {
        var html;
        switch (type) {
            case MessageType.Information:
                html = `<li class="msg-info"><span class="glyphicon glyphicon-info-sign"></span> ${ msg }</li>`;
                break;
            case MessageType.Warning:
                this.shakeWindow(0);
                html = `<li class="msg-warning"><span class="glyphicon glyphicon-warning-sign"></span> ${ msg }</li>`;
                break;
            case MessageType.Error:
                this.shakeWindow(5);
                html = `<li class="msg-error"><span class="glyphicon glyphicon-remove-sign"></span> ${ msg }</li>`;
                break;
        }
        html = $(html);
        ui.lstMessages.append(html);
        TweenMax.fromTo(ui.lstMessages, 0.3, { y: html.height() }, { y: "0%" });
        setTimeout(function () {
            html.fadeOut(() => html.remove());
        }, 2000);
    }

    private showDialog(ele: JQuery): void {
        TweenMax.fromTo(_$(ele.show()).center(), 0.5, {
            transformPerspective: 600,
            rotationX: 90,
            transformOrigin: "bottom center"
        }, {
                rotationX: 0,
                ease: Back.easeOut
            });
    }

    private tlLoading: TimelineMax;
    private _loading: boolean;

    public get loading(): boolean {
        return this._loading;
    }

    public set loading(to: boolean) {
        if (this._loading == to)
            return;
        this._loading = to;
        var elements = ui.dLoading.find("span.glyphicon");
        if (to) {
            var tl = new TimelineMax();
            var rep = new TimelineMax({ repeat: -1 });
            tl.fromTo(ui.dLoading.fadeIn().find("div"), 0.5, { rotationX: 0, y: 0 },
                { rotationX: 75, y: "75px" });
            elements.each(function (i) {
                tl.fromTo(this, 0.5,
                    { transformOrigin: "top center 100px", rotationX: 0, rotationZ: i * 45, opacity: 0, color: "rgba(0,0,0,0)", textShadow: "0 0 20px white" },
                    { rotationX: -90, rotationZ: (i + 1) * 45, opacity: 1, color: "white", textShadow: "0 0 10px gray", ease: Linear.easeNone }, 0);
                rep.fromTo(this, 0.5, { rotationZ: (i + 1) * 45 }, { rotationZ: (i + 2) * 45, ease: Linear.easeNone }, 0);
            });
            this.tlLoading = tl.add(rep).add(
                TweenMax.fromTo(ui.dLoading.find("header"), 1, { scale: 1.05 },
                    { scale: 1, ease: Sine.easeIn, repeat: -1, yoyo: true })
                , 0).add(TweenMax.staggerFromTo(ui.dLoading.find("header span"), 0.35, { y: -10 },
                { y: 0, yoyo: true, repeat: -1 }, 0.1), 0);
        } else {
            this.tlLoading.stop();
            ui.dLoading.fadeOut();
        }
    }

    private modalCallback: (result: boolean) => void;

    public showModal(title: string, content: string, callback: (result: boolean) => void): void {
        if (this.modalCallback)
            throw "这不可能！为什么有对话框开着还会调用我？";
        this.modalCallback = callback;
        ui.dlgModal.find("header").text(title);
        ui.dlgModal.find(".message").text(content);
        ui.dlgModal.fadeIn();
        this.showDialog(ui.dlgModal.find(".dialog-body"));
    }

    public onModalResult(result: boolean): void {
        ui.dlgModal.fadeOut();
        if (this.modalCallback) {
            var tmp = this.modalCallback;
            this.modalCallback = null;
            tmp(result);
        }
    }

    public changeUIScene(to: UIScene, argu?: Object): TimelineMax {
        if (!this.currentUIScene)
            return to.asInitial(argu).call(() => this.currentUIScene = to);
        return this.currentUIScene.tweenTo(to, argu)
            .call(() => this.currentUIScene = to);
    }

    private _inGame: boolean = false;

    public get inGame(): boolean {
        return this._inGame;
    }

    public set inGame(to: boolean) {
        if (this._inGame != to)
            ui.dGameMenu.find("li.intro-ingame-toggle").toggleClass("show");
        this._inGame = to;
    }

    private _pausing: boolean = false;

    public get pausing(): boolean {
        return this._pausing;
    }

    public set pausing(to: boolean) {
        if (!this.inGame || this._pausing == to)
            return;
        if (to) {
            this.animPause();
            this.changeUIScene(uiScenes.sGameMenu, { isPause: true });
        } else {
            this.changeUIScene(uiScenes.sGameMain, { isPause: true })
                .call(() => this.animResume());
        }
        this._pausing = to;
    }
}

//#endregion

var logic: GameLogicModel;
var frame: GameFrame;
var uiScenes = {
    sIntro: <UIScene> null,
    sGameMenu: <UIScene> null,
    sCredits: <UIScene> null,
    sGameMain: <UIScene> null
};

/*
 * 游戏界面切换效果定义。
 */
function UISceneAnimationDefinitions() {
    uiScenes.sIntro = new UIScene($("#dIntro"),
        (intro) => { // fnEnter
            var tl = new TimelineMax();
            tl.add(Helpers.getParticlesAnimation(ui.dIntro))
                .staggerFrom("#dSplash .animate-in-alt", 1, { scale: 0, opacity: 0, ease: Back.easeOut }, 0.5, 0)
                .staggerFrom("#dSplash .animate-in", 1, { y: "500%", rotation: Math.random() * 360, opacity: 0 }, 0.25, 0);
            return tl;
        },
        (intro) => { // fnExit
            var tl = new TimelineMax();
            tl.set(intro, { transformPerspective: 600 })
                .to(intro, 1, { z: -100, rotationY: 90, ease: Sine.easeIn }, "after-splash")
                .call(function () {
                    intro.hide();
                    ui.dGameMenu.show();
                })
                .set(ui.dGameMenu, { transformPerspective: 600 })
                .fromTo(ui.dGameMenu, 1, { z: -100, rotationY: -90 }, { z: 0, rotationY: 0, ease: Sine.easeOut });
            return tl;
        }, false);
    uiScenes.sGameMenu = new UIScene(ui.mnuMainMenu,
        (menu) => { // fnEnter
            var tl = new TimelineMax();
            ui.dGameMenu.show();
            tl.to(ui.dGameMenu, 0.2, { opacity: 1 })
                .staggerFromTo(menu.find("li.show"), 0.2,
                { scale: 1, x: "200%", opacity: 0 }, { scale: 1, opacity: 1, x: "0%" }, 0.1, 0);
            return tl;
        },
        (menu) => { // fnExit
            var tl = new TimelineMax();
            tl.to(ui.dGameMenu, 0.2, { opacity: 0 })
                .call(() => ui.dGameMenu.hide());
            return tl;
        }, false);
    uiScenes.sCredits = new UIScene(ui.dCredits,
        (credits) => { // fnEnter
            credits.show();
            var tl = new TimelineMax();
            tl.fromTo(credits, 1, { y: "-200%", rotationZ: 15, opacity: 0 },
                { y: "0%", opacity: 1, rotationZ: 0, ease: Bounce.easeOut });
            return tl;
        },
        (credits) => { // fnExit
            var tl = new TimelineMax();
            tl.fromTo(credits, 0.5, { y: "0%", opacity: 1, rotationZ: 0 },
                { y: "200%", opacity: 0, rotationZ: -15, ease: Back.easeIn })
                .call(() => credits.hide());
            return tl;
        }, false);
    uiScenes.sGameMain = new UIScene(ui.dGameMain,
        (main, argu) => {
            var tl = new TimelineMax();
            if (argu && argu.isPause == true)
                return tl;
            main.show();
            tl.fromTo(main, 0.5, { opacity: 0 }, { opacity: 1 })
                .fromTo(ui.dStatusInfo, 0.5, { width: 0 }, { width: "25vw", ease: Circ.easeIn }, 0);
            if (!argu || !argu.skipIntro)
                tl.fromTo(ui.dMapOuter, 5, { rotationX: 0, z: 0 }, { rotationX: 60, z: -100 }, 0.5)
                    .staggerFromTo(ui.dMapInner.find("figure"), 0.5, { rotationX: 90, rotationY: 75, z: 50, opacity: 0 },
                    { rotationX: 0, rotationY: 0, z: 0, opacity: 1 }, 0.1, 0.5);
            else
                tl.fromTo(ui.dMapOuter, 1, { rotationX: 0, z: 0 }, { rotationX: 60, z: -100 }, 0.5);
            return tl;
        },
        (main, argu) => {
            var tl = new TimelineMax();
            if (argu && argu.isPause == true)
                return tl;
            tl.fromTo(ui.dStatusInfo, 0.5, { width: 0 }, { width: "25vw", ease: Circ.easeIn })
                .fromTo(main, 0.5, { opacity: 1 }, { opacity: 0 }, 0)
                .call(() => main.hide());
            return tl;
        }, false);
}

var mapMovementController: MapMovementController;

$(document).ready(function () {
    logic = new GameLogicModel();
    frame = new GameFrame();

    for (var i in ui)
        ui[i] = $("#" + i);

    mapMovementController = new MapMovementController();
    UISceneAnimationDefinitions();

    // 绑定菜单行为
    ui.mnuMainMenu.find("li").click(function () {
        var tl = new TimelineMax();
        tl.fromTo(this, 0.5,
            { scale: 1, opacity: 1, x: "0%" }, { scale: 3, opacity: 0, ease: Back.easeIn })
            .call(() => frame.mainMenuCall(this.dataset["action"]))
            .fromTo(this, 0.2, { scale: 1, opacity: 0, x: "0%" }, { opacity: 1 });
    });

    // 使得对话框可以拖动
    _$($(".dialog-body")).makeDraggable();


    // 处理异常
    process.on('uncaughtException', function (e) {
        wnd.showDevTools();
        ui.panPlayControl.fadeIn();
        frame.pushMessage(MessageType.Error, "错误：" + e);
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

    // 覆盖链接元素的点击行为，用外部浏览器打开链接
    $("body").on("click", "a[href]", function () {
        gui.Shell.openExternal(this.href);
        return false;
    }).on("click", "button.cancel", function () { // 取消按钮
        $(this).closest(".dialog-body").fadeOut();
    }).on("click", "ul.single-select li", function () { // 单选列表
        var $this = $(this);
        $this.addClass("active").siblings(".active").removeClass("active");
    });

    // 窗口关闭阻止
    wnd.on('close', function () {
        frame.showModal("退出", "你确定要退出游戏吗？未保存的进度将会丢失。",(r) => r && wnd.close(true));
    });
    wnd.on('devtools-closed', function () {
        ui.panPlayControl.fadeOut();
    });
    if (wnd.isDevToolsOpen())
        ui.panPlayControl.show();

    // 鼠标控制地图移动
    var angle = 60;
    ui.dMapView.on('mousewheel', function (e) {
        angle -= (<any> e.originalEvent).wheelDelta / 100;
        if (angle > 60)
            angle = 60;
        else if (angle < 0)
            angle = 0;
        TweenMax.to(ui.dMapOuter, 0.1, { rotationX: angle });
    }).find("figure.dirctrl").hover(function () {
        mapMovementController.setDir((<any> Direction)[this.dataset["dir"]], true);
    }, function () {
        mapMovementController.setDir((<any> Direction)[this.dataset["dir"]], false);
    });

    // 入场动画
    frame.changeUIScene(uiScenes.sIntro).set(dummy, dummy, "+=0.5")
        .call(() => frame.changeUIScene(uiScenes.sGameMenu));
}).keypress(function (e) {
    switch (e.keyCode) {
        case Helpers.keyCodes.NUMPAD_0:
            if (wnd.isDevToolsOpen()) {
                wnd.closeDevTools();
                ui.panPlayControl.fadeOut();
            } else {
                wnd.showDevTools();
                ui.panPlayControl.fadeIn();
            }
            break;
    }
}).keydown(function (e) {
    switch (e.keyCode) {
        case Helpers.keyCodes.F1:
            frame.changeSpeed(5);
            break;
        case Helpers.keyCodes.F5:
            wnd.reload();
            break;
        case Helpers.keyCodes.ESCAPE:
            if (!ui.dAnimMask.is(":visible"))
                frame.pausing = !frame.pausing;
            break;
        case Helpers.keyCodes.UP_ARROW:
            mapMovementController.setDir(Direction.Up, true);
            break;
        case Helpers.keyCodes.DOWN_ARROW:
            mapMovementController.setDir(Direction.Down, true);
            break;
        case Helpers.keyCodes.LEFT_ARROW:
            mapMovementController.setDir(Direction.Left, true);
            break;
        case Helpers.keyCodes.RIGHT_ARROW:
            mapMovementController.setDir(Direction.Right, true);
            break;
    }
}).keyup(function (e) {
    switch (e.keyCode) {
        case Helpers.keyCodes.UP_ARROW:
            mapMovementController.setDir(Direction.Up, false);
            break;
        case Helpers.keyCodes.DOWN_ARROW:
            mapMovementController.setDir(Direction.Down, false);
            break;
        case Helpers.keyCodes.LEFT_ARROW:
            mapMovementController.setDir(Direction.Left, false);
            break;
        case Helpers.keyCodes.RIGHT_ARROW:
            mapMovementController.setDir(Direction.Right, false);
            break;
    }
}).bind("contextmenu", function () { return false; })