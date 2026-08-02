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
    DiagonalUpLeftHalf = 1 << 12,
    DiagonalDownLeftHalf = 1 << 13,
    ShorteningDash = 1 << 14,
    LengtheningDash = 1 << 15,
}

function getMaxBitflagShift(): number {
    // TODO: Remove hard-coded constant
    return 15;
}

const MAX_BITFLAG_SHIFT = getMaxBitflagShift();

enum Vowel {
    Aglyph = "a",
    ShortAglyph = "ah",
    LongAglyph = "ai",
    Iglyph = "ee",
    ShortIglyph = "eh",
    Uglyph = "oo",
    ShortUglyph = "oh",
    LongUglyph = "oa",
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
    "v": Stroke.Vertical | Stroke.DiagonalDownOffsetLeft | Stroke.DiagonalUpOffsetRight,
    "f": Stroke.Vertical | Stroke.DiagonalUpRightHalf | Stroke.DiagonalDownRightHalf,
    "g": Stroke.Vertical | Stroke.DiagonalUpLeftHalf | Stroke.DiagonalDownLeftHalf,
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
    "ai": Vowel.LongAglyph,
    "ah": Vowel.ShortAglyph,
    "i": Vowel.Iglyph,
    "ee": Vowel.Iglyph,
    "eh": Vowel.ShortIglyph,
    "u": Vowel.Uglyph,
    "oo": Vowel.Uglyph,
    "oh": Vowel.ShortUglyph,
    "oa": Vowel.LongUglyph
};

function countOccurances(str: string, substr: string): number {
    const regExp = new RegExp(substr, "gi");
    return (str.match(regExp) || []).length;
}

function parseGlyphFromStr(s: string): Glyph | null {
    if (s.trim() == "") return null;
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
    if (validRoots.includes(root) && (validVowels.includes(vowel) || vowel === Vowel.Short)) {
        let strokePattern = ROOT_TO_STROKES_MAP[root] ?? 0;
        switch (vowel) {
            case Vowel.ShortAglyph:
            case Vowel.ShortIglyph:
            case Vowel.ShortUglyph:
                strokePattern |= Stroke.ShorteningDash;
                break;
            case Vowel.LongAglyph:
            case Vowel.LongUglyph:
                strokePattern |= Stroke.LengtheningDash;
                break;
            default: break;
        }
        return {
            strokePattern,
            vowel
        };
    } else {
        return null;
    }
}

function parseGlyphsFromSentence(s: string): (Glyph | null)[][] {
    const ret: (Glyph | null)[][] = [];
    const words = s.split(" ");
    for (const word of words) {
        const glyphStrings = word.split("-");
        const glyphs = glyphStrings.map(g => parseGlyphFromStr(g));
        ret.push(glyphs);
    }
    return ret;
}

/* ---------- Glyph Rendering ---------- */

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
    [Stroke.DiagonalDownRightHalf]: { x1: 0.5, y1: 0.5, x2: 1.0, y2: 1.0 },
    [Stroke.DiagonalUpLeftHalf]: { x1: 0, y1: 0, x2: 0.5, y2: 0.5 },
    [Stroke.DiagonalDownLeftHalf]: { x1: 0, y1: 1.0, x2: 0.5, y2: 0.5 },
    [Stroke.ShorteningDash]: { x1: 0, y1: 1.2, x2: 1.0, y2: 1.2 },
    [Stroke.LengtheningDash]: { x1: 0, y1: -0.2, x2: 1.0, y2: -0.2 },
}

function getVowelPath(glyph: Glyph, x: number, y: number, width: number): Path2D {
    const path = new Path2D();
    switch (glyph.vowel) {
        case Vowel.ShortAglyph:
        case Vowel.LongAglyph:
        case Vowel.Aglyph: // Square
            path.rect(x, y, width, width);
            break;
        case Vowel.ShortIglyph:
        case Vowel.Iglyph: // Triangle
            const height = width * (Math.sqrt(3) / 2); // Comes from the Pythagorean theorem
            path.moveTo(x, y + width);
            // Draw a line from the bottom left to the center of the bounding square to form
            // one side of an equilateral triangle.
            path.lineTo(x + (width / 2), y + (width - height));
            path.lineTo(x + width, y + width);
            path.lineTo(x, y + width);
            break;
        case Vowel.ShortUglyph:
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

function drawInnerStrokes(ctx: CanvasRenderingContext2D, glyph: Glyph, x: number, y: number, width: number) {
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

function drawOuterStrokes(ctx: CanvasRenderingContext2D, glyph: Glyph, x: number, y: number, width: number) {
    let line = null;
    if (glyph.strokePattern & Stroke.ShorteningDash) {
        line = STROKE_TO_LINE_SEGMENT_TABLE[Stroke.ShorteningDash];
    } else if (glyph.strokePattern & Stroke.LengtheningDash) {
        line = STROKE_TO_LINE_SEGMENT_TABLE[Stroke.LengtheningDash];
    }
    if (line != null) {
        ctx.beginPath();
        ctx.moveTo((line.x1 * width) + x, (line.y1 * width) + y);
        ctx.lineTo((line.x2 * width) + x, (line.y2 * width) + y);
        ctx.stroke();
    }
}

function drawGlyph(ctx: CanvasRenderingContext2D, glyph: Glyph | null, x: number, y: number, width: number) {
    if (glyph !== null) {
        console.debug(`Draw ${JSON.stringify(glyph)} at (${x}, ${y}) of width ${width}`);
        const vowelPath = getVowelPath(glyph, x, y, width);
        ctx.stroke(vowelPath);
        ctx.save();
        ctx.clip(vowelPath);
        drawInnerStrokes(ctx, glyph, x, y, width);
        ctx.restore();
        drawOuterStrokes(ctx, glyph, x, y, width);
    } else {
        console.debug("Invalid glyph");
        ctx.save();
        ctx.strokeStyle = "red";
        const missingGlyph: Glyph = {
            strokePattern: Stroke.DiagonalUp | Stroke.DiagonalDown,
            vowel: Vowel.Short
        };
        drawInnerStrokes(ctx, missingGlyph, x, y, width);
        ctx.restore();
    }
}

interface GlyphSpacing {
    /** The width of each glyph. */
    charWidth: number;
    /** The width of the gap between characters in a word. */
    characterGap: number;
    /** The width of a whitespace character. */
    spaceWidth: number;
    /** The gap between rows of characters. */
    rowGap: number;
    /** The margin around the characters being rendered. */
    margin: number;
}

function drawGlyphsSentence(ctx: CanvasRenderingContext2D, glyphSentence: (Glyph | null)[][], config: AppConfig) {
    const spacing = config.glyphSpacing;
    let canvas = ctx.canvas;
    // Coordinates of the top-left corner of the currently drawn glyph.
    const initialOffset = canvas.width - (spacing.charWidth + spacing.margin);
    let x = initialOffset;
    let y = spacing.margin;
    // Draw each glyph on a single line.
    for (const word of glyphSentence) {
        if (x > spacing.margin) {
            for (let i = 0; i < word.length; i++) {
                const glyph = word[i];
                if (typeof glyph !== "undefined")
                    drawGlyph(ctx, glyph, x, y, spacing.charWidth);
                if (i != (word.length - 1)) // Only prepare to draw the next character when it isn't the last.
                    x -= (spacing.charWidth + spacing.characterGap);
            }
            x -= spacing.spaceWidth;
        } else {
            x = initialOffset;
            y += spacing.charWidth + spacing.rowGap;
        }
    }
}

/* ---------- Input Handling ---------- */

interface AppConfig {
    canvasWidth: number;
    canvasHeight: number;
    glyphSpacing: GlyphSpacing;
}

function getConfigFromUi(): AppConfig {
    const canvasWidthInput = document.getElementById("canvas-width-input") as HTMLInputElement;
    const canvasHeightInput = document.getElementById("canvas-height-input") as HTMLInputElement;
    const charWidthInput = document.getElementById("glyph-spacing-char-width-input") as HTMLInputElement;
    const charGapInput = document.getElementById("glyph-spacing-char-gap-input") as HTMLInputElement;
    const spaceWidthInput = document.getElementById("glyph-spacing-space-width-input") as HTMLInputElement;
    const rowGapInput = document.getElementById("glyph-spacing-row-gap-input") as HTMLInputElement;
    const marginInput = document.getElementById("glyph-spacing-margin-input") as HTMLInputElement;

    return {
        canvasWidth: Number(canvasWidthInput.value) ?? 0,
        canvasHeight: Number(canvasHeightInput.validationMessage) ?? 0,
        glyphSpacing: {
            charWidth: Number(charWidthInput.value) ?? 0,
            characterGap: Number(charGapInput.value) ?? 0,
            spaceWidth: Number(spaceWidthInput.value) ?? 0,
            rowGap: Number(rowGapInput.value) ?? 0,
            margin: Number(marginInput.value) ?? 0,
        }
    };
}

function parseAndRenderGlyphsFromUi(ctx: CanvasRenderingContext2D) {
    const canvas = ctx.canvas;
    console.log(`Canvas: ${canvas.width} x ${canvas.height}`);
    const inputElement = document.getElementById("glyph-input") as HTMLInputElement;
    const glyphs = parseGlyphsFromSentence(inputElement.value.toLowerCase());
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const config = getConfigFromUi();
    drawGlyphsSentence(ctx, glyphs, config);
}

function addHandlers(ctx: CanvasRenderingContext2D) {
    const parseBtn = document.getElementById("parse-input-btn") as HTMLButtonElement;
    parseBtn.onclick = () => parseAndRenderGlyphsFromUi(ctx);
    const glyphInputElement = document.getElementById("glyph-input") as HTMLInputElement;
    glyphInputElement.addEventListener("keydown", ev => {
        if (ev.key === "Enter") {
            parseAndRenderGlyphsFromUi(ctx);
        }
    })
    const saveImageBtn = document.getElementById("save-image-btn") as HTMLInputElement;
    saveImageBtn?.addEventListener("click", _ => {
        const link = document.createElement("a");
        link.setAttribute("download", "geoglyphs-image.png");
        const image = ctx.canvas.toDataURL("image/png")
        link.setAttribute("href", image);
        link.click();
    });
    const clearBtn = document.getElementById("clear-btn") as HTMLButtonElement;
    clearBtn.addEventListener("click", _ => ctx.reset());
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
