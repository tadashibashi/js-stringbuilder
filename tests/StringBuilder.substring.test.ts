import {StringBuilder} from "../StringBuilder";

describe("substring", () => {
    test("whole string", () => {
        const sb = new StringBuilder("0123");

        expect(sb.substring(0)).toBe("0123");
    });

    test("empty string throws", () => {
        const sb = new StringBuilder("");
        expect(() => sb.substring(0)).toThrow(RangeError);
    });

    test("out-of-range: end: throws", () => {
        const sb = new StringBuilder("");
    });

    test("mid section", () => {
        const sb = new StringBuilder("01234");
        expect(sb.substring(1, 3)).toBe("12");
        expect(sb.substring(2, 4)).toBe("23");
        expect(sb.substring(1, 4)).toBe("123");
        expect(sb.substring(2)).toBe("234");
    });
});
