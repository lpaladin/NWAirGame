var Arguments = (function () {
    function Arguments() {
    }
    Arguments.residentMaxHealth = 10;
    Arguments.residentInitialAwareness = 0.5;
    Arguments.hexInitialPollutionControl = 0.5;
    Arguments.hexInitialEconomy = 0.5;
    Arguments.populationBase = 1000;
    Arguments.initialFund = 100;
    Arguments.facility2envFriendlyLevelReversed = [
        0,
        0,
        1,
        0,
        3,
        2,
        1,
    ];
    Arguments.facilityCost = [
        [0],
        [10, 20, 30, 40, 50, 60],
        [100, 40, 90, 160, 250, 360],
        [20, 15, 20, 25],
        [300, 50, 75, 150, 360, 960],
        [100, 300, 500, 700],
        [1000, 50, 500, 5000],
    ];
    Arguments.facilityTypeName = "无 林地 居民区 绿地 工厂 矿地 研究所".split(' ');
    Arguments.gameMapHexMenuActionName = "兴建 升级 实施 收获 毁灭".split(' ');
    Arguments.directionName = "无 北 东 南 西".split(' ');
    Arguments.directionWindName = "无风 南风 西风 北风 东风".split(' ');
    Arguments.directionEngName = "none up right down left".split(' ');
    Arguments.policiesEnd = 5;
    Arguments.policies = [
        {
            _cost: -300,
            _name: "宣传",
            _hexPropertyNames: ["data._hexResidentAwareness"],
            _hexPropertyVerbs: ["1 - (1 - x) * (1 - x)"],
            _glyphicon: "glyphicon-send"
        },
        {
            _cost: -13000,
            _name: "出资加装过滤设施",
            _hexPropertyNames: ["data._hexPollutionControl", "data._hexEconomy"],
            _hexPropertyVerbs: ["1 - (1 - x) * (1 - x)", "0.8 * x"],
            _glyphicon: "glyphicon-gift"
        },
        {
            _cost: -5000,
            _name: "强硬管控",
            _hexPropertyNames: ["data._hexPollutionControl", "data._hexEconomy", "data._hexResidentAwareness"],
            _hexPropertyVerbs: ["1 - (1 - x) * (1 - x)", "x * x", "x * x"],
            _glyphicon: "glyphicon-king"
        },
        {
            _cost: -40000,
            _name: "开发新能源",
            _hexPropertyNames: ["data._hexPollutionControl", "data._hexResidentAwareness"],
            _hexPropertyVerbs: ["1 - 0.2 * (1 - x)", "x * x"],
            _glyphicon: "glyphicon-oil"
        },
        {
            _cost: -100000,
            _name: "纳米医疗",
            _hexPropertyNames: ["data._hexResidentHealth"],
            _hexPropertyVerbs: ["x = " + Arguments.residentMaxHealth],
            _glyphicon: "glyphicon-plus"
        },
        {
            _cost: 0,
            _name: "直接开采",
            _hexPropertyNames: ["data._hexResidentAwareness", "data._hexEconomy"],
            _hexPropertyVerbs: ["x * x", "1"],
            _glyphicon: "glyphicon-cog"
        },
        {
            _cost: -50,
            _name: "保守开采",
            _hexPropertyNames: ["data._hexEconomy"],
            _hexPropertyVerbs: ["1 - (1 - x) * (1 - x)"],
            _glyphicon: "glyphicon-grain"
        },
    ];
    return Arguments;
})();
var FacilityType;
(function (FacilityType) {
    FacilityType[FacilityType["Natural"] = 0] = "Natural";
    FacilityType[FacilityType["Forest"] = 1] = "Forest";
    FacilityType[FacilityType["ResidentialArea"] = 2] = "ResidentialArea";
    FacilityType[FacilityType["Parkland"] = 3] = "Parkland";
    FacilityType[FacilityType["GeneralFactory"] = 4] = "GeneralFactory";
    FacilityType[FacilityType["Mine"] = 5] = "Mine";
    FacilityType[FacilityType["EnvironmentalResearch"] = 6] = "EnvironmentalResearch";
})(FacilityType || (FacilityType = {}));
var GameMapHexMenuActions;
(function (GameMapHexMenuActions) {
    GameMapHexMenuActions[GameMapHexMenuActions["Build"] = 0] = "Build";
    GameMapHexMenuActions[GameMapHexMenuActions["Upgrade"] = 1] = "Upgrade";
    GameMapHexMenuActions[GameMapHexMenuActions["ApplyPolicy"] = 2] = "ApplyPolicy";
    GameMapHexMenuActions[GameMapHexMenuActions["Exploit"] = 3] = "Exploit";
    GameMapHexMenuActions[GameMapHexMenuActions["Destroy"] = 4] = "Destroy";
})(GameMapHexMenuActions || (GameMapHexMenuActions = {}));
var GameMapHex = (function () {
    function GameMapHex(data, elementRef, popup, dummy) {
        var _this = this;
        this.data = data;
        this.elementRef = elementRef;
        this.data = data;
        for (var i = 0; i < this.data._cloudCount; i++)
            this.elementRef.append('<b class="glyphicon glyphicon-cloud"></b>');
        if (this.facilityType != 0 /* Natural */)
            this.elementRef.append("<span><img src=\"" + this.iconURL + "\" /></span>");
        else
            this.elementRef.append("<span><img src=\"\" /></span>");
        this.elementRef.append(this.healthGauge = $('<meter class="health-gauge x-billboard"></meter>').attr({
            low: Arguments.residentMaxHealth * 0.4,
            max: Arguments.residentMaxHealth,
            value: this.data._hexResidentHealth
        }).text("" + this.data._hexResidentHealth + " / " + Arguments.residentMaxHealth));
        if (this.data._hexHasAction)
            this.elementRef.addClass("has-action");
        this.fnMouseEnter = function (e) {
            var currOffset = _this.elementRef.offset();
            var css = {
                left: e.clientX + 5,
                bottom: "initial",
                top: "initial"
            };
            if (e.clientY > window.innerHeight / 2)
                css.bottom = window.innerHeight - e.clientY - 5;
            else
                css.top = e.clientY + 25;
            TweenMax.to(elementRef.removeClass("blur"), 0.2, { className: "+=glow", z: 10 });
            TweenMax.fromTo(popup.css(css).html("\n<table>\n    <tr><th>人口</th><td>" + _this.data._hexPopulation + "</td></tr>\n    <tr><th>设施</th><td>" + _this.facilityName + "</td></tr>\n    <tr><th>健康水平</th><td>" + _this.data._hexResidentHealth + " / " + Arguments.residentMaxHealth + "</td></tr>\n</table>").show(), 0.2, { scale: 0, opacity: 1 }, { scale: 1, ease: Back.easeOut });
            TweenMax.fromTo(_this.healthGauge.show(), 0.2, { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, ease: Back.easeOut });
        };
        this.fnMouseLeave = function () {
            TweenMax.to(elementRef, 0.2, { className: "-=glow", z: 0 });
            popup.hide();
            if (!_this.selected)
                _this.healthGauge.hide();
        };
        this.fnMouseUp = function (e) {
            TweenMax.set(elementRef, { z: 10, className: "-=blur" });
            if (e.button == 0) {
                _this.selected = !_this.selected;
            }
            else if (e.button == 2) {
                _this.selected = true;
                GameMapHex.callContextMenu(e.clientX, e.clientY);
            }
        };
        if (!dummy)
            elementRef.hover(this.fnMouseEnter, this.fnMouseLeave).mousedown(function (e) { return TweenMax.to(elementRef, 0.1, { z: 5, className: "+=blur" }); }).mouseup(this.fnMouseUp);
    }
    GameMapHex.prototype.inflateActionModal = function (dHexStatus) {
        dHexStatus.find(".hex-container").html("").append(this.elementRef.clone());
        dHexStatus.find(".hex-summary").html("\n<table>\n    <tr>\n        <th>人口</th><td>" + this.data._hexPopulation + "</td>\n        <th>设施</th><td>" + this.facilityName + "</td>\n        <th>健康水平</th><td>" + this.data._hexResidentHealth + " / " + Arguments.residentMaxHealth + "</td>\n    </tr>\n</table>");
    };
    Object.defineProperty(GameMapHex.prototype, "row", {
        get: function () {
            return this.data._row;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameMapHex.prototype, "col", {
        get: function () {
            return this.data._col;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameMapHex.prototype, "cloudCount", {
        get: function () {
            return this.data._cloudCount;
        },
        set: function (to) {
            if (this.data._cloudCount == to)
                return;
            if (this.inSetActionState) {
                this.currentAction.push({
                    _hexPropertyName: 'cloudCount',
                    _hexPropertyValue: to
                });
                return;
            }
            this.elementRef.find("b.glyphicon").remove();
            for (var i = 0; i < to; i++)
                this.elementRef.append('<b class="glyphicon glyphicon-cloud"></b>');
            this.data._cloudCount = to;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameMapHex.prototype, "facilityType", {
        get: function () {
            return this.data._hexFacilityType;
        },
        set: function (to) {
            var _this = this;
            if (this.data._hexFacilityType == to)
                return;
            if (this.inSetActionState) {
                this.currentAction.push({
                    _hexPropertyName: 'facilityType',
                    _hexPropertyValue: to
                });
                return;
            }
            var tl = new TimelineMax(), icon = this.elementRef.find("span");
            this.data._hexFacilityLevel = 0;
            if (this.data._hexFacilityType != 0 /* Natural */) {
                tl.to(icon, 0.4, { rotationY: 3600, scale: 4, opacity: 0, ease: Circ.easeIn });
            }
            this.data._hexFacilityType = to;
            if (to != 0 /* Natural */) {
                tl.call(function () { return icon.find("img").attr("src", _this.iconURL); });
                tl.fromTo(icon, 0.4, { rotationX: 0, rotationY: 0, scale: 1, opacity: 0 }, { rotationX: -90, opacity: 1, ease: Expo.easeOut });
            }
            this.cloudCount = Arguments.facility2envFriendlyLevelReversed[to];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameMapHex.prototype, "facilityLevel", {
        get: function () {
            return this.data._hexFacilityLevel;
        },
        set: function (to) {
            if (this.data._hexFacilityType == to)
                return;
            if (this.inSetActionState) {
                this.currentAction.push({
                    _hexPropertyName: 'facilityLevel',
                    _hexPropertyValue: to
                });
                return;
            }
            var tl = new TimelineMax(), icon = this.elementRef.find("span");
            icon.find("img").attr("src", this.iconURL);
            tl.fromTo(icon, 0.4, { rotationX: 0, rotationY: 0, scale: 1, opacity: 0 }, { rotationX: -90, opacity: 1, ease: Expo.easeOut });
            this.data._hexFacilityLevel = to;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameMapHex.prototype, "applyPolicy", {
        set: function (policy) {
            if (!this.inSetActionState) {
                return;
            }
            for (var i = 0; i < policy._hexPropertyNames.length; i++)
                this.currentAction.push({
                    _hexPropertyName: policy._hexPropertyNames[i],
                    _hexPropertyValue: (new Function("x", "return " + policy._hexPropertyVerbs[i]))(eval("this." + policy._hexPropertyNames[i]))
                });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameMapHex, "selectedHex", {
        get: function () {
            return this._selectedHex;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameMapHex.prototype, "selected", {
        get: function () {
            return this._selected;
        },
        set: function (to) {
            if (this._selected == to)
                return;
            this._selected = to;
            if (to == true) {
                var currOffset = this.elementRef.offset();
                if (GameMapHex._selectedHex) {
                    TweenMax.to(GameMapHex._selectedHex.elementRef, 0.1, { className: "-=active" });
                    GameMapHex._selectedHex.healthGauge.hide();
                    GameMapHex._selectedHex._selected = false;
                }
                // 修改菜单哪些项目允许点击
                GameMapHex.setContextMenuEnabled(0 /* Build */, this.facilityType == 0 /* Natural */ && !this.data._hexHasAction);
                GameMapHex.setContextMenuEnabled(1 /* Upgrade */, this.facilityType != 0 /* Natural */ && !this.data._hexHasAction);
                GameMapHex.setContextMenuEnabled(2 /* ApplyPolicy */, !this.data._hexHasAction);
                GameMapHex.setContextMenuEnabled(3 /* Exploit */, (this.facilityType == 5 /* Mine */ || this.facilityType == 6 /* EnvironmentalResearch */) && !this.data._hexHasAction);
                GameMapHex.setContextMenuEnabled(4 /* Destroy */, this.facilityType != 0 /* Natural */ && !this.data._hexHasAction);
                TweenMax.to(this.elementRef, 0.1, { className: "+=active" });
                this.healthGauge.show();
                GameMapHex._selectedHex = this;
            }
            else {
                TweenMax.to(this.elementRef, 0.1, { className: "-=active" });
                this.healthGauge.hide();
                GameMapHex._selectedHex = null;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameMapHex.prototype, "iconURL", {
        get: function () {
            var url = "/Images/Facility/", level = this.data._hexFacilityLevel;
            switch (this.facilityType) {
                case 0 /* Natural */:
                    return null;
                case 1 /* Forest */:
                    url += "Forest." + (level > 1 ? 1 : level);
                    break;
                case 2 /* ResidentialArea */:
                    url += "ResidentialArea." + (level > 2 ? 2 : level);
                    break;
                case 3 /* Parkland */:
                    url += "Parkland.0";
                    break;
                case 4 /* GeneralFactory */:
                    url += "GeneralFactory." + (level > 3 ? 3 : level);
                    break;
                case 5 /* Mine */:
                    url += "Mine.0";
                    break;
                case 6 /* EnvironmentalResearch */:
                    url += "EnvironmentalResearch." + (level > 1 ? 1 : level);
                    break;
            }
            return url + ".png";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameMapHex.prototype, "facilityName", {
        get: function () {
            if (this.facilityType == 0 /* Natural */)
                return Arguments.facilityTypeName[0];
            return (this.data._hexFacilityLevel + 1) + "级" + Arguments.facilityTypeName[this.facilityType];
        },
        enumerable: true,
        configurable: true
    });
    GameMapHex.prototype.beginRecordAction = function () {
        this.inSetActionState = true;
        this.currentAction = [];
    };
    GameMapHex.prototype.endRecordAndGenerateAction = function (name, diff, addPolicy, tag, removePolicy) {
        this.data._hexHasAction = true;
        this.elementRef.addClass("has-action");
        this.selected = !this.selected;
        this.selected = !this.selected;
        var action = {
            _list: this.currentAction,
            _name: name,
            _target: "[" + this.row + "][" + this.col + "]",
            _cashDiff: diff,
            _addPolicy: addPolicy,
            _tag: tag,
            _removePolicy: removePolicy
        };
        this.inSetActionState = false;
        return action;
    };
    GameMapHex.prototype.setNoAction = function () {
        this.data._hexHasAction = false;
        this.elementRef.removeClass("has-action");
        this.selected = !this.selected;
        this.selected = !this.selected;
    };
    Object.defineProperty(GameMapHex.prototype, "polluteLevel", {
        get: function () {
            return Arguments.facility2envFriendlyLevelReversed[this.facilityType] * (this.facilityLevel + 1) * (1 - this.data._hexPollutionControl) / 18;
        },
        enumerable: true,
        configurable: true
    });
    GameMapHex.prototype.moveToNextTurn = function (hexWindSource) {
        if (this.data._hexResidentHealth <= 0) {
            this.data._hexResidentHealth = 0;
            return 0;
        }
        var rawLv = this.polluteLevel + (hexWindSource ? hexWindSource.data._hexLastPollution : 0) / 2, staminaRatio = this.data._hexPopulation / Arguments.populationBase;
        this.cloudCount = Math.floor(rawLv * 3);
        this.data._hexResidentAwareness = 1 - (1 - this.data._hexResidentAwareness) * rawLv / staminaRatio;
        this.data._hexEconomy = this.data._hexEconomy * this.data._hexResidentAwareness * staminaRatio * (this.facilityType == 4 /* GeneralFactory */ ? 1 : 0.1) + this.facilityLevel / 6;
        this.data._hexPopulation = Math.floor(this.data._hexPopulation * (1.1 - Math.sqrt(rawLv)));
        this.data._hexPollutionControl *= this.data._hexResidentAwareness;
        this.data._hexResidentHealth -= Math.round(rawLv * Math.sqrt(staminaRatio) * 10) * 0.01;
        this.data._hexHasAction = false;
        this.elementRef.removeClass("has-action");
        return this.data._hexEconomy;
    };
    GameMapHex.prototype.saveLastPollutionLevel = function () {
        this.data._hexLastPollution = this.polluteLevel;
    };
    GameMapHex.prototype.accumulateHistory = function (history) {
        history.avgHealth += this.data._hexResidentHealth;
        history.pollution += this.data._hexLastPollution;
        history.population += this.data._hexPopulation;
    };
    return GameMapHex;
})();
var GameMap = (function () {
    /* +---0 1 2 3 4 5
     * |0    ◇  ◇  ◇
     * 01  ◇◇◇◇◇◇
     * 12  ◇◇◇◇◇◇
     * 23  ◇◇◇◇◇◇
     * 34  ◇◇◇◇◇◇
     * 4   ◇  ◇  ◇
     */
    function GameMap(data) {
        this.data = data;
        this.data = data;
        var popup = ui.gameDisplay.find("aside");
        this.map = [];
        for (var row = 0; row < this.data._mapHeight; row++) {
            this.map[row] = [];
        }
        ui.dMapInner.find("div").remove();
        for (var col = 0; col < this.data._mapWidth; col++) {
            var $col;
            if (col % 2 == 0)
                $col = $('<div class="hex-col-odd"></div>');
            else
                $col = $('<div class="hex-col-even"></div>');
            for (var row = 0; row < this.data._mapHeight; row++) {
                var $ele = $("\n<figure class=\"tile hexagon\">\n    <em></em>\n</figure>");
                this.map[row][col] = new GameMapHex(this.data.map[row][col], $ele, popup);
                $col.append($ele);
            }
            ui.dMapInner.append($col);
        }
    }
    Object.defineProperty(GameMap.prototype, "mapHeight", {
        get: function () {
            return this.data._mapHeight;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GameMap.prototype, "mapWidth", {
        get: function () {
            return this.data._mapWidth;
        },
        enumerable: true,
        configurable: true
    });
    GameMap.prototype.applyAction = function (action) {
        for (var i = 0; i < action._list.length; i++) {
            var atom = action._list[i];
            eval("this.map" + action._target + "." + atom._hexPropertyName + " = " + atom._hexPropertyValue);
        }
    };
    GameMap.prototype.setNoAction = function (action) {
        eval("this.map" + action._target + ".setNoAction()");
    };
    GameMap.prototype.nextTurn = function (wind) {
        var sum = 0;
        for (var i = 0; i < this.mapHeight; i++)
            for (var j = 0; j < this.mapWidth; j++) {
                if (wind == Direction.Down && i > 0)
                    sum += this.map[i][j].moveToNextTurn(this.map[i - 1][j]);
                else if (wind == Direction.Up && i < this.mapHeight - 1)
                    sum += this.map[i][j].moveToNextTurn(this.map[i + 1][j]);
                else if (wind == Direction.Left && j > 0)
                    sum += this.map[i][j].moveToNextTurn(this.map[i][j - 1]);
                else if (wind == Direction.Right && j < this.mapWidth - 1)
                    sum += this.map[i][j].moveToNextTurn(this.map[i][j + 1]);
                else
                    sum += this.map[i][j].moveToNextTurn(null);
            }
        for (var i = 0; i < this.mapHeight; i++)
            for (var j = 0; j < this.mapWidth; j++)
                this.map[i][j].saveLastPollutionLevel();
        return sum;
    };
    GameMap.prototype.accumlateHistory = function (history) {
        for (var i = 0; i < this.mapHeight; i++)
            for (var j = 0; j < this.mapWidth; j++) {
                this.map[i][j].accumulateHistory(history);
            }
    };
    return GameMap;
})();
var WorldDevelopmentModel = (function () {
    function WorldDevelopmentModel(data) {
        this.data = data;
        this.gameMap = new GameMap(data.gameMap);
    }
    WorldDevelopmentModel.prototype.nextTurn = function () {
        var history = {
            actionFundConsume: 0,
            avgHealth: 0,
            pollution: 0,
            population: 0,
            fundIncome: 0
        };
        for (var i = 0; i < this.data.actions.length; i++) {
            var action = this.data.actions[i];
            if (action._addPolicy)
                this.data.lstAvailablePolicies.push(action._addPolicy);
            else if (action._removePolicy != undefined && action._removePolicy != null)
                this.data.lstAvailablePolicies.splice(action._removePolicy);
            switch (action._tag) {
                case 2 /* ApplyPolicy */:
                    this.data.stat.counts.applys++;
                    break;
                case 0 /* Build */:
                    this.data.stat.counts.builds++;
                    break;
                case 4 /* Destroy */:
                    this.data.stat.counts.destorys++;
                    break;
                case 1 /* Upgrade */:
                    this.data.stat.counts.upgrades++;
                    break;
                case 3 /* Exploit */:
                    this.data.stat.counts.exploits++;
                    break;
            }
            this.gameMap.applyAction(action);
            this.data._fund += action._cashDiff;
            history.actionFundConsume += -action._cashDiff;
        }
        this.data.actions = [];
        var diff = Math.floor(this.gameMap.nextTurn(this.data._currentWindDirection) * 10);
        this.gameMap.accumlateHistory(history);
        this.data._fund += diff;
        history.fundIncome = diff;
        this.data.stat.accumlatedHistory.push(history);
        var val = Math.sin(this.data.mdlWeather._b * this.data._turnID + this.data.mdlWeather._c);
        if (val > this.data.mdlWeather._threshold || val < -this.data.mdlWeather._threshold)
            this.data._currentWindDirection = Direction.None;
        else
            this.data._currentWindDirection = Math.floor((val + this.data.mdlWeather._threshold + 1) * 2 / this.data.mdlWeather._threshold);
        this.data._turnID++;
    };
    WorldDevelopmentModel.generateNew = function (_mapHeight, _mapWidth) {
        var mapData = {
            map: [],
            _mapHeight: _mapHeight,
            _mapWidth: _mapWidth
        };
        var worldData = {
            gameMap: mapData,
            mdlWeather: {
                _b: Helpers.randBetween(0.2, 0.5, false),
                _c: Helpers.randBetween(-100, 100, true),
                _threshold: Helpers.randBetween(0.9, 1, false)
            },
            actions: [],
            lstAvailablePolicies: [],
            stat: {
                accumlatedHistory: [],
                counts: {
                    applys: 0,
                    builds: 0,
                    destorys: 0,
                    exploits: 0,
                    upgrades: 0
                },
                gameRealTimeEslapsed: 0
            },
            _beginDay: {
                month: Helpers.randBetween(1, 13, true),
                day: Helpers.randBetween(1, 31, true)
            },
            _fund: Arguments.initialFund * _mapHeight * _mapWidth,
            _turnID: 0,
            _currentWindDirection: Direction.None
        };
        // 世界生成器 [version 1]
        var template = [];
        for (var row = 0; row < _mapHeight; row++) {
            template[row] = [];
            for (var col = 0; col < _mapWidth; col++) {
                template[row][col] = 0;
            }
        }
        for (var i = Helpers.randBetween(3, 6, true, 2); i >= 0; i--) {
            var col = Helpers.randBetween(0, _mapWidth, true), row = Helpers.randBetween(0, _mapHeight, true), intensity = Helpers.randBetween(2, 5, true, 2);
            for (var j = 0; j < intensity; j++)
                Helpers.loopThroughHexCircle(row, col, function (r, c) { return (r >= 0 && r < _mapHeight && c >= 0 && c < _mapWidth) && (template[r][c] += intensity - j); }, j);
        }
        for (var row = 0; row < _mapHeight; row++) {
            mapData.map[row] = [];
            for (var col = 0; col < _mapWidth; col++) {
                // 根据相对密度决定初始设施、等级和人口
                var facilityType = template[row][col] > 3 ? 2 /* ResidentialArea */ : Helpers.randBetween(0, 6, true, 2), facilityLevel = 0, env = Arguments.facility2envFriendlyLevelReversed[facilityType], health = Arguments.residentMaxHealth - 2 + Helpers.randBetween(0, 3, true, env);
                if (facilityType == 2 /* ResidentialArea */)
                    facilityLevel = template[row][col] > 3 ? template[row][col] - 3 : 0;
                else if (facilityType != 0 /* Natural */)
                    facilityLevel = Helpers.randBetween(0, 3, true);
                mapData.map[row][col] = {
                    _hexResidentAwareness: Arguments.residentInitialAwareness,
                    _row: row,
                    _col: col,
                    _cloudCount: Arguments.facility2envFriendlyLevelReversed[facilityType],
                    _hexFacilityLevel: facilityLevel,
                    _hexFacilityType: facilityType,
                    _hexResidentHealth: health,
                    _hexEconomy: Arguments.hexInitialEconomy,
                    _hexPollutionControl: Arguments.hexInitialPollutionControl,
                    _hexPopulation: (template[row][col] + 1) * Arguments.populationBase + Helpers.randBetween(-Arguments.populationBase, Arguments.populationBase, true),
                    _hexLastPollution: 0,
                    _hexHasAction: false
                };
            }
        }
        return new this(worldData);
    };
    return WorldDevelopmentModel;
})();
//# sourceMappingURL=logic.js.map