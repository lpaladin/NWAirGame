var Arguments = (function () {
    function Arguments() {
    }
    Arguments.residentMaxHealth = 10;
    Arguments.populationBase = 1000;
    Arguments.facility2envFriendlyLevelReversed = [
        0,
        0,
        1,
        0,
        3,
        2,
        1,
    ];
    Arguments.facilityTypeName = "无 林地 居民区 绿地 工厂 矿地 研究所".split(' ');
    Arguments.gameMapHexMenuActionName = "兴建 升级 行使 收获 毁灭".split(' ');
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
    function GameMapHex(data, elementRef, popup) {
        var _this = this;
        this.data = data;
        this.elementRef = elementRef;
        this.data = data;
        for (var i = 0; i < this.data._cloudCount; i++)
            this.elementRef.append('<b class="glyphicon glyphicon-cloud"></b>');
        if (this.facilityType != 0 /* Natural */)
            this.elementRef.append("<span><img src=\"" + this.iconURL + "\" /></span>");
        this.elementRef.append(this.healthGauge = $('<meter class="health-gauge x-billboard"></meter>').attr({
            low: Arguments.residentMaxHealth * 0.4,
            max: Arguments.residentMaxHealth,
            value: this.data._hexResidentHealth
        }).text("" + this.data._hexResidentHealth + " / " + Arguments.residentMaxHealth));
        ui.dMapView.append(elementRef);
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
            if (this.data._hexFacilityType == to)
                return;
            var tl = new TimelineMax(), icon = this.elementRef.find("span");
            if (this.data._hexFacilityType != 0 /* Natural */) {
                tl.to(icon, 0.4, { rotationY: 3600, scale: 4, opacity: 0, ease: Circ.easeIn });
            }
            if (to != 0 /* Natural */) {
                icon.find("img").attr("src", this.iconURL);
                tl.fromTo(icon, 0.4, { rotationX: 0, rotationY: 0, scale: 1, opacity: 0 }, { rotationX: 90, opacity: 1, ease: Expo.easeOut });
            }
            this.data._hexFacilityType = to;
            this.cloudCount = Arguments.facility2envFriendlyLevelReversed[to];
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
    return GameMap;
})();
var WorldDevelopmentModel = (function () {
    function WorldDevelopmentModel(data) {
        this.data = data;
        this.gameMap = new GameMap(data.gameMap);
    }
    WorldDevelopmentModel.generateNew = function (_mapHeight, _mapWidth) {
        var mapData = {
            map: [],
            _mapHeight: _mapHeight,
            _mapWidth: _mapWidth
        };
        var worldData = {
            gameMap: mapData,
            actions: [],
            _fund: 0
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
                    _row: row,
                    _col: col,
                    _cloudCount: Arguments.facility2envFriendlyLevelReversed[facilityType],
                    _hexFacilityLevel: facilityLevel,
                    _hexFacilityType: facilityType,
                    _hexResidentHealth: health,
                    _hexPopulation: (template[row][col] + 1) * Arguments.populationBase + Helpers.randBetween(-Arguments.populationBase, Arguments.populationBase, true),
                    _hexHasAction: false
                };
            }
        }
        return new this(worldData);
    };
    return WorldDevelopmentModel;
})();
//# sourceMappingURL=logic.js.map