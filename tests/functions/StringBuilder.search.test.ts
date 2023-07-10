import {StringBuilder} from "../../StringBuilder"

describe("search: string", () => {
     test("find single char", () => {
         const sb = new StringBuilder("012345");

         expect(sb.search("0")).toBe(0);
         expect(sb.search("1")).toBe(1);
         expect(sb.search("4")).toBe(4);
         expect(sb.search("5")).toBe(5);
         expect(sb.search("9")).toBe(-1);
     });

    test("find empty query string returns -1", () => {
        const sb = new StringBuilder("012345");

        expect(sb.search("")).toBe(-1);
    });

    test("find empty StringBuffer returns -1", () => {
        const sb = new StringBuilder();

        expect(sb.search("")).toBe(-1);
        expect(sb.search("012345")).toBe(-1);
    });

    test("find multi-char string", () => {
        const sb = new StringBuilder("012345");

        expect(sb.search("234")).toBe(2);
        expect(sb.search("012345")).toBe(0);
        expect(sb.search("456")).toBe(-1);
        expect(sb.search("0123")).toBe(0);
        expect(sb.search("345")).toBe(3);
        expect(sb.search("45")).toBe(4);
    });

    test("startingAt, misses target", () => {
        const sb = new StringBuilder("012345");
        expect(sb.search("1", 2)).toBe(-1);
        expect(sb.search("0", 1)).toBe(-1);
        expect(sb.search("0", 4)).toBe(-1);
    });

    test("startingAt, reaches further occurrences", () => {
        const sb = new StringBuilder("012141");
        expect(sb.search("1", 0)).toBe(1);
        expect(sb.search("1", 2)).toBe(3);
        expect(sb.search("1", 4)).toBe(5);
    });

    test("startingAt, too high throws", () => {
        const sb = new StringBuilder("012345");
        expect(() => sb.search("3", 1000)).toThrow(RangeError);
    });
});

describe("search: regexp", () => {
    test("find single char", () => {
        const sb = new StringBuilder("012345");

        expect(sb.search(/0/)).toBe(0);
        expect(sb.search(/1/)).toBe(1);
        expect(sb.search(/4/)).toBe(4);
        expect(sb.search(/5/)).toBe(5);
        expect(sb.search(/9/)).toBe(-1);
    });

    test("find empty query string returns -1", () => {
        const sb = new StringBuilder("012345");

        expect(sb.search(/[]/)).toBe(-1);
    });

    test("find empty StringBuffer returns -1", () => {
        const sb = new StringBuilder();

        expect(sb.search(/[]/)).toBe(-1);
        expect(sb.search(/012345/)).toBe(-1);
    });

    test("find multi-char string", () => {
        const sb = new StringBuilder("012345");

        expect(sb.search(/234/)).toBe(2);
        expect(sb.search(/012345/)).toBe(0);
        expect(sb.search(/456/)).toBe(-1);
        expect(sb.search(/0123/)).toBe(0);
        expect(sb.search(/345/)).toBe(3);
        expect(sb.search(/45/)).toBe(4);
        expect(sb.search(/\d+/)).toBe(0);
        expect(sb.search(/\d$/)).toBe(5);
        expect(sb.search(/\d{3}$/)).toBe(3);
    });

    test("startingAt, misses target", () => {
        const sb = new StringBuilder("012345");
        expect(sb.search(/1/, 2)).toBe(-1);
        expect(sb.search(/0/, 1)).toBe(-1);
        expect(sb.search(/0/, 4)).toBe(-1);
    });

    test("startingAt, reaches further occurrences", () => {
        const sb = new StringBuilder("012141");
        expect(sb.search(/1/, 0)).toBe(1);
        expect(sb.search(/1/, 2)).toBe(3);
        expect(sb.search(/1/, 4)).toBe(5);
    });

    test("startingAt & end, too high idx throws", () => {
        const sb = new StringBuilder("012345");
        expect(() => sb.search(/1/, 1000)).toThrow(RangeError);
    });
});
