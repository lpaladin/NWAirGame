var gui = require('nw.gui');
var fs = require('fs');
var wnd = gui.Window.get();
wnd.height = 600;
wnd.width = 800;
wnd.setPosition("center");
var mnuHex = new gui.Menu();
//#region 类型定义
/*
 * 游戏不同界面间的切换定义。
 */
var UIScene = (function () {
    function UIScene(ele, fnEnter, fnExit, parallel) {
        this.ele = ele;
        this.fnEnter = fnEnter;
        this.fnExit = fnExit;
        this.parallel = parallel;
    }
    UIScene.prototype.asInitial = function (argu) {
        return this.fnEnter(this.ele, argu);
    };
    UIScene.prototype.tweenTo = function (targetScene, argu) {
        ui.dAnimMask.show();
        if (this.parallel && targetScene.parallel && !this.ele.is(targetScene.ele))
            return this.fnExit(this.ele, argu).add(targetScene.fnEnter(targetScene.ele, argu), 0).call(function () { return ui.dAnimMask.hide(); });
        return this.fnExit(this.ele, argu).add(targetScene.fnEnter(targetScene.ele, argu)).call(function () { return ui.dAnimMask.hide(); });
    };
    return UIScene;
})();
/*
 * 右下角弹出消息的类别。
 */
var MessageType;
(function (MessageType) {
    MessageType[MessageType["Information"] = 0] = "Information";
    MessageType[MessageType["Warning"] = 1] = "Warning";
    MessageType[MessageType["Error"] = 2] = "Error";
})(MessageType || (MessageType = {}));
/*
 * 游戏主框架。
 */
var GameFrame = (function () {
    function GameFrame() {
        var _this = this;
        this._inGame = false;
        this._pausing = false;
        if (GameFrame._init)
            throw "游戏框架被再次初始化！";
        GameFrame._init = true;
        this.playingBGM = document.getElementById('bgmMenu1');
        mnuHex.append(new gui.MenuItem({
            label: "　" + Arguments.gameMapHexMenuActionName[GameMapHexMenuActions.Build],
            icon: "/Images/Icon/112_Plus_Green_16x16_72.png",
            click: function () { return _this.hexMenuCall(GameMapHexMenuActions.Build); }
        }));
        mnuHex.append(new gui.MenuItem({
            label: "　" + Arguments.gameMapHexMenuActionName[GameMapHexMenuActions.Upgrade],
            icon: "/Images/Icon/Gear.png",
            click: function () { return _this.hexMenuCall(GameMapHexMenuActions.Upgrade); }
        }));
        mnuHex.append(new gui.MenuItem({
            label: "　" + Arguments.gameMapHexMenuActionName[GameMapHexMenuActions.ApplyPolicy],
            icon: "/Images/Icon/1683_Lightbulb_16x16.png",
            click: function () { return _this.hexMenuCall(GameMapHexMenuActions.ApplyPolicy); }
        }));
        mnuHex.append(new gui.MenuItem({
            label: "　" + Arguments.gameMapHexMenuActionName[GameMapHexMenuActions.Exploit],
            icon: "/Images/Icon/Annotation_New.png",
            click: function () { return _this.hexMenuCall(GameMapHexMenuActions.Exploit); }
        }));
        mnuHex.append(new gui.MenuItem({
            label: "　" + Arguments.gameMapHexMenuActionName[GameMapHexMenuActions.Destroy],
            icon: "/Images/Icon/305_Close_16x16_72.png",
            click: function () { return _this.hexMenuCall(GameMapHexMenuActions.Destroy); }
        }));
        GameMapHex.callContextMenu = function (x, y) { return mnuHex.popup(x, y); };
        GameMapHex.setContextMenuEnabled = function (type, to) { return mnuHex.items[type].enabled = to; };
        this.sampleHex = [];
        for (var i = 1; i < Arguments.facilityTypeName.length; i++) {
            var $ele = $('<figure class="tile hexagon"><em></em></figure>');
            ui.lstAction.append($("<li></li>").data("result", i).append($('<div class="hex-container"></div>').append($ele)).append("<p>" + Arguments.facilityTypeName[i] + "</p>").append("<p><span class=\"glyphicon glyphicon-piggy-bank\"></span> 需要 " + Arguments.facilityCost[i][0] + "</p>"));
            this.sampleHex[i] = new GameMapHex({
                _row: -1,
                _col: -1,
                _cloudCount: Arguments.facility2envFriendlyLevelReversed[i],
                _hexFacilityLevel: 0,
                _hexEconomy: 0,
                _hexPollutionControl: 0,
                _hexResidentAwareness: 0,
                _hexFacilityType: i,
                _hexResidentHealth: Arguments.residentMaxHealth,
                _hexLastPollution: 0,
                _hexPopulation: 0,
                _hexRank: 0,
                _hexHasAction: false
            }, $ele, $(), true);
        }
    }
    GameFrame.prototype.loadProgress = function (id) {
        var _this = this;
        this.playSound('sndLongClick');
        this.pushMessage(0 /* Information */, "读取中，请稍候……");
        this.stateData = JSON.parse(fs.readFileSync("./UserData/save" + id + ".sav", "utf8"));
        this.logicModule = new WorldDevelopmentModel(this.stateData);
        this.pushMessage(0 /* Information */, "进度读取成功。");
        ui.dlgLoadProgress.fadeOut();
        this.initializeVisual();
        this.loading = false;
        this.changeUIScene(uiScenes.sGameMain, { skipIntro: true }).call(function () { return _this.inGame = true; });
        return true;
    };
    GameFrame.prototype._realSave = function (id, callback) {
        var _this = this;
        var timeElapsed = Math.floor((new Date().getTime() - this.clock.getTime()) / 60000);
        this.clock = new Date();
        this.stateData.stat.gameRealTimeEslapsed += timeElapsed;
        this.pushMessage(0 /* Information */, "保存中，请稍候……");
        wnd.capturePage(function (buffer) {
            fs.writeFileSync("./UserData/save" + id + ".sav", JSON.stringify(_this.stateData), { encoding: "utf8" });
            fs.writeFileSync("./UserData/save" + id + ".png", buffer, { encoding: "utf8" });
            _this.pushMessage(0 /* Information */, "进度保存成功。");
            ui.dlgSaveProgress.fadeOut();
            if (callback)
                callback();
        }, {
            format: "png",
            datatype: "buffer"
        });
    };
    GameFrame.prototype.saveProgress = function (id, callback) {
        var _this = this;
        if (fs.existsSync("./UserData/save" + id + ".sav"))
            this.showModal("警告", "将会覆盖存档，你要继续吗？", function (result) {
                if (result) {
                    _this.playSound('sndLongClick');
                    _this._realSave(id, callback);
                }
            });
        else
            this._realSave(id, callback);
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
        ui.dGameMain.addClass("paused");
        (this.lastRoot = TimelineLite.exportRoot()).pause();
    };
    GameFrame.prototype.animResume = function () {
        if (!this.lastRoot)
            throw "你还没暂停呢……";
        this.lastRoot.resume();
        ui.dGameMain.removeClass("paused");
        this.lastRoot = null;
    };
    GameFrame.prototype.changeSpeed = function (to) {
        TimelineLite.exportRoot().timeScale(to);
    };
    GameFrame.prototype.nextTurn = function () {
        var _this = this;
        var sum = 0;
        for (var i = 0; i < this.stateData.actions.length; i++)
            sum += this.stateData.actions[i]._cashDiff;
        if (this.stateData._fund + sum < 0) {
            this.pushMessage(1 /* Warning */, "政府资金不足！");
            return;
        }
        this.playSound('sndStrongEntry');
        this.loading = true;
        this.logicModule.nextTurn();
        this.updateVisual();
        GameMapHex.selectedHex = null;
        ui.btnCommitedActions.find(".badge").hide();
        ui.lstTurnActions.html("").hide();
        GameMapHex.selectedHex && (GameMapHex.selectedHex.selected = false);
        if (this.stateData._fund > 100000 && parseFloat(ui.sResidentAverageHealth.text()) >= 8)
            this.showModal("游戏结束", "您已经达到了游戏目标！恭喜您做到了环境与发展的均衡！请问您是否要继续？", function (r) { return !r && wnd.reload(); });
        setTimeout(function () { return _this.loading = false; }, Helpers.randBetween(1000, 2000, true));
    };
    GameFrame.prototype.hexMenuCall = function (type) {
        var _this = this;
        this.playSound('sndShortCrisp');
        var currentHex = GameMapHex.selectedHex, cb;
        currentHex.inflateActionModal(ui.dlgActionModal.find(".hex-status"));
        switch (type) {
            case GameMapHexMenuActions.Build:
                ui.lstAction.show();
                ui.lstPolicy.hide();
                cb = function (result) {
                    currentHex.beginRecordAction();
                    currentHex.facilityType = result;
                    _this.saveAction(currentHex.endRecordAndGenerateAction("兴建一座" + Arguments.facilityTypeName[result], -Arguments.facilityCost[result][0], null, GameMapHexMenuActions.Build));
                };
                break;
            case GameMapHexMenuActions.Upgrade:
                ui.lstAction.hide();
                ui.lstPolicy.hide();
                ui.dlgActionModal.find(".hex-status .hex-summary").append("<p><span class=\"glyphicon glyphicon-piggy-bank\"></span> 耗费 " + Arguments.facilityCost[currentHex.facilityType][currentHex.facilityLevel] + "</p>");
                cb = function (result) {
                    currentHex.beginRecordAction();
                    currentHex.facilityLevel++;
                    _this.saveAction(currentHex.endRecordAndGenerateAction("升级" + currentHex.facilityName, -Arguments.facilityCost[currentHex.facilityType][currentHex.facilityLevel], null, GameMapHexMenuActions.Upgrade));
                };
                break;
            case GameMapHexMenuActions.Destroy:
                ui.lstAction.hide();
                ui.lstPolicy.hide();
                var gain = Helpers.accumulate(Arguments.facilityCost[currentHex.facilityType], 0, currentHex.facilityLevel) / 3;
                ui.dlgActionModal.find(".hex-status .hex-summary").append("<p><span class=\"glyphicon glyphicon-piggy-bank\"></span> 获得 " + gain + "</p>");
                cb = function (result) {
                    currentHex.beginRecordAction();
                    currentHex.facilityType = FacilityType.Natural;
                    _this.saveAction(currentHex.endRecordAndGenerateAction("拆除" + currentHex.facilityName, gain, null, GameMapHexMenuActions.Destroy));
                };
                break;
            case GameMapHexMenuActions.Exploit:
                ui.lstAction.hide();
                ui.lstPolicy.show().html("");
                if (currentHex.facilityType == FacilityType.EnvironmentalResearch)
                    for (var i = 0; i < currentHex.facilityLevel + 1; i++)
                        ui.lstPolicy.append($("<li></li>").data("result", i).append("<p><span class=\"glyphicon " + Arguments.policies[i]._glyphicon + "\"></span> " + Arguments.policies[i]._name + " 政策</p>").append("<p><span class=\"glyphicon glyphicon-piggy-bank\"></span> 研发 " + -Arguments.policies[i]._cost / 10 + " 实施 " + -Arguments.policies[i]._cost + "</p>"));
                else
                    for (var i = Arguments.policiesEnd; i < Arguments.policies.length; i++)
                        ui.lstPolicy.append($("<li></li>").data("result", i).append("<p><span class=\"glyphicon " + Arguments.policies[i]._glyphicon + "\"></span> " + Arguments.policies[i]._name + "</p>").append("<p><span class=\"glyphicon glyphicon-piggy-bank\"></span> 需要 " + -Arguments.policies[i]._cost + "</p>"));
                cb = function (result) {
                    currentHex.beginRecordAction();
                    if (currentHex.facilityType == FacilityType.EnvironmentalResearch)
                        _this.saveAction(currentHex.endRecordAndGenerateAction("研发" + Arguments.policies[result]._name, Arguments.policies[result]._cost / 10, Arguments.policies[result], GameMapHexMenuActions.Exploit));
                    else {
                        currentHex.applyPolicy = Arguments.policies[result];
                        _this.saveAction(currentHex.endRecordAndGenerateAction("进行" + Arguments.policies[result]._name, Arguments.policies[result]._cost, null, GameMapHexMenuActions.Exploit));
                    }
                };
                break;
            case GameMapHexMenuActions.ApplyPolicy:
                ui.lstAction.hide();
                ui.lstPolicy.show().html("");
                for (var i = 0; i < this.stateData.lstAvailablePolicies.length; i++)
                    ui.lstPolicy.append($("<li></li>").data("result", i).append("<p><span class=\"glyphicon " + this.stateData.lstAvailablePolicies[i]._glyphicon + "\"></span> " + this.stateData.lstAvailablePolicies[i]._name + "</p>").append("<p><span class=\"glyphicon glyphicon-piggy-bank\"></span> 耗费 " + -this.stateData.lstAvailablePolicies[i]._cost + "</p>"));
                cb = function (result) {
                    currentHex.beginRecordAction();
                    currentHex.applyPolicy = _this.stateData.lstAvailablePolicies[result];
                    _this.saveAction(currentHex.endRecordAndGenerateAction("实施" + _this.stateData.lstAvailablePolicies[result]._name, _this.stateData.lstAvailablePolicies[result]._cost, null, GameMapHexMenuActions.ApplyPolicy, result));
                };
                break;
        }
        this.showActionModal(type, currentHex, cb);
    };
    GameFrame.prototype.saveAction = function (action) {
        this.stateData.actions.push(action);
        ui.lstTurnActions.show();
        ui.btnCommitedActions.find(".badge").show().text(this.stateData.actions.length);
        // 往动作列表里加
        ui.lstTurnActions.append("<li>\n            <span class=\"desc\">" + action._name + "</span>\n            <span class=\"glyphicon glyphicon-piggy-bank\"> " + action._cashDiff + "</span>\n            <span class=\"action\"><button class=\"classic\" onclick=\"frame.removeActionAt(" + (this.stateData.actions.length - 1) + ")\">取消</button></span></li>");
    };
    GameFrame.prototype.summonStatistics = function () {
        var timeElapsed = Math.floor((new Date().getTime() - this.clock.getTime()) / 60000);
        var labels = [];
        for (var i = 0; i < this.stateData._turnID; i++)
            labels.push(i + 1);
        // 数据统计表
        ui.tabStat.html("\n<table class=\"table table-striped\">\n    <tr><th>建造次数</th><td>" + this.stateData.stat.counts.builds + "</td></tr>\n    <tr><th>毁灭次数</th><td>" + this.stateData.stat.counts.destorys + "</td></tr>\n    <tr><th>升级次数</th><td>" + this.stateData.stat.counts.upgrades + "</td></tr>\n    <tr><th>收获次数</th><td>" + this.stateData.stat.counts.exploits + "</td></tr>\n    <tr><th>实施次数</th><td>" + this.stateData.stat.counts.applys + "</td></tr>\n    <tr><th>游戏实际时间</th><td>" + this.stateData.stat.gameRealTimeEslapsed + " 分钟</td></tr>\n</table>");
        this.showDialog(ui.dlgStatistics);
        // 数据统计画布
        var ctx = _($("#canvasTrend")[0]).getContext("2d");
        this.chartTrend = new Chart(ctx).Line({
            labels: labels,
            datasets: [
                {
                    label: "政府税收",
                    data: Helpers.normalize(this.stateData.stat.accumlatedHistory.map(function (val) { return val.fundIncome; })),
                    fillColor: "transparent",
                    strokeColor: "#" + colors[1]
                },
                {
                    label: "健康水平",
                    data: Helpers.normalize(this.stateData.stat.accumlatedHistory.map(function (val) { return val.avgHealth; })),
                    fillColor: "transparent",
                    strokeColor: "#" + colors[2]
                },
                {
                    label: "政府支出",
                    data: Helpers.normalize(this.stateData.stat.accumlatedHistory.map(function (val) { return val.actionFundConsume; })),
                    fillColor: "transparent",
                    strokeColor: "#" + colors[3]
                },
                {
                    label: "污染水平",
                    data: Helpers.normalize(this.stateData.stat.accumlatedHistory.map(function (val) { return val.pollution; })),
                    fillColor: "transparent",
                    strokeColor: "#" + colors[4]
                },
                {
                    label: "人口数量",
                    data: Helpers.normalize(this.stateData.stat.accumlatedHistory.map(function (val) { return val.population; })),
                    fillColor: "transparent",
                    strokeColor: "#" + colors[5]
                },
            ]
        });
        ui.tabTrend.find("div").html(this.chartTrend.generateLegend());
    };
    GameFrame.prototype.removeActionAt = function (pos) {
        var action = this.stateData.actions[pos];
        this.logicModule.gameMap.setNoAction(action);
        this.stateData.actions.splice(pos);
        if (this.stateData.actions.length > 0)
            ui.btnCommitedActions.find(".badge").show().text(this.stateData.actions.length);
        else {
            ui.btnCommitedActions.find(".badge").hide();
            ui.lstTurnActions.hide();
        }
        ui.lstTurnActions.find("li").each(function (i, e) {
            if (i == pos)
                $(e).remove();
            else
                _(e).onclick = "frame.removeActionAt(" + (i - 1) + ")";
        });
    };
    GameFrame.prototype.updateVisual = function () {
        this.setClouds(this.stateData._currentWindDirection);
        ui.icoWindDirection.removeClass().addClass("wind glyphicon glyphicon-arrow-" + Arguments.directionEngName[this.stateData._currentWindDirection]);
        ui.sWindDirection.text(Arguments.directionWindName[this.stateData._currentWindDirection]);
        ui.sTurnID.text("第 " + this.stateData._turnID + " 回合");
        var deltaDay = this.stateData._turnID;
        ui.sDate.text("" + ((this.stateData._beginDay.month + Math.floor(deltaDay / 30)) % 12 + 1) + "月 " + ((this.stateData._beginDay.day + deltaDay) % 30 + 1) + "日");
        ui.sGovernmentFund.text(this.stateData._fund);
        var rankSum = 0, healthSum = 0;
        for (var i = 0; i < this.stateData.gameMap._mapHeight; i++)
            for (var j = 0; j < this.stateData.gameMap._mapWidth; j++) {
                rankSum += this.stateData.gameMap.map[i][j]._hexRank;
                healthSum += this.stateData.gameMap.map[i][j]._hexResidentHealth;
            }
        ui.sRate.text(Math.floor(rankSum * 1000));
        ui.sResidentAverageHealth.text((Math.round(healthSum * 100 / this.stateData.gameMap._mapHeight / this.stateData.gameMap._mapWidth) / 100) + " / " + Arguments.residentMaxHealth);
        ui.lstTurnActions.html("");
        if (this.stateData.actions.length > 0) {
            ui.lstTurnActions.show();
            ui.btnCommitedActions.find(".badge").show().text(this.stateData.actions.length);
            for (var i = 0; i < this.stateData.actions.length; i++) {
                var action = this.stateData.actions[i];
                ui.lstTurnActions.append("<li>\n                <span class=\"desc\">" + action._name + "</span>\n                <span class=\"glyphicon glyphicon-piggy-bank\"> " + action._cashDiff + "</span>\n                <span class=\"action\"><button class=\"classic\" onclick=\"frame.removeActionAt(" + (this.stateData.actions.length - 1) + ")\">取消</button></span></li>");
            }
        }
        else {
            ui.btnCommitedActions.find(".badge").hide();
        }
    };
    GameFrame.prototype.initializeVisual = function () {
        this.clock = new Date();
        ui.dlgActionModal.fadeOut();
        ui.dlgModal.fadeOut();
        frame.mapViewAngle = 60;
        this.updateVisual();
    };
    GameFrame.prototype.setClouds = function (to) {
        ui.dMapInner.find("b.cloud-layer").remove();
        if (to == Direction.Left || to == Direction.Right)
            for (var i = Helpers.randBetween(3, 6, true); i >= 0; i--) {
                var layer = $("<b class=\"bkg3d-infinite cloud-layer\" style=\"bottom: " + Helpers.randBetween(0, 101, true) + "%\"></b>");
                for (var j = Helpers.randBetween(3, 6, true); j >= 0; j--)
                    layer.append($('<img class="x-billboard-90" src="/Images/cloud.png" />').css({
                        animation: to == Direction.Right ? "cloud-float " + Helpers.randBetween(30, 60, true) + "s linear infinite -" + Helpers.randBetween(15, 30, true) + "s" : "cloud-float " + Helpers.randBetween(30, 60, true) + "s linear infinite -" + Helpers.randBetween(15, 30, true) + "s reverse"
                    }));
                ui.dMapInner.append(layer);
            }
        else if (to == Direction.None)
            return;
        else
            for (var i = Helpers.randBetween(3, 6, true); i >= 0; i--) {
                var layer = $("<b class=\"bkg3d-infinite cloud-layer\"></b>").css({
                    animation: to == Direction.Up ? "cloud-layer-float " + Helpers.randBetween(30, 60, true) + "s linear infinite -" + Helpers.randBetween(15, 30, true) + "s" : "cloud-layer-float " + Helpers.randBetween(30, 60, true) + "s linear infinite -" + Helpers.randBetween(15, 30, true) + "s reverse"
                });
                for (var j = Helpers.randBetween(3, 6, true); j >= 0; j--)
                    layer.append("<img class=\"x-billboard-90\" src=\"/Images/cloud.png\" style=\"left: " + Helpers.randBetween(0, 101, true) + "%\" />");
                ui.dMapInner.append(layer);
            }
    };
    GameFrame.prototype.newGame = function (typeid) {
        this.playSound('sndLongClick');
        var types = [{ width: 7, height: 7 }, { width: 10, height: 10 }, { width: 15, height: 15 }];
        ui.dlgMapSizeSelect.fadeOut();
        this.initMap(types[typeid].height, types[typeid].width);
        this.initializeVisual();
        this.loading = false;
        this.changeUIScene(uiScenes.sGameStory);
        this.mapTypeID = typeid;
    };
    GameFrame.prototype.skipIntro = function () {
        var _this = this;
        this.changeUIScene(uiScenes.sGameMain).call(function () { return _this.inGame = true; });
        if (this.mapTypeID == 2)
            this.changeSpeed(5);
    };
    GameFrame.prototype.mainMenuCall = function (type) {
        switch (type) {
            case "resumeGame":
                this.pausing = false;
                break;
            case "beginGame":
                this.showDialog(ui.dlgMapSizeSelect);
                break;
            case "loadGame":
                // 遍历存档文件夹
                var paths = fs.readdirSync("./UserData/"), slots = [];
                ui.lstLoadProgress.html("");
                for (var i = 0; i < paths.length; i++) {
                    var name = paths[i].match(/save([0-9]*)\.sav$/);
                    if (name)
                        slots[parseInt(name[1])] = $("\n<li>\n    <img src=\"UserData/save" + name[1] + ".png?" + Math.random() + "\" />\n    <div>\n        <p class=\"title\">存档" + name[1] + "</p>\n        <p>" + Helpers.dateToString(fs.statSync("./UserData/" + paths[i]).mtime) + "</p>\n    </div>\n</li>").data("id", name[1]);
                }
                ui.lstLoadProgress.append(slots);
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
                var paths = fs.readdirSync("./UserData/"), slots = [];
                ui.lstSaveProgress.html("");
                for (var i = 0; i < paths.length; i++) {
                    var name = paths[i].match(/save([0-9]*)\.sav$/);
                    if (name)
                        slots[parseInt(name[1])] = $("\n<li>\n    <img src=\"UserData/save" + name[1] + ".png?" + Math.random() + "\" />\n    <div>\n        <p class=\"title\">存档" + name[1] + "</p>\n        <p>" + Helpers.dateToString(fs.statSync("./UserData/" + paths[i]).mtime) + "</p>\n    </div>\n</li>").data("id", name[1]);
                }
                ui.lstSaveProgress.append(slots);
                ui.lstSaveProgress.append($("\n<li>\n    <img src=\"/Images/bkg.jpg\" />\n    <div>\n        <p class=\"title\">新存档</p>\n    </div>\n</li>").data("id", slots.length + 1));
                this.showDialog(ui.dlgSaveProgress);
                break;
            case "exit":
                this.showModal("退出", "你确定要退出游戏吗？未保存的进度将会丢失。", function (r) { return r && wnd.close(true); });
        }
    };
    GameFrame.prototype.initMap = function (height, width) {
        this.logicModule = WorldDevelopmentModel.generateNew(height, width);
        this.stateData = this.logicModule.data;
    };
    GameFrame.prototype.pushMessage = function (type, msg) {
        var html;
        switch (type) {
            case 0 /* Information */:
                html = "<li class=\"msg-info\"><span class=\"glyphicon glyphicon-info-sign\"></span> " + msg + "</li>";
                break;
            case 1 /* Warning */:
                this.shakeWindow(0);
                html = "<li class=\"msg-warning\"><span class=\"glyphicon glyphicon-warning-sign\"></span> " + msg + "</li>";
                break;
            case 2 /* Error */:
                this.shakeWindow(5);
                html = "<li class=\"msg-error\"><span class=\"glyphicon glyphicon-remove-sign\"></span> " + msg + "</li>";
                break;
        }
        html = $(html);
        ui.lstMessages.append(html);
        TweenMax.fromTo(ui.lstMessages, 0.3, { y: html.height() }, { y: "0%" });
        setTimeout(function () {
            html.fadeOut(function () { return html.remove(); });
        }, 2000);
    };
    GameFrame.prototype.showDialog = function (ele) {
        this.playSound('sndPop');
        TweenMax.fromTo(_$(ele.show()).center(), 0.5, {
            transformPerspective: 600,
            rotationX: 90,
            transformOrigin: "bottom center"
        }, {
            rotationX: 0,
            ease: Back.easeOut
        });
    };
    Object.defineProperty(GameFrame.prototype, "loading", {
        get: function () {
            return this._loading;
        },
        set: function (to) {
            if (!to)
                TweenMax.staggerFromTo(ui.panTurnControl.find("button.sub"), 0.8, { className: "-=shown" }, { className: "+=shown", ease: Back.easeOut }, 0.2);
            if (this._loading == to)
                return;
            this._loading = to;
            var elements = ui.dLoading.find("span.glyphicon");
            if (to) {
                var tl = new TimelineMax();
                var rep = new TimelineMax({ repeat: -1 });
                tl.fromTo(ui.dLoading.fadeIn().find("div"), 0.5, { rotationX: 0, y: 0 }, { rotationX: 75, y: "75px" });
                elements.each(function (i) {
                    tl.fromTo(this, 0.5, { transformOrigin: "top center 100px", rotationX: 0, rotationZ: i * 45, opacity: 0, color: "rgba(0,0,0,0)", textShadow: "0 0 20px white" }, { rotationX: -90, rotationZ: (i + 1) * 45, opacity: 1, color: "white", textShadow: "0 0 10px gray", ease: Linear.easeNone }, 0);
                    rep.fromTo(this, 0.5, { rotationZ: (i + 1) * 45 }, { rotationZ: (i + 2) * 45, ease: Linear.easeNone }, 0);
                });
                this.tlLoading = tl.add(rep).add(TweenMax.fromTo(ui.dLoading.find("header"), 1, { scale: 1.05 }, { scale: 1, ease: Sine.easeIn, repeat: -1, yoyo: true }), 0).add(TweenMax.staggerFromTo(ui.dLoading.find("header span"), 0.35, { y: -10 }, { y: 0, yoyo: true, repeat: -1 }, 0.1), 0);
            }
            else {
                if (this.tlLoading)
                    this.tlLoading.stop();
                ui.dLoading.fadeOut();
            }
        },
        enumerable: true,
        configurable: true
    });
    GameFrame.prototype.showActionModal = function (type, hex, callback) {
        if (this.actionModalCallback)
            throw "这不可能！为什么有对话框开着还会调用我？";
        this.actionModalCallback = callback;
        ui.dlgActionModal.find("header").text(Arguments.gameMapHexMenuActionName[type]);
        ui.dlgActionModal.fadeIn();
        this.showDialog(ui.dlgActionModal.find(".dialog-body"));
    };
    GameFrame.prototype.onActionModalResult = function (result) {
        ui.dlgActionModal.fadeOut();
        if (this.actionModalCallback && result !== false)
            this.actionModalCallback($('#dlgActionModal li.active:visible').data('result'));
        this.actionModalCallback = null;
    };
    GameFrame.prototype.showModal = function (title, content, callback) {
        if (this.modalCallback)
            throw "这不可能！为什么有对话框开着还会调用我？";
        this.modalCallback = callback;
        ui.dlgModal.find("header").text(title);
        ui.dlgModal.find(".message").text(content);
        ui.dlgModal.fadeIn();
        this.showDialog(ui.dlgModal.find(".dialog-body"));
    };
    GameFrame.prototype.onModalResult = function (result) {
        ui.dlgModal.fadeOut();
        if (this.modalCallback) {
            var tmp = this.modalCallback;
            this.modalCallback = null;
            tmp(result);
        }
    };
    GameFrame.prototype.changeUIScene = function (to, argu) {
        var _this = this;
        if (!this.currentUIScene)
            return to.asInitial(argu).call(function () { return _this.currentUIScene = to; });
        return this.currentUIScene.tweenTo(to, argu).call(function () { return _this.currentUIScene = to; });
    };
    Object.defineProperty(GameFrame.prototype, "inGame", {
        get: function () {
            return this._inGame;
        },
        set: function (to) {
            if (this._inGame != to)
                ui.dGameMenu.find("li.intro-ingame-toggle").toggleClass("show");
            this._inGame = to;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameFrame.prototype, "pausing", {
        get: function () {
            return this._pausing;
        },
        set: function (to) {
            var _this = this;
            if (!this.inGame || this._pausing == to)
                return;
            if (to) {
                this.animPause();
                this.changeUIScene(uiScenes.sGameMenu, { isPause: true });
            }
            else {
                this.changeUIScene(uiScenes.sGameMain, { isPause: true }).call(function () { return _this.animResume(); });
            }
            this._pausing = to;
        },
        enumerable: true,
        configurable: true
    });
    GameFrame.prototype.switchBGM = function (to, reset) {
        this.playingBGM.pause();
        if (reset)
            this.playingBGM.currentTime = 0;
        this.playingBGM = document.getElementById(to);
        this.playingBGM.play();
    };
    GameFrame.prototype.playSound = function (id) {
        var audio = document.getElementById(id);
        audio.currentTime = 0;
        audio.play();
    };
    return GameFrame;
})();
//#endregion
var frame;
var uiScenes = {
    sIntro: null,
    sGameMenu: null,
    sCredits: null,
    sGameMain: null,
    sGameStory: null
};
/*
 * 游戏界面切换效果定义。
 */
function UISceneAnimationDefinitions() {
    uiScenes.sIntro = new UIScene($("#dIntro"), function (intro) {
        var tl = new TimelineMax();
        tl.add(Helpers.getParticlesAnimation(ui.dIntro)).staggerFrom("#dSplash .animate-in-alt", 1, { scale: 0, opacity: 0, ease: Back.easeOut }, 0.5, 0).staggerFrom("#dSplash .animate-in", 1, { y: "500%", rotation: Math.random() * 360, opacity: 0 }, 0.25, 0);
        return tl;
    }, function (intro) {
        var tl = new TimelineMax();
        tl.set(intro, { transformPerspective: 600 }).to(intro, 1, { z: -100, rotationY: 90, ease: Sine.easeIn }, "after-splash").call(function () {
            intro.hide();
            ui.dGameMenu.show();
        }).set(ui.dGameMenu, { transformPerspective: 600 }).fromTo(ui.dGameMenu, 1, { z: -100, rotationY: -90 }, { z: 0, rotationY: 0, ease: Sine.easeOut });
        return tl;
    }, false);
    uiScenes.sGameMenu = new UIScene(ui.mnuMainMenu, function (menu) {
        var tl = new TimelineMax();
        ui.dGameMenu.show();
        tl.to(ui.dGameMenu, 0.2, { opacity: 1 }).staggerFromTo(menu.find("li.show"), 0.2, { scale: 1, x: "200%", opacity: 0 }, { scale: 1, opacity: 1, x: "0%" }, 0.1, 0);
        return tl;
    }, function (menu) {
        var tl = new TimelineMax();
        tl.to(ui.dGameMenu, 0.2, { opacity: 0 }).call(function () { return ui.dGameMenu.hide(); });
        return tl;
    }, false);
    uiScenes.sCredits = new UIScene(ui.dCredits, function (credits) {
        credits.show();
        var tl = new TimelineMax();
        tl.fromTo(credits, 1, { y: "-200%", rotationZ: 15, opacity: 0 }, { y: "0%", opacity: 1, rotationZ: 0, ease: Bounce.easeOut });
        return tl;
    }, function (credits) {
        var tl = new TimelineMax();
        tl.fromTo(credits, 0.5, { y: "0%", opacity: 1, rotationZ: 0 }, { y: "200%", opacity: 0, rotationZ: -15, ease: Back.easeIn }).call(function () { return credits.hide(); });
        return tl;
    }, false);
    uiScenes.sGameMain = new UIScene(ui.dGameMain, function (main, argu) {
        var tl = new TimelineMax();
        frame.switchBGM('bgmInGame1', false);
        if (argu && argu.isPause == true)
            return tl;
        main.show();
        tl.fromTo(main, 0.5, { opacity: 0 }, { opacity: 1 }).fromTo(ui.dStatusInfo, 0.5, { width: 0 }, { width: "25vw", ease: Circ.easeIn }, 0);
        if (!argu || !argu.skipIntro)
            tl.fromTo(ui.dMapOuter, 2, { rotationX: 0, z: 0 }, { rotationX: 60, z: -100 }, 0.5).fromTo($(".x-billboard-90"), 5, { rotationX: 90 }, { rotationX: 30 }, 0.5).staggerFromTo(ui.dMapInner.find("figure"), 0.5, { rotationX: 90, rotationY: 75, z: 50, opacity: 0 }, { rotationX: 0, rotationY: 0, z: 0, opacity: 1 }, 0.01, 0.5);
        else
            tl.fromTo(ui.dMapOuter, 1, { rotationX: 0, z: 0 }, { rotationX: 60, z: -100 }, 0.5).fromTo($(".x-billboard-90"), 1, { rotationX: 90 }, { rotationX: 30 }, 0.5);
        return tl;
    }, function (main, argu) {
        var tl = new TimelineMax();
        frame.switchBGM('bgmMenu1', false);
        if (argu && argu.isPause == true)
            return tl;
        tl.fromTo(ui.dStatusInfo, 0.5, { width: 0 }, { width: "25vw", ease: Circ.easeIn }).fromTo(main, 0.5, { opacity: 1 }, { opacity: 0 }, 0).call(function () { return main.hide(); });
        return tl;
    }, false);
    uiScenes.sGameStory = new UIScene(ui.dGameStory, function (story, argu) {
        var tl = new TimelineMax();
        story.show().find("p").css("opacity", 0);
        tl.fromTo(story, 1, { opacity: 1, rotation: -720, scale: 0 }, { rotation: 0, scale: 1 });
        story.find("p").each(function (i, e) { return tl.fromTo(e, 4, { scale: 3, opacity: 0, y: "-50%" }, { scale: 1, opacity: 1, ease: Expo.easeOut }, 6 * i + 1).to(e, 2, { scale: 0, opacity: 0, ease: Expo.easeIn }, 6 * i + 5); });
        return tl;
    }, function (story, argu) {
        var tl = new TimelineMax();
        tl.fromTo(story, 1, { opacity: 1, scale: 1 }, { opacity: 0, scale: 3 }).call(function () { return story.hide(); });
        return tl;
    }, false);
}
var mapMovementController;
$(document).ready(function () {
    for (var i in ui)
        ui[i] = $("#" + i);
    frame = new GameFrame();
    mapMovementController = new MapMovementController();
    UISceneAnimationDefinitions();
    // 绑定菜单行为
    ui.mnuMainMenu.find("li").click(function () {
        var _this = this;
        var tl = new TimelineMax();
        tl.fromTo(this, 0.5, { scale: 1, opacity: 1, x: "0%" }, { scale: 3, opacity: 0, ease: Back.easeIn }).call(function () { return frame.mainMenuCall(_this.dataset["action"]); }).fromTo(this, 0.2, { scale: 1, opacity: 0, x: "0%" }, { opacity: 1 });
    });
    // 使得对话框可以拖动
    _$($(".dialog-body")).makeDraggable();
    // 处理异常
    process.on('uncaughtException', function (e) {
        wnd.showDevTools();
        ui.panPlayControl.fadeIn();
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
    // 覆盖链接元素的点击行为，用外部浏览器打开链接
    $("body").on("click", "a[href]", function () {
        gui.Shell.openExternal(this.href);
        return false;
    }).on("click", "button.cancel", function () {
        $(this).closest(".dialog-body").fadeOut();
    }).on("click", "ul.single-select li", function () {
        var $this = $(this);
        $this.addClass("active").siblings(".active").removeClass("active");
    }).on('mouseover', '.hl-style-menu > li, button.classic', function () { return frame.playSound('sndClick'); }).on('mousedown', 'button.classic', function () { return frame.playSound('sndSelect'); }).on('click', '.hexagon', function () { return frame.playSound('sndLight'); });
    // 窗口关闭阻止
    var closing = false;
    wnd.on('close', function () {
        if (closing)
            wnd.close(true);
        closing = true;
        frame.showModal("退出", "你确定要退出游戏吗？未保存的进度将会丢失。", function (r) { return (closing = false, r) && wnd.close(true); });
    });
    wnd.on('devtools-closed', function () {
        ui.panPlayControl.fadeOut();
    });
    if (wnd.isDevToolsOpen())
        ui.panPlayControl.show();
    // 鼠标控制地图移动
    ui.dMapView.on('mousewheel', function (e) {
        frame.mapViewAngle -= _(e.originalEvent).wheelDelta / 100;
        if (frame.mapViewAngle > 75)
            frame.mapViewAngle = 75;
        else if (frame.mapViewAngle < 30)
            frame.mapViewAngle = 30;
        TweenMax.to(ui.dMapOuter, 0.1, { rotationX: frame.mapViewAngle });
        TweenMax.to($(".x-billboard"), 0.1, { rotationX: -frame.mapViewAngle });
        TweenMax.to($(".x-billboard-90"), 0.1, { rotationX: -frame.mapViewAngle + 90 });
    }).find("figure.dirctrl").hover(function () {
        mapMovementController.setDir(_(Direction)[this.dataset["dir"]], true);
    }, function () {
        mapMovementController.setDir(_(Direction)[this.dataset["dir"]], false);
    });
    // 历史动作面板
    var lastAnim;
    ui.btnCommitedActions.mouseenter(function () {
        if (lastAnim)
            lastAnim.kill();
        lastAnim = TweenMax.fromTo(ui.lstTurnActions, 0.5, { opacity: 1, scale: 0, borderRadius: "500px" }, { scale: 1, borderRadius: "5px", ease: Back.easeOut });
    });
    ui.lstTurnActions.mouseleave(function () {
        if (lastAnim)
            lastAnim.kill();
        lastAnim = TweenMax.fromTo(ui.lstTurnActions, 0.1, { scale: 1, borderRadius: "5px" }, { opacity: 1, scale: 0, borderRadius: "500px" });
    });
    // 入场动画
    frame.changeUIScene(uiScenes.sIntro).set(dummy, dummy, "+=0.5").call(function () { return frame.changeUIScene(uiScenes.sGameMenu); });
}).keypress(function (e) {
    switch (e.keyCode) {
        case Helpers.keyCodes.NUMPAD_0:
            if (wnd.isDevToolsOpen()) {
                wnd.closeDevTools();
                ui.panPlayControl.fadeOut();
            }
            else {
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
}).bind("contextmenu", function () {
    return false;
});
//# sourceMappingURL=gameframe.js.map