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
        this.elementRef = elementRef;
        this.data = data;
        for (var i = 0; i < this.data._cloudCount; i++)
            this.elementRef.append('<b class="glyphicon glyphicon-cloud"></b>');
        ui.dMapView.append(elementRef);
        this.fnMouseEnter = function (e) {
            TweenMax.to(elementRef.removeClass("blur"), 0.2, { className: "+=glow", z: 10 });
            TweenMax.fromTo(popup.css({
                left: e.clientX + 5,
                top: e.clientY - popup.height() + 5
            }).text("第" + _this.data._col + "列，第" + _this.data._row + "行").show(), 0.2, { scale: 0, opacity: 1 }, { scale: 1, ease: Back.easeOut });
        };
        this.fnMouseLeave = function () {
            TweenMax.to(elementRef, 0.2, { className: "-=glow", z: 0 });
            popup.hide();
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
                if (GameMapHex._selectedHex) {
                    TweenMax.to(GameMapHex._selectedHex.elementRef, 0.1, { className: "-=active" });
                    GameMapHex._selectedHex._selected = false;
                }
                // 修改菜单哪些项目允许点击
                GameMapHex.setContextMenuEnabled(1 /* Upgrade */, false);
                TweenMax.to(this.elementRef, 0.1, { className: "+=active" });
                GameMapHex._selectedHex = this;
            }
            else {
                TweenMax.to(this.elementRef, 0.1, { className: "-=active" });
                GameMapHex._selectedHex = null;
            }
        },
        enumerable: true,
        configurable: true
    });
    return GameMapHex;
})();
var GameMap = (function () {
    function GameMap(data) {
        this.data = data;
        var popup = ui.dMapView.find("aside");
        this.map = [];
        for (var row = 0; row < this.data._mapHeight; row++) {
            this.map[row] = [];
        }
        ui.dMapInner.html("");
        for (var col = 0; col < this.data._mapWidth; col++) {
            var $col;
            if (col % 2 == 0)
                $col = $('<div class="hex-col-odd"></div>');
            else
                $col = $('<div class="hex-col-even"></div>');
            for (var row = 0; row < this.data._mapHeight; row++) {
                var $ele = $("\n<figure class=\"tile hexagon\">\n    <em></em>\n    <span><img src=\"/Images/Folder_256x256.png\" /></span>\n</figure>");
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
    GameMap.fromParameters = function (_mapHeight, _mapWidth) {
        var data = {
            map: [],
            _mapHeight: _mapHeight,
            _mapWidth: _mapWidth
        };
        for (var row = 0; row < _mapHeight; row++) {
            data.map[row] = [];
            for (var col = 0; col < _mapWidth; col++) {
                data.map[row][col] = {
                    _row: row,
                    _col: col,
                    _cloudCount: Helpers.randBetween(0, 3, true)
                };
            }
        }
        return new GameMap(data);
    };
    return GameMap;
})();
var GameLogicModel = (function () {
    function GameLogicModel() {
    }
    return GameLogicModel;
})();
//# sourceMappingURL=logic.js.map