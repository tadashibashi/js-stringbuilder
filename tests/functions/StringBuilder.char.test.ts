import {StringBuilder} from "../../StringBuilder";

describe("charAt", () => {
    test("index out-of-range", () => {
        const sb = new StringBuilder("012");

        expect(() => sb.charAt(3)).toThrow(RangeError);
        expect(() => sb.charAt(-4)).toThrow(RangeError);

        sb.str("");
        expect(() => sb.charAt(0)).toThrow(RangeError);
    });

    test("index in range", () => {
        const sb = new StringBuilder("012");

        expect(sb.charAt(0)).toBe("0");
        expect(sb.charAt(1)).toBe("1");
        expect(sb.charAt(2)).toBe("2");
    });

    test("negative index", () => {
        const sb = new StringBuilder("012");

        expect(sb.charAt(-3)).toBe("0");
        expect(sb.charAt(-2)).toBe("1");
        expect(sb.charAt(-1)).toBe("2");
    });

    test("when adding to prepend buffer, charAt returns correctly", () => {
        const sb = new StringBuilder();
        sb.prepend("2");
        sb.prepend("1");
        sb.prepend("0");

        expect(sb.charAt(0)).toBe("0");
        expect(sb.charAt(1)).toBe("1");
        expect(sb.charAt(2)).toBe("2");

        expect(sb.charAt(-3)).toBe("0");
        expect(sb.charAt(-2)).toBe("1");
        expect(sb.charAt(-1)).toBe("2");
    });

    test("when adding to prepend buffer & regular buffer, charAt returns correctly", () => {
        const sb = new StringBuilder();
        sb.prepend("2");
        sb.prepend("1");
        sb.prepend("0");

        sb.append("3");
        sb.append("4");
        sb.append("5");

        expect(sb.charAt(0)).toBe("0");
        expect(sb.charAt(1)).toBe("1");
        expect(sb.charAt(2)).toBe("2");

        expect(sb.charAt(-3)).toBe("3");
        expect(sb.charAt(-2)).toBe("4");
        expect(sb.charAt(-1)).toBe("5");
    });
});

describe("charCodeAt", () => {
    test("index out-of-range", () => {
        const sb = new StringBuilder("012");

        expect(() => sb.charCodeAt(3)).toThrow(RangeError);
        expect(() => sb.charCodeAt(-4)).toThrow(RangeError);

        sb.str("");
        expect(() => sb.charCodeAt(0)).toThrow(RangeError);
    });

    test("index in range", () => {
        const sb = new StringBuilder("012");

        expect(sb.charCodeAt(0)).toBe("0".charCodeAt(0));
        expect(sb.charCodeAt(1)).toBe("1".charCodeAt(0));
        expect(sb.charCodeAt(2)).toBe("2".charCodeAt(0));
    });

    test("negative index", () => {
        const sb = new StringBuilder("012");

        expect(sb.charCodeAt(-3)).toBe("0".charCodeAt(0));
        expect(sb.charCodeAt(-2)).toBe("1".charCodeAt(0));
        expect(sb.charCodeAt(-1)).toBe("2".charCodeAt(0));
    });

    test("when adding to prepend buffer, charCodeAt returns correctly", () => {
        const sb = new StringBuilder();
        sb.prepend("5");
        sb.prepend("3");
        sb.prepend("1");

        expect(sb.charCodeAt(0)).toBe("1".charCodeAt(0));
        expect(sb.charCodeAt(1)).toBe("3".charCodeAt(0));
        expect(sb.charCodeAt(2)).toBe("5".charCodeAt(0));

        expect(sb.charCodeAt(-3)).toBe("1".charCodeAt(0));
        expect(sb.charCodeAt(-2)).toBe("3".charCodeAt(0));
        expect(sb.charCodeAt(-1)).toBe("5".charCodeAt(0));
    });

    test("when adding to prepend buffer & regular buffer, charCodeAt returns correctly", () => {
        const sb = new StringBuilder();
        sb.prepend("2");
        sb.prepend("1");
        sb.prepend("0");

        sb.append("3");
        sb.append("4");
        sb.append("5");

        expect(sb.charCodeAt(0)).toBe("0".charCodeAt(0));
        expect(sb.charCodeAt(1)).toBe("1".charCodeAt(0));
        expect(sb.charCodeAt(2)).toBe("2".charCodeAt(0));

        expect(sb.charCodeAt(-3)).toBe("3".charCodeAt(0));
        expect(sb.charCodeAt(-2)).toBe("4".charCodeAt(0));
        expect(sb.charCodeAt(-1)).toBe("5".charCodeAt(0));
    });
});
