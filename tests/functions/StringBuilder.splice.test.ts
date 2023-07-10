import {StringBuilder} from "../../StringBuilder";

describe("splice tests", () => {
    test("remove none", () => {
        const str = "012345";
        const sb = new StringBuilder(str);
        sb.splice(1, 0);

        expect(sb.str()).toBe(str);
    });

    test("remove one", () => {
        const str = "012345";
        const sb = new StringBuilder(str);
        sb.splice(1, 1);

        expect(sb.str()).toBe("02345");
        expect(sb.length === str.length - 1);
    });

    test("remove all", () => {
        const str = "012345";
        const sb = new StringBuilder(str);
        sb.splice(0, sb.length);

        expect(sb.str()).toBe("");
        expect(sb.length).toBe(0);
    });

    test("remove more than available: ok", () => {
        const str = "012345";
        const sb = new StringBuilder(str);
        sb.splice(0, sb.length + 1);

        expect(sb.str()).toBe("");
        expect(sb.length).toBe(0);
    });

    test("add to start", () => {
        const str = "012345";
        const sb = new StringBuilder(str);
        sb.splice(0, 0, "abc");

        expect(sb.str()).toBe("abc" + str);
        expect(sb.length).toBe(str.length + 3);
    });

    test("add to middle", () => {
        const str = "012345";
        const sb = new StringBuilder(str);
        sb.splice(3, 0, "abc");

        expect(sb.str()).toBe("012abc345");
        expect(sb.length).toBe(str.length + 3);
    });

    test("add to end", () => {
        const str = "012345";
        const sb = new StringBuilder(str);
        sb.splice(sb.length, 0, "abc");

        expect(sb.str()).toBe(str + "abc");
        expect(sb.length).toBe(str.length + 3);
    });

    test("remove and add to start", () => {
         const str = "012345";
         const sb = new StringBuilder(str);
         sb.splice(0, 2, "ab");

         expect(sb.str()).toBe("ab2345");
    });

    test("remove and add to middle", () => {
        const str = "012345";
        const sb = new StringBuilder(str);
        sb.splice(2, 2, "ab");

        expect(sb.str()).toBe("01ab45");
    });

    test("edge-case: remove end", () => {
        const str = "012345";
        const sb = new StringBuilder(str);
        sb.splice(sb.length, 100);

        expect(sb.str()).toBe(str);
        expect(sb.length).toBe(str.length);
    });

    test("edge-case: remove end, add string", () => {
        const str = "012345";
        const sb = new StringBuilder(str);
        sb.splice(sb.length, 100, "6789");

        expect(sb.str()).toBe(str + "6789");
        expect(sb.length).toBe(str.length + 4);
    });
});
