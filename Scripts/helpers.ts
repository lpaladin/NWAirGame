// 用于TypeScript强制类型转换
var _$ = function (a: JQuery): IJQueryExt { return <IJQueryExt> a };
var _ = function (a) { return a };

var dummy = {};

interface IUniqueSet {
    [index: number]: boolean
}

enum Direction {
    None, Up, Right, Down, Left
}

declare var frame;
/*
 * 让地图平滑移动的控制器。
 */
class MapMovementController {
    private pressedDir: IUniqueSet;
    private timUpdateMap;
    private pressedCount: number;

    public constructor() { this.pressedDir = {}; this.pressedCount = 0; }
    public setDir(direction: Direction, pressed: boolean) {
        if (this.pressedDir[direction] == true && pressed == false) {
            this.pressedDir[direction] = false;
            if (--this.pressedCount == 0) {
                clearInterval(this.timUpdateMap);
                this.timUpdateMap = null;
            }
        } else if (!this.pressedDir[direction] && pressed == true) {
            this.pressedDir[direction] = true;
            if (this.pressedCount++ == 0) {
                this.timUpdateMap = setInterval(MapMovementController.moveMap, 30, this);
            }
        }
    }

    public static moveMap(curr: MapMovementController): void {
        var offset = ui.dMapInner.offset();
        if (curr.pressedDir[Direction.Up] == true)
            if (offset.top <= 0)
                TweenMax.to(ui.dMapInner, 0.1, { bottom: "-=25" });
            else
                curr.setDir(Direction.Up, false);
        if (curr.pressedDir[Direction.Down] == true)
            if (parseFloat(ui.dMapInner.css("bottom")) <= 0)
                TweenMax.to(ui.dMapInner, 0.1, { bottom: "+=25" });
            else
                curr.setDir(Direction.Down, false);
        if (curr.pressedDir[Direction.Left] == true)
            if (offset.left <= 0)
                TweenMax.to(ui.dMapInner, 0.1, { left: "+=25" });
            else
                curr.setDir(Direction.Left, false);
        if (curr.pressedDir[Direction.Right] == true)
            if (offset.left + ui.dMapInner.width() * parseFloat(ui.dMapInner.css("zoom")) >= ui.dMapOuter.width())
                TweenMax.to(ui.dMapInner, 0.1, { left: "-=25" });
            else
                curr.setDir(Direction.Right, false);
    }
}

var ui = {
    dGameMenu: <JQuery> null,
    dIntro: <JQuery> null,
    gameDisplay: <JQuery> null,
    lstMessages: <JQuery> null,
    lstLoadProgress: <JQuery> null,
    lstSaveProgress: <JQuery> null,
    mnuMainMenu: <JQuery> null,
    dlgModal: <JQuery> null,
    dCredits: <JQuery> null,
    dlgLoadProgress: <JQuery> null,
    dlgSaveProgress: <JQuery> null,
    dLoading: <JQuery> null,
    dGameMain: <JQuery> null,
    panPlayControl: <JQuery> null,
    dMapInner: <JQuery> null,
    dMapView: <JQuery> null,
    dMapOuter: <JQuery> null,
    dAnimMask: <JQuery> null,
    dStatusInfo: <JQuery> null,
    dlgMapSizeSelect: <JQuery> null,
    dlgActionModal: <JQuery> null,
    lstAction: <JQuery> null,
    sWindDirection: <JQuery> null,
    icoWindDirection: <JQuery> null,
    sTurnID: <JQuery> null,
    sDate: <JQuery> null,
    panTurnControl: <JQuery> null,
    lstTurnActions: <JQuery> null,
    btnCommitedActions: <JQuery> null,
    sGovernmentFund: <JQuery> null,
    sResidentAverageHealth: <JQuery> null,
    dlgStatistics: <JQuery> null,
    lstPolicy: <JQuery> null,
    tabStat: <JQuery> null,
    tabTrend: <JQuery> null
};

var colors = ["FFFFFF",
    "FF0000", "00FF00", "0000FF", "FFFF00", "FF00FF", "00FFFF", "000000",
    "800000", "008000", "000080", "808000", "800080", "008080", "808080",
    "C00000", "00C000", "0000C0", "C0C000", "C000C0", "00C0C0", "C0C0C0",
    "400000", "004000", "000040", "404000", "400040", "004040", "404040",
    "200000", "002000", "000020", "202000", "200020", "002020", "202020",
    "600000", "006000", "000060", "606000", "600060", "006060", "606060",
    "A00000", "00A000", "0000A0", "A0A000", "A000A0", "00A0A0", "A0A0A0",
    "E00000", "00E000", "0000E0", "E0E000", "E000E0", "00E0E0", "E0E0E0"];

// 辅助函数所在的静态类
class Helpers {
    public static keyCodes = {
        BACKSPACE: 8,
        TAB: 9,
        ENTER: 13,
        SHIFT: 16,
        CTRL: 17,
        ALT: 18,
        PAUSE: 19,
        CAPS_LOCK: 20,
        ESCAPE: 27,
        SPACE: 32,
        PAGE_UP: 33,
        PAGE_DOWN: 34,
        END: 35,
        HOME: 36,
        LEFT_ARROW: 37,
        UP_ARROW: 38,
        RIGHT_ARROW: 39,
        DOWN_ARROW: 40,
        INSERT: 45,
        DELETE: 46,
        KEY_0: 48,
        KEY_1: 49,
        KEY_2: 50,
        KEY_3: 51,
        KEY_4: 52,
        KEY_5: 53,
        KEY_6: 54,
        KEY_7: 55,
        KEY_8: 56,
        KEY_9: 57,
        KEY_A: 65,
        KEY_B: 66,
        KEY_C: 67,
        KEY_D: 68,
        KEY_E: 69,
        KEY_F: 70,
        KEY_G: 71,
        KEY_H: 72,
        KEY_I: 73,
        KEY_J: 74,
        KEY_K: 75,
        KEY_L: 76,
        KEY_M: 77,
        KEY_N: 78,
        KEY_O: 79,
        KEY_P: 80,
        KEY_Q: 81,
        KEY_R: 82,
        KEY_S: 83,
        KEY_T: 84,
        KEY_U: 85,
        KEY_V: 86,
        KEY_W: 87,
        KEY_X: 88,
        KEY_Y: 89,
        KEY_Z: 90,
        LEFT_META: 91,
        RIGHT_META: 92,
        SELECT: 93,
        NUMPAD_0: 96,
        NUMPAD_1: 97,
        NUMPAD_2: 98,
        NUMPAD_3: 99,
        NUMPAD_4: 100,
        NUMPAD_5: 101,
        NUMPAD_6: 102,
        NUMPAD_7: 103,
        NUMPAD_8: 104,
        NUMPAD_9: 105,
        MULTIPLY: 106,
        ADD: 107,
        SUBTRACT: 109,
        DECIMAL: 110,
        DIVIDE: 111,
        F1: 112,
        F2: 113,
        F3: 114,
        F4: 115,
        F5: 116,
        F6: 117,
        F7: 118,
        F8: 119,
        F9: 120,
        F10: 121,
        F11: 122,
        F12: 123,
        NUM_LOCK: 144,
        SCROLL_LOCK: 145,
        SEMICOLON: 186,
        EQUALS: 187,
        COMMA: 188,
        DASH: 189,
        PERIOD: 190,
        FORWARD_SLASH: 191,
        GRAVE_ACCENT: 192,
        OPEN_BRACKET: 219,
        BACK_SLASH: 220,
        CLOSE_BRACKET: 221,
        SINGLE_QUOTE: 222
    };

    public static shakeProperties(obj: Object, amplitude: number, additionalProperties?: Object): typeof obj {
        var result: Object = {};
        for (var key in obj) {
            var val: number = obj[key];
            result[key] = val + (Math.random() * amplitude * 2 - amplitude);
        }
        for (var key in additionalProperties)
            result[key] = additionalProperties[key];
        return result;
    }
    
    /* +---0 1 2 3 4 5                                +-------------
     * |0    ◇  ◇  ◇                               |    /x
     * 01  ◇◇◇◇◇◇                               |   /
     * 12  ◇◇◇◇◇◇   ====转换为三维冗余坐标===>  |  E
     * 23  ◇◇◇◇◇◇                               |  |\
     * 34  ◇◇◇◇◇◇                               | z| \y
     * 4   ◇  ◇  ◇                                 |
     */
    public static hexDistance(row1: number, col1: number, row2: number, col2: number): number {
        var z1 = Math.floor(col1 / 2) + row1, z2 = Math.floor(col2 / 2) + row2,
            xDelta = Math.abs(col2 - col1),
            yDelta = Math.abs(z2 - col2 - z1 + col1),
            zDelta = Math.abs(z2 - z1);
        return Math.max(xDelta, yDelta, zDelta);
    }

    public static normalize(array: number[]): number[]{
        var max = 0;
        for (var i = 0; i < array.length; i++)
            if (array[i] > max)
                max = array[i];
        if (max > 0)
            for (var i = 0; i < array.length; i++)
                array[i] /= max;
        return array;
    }

    public static loopThroughHexCircle(row: number, col: number, func: (row: number, col: number) => void, radius?: number): void {
        radius = typeof radius == "number" ? radius : 1;
        for (var x = col - radius - 1; x <= col + radius + 1; x++)
            for (var y = row - radius - 1; y <= row + radius + 1; y++)
                if (this.hexDistance(row, col, y, x) == radius)
                    func(y, x);
    }

    /*
     * @param upperBound 不包含该边界
     */
    public static randBetween(lowerBound: number, upperBound: number, integer: boolean, curvePower?: number) {
        var result = Math.pow(Math.random(), curvePower || 1) * (upperBound - lowerBound) + lowerBound;
        if (integer)
            return Math.floor(result);
        return result; 
    }

    public static dateToString(date: Date): string {
        var min: any = date.getMinutes(), sec: any = date.getSeconds();
        if (min < 10)
            min = "0" + min;
        if (sec < 10)
            sec = "0" + sec;
        return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
            date.getHours() + ":" + min + ":" + sec;
    }

    public static randInArray<T>(array: Array<T>): T {
        return array[Math.floor(array.length * Math.random())];
    }

    public static accumulate(array: number[], from: number, to: number): number {
        var result = 0;
        for (; from < to; from++)
            result += array[from];
        return result;
    }

    public static getParticlesAnimation(container: JQuery) {
        var particlesTimeline = new TimelineLite(),
            i = 150,
            radius = 900,
            dots = [],
            rawDots = [];

        while (--i > -1) {
            var dot = $(`<figure class="centered">·</figure>`);
            container.append(dot);
            var angle = Math.random() * Math.PI * 2,
                insertionTime = i * 0.015;

            particlesTimeline.from(dot, .2, { opacity: 0 }, insertionTime + 0.4);

            particlesTimeline.to(dot, 1.5, {
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
                width: 32,
                height: 32,
                ease: Cubic.easeIn
            }, insertionTime)
                .to(dot, 0.1, { opacity: 0 }, insertionTime + 1.4);

        }
        return particlesTimeline;
    }             
}

declare var Draggable: any;
 
// 使得元素可拖动
$.fn.makeDraggable = function (): IJQueryExt {
    return this.each(function () {
        var $this = $(this);
        if (_($this).draggable)
            return;
        var offset = null;
        $this.mousedown((e) => {
            if (e.target.tagName == "BUTTON")
                return;
            offset = {
                x: parseFloat($this.css("left")) - e.clientX,
                y: parseFloat($this.css("top")) - e.clientY
            };
        }).mousemove((e) => {
            if (offset)
                $this.css({
                    left: offset.x + e.clientX,
                    top: offset.y + e.clientY
                });
        }).mouseup((e) => offset = null);
        (_($this)).draggable = true;
    });
};

// 居中指定元素
$.fn.center = function (): IJQueryExt {
    return this.each(function () {
        var $this = $(this);
        $this.css({
            top: ($this.parent().height() - $this.height()) / 2,
            left: ($this.parent().width() - $this.width()) / 2
        });
    });
};

interface IJQueryExt extends JQuery {
    makeDraggable(): IJQueryExt;
    center(): IJQueryExt;
}

function ReloadCSS() {
    var css = (<HTMLLinkElement> $("#lnkAppCSS")[0]);
    css.href = css.href.replace(/\?.*|$/, "?" + Math.random());
}