/* ---------- Glyphs ---------- */

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

const ROOT_TO_STROKES_MAP: Record<string, number> = {
    "": Stroke.None,
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

const STROKES_TO_ROOT_MAP = getReversedDict(ROOT_TO_STROKES_MAP);

function generateAllGlyphs(): Glyph[] {
    const allVowels = [Vowel.Aglyph, Vowel.Iglyph, Vowel.Uglyph, Vowel.Short];
    const ret: Glyph[] = [];
    for (const vowel of allVowels) {
        for (const pattern of Object.values(ROOT_TO_STROKES_MAP)) {
            ret.push({
                strokePattern: pattern,
                vowel: vowel
            })
        }
    }
    return ret
}

function printGlyph(glyph: Glyph) {
    console.log(`${STROKES_TO_ROOT_MAP[glyph.strokePattern]}${glyph.vowel}`)
}

const ALL_GLYPHS: Glyph[] = generateAllGlyphs()

/* ---------- Parsing ---------- */

const ENDING_TO_VOWEL_MAP: Record<string, Vowel> = {
    "a": Vowel.Aglyph,
    "aa": Vowel.Aglyph,
    "i": Vowel.Iglyph,
    "ee": Vowel.Iglyph,
    "u": Vowel.Uglyph,
    "oo": Vowel.Uglyph,
};

function countOccurances(str: string, substr: string): number {
    const regExp = new RegExp(substr, "gi");
    return (str.match(regExp) || []).length;
}

function parseGlyphFromStr(s: string): Glyph | null {
    const validEndings = Object.keys(ENDING_TO_VOWEL_MAP);
    let vowel = Vowel.Short;
    for (const ending of validEndings) {
        if (s.endsWith(ending)) {
            vowel = ENDING_TO_VOWEL_MAP[ending] ?? Vowel.Short;
            s = s.replaceAll(ending, vowel);
            break;
        }
    }
    let root = s;
    if (vowel !== Vowel.Short) {
        if (countOccurances(s, vowel) > 1) {
            return null;
        }
        let vowelIdx = s.indexOf(vowel);
        root = s.substring(0, vowelIdx);
    }
    const validRoots = Object.keys(ROOT_TO_STROKES_MAP);
    const validVowels = Object.values(ENDING_TO_VOWEL_MAP);
    if (validRoots.includes(root) && (validVowels.includes(vowel) || vowel === "")) {
        const strokePattern = ROOT_TO_STROKES_MAP[root] ?? 0;
        return {
            strokePattern,
            vowel
        };
    } else {
        return null;
    }
}

/* ---------- Drawing ---------- */

interface LineSegment {
    x1: number;
    y1: number;
    x2: number,
    y2: number;
}

// The values within this table are offsets relative to the top-left corner of the bounding square.
const STROKE_TO_LINE_SEGMENT_TABLE: Record<Stroke, LineSegment> = {
    [Stroke.None]: { x1: 0, y1: 0, x2: 0, y2: 0 },
    [Stroke.Vertical]: { x1: 0.5, y1: 0, x2: 0.5, y2: 1.0 },
    [Stroke.VerticalOffsetLeft]: { x1: 0.3, y1: 0, x2: 0.3, y2: 1.0 },
    [Stroke.VerticalOffsetRight]: { x1: 0.7, y1: 0, x2: 0.7, y2: 1.0 },
    [Stroke.Horizontal]: { x1: 0, y1: 0.5, x2: 1.0, y2: 0.5 },
    [Stroke.HorizontalOffsetUp]: { x1: 0, y1: 0.3, x2: 1.0, y2: 0.3 },
    [Stroke.HorizontalOffsetDown]: { x1: 0, y1: 0.7, x2: 1.0, y2: 0.7 },
    [Stroke.DiagonalDown]: { x1: 0, y1: 0, x2: 1.0, y2: 1.0 },
    [Stroke.DiagonalUp]: { x1: 0, y1: 1.0, x2: 1.0, y2: 0 },
    [Stroke.DiagonalDownOffsetLeft]: { x1: 0, y1: 0, x2: 0.5, y2: 1.0 },
    [Stroke.DiagonalUpOffsetRight]: { x1: 0.5, y1: 1.0, x2: 1.0, y2: 0 },
    [Stroke.DiagonalUpRightHalf]: { x1: 0.5, y1: 0.5, x2: 1.0, y2: 0 },
    [Stroke.DiagonalDownRightHalf]: { x1: 0.5, y1: 0.5, x2: 1.0, y2: 1.0 }
}

function getVowelPath(glyph: Glyph, x: number, y: number, width: number): Path2D {
    const path = new Path2D();
    switch (glyph.vowel) {
        case Vowel.Aglyph: // Square
            path.rect(x, y, width, width);
            break;
        case Vowel.Iglyph: // Triangle
            const height = width * (Math.sqrt(3) / 2); // Comes from the Pythagorean theorem
            path.moveTo(x, y + width);
            // Draw a line from the bottom left to the center of the bounding square to form
            // one side of an equilateral triangle.
            path.lineTo(x + (width / 2), y + (width - height));
            path.lineTo(x + width, y + width);
            path.lineTo(x, y + width);
            break;
        case Vowel.Uglyph: // Circle
            path.arc(x + (width / 2), y + (width / 2), width / 2, 0, 2 * Math.PI);
            break;
        case Vowel.Short: // 45-degree Rotated Square
            path.moveTo(x, y + (width / 2));
            path.lineTo(x + (width / 2), y);
            path.lineTo(x + width, y + (width / 2));
            path.lineTo(x + (width / 2), y + width);
            path.closePath();
            break;
    }
    return path;
}

function drawStrokes(ctx: CanvasRenderingContext2D, glyph: Glyph, x: number, y: number, width: number) {
    ctx.beginPath();
    for (let i = 0; i <= MAX_BITFLAG_SHIFT; i++) {
        const flag = 1 << i;
        if ((glyph.strokePattern & flag) == flag) {
            const line = STROKE_TO_LINE_SEGMENT_TABLE[flag as Stroke];
            ctx.moveTo((line.x1 * width) + x, (line.y1 * width) + y);
            ctx.lineTo((line.x2 * width) + x, (line.y2 * width) + y);
        }
    }
    ctx.stroke();
}

function drawGlyph(ctx: CanvasRenderingContext2D, glyph: Glyph, x: number, y: number, width: number) {
    console.debug(glyph);
    const vowelPath = getVowelPath(glyph, x, y, width);
    ctx.stroke(vowelPath);
    ctx.save();
    ctx.clip(vowelPath);
    drawStrokes(ctx, glyph, x, y, width);
    ctx.restore();
}

function parseAndRenderGlyphFromUi(ctx: CanvasRenderingContext2D) {
    let canvas = ctx.canvas;
    console.log(`Canvas: ${canvas.width} x ${canvas.height}`);
    const inputElement = document.getElementById("glyph-input") as HTMLInputElement;
    const glyph = parseGlyphFromStr(inputElement.value.toLowerCase());
    if (glyph !== null) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const x = 10;
        const y = 10;
        const width = 50;
        drawGlyph(ctx, glyph, x, y, width);
    } else {
        alert("Invalid input");
    }
}

function addHandlers(ctx: CanvasRenderingContext2D) {
    const parseBtn = document.getElementById("parse-input-btn") as HTMLButtonElement;
    parseBtn.onclick = () => parseAndRenderGlyphFromUi(ctx);
    const glyphInputElement = document.getElementById("glyph-input") as HTMLInputElement;
    glyphInputElement.addEventListener("keydown", ev => {
        if (ev.key === "Enter") {
            parseAndRenderGlyphFromUi(ctx);
        }
    })
}

function start() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement
    if (canvas !== null) {
        const ctx = canvas.getContext("2d");
        if (ctx !== null) {
            addHandlers(ctx);
        }
    }
}

start();
