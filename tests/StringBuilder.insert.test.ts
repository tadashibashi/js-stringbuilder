import {StringBuilder} from "../StringBuilder"

describe("insert tests", () => {
    test("index out-of-range", () => {
        const sb = new StringBuilder("0123");
        expect(() => sb.insert(5, "1")).toThrow(RangeError);
    });

    test("insert nothing", () => {
        const sb = new StringBuilder("01234");
        sb.insert(1, "");

        expect(sb.toString()).toBe("01234");
    });

    test("at start: single char", () => {
        const sb = new StringBuilder("01234");
        sb.insert(0, "a");

        expect(sb.toString()).toBe("a01234");
    });

    test("at start: multiple chars", () => {
        const sb = new StringBuilder("01234");
        sb.insert(0, "abcdef");

        expect(sb.toString()).toBe("abcdef01234");
    });

    test("at middle: single char", () => {
        const sb = new StringBuilder("01234");
        sb.insert(2, "a");

        expect(sb.toString()).toBe("01a234");
    });

    test("at middle: multiple chars", () => {
        const sb = new StringBuilder("01234");
        sb.insert(2, "abcdef");

        expect(sb.toString()).toBe("01abcdef234");
    });

    test("at end: single char", () => {
        const sb = new StringBuilder("01234");
        sb.insert(sb.length, "a");

        expect(sb.toString()).toBe("01234a");
    });

    test("at end: multiple chars", () => {
        const sb = new StringBuilder("01234");
        sb.insert(sb.length, "abcdef");

        expect(sb.toString()).toBe("01234abcdef");
    });

});


