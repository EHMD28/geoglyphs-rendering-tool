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

function get_reversed_dict(dict: Record<string, number>): Record<number, string> {
    const ret: Record<number, string> = {};
    for (const [k, v] of Object.entries(dict)) {
        ret[v] = k;
    }
    return ret;
}

const STROKES_TO_CONSTANANT_DICT = get_reversed_dict(CONSTANANT_TO_STROKES_DICT);

function generate_all_glyphs(): Glyph[] {
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

function print_glyph(glyph: Glyph) {
    console.log(`${STROKES_TO_CONSTANANT_DICT[glyph.strokePattern]}${glyph.vowel}`)
}

const ALL_GLYPHS: Glyph[] = generate_all_glyphs()

for (const g of ALL_GLYPHS) {
    print_glyph(g)
}
