class Arguments {
    public static residentMaxHealth = 10;
    public static populationBase = 1000;
    public static facility2envFriendlyLevelReversed = [ // 设施的逆“环境友好”值
        0, // Natural
        0, // Forest
        1, // ResidentialArea
        0, // Parkland
        3, // GeneralFactory
        2, // Mine
        1, // EnvironmentalResearch
    ];
    public static facilityTypeName = "无 林地 居民区 绿地 工厂 矿地 研究所".split(' ');
    public static gameMapHexMenuActionName = "兴建 升级 行使 收获 毁灭".split(' ');
}

interface IWithSaveData {
    data: ISaveData;
}

interface ISaveData {

}

interface IGameMap extends ISaveData {
    map: IGameMapHex[][];
    _mapWidth: number;
    _mapHeight: number;
}

interface IGameMapHex extends ISaveData {
    _row: number;
    _col: number;
    _cloudCount: number;
    _hexFacilityType: FacilityType;
    _hexFacilityLevel: number;
    _hexResidentHealth: number;
    _hexPopulation: number; // 人口
    _hexHasAction: boolean;
}

enum FacilityType {
    Natural, Forest, ResidentialArea, Parkland, GeneralFactory, Mine, EnvironmentalResearch
}

enum GameMapHexMenuActions {
    Build, Upgrade, ApplyPolicy, Exploit, Destroy
}

class GameMapHex implements IWithSaveData {

    public fnMouseEnter: (e) => void;
    public fnMouseLeave: (e) => void;
    public fnMouseUp: (e) => void;
    public static callContextMenu: (x: number, y: number) => void;
    public static setContextMenuEnabled: (type: GameMapHexMenuActions, to: boolean) => void;

    public inflateActionModal(dHexStatus: JQuery): void {
        dHexStatus.find(".hex-container").html("").append(this.elementRef.clone());
        dHexStatus.find(".hex-summary").html(`
<table>
    <tr>
        <th>人口</th><td>${ this.data._hexPopulation }</td>
        <th>设施</th><td>${ this.facilityName }</td>
        <th>健康水平</th><td>${ this.data._hexResidentHealth } / ${ Arguments.residentMaxHealth }</td>
    </tr>
</table>`);
    }

    public get row(): number {
        return this.data._row;
    }
    public get col(): number {
        return this.data._col;
    }

    public get cloudCount(): number {
        return this.data._cloudCount;
    }
    public set cloudCount(to: number) {
        if (this.data._cloudCount == to)
            return;
        this.elementRef.find("b.glyphicon").remove();
        for (var i = 0; i < to; i++)
            this.elementRef.append('<b class="glyphicon glyphicon-cloud"></b>');
        this.data._cloudCount = to;
    }

    public get facilityType(): FacilityType {
        return this.data._hexFacilityType;
    }
    public set facilityType(to: FacilityType) {
        if (this.data._hexFacilityType == to)
            return;
        var tl = new TimelineMax(), icon = this.elementRef.find("span");
        if (this.data._hexFacilityType != FacilityType.Natural) {
            tl.to(icon, 0.4, { rotationY: 3600, scale: 4, opacity: 0, ease: Circ.easeIn });
        }
        if (to != FacilityType.Natural) {
            icon.find("img").attr("src", this.iconURL);
            tl.fromTo(icon, 0.4, { rotationX: 0, rotationY: 0, scale: 1, opacity: 0 },
                { rotationX: 90, opacity: 1, ease: Expo.easeOut });
        }
        this.data._hexFacilityType = to;
        this.cloudCount = Arguments.facility2envFriendlyLevelReversed[to];
    }

    private static _selectedHex: GameMapHex;
    private _selected: boolean;

    public static get selectedHex(): GameMapHex {
        return this._selectedHex;
    }
    public get selected(): boolean {
        return this._selected;
    }
    public set selected(to: boolean) {
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
            GameMapHex.setContextMenuEnabled(GameMapHexMenuActions.Build, this.facilityType == FacilityType.Natural && !this.data._hexHasAction);
            GameMapHex.setContextMenuEnabled(GameMapHexMenuActions.Upgrade, this.facilityType != FacilityType.Natural && !this.data._hexHasAction);
            GameMapHex.setContextMenuEnabled(GameMapHexMenuActions.ApplyPolicy, !this.data._hexHasAction);
            GameMapHex.setContextMenuEnabled(GameMapHexMenuActions.Exploit, (this.facilityType == FacilityType.Mine ||
                this.facilityType == FacilityType.EnvironmentalResearch) && !this.data._hexHasAction);
            GameMapHex.setContextMenuEnabled(GameMapHexMenuActions.Destroy, this.facilityType != FacilityType.Natural && !this.data._hexHasAction);

            TweenMax.to(this.elementRef, 0.1, { className: "+=active" });
            this.healthGauge.show();

            GameMapHex._selectedHex = this;
        } else {
            TweenMax.to(this.elementRef, 0.1, { className: "-=active" });
            this.healthGauge.hide();
            GameMapHex._selectedHex = null;
        }
    }

    public get iconURL(): string {
        var url = "/Images/Facility/", level = this.data._hexFacilityLevel;
        switch (this.facilityType) {
            case FacilityType.Natural:
                return null;
            case FacilityType.Forest:
                url += "Forest." + (level > 1 ? 1 : level);
                break;
            case FacilityType.ResidentialArea:
                url += "ResidentialArea." + (level > 2 ? 2 : level);
                break;
            case FacilityType.Parkland:
                url += "Parkland.0";
                break;
            case FacilityType.GeneralFactory:
                url += "GeneralFactory." + (level > 3 ? 3 : level);
                break;
            case FacilityType.Mine:
                url += "Mine.0";
                break;
            case FacilityType.EnvironmentalResearch:
                url += "EnvironmentalResearch." + (level > 1 ? 1 : level);
                break;
        }
        return url + ".png";
    }
    public get facilityName(): string {
        if (this.facilityType == FacilityType.Natural)
            return Arguments.facilityTypeName[0];
        return (this.data._hexFacilityLevel + 1) + "级" + Arguments.facilityTypeName[this.facilityType];
    }

    private healthGauge: JQuery;

    public constructor(public data: IGameMapHex, private elementRef: JQuery, popup: JQuery) {
        this.data = data;

        for (var i = 0; i < this.data._cloudCount; i++)
            this.elementRef.append('<b class="glyphicon glyphicon-cloud"></b>');
        if (this.facilityType != FacilityType.Natural)
            this.elementRef.append(`<span><img src="${ this.iconURL }" /></span>`);
        this.elementRef.append(this.healthGauge = $('<meter class="health-gauge x-billboard"></meter>').attr({
            low: Arguments.residentMaxHealth * 0.4,
            max: Arguments.residentMaxHealth,
            value: this.data._hexResidentHealth
        }).text(`${ this.data._hexResidentHealth } / ${ Arguments.residentMaxHealth }`));

        ui.dMapView.append(elementRef);
        this.fnMouseEnter = (e) => {
            var currOffset = this.elementRef.offset();
            var css: any = {
                left: e.clientX + 5,
                bottom: "initial",
                top: "initial"
            };
            if (e.clientY > window.innerHeight / 2)
                css.bottom = window.innerHeight - e.clientY - 5;
            else
                css.top = e.clientY + 25;
            TweenMax.to(elementRef.removeClass("blur"), 0.2, { className: "+=glow", z: 10 });
            TweenMax.fromTo(popup
                .css(<Object> css)
                .html(`
<table>
    <tr><th>人口</th><td>${ this.data._hexPopulation }</td></tr>
    <tr><th>设施</th><td>${ this.facilityName }</td></tr>
    <tr><th>健康水平</th><td>${ this.data._hexResidentHealth } / ${ Arguments.residentMaxHealth }</td></tr>
</table>`
                )
                .show(),
                0.2, { scale: 0, opacity: 1 }, { scale: 1, ease: Back.easeOut });
            TweenMax.fromTo(this.healthGauge.show(), 0.2, { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, ease: Back.easeOut });
        };
        this.fnMouseLeave = () => {
            TweenMax.to(elementRef, 0.2, { className: "-=glow", z: 0 });
            popup.hide();
            if (!this.selected)
                this.healthGauge.hide();
        };
        this.fnMouseUp = (e) => {
            TweenMax.set(elementRef, { z: 10, className: "-=blur" });
            if (e.button == 0) {
                this.selected = !this.selected;
            } else if (e.button == 2) {
                this.selected = true;
                GameMapHex.callContextMenu(e.clientX, e.clientY);
            }
        };
        elementRef.hover(this.fnMouseEnter, this.fnMouseLeave)
            .mousedown((e) => TweenMax.to(elementRef, 0.1, { z: 5, className: "+=blur" }))
            .mouseup(this.fnMouseUp);
    }
}

class GameMap implements IWithSaveData {
    private map: GameMapHex[][];

    public get mapHeight(): number {
        return this.data._mapHeight;
    }
    public get mapWidth(): number {
        return this.data._mapWidth;
    }

    /* +---0 1 2 3 4 5
     * |0    ◇  ◇  ◇
     * 01  ◇◇◇◇◇◇
     * 12  ◇◇◇◇◇◇
     * 23  ◇◇◇◇◇◇
     * 34  ◇◇◇◇◇◇
     * 4   ◇  ◇  ◇
     */
    public constructor(public data: IGameMap) {
        this.data = data;

        var popup = ui.gameDisplay.find("aside");
        this.map = [];
        for (var row = 0; row < this.data._mapHeight; row++) {
            this.map[row] = [];
        }
        ui.dMapInner.find("div").remove();
        for (var col = 0; col < this.data._mapWidth; col++) {
            var $col: JQuery;
            if (col % 2 == 0)
                $col = $('<div class="hex-col-odd"></div>');
            else
                $col = $('<div class="hex-col-even"></div>');
            for (var row = 0; row < this.data._mapHeight; row++) {
                var $ele = $(`
<figure class="tile hexagon">
    <em></em>
</figure>`
                    );
                this.map[row][col] = new GameMapHex(this.data.map[row][col], $ele, popup);
                $col.append($ele);
            }
            ui.dMapInner.append($col);
        }
    }

}


interface ITurnAction extends ISaveData {
    _hexPropertyName: string;
    _hexPropertyValue: any;
}

interface IWorldData extends ISaveData {
    gameMap: IGameMap;
    actions: ITurnAction[];
    _fund: number;
}

class WorldDevelopmentModel implements IWithSaveData {
    private gameMap: GameMap;

    public constructor(public data: IWorldData) {
        this.gameMap = new GameMap(data.gameMap);
    }

    public static generateNew(_mapHeight: number, _mapWidth: number): WorldDevelopmentModel {
        var mapData: IGameMap = {
            map: [],
            _mapHeight: _mapHeight,
            _mapWidth: _mapWidth
        };
        var worldData: IWorldData = {
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

        // 生成随机的人口聚居地中心点
        for (var i = Helpers.randBetween(3, 6, true, 2); i >= 0; i--) {
            var col = Helpers.randBetween(0, _mapWidth, true),
                row = Helpers.randBetween(0, _mapHeight, true),
                intensity = Helpers.randBetween(2, 5, true, 2);
            for (var j = 0; j < intensity; j++)
                Helpers.loopThroughHexCircle(row, col,(r, c) =>
                    (r >= 0 && r < _mapHeight && c >= 0 && c < _mapWidth)
                    && (template[r][c] += intensity - j), j);
        }

        for (var row = 0; row < _mapHeight; row++) {
            mapData.map[row] = [];
            for (var col = 0; col < _mapWidth; col++) {
                // 根据相对密度决定初始设施、等级和人口
                var facilityType: FacilityType = template[row][col] > 3 ? FacilityType.ResidentialArea : Helpers.randBetween(0, 6, true, 2),
                    facilityLevel = 0, env = Arguments.facility2envFriendlyLevelReversed[facilityType],
                    health = Arguments.residentMaxHealth - 2 + Helpers.randBetween(0, 3, true, env);
                if (facilityType == FacilityType.ResidentialArea)
                    facilityLevel = template[row][col] > 3 ? template[row][col] - 3 : 0;
                else if (facilityType != FacilityType.Natural)
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
    }
}