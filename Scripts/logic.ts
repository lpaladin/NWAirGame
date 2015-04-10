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
}

enum FacilityType {
    Natural, ResidentialArea, PowerPlant, GeneralFactory, Parkland, Mine
}

enum GameMapHexMenuActions {
    Build, Upgrade, ApplyPolicy, Exploit, Destroy
}

class GameMapHex implements IWithSaveData {
    data: IGameMapHex;

    public fnMouseEnter: (e) => void;
    public fnMouseLeave: (e) => void;
    public fnMouseUp: (e) => void;
    public static callContextMenu: (x: number, y: number) => void;
    public static setContextMenuEnabled: (type: GameMapHexMenuActions, to: boolean) => void;

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
            if (GameMapHex._selectedHex) {
                TweenMax.to(GameMapHex._selectedHex.elementRef, 0.1, { className: "-=active" });
                GameMapHex._selectedHex._selected = false;
            }
            // 修改菜单哪些项目允许点击
            GameMapHex.setContextMenuEnabled(GameMapHexMenuActions.Upgrade, false);

            TweenMax.to(this.elementRef, 0.1, { className: "+=active" });
            GameMapHex._selectedHex = this;
        } else {
            TweenMax.to(this.elementRef, 0.1, { className: "-=active" });
            GameMapHex._selectedHex = null;
        }
    }

    public constructor(data: IGameMapHex, private elementRef: JQuery, popup: JQuery) {
        this.data = data;

        for (var i = 0; i < this.data._cloudCount; i++)
            this.elementRef.append('<b class="glyphicon glyphicon-cloud"></b>');

        ui.dMapView.append(elementRef);
        this.fnMouseEnter = (e) => {
            TweenMax.to(elementRef.removeClass("blur"), 0.2, { className: "+=glow", z: 10 });
            TweenMax.fromTo(popup.css({
                left: e.clientX + 5,
                top: e.clientY - popup.height() + 5
            }).text(`第${this.data._col}列，第${this.data._row}行`).show(), 0.2, { scale: 0, opacity: 1 }, { scale: 1, ease: Back.easeOut });
        };
        this.fnMouseLeave = () => {
            TweenMax.to(elementRef, 0.2, { className: "-=glow", z: 0 });
            popup.hide();
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
    data: IGameMap;
    private map: GameMapHex[][];

    public get mapHeight(): number {
        return this.data._mapHeight;
    }
    public get mapWidth(): number {
        return this.data._mapWidth;
    }

    public constructor(data: IGameMap) {
        this.data = data;

        var popup = ui.dMapView.find("aside");
        this.map = [];
        for (var row = 0; row < this.data._mapHeight; row++) {
            this.map[row] = [];
        }
        ui.dMapInner.html("");
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
    <span><img src="/Images/Folder_256x256.png" /></span>
</figure>`
                    );
                this.map[row][col] = new GameMapHex(this.data.map[row][col], $ele, popup);
                $col.append($ele);
            }
            ui.dMapInner.append($col);
        }
    }

    public static fromParameters(_mapHeight: number, _mapWidth: number): GameMap {
        var data: IGameMap = {
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
    }
}

class GameLogicModel {

}