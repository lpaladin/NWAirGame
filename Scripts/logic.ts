class Arguments {
    public static residentMaxHealth = 10;
    public static residentInitialAwareness = 0.5;
    public static hexInitialPollutionControl = 0.5;
    public static hexInitialEconomy = 0.5;
    public static populationBase = 1000;
    public static initialFund = 100;
    public static facility2envFriendlyLevelReversed = [ // 设施的逆“环境友好”值
        0, // Natural
        0, // Forest
        1, // ResidentialArea
        0, // Parkland
        3, // GeneralFactory
        2, // Mine
        1, // EnvironmentalResearch
    ];
    public static facilityCost: number[][] = [ // 进行该次建造/升级的所需资金
        [0], // Natural
        [10, 20, 30, 40, 50, 60], // Forest
        [100, 40, 90, 160, 250, 360], // ResidentialArea
        [20, 15, 20, 25], // Parkland
        [300, 50, 75, 150, 360, 960], // GeneralFactory
        [100, 300, 500, 700], // Mine
        [1000, 50, 500, 5000], // EnvironmentalResearch
    ];
    public static facilityTypeName = "无 林地 居民区 绿地 工厂 矿地 研究所".split(' ');
    public static gameMapHexMenuActionName = "兴建 升级 实施 收获 毁灭".split(' ');
    public static directionName = "无 北 东 南 西".split(' ');
    public static directionWindName = "无风 南风 西风 北风 东风".split(' ');
    public static directionEngName = "none up right down left".split(' ');

    public static policiesEnd = 5;
    public static policies: IPolicy[] = [
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
}

interface IWithSaveData {
    data: ISaveData;
}

interface ISaveData {

}

interface IPolicy extends ISaveData {
    _name: string;
    _hexPropertyNames: string[];
    _hexPropertyVerbs: string[]; // 谓词语句，x代表属性，用eval执行
    _cost: number;
    _glyphicon: string;
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
    _hexResidentAwareness: number;
    _hexPollutionControl: number;
    _hexEconomy: number;
    _hexPopulation: number; // 人口
    _hexHasAction: boolean;
    _hexLastPollution: number;
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
    }

    public get facilityType(): FacilityType {
        return this.data._hexFacilityType;
    }
    public set facilityType(to: FacilityType) {
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
        if (this.data._hexFacilityType != FacilityType.Natural) {
            tl.to(icon, 0.4, { rotationY: 3600, scale: 4, opacity: 0, ease: Circ.easeIn });
        }
        this.data._hexFacilityType = to;
        if (to != FacilityType.Natural) {
            tl.call(() => icon.find("img").attr("src", this.iconURL));
            tl.fromTo(icon, 0.4, { rotationX: 0, rotationY: 0, scale: 1, opacity: 0 },
                { rotationX: -90, opacity: 1, ease: Expo.easeOut });
        }
        this.cloudCount = Arguments.facility2envFriendlyLevelReversed[to];
    }

    public get facilityLevel(): number {
        return this.data._hexFacilityLevel;
    }
    public set facilityLevel(to: number) {
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
        tl.fromTo(icon, 0.4, { rotationX: 0, rotationY: 0, scale: 1, opacity: 0 },
            { rotationX: -90, opacity: 1, ease: Expo.easeOut });
        this.data._hexFacilityLevel = to;
    }

    public set applyPolicy(policy: IPolicy) {
        if (!this.inSetActionState) {
            return;
        }
        for (var i = 0; i < policy._hexPropertyNames.length; i++)
            this.currentAction.push({
                _hexPropertyName: policy._hexPropertyNames[i],
                _hexPropertyValue: (new Function("x", "return " + policy._hexPropertyVerbs[i]))(eval("this." + policy._hexPropertyNames[i]))
            });
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

    private inSetActionState: boolean;
    private currentAction: IAtomicAction[];

    public beginRecordAction(): void {
        this.inSetActionState = true;
        this.currentAction = [];
    }

    public endRecordAndGenerateAction(name: string, diff: number, addPolicy?: IPolicy, tag?: number, removePolicy?: number): ITurnAction {
        this.data._hexHasAction = true;
        this.elementRef.addClass("has-action");
        this.selected = !this.selected;
        this.selected = !this.selected;
        
        var action: ITurnAction = {
            _list: this.currentAction,
            _name: name,
            _target: `[${ this.row }][${ this.col }]`,
            _cashDiff: diff,
            _addPolicy: addPolicy,
            _tag: tag,
            _removePolicy: removePolicy
        };
        this.inSetActionState = false;
        return action;
    }

    public setNoAction(): void {
        this.data._hexHasAction = false;
        this.elementRef.removeClass("has-action");
        this.selected = !this.selected;
        this.selected = !this.selected;
    }

    private healthGauge: JQuery;

    public constructor(public data: IGameMapHex, private elementRef: JQuery, popup: JQuery, dummy?: boolean) {
        this.data = data;

        for (var i = 0; i < this.data._cloudCount; i++)
            this.elementRef.append('<b class="glyphicon glyphicon-cloud"></b>');
        if (this.facilityType != FacilityType.Natural)
            this.elementRef.append(`<span><img src="${ this.iconURL }" /></span>`);
        else
            this.elementRef.append(`<span><img src="" /></span>`);
        this.elementRef.append(this.healthGauge = $('<meter class="health-gauge x-billboard"></meter>').attr({
            low: Arguments.residentMaxHealth * 0.4,
            max: Arguments.residentMaxHealth,
            value: this.data._hexResidentHealth
        }).text(`${ this.data._hexResidentHealth } / ${ Arguments.residentMaxHealth }`));

        if (this.data._hexHasAction)
            this.elementRef.addClass("has-action");

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
        if (!dummy)
            elementRef.hover(this.fnMouseEnter, this.fnMouseLeave)
                .mousedown((e) => TweenMax.to(elementRef, 0.1, { z: 5, className: "+=blur" }))
                .mouseup(this.fnMouseUp);
    }

    private get polluteLevel(): number {
        return Arguments.facility2envFriendlyLevelReversed[this.facilityType] * (this.facilityLevel + 1) * (1 - this.data._hexPollutionControl) / 18;
    }

    public moveToNextTurn(hexWindSource: GameMapHex): number {
        if (this.data._hexResidentHealth <= 0) {
            this.data._hexResidentHealth = 0;
            return 0;
        }
        var rawLv = this.polluteLevel + (hexWindSource ? hexWindSource.data._hexLastPollution : 0) / 2, staminaRatio = this.data._hexPopulation / Arguments.populationBase;
        this.cloudCount = Math.floor(rawLv * 3);
        this.data._hexResidentAwareness = 1 - (1 - this.data._hexResidentAwareness) * rawLv / staminaRatio;
        this.data._hexEconomy = this.data._hexEconomy * this.data._hexResidentAwareness * staminaRatio * (this.facilityType == FacilityType.GeneralFactory ? 1 : 0.1) + this.facilityLevel / 6;
        this.data._hexPopulation = Math.floor(this.data._hexPopulation * (1.1 - Math.sqrt(rawLv)));
        this.data._hexPollutionControl *= this.data._hexResidentAwareness;
        this.data._hexResidentHealth -= Math.round(rawLv * Math.sqrt(staminaRatio) * 10) * 0.01;
        this.data._hexHasAction = false;
        this.elementRef.removeClass("has-action");
        return this.data._hexEconomy;
    }

    public saveLastPollutionLevel(): void {
        this.data._hexLastPollution = this.polluteLevel;
    }

    public accumulateHistory(history: IHistoryData): void {
        history.avgHealth += this.data._hexResidentHealth;
        history.pollution += this.data._hexLastPollution;
        history.population += this.data._hexPopulation;
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

    public applyAction(action: ITurnAction): void {
        for (var i = 0; i < action._list.length; i++) {
            var atom = action._list[i];
            eval(`this.map${action._target }.${ atom._hexPropertyName } = ${ atom._hexPropertyValue }`);
        }
    }

    public setNoAction(action: ITurnAction): void {
        eval(`this.map${ action._target }.setNoAction()`);
    }

    public nextTurn(wind: Direction): number {
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
    }

    public accumlateHistory(history: IHistoryData): void {
        for (var i = 0; i < this.mapHeight; i++)
            for (var j = 0; j < this.mapWidth; j++) {
                this.map[i][j].accumulateHistory(history);
            }
    }
}

interface IAtomicAction {
    _hexPropertyName: string;
    _hexPropertyValue: any;
}

interface ITurnAction extends ISaveData {
    _list: IAtomicAction[];
    _target: string;
    _name: string;
    _cashDiff: number;
    _addPolicy: IPolicy;
    _tag: number;
    _removePolicy: number;
}

interface IWeatherModel extends ISaveData {
    _b: number;
    _c: number;
    _threshold: number;
}

interface IHistoryData extends ISaveData {
    fundIncome: number;
    avgHealth: number;
    population: number;
    pollution: number;
    actionFundConsume: number;
}

interface IStatistics extends ISaveData {
    counts: {
        builds: number;
        destorys: number;
        upgrades: number;
        exploits: number;
        applys: number;
    };
    gameRealTimeEslapsed: number;
    accumlatedHistory: IHistoryData[];
}

interface IWorldData extends ISaveData {
    gameMap: IGameMap;
    stat: IStatistics;
    actions: ITurnAction[];
    mdlWeather: IWeatherModel;
    lstAvailablePolicies: IPolicy[];
    _turnID: number;
    _fund: number;
    _currentWindDirection: Direction;
    _beginDay: { month: number; day: number; };
}

class WorldDevelopmentModel implements IWithSaveData {
    public gameMap: GameMap;

    public constructor(public data: IWorldData) {
        this.gameMap = new GameMap(data.gameMap);
    }

    public nextTurn(): void {
        var history: IHistoryData = {
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
                case GameMapHexMenuActions.ApplyPolicy:
                    this.data.stat.counts.applys++;
                    break;
                case GameMapHexMenuActions.Build:
                    this.data.stat.counts.builds++;
                    break;
                case GameMapHexMenuActions.Destroy:
                    this.data.stat.counts.destorys++;
                    break;
                case GameMapHexMenuActions.Upgrade:
                    this.data.stat.counts.upgrades++;
                    break;
                case GameMapHexMenuActions.Exploit:
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
    }

    public static generateNew(_mapHeight: number, _mapWidth: number): WorldDevelopmentModel {
        var mapData: IGameMap = {
            map: [],
            _mapHeight: _mapHeight,
            _mapWidth: _mapWidth
        };
        var worldData: IWorldData = {
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
    }
}