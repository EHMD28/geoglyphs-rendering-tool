enum Stroke {
    None = 0,
    /* Vertical Strokes */
    Vertical = 1 << 0,
    VerticalOffsetLeft = 1 << 1,
    VerticalOffsetRight = 1 << 2,
    /* Horizontal Strokes */
    Horizontal = 1 << 3,
    HorizontalOffsetUp = 1 << 4,
    HorizontalOffsetDown = 1 << 5,
    /* Diagonal Strokes */
    DiagonalDown = 1 << 6,
    DiagonalUp = 1 << 7,
    DiagonalDownOffsetLeft = 1 << 8,
    DiagonalUpOffsetRight = 1 << 9,
    DiagonalUpRightHalf = 1 << 10,
    DiagonalDownRightHalf = 1 << 11,
}

// TODO: Remove hard-coded constant
const MAX_BITFLAG_SHIFT = 11;

enum Vowel {
    Aglyph = "a",
    Iglyph = "ee",
    Uglyph = "oo",
    Short = "",
}

interface Glyph {
    // Bitflags control which strokes are rendered
    strokePattern: number;
    // Controls the shape containing the strokes
    vowel: Vowel;
}

const CONSTANANT_TO_STROKES_DICT = {
    "k": Stroke.Vertical,
    "z": Stroke.Horizontal,
    "m": Stroke.DiagonalUp,
    "n": Stroke.DiagonalDown,
    "d": Stroke.Vertical | Stroke.Horizontal,
    "l": Stroke.DiagonalUp | Stroke.DiagonalDown,
    "r": Stroke.Vertical | Stroke.DiagonalDown,
    "j": Stroke.Vertical | Stroke.DiagonalUp,
    "s": Stroke.Horizontal | Stroke.DiagonalDown,
    "t": Stroke.Horizontal | Stroke.DiagonalUp,
    "h": Stroke.VerticalOffsetLeft | Stroke.VerticalOffsetRight | Stroke.Horizontal,
    "b": Stroke.HorizontalOffsetUp | Stroke.HorizontalOffsetDown | Stroke.Vertical,
    "w": Stroke.Vertical | Stroke.DiagonalUp | Stroke.DiagonalDown,
    "v": Stroke.DiagonalDownOffsetLeft | Stroke.DiagonalUpOffsetRight,
    "f": Stroke.Vertical | Stroke.DiagonalUpRightHalf | Stroke.DiagonalDownRightHalf,
    "sh": Stroke.Vertical | Stroke.Horizontal | Stroke.DiagonalDown,
    "th": Stroke.Vertical | Stroke.Horizontal | Stroke.DiagonalUp,
    "ch": Stroke.Horizontal | Stroke.DiagonalUp | Stroke.DiagonalDown,
};

function getReversedDict(dict: Record<string, number>): Record<number, string> {
    const ret: Record<number, string> = {};
    for (const [k, v] of Object.entries(dict)) {
        ret[v] = k;
    }
    return ret;
}

const STROKES_TO_CONSTANANT_DICT = getReversedDict(CONSTANANT_TO_STROKES_DICT);

function generateAllGlyphs(): Glyph[] {
    const allVowels = [Vowel.Aglyph, Vowel.Iglyph, Vowel.Uglyph, Vowel.Short];
    const ret: Glyph[] = [];
    for (const vowel of allVowels) {
        for (const pattern of Object.values(CONSTANANT_TO_STROKES_DICT)) {
            ret.push({
                strokePattern: pattern,
                vowel: vowel
            })
        }
    }
    return ret
}

function printGlyph(glyph: Glyph) {
    console.log(`${STROKES_TO_CONSTANANT_DICT[glyph.strokePattern]}${glyph.vowel}`)
}

const ALL_GLYPHS: Glyph[] = generateAllGlyphs()

interface LineSegment {
    x1: number;
    y1: number;
    x2: number,
    y2: number;
}

const STROKE_TO_LINE_SEGMENT_TABLE: Record<Stroke, LineSegment> = {
    [Stroke.None]: { x1: 0, y1: 0, x2: 0, y2: 0 },
    [Stroke.Vertical]: { x1: 0.5, y1: 0, x2: 0.5, y2: 1.0 },
    [Stroke.VerticalOffsetLeft]: { x1: 0.3, y1: 0, x2: 0.3, y2: 1.0 },
    [Stroke.VerticalOffsetRight]: { x1: 0.7, y1: 0, x2: 0.7, y2: 1.0 },
    [Stroke.Horizontal]: { x1: 0, y1: 0.5, x2: 1.0, y2: 0.5 },
    [Stroke.HorizontalOffsetUp]: { x1: 0, y1: 0.3, x2: 1.0, y2: 0.7 },
    [Stroke.HorizontalOffsetDown]: { x1: 0, y1: 0.7, x2: 1.0, y2: 0.7 },
    [Stroke.DiagonalDown]: { x1: 0, y1: 0, x2: 1.0, y2: 1.0 },
    [Stroke.DiagonalUp]: { x1: 0, y1: 1.0, x2: 1.0, y2: 0 },
    [Stroke.DiagonalDownOffsetLeft]: { x1: 0, y1: 0, x2: 0.5, y2: 1.0 },
    [Stroke.DiagonalUpOffsetRight]: { x1: 0.5, y1: 1.0, x2: 1.0, y2: 0 },
    [Stroke.DiagonalUpRightHalf]: { x1: 0.5, y1: 0.5, x2: 1.0, y2: 0 },
    [Stroke.DiagonalDownRightHalf]: { x1: 0.5, y1: 0.5, x2: 1.0, y2: 1.0 }
}

function drawGlyph(ctx: CanvasRenderingContext2D, glyph: Glyph, x: number, y: number, width: number) {
    ctx.beginPath();
    ctx.rect(x, y, width, width);
    for (let i = 0; i < MAX_BITFLAG_SHIFT; i++) {
        const flag = 1 << i;
        if ((glyph.strokePattern & flag) == flag) {
            // console.log("Drawing line segment.")
            const line = STROKE_TO_LINE_SEGMENT_TABLE[flag as Stroke];
            ctx.moveTo((line.x1 * width) + x, (line.y1 * width) + y);
            ctx.lineTo((line.x2 * width) + x, (line.y2 * width) + y);
        }
    }
    ctx.stroke();
}

function draw(ctx: CanvasRenderingContext2D) {
    const glyph: Glyph = {
        strokePattern: Stroke.Horizontal | Stroke.Vertical | Stroke.DiagonalUp | Stroke.DiagonalDown,
        vowel: Vowel.Aglyph
    };
    const x = 10;
    const y = 10;
    const width = 50;
    drawGlyph(ctx, glyph, x, y, width);
}

function start() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement
    if (canvas !== null) {
        const ctx = canvas.getContext("2d");
        if (ctx !== null) {
            const fps = 30;
            setInterval(() => draw(ctx), 1000 / fps);
        }
    }
}

start();
